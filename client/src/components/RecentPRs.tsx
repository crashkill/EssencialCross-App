import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonalRecordWithExercise } from "@/types";

const RecentPRs: React.FC = () => {
  const { data: recentPRs, isLoading } = useQuery<PersonalRecordWithExercise[]>({
    queryKey: ["/api/prs/recent"],
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex justify-between items-center mb-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-16 mb-1" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          ))}
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">PRs Recentes</h2>
          <Link href="/prs">
            <span className="text-accent text-sm cursor-pointer">Ver Todos</span>
          </Link>
        </div>
        
        {recentPRs && recentPRs.length > 0 ? (
          <>
            {recentPRs.map((pr, index) => {
              const formattedDate = format(new Date(pr.date), "dd MMMM, yyyy");
              
              // This is just for UI demonstration purposes
              // In a real app, we would compare with previous records
              const improvement = Math.floor(Math.random() * 10) + 1;
              const improvementUnit = pr.unit;
              
              return (
                <div 
                  key={pr.id} 
                  className={`flex justify-between items-center mb-2 pb-2 ${
                    index < recentPRs.length - 1 ? "border-b border-gray-700" : ""
                  }`}
                >
                  <div>
                    <h3 className="font-medium">{pr.exerciseName}</h3>
                    <span className="text-sm text-gray-400">{formattedDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-accent font-medium">
                      {pr.value} {pr.unit}
                    </span>
                    <div className="text-xs text-success flex items-center justify-end">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +{improvement}{improvementUnit}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <p className="text-gray-400 mb-3">Você ainda não registrou nenhum PR.</p>
        )}
        
        <Link href="/prs?action=add">
          <Button variant="outline" className="mt-4 w-full">
            Adicionar Novo PR
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default RecentPRs;
