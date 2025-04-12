import React from "react";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex overflow-x-auto space-x-2 pb-2 mb-4">
      <Button
        variant={selectedCategory === "all" ? "default" : "outline"}
        className={`whitespace-nowrap rounded-full text-sm ${
          selectedCategory === "all" ? "bg-accent hover:bg-accent/90" : ""
        }`}
        onClick={() => onCategoryChange("all")}
      >
        Todos
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          className={`whitespace-nowrap rounded-full text-sm ${
            selectedCategory === category ? "bg-accent hover:bg-accent/90" : ""
          }`}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
