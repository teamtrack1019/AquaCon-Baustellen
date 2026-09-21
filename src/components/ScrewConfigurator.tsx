import React, { useState } from 'react';
import { Wrench, Check, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { MaterialCategory } from '../types';

interface ScrewConfiguratorProps {
  onSelectScrew: (screw: {
    name: string;
    category: MaterialCategory;
    quantity: number;
    unit: 'Stk.';
    notes?: string;
  }) => void;
  defaultCategory?: 'Verzinkte Schrauben' | 'VA Schrauben';
}

const THREAD_LENGTHS: Record<string, number[]> = {
  M12: [40, 50, 60, 70, 80, 90, 100, 110, 120],
  M16: [40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130, 140, 150, 160, 180, 200],
  M20: [60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130, 140, 150, 160, 180, 200, 220, 240],
  M24: [80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200, 220, 240, 260]
};

const FLANGE_PRESETS = [
  { label: 'DA 50 / 63', dn: 'DN 40/50', metric: 'M16', length: 70, count: 4 },
  { label: 'DA 75', dn: 'DN 65', metric: 'M16', length: 75, count: 4 },
  { label: 'DA 90 / 110 / 125', dn: 'DN 80/100', metric: 'M16', length: 80, count: 8 },
  { label: 'DA 140', dn: 'DN 125', metric: 'M16', length: 85, count: 8 },
  { label: 'DA 160 / 180', dn: 'DN 150', metric: 'M20', length: 90, count: 8 },
  { label: 'DA 200 / 225', dn: 'DN 200', metric: 'M20', length: 100, count: 8 },
  { label: 'DA 250 / 280', dn: 'DN 250', metric: 'M20', length: 110, count: 12 },
  { label: 'DA 315', dn: 'DN 300', metric: 'M20', length: 120, count: 12 },
  { label: 'DA 355 / 400', dn: 'DN 350/400', metric: 'M24', length: 140, count: 16 }
];

export const ScrewConfigurator: React.FC<ScrewConfiguratorProps> = ({
  onSelectScrew,
  defaultCategory = 'Verzinkte Schrauben'
}) => {
  const [materialType, setMaterialType] = useState<'vz' | 'va'>(
    defaultCategory === 'VA Schrauben' ? 'va' : 'vz'
  );
  const [thread, setThread] = useState<'M12' | 'M16' | 'M20' | 'M24'>('M16');
  const [length, setLength] = useState<number>(80);
  const [quantity, setQuantity] = useState<number>(8);

  const availableLengths = THREAD_LENGTHS[thread] || THREAD_LENGTHS.M16;

  // Auto adjust length if not in selected thread
  const validLength = availableLengths.includes(length) ? length : availableLengths[0];

  const category: MaterialCategory = materialType === 'vz' ? 'Verzinkte Schrauben' : 'VA Schrauben';
  const screwName = materialType === 'vz'
    ? `Schraubensatz verzinkt ${thread} x ${validLength}`
    : `Schraubensatz VA ${thread} x ${validLength}`;
  const notes = `${materialType === 'vz' ? 'Verzinkt' : 'Edelstahl VA (A4)'} ${thread} x ${validLength} mm (inkl. Mutter & 2 U-Scheiben)`;

  const handleApply = () => {
    onSelectScrew({
      name: screwName,
      category,
      quantity: quantity > 0 ? quantity : 1,
      unit: 'Stk.',
      notes
    });
  };

  const applyPreset = (preset: typeof FLANGE_PRESETS[0]) => {
    setThread(preset.metric as any);
    setLength(preset.length);
    setQuantity(preset.count);
  };

  return (
    <div className="bg-slate-900 border border-sky-500/40 rounded-2xl p-4 text-slate-100 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>🔩 Schraubensatz-Konfigurator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Inkl. Mutter & 2 Scheiben
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Passende Metrik, Länge und Stückzahl direkt zusammenstellen
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Material Type */}
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          1. Material / Ausführung:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMaterialType('vz')}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              materialType === 'vz'
                ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-300" />
            <span>Verzinkt (Stahl 8.8)</span>
          </button>

          <button
            type="button"
            onClick={() => setMaterialType('va')}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              materialType === 'va'
                ? 'bg-teal-600 border-teal-400 text-white shadow-md shadow-teal-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>VA (Edelstahl A4)</span>
          </button>
        </div>
      </div>

      {/* Step 2: Thread Diameter */}
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          2. Gewindedurchmesser (Metrik):
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['M12', 'M16', 'M20', 'M24'] as const).map(t => (
            <button
              type="button"
              key={t}
              onClick={() => {
                setThread(t);
                const lengths = THREAD_LENGTHS[t];
                if (!lengths.includes(length)) {
                  setLength(lengths[0]);
                }
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold font-mono text-center transition-all ${
                thread === t
                  ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Screw Length */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-300">
            3. Schraubenlänge ({thread}):
          </label>
          <span className="text-xs font-mono font-bold text-sky-400">
            {validLength} mm
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
          {availableLengths.map(l => (
            <button
              type="button"
              key={l}
              onClick={() => setLength(l)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                validLength === l
                  ? 'bg-teal-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {l} mm
            </button>
          ))}
        </div>
      </div>

      {/* Flange Quick Helper Presets */}
      <div>
        <label className="block text-[11px] font-bold text-slate-400 mb-1">
          ⚡ Schnellauswahl nach Flanschmaß (DA):
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FLANGE_PRESETS.map((p, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => applyPreset(p)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] text-slate-300 hover:text-white font-medium transition"
            >
              <strong>{p.label}</strong> ({p.count}x {p.metric}x{p.length})
            </button>
          ))}
        </div>
      </div>

      {/* Step 4: Quantity & Live Result Confirmation */}
      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-300 whitespace-nowrap">
            Menge:
          </label>
          <div className="flex items-center space-x-1">
            {[4, 8, 12, 16, 24].map(q => (
              <button
                type="button"
                key={q}
                onClick={() => setQuantity(q)}
                className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  quantity === q ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {q}
              </button>
            ))}
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-medium">Stk.</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20 transition flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{quantity}x {screwName} übernehmen</span>
        </button>
      </div>
    </div>
  );
};
