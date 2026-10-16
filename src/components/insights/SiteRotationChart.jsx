import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { parseShotDate } from "@/lib/dateUtils";
import useDoseColors from "@/hooks/useDoseColors";
import InsightEmptyState from "@/components/insights/InsightEmptyState";
import { FOOTNOTE } from "@/components/insights/insightUi";

const SITE_COLORS = [
  "#6366F1", "#14B8A6", "#F59E0B", "#3B82F6", "#EC4899",
  "#8B5CF6", "#10B981", "#F43F5E", "#06B6D4", "#A855F7",
];

export default function SiteRotationChart({ shots, range }) {
  const days = parseInt(range, 10);
  // Each chip's dot carries the dose's own colour, in the theme in use.
  const { color: doseColor, isDark } = useDoseColors();
  // The site labels down the side, kept legible on both surfaces.
  const axisFill = isDark ? "#B4B8C7" : "#9CA3AF";

  const siteData = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const counts = {};
    shots.forEach((s) => {
      if (!s.site) return;
      const sd = parseShotDate(s.date);
      if (!sd) return;
      const daysSince = Math.round((now - sd) / 86400000);
      if (daysSince > days || daysSince < 0) return;
      counts[s.site] = (counts[s.site] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([site, count]) => ({ site, count }))
      .sort((a, b) => b.count - a.count);
  }, [shots, days]);

  const rotation = useMemo(() => shots.filter((s) => s.site).slice(0, 8), [shots]);

  if (siteData.length === 0) {
    return (
      <InsightEmptyState message="No injection sites logged yet." />
    );
  }

  return (
    <div>
      <div className="h-56 site-rotation-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={siteData} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="site" width={150} tick={{ fontSize: 10, fill: axisFill }} stroke={axisFill} />
            <Tooltip
              formatter={(v) => [`${v} shots`, "Uses"]}
              contentStyle={{ background: "rgba(20,22,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#E8E9F0", padding: "8px 12px" }}
              itemStyle={{ color: "#E8E9F0", background: "transparent" }}
              labelStyle={{ color: "#E8E9F0", background: "transparent" }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18} background={{ fill: "rgba(150,150,150,0.12)" }}>
              {siteData.map((_, i) => (
                <Cell key={i} fill={SITE_COLORS[i % SITE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3">
        <p className={`mb-2 ${FOOTNOTE}`}>Recent rotation (newest first)</p>
        <div className="flex flex-wrap gap-2">
          {rotation.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/[0.05] rounded-lg px-2 py-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: doseColor(s.medication, s.dose) }} />
              <span className="text-xs text-gray-600 dark:text-gray-300">{s.site}</span>
              <span className="text-xs text-gray-500 dark:text-[#9A9DAE]">{s.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}