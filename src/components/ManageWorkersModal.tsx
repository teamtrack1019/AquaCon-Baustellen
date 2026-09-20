import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Users, UserPlus, Trash2, Edit2, X, Check, Phone, Briefcase, ShieldCheck } from 'lucide-react';
import { WorkerProfile } from '../types';

interface ManageWorkersModalProps {
  onClose: () => void;
}

export const ManageWorkersModal: React.FC<ManageWorkersModalProps> = ({ onClose }) => {
  const { workers, addWorker, updateWorker, deleteWorker } = useApp();

  const [newName, setNewName] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('Monteur');
  const [newPhone, setNewPhone] = useState('');
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addWorker({
      name: newName.trim(),
      roleTitle: newRoleTitle.trim() || 'Monteur',
      phone: newPhone.trim() || undefined
    });

    setNewName('');
    setNewRoleTitle('Monteur');
    setNewPhone('');
  };

  const handleStartEdit = (worker: WorkerProfile) => {
    setEditingWorkerId(worker.id);
    setEditName(worker.name);
    setEditRoleTitle(worker.roleTitle || 'Monteur');
    setEditPhone(worker.phone || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkerId || !editName.trim()) return;

    updateWorker(editingWorkerId, {
      name: editName.trim(),
      roleTitle: editRoleTitle.trim() || 'Monteur',
      phone: editPhone.trim() || undefined
    });

    setEditingWorkerId(null);
  };

  const handleDelete = (id: string) => {
    deleteWorker(id);
    setShowDeleteConfirmId(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 text-slate-900 max-h-[88dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                Admin-Verwaltung
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Mitarbeiter (Monteure) verwalten
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs">
          {/* Add New Worker Form */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="font-bold text-slate-800 text-sm mb-3 flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-sky-600" />
              <span>Neuen Mitarbeiter anlegen</span>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Name / Vorname *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="z. B. Hakan, Alex, Mehmet..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Position / Rolle</label>
                  <input
                    type="text"
                    value={newRoleTitle}
                    onChange={e => setNewRoleTitle(e.target.value)}
                    placeholder="z. B. Monteur, Vorarbeiter"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefon / Mobil (optional)</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="z. B. 0176 / 12345678"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Mitarbeiter hinzufügen</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Workers List */}
          <div>
            <div className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
              <span>Aktive Mitarbeiter ({workers.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Mitarbeiter können sich vor Ort auf dem Smartphone auswählen
              </span>
            </div>

            <div className="space-y-2">
              {workers.map(worker => {
                const isEditing = editingWorkerId === worker.id;

                if (isEditing) {
                  return (
                    <form
                      key={worker.id}
                      onSubmit={handleSaveEdit}
                      className="p-3 bg-sky-50/70 border border-sky-300 rounded-2xl space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={editRoleTitle}
                          onChange={e => setEditRoleTitle(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Position"
                        />
                      </div>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Telefon"
                      />
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingWorkerId(null)}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Speichern</span>
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={worker.id}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-2xs">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center space-x-2">
                          <span>{worker.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-3 mt-0.5">
                          {worker.roleTitle && (
                            <span className="flex items-center space-x-1">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              <span>{worker.roleTitle}</span>
                            </span>
                          )}
                          {worker.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{worker.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStartEdit(worker)}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {showDeleteConfirmId === worker.id ? (
                        <div className="flex items-center space-x-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                          <button
                            onClick={() => handleDelete(worker.id)}
                            className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold"
                          >
                            Löschen
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirmId(null)}
                            className="px-1.5 py-1 text-slate-500 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirmId(worker.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-between text-xs shrink-0 bg-slate-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mitarbeiter live synchronisiert</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Fertig / Schließen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
