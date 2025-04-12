import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import { Exercise } from "@/types";

interface ExerciseItemProps {
  exercise: Exercise;
  onSelect: (exerciseId: number) => void;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({ exercise, onSelect }) => {
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exercise.videoUrl) {
      window.open(exercise.videoUrl, "_blank");
    }
  };

  return (
    <Card
      className="bg-gray-800 overflow-hidden cursor-pointer"
      onClick={() => onSelect(exercise.id)}
    >
      <div className="aspect-video bg-gray-700 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className="bg-accent bg-opacity-90 text-white w-12 h-12 rounded-full flex items-center justify-center"
            onClick={handleVideoClick}
          >
            <Play className="h-5 w-5" />
          </button>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium">{exercise.name}</h3>
        <p className="text-sm text-gray-400">{exercise.category}</p>
      </CardContent>
    </Card>
  );
};

export default ExerciseItem;
