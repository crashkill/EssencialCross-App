import React, { useEffect } from "react";
import { useTab } from "@/context/TabContext";
import { useLocation } from "wouter";
import Dashboard from "@/pages/Dashboard";
import Workout from "@/pages/Workout";
import PRs from "@/pages/PRs";
import Timer from "@/pages/Timer";
import Exercises from "@/pages/Exercises";
import WodGenerator from "@/pages/WodGenerator";
import { TabName } from "@/types";

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab } = useTab();
  const [location] = useLocation();

  // Sync URL params with tab state
  useEffect(() => {
    // If there's a tab parameter in the URL, set the active tab accordingly
    if (location.includes("?tab=")) {
      const tabParam = location.split("?tab=")[1] as TabName;
      if (tabParam && tabParam !== activeTab) {
        setActiveTab(tabParam);
      }
    }
  }, [location, setActiveTab, activeTab]);

  return (
    <main className="flex-1 overflow-y-auto pb-16">
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "workout" && <Workout />}
      {activeTab === "prs" && <PRs />}
      {activeTab === "timer" && <Timer />}
      {activeTab === "exercises" && <Exercises />}
      {activeTab === "wod-generator" && <WodGenerator />}
    </main>
  );
};

export default MainContent;
