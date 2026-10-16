import { getMedicationConfig } from "@/lib/medicationConfig";

/**
 * The expected GLP-1 weight-loss curves drawn on the Insights page.
 *
 * The numbers are the weekly grid of the team's "Weight-loss week 0 to 104"
 * spreadsheet (Evidence and mappings sheet, reviewed 12 October 2026), stored as
 * BASIS POINTS of the starting weight lost by that week — 50 is 0.5% — one value
 * per week from week 0. Nothing is smoothed or invented: the spreadsheet's own
 * weekly grid is what is stored, and reading a curve is a lookup.
 *
 * A curve ends at its own last week and is never extended past it, which is the
 * spreadsheet's own rule ("No extrapolation after the last anchor").
 *
 * Where each series comes from, as recorded in the spreadsheet:
 *   semaglutide_inj   semaglutide 2.4 mg weekly — approximate STEP 5 curve
 *                     (published week 52 = 15.6%, week 104 = 15.2%). The file
 *                     also links the generic "Semaglutide" scenario to it.
 *   semaglutide_oral  oral semaglutide 25 mg daily — approximate OASIS 4 curve,
 *                     through week 64 only.
 *   tirzepatide       tirzepatide titrated to 15 mg weekly — SURMOUNT-1
 *                     extension curve (week 104 = 21.5%). The file gives this
 *                     same series for Mounjaro, Zepbound and the generic
 *                     "Tirzepatide" scenario, and its general "Weight" column is
 *                     this series too, so it is also the fallback below.
 *   orforglipron      orforglipron at the highest trial dose — ATTAIN-1,
 *                     baseline to week 72.
 *
 * These are illustrative readings, not patient predictions — the card that draws
 * them says so.
 */
const BPS = 10000;

const SERIES = {
  semaglutide_inj: [
    0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 838, 875, 912,
    950, 981, 1013, 1044, 1075, 1106, 1138, 1169, 1200, 1219, 1238, 1256, 1275, 1294, 1312, 1331, 1350, 1369, 1388, 1406,
    1425, 1444, 1462, 1481, 1500, 1508, 1515, 1522, 1530, 1538, 1545, 1552, 1560, 1559, 1558, 1556, 1555, 1554, 1552, 1551,
    1550, 1549, 1549, 1548, 1547, 1547, 1546, 1545, 1545, 1544, 1543, 1542, 1542, 1541, 1540, 1540, 1539, 1538, 1538, 1537,
    1536, 1536, 1535, 1534, 1534, 1533, 1532, 1532, 1531, 1530, 1530, 1529, 1528, 1528, 1527, 1526, 1525, 1525, 1524, 1523,
    1523, 1522, 1521, 1521, 1520,
  ],
  semaglutide_oral: [
    0, 50, 100, 150, 200, 225, 250, 275, 300, 350, 400, 450, 500, 525, 550, 575, 600, 650, 700, 750,
    800, 825, 850, 875, 900, 925, 950, 975, 1000, 1025, 1050, 1075, 1100, 1125, 1150, 1175, 1200, 1212, 1225, 1238,
    1250, 1262, 1275, 1288, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1308, 1315, 1322,
    1330, 1338, 1345, 1352, 1360,
  ],
  tirzepatide: [
    0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950,
    1000, 1038, 1075, 1112, 1150, 1179, 1208, 1238, 1267, 1296, 1325, 1354, 1383, 1412, 1442, 1471, 1500, 1521, 1542, 1562,
    1583, 1604, 1625, 1646, 1667, 1687, 1708, 1729, 1750, 1762, 1775, 1788, 1800, 1812, 1825, 1838, 1850, 1862, 1875, 1888,
    1900, 1908, 1917, 1925, 1933, 1942, 1950, 1958, 1967, 1975, 1983, 1992, 2000, 2006, 2013, 2019, 2025, 2031, 2038, 2044,
    2050, 2056, 2062, 2069, 2075, 2081, 2088, 2094, 2100, 2103, 2106, 2109, 2112, 2116, 2119, 2122, 2125, 2128, 2131, 2134,
    2138, 2141, 2144, 2147, 2150,
  ],
  orforglipron: [
    0, 45, 90, 140, 160, 190, 210, 225, 240, 265, 300, 350, 390, 410, 430, 454, 479, 520, 565, 590,
    600, 610, 620, 630, 640, 650, 660, 670, 680, 690, 700, 710, 720, 730, 740, 750, 760, 770, 780, 790,
    800, 810, 820, 830, 840, 850, 860, 870, 880, 890, 900, 910, 920, 930, 940, 950, 960, 970, 980, 990,
    1000, 1010, 1020, 1030, 1040, 1050, 1060, 1070, 1080, 1090, 1100, 1110, 1120,
  ],
};

/**
 * The curve used for a product the spreadsheet holds no series of its own for.
 * The spreadsheet's general "Weight" column is the tirzepatide series, so that
 * is what those products are drawn against.
 */
export const GENERAL_SERIES = "tirzepatide";

/** The last week a series carries, or 0 when the key is unknown. */
export function seriesEndWeek(key) {
  const series = SERIES[key];
  return series ? series.length - 1 : 0;
}

/**
 * The fraction of the starting weight lost by `week` on this curve, between 0
 * and 1. Between two weeks the two values are read straight off the curve (the
 * spreadsheet's own linear rule); past the curve's last week it stops there.
 */
export function lossFraction(key, week) {
  const series = SERIES[key];
  if (!series || !Number.isFinite(week) || week <= 0) return 0;
  const last = series.length - 1;
  if (week >= last) return series[last] / BPS;
  const i = Math.floor(week);
  const a = series[i] ?? 0;
  const b = series[i + 1] ?? a;
  return (a + (b - a) * (week - i)) / BPS;
}

/**
 * The curve a logged product is drawn against: its own series where the
 * spreadsheet holds one, otherwise the general curve.
 *
 * `route` is the route of the logged dose, so a product sold as both a pen and
 * a tablet is matched to the right series. The spreadsheet gives no series for
 * the oral diabetes products (Rybelsus, Ozempic tablets) or for the products
 * outside its list (Trulicity, Victoza, Saxenda, the peptides, "Others"), so
 * those take the general curve.
 */
export function seriesKeyForMedication(name, route) {
  const entry = getMedicationConfig(name);
  const id = entry?.id;
  const oral = route ? route !== "subcutaneous" : entry?.route === "oral_tablet";
  if (id === "wegovy") return oral ? "semaglutide_oral" : "semaglutide_inj";
  if (id === "ozempic") return oral ? GENERAL_SERIES : "semaglutide_inj";
  if (id === "mounjaro" || id === "zepbound" || id === "compounded_tirzepatide") return "tirzepatide";
  if (id === "compounded_semaglutide") return "semaglutide_inj";
  if (id === "foundayo") return "orforglipron";
  return GENERAL_SERIES;
}