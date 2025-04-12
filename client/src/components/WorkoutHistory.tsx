import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Workout } from "@/types";

const WorkoutHistory: React.FC = () => {
  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts/recent"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center mb-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Histórico Recente</h2>
          <Link href="/workout?tab=history">
            <span className="text-accent text-sm cursor-pointer">Ver Todos</span>
          </Link>
        </div>
        
        {workouts && workouts.length > 0 ? (
          <>
            {workouts.map((workout) => {
              const formattedDate = format(new Date(workout.date), "dd MMMM, yyyy");
              
              return (
                <div key={workout.id} className="bg-gray-800 rounded-lg p-3 mb-3 last:mb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge variant="outline" className="bg-gray-700 text-white mr-2">
                        {workout.type}
                      </Badge>
                      <span className="text-sm text-gray-400">{formattedDate}</span>
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
                  <p className="text-sm text-gray-200 line-clamp-2 whitespace-pre-line">
                    {workout.description}
                  </p>
                  {workout.result && (
                    <div className="mt-2 text-sm">
                      <span className="font-mono">Tempo: {workout.result}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <p className="text-gray-400">
            Você ainda não registrou nenhum treino.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkoutHistory;
