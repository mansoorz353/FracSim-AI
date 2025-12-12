import { FracInputs, UnitSystem } from "../types";

// Conversion Factors: Multiply SI by 'toUnit' to get Display Unit.
// Multiply Display Unit by 'toSI' to get SI.
// We store 'toSI' factors. (e.g. 1 ft = 0.3048 m)

export const UNIT_CONFIG = {
  [UnitSystem.SI]: {
    pressure: { label: 'Pa', toSI: 1 },
    rate: { label: 'm³/s', toSI: 1 },
    viscosity: { label: 'Pa.s', toSI: 1 },
    length: { label: 'm', toSI: 1 },
    width: { label: 'mm', toSI: 0.001 }, // Display width in mm usually
    toughness: { label: 'Pa.m^0.5', toSI: 1 },
    leakoff: { label: 'm/s^0.5', toSI: 1 },
    time: { label: 's', toSI: 1 },
    dimensionless: { label: '-', toSI: 1 }
  },
  [UnitSystem.FIELD]: {
    pressure: { label: 'psi', toSI: 6894.76 },
    rate: { label: 'bpm', toSI: 0.00264979 }, // 1 bpm = 0.00265 m3/s
    viscosity: { label: 'cp', toSI: 0.001 }, // 1 cp = 0.001 Pa.s
    length: { label: 'ft', toSI: 0.3048 },
    width: { label: 'in', toSI: 0.0254 },
    toughness: { label: 'psi.in^0.5', toSI: 1098.84 }, // 1 psi.sqrt(in) approx 1098.8 Pa.sqrt(m)
    leakoff: { label: 'ft/min^0.5', toSI: 0.0393396 }, // ft/min^0.5 -> m/s^0.5 (0.3048 / sqrt(60))
    time: { label: 'min', toSI: 60 },
    dimensionless: { label: '-', toSI: 1 }
  }
};

// Map input keys to unit categories
const PARAM_UNIT_MAP: Record<keyof FracInputs, keyof typeof UNIT_CONFIG['SI']> = {
  E: 'pressure',
  nu: 'dimensionless',
  sigma_min: 'pressure',
  CL: 'leakoff',
  mu: 'viscosity',
  q: 'rate',
  H: 'length',
  K_IC: 'toughness',
  time: 'time',
  p_limit: 'pressure',
  depth: 'length'
};

// Convert a single value from System A to System B
export const convertValue = (
  val: number, 
  category: keyof typeof UNIT_CONFIG['SI'], 
  fromSys: UnitSystem, 
  toSys: UnitSystem
): number => {
  if (fromSys === toSys) return val;
  const fromFactor = UNIT_CONFIG[fromSys][category].toSI;
  const toFactor = UNIT_CONFIG[toSys][category].toSI;
  // SI = val * fromFactor
  // NewVal = SI / toFactor
  return (val * fromFactor) / toFactor;
};

// Convert entire inputs object
export const convertInputs = (
  inputs: FracInputs, 
  fromSys: UnitSystem, 
  toSys: UnitSystem
): FracInputs => {
  const newInputs = { ...inputs };
  (Object.keys(inputs) as Array<keyof FracInputs>).forEach(key => {
    newInputs[key] = convertValue(inputs[key], PARAM_UNIT_MAP[key], fromSys, toSys);
  });
  return newInputs;
};

// Helper to get label for a parameter
export const getUnitLabel = (param: keyof FracInputs, system: UnitSystem): string => {
  return UNIT_CONFIG[system][PARAM_UNIT_MAP[param]].label;
};

// Helper to get generic label
export const getLabel = (category: keyof typeof UNIT_CONFIG['SI'], system: UnitSystem): string => {
  return UNIT_CONFIG[system][category].label;
};
