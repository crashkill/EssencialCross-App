import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/queryClient';
import { Calendar, ArrowLeft, CheckCircle } from 'lucide-react';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  workoutId: z.string().min(1, { message: 'Selecione um treino' }),
  scheduledDate: z.string().min(1, { message: 'Selecione uma data e hora' }),
});

type FormData = z.infer<typeof formSchema>;

interface Workout {
  id: number;
  type: string;
  description: string;
  date: Date;
  result: string | null;
  completed: boolean | null;
  userId: number;
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  coachId: number;
  createdAt: Date;
}

const ScheduleWorkout = () => {
  const params = useParams<{ groupId: string }>();
  const groupId = parseInt(params.groupId);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Formulário para agendar workout
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workoutId: '',
      scheduledDate: getDefaultDateTime(),
    },
  });

  // Função para obter a data e hora padrão (próxima hora cheia)
  function getDefaultDateTime() {
    const now = new Date();
    const nextHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() + 1,
      0, // minutos
      0 // segundos
    );
    
    // Formato YYYY-MM-DDThh:mm necessário para o input datetime-local
    return nextHour.toISOString().slice(0, 16);
  }

  // Buscar informações do grupo
  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: ['/api/groups', groupId],
    enabled: !!groupId && !!user,
  });

  // Buscar workouts criados pelo coach
  const { data: workouts, isLoading: isWorkoutsLoading } = useQuery({
    queryKey: ['/api/workouts'],
    enabled: !!user,
  });

  // Agendar workout
  const { mutate: scheduleWorkout, isPending: isScheduling } = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest('/api/scheduled-workouts', {
        method: 'POST',
        body: JSON.stringify({
          workoutId: data.workoutId,
          groupId: groupId,
          scheduledDate: data.scheduledDate,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Treino agendado com sucesso',
        description: 'O treino foi agendado para o grupo com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-workouts/group', groupId] });
      form.reset({
        workoutId: '',
        scheduledDate: getDefaultDateTime(),
      });
      setLocation(`/group-workouts/${groupId}`);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao agendar treino',
        description: 'Ocorreu um erro ao agendar o treino. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    scheduleWorkout(data);
  };

  const handleBack = () => {
    setLocation('/groups/coach');
  };

  if (isGroupLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center p-12">
          <p>Carregando informações do grupo...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className="text-lg font-semibold">Grupo não encontrado</h3>
          <p className="text-gray-500 mt-2">
            Não foi possível encontrar o grupo solicitado.
          </p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Grupos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Agendar Treino</h1>
          <p className="text-gray-500">Grupo: {group.name}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" /> 
              Agendar Treino para o Grupo
            </CardTitle>
            <CardDescription>
              Selecione um treino e uma data para agendá-lo para todos os membros do grupo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="workoutId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecione um Treino</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um treino" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isWorkoutsLoading ? (
                            <SelectItem value="loading" disabled>
                              Carregando treinos...
                            </SelectItem>
                          ) : workouts && workouts.length > 0 ? (
                            workouts.map((workout: Workout) => (
                              <SelectItem 
                                key={workout.id}
                                value={workout.id.toString()}
                              >
                                {workout.type}: {workout.description.slice(0, 50)}
                                {workout.description.length > 50 ? '...' : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Nenhum treino disponível
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Hora do Treino</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isScheduling}
                >
                  {isScheduling ? 'Agendando...' : 'Agendar Treino'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleWorkout;