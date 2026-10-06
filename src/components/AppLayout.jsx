import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import BottomTabBar from "@/components/BottomTabBar";
import PageBackground from "@/components/PageBackground";
import { useMountProbe } from "@/lib/perfProbe";

export default function AppLayout() {
  // Counts mounts of the signed-in shell when the probe is on (?perf=1).
  useMountProbe("signed-in shell");
  const location = useLocation();
  const showGradient = location.pathname !== "/profile";
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 w-full relative flex">
      {/* Left nav rail on desktop */}
      <BottomTabBar />
      {/* Main content — on desktop, offset for the left rail */}
      <div className="flex-1 lg:ml-56 w-full min-w-0 relative min-h-screen bg-white dark:bg-gray-950">
        {showGradient && <PageBackground />}
        <div className="relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
}