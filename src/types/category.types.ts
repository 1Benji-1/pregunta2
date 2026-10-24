export type CategoryKey =
  | 'ARTE Y LITERATURA'
  | 'GEOGRAFIA'
  | 'CIENCIAS Y TECNOLOGIA'
  | 'DEPORTES'
  | 'ENTRETENIMIENTO'
  | 'HISTORIA';

export interface Category {
  key: CategoryKey;
  name: string;
  shortName: string;
  character: string;
  color: string;
  darkColor: string;
  lightColor: string;
  art: string;
  icon: string;
}

export interface WheelCrownSlice {
  key: 'CORONA';
  name: string;
  shortName: string;
  character: string;
  color: string;
  darkColor: string;
  lightColor: string;
  art: string;
  isCrown: true;
}

export type WheelSlice = (Category & { isCrown?: false }) | WheelCrownSlice;

export const CATEGORIES: Category[] = [
  {
    key: 'ARTE Y LITERATURA',
    name: 'Arte y Literatura',
    shortName: 'ARTE',
    character: 'Tina',
    color: '#e53935',
    darkColor: '#ab1f1c',
    lightColor: '#ffebee',
    art: 'assets/images/arte.png',
    icon: 'assets/images/arte.svg'
  },
  {
    key: 'GEOGRAFIA',
    name: 'Geografía',
    shortName: 'GEOGRAFÍA',
    character: 'Bonzo',
    color: '#1e88e5',
    darkColor: '#1565c0',
    lightColor: '#e3f2fd',
    art: 'assets/images/geografia.png',
    icon: 'assets/images/geografia.svg'
  },
  {
    key: 'CIENCIAS Y TECNOLOGIA',
    name: 'Ciencias y Tecnología',
    shortName: 'CIENCIA',
    character: 'Albert',
    color: '#2ecc71',
    darkColor: '#229954',
    lightColor: '#e8f8f0',
    art: 'assets/images/ciencia.png',
    icon: 'assets/images/ciencia.svg'
  },
  {
    key: 'DEPORTES',
    name: 'Deportes',
    shortName: 'DEPORTES',
    character: 'Tito',
    color: '#ff9800',
    darkColor: '#e65100',
    lightColor: '#fff3e0',
    art: 'assets/images/deportes.png',
    icon: 'assets/images/deportes.svg'
  },
  {
    key: 'ENTRETENIMIENTO',
    name: 'Entretenimiento',
    shortName: 'ENTRETENIMIENTO',
    character: 'Pop',
    color: '#e91e63',
    darkColor: '#ad1457',
    lightColor: '#fce4ec',
    art: 'assets/images/entretenimiento.png',
    icon: 'assets/images/entretenimiento.svg'
  },
  {
    key: 'HISTORIA',
    name: 'Historia',
    shortName: 'HISTORIA',
    character: 'Héctor',
    color: '#fbc02d',
    darkColor: '#c49000',
    lightColor: '#fffde7',
    art: 'assets/images/historia.png',
    icon: 'assets/images/historia.svg'
  }
];

export const WHEEL_SLICES: WheelSlice[] = [
  CATEGORIES[0], // Arte
  CATEGORIES[1], // Geografía
  CATEGORIES[2], // Ciencia
  {
    key: 'CORONA',
    name: 'Corona Especial',
    shortName: 'CORONA',
    character: 'Willy',
    color: '#9b51e0',
    darkColor: '#6a1b9a',
    lightColor: '#f3e5f5',
    art: 'assets/images/cup.png',
    isCrown: true
  },
  CATEGORIES[3], // Deportes
  CATEGORIES[4], // Entretenimiento
  CATEGORIES[5]  // Historia
];
