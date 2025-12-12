import { FracInputs, ModelResult, ModelType, SensitivityData, TimeStep, ProfilePoint } from "../types";

// Helper: Plane Strain Modulus
const getEPrime = (E: number, nu: number) => E / (1 - Math.pow(nu, 2));

// Helper: Regime check
const checkRegime = (
  type: ModelType,
  E_prime: number,
  mu: number,
  q: number,
  K_IC: number,
  R_or_L: number,
  H: number
): 'Viscosity' | 'Toughness' => {
  const toughnessScore = K_IC / (mu * q * 1e6); 
  return toughnessScore > 100 ? 'Toughness' : 'Viscosity';
};

// Generic generator for time history
const generateHistory = (
  totalTime: number, 
  calcAtTime: (t: number) => { L: number, w: number, p: number }
): TimeStep[] => {
  const steps = 50;
  const history: TimeStep[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = (totalTime / steps) * i;
    const res = calcAtTime(t);
    history.push({
      time: t,
      length: res.L,
      width: res.w,
      pressure: res.p
    });
  }
  return history;
};

// Generic generator for profile
const generateProfile = (
  L: number, 
  w_max: number,
  shapeExponent: number // 0.5 for ellipse, 0.25 for PKN Nordgren approx
): ProfilePoint[] => {
  const points = 50;
  const profile: ProfilePoint[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (L / points) * i;
    // Normalized position 0 to 1
    const x_norm = x / L;
    // w(x) = w_max * (1 - x/L)^exp or (1 - (x/L)^2)^exp depending on model
    // Simple Power Law approximation for visualization
    const w = w_max * Math.pow(1 - x_norm, shapeExponent);
    profile.push({ position: x, width: w });
  }
  return profile;
};


// PKN Model
export const calculatePKN = (inputs: FracInputs): ModelResult => {
  const { E, nu, mu, q, H, time, CL, sigma_min } = inputs;
  const Ep = getEPrime(E, nu);
  
  const solvePKN = (t: number) => {
    const L_no_leakoff = 0.68 * Math.pow((Math.pow(q, 3) * Ep) / (mu * Math.pow(H, 4)), 0.2) * Math.pow(t, 0.8);
    const L_high_leakoff = (q * Math.sqrt(t)) / (2 * Math.PI * CL * H);
    const L = 1 / (1/L_no_leakoff + 1/L_high_leakoff);
    const p_net = 2.5 * Math.pow((mu * q * L) / Math.pow(H, 4), 0.25) * Math.pow(Ep, 0.75);
    const w_max = (3 * p_net * H) / Ep; // Approx factor 3 for center width
    return { L, p: p_net, w: w_max };
  };

  const final = solvePKN(time);
  const w_avg = (Math.PI / 4) * final.w * 0.8;
  const Vi = q * time;
  const V_frac = final.L * H * w_avg * 2; 

  return {
    type: ModelType.PKN,
    length: final.L,
    width_avg: w_avg,
    width_max: final.w,
    p_net: final.p,
    p_well: sigma_min + final.p,
    efficiency: Math.min(1, V_frac / Vi),
    volume_injected: Vi,
    volume_leakoff: Vi - V_frac,
    regime: checkRegime(ModelType.PKN, Ep, mu, q, inputs.K_IC, final.L, H),
    warnings: final.L < 2 * H ? ["L < 2H: PKN assumption violated (Short fracture)."] : [],
    timeSeries: generateHistory(time, solvePKN),
    profile: generateProfile(final.L, final.w, 0.25) // Nordgren-like profile
  };
};

