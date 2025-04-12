import React from "react";
import { useLocation } from "wouter";
import { Home, Dumbbell, Trophy, Timer, BookOpen, BrainCircuit } from "lucide-react";
import { TabName } from "@/types";
import { useTab } from "@/context/TabContext";

interface TabNavigationProps {
  activeTab?: TabName;
  setActiveTab?: (tab: TabName) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = () => {
  const { activeTab, setActiveTab } = useTab();
  const [location] = useLocation();

  // Only show tab navigation on main dashboard routes
  if (location !== "/" && !location.startsWith("/#")) {
    return null;
  }

  const tabs: { name: TabName; label: string; icon: React.ReactNode }[] = [
    { name: "dashboard", label: "Home", icon: <Home className="h-5 w-5" /> },
    { name: "workout", label: "Treinos", icon: <Dumbbell className="h-5 w-5" /> },
    { name: "wod-generator", label: "WOD IA", icon: <BrainCircuit className="h-5 w-5" /> },
    { name: "prs", label: "PRs", icon: <Trophy className="h-5 w-5" /> },
    { name: "timer", label: "Timer", icon: <Timer className="h-5 w-5" /> },
    { name: "exercises", label: "Movimentos", icon: <BookOpen className="h-5 w-5" /> },
  ];

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
  };

  return (
    <nav className="bg-secondary border-t border-gray-800 fixed bottom-0 w-full z-10">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => handleTabChange(tab.name)}
            className={`flex flex-col items-center py-2 px-4 ${
              activeTab === tab.name ? "text-accent" : "text-gray-400"
            }`}
          >
            {tab.icon}
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default TabNavigation;
