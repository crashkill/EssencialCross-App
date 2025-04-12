import React, { useState } from "react";
import { useSearch } from "wouter/use-browser-location";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workout as WorkoutType } from "@/types";
import WorkoutForm from "@/components/WorkoutForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TimerControls from "@/components/TimerControls";

const Workout: React.FC = () => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialTab = params.get("tab") || "log";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerSettings, setTimerSettings] = useState({
    minutes: 5,
    seconds: 0,
    enableSound: true
  });
  
  const { data: workouts, isLoading } = useQuery<WorkoutType[]>({
    queryKey: ["/api/workouts"],
  });
  
  const filteredWorkouts = workouts
    ? workouts.filter((workout) => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
          workout.type.toLowerCase().includes(query) ||
          workout.description.toLowerCase().includes(query) ||
          (workout.result && workout.result.toLowerCase().includes(query))
        );
      })
    : [];
  
  const handleOpenTimer = () => {
    setTimerOpen(true);
  };

  return (
    <div className="px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-semibold text-2xl">Treinos</h1>
        <Button
          size="icon"
          className="rounded-full bg-accent hover:bg-accent/90"
          onClick={() => setActiveTab("log")}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 mb-4 bg-gray-800">
          <TabsTrigger value="log">Registro</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="log">
          <WorkoutForm onOpenTimer={handleOpenTimer} />
        </TabsContent>
        
        <TabsContent value="history">
          <div className="mb-4">
            <Input
              type="search"
              placeholder="Pesquisar no histórico..."
              className="bg-gray-800 border-gray-700 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-400">Carregando treinos...</p>
            </div>
          ) : filteredWorkouts.length > 0 ? (
            <div className="space-y-3">
              {filteredWorkouts.map((workout) => (
                <Card key={workout.id} className="bg-gray-800">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Badge variant="outline" className="bg-gray-700 text-white mr-2">
                          {workout.type}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {format(new Date(workout.date), "dd MMM, yyyy")}
                        </span>
                      </div>
                      <Badge 
                        variant={workout.completed ? "success" : "warning"}
                        className={`${
                          workout.completed 
                            ? "bg-success text-white" 
                            : "bg-warning text-black"
                        }`}
                      >
                        {workout.completed ? "Completado" : "Parcial"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-200 whitespace-pre-line">
                      {workout.description}
                    </p>
                    {workout.result && (
                      <div className="mt-2 text-sm">
                        <span className="font-mono">Resultado: {workout.result}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Nenhum treino encontrado.</p>
              <Button
                className="mt-4 bg-accent hover:bg-accent/90"
                onClick={() => setActiveTab("log")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar Treino
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="text-center py-8">
            <p className="text-gray-400">Em breve! Templates de treinos ficarão disponíveis aqui.</p>
          </div>
        </TabsContent>
      </Tabs>
      
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

export default Workout;
