import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Exercise, ExerciseCategory } from "@/types";
import ExerciseItem from "@/components/ExerciseItem";

const Exercises: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const { data: exercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });
  
  const filteredExercises = exercises
    ? exercises.filter((exercise) => {
        const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
        const matchesSearch = !searchQuery || 
          exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesCategory && matchesSearch;
      })
    : [];
    
  const handleExerciseSelect = (exerciseId: number) => {
    const exercise = exercises?.find(e => e.id === exerciseId) || null;
    setSelectedExercise(exercise);
  };

  return (
    <div className="px-4 py-4 pb-20">
      <h1 className="font-semibold text-2xl mb-4">Movimentos</h1>
      
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
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-400">Carregando movimentos...</p>
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredExercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              onSelect={handleExerciseSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {searchQuery || selectedCategory !== "all"
              ? "Nenhum movimento encontrado com este filtro."
              : "Nenhum movimento disponível."}
          </p>
        </div>
      )}
      
      {/* Exercise Detail Dialog */}
      {selectedExercise && (
        <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
          <DialogContent className="bg-primary border-0 text-white">
            <DialogHeader>
              <DialogTitle>{selectedExercise.name}</DialogTitle>
            </DialogHeader>
            
            <div>
              <p className="text-sm text-gray-400 mb-4">{selectedExercise.category}</p>
              <p className="text-gray-200 mb-4">{selectedExercise.description}</p>
              
              {selectedExercise.videoUrl && (
                <div className="mt-4">
                  <Button
                    className="w-full bg-accent hover:bg-accent/90"
                    onClick={() => window.open(selectedExercise.videoUrl, "_blank")}
                  >
                    Ver Vídeo Demonstrativo
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Exercises;
