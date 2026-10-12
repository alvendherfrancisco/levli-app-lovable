import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import ShotCard from "@/components/brand/ShotCard";
import { SCREENSHOTS } from "@/lib/storeAssets";
import { downloadNodeAsPng } from "@/lib/downloadAsset";
import TodayMock from "@/components/brand/mocks/TodayMock";
import LogDoseMock from "@/components/brand/mocks/LogDoseMock";
import ShotsMock from "@/components/brand/mocks/ShotsMock";
import LevelsMock from "@/components/brand/mocks/LevelsMock";
import RotationMock from "@/components/brand/mocks/RotationMock";
import SymptomsMock from "@/components/brand/mocks/SymptomsMock";
import MedsMock from "@/components/brand/mocks/MedsMock";
import ReportMock from "@/components/brand/mocks/ReportMock";

const MOCKS = {
  today: TodayMock,
  "log-shot": LogDoseMock,
  history: ShotsMock,
  levels: LevelsMock,
  rotation: RotationMock,
  symptoms: SymptomsMock,
  medications: MedsMock,
  report: ReportMock,
};

/**
 * The eight App Store screenshots.
 *
 * On screen each one is shown small, but it is always composed at its true size
 * (see ShotCard). Choosing Download draws the card on a hidden copy at exactly
 * three times its size — Apple's 1290 × 2796 for a 6.9" iPhone — and saves the
 * PNG, so what the team submits is what this page shows.
 */
export default function ScreenshotGallery() {
  const [drawing, setDrawing] = useState(null);
  const [failed, setFailed] = useState("");
  const cardRef = useRef(null);

  useEffect(() => {
    if (!drawing) return undefined;
    let alive = true;

    const run = async () => {
      // One frame, so the hidden card is on screen before it is drawn.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      try {
        await downloadNodeAsPng(cardRef.current, {
          scale: 3,
          filename: `levli-appstore-${drawing.id}-1290x2796.png`,
        });
      } catch (err) {
        if (alive) setFailed(drawing.title);
      } finally {
        if (alive) setDrawing(null);
      }
    };

    run();
    return () => { alive = false; };
  }, [drawing]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SCREENSHOTS.map((shot) => {
          const Mock = MOCKS[shot.id];
          const busy = drawing?.id === shot.id;
          return (
            <div key={shot.id}>
              <div className="shot-preview mx-auto overflow-hidden rounded-xl">
                <div className="shot-preview__inner">
                  <ShotCard title={shot.title} subtitle={shot.subtitle}>
                    <Mock />
                  </ShotCard>
                </div>
              </div>
              <div className="mt-2 px-1">
                <p className="text-[13px] font-semibold">{shot.title}</p>
                <button
                  type="button"
                  onClick={() => { setFailed(""); setDrawing(shot); }}
                  disabled={!!drawing}
                  className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 disabled:opacity-50 dark:text-indigo-400"
                >
                  <Download size={13} />
                  {busy ? "Drawing…" : "Download 1290 × 2796"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {failed ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          Could not draw "{failed}". Try again, or take a screenshot at this size instead.
        </p>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">
        Each download is 1290 × 2796 — the 6.9" iPhone size Apple asks for, with no transparency. Screenshots can
        be reordered in App Store Connect; the first two are the ones most people see.
      </p>

      {/* The card being drawn: the same composition at its true size, off-screen. */}
      {drawing ? (
        <div className="shot-export" aria-hidden="true">
          <div ref={cardRef}>
            <ShotCard title={drawing.title} subtitle={drawing.subtitle}>
              {React.createElement(MOCKS[drawing.id])}
            </ShotCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}