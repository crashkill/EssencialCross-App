import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/queryClient';
import { Calendar, ArrowLeft, Clock, CheckCircle, X, Trash2, ClipboardList } from 'lucide-react';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const resultFormSchema = z.object({
  result: z.string().min(1, { message: 'Digite o resultado do treino' }),
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

const GroupWorkouts = () => {
  const params = useParams<{ groupId: string }>();
  const groupId = parseInt(params.groupId);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedWorkout, setSelectedWorkout] = useState<ScheduledWorkout | null>(null);
  const [isWorkoutResultDialogOpen, setIsWorkoutResultDialogOpen] = useState(false);
  const [isResultsViewDialogOpen, setIsResultsViewDialogOpen] = useState(false);
  
  const isCoach = user?.role === 'coach' || user?.role === 'admin';
  
  // Formulário para registrar resultado
  const form = useForm<ResultFormData>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      result: '',
      notes: '',
    },
  });

  // Buscar informações do grupo
  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: ['/api/groups', groupId],
    enabled: !!groupId && !!user,
  });

  // Buscar workouts agendados para o grupo
  const { data: scheduledWorkouts, isLoading: isWorkoutsLoading } = useQuery({
    queryKey: ['/api/scheduled-workouts/group', groupId],
    enabled: !!groupId && !!user,
  });

  // Buscar resultados para o workout selecionado
  const { data: workoutResults, isLoading: isResultsLoading } = useQuery({
    queryKey: ['/api/workout-results/scheduled', selectedWorkout?.id],
    enabled: !!selectedWorkout && isResultsViewDialogOpen,
  });

  // Registrar resultado de treino
  const { mutate: submitResult, isPending: isSubmittingResult } = useMutation({
    mutationFn: async (data: ResultFormData) => {
      if (!selectedWorkout) return null;
      
      return apiRequest('/api/workout-results', {
        method: 'POST',
        body: JSON.stringify({
          scheduledWorkoutId: selectedWorkout.id,
          result: data.result,
          notes: data.notes || null,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Resultado registrado com sucesso',
        description: 'Seu resultado foi registrado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-results/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-results/scheduled', selectedWorkout?.id] });
      form.reset();
      setIsWorkoutResultDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar resultado',
        description: 'Ocorreu um erro ao registrar seu resultado. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Remover workout agendado
  const { mutate: deleteScheduledWorkout } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/scheduled-workouts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Treino removido com sucesso',
        description: 'O treino agendado foi removido com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-workouts/group', groupId] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover treino',
        description: 'Ocorreu um erro ao remover o treino agendado. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmitResult = (data: ResultFormData) => {
    submitResult(data);
  };

  const handleDeleteWorkout = (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este treino agendado? Esta ação não pode ser desfeita.')) {
      deleteScheduledWorkout(id);
    }
  };

  const handleBack = () => {
    setLocation('/groups');
  };

  // Filtrar workouts por data (futuros ou passados)
  const getFilteredWorkouts = () => {
    if (!scheduledWorkouts) return [];
    
    const now = new Date();
    
    return scheduledWorkouts.filter((workout: ScheduledWorkout) => {
      const workoutDate = new Date(workout.scheduledDate);
      if (activeTab === 'upcoming') {
        return workoutDate >= now;
      } else {
        return workoutDate < now;
      }
    }).sort((a: ScheduledWorkout, b: ScheduledWorkout) => {
      if (activeTab === 'upcoming') {
        // Próximos treinos em ordem crescente de data
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      } else {
        // Treinos passados em ordem decrescente de data
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      }
    });
  };

  // Formatar data e hora para exibição
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Verificar se um treino já tem resultado do usuário atual
  const hasUserResult = (workoutId: number) => {
    if (!workoutResults) return false;
    return workoutResults.some((result: WorkoutResult) => 
      result.scheduledWorkoutId === workoutId && result.userId === user?.id
    );
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

  const filteredWorkouts = getFilteredWorkouts();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Treinos do Grupo</h1>
          <p className="text-gray-500">Grupo: {group.name}</p>
        </div>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="upcoming">Próximos Treinos</TabsTrigger>
            <TabsTrigger value="past">Treinos Anteriores</TabsTrigger>
          </TabsList>
          
          {isCoach && group.coachId === user?.id && (
            <Button onClick={() => setLocation(`/schedule-workout/${groupId}`)}>
              <Calendar className="mr-2 h-4 w-4" /> Agendar Novo Treino
            </Button>
          )}
        </div>
        
        <TabsContent value="upcoming" className="space-y-4">
          {isWorkoutsLoading ? (
            <div className="flex justify-center items-center p-12">
              <p>Carregando treinos...</p>
            </div>
          ) : filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout: ScheduledWorkout) => (
              <Card key={workout.id} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Badge className="mr-2">{workout.workout.type}</Badge>
                      {workout.workout.description.slice(0, 60)}
                      {workout.workout.description.length > 60 ? '...' : ''}
                    </div>
                    {isCoach && group.coachId === user?.id && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteWorkout(workout.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" /> {formatDateTime(workout.scheduledDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line">
                    {workout.workout.description}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedWorkout(workout);
                      setIsResultsViewDialogOpen(true);
                    }}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" /> Ver Resultados
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setSelectedWorkout(workout);
                      setIsWorkoutResultDialogOpen(true);
                    }}
                    disabled={hasUserResult(workout.id)}
                  >
                    {hasUserResult(workout.id) ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" /> Resultado Registrado
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" /> Registrar Resultado
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Calendar className="h-16 w-16 mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">Nenhum treino agendado</h3>
              <p className="text-gray-500 mt-2">
                Não há treinos agendados para este grupo.
                {isCoach && group.coachId === user?.id && ' Clique em "Agendar Novo Treino" para criar um.'}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {isWorkoutsLoading ? (
            <div className="flex justify-center items-center p-12">
              <p>Carregando treinos...</p>
            </div>
          ) : filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout: ScheduledWorkout) => (
              <Card key={workout.id} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge className="mr-2">{workout.workout.type}</Badge>
                    {workout.workout.description.slice(0, 60)}
                    {workout.workout.description.length > 60 ? '...' : ''}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" /> {formatDateTime(workout.scheduledDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line">
                    {workout.workout.description}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedWorkout(workout);
                      setIsResultsViewDialogOpen(true);
                    }}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" /> Ver Resultados
                  </Button>
                  
                  {!hasUserResult(workout.id) && (
                    <Button 
                      onClick={() => {
                        setSelectedWorkout(workout);
                        setIsWorkoutResultDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Registrar Resultado
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Calendar className="h-16 w-16 mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">Nenhum treino anterior</h3>
              <p className="text-gray-500 mt-2">
                Não há registros de treinos anteriores para este grupo.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para registrar resultado */}
      <Dialog
        open={isWorkoutResultDialogOpen}
        onOpenChange={setIsWorkoutResultDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
            <DialogDescription>
              Registre seu resultado para o treino {selectedWorkout?.workout.type}.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitResult)} className="space-y-4">
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 10 rounds + 15 reps ou 120kg"
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
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre sua performance, dificuldades, etc."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsWorkoutResultDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingResult}>
                  {isSubmittingResult ? 'Salvando...' : 'Salvar Resultado'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar resultados */}
      <Dialog
        open={isResultsViewDialogOpen}
        onOpenChange={setIsResultsViewDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resultados do Treino</DialogTitle>
            <DialogDescription>
              {selectedWorkout?.workout.type}: {selectedWorkout?.workout.description.slice(0, 50)}
              {selectedWorkout?.workout.description && selectedWorkout?.workout.description.length > 50 ? '...' : ''} 
              - {selectedWorkout && formatDateTime(selectedWorkout.scheduledDate)}
            </DialogDescription>
          </DialogHeader>
          
          {isResultsLoading ? (
            <div className="flex justify-center items-center p-6">
              <p>Carregando resultados...</p>
            </div>
          ) : workoutResults && workoutResults.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workoutResults.map((result: WorkoutResult) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {result.user.name || result.user.username}
                      </TableCell>
                      <TableCell>{result.result}</TableCell>
                      <TableCell>{result.notes || '-'}</TableCell>
                      <TableCell>{formatDateTime(result.completedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <ClipboardList className="h-12 w-12 mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">Nenhum resultado registrado</h3>
              <p className="text-gray-500 mt-2">
                Ainda não há resultados registrados para este treino.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupWorkouts;