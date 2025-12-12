import React from 'react';
import { FracInputs, ModelResult, SensitivityData, UnitSystem } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { convertValue, getLabel } from '../utils/unitConversion';

interface Props {
  inputs: FracInputs;
  result: ModelResult;
  sensitivity: SensitivityData[];
  unitSystem: UnitSystem;
}

export const ResultsDashboard: React.FC<Props> = ({ inputs, result, sensitivity, unitSystem }) => {
  const pLimitHit = result.p_well > inputs.p_limit; // inputs are in Display units, result.p_well is SI
  // Wait! App passes converted Inputs (SI) to calculator, but InputsForm updates Inputs state in Display units.
  // We need to compare carefully.
  // Actually, p_well in result is SI. inputs.p_limit is Display units.
  // We must convert p_well to display units to compare with inputs.p_limit, OR convert inputs.p_limit to SI.
  // Let's standardise: Convert everything to Display units for this dashboard.
  
  const toDisplay = (val: number, cat: any) => convertValue(val, cat, UnitSystem.SI, unitSystem);
  
  const p_well_disp = toDisplay(result.p_well, 'pressure');
  const p_net_disp = toDisplay(result.p_net, 'pressure');
  const len_disp = toDisplay(result.length, 'length');
  const w_max_disp = toDisplay(result.width_max, 'width'); // uses width units (mm or in)
  const w_avg_disp = toDisplay(result.width_avg, 'width');
  
  // Format data for Recharts
  const historyData = result.timeSeries.map(ts => ({
    time: parseFloat(toDisplay(ts.time, 'time').toFixed(1)),
    Length: parseFloat(toDisplay(ts.length, 'length').toFixed(1)),
    Width: parseFloat(toDisplay(ts.width, 'width').toFixed(3)),
    Pressure: parseFloat(toDisplay(ts.pressure, 'pressure').toFixed(1))
  }));

  const profileData = result.profile.map(p => ({
    x: parseFloat(toDisplay(p.position, 'length').toFixed(1)),
    w: parseFloat(toDisplay(p.width, 'width').toFixed(3))
  }));

  const uLen = getLabel('length', unitSystem);
  const uWidth = getLabel('width', unitSystem);
  const uPress = getLabel('pressure', unitSystem);
  const uTime = getLabel('time', unitSystem);

  // Check limits in display units
  const isLimitHit = p_well_disp > inputs.p_limit;

  const exportJson = () => {
    const data = {
      timestamp: new Date().toISOString(),
      unitSystem,
      inputs,
      result_SI: result,
      sensitivity
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fracture_${result.type.toLowerCase()}_results.json`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
      
      {/* Main Single Model Summary */}
      <div className={`p-6 rounded-lg border shadow-xl ${isLimitHit ? 'bg-red-900/10 border-red-500/50' : 'bg-slate-800 border-slate-700'}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{result.type} Model Results</h2>
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded border border-blue-700">Regime: {result.regime}</span>
              <span className={`px-2 py-1 rounded border ${isLimitHit ? 'bg-red-900 text-red-200 border-red-700' : 'bg-emerald-900 text-emerald-200 border-emerald-700'}`}>
                Status: {isLimitHit ? 'Pressure Limit Exceeded' : 'Safe Operation'}
              </span>
            </div>
          </div>
          <button onClick={exportJson} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded text-sm transition">
            Export JSON
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-300">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Fracture Geometry</div>
            <div className="text-2xl font-mono text-white mt-1">{len_disp.toFixed(1)} <span className="text-base text-slate-500">{uLen}</span></div>
            <div className="text-xs">Length (or Radius)</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Max Width</div>
            <div className="text-2xl font-mono text-white mt-1">{w_max_disp.toFixed(3)} <span className="text-base text-slate-500">{uWidth}</span></div>
            <div className="text-xs">Avg: {w_avg_disp.toFixed(3)} {uWidth}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Treating Pressure</div>
            <div className={`text-2xl font-mono mt-1 ${isLimitHit ? 'text-red-400' : 'text-emerald-400'}`}>
              {p_well_disp.toFixed(0)} <span className="text-base text-slate-500">{uPress}</span>
            </div>
            <div className="text-xs">Net: {p_net_disp.toFixed(0)} {uPress}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Efficiency</div>
            <div className="text-2xl font-mono text-white mt-1">{(result.efficiency * 100).toFixed(1)} <span className="text-base text-slate-500">%</span></div>
            <div className="text-xs">Vol: {result.volume_injected.toFixed(0)} m³ (SI)</div>
          </div>
        </div>
        
        {result.warnings.length > 0 && (
           <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700/50 rounded text-sm text-orange-200">
             {result.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
           </div>
        )}
      </div>

      {/* Figures Grid */}
      <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Figures ({unitSystem})</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Length vs Time */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700 h-64">
          <h4 className="text-xs text-slate-400 mb-2 uppercase text-center">Length Propagation</h4>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorLen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} label={{ value: uTime, position: 'insideBottomRight', offset: -5, fill: '#64748b' }}/>
              <YAxis stroke="#94a3b8" fontSize={12} width={40}/>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="Length" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLen)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Width vs Time */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700 h-64">
           <h4 className="text-xs text-slate-400 mb-2 uppercase text-center">Width Evolution (Wellbore)</h4>
           <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={historyData}>
               <defs>
                <linearGradient id="colorWidth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} label={{ value: uTime, position: 'insideBottomRight', offset: -5, fill: '#64748b' }}/>
              <YAxis stroke="#94a3b8" fontSize={12} width={40}/>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="Width" stroke="#10b981" fillOpacity={1} fill="url(#colorWidth)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pressure vs Time */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700 h-64">
           <h4 className="text-xs text-slate-400 mb-2 uppercase text-center">Net Pressure History ({uPress})</h4>
           <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorPress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} label={{ value: uTime, position: 'insideBottomRight', offset: -5, fill: '#64748b' }}/>
              <YAxis stroke="#94a3b8" fontSize={12} width={50}/>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="Pressure" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPress)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Width Profile */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700 h-64">
           <h4 className="text-xs text-slate-400 mb-2 uppercase text-center">Final Width Profile</h4>
           <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={profileData}>
              <defs>
                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="x" stroke="#94a3b8" fontSize={12} label={{ value: `Distance (${uLen})`, position: 'insideBottomRight', offset: -5, fill: '#64748b' }}/>
              <YAxis stroke="#94a3b8" fontSize={12} width={40} label={{ value: `Width (${uWidth})`, angle: -90, position: 'insideLeft', fill: '#64748b' }}/>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="w" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProf)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Sensitivity Table */}
      <div className="bg-slate-800 rounded border border-slate-700 p-4">
        <h4 className="text-white font-bold mb-3">Sensitivity Analysis (Impact on Length)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-700">
              <tr>
                <th className="px-4 py-2">Parameter</th>
                <th className="px-4 py-2">Change</th>
                <th className="px-4 py-2">Length %</th>
                <th className="px-4 py-2">Width %</th>
                <th className="px-4 py-2">Pressure %</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.filter((_, i) => i < 8).map((row, idx) => (
                <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-2 font-mono">{row.parameter}</td>
                  <td className="px-4 py-2">{row.factor}x</td>
                  <td className={`px-4 py-2 ${row.L_change > 0 ? 'text-green-400' : 'text-red-400'}`}>{row.L_change > 0 ? '+' : ''}{row.L_change.toFixed(1)}%</td>
                  <td className="px-4 py-2">{row.w_change > 0 ? '+' : ''}{row.w_change.toFixed(1)}%</td>
                  <td className="px-4 py-2">{row.p_change > 0 ? '+' : ''}{row.p_change.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};