// KGD Model
export const calculateKGD = (inputs: FracInputs): ModelResult => {
  const { E, nu, mu, q, H, time, CL, sigma_min } = inputs;
  const Ep = getEPrime(E, nu);

  const solveKGD = (t: number) => {
    const L_no_leakoff = 0.48 * Math.pow((Ep * Math.pow(q, 3)) / (mu * Math.pow(H, 3)), 1/6) * Math.pow(t, 2/3);
    const L_high_leakoff = (q * Math.sqrt(t)) / (2 * Math.PI * CL * H);
    const L = 1 / (1/L_no_leakoff + 1/L_high_leakoff);
    const w_max = 1.32 * Math.pow((mu * q * Math.pow(L, 2)) / (Ep * H), 0.25);
    const p_net = (Ep * w_max) / (4 * L);
    return { L, p: p_net, w: w_max };
  };

  const final = solveKGD(time);
  const w_avg = (Math.PI / 4) * final.w;
  const Vi = q * time;
  const V_frac = 2 * final.L * H * w_avg;

  return {
    type: ModelType.KGD,
    length: final.L,
    width_avg: w_avg,
    width_max: final.w,
    p_net: final.p,
    p_well: sigma_min + final.p,
    efficiency: Math.min(1, V_frac / Vi),
    volume_injected: Vi,
    volume_leakoff: Vi - V_frac,
    regime: checkRegime(ModelType.KGD, Ep, mu, q, inputs.K_IC, final.L, H),
    warnings: final.L > H ? ["L > H: KGD assumption violated (Long fracture)."] : [],
    timeSeries: generateHistory(time, solveKGD),
    profile: generateProfile(final.L, final.w, 0.5) // Elliptical profile
  };
};

// Radial Model
export const calculateRadial = (inputs: FracInputs): ModelResult => {
  const { E, nu, mu, q, time, CL, sigma_min } = inputs;
  const Ep = getEPrime(E, nu);

  const solveRadial = (t: number) => {
    const R_no_leakoff = 0.52 * Math.pow((Ep * Math.pow(q, 3)) / mu, 1/9) * Math.pow(t, 4/9);
    const R_high_leakoff = Math.sqrt(q * Math.sqrt(t) / (Math.PI * Math.PI * CL));
    const R = 1 / (1/R_no_leakoff + 1/R_high_leakoff);
    const p_net = 1.25 * Math.pow( (mu * q * Math.pow(Ep, 2)) / Math.pow(R, 3), 0.25 );
    const w_max = (8 * p_net * R) / (Math.PI * Ep);
    return { L: R, p: p_net, w: w_max };
  };

  const final = solveRadial(time);
  const w_avg = 2/3 * final.w;
  const Vi = q * time;
  const V_frac = (Math.PI * final.L * final.L) * w_avg;

  return {
    type: ModelType.RADIAL,
    length: final.L,
    width_avg: w_avg,
    width_max: final.w,
    p_net: final.p,
    p_well: sigma_min + final.p,
    efficiency: Math.min(1, V_frac / Vi),
    volume_injected: Vi,
    volume_leakoff: Vi - V_frac,
    regime: checkRegime(ModelType.RADIAL, Ep, mu, q, inputs.K_IC, final.L, 0),
    warnings: [],
    timeSeries: generateHistory(time, solveRadial),
    profile: generateProfile(final.L, final.w, 0.5) // Elliptical profile
  };
};

export const runSensitivity = (inputs: FracInputs, baseResult: ModelResult): SensitivityData[] => {
  const params: (keyof FracInputs)[] = ['mu', 'q', 'sigma_min', 'CL'];
  const results: SensitivityData[] = [];
  const calcFn = baseResult.type === ModelType.PKN ? calculatePKN : 
                 baseResult.type === ModelType.KGD ? calculateKGD : calculateRadial;

  params.forEach(param => {
    [0.5, 2.0].forEach(factor => {
      const newInputs = { ...inputs, [param]: inputs[param] * factor };
      const res = calcFn(newInputs);
      
      results.push({
        parameter: param,
        factor,
        L_change: ((res.length - baseResult.length) / baseResult.length) * 100,
        w_change: ((res.width_avg - baseResult.width_avg) / baseResult.width_avg) * 100,
        p_change: ((res.p_net - baseResult.p_net) / baseResult.p_net) * 100
      });
    });
  });

  return results;
};