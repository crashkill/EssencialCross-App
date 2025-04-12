import React, { useState } from "react";
import { useSearch } from "wouter/use-browser-location";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Exercise, PersonalRecord } from "@/types";
import PRsChart from "@/components/PRsChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const PRs: React.FC = () => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const showAddDialog = params.get("action") === "add";
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(showAddDialog);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch exercises
  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });
  
  // Fetch PRs
  const { data: personalRecords, isLoading: isLoadingPRs } = useQuery<PersonalRecord[]>({
    queryKey: ["/api/prs"],
  });
  
  // Group PRs by exercise
  const prsByExercise = React.useMemo(() => {
    if (!personalRecords || !exercises) return {};
    
    const result: Record<number, {
      exerciseId: number;
      exerciseName: string;
      category: string;
      records: PersonalRecord[];
    }> = {};
    
    personalRecords.forEach(pr => {
      const exercise = exercises.find(e => e.id === pr.exerciseId);
      if (!exercise) return;
      
      if (!result[pr.exerciseId]) {
        result[pr.exerciseId] = {
          exerciseId: pr.exerciseId,
          exerciseName: exercise.name,
          category: exercise.category,
          records: []
        };
      }
      
      result[pr.exerciseId].records.push(pr);
    });
    
    return result;
  }, [personalRecords, exercises]);
  
  // Filter PRs based on category and search
  const filteredPRs = Object.values(prsByExercise).filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.exerciseName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Add PR form schema
  const formSchema = z.object({
    exerciseId: z.string().min(1, "Please select an exercise"),
    value: z.string().min(1, "Value is required"),
    unit: z.string().min(1, "Unit is required"),
    date: z.string().min(1, "Date is required"),
    notes: z.string().optional(),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exerciseId: "",
      value: "",
      unit: "kg",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });
  
  // Create PR mutation
  const createPRMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/prs", {
        ...data,
        exerciseId: parseInt(data.exerciseId),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "PR adicionado!",
        description: "Seu novo recorde pessoal foi registrado com sucesso.",
      });
      form.reset();
      setAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/prs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prs/recent"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o PR. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createPRMutation.mutate(data);
  };

  return (
    <div className="px-4 py-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-semibold text-2xl">Seus PRs</h1>
        <Button 
          size="icon"
          className="rounded-full bg-accent hover:bg-accent/90"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Pesquisar movimento..."
          className="bg-gray-800 border-gray-700 text-white pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex overflow-x-auto space-x-2 pb-2 mb-4">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          className={`whitespace-nowrap rounded-full text-sm ${
            selectedCategory === "all" ? "bg-accent hover:bg-accent/90" : ""
          }`}
          onClick={() => setSelectedCategory("all")}
        >
          Todos
        </Button>
        {["Weightlifting", "Gymnastics", "Cardio", "Metcons"].map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className={`whitespace-nowrap rounded-full text-sm ${
              selectedCategory === category ? "bg-accent hover:bg-accent/90" : ""
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      
      {isLoadingPRs ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-400">Carregando seus PRs...</p>
        </div>
      ) : filteredPRs.length > 0 ? (
        <div className="space-y-4">
          {filteredPRs.map((item) => (
            <PRsChart
              key={item.exerciseId}
              exerciseName={item.exerciseName}
              records={item.records}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {searchQuery || selectedCategory !== "all"
              ? "Nenhum PR encontrado com este filtro."
              : "Você ainda não registrou nenhum PR."}
          </p>
          <Button
            className="mt-4 bg-accent hover:bg-accent/90"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar PR
          </Button>
        </div>
      )}
      
      {/* Add PR Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-primary border-0 text-white">
          <DialogHeader>
            <DialogTitle>Adicionar novo PR</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="exerciseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movimento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o movimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {exercises?.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id.toString()}>
                            {exercise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
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
                  name="unit"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Unidade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="reps">reps</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                          <SelectItem value="s">s</SelectItem>
                          <SelectItem value="min">min</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-gray-800 border-gray-700 text-white"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90"
                disabled={createPRMutation.isPending}
              >
                {createPRMutation.isPending ? "Salvando..." : "Salvar PR"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PRs;
