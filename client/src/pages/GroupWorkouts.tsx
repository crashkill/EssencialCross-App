import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isAfter, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Award, Clock, Timer, ClipboardCheck } from "lucide-react";

const resultFormSchema = z.object({
  result: z.string().min(1, {
    message: "O resultado é obrigatório",
  }),
  notes: z.string().optional(),
});

type ResultFormData = z.infer<typeof resultFormSchema>;

interface ScheduledWorkout {
  id: number;
  workoutId: number;
  groupId: number;
  scheduledDate: string;
  createdBy: number;
  createdAt: string;
  workout: {
    id: number;
    type: string;
    description: string;
    userId: number;
    date: string;
    result: string | null;
    completed: boolean | null;
  };
}

interface WorkoutResult {
  id: number;
  userId: number;
  scheduledWorkoutId: number;
  result: string;
  notes: string | null;
  completedAt: string;
  user: {
    id: number;
    username: string;
    name: string | null;
    email: string | null;
    role: string;
  };
}

const GroupWorkouts: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  // Use o queryClient importado, não declare novamente
  // const queryClient = useQueryClient();
  const [selectedWorkout, setSelectedWorkout] = useState<ScheduledWorkout | null>(null);
  const [showResultForm, setShowResultForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upcoming");

  // Form
  const form = useForm<ResultFormData>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      result: "",
      notes: ""
    }
  });

  // Queries
  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['/api/groups', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) throw new Error('Falha ao carregar o grupo');
      return response.json();
    }
  });

  const { data: scheduledWorkouts = [], isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['/api/scheduled-workouts/group', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/scheduled-workouts/group/${groupId}`);
      if (!response.ok) throw new Error('Falha ao carregar treinos agendados');
      return response.json();
    }
  });

  const { data: workoutResults = [], isLoading: isLoadingResults } = useQuery({
    queryKey: ['/api/workout-results/scheduled', selectedWorkout?.id],
    queryFn: async () => {
      if (!selectedWorkout) return [];
      const response = await fetch(`/api/workout-results/scheduled/${selectedWorkout.id}`);
      if (!response.ok) throw new Error('Falha ao carregar resultados');
      return response.json();
    },
    enabled: !!selectedWorkout
  });

  // Mutations
  const addResultMutation = useMutation({
    mutationFn: async (data: ResultFormData) => {
      if (!selectedWorkout) throw new Error('Nenhum treino selecionado');
      
      return apiRequest('/api/workout-results', 'POST', {
        scheduledWorkoutId: selectedWorkout.id,
        result: data.result,
        notes: data.notes || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-results/scheduled', selectedWorkout?.id] });
      toast({
        title: "Resultado registrado",
        description: "Seu resultado foi registrado com sucesso!"
      });
      setShowResultForm(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteScheduledWorkoutMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/scheduled-workouts/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-workouts/group', groupId] });
      toast({
        title: "Treino removido",
        description: "O treino agendado foi removido com sucesso!"
      });
      setSelectedWorkout(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handlers
  const onSubmitResult = (data: ResultFormData) => {
    addResultMutation.mutate(data);
  };

  const handleShowResultForm = (workout: ScheduledWorkout) => {
    setSelectedWorkout(workout);
    setShowResultForm(true);
    form.reset();
  };

  const handleViewResults = (workout: ScheduledWorkout) => {
    setSelectedWorkout(workout);
  };

  const handleDeleteWorkout = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este treino agendado? Esta ação não pode ser desfeita.")) {
      deleteScheduledWorkoutMutation.mutate(id);
    }
  };

  // Filtros para treinos agendados
  const getUpcomingWorkouts = () => {
    return scheduledWorkouts.filter((workout: ScheduledWorkout) => {
      const date = parseISO(workout.scheduledDate);
      return isAfter(date, new Date()) || isToday(date);
    }).sort((a: ScheduledWorkout, b: ScheduledWorkout) => {
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  };

  const getPastWorkouts = () => {
    return scheduledWorkouts.filter((workout: ScheduledWorkout) => {
      const date = parseISO(workout.scheduledDate);
      return isBefore(date, new Date()) && !isToday(date);
    }).sort((a: ScheduledWorkout, b: ScheduledWorkout) => {
      return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
    });
  };

  const hasUserCompletedWorkout = (scheduledWorkoutId: number) => {
    return workoutResults.some((result: WorkoutResult) => 
      result.scheduledWorkoutId === scheduledWorkoutId && result.userId === user?.id
    );
  };

  const isCoachOrAdmin = () => {
    if (!group) return false;
    return group.coachId === user?.id || user?.role === 'admin';
  };

  if (isLoadingGroup) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
      </div>
    );
  }

  const upcomingWorkouts = getUpcomingWorkouts();
  const pastWorkouts = getPastWorkouts();

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/groups")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Treinos em Grupo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {group?.name} - Treinos agendados
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            <Calendar className="h-4 w-4 mr-2" />
            Próximos Treinos
          </TabsTrigger>
          <TabsTrigger value="past">
            <Clock className="h-4 w-4 mr-2" />
            Treinos Passados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isLoadingWorkouts ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
          ) : upcomingWorkouts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há treinos agendados para os próximos dias.</p>
                {isCoachOrAdmin() && (
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate(`/schedule-workout/${groupId}`)}
                  >
                    Agendar Treino
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {upcomingWorkouts.map((workout: ScheduledWorkout) => (
                <Card key={workout.id} className="overflow-hidden">
                  <CardHeader className="bg-secondary/50 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {workout.workout.type}
                        </Badge>
                        <CardTitle className="text-lg">
                          {format(parseISO(workout.scheduledDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </CardTitle>
                        <CardDescription>
                          {isToday(parseISO(workout.scheduledDate)) ? "Hoje" : ""}
                        </CardDescription>
                      </div>
                      {isCoachOrAdmin() && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteWorkout(workout.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="whitespace-pre-wrap mb-4">
                      {workout.workout.description}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(workout)}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Resultados
                    </Button>
                    
                    {hasUserCompletedWorkout(workout.id) ? (
                      <Badge variant="outline" className="px-3 py-1">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Concluído
                      </Badge>
                    ) : (
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleShowResultForm(workout)}
                      >
                        <Timer className="h-4 w-4 mr-2" />
                        Registrar Resultado
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {isLoadingWorkouts ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
          ) : pastWorkouts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há registros de treinos anteriores.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {pastWorkouts.map((workout: ScheduledWorkout) => (
                <Card key={workout.id} className="overflow-hidden">
                  <CardHeader className="bg-secondary/50 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {workout.workout.type}
                        </Badge>
                        <CardTitle className="text-lg">
                          {format(parseISO(workout.scheduledDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="whitespace-pre-wrap mb-4">
                      {workout.workout.description}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(workout)}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Resultados
                    </Button>
                    
                    {!hasUserCompletedWorkout(workout.id) && (
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleShowResultForm(workout)}
                      >
                        <Timer className="h-4 w-4 mr-2" />
                        Registrar Resultado
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para registrar resultado */}
      <Dialog open={showResultForm} onOpenChange={setShowResultForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
            <DialogDescription>
              Informe seu resultado para o treino do dia {selectedWorkout && format(parseISO(selectedWorkout.scheduledDate), "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitResult)} className="space-y-6">
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 12 rounds + 10 reps, 5:32 minutos, 100kg..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações sobre o treino (opcional)"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResultForm(false)}
                  className="mr-2"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={addResultMutation.isPending}
                >
                  {addResultMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                      Registrando...
                    </>
                  ) : "Registrar Resultado"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar resultados */}
      <Dialog
        open={!!selectedWorkout && !showResultForm}
        onOpenChange={(open) => !open && setSelectedWorkout(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resultados do Treino</DialogTitle>
            <DialogDescription>
              {selectedWorkout && (
                <div className="mt-2">
                  <p>
                    {format(parseISO(selectedWorkout.scheduledDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {selectedWorkout.workout.type}
                  </Badge>
                  <p className="mt-2 font-medium">Descrição:</p>
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedWorkout.workout.description}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoadingResults ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-accent rounded-full border-t-transparent"></div>
              </div>
            ) : workoutResults.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Ainda não há resultados registrados para este treino.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workoutResults.map((result: WorkoutResult) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        {result.user.name || result.user.username}
                        {result.userId === user?.id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Você
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{result.result}</TableCell>
                      <TableCell>{result.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupWorkouts;