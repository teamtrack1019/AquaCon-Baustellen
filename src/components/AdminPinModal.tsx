import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, KeyRound, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'unlock' | 'change';
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'unlock'
}) => {
  const { setRole, adminPin, updateAdminPin, verifyAdminPin } = useApp();
  const [mode, setMode] = useState<'unlock' | 'change'>(initialMode);
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Change PIN fields
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setInputPin('');
      setError('');
      setSuccessMsg('');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleUnlockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPin) {
      setError('Bitte geben Sie die PIN ein.');
      return;
    }

    if (verifyAdminPin(inputPin)) {
      setError('');
      setRole('admin');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError('Falsche PIN! Bitte erneut versuchen.');
      setInputPin('');
      inputRef.current?.focus();
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verifyAdminPin(currentPin)) {
      setError('Aktuelle PIN ist nicht korrekt.');
      return;
    }

    if (newPin.length < 4) {
      setError('Die neue PIN muss mindestens 4 Zeichen lang sein.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Die neuen PINs stimmen nicht überein.');
      return;
    }

    updateAdminPin(newPin);
    setSuccessMsg('Admin-PIN erfolgreich geändert!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'unlock' ? (
          <div>
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="p-3.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">
                  Admin-Bereich geschützt
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Bitte geben Sie die 4-stellige Admin-PIN ein, um administrative Funktionen freizuschalten.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={12}
                  value={inputPin}
                  onChange={e => {
                    setInputPin(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="PIN eingeben (z. B. 0000)"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-center text-2xl tracking-[0.3em] font-mono py-3.5 px-4 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95"
                >
                  Freischalten
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* Change PIN Mode */}
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="p-3.5 bg-gradient-to-tr from-sky-600 to-indigo-500 text-white rounded-2xl shadow-lg shadow-sky-500/20">
                <KeyRound className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">
                  Admin-PIN ändern
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Legen Sie eine neue PIN für den Admin-Bereich fest.
                </p>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Aktuelle PIN
                </label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  placeholder="Aktuelle PIN"
                  className="w-full bg-slate-950 border border-slate-700 text-white py-2.5 px-3 rounded-xl text-sm focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Neue PIN (mind. 4 Zeichen)
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Neue PIN"
                  className="w-full bg-slate-950 border border-slate-700 text-white py-2.5 px-3 rounded-xl text-sm focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Neue PIN wiederholen
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="PIN bestätigen"
                  className="w-full bg-slate-950 border border-slate-700 text-white py-2.5 px-3 rounded-xl text-sm focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  PIN Speichern
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
