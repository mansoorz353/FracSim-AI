import React, { useState, useEffect } from 'react';
import { InputsForm } from './components/InputsForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { AIAssistant } from './components/AIAssistant';
import { FracInputs, ModelResult, ModelType, UnitSystem } from './types';
import { INITIAL_INPUTS } from './constants';
import { calculatePKN, calculateKGD, calculateRadial, runSensitivity } from './services/fractureService';
import { convertInputs } from './utils/unitConversion';

export default function App() {
  const [inputs, setInputs] = useState<FracInputs>(INITIAL_INPUTS);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.PKN);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(UnitSystem.SI);
  const [result, setResult] = useState<ModelResult | null>(null);
  const [sensitivity, setSensitivity] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'simulation' | 'ai'>('simulation');

  // Handle Unit Change
  const handleUnitChange = (newSystem: UnitSystem) => {
    // Convert current inputs from old system to new system so numbers change
    const converted = convertInputs(inputs, unitSystem, newSystem);
    setInputs(converted);
    setUnitSystem(newSystem);
  };

  // Recalculate whenever inputs, model, or unitSystem changes
  useEffect(() => {
    // Ensure we calculate using SI units
    const siInputs = convertInputs(inputs, unitSystem, UnitSystem.SI);

    let res: ModelResult;
    switch (selectedModel) {
      case ModelType.KGD:
        res = calculateKGD(siInputs);
        break;
      case ModelType.RADIAL:
        res = calculateRadial(siInputs);
        break;
      case ModelType.PKN:
      default:
        res = calculatePKN(siInputs);
        break;
    }
    
    setResult(res);
    
    // Sensitivity runs on the SI result
    const sens = runSensitivity(siInputs, res);
    setSensitivity(sens);

  }, [inputs, selectedModel, unitSystem]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-lg font-bold">F</div>
          <h1 className="text-xl font-bold tracking-tight">FracSim AI</h1>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setActiveTab('simulation')}
             className={`px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'simulation' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             Engineering Model
           </button>
           <button 
             onClick={() => setActiveTab('ai')}
             className={`px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'ai' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             AI Assistant
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* Simulation View */}
        <div className={`absolute inset-0 flex flex-col md:flex-row transition-opacity duration-300 ${activeTab === 'simulation' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="w-full md:w-1/3 lg:w-1/4 h-full p-2">
            <InputsForm 
                inputs={inputs} 
                selectedModel={selectedModel}
                unitSystem={unitSystem}
                onChange={setInputs} 
                onModelChange={setSelectedModel}
                onUnitChange={handleUnitChange}
            />
          </div>
          <div className="w-full md:w-2/3 lg:w-3/4 h-full p-2">
            {result && (
                <ResultsDashboard 
                    inputs={inputs} 
                    result={result} 
                    sensitivity={sensitivity} 
                    unitSystem={unitSystem}
                />
            )}
          </div>
        </div>

        {/* AI Assistant View */}
        <div className={`absolute inset-0 flex justify-center transition-opacity duration-300 ${activeTab === 'ai' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
           <div className="w-full max-w-4xl h-full shadow-2xl">
             <AIAssistant />
           </div>
        </div>

      </main>
    </div>
  );
}