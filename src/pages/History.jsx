import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, ChevronLeft, ChevronRight, Info, Wind } from "lucide-react";
import { HEADER_ICON, HEADER_GLYPH } from "@/components/longlist/HeaderIconButton";
import PageContainer from "@/components/PageContainer";
import Fab from "@/components/Fab";
import ShotCard from "@/components/shots/ShotCard";
import MetricsGrid from "@/components/home/MetricsGrid";
import AddShotModal from "@/components/modals/AddShotModal";
import SideEffectsModal from "@/components/modals/SideEffectsModal";
import { useAppState } from "@/lib/AppState";
import { parseShotDate, toDayKey, todayKey, formatDayKeyShort } from "@/lib/dateUtils";
import { logWords } from "@/lib/medicationForm";
import { isActiveMedication } from "@/lib/medicationLink";
import useDoseColors from "@/hooks/useDoseColors";

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function History() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [showShot, setShowShot] = useState(false);
  const [showSideEffects, setShowSideEffects] = useState(false);
  const [editingShot, setEditingShot] = useState(null);
  // The day a new log is opened for: the day in hand on this page.
  const [shotDayKey, setShotDayKey] = useState(null);
  const { shots, medications, getSideEffects, adverseEventsByDay } = useAppState();
  // Calendar dots carry the dose's own colour, in the theme in use.
  const { color: doseColor } = useDoseColors();
  // This screen speaks of doses for a product taken by mouth and of shots for an
  // injected one, following the medication in hand (src/lib/medicationForm.js).
  const focusMed = medications.find(isActiveMedication) || null;
  const words = logWords(focusMed?.medication_name || shots[0]?.medication, {
    route: focusMed?.route || shots[0]?.route || "",
    shots,
  });
  const addLabel = words.one === "dose" ? "Log dose" : "Add shot";

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

  // Navigate to a given month/year, auto-selecting a valid day so the
  // content sections below the calendar never disappear on month change.
  const goToMonth = (newMonth, newYear) => {
    const daysInNewMonth = new Date(newYear, newMonth + 1, 0).getDate();
    const isCurrentMonthNew = newMonth === today.getMonth() && newYear === today.getFullYear();
    const maxDay = isCurrentMonthNew ? today.getDate() : daysInNewMonth;
    const prev = selectedDay || 1;
    const newDay = Math.min(prev, maxDay);
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(newDay);
  };

  const prevMonth = () => {
    if (month === 0) goToMonth(11, year - 1);
    else goToMonth(month - 1, year);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return; // can't navigate past the current month
    if (month === 11) goToMonth(0, year + 1);
    else goToMonth(month + 1, year);
  };

  // Build map of days → shots for this month/year
  const shotDayMap = {};
  shots.forEach((s) => {
    const d = parseShotDate(s.date);
    if (!d) return;
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!shotDayMap[day]) shotDayMap[day] = [];
      shotDayMap[day].push(s);
    }
  });

  const selectedDayKey = selectedDay
    ? toDayKey(new Date(year, month, selectedDay))
    : null;
  const selectedShots = selectedDay ? (shotDayMap[selectedDay] || []) : [];
  // On any day but today the button says which day it is for, so a dose is never
  // logged against the wrong date by mistake. Today's own button is unchanged.
  const todayDayKey = todayKey();
  const fabLabel = !selectedDayKey || selectedDayKey === todayDayKey
    ? addLabel
    : `${addLabel} · ${formatDayKeyShort(selectedDayKey)}`;
  const sideEffects = selectedDayKey ? getSideEffects(selectedDayKey) : "";
  const dayAdverseEvents = selectedDayKey ? (adverseEventsByDay[selectedDayKey] || []) : [];

  // The button below logs for the day selected in the calendar, so a past dose
  // is entered against the day it was actually taken.
  const openEdit = (shot) => { setEditingShot(shot); setShowShot(true); };
  const openNew = () => { setEditingShot(null); setShotDayKey(selectedDayKey); setShowShot(true); };

  return (
    <PageContainer bottomInset="fab">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 w-full flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>
        <Link to="/settings" aria-label="Settings" className={HEADER_ICON}>
          <Settings size={HEADER_GLYPH} aria-hidden="true" />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto pt-4">
        {/* Calendar */}
        <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth}><ChevronLeft size={22} className="text-indigo-500" /></button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{monthNames[month]} {year}</h2>
            <button onClick={nextMonth} disabled={isCurrentMonth} aria-label="Next month">
              <ChevronRight size={22} className={isCurrentMonth ? "text-gray-300 dark:text-gray-700" : "text-indigo-500"} />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <span key={d} className="text-xs font-medium text-indigo-500">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayShot = shotDayMap[day]?.[0];
              const dotColor = dayShot ? doseColor(dayShot.medication, dayShot.dose) : null;
              const isSelected = day === selectedDay;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isFuture = isCurrentMonth && day > today.getDate();
              return (
              <button key={day} onClick={() => !isFuture && setSelectedDay(day)} disabled={isFuture}
                className={`w-10 h-10 justify-self-center rounded-full text-sm font-medium relative flex items-center justify-center ${
                  isFuture ? "text-gray-300 dark:text-gray-700 cursor-not-allowed" :
                  isSelected ? "border-[1.5px] border-indigo-500 text-indigo-600 dark:bg-indigo-500/10" : isToday ? "text-indigo-600" : "text-gray-700 dark:text-gray-300"
                }`}>
                  {day}
                  {dayShot && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px 2px ${dotColor}80` }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day shots — the day's own log sits directly under the
            calendar, above the trackers it belongs to. */}
        {selectedDay && selectedShots.length > 0 && (
          <div className="px-4 mb-4 space-y-2">
            {selectedShots.map((s) => (
              <button key={s.id} onClick={() => openEdit(s)} className="w-full text-left">
                <ShotCard {...s} drugClass={s.drug_class} />
              </button>
            ))}
          </div>
        )}
        {selectedDay && selectedShots.length === 0 && (
          <div className="px-4 mb-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-800 text-gray-400 dark:text-[#9A9DAE] text-sm">
              No {words.many} logged for this day
            </div>
          </div>
        )}

        {/* Selected day metrics */}
        {selectedDayKey && <MetricsGrid dayKey={selectedDayKey} />}

        {/* Side Effects for selected day */}
        {selectedDayKey && (
          <button onClick={() => setShowSideEffects(true)}
            className="relative overflow-hidden mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 w-[calc(100%-2rem)] text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"rgba(99,102,241,0.13)"}}>
                <Wind size={16} className="text-indigo-500 dark:text-indigo-400" />
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Side effects</span>
            </div>
            {sideEffects || dayAdverseEvents.length > 0 ? (
              <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 border border-transparent dark:border-indigo-500/15">
                {dayAdverseEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {dayAdverseEvents.map((e) => (
                      <span key={e.id} className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full px-2 py-0.5 border border-indigo-500/20">
                        {e.symptom} <span className="opacity-60">({e.severity})</span>
                      </span>
                    ))}
                  </div>
                )}
                {sideEffects && <p className="text-sm text-gray-700 dark:text-[#E8E9F0]">{sideEffects}</p>}
              </div>
            ) : (
              <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 flex items-center gap-2 border border-transparent dark:border-indigo-500/15">
                <Info size={16} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <p className="text-sm text-indigo-700 dark:text-indigo-300">Tap to add side effects for this day.</p>
              </div>
            )}
          </button>
        )}

      </div>

      <Fab onClick={openNew} label={fabLabel} icon={null} />

      <AddShotModal open={showShot} onClose={() => { setShowShot(false); setEditingShot(null); }} editingShot={editingShot} initialDate={shotDayKey} />
      {selectedDayKey && (
        <SideEffectsModal open={showSideEffects} onClose={() => setShowSideEffects(false)} dayKey={selectedDayKey} />
      )}
    </PageContainer>
  );
}