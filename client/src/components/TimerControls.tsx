import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TimerType, TimerSettings } from "@/types";
import { Switch } from "@/components/ui/switch";

interface TimerControlsProps {
  timerType: TimerType;
  settings: TimerSettings;
  onSettingsChange: (settings: TimerSettings) => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  timerType,
  settings,
  onSettingsChange,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [display, setDisplay] = useState("00:00");
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    
    // Set initial time based on timer type and settings
    if (timerType === "Countdown" || timerType === "AMRAP") {
      setTimeLeft(settings.minutes * 60 + settings.seconds);
    } else if (timerType === "EMOM") {
      setTimeLeft(60); // Start with a 1-minute interval
    } else if (timerType === "Tabata") {
      setTimeLeft(settings.workTime || 20); // Default work time is 20 seconds
    }
    
    // Update display
    updateDisplay();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerType, settings]);

  useEffect(() => {
    updateDisplay();
  }, [timeLeft]);

  const updateDisplay = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    setDisplay(
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    );
  };

  const playSound = () => {
    if (settings.enableSound && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Failed to play sound", e));
    }
  };

  const handleStartStop = () => {
    if (isRunning) {
      // Stop the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start the timer
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            playSound();
            
            // Handle different timer behaviors when reaching zero
            if (timerType === "Countdown" || timerType === "Stopwatch") {
              clearInterval(intervalRef.current!);
              setIsRunning(false);
              return 0;
            } else if (timerType === "EMOM") {
              setRound((r) => r + 1);
              return 60; // Reset to 1 minute
            } else if (timerType === "Tabata") {
              // Toggle between work and rest
              const isWorkPeriod = prev === settings.workTime;
              if (isWorkPeriod) {
                return settings.restTime || 10; // Rest time (default 10s)
              } else {
                setRound((r) => r + 1);
                if (r >= (settings.rounds || 8)) {
                  // End after completing all rounds
                  clearInterval(intervalRef.current!);
                  setIsRunning(false);
                  return 0;
                }
                return settings.workTime || 20; // Work time (default 20s)
              }
            } else if (timerType === "AMRAP") {
              clearInterval(intervalRef.current!);
              setIsRunning(false);
              return 0;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsRunning(false);
    setRound(1);
    
    // Reset based on timer type
    if (timerType === "Countdown" || timerType === "AMRAP") {
      setTimeLeft(settings.minutes * 60 + settings.seconds);
    } else if (timerType === "EMOM") {
      setTimeLeft(60);
    } else if (timerType === "Tabata") {
      setTimeLeft(settings.workTime || 20);
    } else {
      setTimeLeft(0);
    }
    
    updateDisplay();
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(0, Math.min(60, parseInt(e.target.value) || 0));
    onSettingsChange({
      ...settings,
      minutes: newValue
    });
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
    onSettingsChange({
      ...settings,
      seconds: newValue
    });
  };

  const handleSoundToggle = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      enableSound: checked
    });
  };

  return (
    <>
      <Card className="flex flex-col items-center justify-center py-8 mb-6">
        <span className="timer-display font-mono" id="timer-display">
          {display}
        </span>
        <div className="text-sm text-gray-400 mb-8">
          {timerType} Timer {timerType !== "Countdown" && `• Round ${round}`}
        </div>
        
        {/* Timer Controls */}
        <div className="flex space-x-4">
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={handleReset}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            className={`bg-accent hover:bg-accent/90 w-16 h-16 rounded-full`}
            onClick={handleStartStop}
          >
            {isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full"
            disabled={true}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </Card>
      
      {/* Timer Settings */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <h2 className="font-semibold text-lg mb-4">Configurações</h2>
          
          <div className="mb-4">
            <label className="block text-gray-400 mb-1 text-sm">Tempo (minutos : segundos)</label>
            <div className="flex space-x-2">
              <div className="flex">
                <Button
                  variant="outline"
                  className="rounded-r-none"
                  onClick={() => {
                    const newValue = Math.max(0, settings.minutes - 1);
                    onSettingsChange({ ...settings, minutes: newValue });
                  }}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={settings.minutes}
                  onChange={handleMinutesChange}
                  className="w-16 rounded-none text-center bg-gray-700 border-x-0"
                  min="0"
                  max="60"
                />
                <Button
                  variant="outline"
                  className="rounded-l-none"
                  onClick={() => {
                    const newValue = Math.min(60, settings.minutes + 1);
                    onSettingsChange({ ...settings, minutes: newValue });
                  }}
                >
                  +
                </Button>
              </div>
              
              <span className="flex items-center">:</span>
              
              <div className="flex">
                <Button
                  variant="outline"
                  className="rounded-r-none"
                  onClick={() => {
                    const newValue = Math.max(0, settings.seconds - 5);
                    onSettingsChange({ ...settings, seconds: newValue });
                  }}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={settings.seconds}
                  onChange={handleSecondsChange}
                  className="w-16 rounded-none text-center bg-gray-700 border-x-0"
                  min="0"
                  max="59"
                  step="5"
                />
                <Button
                  variant="outline"
                  className="rounded-l-none"
                  onClick={() => {
                    const newValue = Math.min(59, settings.seconds + 5);
                    onSettingsChange({ ...settings, seconds: newValue });
                  }}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <label htmlFor="sound-toggle" className="text-white mr-2">
                Som de alerta
              </label>
            </div>
            <Switch
              id="sound-toggle"
              checked={settings.enableSound}
              onCheckedChange={handleSoundToggle}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TimerControls;
