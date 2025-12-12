import React from 'react';
import { FracInputs, ModelType, UnitSystem } from '../types';
import { getUnitLabel } from '../utils/unitConversion';

interface InputsFormProps {
  inputs: FracInputs;
  selectedModel: ModelType;
  unitSystem: UnitSystem;
  onChange: (inputs: FracInputs) => void;
  onModelChange: (model: ModelType) => void;
  onUnitChange: (system: UnitSystem) => void;
}

const InputGroup = ({ label, children }: { label: string, children?: React.ReactNode }) => (
  <div className="flex flex-col mb-3">
    <label className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const NumberInput = ({ 
  label, 
  value, 
  unit, 
  onChange 
}: { 
  label: string, 
  value: number, 
  unit: string, 
  onChange: (val: number) => void 
}) => (
  <div className="flex items-center justify-between bg-slate-800 p-2 rounded mb-2 border border-slate-700">
    <span className="text-sm text-slate-200">{label}</span>
    <div className="flex items-center">
      <input 
        type="number" 
        className="bg-transparent text-right text-emerald-400 font-mono w-24 focus:outline-none focus:border-b border-emerald-500 mr-2"
        value={value}
        // Use step "any" to handle small decimals
        step="any"
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="text-xs text-slate-500 w-16 text-right">{unit}</span>
    </div>
  </div>
);

export const InputsForm: React.FC<InputsFormProps> = ({ 
  inputs, 
  selectedModel, 
  unitSystem, 
  onChange, 
  onModelChange, 
  onUnitChange 
}) => {
  
  const update = (field: keyof FracInputs, value: number) => {
    onChange({ ...inputs, [field]: value });
  };

  const getU = (field: keyof FracInputs) => getUnitLabel(field, unitSystem);

  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow-lg border border-slate-700 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Model Inputs</h2>
      
      <div className="flex gap-2 mb-4">
        <div className="w-1/2">
            <label className="text-xs font-semibold text-gray-400 mb-1 block">MODEL</label>
            <select 
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value as ModelType)}
                className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm"
            >
                {Object.values(ModelType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div className="w-1/2">
            <label className="text-xs font-semibold text-gray-400 mb-1 block">UNITS</label>
            <select 
                value={unitSystem}
                onChange={(e) => onUnitChange(e.target.value as UnitSystem)}
                className="w-full bg-slate-800 text-white p-2 rounded border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
            >
                {Object.values(UnitSystem).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
        </div>
      </div>

      <InputGroup label="Rock Properties">
        <NumberInput label="Young's Mod (E)" value={inputs.E} unit={getU('E')} onChange={v => update('E', v)} />
        <NumberInput label="Poisson's Ratio" value={inputs.nu} unit={getU('nu')} onChange={v => update('nu', v)} />
        <NumberInput label="Min Stress" value={inputs.sigma_min} unit={getU('sigma_min')} onChange={v => update('sigma_min', v)} />
        <NumberInput label="Toughness" value={inputs.K_IC} unit={getU('K_IC')} onChange={v => update('K_IC', v)} />
        <NumberInput label="Leakoff Coeff" value={inputs.CL} unit={getU('CL')} onChange={v => update('CL', v)} />
      </InputGroup>

      <InputGroup label="Fluid & Pump">
        <NumberInput label="Viscosity (μ)" value={inputs.mu} unit={getU('mu')} onChange={v => update('mu', v)} />
        <NumberInput label="Rate (q)" value={inputs.q} unit={getU('q')} onChange={v => update('q', v)} />
        <NumberInput label="Total Time" value={inputs.time} unit={getU('time')} onChange={v => update('time', v)} />
      </InputGroup>

      <InputGroup label="Geometry & Constraints">
        <NumberInput label="Frac Height (H)" value={inputs.H} unit={getU('H')} onChange={v => update('H', v)} />
        <NumberInput label="Pressure Limit" value={inputs.p_limit} unit={getU('p_limit')} onChange={v => update('p_limit', v)} />
      </InputGroup>
    </div>
  );
};