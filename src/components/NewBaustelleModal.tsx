import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Waves, Home, X, Plus } from 'lucide-react';
import { AreaType, Area } from '../types';

interface NewBaustelleModalProps {
  onClose: () => void;
  onCreated: (newBaustelleId: string) => void;
}

export const NewBaustelleModal: React.FC<NewBaustelleModalProps> = ({ onClose, onCreated }) => {
  const { lang, t, addBaustelle, addArea } = useApp();

  const [name, setName] = useState('');
  const [projectNumber, setProjectNumber] = useState(`AQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [address, setAddress] = useState('');
  const [client, setClient] = useState('');
  const [manager, setManager] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  // Default areas to automatically create
  const [includeSchwimmer, setIncludeSchwimmer] = useState(true);
  const [includeNichtschwimmer, setIncludeNichtschwimmer] = useState(true);
  const [includePlansch, setIncludePlansch] = useState(true);
  const [includeTechnikraum, setIncludeTechnikraum] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initialAreas: Area[] = [];

    if (includeSchwimmer) {
      initialAreas.push({
        id: `area-${Date.now()}-1`,
        name: 'Schwimmerbecken',
        type: 'schwimmerbecken',
        description: 'Hauptbecken',
        materials: []
      });
    }

    if (includeNichtschwimmer) {
      initialAreas.push({
        id: `area-${Date.now()}-2`,
        name: 'Nichtschwimmerbecken',
        type: 'nichtschwimmerbecken',
        description: 'Lehrschwimmbecken',
        materials: []
      });
    }

    if (includePlansch) {
      initialAreas.push({
        id: `area-${Date.now()}-3`,
        name: 'Planschbecken / Kinderbereich',
        type: 'planschbecken',
        description: 'Kinder- & Kleinkinderbereich',
        materials: []
      });
    }

    if (includeTechnikraum) {
      initialAreas.push({
        id: `area-${Date.now()}-4`,
        name: 'Technikraum',
        type: 'technikraum',
        description: 'Filter- & Pumpentechnik',
        materials: []
      });
    }

    const newId = addBaustelle({
      name: name.trim(),
      projectNumber: projectNumber.trim(),
      address: address.trim() || 'Adresse wird nachgereicht',
      client: client.trim() || 'Auftraggeber',
      manager: manager.trim() || 'Bauleiter',
      status: 'active',
      startDate,
      targetDate: targetDate || 'Offen',
      notes: notes.trim() || undefined,
      areas: initialAreas
    });

    onCreated(newId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-slate-900 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Projekt-Anlage</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Neue Baustelle anlegen
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Baustellen-Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="z. B. Freibad Stadtpark, Villa Müller..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.projectNumber} *</label>
              <input
                type="text"
                required
                value={projectNumber}
                onChange={e => setProjectNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">{t.address}</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="z. B. Leopoldstraße 45, 80802 München"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.client}</label>
              <input
                type="text"
                value={client}
                onChange={e => setClient(e.target.value)}
                placeholder="z. B. Stadtwerke / Privatkunde"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.manager}</label>
              <input
                type="text"
                value={manager}
                onChange={e => setManager(e.target.value)}
                placeholder="z. B. Vorarbeiter / Bauleiter"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.startDate}</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.targetDate}</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Pool Templates */}
          <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-100 space-y-2">
            <span className="font-bold text-sky-950 block">
              🏊 Standard-Bereiche direkt anlegen:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-sky-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSchwimmer}
                  onChange={e => setIncludeSchwimmer(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">🏊 {t.typeSchwimmer}</span>
              </label>

              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-sky-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNichtschwimmer}
                  onChange={e => setIncludeNichtschwimmer(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">🏊‍♂️ {t.typeNichtschwimmer}</span>
              </label>

              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-sky-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePlansch}
                  onChange={e => setIncludePlansch(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">👶 {t.typePlansch}</span>
              </label>

              <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-sky-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTechnikraum}
                  onChange={e => setIncludeTechnikraum(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">⚙️ Technikraum</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notizen / Projektbeschreibung</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Besonderheiten, Zufahrt, Ansprechpartner..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/25 transition-all"
            >
              Baustelle anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
