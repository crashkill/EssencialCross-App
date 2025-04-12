import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, UserPlus, Plus, Dumbbell, CalendarPlus, Calendar, LogOut, Edit, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";

const groupFormSchema = z.object({
  name: z.string().min(3, "O nome precisa ter pelo menos 3 caracteres"),
  description: z.string().optional()
});

const groupMemberSchema = z.object({
  userId: z.number(),
  groupId: z.number()
});

type GroupFormData = z.infer<typeof groupFormSchema>;
type GroupMemberData = z.infer<typeof groupMemberSchema>;

interface User {
  id: number;
  username: string;
  name: string | null;
  role: string;
  email: string | null;
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  coachId: number;
  createdAt: string;
  members?: GroupMember[];
}

interface GroupMember {
  id: number;
  userId: number;
  groupId: number;
  joinedAt: string;
  user?: User;
}

const Groups: React.FC = () => {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<string>(user?.role === "coach" ? "my-groups" : "joined-groups");

  // Form para criar um novo grupo
  const { register, handleSubmit, formState: { errors }, reset } = useForm<GroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  // Queries
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      if (user?.role !== 'coach' && user?.role !== 'admin') return [];
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Falha ao carregar usuários');
      return response.json();
    },
    enabled: user?.role === 'coach' || user?.role === 'admin'
  });

  const { data: coachGroups = [], isLoading: isLoadingCoachGroups } = useQuery({
    queryKey: ['/api/groups/coach'],
    queryFn: async () => {
      const response = await fetch('/api/groups/coach');
      if (!response.ok) throw new Error('Falha ao carregar grupos');
      return response.json();
    },
    enabled: user?.role === 'coach' || user?.role === 'admin'
  });

  const { data: memberGroups = [], isLoading: isLoadingMemberGroups } = useQuery({
    queryKey: ['/api/groups/member'],
    queryFn: async () => {
      const response = await fetch('/api/groups/member');
      if (!response.ok) throw new Error('Falha ao carregar grupos');
      return response.json();
    }
  });

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao criar grupo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups/coach'] });
      toast({
        title: "Grupo criado",
        description: "O grupo foi criado com sucesso!"
      });
      setCreateDialogOpen(false);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: async (memberIds: number[]) => {
      const response = await fetch('/api/group-members/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedGroupId, userIds: memberIds })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao adicionar membros');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups/coach'] });
      toast({
        title: "Membros adicionados",
        description: "Os membros foram adicionados ao grupo com sucesso!"
      });
      setAddMemberDialogOpen(false);
      setSelectedUsers([]);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number, userId: number }) => {
      const response = await fetch(`/api/group-members/${groupId}/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao remover membro');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups/coach'] });
      toast({
        title: "Membro removido",
        description: "O membro foi removido do grupo com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao sair do grupo');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups/member'] });
      toast({
        title: "Grupo",
        description: "Você saiu do grupo com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao excluir grupo');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups/coach'] });
      toast({
        title: "Grupo excluído",
        description: "O grupo foi excluído com sucesso!"
      });
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
  const handleCreateGroup = (data: GroupFormData) => {
    createGroupMutation.mutate(data);
  };

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Nenhum membro selecionado",
        description: "Selecione pelo menos um usuário para adicionar ao grupo",
        variant: "destructive"
      });
      return;
    }
    
    addMemberMutation.mutate(selectedUsers);
  };

  const handleToggleUser = (userId: number) => {
    setSelectedUsers(current => 
      current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
    );
  };

  const handleOpenAddMembers = (groupId: number) => {
    setSelectedGroupId(groupId);
    setSelectedUsers([]);
    setAddMemberDialogOpen(true);
  };

  const handleLeaveGroup = (groupId: number) => {
    if (window.confirm("Tem certeza que deseja sair deste grupo?")) {
      leaveGroupMutation.mutate(groupId);
    }
  };

  const handleRemoveMember = (groupId: number, userId: number) => {
    if (window.confirm("Tem certeza que deseja remover este membro?")) {
      removeMemberMutation.mutate({ groupId, userId });
    }
  };

  const handleDeleteGroup = (groupId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const navigateToScheduleWorkout = (groupId: number) => {
    navigate(`/schedule-workout/${groupId}`);
  };

  const navigateToGroupWorkouts = (groupId: number) => {
    navigate(`/group-workouts/${groupId}`);
  };

  const getGroupMembers = (group: Group) => {
    if (!group.members) return [];
    
    // Buscar informações adicionais de cada membro
    return group.members.map((member: GroupMember) => {
      const memberUser = allUsers.find((u: User) => u.id === member.userId);
      return {
        ...member,
        user: memberUser
      };
    });
  };

  const isUserInGroup = (groupId: number, userId: number) => {
    const group = coachGroups.find((g: Group) => g.id === groupId);
    if (!group || !group.members) return false;
    return group.members.some((member: GroupMember) => member.userId === userId);
  };

  const filteredUsers = (groupId: number) => {
    // Filtrar usuários que ainda não estão no grupo
    return allUsers.filter((user: User) => !isUserInGroup(groupId, user.id));
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Grupos de Treino</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie seus grupos de treino e acompanhe os atletas</p>
        </div>
        
        {user?.role === "coach" && (
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Grupo
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {user?.role === "coach" && (
            <TabsTrigger value="my-groups">
              <Users className="h-4 w-4 mr-2" />
              Meus Grupos
            </TabsTrigger>
          )}
          <TabsTrigger value="joined-groups">
            <Dumbbell className="h-4 w-4 mr-2" />
            Grupos que Participo
          </TabsTrigger>
        </TabsList>

        {user?.role === "coach" && (
          <TabsContent value="my-groups">
            {isLoadingCoachGroups ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
              </div>
            ) : coachGroups.length === 0 ? (
              <Alert className="mb-6">
                <AlertDescription>
                  Você ainda não criou nenhum grupo. Crie um grupo para começar a adicionar atletas.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {coachGroups.map((group: Group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader className="bg-secondary/50 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{group.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {group.members?.length || 0} membros
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {group.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{group.description}</p>
                      )}
                      
                      <div className="flex flex-col space-y-1 mb-4">
                        <h4 className="text-sm font-semibold flex items-center">
                          <Users className="h-4 w-4 mr-1" /> 
                          Membros
                        </h4>
                        
                        {group.members && group.members.length > 0 ? (
                          <div className="max-h-40 overflow-y-auto">
                            <Table>
                              <TableBody>
                                {getGroupMembers(group).map((member) => (
                                  <TableRow key={member.id}>
                                    <TableCell className="py-1">
                                      {member.user?.name || member.user?.username}
                                    </TableCell>
                                    <TableCell className="py-1 text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveMember(group.id, member.userId)}
                                      >
                                        <LogOut className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum membro ainda</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenAddMembers(group.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigateToGroupWorkouts(group.id)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Treinos
                        </Button>
                        
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => navigateToScheduleWorkout(group.id)}
                        >
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Agendar
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="joined-groups">
          {isLoadingMemberGroups ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
          ) : memberGroups.length === 0 ? (
            <Alert className="mb-6">
              <AlertDescription>
                Você ainda não participa de nenhum grupo. Aguarde um coach adicionar você a um grupo.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {memberGroups.map((group: Group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    {group.description && (
                      <CardDescription>{group.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Coach: {group.coachId ? `Coach #${group.coachId}` : "Coach"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeaveGroup(group.id)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                    
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => navigateToGroupWorkouts(group.id)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver Treinos
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para criar um novo grupo */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
            <DialogDescription>
              Crie um novo grupo de treino para gerenciar seus atletas.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(handleCreateGroup)}>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Grupo</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Digite o nome do grupo"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Digite uma descrição para o grupo"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                    Criando...
                  </>
                ) : "Criar Grupo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar membros ao grupo */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Adicionar Membros</DialogTitle>
            <DialogDescription>
              Selecione os usuários que deseja adicionar ao grupo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedGroupId && filteredUsers(selectedGroupId).length === 0 ? (
              <Alert>
                <AlertDescription>
                  Não há mais usuários disponíveis para adicionar a este grupo.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Função</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGroupId && filteredUsers(selectedGroupId).map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleToggleUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role === 'athlete' ? 'Atleta' : 
                             user.role === 'coach' ? 'Coach' : 'Admin'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddMemberDialogOpen(false)}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMembers}
              disabled={addMemberMutation.isPending || selectedUsers.length === 0}
            >
              {addMemberMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                  Adicionando...
                </>
              ) : "Adicionar Selecionados"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;