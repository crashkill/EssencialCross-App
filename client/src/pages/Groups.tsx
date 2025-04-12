import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useRoute } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/queryClient';
import { Plus, Users, UserPlus, Trash2, Edit, Calendar } from 'lucide-react';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  name: z.string().min(3, { message: 'O nome do grupo deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Group {
  id: number;
  name: string;
  description: string | null;
  coachId: number;
  createdAt: Date;
}

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  joinedAt: Date;
  user: {
    id: number;
    username: string;
    name: string | null;
    email: string | null;
    role: string;
  };
}

interface AddMemberFormData {
  userId: string;
}

const Groups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [, setLocation] = useLocation();
  const [isCoachView] = useRoute('/groups/coach');
  
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  // Formulário para criar um novo grupo
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Formulário para adicionar membro
  const memberForm = useForm<AddMemberFormData>({
    defaultValues: {
      userId: '',
    },
  });

  // Buscar grupos - usa endpoint diferente dependendo se é coach ou atleta
  const { data: groups, isLoading } = useQuery({
    queryKey: [isCoach && isCoachView ? '/api/groups/coach' : '/api/groups/user'],
    enabled: !!user,
  });

  // Buscar usuários para adicionar ao grupo (apenas para coaches)
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: isCoach && isAddMemberOpen,
  });

  // Buscar membros do grupo selecionado
  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: ['/api/groups', selectedGroup?.id, 'members'],
    enabled: !!selectedGroup,
  });

  // Criar novo grupo
  const { mutate: createGroup, isPending: isCreating } = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest('/api/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Grupo criado com sucesso',
        description: 'O grupo foi criado e está pronto para receber membros.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/coach'] });
      form.reset();
      setIsAddGroupOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar grupo',
        description: 'Ocorreu um erro ao criar o grupo. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Adicionar membro ao grupo
  const { mutate: addMember, isPending: isAddingMember } = useMutation({
    mutationFn: async (data: AddMemberFormData) => {
      if (!selectedGroup) return null;
      return apiRequest(`/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: data.userId }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Membro adicionado com sucesso',
        description: 'O usuário foi adicionado ao grupo de treinamento.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroup?.id, 'members'] });
      memberForm.reset();
      setIsAddMemberOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar membro',
        description: 'Ocorreu um erro ao adicionar o membro ao grupo. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Remover membro do grupo
  const { mutate: removeMember } = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) => {
      return apiRequest(`/api/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Membro removido com sucesso',
        description: 'O usuário foi removido do grupo de treinamento.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroup?.id, 'members'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover membro',
        description: 'Ocorreu um erro ao remover o membro do grupo. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Remover grupo
  const { mutate: deleteGroup } = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Grupo removido com sucesso',
        description: 'O grupo de treinamento foi removido com sucesso.',
      });
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ['/api/groups/coach'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/user'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover grupo',
        description: 'Ocorreu um erro ao remover o grupo. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createGroup(data);
  };

  const onAddMember = (data: AddMemberFormData) => {
    if (!selectedGroup) return;
    addMember(data);
  };

  const handleRemoveMember = (userId: number) => {
    if (!selectedGroup) return;
    if (window.confirm('Tem certeza que deseja remover este membro do grupo?')) {
      removeMember({ groupId: selectedGroup.id, userId });
    }
  };

  const handleDeleteGroup = (groupId: number) => {
    if (window.confirm('Tem certeza que deseja remover este grupo? Esta ação não pode ser desfeita.')) {
      deleteGroup(groupId);
    }
  };

  const handleScheduleWorkout = (groupId: number) => {
    setLocation(`/schedule-workout/${groupId}`);
  };

  useEffect(() => {
    // Reset forms when dialogs close
    if (!isAddGroupOpen) {
      form.reset();
    }
    if (!isAddMemberOpen) {
      memberForm.reset();
    }
  }, [isAddGroupOpen, isAddMemberOpen, form, memberForm]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Grupos de Treinamento</h1>
        
        {isCoach && (
          <div className="flex space-x-2">
            {!isCoachView && (
              <Button variant="outline" onClick={() => setLocation('/groups/coach')}>
                Ver como Coach
              </Button>
            )}
            {isCoachView && (
              <Button variant="outline" onClick={() => setLocation('/groups')}>
                Ver como Atleta
              </Button>
            )}
            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Criar Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Grupo de Treinamento</DialogTitle>
                  <DialogDescription>
                    Crie um novo grupo para seus atletas. Depois você poderá adicionar membros e programar treinos.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Grupo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: CrossFit Iniciantes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o objetivo ou detalhes do grupo" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Criando...' : 'Criar Grupo'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <p>Carregando grupos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups && groups.length > 0 ? (
            groups.map((group: Group) => (
              <Card key={group.id} className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {group.name}
                    {isCoach && isCoachView && (
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleScheduleWorkout(group.id)}>
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { /* Implementar edição */ }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {group.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <Users className="mr-2 h-4 w-4" /> Ver Membros
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setLocation(`/group-workouts/${group.id}`)}
                  >
                    Ver Treinos
                  </Button>
                  
                  {isCoach && isCoachView && (
                    <Button 
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsAddMemberOpen(true);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Adicionar Membro
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
              <Users className="h-16 w-16 mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">Nenhum grupo encontrado</h3>
              <p className="text-gray-500 mt-2">
                {isCoach 
                  ? 'Você ainda não criou nenhum grupo de treinamento. Clique em "Criar Grupo" para começar.'
                  : 'Você ainda não participa de nenhum grupo de treinamento.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dialog para ver membros do grupo */}
      <Dialog 
        open={!!selectedGroup && !isAddMemberOpen} 
        onOpenChange={(open) => !open && setSelectedGroup(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Membros do Grupo: {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Lista de atletas que fazem parte deste grupo de treinamento.
            </DialogDescription>
          </DialogHeader>

          {isMembersLoading ? (
            <div className="flex justify-center my-8">
              <p>Carregando membros...</p>
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Nome</th>
                    <th className="py-2 text-left">Usuário</th>
                    <th className="py-2 text-left">Email</th>
                    <th className="py-2 text-left">Data de entrada</th>
                    {isCoach && isCoachView && <th className="py-2 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member: GroupMember) => (
                    <tr key={member.id} className="border-b">
                      <td className="py-3">{member.user.name || '-'}</td>
                      <td className="py-3">{member.user.username}</td>
                      <td className="py-3">{member.user.email || '-'}</td>
                      <td className="py-3">{new Date(member.joinedAt).toLocaleDateString()}</td>
                      {isCoach && isCoachView && (
                        <td className="py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveMember(member.user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="h-12 w-12 mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">Nenhum membro encontrado</h3>
              <p className="text-gray-500 mt-2">
                Este grupo ainda não possui membros.
              </p>
            </div>
          )}

          <DialogFooter>
            {isCoach && isCoachView && (
              <Button 
                onClick={() => {
                  setIsAddMemberOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Adicionar Membro
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar membro ao grupo */}
      <Dialog 
        open={!!selectedGroup && isAddMemberOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddMemberOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Grupo</DialogTitle>
            <DialogDescription>
              Selecione um usuário para adicionar ao grupo "{selectedGroup?.name}".
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={memberForm.handleSubmit(onAddMember)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium">
                Selecione um Usuário
              </label>
              <Select 
                onValueChange={(value) => memberForm.setValue('userId', value)}
                value={memberForm.watch('userId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users && users
                    .filter((u: any) => u.role !== 'admin')
                    .map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name || user.username} {user.role === 'coach' ? '(Coach)' : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddMemberOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isAddingMember || !memberForm.watch('userId')}>
                {isAddingMember ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;