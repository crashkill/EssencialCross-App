import React, { useState } from "react";
import { Link } from "wouter";
import TodayWorkout from "@/components/TodayWorkout";
import RecentPRs from "@/components/RecentPRs";
import WorkoutHistory from "@/components/WorkoutHistory";
import TimerControls from "@/components/TimerControls";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TimerSettings } from "@/types";

const Dashboard: React.FC = () => {
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    minutes: 5,
    seconds: 0,
    enableSound: true
  });

  const handleStartWorkout = () => {
    setTimerOpen(true);
  };

  return (
    <div className="px-4 py-4">
      <h1 className="font-semibold text-2xl mb-4">Dashboard</h1>
      
      <TodayWorkout onStartWorkout={handleStartWorkout} />
      <RecentPRs />
      <WorkoutHistory />

      {/* Timer Dialog */}
      <Dialog open={timerOpen} onOpenChange={setTimerOpen}>
        <DialogContent className="bg-primary border-0 text-white max-w-md">
          <TimerControls 
            timerType="Countdown"
            settings={timerSettings}
            onSettingsChange={setTimerSettings}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
