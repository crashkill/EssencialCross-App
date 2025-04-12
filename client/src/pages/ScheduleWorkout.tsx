import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WorkoutType } from "@/types";
import { CalendarIcon, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  workoutId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  groupId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  scheduledDate: z.date(),
  description: z.string().min(10, {
    message: "A descrição deve ter pelo menos 10 caracteres.",
  }),
  type: z.string().min(1, {
    message: "Selecione um tipo de treino."
  })
});

type FormData = z.infer<typeof formSchema>;

interface Workout {
  id: number;
  userId: number;
  type: WorkoutType;
  description: string;
  date: string;
  result: string | null;
  completed: boolean | null;
}

const ScheduleWorkout: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createNewWorkout, setCreateNewWorkout] = useState(true);
  
  // Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workoutId: 0,
      groupId: parseInt(groupId),
      scheduledDate: new Date(),
      description: "",
      type: "AMRAP"
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

  const { data: workouts = [], isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['/api/workouts'],
    queryFn: async () => {
      const response = await fetch('/api/workouts');
      if (!response.ok) throw new Error('Falha ao carregar treinos');
      return response.json();
    }
  });

  // Mutations
  const scheduleMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Se estiver criando novo treino, cria primeiro o treino
      if (createNewWorkout) {
        // Criar o treino primeiro
        const workoutResponse = await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: data.type,
            description: data.description,
            date: format(data.scheduledDate, 'yyyy-MM-dd'),
            completed: false
          })
        });
        
        if (!workoutResponse.ok) {
          const error = await workoutResponse.json();
          throw new Error(error.message || 'Falha ao criar treino');
        }
        
        const workout = await workoutResponse.json();
        data.workoutId = workout.id;
      }
      
      // Agendar o treino para o grupo
      const response = await fetch('/api/scheduled-workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: data.workoutId,
          groupId: data.groupId,
          scheduledDate: format(data.scheduledDate, 'yyyy-MM-dd')
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao agendar treino');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-workouts'] });
      toast({
        title: "Treino agendado",
        description: "O treino foi agendado com sucesso para o grupo!"
      });
      navigate(`/group-workouts/${groupId}`);
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
  const onSubmit = (data: FormData) => {
    scheduleMutation.mutate(data);
  };

  const handleWorkoutSelect = (workoutId: string) => {
    if (workoutId === "new") {
      setCreateNewWorkout(true);
      form.setValue("description", "");
      form.setValue("type", "AMRAP");
    } else {
      setCreateNewWorkout(false);
      form.setValue("workoutId", parseInt(workoutId));
      
      const selectedWorkout = workouts.find((w: Workout) => w.id === parseInt(workoutId));
      if (selectedWorkout) {
        form.setValue("description", selectedWorkout.description);
        form.setValue("type", selectedWorkout.type);
      }
    }
  };

  // Efeitos
  useEffect(() => {
    if (group && !isLoadingGroup) {
      // Verificar se o usuário é coach deste grupo
      if (group.coachId !== user?.id && user?.role !== 'admin') {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para agendar treinos para este grupo.",
          variant: "destructive"
        });
        navigate("/groups");
      }
    }
  }, [group, isLoadingGroup, user, navigate, toast]);

  const workoutTypes = ["AMRAP", "EMOM", "For Time", "Tabata", "Strength", "Skill", "Other"];

  if (isLoadingGroup) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">Agendar Treino</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {group?.name} - Agende um treino para o grupo
          </p>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Detalhes do Treino</CardTitle>
          <CardDescription>
            Selecione um treino existente ou crie um novo para o grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Tipo de Agendamento</label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={createNewWorkout ? "default" : "outline"}
                onClick={() => handleWorkoutSelect("new")}
              >
                Criar Novo Treino
              </Button>
              <Select
                value={createNewWorkout ? "new" : form.getValues("workoutId").toString()}
                onValueChange={handleWorkoutSelect}
                disabled={isLoadingWorkouts}
              >
                <SelectTrigger className={`w-[250px] ${createNewWorkout ? 'opacity-50' : ''}`}>
                  <SelectValue placeholder="Selecionar treino existente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Criar novo treino</SelectItem>
                  {workouts.length > 0 && workouts.map((workout: Workout) => (
                    <SelectItem key={workout.id} value={workout.id.toString()}>
                      {workout.type} - {workout.description.substring(0, 20)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Data do Treino */}
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Treino</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos para novo treino */}
              {createNewWorkout && (
                <>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Treino</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de treino" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workoutTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição do Treino</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descreva o treino em detalhes (movimentos, repetições, tempos, etc.)"
                            rows={6}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Mostrar detalhes do treino selecionado */}
              {!createNewWorkout && form.getValues("workoutId") > 0 && (
                <div className="border rounded-md p-4 bg-secondary/30">
                  <h3 className="font-semibold mb-2">Detalhes do Treino Selecionado</h3>
                  
                  <div className="mb-2">
                    <span className="text-sm font-medium block">Tipo:</span>
                    <span>{form.getValues("type")}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium block">Descrição:</span>
                    <p className="whitespace-pre-wrap">{form.getValues("description")}</p>
                  </div>
                </div>
              )}
            
              <div className="flex justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/groups")}
                  className="mr-2"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={scheduleMutation.isPending}
                >
                  {scheduleMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                      Agendando...
                    </>
                  ) : "Agendar Treino"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleWorkout;