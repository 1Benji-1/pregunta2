import { CategoryKey } from './category.types';

export interface PlayerCategoryState {
  points: number;       // 0 a 3
  won: boolean;
  wonByCrown: boolean;
  correctCount: number;
  attemptCount: number;
}

export interface ComodinesState {
  dobleOportunidad: number;
  bomba: number;
}

export interface Player {
  name: string;
  avatar: string;
  color: string;
  crowns: number;
  totalCorrect: number;
  totalQuestions: number;
  pressureCorrect: number;
  bonusSaves: number;
  comodines: ComodinesState;
  categories: Record<CategoryKey, PlayerCategoryState>;
}

export interface AvatarOption {
  emoji: string;
  label: string;
  bg: string;
}

export const AVATARS: AvatarOption[] = [
  { emoji: '🦊', label: 'Zorro Azul', bg: '#1e88e5' },
  { emoji: '🦉', label: 'Búho Violeta', bg: '#8e24aa' },
  { emoji: '🦁', label: 'León Dorado', bg: '#f57c00' },
  { emoji: '🐼', label: 'Panda Esmeralda', bg: '#2ecc71' },
  { emoji: '🐯', label: 'Tigre Carmesí', bg: '#e53935' },
  { emoji: '🐸', label: 'Rana Turquesa', bg: '#00acc1' }
];
