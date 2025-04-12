import React, { createContext, useContext, useState, useEffect } from "react";
import { TabName } from "@/types";
import { useLocation } from "wouter";

interface TabContextType {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabName>("dashboard");
  const [, navigate] = useLocation();

  // Navigate to the correct tab when it changes
  useEffect(() => {
    // This keeps the URL in sync with the tab
    if (activeTab !== "dashboard") {
      navigate(`/?tab=${activeTab}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [activeTab, navigate]);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const context = useContext(TabContext);
  
  if (context === undefined) {
    throw new Error("useTab must be used within a TabProvider");
  }
  
  return context;
};
