import React from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Settings: React.FC = () => {
  const { toast } = useToast();
  
  // These would be connected to user preferences in a full implementation
  const [darkMode, setDarkMode] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  
  const handleToggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    toast({
      title: checked ? "Modo escuro ativado" : "Modo claro ativado",
      description: "A alteração será aplicada na próxima vez que você abrir o app.",
    });
  };
  
  const handleToggleSound = (checked: boolean) => {
    setSoundEnabled(checked);
    toast({
      title: checked ? "Sons ativados" : "Sons desativados",
      description: "Preferência salva com sucesso.",
    });
  };
  
  const handleToggleNotifications = (checked: boolean) => {
    setNotificationsEnabled(checked);
    toast({
      title: checked ? "Notificações ativadas" : "Notificações desativadas",
      description: "Preferência salva com sucesso.",
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
        <h1 className="font-semibold text-2xl">Configurações</h1>
      </div>
      
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Modo escuro</p>
              <p className="text-sm text-gray-400">
                Aplica um tema escuro ao aplicativo
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={handleToggleDarkMode}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembretes de treino</p>
              <p className="text-sm text-gray-400">
                Receba notificações sobre seus treinos programados
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sons de alerta</p>
              <p className="text-sm text-gray-400">
                Sons para indicar início, fim e transições de intervalos
              </p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={handleToggleSound}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Sobre</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-2">
            <strong className="text-accent">Essencial</strong>
            <strong className="text-white">Cross</strong>
          </p>
          <p className="text-sm text-gray-400">Versão 1.0.0</p>
          <p className="text-sm text-gray-400 mt-4">
            Aplicativo desenvolvido para ajudar atletas de CrossFit a acompanhar seu 
            progresso, registrar treinos e PRs de forma simples e intuitiva.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
