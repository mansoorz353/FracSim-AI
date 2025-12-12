export interface FracInputs {
  E: number; // Young's Modulus
  nu: number; // Poisson's Ratio
  sigma_min: number; // Min Horizontal Stress
  CL: number; // Carter Leakoff Coefficient
  mu: number; // Viscosity
  q: number; // Injection Rate
  H: number; // Fracture Height
  K_IC: number; // Fracture Toughness
  time: number; // Injection Time
  p_limit: number; // Surface/Wellbore Pressure Limit
  depth: number; // TVD - for hydrostatic calc
}

export enum ModelType {
  PKN = 'PKN',
  KGD = 'KGD',
  RADIAL = 'Radial'
}

export enum UnitSystem {
  SI = 'SI',
  FIELD = 'Field'
}

export interface TimeStep {
  time: number;
  length: number;
  width: number;
  pressure: number;
}

export interface ProfilePoint {
  position: number;
  width: number;
}

export interface ModelResult {
  type: ModelType;
  length: number; // Always SI (m)
  width_avg: number; // Always SI (m)
  width_max: number; // Always SI (m)
  p_net: number; // Always SI (Pa)
  p_well: number; // Always SI (Pa)
  efficiency: number; // Dimensionless
  volume_injected: number; // SI (m3)
  volume_leakoff: number; // SI (m3)
  regime: 'Viscosity' | 'Toughness' | 'Leakoff-Dominated';
  warnings: string[];
  timeSeries: TimeStep[]; // Always SI
  profile: ProfilePoint[]; // Always SI
}

export interface SensitivityData {
  parameter: string;
  factor: number;
  L_change: number; // % change
  w_change: number; // % change
  p_change: number; // % change
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  timestamp: number;
  isThinking?: boolean;
}

export enum AspectRatio {
  '1:1' = '1:1',
  '2:3' = '2:3',
  '3:2' = '3:2',
  '3:4' = '3:4',
  '4:3' = '4:3',
  '9:16' = '9:16',
  '16:9' = '16:9',
  '21:9' = '21:9'
}