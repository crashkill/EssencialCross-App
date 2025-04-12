import React from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Play, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Workout, WorkoutType } from "@/types";

interface TodayWorkoutProps {
  onStartWorkout: () => void;
}

const TodayWorkout: React.FC<TodayWorkoutProps> = ({ onStartWorkout }) => {
  const today = format(new Date(), "yyyy-MM-dd");
  
  const { data: workouts, isLoading } = useQuery({
    queryKey: ["/api/workouts"],
    select: (data: Workout[]) => {
      return data.filter((workout) => {
        const workoutDate = workout.date.split("T")[0];
        return workoutDate === today;
      });
    }
  });

  const todayWorkout = workouts?.length ? workouts[0] : null;
  const formattedDate = format(new Date(), "dd MMMM, yyyy");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center mb-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Treino de Hoje</h2>
          <span className="text-sm text-gray-400">{formattedDate}</span>
        </div>
        
        {todayWorkout ? (
          <div id="today-workout">
            <div className="mb-3">
              <Badge variant="secondary" className="bg-accent text-white">
                {todayWorkout.type}
              </Badge>
            </div>
            <div className="text-gray-200 whitespace-pre-line">
              {todayWorkout.description}
            </div>
            <div className="mt-4 flex justify-between">
              <Button onClick={onStartWorkout} className="bg-accent hover:bg-accent/90">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Treino
              </Button>
              <Link href={`/workout/edit/${todayWorkout.id}`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div id="no-workout">
            <p className="text-gray-400 mb-3">Nenhum treino programado para hoje.</p>
            <Link href="/workout?tab=log">
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Treino
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayWorkout;
