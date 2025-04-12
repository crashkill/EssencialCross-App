import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { LogOut, ChevronLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Workout, PersonalRecordWithExercise } from "@/types";

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Fetch user's workout statistics
  const { data: workouts } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });
  
  // Fetch user's PRs
  const { data: prs } = useQuery<PersonalRecordWithExercise[]>({
    queryKey: ["/api/prs/recent"],
  });
  
  const completedWorkouts = workouts?.filter(w => w.completed).length || 0;
  const totalWorkouts = workouts?.length || 0;
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  
  const memberSince = user?.createdAt 
    ? format(new Date(user.createdAt), "dd MMMM, yyyy")
    : "N/A";
  
  const handleExportData = (format: 'json' | 'csv') => {
    // Create the download link for the export
    const downloadUrl = `/api/export?format=${format}`;
    
    // Open in a new tab to trigger download
    window.open(downloadUrl, '_blank');
    
    toast({
      title: "Exportação iniciada",
      description: `Seus dados estão sendo exportados como ${format.toUpperCase()}`,
    });
  };

  return (
    <div className="px-4 py-4 pb-16">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-2xl">Perfil</h1>
      </div>
      
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Informações da conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Nome de usuário</p>
            <p className="font-medium">{user?.username || "N/A"}</p>
          </div>
          {user?.name && (
            <div>
              <p className="text-sm text-gray-400">Nome</p>
              <p className="font-medium">{user.name}</p>
            </div>
          )}
          {user?.email && (
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-400">Membro desde</p>
            <p className="font-medium">{memberSince}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Estatísticas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400">Treinos</p>
            <p className="text-2xl font-semibold text-accent mt-1">{totalWorkouts}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400">Completados</p>
            <p className="text-2xl font-semibold text-accent mt-1">{completionRate}%</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400">PRs Registrados</p>
            <p className="text-2xl font-semibold text-accent mt-1">{prs?.length || 0}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400">Exercícios</p>
            <p className="text-2xl font-semibold text-accent mt-1">12</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Exportar dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Exporte seus treinos e PRs para backup ou análise externa.
          </p>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleExportData('json')}
            >
              <Download className="mr-2 h-4 w-4" />
              JSON
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleExportData('csv')}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Button 
        variant="destructive" 
        className="w-full"
        onClick={logout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair da conta
      </Button>
    </div>
  );
};

export default Profile;
