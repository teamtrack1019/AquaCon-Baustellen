import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import {
  HardHat,
  ShieldCheck,
  Globe,
  Layers,
  ShoppingBag,
  AlertTriangle,
  BookOpen,
  PlusCircle,
  Download,
  Upload,
  RefreshCw,
  Building2,
  Menu,
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Ruler,
  Users,
  KeyRound,
  Lock
} from 'lucide-react';
import { ManageWorkersModal } from './ManageWorkersModal';
import { AdminPinModal } from './AdminPinModal';
import { Logo } from './Logo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewOrder: () => void;
  onOpenNewBaustelle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOrder,
  onOpenNewBaustelle
}) => {
  const {
    role,
    setRole,
    lang,
    setLang,
    t,
    workers,
    activeWorkerId,
    setActiveWorkerId,
    activeWorker,
    allShortages,
    flaggedBackorders,
    exportDataJSON,
    importDataJSON,
    resetToSampleData
  } = useApp();

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showWorkersModal, setShowWorkersModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'unlock' | 'change'>('unlock');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<'internet' | 'wifi'>('internet');

  const publicInternetUrl = 'https://weak-beans-matter.loca.lt';
  const wifiUrl = 'http://192.168.178.20:5173/';
  const activeMobileUrl = selectedLinkType === 'internet' ? publicInternetUrl : wifiUrl;

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: Building2 },
    { id: 'baustellen', label: t.navBaustellen, icon: Layers },
    {
      id: 'orders',
      label: 'Materialanforderungen',
      icon: ShoppingBag
    },
    {
      id: 'backorders',
      label: t.navBackorders,
      icon: AlertTriangle,
      badge: flaggedBackorders.length > 0 ? flaggedBackorders.length : undefined,
      badgeColor: 'bg-amber-500'
    },
    { id: 'aufmass', label: t.navAufmass || 'Aufmaß', icon: Ruler },
    { id: 'catalog', label: t.navCatalog, icon: BookOpen }
  ];

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AquaCon_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importDataJSON(importText);
    if (ok) {
      setImportStatus('success');
      setTimeout(() => {
        setShowBackupModal(false);
        setImportStatus('idle');
        setImportText('');
      }, 1200);
    } else {
      setImportStatus('error');
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 w-full max-w-full overflow-hidden">
      {/* Top bar with Branding, Role Switcher & Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-shrink-0" onClick={() => setActiveTab('dashboard')}>
            <Logo className="w-8 h-8 sm:w-10 sm:h-10 hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base sm:text-lg text-white tracking-wide">AquaCon</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                  Baustellen & Material
                </span>
              </div>
            </div>
          </div>

          {/* Center Actions (Desktop) */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              onClick={onOpenNewOrder}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{role === 'admin' ? t.navNewOrder : 'Material anfordern'}</span>
            </button>
            {role === 'admin' && (
              <button
                onClick={onOpenNewBaustelle}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all active:scale-95"
              >
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>{t.newBaustelle}</span>
              </button>
            )}
          </div>

          {/* Right Controls: Compact on Mobile */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
            {/* Active Worker Selector in Worker Mode */}
            {role === 'worker' && (
              <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-amber-500/40 px-2 py-1 rounded-xl">
                <HardHat className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-[11px] text-amber-300 font-bold hidden sm:inline">Ich bin:</span>
                <select
                  value={activeWorkerId}
                  onChange={e => setActiveWorkerId(e.target.value)}
                  className="bg-slate-900 border border-amber-500/50 text-amber-300 font-bold text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  title="Aktiven Mitarbeiter auswählen (Hakan, Alex...)"
                >
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.roleTitle ? `(${w.roleTitle})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin Worker Management Button */}
            {role === 'admin' && (
              <button
                onClick={() => setShowWorkersModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors shadow-2xs"
                title="Mitarbeiter verwalten (Hakan, Alex...)"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mitarbeiter ({workers.length})</span>
              </button>
            )}

            {/* Role Switcher Pill */}
            <div className="bg-slate-800 p-0.5 sm:p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setRole('worker')}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  role === 'worker'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mitarbeiter Modus"
              >
                <HardHat className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mitarbeiter</span>
              </button>
              <button
                onClick={() => {
                  if (role === 'admin') {
                    setPinModalMode('change');
                    setShowPinModal(true);
                  } else {
                    setPinModalMode('unlock');
                    setShowPinModal(true);
                  }
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  role === 'admin'
                    ? 'bg-sky-500 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={role === 'admin' ? 'Admin aktiv (Klicken für PIN-Änderung)' : 'Admin Modus (PIN erforderlich)'}
              >
                {role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden md:inline">Admin</span>
              </button>
            </div>

            {/* Data / Backup Button */}
            <button
              onClick={() => setShowBackupModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="Backup / Daten sichern"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Role Banner / Context Bar */}
        <div className="py-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2 truncate">
            {role === 'worker' ? (
              <>
                <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse bg-amber-400" />
                <span className="truncate font-semibold text-slate-300">
                  Angemeldet als: <strong className="text-amber-400 font-black">👷 {activeWorker?.name || 'Mitarbeiter'}</strong> ({activeWorker?.roleTitle || 'Vor Ort'})
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse bg-sky-400" />
                <span className="truncate font-semibold text-slate-300">
                  Admin Zentrale
                </span>
                <button
                  onClick={() => setShowWorkersModal(true)}
                  className="text-sky-400 hover:text-sky-300 underline font-semibold ml-1 cursor-pointer"
                >
                  (Mitarbeiter verwalten)
                </button>
                <button
                  onClick={() => {
                    setPinModalMode('change');
                    setShowPinModal(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 underline font-semibold ml-2 cursor-pointer flex items-center gap-1"
                  title="Admin-PIN ändern"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>PIN ändern</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center flex-shrink-0">
            {allShortages.length > 0 && (
              <span className="text-amber-400 font-bold flex items-center space-x-1 text-[10px] sm:text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>{allShortages.length} Fehlmengen</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Desktop) */}
      <div className="bg-slate-950 border-b border-slate-800 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-sky-400 font-semibold shadow-inner border border-slate-700/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-slate-950 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <div className={`grid ${role === 'admin' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-3`}>
            <button
              onClick={() => {
                onOpenNewOrder();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 p-2 bg-sky-600 text-white text-xs font-semibold rounded-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{role === 'admin' ? t.navNewOrder : 'Material anfordern'}</span>
            </button>
            {role === 'admin' && (
              <button
                onClick={() => {
                  onOpenNewBaustelle();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-1.5 p-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
              >
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>{t.newBaustelle}</span>
              </button>
            )}
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-slate-800 text-sky-400 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-slate-950 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Backup / Data Management Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold flex items-center space-x-2">
                <Download className="w-5 h-5 text-sky-400" />
                <span>Datensicherung & Import</span>
              </h3>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-sm">
              <p className="text-slate-300">
                Alle Daten (Baustellen, Becken, Materialbestände, Bestellungen und A-Z Katalog) werden lokal in Ihrem Browser gespeichert.
              </p>

              {/* Export Button */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">
                    Sicherung herunterladen
                  </div>
                  <div className="text-xs text-slate-400">
                    JSON-Datei mit allen aktuellen Daten
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportieren</span>
                </button>
              </div>

              {/* Import Section */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                <div className="font-semibold text-white flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Sicherung wiederherstellen</span>
                </div>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="JSON-Code hier einfügen..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                />
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Daten importieren</span>
                </button>
                {importStatus === 'success' && (
                  <p className="text-xs text-emerald-400 font-medium">✓ Erfolgreich importiert!</p>
                )}
                {importStatus === 'error' && (
                  <p className="text-xs text-rose-400 font-medium">✗ Ungültiges JSON-Format!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <span>Auf dem Smartphone öffnen</span>
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex flex-col items-center text-center space-y-4">
              {/* Link Type Selector */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center w-full max-w-xs justify-center">
                <button
                  onClick={() => setSelectedLinkType('internet')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    selectedLinkType === 'internet'
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🌍 Unterwegs / 4G
                </button>
                <button
                  onClick={() => setSelectedLinkType('wifi')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    selectedLinkType === 'wifi'
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📶 WLAN (Zuhause)
                </button>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-sky-400">
                <QRCodeSVG
                  value={activeMobileUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-200 font-bold">
                  {selectedLinkType === 'internet'
                    ? '🌍 Weltweiter Direkt-Zugriff (auch über Mobilfunk):'
                    : '📶 Zugriff im lokalen WLAN:'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedLinkType === 'internet'
                    ? 'Kamera auf QR-Code halten oder Link direkt anklicken'
                    : 'Smartphone muss im selben WLAN wie dieser PC sein'}
                </p>
              </div>

              {/* Direct Link box */}
              <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-sky-400 truncate pr-2">
                  {activeMobileUrl}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeMobileUrl);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 flex-shrink-0 transition-colors"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Kopiert' : 'Kopieren'}</span>
                </button>
              </div>

              {/* PWA / Home Screen Tip */}
              <div className="bg-slate-800/80 p-3 rounded-xl text-left text-[11px] text-slate-300 space-y-1 w-full border border-slate-700/60">
                <span className="font-bold text-sky-400 block">
                  💡 Tipp für App-Gefühl:
                </span>
                <p>
                  Im Safari/Chrome Browser auf "Zum Home-Bildschirm" tippen – schon haben Sie ein eigenes App-Icon auf Ihrem Smartphone!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Manage Workers (Mitarbeiter verwalten) */}
      {showWorkersModal && (
        <ManageWorkersModal onClose={() => setShowWorkersModal(false)} />
      )}

      {/* Modal: Admin PIN Authentication & Change */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        initialMode={pinModalMode}
      />
    </header>
  );
};
