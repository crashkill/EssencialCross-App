import { apiRequest } from "./queryClient";

export interface WodGenerationParams {
  type: string;
  duration: number;
  level: 'iniciante' | 'intermediário' | 'avançado';
  focus?: string;
  equipment?: string[];
}

export interface GeneratedWod {
  type: string;
  name: string;
  description: string;
  movements: string[];
  tips: string[];
  scaling?: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
}

export async function generateWod(params: WodGenerationParams): Promise<GeneratedWod> {
  try {
    const response = await apiRequest(
      "POST",
      "/api/wod/generate", 
      params
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Não foi possível gerar o WOD');
    }
    
    const wodData: GeneratedWod = await response.json();
    return wodData;
  } catch (error) {
    console.error('Erro ao gerar WOD:', error);
    throw new Error('Não foi possível gerar o WOD. Por favor, tente novamente.');
  }
}