import React, { useState } from "react";
import TimerControls from "@/components/TimerControls";
import { Button } from "@/components/ui/button";
import { TimerSettings, TimerType } from "@/types";

const Timer: React.FC = () => {
  const [activeTimer, setActiveTimer] = useState<TimerType>("Countdown");
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    minutes: 5,
    seconds: 0,
    enableSound: true,
    // EMOM settings
    rounds: 10,
    // Tabata settings
    workTime: 20,
    restTime: 10,
  });

  const timerTypes: TimerType[] = [
    "Countdown",
    "Stopwatch",
    "EMOM",
    "Tabata",
    "AMRAP",
  ];

  return (
    <div className="px-4 py-4 pb-20">
      <h1 className="font-semibold text-2xl mb-4">Timer</h1>
      
      <div className="flex overflow-x-auto space-x-2 pb-2 mb-6">
        {timerTypes.map((type) => (
          <Button
            key={type}
            variant={activeTimer === type ? "default" : "outline"}
            className={`whitespace-nowrap ${
              activeTimer === type ? "bg-accent hover:bg-accent/90" : ""
            }`}
            onClick={() => setActiveTimer(type)}
          >
            {type}
          </Button>
        ))}
      </div>
      
      <TimerControls
        timerType={activeTimer}
        settings={timerSettings}
        onSettingsChange={setTimerSettings}
      />
    </div>
  );
};

export default Timer;
