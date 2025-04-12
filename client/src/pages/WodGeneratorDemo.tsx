import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  BrainCircuit, 
  Loader2, 
  Dumbbell, 
  ScanBarcode 
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { generateWod, GeneratedWod } from "@/lib/openai";

// Define form schema for validation
const formSchema = z.object({
  type: z.string().min(1, "Selecione um tipo de WOD"),
  duration: z.coerce.number().min(1, "Informe a duração"),
  level: z.enum(["iniciante", "intermediário", "avançado"]),
  focus: z.string().optional(),
  equipment: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

// WOD types
const wodTypes = [
  { value: "AMRAP", label: "AMRAP" },
  { value: "EMOM", label: "EMOM" },
  { value: "For Time", label: "For Time" },
  { value: "Tabata", label: "Tabata" },
  { value: "Chipper", label: "Chipper" },
];

// Skill levels
const skillLevels = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediário", label: "Intermediário" },
  { value: "avançado", label: "Avançado" },
];

// Available equipment
const equipments = [
  { id: "barbell", label: "Barra" },
  { id: "dumbbell", label: "Halteres" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "pull-up-bar", label: "Barra fixa" },
  { id: "rings", label: "Argolas" },
  { id: "jump-rope", label: "Corda" },
  { id: "box", label: "Caixa de salto" },
  { id: "rower", label: "Remo" },
  { id: "bike", label: "Bike" },
  { id: "wall-ball", label: "Wall Ball" },
];

const WodGeneratorDemo: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWod, setGeneratedWod] = useState<GeneratedWod | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      duration: 20,
      level: "intermediário",
      focus: "",
      equipment: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsGenerating(true);
      
      const wodParams = {
        type: data.type,
        duration: data.duration,
        level: data.level as any,
        focus: data.focus,
        equipment: data.equipment,
      };
      
      const wod = await generateWod(wodParams);
      setGeneratedWod(wod);
      
      toast({
        title: "WOD gerado com sucesso!",
        description: "Seu workout personalizado foi criado com IA.",
      });
    } catch (error) {
      console.error("Erro ao gerar WOD:", error);
      toast({
        title: "Erro ao gerar WOD",
        description: "Não foi possível criar o workout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveWorkout = () => {
    if (!generatedWod) return;
    
    // Implementação futura: salvar o workout
    toast({
      title: "Workout salvo!",
      description: "O WOD foi adicionado à sua lista de treinos.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-orange-500">EssencialCross</h1>
          <p className="text-gray-400">Gerador de WOD com Inteligência Artificial</p>
        </header>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gerador de WOD</h2>
              <p className="text-gray-400">Crie workouts personalizados com IA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BrainCircuit className="mr-2 h-5 w-5 text-orange-500" />
                  Configurar WOD
                </CardTitle>
                <CardDescription>
                  Personalize os parâmetros para gerar um workout ideal para você
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Workout</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isGenerating}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Selecione um tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600 text-white">
                              {wodTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
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
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração (minutos)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-gray-700 border-gray-600 text-white"
                              min={1}
                              max={60}
                              disabled={isGenerating}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Dificuldade</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isGenerating}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Selecione um nível" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600 text-white">
                              {skillLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
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
                      name="focus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Foco do Treino (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="Ex: cardio, força, técnica..."
                              disabled={isGenerating}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="equipment"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Equipamentos Disponíveis</FormLabel>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {equipments.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="equipment"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value || [], item.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item.id
                                                  )
                                                )
                                          }}
                                          disabled={isGenerating}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {item.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando WOD...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="mr-2 h-4 w-4" />
                          Gerar WOD com IA
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {generatedWod ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Dumbbell className="mr-2 h-5 w-5 text-orange-500" />
                    {generatedWod.name}
                  </CardTitle>
                  <CardDescription>
                    {generatedWod.type} • {form.getValues().duration} minutos • Nível: {form.getValues().level}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-sm text-gray-300 whitespace-pre-line">{generatedWod.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Movimentos</h3>
                    <ul className="list-disc list-inside text-sm text-gray-300">
                      {generatedWod.movements.map((movement, index) => (
                        <li key={index}>{movement}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Dicas</h3>
                    <ul className="list-disc list-inside text-sm text-gray-300">
                      {generatedWod.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {generatedWod.scaling && (
                    <div>
                      <h3 className="font-semibold mb-2">Adaptações</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-orange-500">Iniciante:</span> {generatedWod.scaling.beginner}</p>
                        <p><span className="font-medium text-orange-500">Intermediário:</span> {generatedWod.scaling.intermediate}</p>
                        <p><span className="font-medium text-orange-500">Avançado:</span> {generatedWod.scaling.advanced}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={saveWorkout}
                    >
                      <ScanBarcode className="mr-2 h-4 w-4" />
                      Salvar Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700 flex flex-col justify-center items-center py-8">
                <Dumbbell className="h-16 w-16 text-gray-600 mb-4" />
                <CardTitle className="text-gray-500 text-lg font-medium mb-2">
                  Nenhum WOD gerado
                </CardTitle>
                <CardDescription className="text-center max-w-md px-4">
                  Configure os parâmetros do seu workout ao lado e clique em "Gerar WOD com IA" para criar um treino personalizado.
                </CardDescription>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WodGeneratorDemo;