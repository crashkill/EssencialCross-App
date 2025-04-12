import React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { PersonalRecord } from "@/types";

interface PRsChartProps {
  exerciseName: string;
  records: PersonalRecord[];
}

const PRsChart: React.FC<PRsChartProps> = ({ exerciseName, records }) => {
  // Sort records by date ascending
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const firstDate = sortedRecords.length > 0 
    ? format(new Date(sortedRecords[0].date), "dd/MM/yyyy") 
    : "-";
  
  const lastDate = sortedRecords.length > 0 
    ? format(new Date(sortedRecords[sortedRecords.length - 1].date), "dd/MM/yyyy") 
    : "-";
  
  // Get the max value for the records
  const currentPR = sortedRecords.length > 0 
    ? sortedRecords[sortedRecords.length - 1].value 
    : "0";
  
  const unit = sortedRecords.length > 0 
    ? sortedRecords[sortedRecords.length - 1].unit 
    : "";
  
  // Show up to 5 values for the chart
  const chartRecords = sortedRecords.slice(-5);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-lg">{exerciseName}</h2>
        </div>
        
        <div className="flex items-end mb-3">
          <span className="text-3xl font-mono font-medium text-accent">{currentPR}</span>
          <span className="ml-1 text-lg font-mono">{unit}</span>
        </div>
        
        {/* Simple PR Chart */}
        {chartRecords.length > 0 ? (
          <div className="h-20 mb-3 flex items-end space-x-1">
            {chartRecords.map((record, index) => {
              // Calculate relative height based on value compared to max
              const maxValue = Math.max(...chartRecords.map(r => parseFloat(r.value)));
              const minValue = Math.min(...chartRecords.map(r => parseFloat(r.value)));
              const range = maxValue - minValue || 1;
              const value = parseFloat(record.value);
              
              // Normalize to 8-16 (min-max) range for height
              const heightPercent = Math.max(8, 8 + ((value - minValue) / range) * 8);
              const height = `${heightPercent}rem`;
              
              // Last record is the current PR, highlight it with accent color
              const isCurrentPR = index === chartRecords.length - 1;
              
              return (
                <div 
                  key={record.id} 
                  className={`w-1/5 ${isCurrentPR ? 'bg-accent' : 'bg-gray-700'} rounded-t relative`}
                  style={{ height }}
                >
                  <span className="absolute -top-5 w-full text-center text-xs font-mono">
                    {record.value}
                  </span>
                </div>
              );
            })}
            
            {/* Fill any remaining slots with empty columns */}
            {Array.from({ length: Math.max(0, 5 - chartRecords.length) }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="w-1/5 bg-gray-800 h-0 rounded-t relative"
              >
                <span className="absolute -top-5 w-full text-center text-xs font-mono opacity-0">
                  -
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-20 mb-3 flex items-center justify-center text-gray-400">
            Sem registros disponíveis
          </div>
        )}
        
        <div className="flex justify-between text-sm text-gray-400">
          <span>Primeiro: {firstDate}</span>
          <span>Último: {lastDate}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PRsChart;
