import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkoutFormData, WorkoutType } from "@/types";

const workoutTypes: WorkoutType[] = [
  "AMRAP",
  "EMOM",
  "For Time",
  "Tabata",
  "Strength",
  "Skill",
  "Other",
];

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["AMRAP", "EMOM", "For Time", "Tabata", "Strength", "Skill", "Other"]),
  description: z.string().min(1, "Description is required"),
  result: z.string().optional(),
  completed: z.boolean().default(false),
});

interface WorkoutFormProps {
  workout?: WorkoutFormData;
  onOpenTimer: () => void;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ workout, onOpenTimer }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const today = new Date().toISOString().split("T")[0];
  
  const defaultValues: WorkoutFormData = workout || {
    date: today,
    type: "AMRAP",
    description: "",
    result: "",
    completed: false,
  };
  
  const form = useForm<WorkoutFormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const createWorkoutMutation = useMutation({
    mutationFn: async (data: WorkoutFormData) => {
      const response = await apiRequest("POST", "/api/workouts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Treino salvo!",
        description: "Seu treino foi salvo com sucesso.",
      });
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/recent"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o treino. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: WorkoutFormData) => {
    createWorkoutMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400">Data</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  className="bg-gray-800 border-gray-700 text-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400">Tipo de Treino</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
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
              <FormLabel className="text-gray-400">Descrição do Treino</FormLabel>
              <FormControl>
                <Textarea
                  className="bg-gray-800 border-gray-700 text-white min-h-32"
                  placeholder="Digite a descrição completa do treino..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="result"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400">Resultado / Observações</FormLabel>
              <FormControl>
                <Textarea
                  className="bg-gray-800 border-gray-700 text-white min-h-20"
                  placeholder="Registre seu resultado ou observações..."
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
          name="completed"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="mr-2 h-4 w-4"
                />
              </FormControl>
              <FormLabel className="text-white">Treino completado</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex space-x-3">
          <Button
            type="submit"
            className="flex-1 bg-accent hover:bg-accent/90"
            disabled={createWorkoutMutation.isPending}
          >
            {createWorkoutMutation.isPending ? "Salvando..." : "Salvar Treino"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenTimer}
          >
            <Timer className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WorkoutForm;
