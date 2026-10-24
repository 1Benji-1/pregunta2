import { CategoryKey } from './category.types';

export type Difficulty = 'facil' | 'media' | 'dificil' | 'mixta';

export interface Question {
  id: number;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: number; // 0, 1, 2 o 3
}

export interface Card {
  categoria: CategoryKey;
  dificultad: Difficulty;
  carta_id: string;
  preguntas: Question[];
}
