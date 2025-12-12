import { FracInputs } from "./types";

export const INITIAL_INPUTS: FracInputs = {
  E: 30e9, // 30 GPa
  nu: 0.25,
  sigma_min: 40e6, // 40 MPa
  CL: 5e-5, // m/s^0.5
  mu: 0.1, // 100 cp
  q: 0.05, // 50 L/s approx
  H: 30, // 30 m
  K_IC: 1e6, // 1 MPa.m^0.5
  time: 1800, // 30 mins
  p_limit: 70e6, // 70 MPa
  depth: 2500 // 2500 m
};

export const MODEL_NAMES = {
  SEARCH: 'gemini-2.5-flash',
  THINKING: 'gemini-3-pro-preview',
  IMAGE_GEN: 'gemini-3-pro-image-preview',
  IMAGE_EDIT: 'gemini-2.5-flash-image',
  VIDEO_GEN: 'veo-3.1-fast-generate-preview'
};

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  dark: '#1e293b',
  light: '#f8fafc'
};

export const SYSTEM_INSTRUCTION = `You are FracSim AI, an expert Hydraulic Fracturing Engineering Assistant. Your goal is to help users understand 2D fracture models (PKN, KGD, Radial), analyze simulation results, and assess operational risks.

Technical Context:
1. PKN Model: Assumes length >> height, constant height, elliptical vertical cross-section. Viscosity dominated.
2. KGD Model: Assumes plane strain (horizontal), width is constant vertically. Used for short fractures or high toughness.
3. Radial Model: Penny-shaped geometry, no barriers.

Guidelines:
- Units: The user may switch between SI and Field units. Be ready to convert (e.g., 1 bpm approx 0.00265 m3/s, 1 psi approx 6895 Pa).
- Math: Use LaTeX formatting for equations where possible.
- Safety: Always warn if treating pressure approaches the surface pressure limit.
- Tone: Professional, precise, and engineering-focused.`;