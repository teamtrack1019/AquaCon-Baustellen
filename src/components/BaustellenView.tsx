import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Waves,
  Home,
  Wrench,
  TreePine,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShoppingCart,
  PlusCircle,
  X,
  Package,
  ArrowRight,
  Filter,
  PackageCheck,
  Clock,
  Truck
} from 'lucide-react';
import { AreaType, MaterialCategory, MaterialUnit, Area, Baustelle, Order } from '../types';
import { generateAreaMaterialPdf, shareAreaMaterialPdf } from '../utils/pdfGenerator';
import { DeliveryCheckModal } from './DeliveryCheckModal';
import { findMatchingFlange } from '../utils/flangeHelper';

interface BaustellenViewProps {
  selectedBaustelleId: string | null;
  setSelectedBaustelleId: (id: string | null) => void;
  onOpenNewOrder: (prefill?: { baustelleId?: string; areaId?: string }) => void;
  onOpenNewBaustelle: () => void;
}

export const BaustellenView: React.FC<BaustellenViewProps> = ({
  selectedBaustelleId,
  setSelectedBaustelleId,
  onOpenNewOrder,
  onOpenNewBaustelle
}) => {
  const {
    role,
    lang,
    t,
    baustellen,
    updateBaustelle,
    deleteBaustelle,
    addArea,
    deleteArea,
    addMaterialToArea,
    updateAreaMaterial,
    deleteAreaMaterial,
    catalog,
    orders,
    confirmWorkerDelivery,
    createMaterialRequestFromArea
  } = useApp();

  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [orderSuccessToast, setOrderSuccessToast] = useState<string | null>(null);
  const [selectedOrderForDeliveryCheck, setSelectedOrderForDeliveryCheck] = useState<Order | null>(null);

  // Modals
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showDeleteBaustelleModal, setShowDeleteBaustelleModal] = useState(false);
  const [showEditBaustelleModal, setShowEditBaustelleModal] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states for editing baustelle
  const [editName, setEditName] = useState('');
  const [editProjectNumber, setEditProjectNumber] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Form states for new area
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaType, setNewAreaType] = useState<AreaType>('schwimmerbecken');
  const [newAreaDesc, setNewAreaDesc] = useState('');

  // Form states for adding material
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [customMatName, setCustomMatName] = useState('');
  const [matCategory, setMatCategory] = useState<MaterialCategory>('PE Rohre & Fittings');
  const [matUnit, setMatUnit] = useState<MaterialUnit>('Stk.');
  const [matOnSite, setMatOnSite] = useState<string | number>('0');
  const [matZusatz, setMatZusatz] = useState<string | number>('0');
  const [matNotes, setMatNotes] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Determine current active Baustelle
  const activeBaustelle = baustellen.find(b => b.id === selectedBaustelleId) || baustellen[0];

  // If activeBaustelle changes, default activeAreaId to first area
  const currentArea = activeBaustelle?.areas.find(a => a.id === activeAreaId) || activeBaustelle?.areas[0];

  const getAreaIcon = (type: AreaType) => {
    switch (type) {
      case 'schwimmerbecken':
        return <Waves className="w-4 h-4 text-sky-500" />;
      case 'nichtschwimmerbecken':
        return <Waves className="w-4 h-4 text-cyan-500" />;
      case 'springerbecken':
        return <Waves className="w-4 h-4 text-blue-600" />;
      case 'planschbecken':
        return <Waves className="w-4 h-4 text-emerald-500" />;
      case 'technikraum':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'haus':
        return <Home className="w-4 h-4 text-indigo-500" />;
      case 'aussenbereich':
        return <TreePine className="w-4 h-4 text-emerald-600" />;
      default:
        return <Package className="w-4 h-4 text-slate-500" />;
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddAreaModal(false);
        setShowAddMaterialModal(false);
        setShowDeleteBaustelleModal(false);
        setShowEditBaustelleModal(false);
        setAreaToDelete(null);
        setMaterialToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenEditBaustelle = (b: Baustelle) => {
    setEditName(b.name || '');
    setEditProjectNumber(b.projectNumber || '');
    setEditAddress(b.address || '');
    setEditClient(b.client || '');
    setEditManager(b.manager || '');
    setEditStartDate(b.startDate || '');
    setEditTargetDate(b.targetDate || '');
    setEditNotes(b.notes || '');
    setShowEditBaustelleModal(true);
  };

  const handleSaveEditBaustelle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBaustelle || !editName.trim()) return;
    updateBaustelle(activeBaustelle.id, {
      name: editName.trim(),
      projectNumber: editProjectNumber.trim(),
      address: editAddress.trim() || 'Adresse wird nachgereicht',
      client: editClient.trim() || 'Auftraggeber',
      manager: editManager.trim() || 'Bauleiter',
      startDate: editStartDate,
      targetDate: editTargetDate || 'Offen',
      notes: editNotes.trim() || undefined
    });
    setShowEditBaustelleModal(false);
  };

  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBaustelle || !newAreaName.trim()) return;

    const newId = addArea(activeBaustelle.id, {
      name: newAreaName.trim(),
      type: newAreaType,
      description: newAreaDesc.trim() || undefined
    });

    setActiveAreaId(newId);
    setShowAddAreaModal(false);
    setNewAreaName('');
    setNewAreaDesc('');
  };

  const handleCatalogSelect = (catId: string) => {
    setSelectedCatalogId(catId);
    const item = catalog.find(c => c.id === catId);
    if (item) {
      setCustomMatName(item.name);
      setMatCategory(item.category);
      setMatUnit(item.unit);
    }
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBaustelle || !currentArea) return;
    const finalName = customMatName.trim();
    if (!finalName) return;

    const onSite = Number(matOnSite) || 0;
    const zusatz = Number(matZusatz) || 0;
    const totalRequired = onSite + zusatz;

    addMaterialToArea(activeBaustelle.id, currentArea.id, {
      catalogItemId: selectedCatalogId || undefined,
      name: finalName,
      category: matCategory,
      unit: matUnit,
      requiredQty: totalRequired,
      onSiteQty: onSite,
      notes: matNotes.trim()
    });

    // Auto-add matching Losflansch
    const flangeCheck = findMatchingFlange(finalName, matCategory, catalog);
    if (flangeCheck.matchingFlange) {
      addMaterialToArea(activeBaustelle.id, currentArea.id, {
        catalogItemId: flangeCheck.matchingFlange.catalogItemId,
        name: flangeCheck.matchingFlange.name,
        category: flangeCheck.matchingFlange.category,
        unit: flangeCheck.matchingFlange.unit,
        requiredQty: totalRequired,
        onSiteQty: onSite,
        notes: matNotes.trim() || undefined
      });
    }

    setShowAddMaterialModal(false);
    setSelectedCatalogId('');
    setCustomMatName('');
    setMatOnSite('0');
    setMatZusatz('0');
    setMatNotes('');
    setCatalogSearch('');
  };

  const filteredMaterials = currentArea?.materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const areaShortages = currentArea?.materials.filter(m => m.requiredQty > m.onSiteQty) || [];

  // Shortages that have NOT yet been ordered/requested from Admin
  const unrequestedShortages = currentArea?.materials.filter(m => {
    const shortage = Math.max(0, m.requiredQty - m.onSiteQty);
    if (shortage <= 0) return false;
    const orderedAlready = m.orderedQty || 0;
    return orderedAlready < shortage;
  }) || [];

  const handleShareWhatsApp = async (baustelle: Baustelle, area: Area) => {
    await shareAreaMaterialPdf(baustelle, area);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Baustelle Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
            Baustellen & Bereichs-Management
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {activeBaustelle ? activeBaustelle.name : 'Keine Baustelle ausgewählt'}
            </h1>
            {activeBaustelle && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200">
                {activeBaustelle.projectNumber}
              </span>
            )}
            {activeBaustelle && role === 'admin' && (
              <button
                onClick={() => handleOpenEditBaustelle(activeBaustelle)}
                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                title="Baustelle / Adresse bearbeiten"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {activeBaustelle && (
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1 items-center">
              <span>📍 {activeBaustelle.address}</span>
              <span>👤 {t.manager}: <strong>{activeBaustelle.manager}</strong></span>
              <span>📅 {activeBaustelle.startDate} bis {activeBaustelle.targetDate}</span>
              {role === 'admin' && (
                <button
                  onClick={() => handleOpenEditBaustelle(activeBaustelle)}
                  className="text-sky-600 hover:text-sky-700 underline font-semibold ml-1 cursor-pointer"
                >
                  (Adresse & Daten ändern)
                </button>
              )}
            </p>
          )}
        </div>

        {/* Baustelle Selector Dropdown, Edit, Delete & New Baustelle */}
        <div className="flex flex-wrap items-center gap-2">
          {baustellen.length > 0 && (
            <select
              value={activeBaustelle?.id || ''}
              onChange={e => {
                setSelectedBaustelleId(e.target.value);
                setActiveAreaId(null);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {baustellen.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.projectNumber})
                </option>
              ))}
            </select>
          )}

          {activeBaustelle && role === 'admin' && (
            <button
              onClick={() => handleOpenEditBaustelle(activeBaustelle)}
              className="px-3 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl border border-sky-200 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
              title="Baustelle bearbeiten"
            >
              <Edit2 className="w-4 h-4" />
              <span>Baustelle bearbeiten</span>
            </button>
          )}

          {activeBaustelle && role === 'admin' && (
            <button
              onClick={() => setShowDeleteBaustelleModal(true)}
              className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold transition-all flex items-center space-x-1.5"
              title="Baustelle löschen"
            >
              <Trash2 className="w-4 h-4" />
              <span>Löschen</span>
            </button>
          )}

          {role === 'admin' && (
            <button
              onClick={onOpenNewBaustelle}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all flex items-center space-x-1"
              title={t.newBaustelle}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {activeBaustelle && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Areas / Becken / Häuser Tabs */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1.5">
                  <Waves className="w-4 h-4 text-sky-500" />
                  <span>{t.areas}</span>
                </span>
                {role === 'admin' && (
                  <button
                    onClick={() => setShowAddAreaModal(true)}
                    className="flex items-center space-x-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bereich +</span>
                  </button>
                )}
              </div>

              {/* Area List Items */}
              <div className="space-y-2">
                {activeBaustelle.areas.map(area => {
                  const isSelected = (currentArea?.id === area.id);
                  const missingCount = area.materials.filter(m => m.requiredQty > m.onSiteQty).length;

                  return (
                    <div
                      key={area.id}
                      onClick={() => setActiveAreaId(area.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-sky-50/80 border-sky-400 shadow-sm ring-1 ring-sky-300'
                          : 'bg-slate-50/50 hover:bg-slate-100/60 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="p-1.5 bg-white rounded-lg shadow-2xs border border-slate-200/60">
                          {getAreaIcon(area.type)}
                        </div>
                        <div className="truncate">
                          <div className={`text-xs font-bold truncate ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                            {area.name}
                          </div>
                          {area.description ? (
                            <div className="text-[10px] text-slate-400 truncate">
                              {area.description}
                            </div>
                          ) : area.name.toLowerCase() !== area.type.toLowerCase() ? (
                            <div className="text-[10px] text-slate-400 capitalize truncate">
                              {area.type}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {missingCount > 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800" title={`${missingCount} fehlende Materialien`}>
                            {missingCount} ⚠️
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                            ✓ OK
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeBaustelle.areas.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  Noch keine Becken oder Gebäude angelegt.
                </div>
              )}
            </div>

            {/* Baustelle Actions & Info Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sky-400 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>Baustellen-Notizen</span>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => handleOpenEditBaustelle(activeBaustelle)}
                    className="text-[11px] text-slate-400 hover:text-sky-300 flex items-center space-x-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Bearbeiten</span>
                  </button>
                )}
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activeBaustelle.notes || 'Keine speziellen Notizen hinterlegt.'}
              </p>
            </div>
          </div>

          {/* Right 3 Columns: Selected Area Materials & Inventory */}
          <div className="lg:col-span-3 space-y-4">
            {currentArea ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Area Header Bar */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-sky-100 text-sky-700 rounded-xl flex-shrink-0">
                        {getAreaIcon(currentArea.type)}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                          <span>{currentArea.name}</span>
                          {currentArea.name.toLowerCase() !== currentArea.type.toLowerCase() && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                              {currentArea.type}
                            </span>
                          )}
                        </h2>
                        {currentArea.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{currentArea.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Action Buttons for current pool/area */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowAddMaterialModal(true)}
                      className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.addMaterial}</span>
                    </button>

                    {role === 'worker' && areaShortages.length > 0 && (
                      unrequestedShortages.length > 0 ? (
                        <button
                          onClick={() => {
                            if (!activeBaustelle || !currentArea) return;
                            const newOrderId = createMaterialRequestFromArea(activeBaustelle.id, currentArea.id);
                            if (newOrderId) {
                              setOrderSuccessToast(`✅ Fehlmaterial (${unrequestedShortages.length} Positionen) erfolgreich bei Admin angefordert!`);
                              setTimeout(() => {
                                setOrderSuccessToast(null);
                              }, 4000);
                            }
                          }}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95 animate-pulse hover:animate-none"
                          title="Fehlmengen direkt mit 1-Klick bei Admin bestellen"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Fehlmaterial bei Admin bestellen ({unrequestedShortages.length})</span>
                        </button>
                      ) : (
                        <div
                          className="px-3.5 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 flex items-center space-x-1.5 cursor-not-allowed opacity-80"
                          title="Alle Fehlmengen für diesen Bereich wurden bereits beim Admin angefordert."
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Fehlmaterial bereits bestellt ✓</span>
                        </div>
                      )
                    )}

                    <button
                      onClick={() => generateAreaMaterialPdf(activeBaustelle, currentArea)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      title={t.downloadPdf}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(activeBaustelle, currentArea)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                      title="WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {role === 'admin' && (
                      <button
                        onClick={() => setAreaToDelete(currentArea)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-colors border border-rose-200"
                        title="Bereich löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter and Search Toolbar */}
                <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Material in diesem Becken suchen..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                    >
                      <option value="all">Alle Kategorien</option>
                      <option value="PE Rohre & Fittings">PE Rohre & Fittings</option>
                      <option value="PVC Rohre & Fittings">PVC Rohre & Fittings</option>
                      <option value="Verzinkte Schrauben">Verzinkte Schrauben</option>
                      <option value="VA Schrauben">VA Schrauben</option>
                      <option value="Schellen">Schellen</option>
                      <option value="PE Sonstiges">PE Sonstiges</option>
                      <option value="PVC Sonstiges">PVC Sonstiges</option>
                      <option value="Klappen">Klappen</option>
                      <option value="Chlorgas & Chlorgasraum">Chlorgas & Chlorgasraum</option>
                      <option value="Pumpen, Kompressor, WT, Messwasser">Pumpen, Kompressor, WT, Messwasser</option>
                      <option value="Einbauteile & Becken">Einbauteile & Becken</option>
                      <option value="Abdichtung & Bauchemie">Abdichtung & Bauchemie</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                </div>

                {/* Materials Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-5">{t.material}</th>
                        <th className="p-3">{t.category}</th>
                        <th className="p-3 text-center">Vor Ort</th>
                        <th className="p-3 text-center">{role === 'admin' ? 'Zusätzlich bestellt' : 'Zusätzlich bestellen'}</th>
                        <th className="p-3 text-center">Benötigt (Gesamt)</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right pr-4">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredMaterials.map(mat => {
                        const shortage = Math.max(0, mat.requiredQty - mat.onSiteQty);
                        const isSufficient = shortage === 0;
                        const isOrdered = (mat.orderedQty || 0) >= shortage && shortage > 0;

                        return (
                          <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 pl-5">
                              <div className="font-bold text-slate-900">{mat.name}</div>
                              {mat.notes && (
                                <div className="text-[10px] text-slate-400 mt-0.5">{mat.notes}</div>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                {mat.category}
                              </span>
                            </td>

                            {/* 1. Vor Ort (Vorhanden) edit */}
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={mat.onSiteQty}
                                onFocus={e => e.target.select()}
                                onChange={e => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  const newOnSite = isNaN(val) ? 0 : Math.max(0, val);
                                  const currentZusatz = Math.max(0, mat.requiredQty - mat.onSiteQty);
                                  updateAreaMaterial(activeBaustelle.id, currentArea.id, mat.id, {
                                    onSiteQty: newOnSite,
                                    requiredQty: newOnSite + currentZusatz
                                  });
                                }}
                                className="w-16 text-center py-1 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />{' '}
                              <span className="text-[11px] text-slate-400">{mat.unit}</span>
                            </td>

                            {/* 2. Zusätzlich bestellen / bestellt edit */}
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={shortage}
                                onFocus={e => e.target.select()}
                                onChange={e => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  const newZusatz = isNaN(val) ? 0 : Math.max(0, val);
                                  updateAreaMaterial(activeBaustelle.id, currentArea.id, mat.id, {
                                    requiredQty: mat.onSiteQty + newZusatz
                                  });
                                }}
                                className={`w-16 text-center py-1 rounded font-bold text-xs focus:bg-white focus:ring-1 focus:ring-sky-500 border ${
                                  shortage > 0 ? 'bg-amber-50 border-amber-300 text-amber-950 font-black' : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              />{' '}
                              <span className="text-[11px] text-slate-400">{mat.unit}</span>
                            </td>

                            {/* 3. Benötigt (Gesamt) edit */}
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={mat.requiredQty}
                                onFocus={e => e.target.select()}
                                onChange={e => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  const newReq = isNaN(val) ? 0 : Math.max(0, val);
                                  updateAreaMaterial(activeBaustelle.id, currentArea.id, mat.id, {
                                    requiredQty: newReq
                                  });
                                }}
                                className="w-16 text-center py-1 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />{' '}
                              <span className="text-[11px] text-slate-400">{mat.unit}</span>
                            </td>

                            {/* Status Badge */}
                            <td className="p-3 text-center">
                              {isSufficient ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Ausreichend</span>
                                </span>
                              ) : isOrdered ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                  <span>Bestellt ({shortage} {mat.unit})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Fehlt ({shortage} {mat.unit})</span>
                                </span>
                              )}
                            </td>

                            {/* Action: Delete material */}
                            <td className="p-3 text-right pr-4">
                              {role === 'admin' ? (
                                <button
                                  onClick={() => setMaterialToDelete({ id: mat.id, name: mat.name })}
                                  title="Material entfernen"
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors inline-flex items-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-slate-300 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredMaterials.length === 0 && (
                  <div className="p-10 text-center text-slate-400 space-y-2">
                    <Package className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs">
                      Keine Materialien für diesen Bereich gefunden. Klicken Sie auf "+ Material erfassen".
                    </p>
                  </div>
                )}

                {/* Live Status of Material Requests for this Area (Only visible for Worker) */}
                {role === 'worker' && (() => {
                  const areaOrders = orders.filter(
                    o => o.baustelleId === activeBaustelle.id && (o.areaId === currentArea.id || !o.areaId)
                  );
                  if (areaOrders.length === 0) return null;

                  return (
                    <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-900 text-white rounded-xl p-4 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-sky-400" />
                          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                            Rückmeldung der Zentrale / Status für {currentArea.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {areaOrders.length} Anforderung(en)
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {areaOrders.map(order => (
                          <div key={order.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-200">{order.orderNumber}</span>
                              <span className="text-[10px] text-slate-400">
                                {order.orderDate || new Date(order.createdAt).toLocaleDateString('de-DE')}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {order.items.map(item => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-900/60 p-2 rounded-lg">
                                  <div>
                                    <span className="font-bold text-white">{item.name}</span>
                                    <span className="text-slate-400 ml-2 font-mono text-[11px]">
                                      ({item.orderedQty} {item.unit})
                                    </span>
                                    {item.adminNote && (
                                      <div className="text-[10px] text-sky-300 mt-0.5 font-medium">
                                        💬 Zentrale: {item.adminNote}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    {item.status === 'in_stock' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-900/80 text-teal-300 border border-teal-700">
                                        📦 Im Lager vorhanden
                                      </span>
                                    )}
                                    {item.status === 'ordered' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-900/80 text-sky-300 border border-sky-700">
                                        🛒 Beim Lieferanten bestellt
                                      </span>
                                    )}
                                    {item.status === 'shipped' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/80 text-indigo-300 border border-indigo-700">
                                        🚚 Unterwegs zur Baustelle
                                      </span>
                                    )}
                                    {item.status === 'pending' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/80 text-amber-300 border border-amber-700">
                                        ⏳ Wartet auf Admin
                                      </span>
                                    )}
                                    {item.status === 'delivered' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                                        ✓ Vor Ort erhalten
                                      </span>
                                    )}

                                    {item.status !== 'delivered' && (
                                      <button
                                        onClick={() => setSelectedOrderForDeliveryCheck(order)}
                                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
                                        title="Lieferschein / Stückzahlen prüfen und Wareneingang erfassen"
                                      >
                                        <Truck className="w-3.5 h-3.5" />
                                        <span>📦 Ware prüfen</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <Waves className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700">
                  Wählen Sie links ein Becken oder Gebäude aus
                </h3>
              </div>
            )}
          </div>
        </div>
      )}

      {!activeBaustelle && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Keine Baustellen vorhanden</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {role === 'admin'
              ? 'Legen Sie eine neue Baustelle an, um Bereiche, Becken und Materialbedarfe zu verwalten.'
              : 'Aktuell sind keine Baustellen zugewiesen. Bitte wenden Sie sich an die Bauleitung / Zentrale.'}
          </p>
          {role === 'admin' && (
            <button
              onClick={onOpenNewBaustelle}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Neue Baustelle anlegen</span>
            </button>
          )}
        </div>
      )}

      {/* Modal: Add Area / Pool / House */}
      {showAddAreaModal && activeBaustelle && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 text-slate-900 max-h-[88dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Waves className="w-5 h-5 text-sky-600" />
                <span>{t.addArea}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddAreaModal(false)} 
                className="p-2 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="add-area-form" onSubmit={handleCreateArea} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs overscroll-contain">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.areaName} *</label>
                <input
                  type="text"
                  required
                  value={newAreaName}
                  onChange={e => setNewAreaName(e.target.value)}
                  placeholder="z. B. Schwimmerbecken 50m, Whirlpool, Technikhaus"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.areaType}</label>
                <select
                  value={newAreaType}
                  onChange={e => setNewAreaType(e.target.value as AreaType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="schwimmerbecken">🏊 {t.typeSchwimmer}</option>
                  <option value="nichtschwimmerbecken">🏊‍♂️ {t.typeNichtschwimmer}</option>
                  <option value="springerbecken">🤿 {t.typeSpringer}</option>
                  <option value="planschbecken">👶 {t.typePlansch}</option>
                  <option value="haus">🏠 {t.typeHaus}</option>
                  <option value="technikraum">⚙️ {t.typeTechnik}</option>
                  <option value="aussenbereich">🌳 {t.typeAussen}</option>
                  <option value="custom">➕ {t.typeCustom}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Beschreibung / Maße (optional)</label>
                <input
                  type="text"
                  value={newAreaDesc}
                  onChange={e => setNewAreaDesc(e.target.value)}
                  placeholder="z. B. 25x12m, Wassertiefe 1.80m"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </form>

            <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0 bg-slate-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
              <button
                type="button"
                onClick={() => setShowAddAreaModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                form="add-area-form"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Bereich anlegen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Add Material to Pool with A-Z Catalog Autocomplete */}
      {showAddMaterialModal && activeBaustelle && currentArea && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 text-slate-900 max-h-[88dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header - Fixed Top */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-sky-600" />
                  <span>{t.addMaterial}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentArea.name} ({activeBaustelle.name})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddMaterialModal(false)} 
                className="p-2 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body - Scrollable */}
            <form id="add-material-form" onSubmit={handleAddMaterial} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs overscroll-contain">
              {/* Quick Pick from A-Z Catalog */}
              <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-sky-950 flex items-center space-x-1.5">
                    <span>📦 Aus A-Z Katalog auswählen:</span>
                  </label>
                  <span className="text-[10px] text-sky-800 font-semibold bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                    {catalog.filter(c => c.category === matCategory && (!catalogSearch || c.name.toLowerCase().includes(catalogSearch.toLowerCase()) || (c.articleNumber && c.articleNumber.toLowerCase().includes(catalogSearch.toLowerCase())))).length} Artikel
                  </span>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {(['PE Rohre & Fittings', 'PVC Rohre & Fittings', 'Verzinkte Schrauben', 'VA Schrauben', 'Schellen', 'PE Sonstiges', 'PVC Sonstiges', 'Klappen', 'Chlorgas & Chlorgasraum', 'Pumpen, Kompressor, WT, Messwasser', 'Einbauteile & Becken', 'Abdichtung & Bauchemie', 'Sonstiges'] as MaterialCategory[]).map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        setMatCategory(cat);
                        setSelectedCatalogId('');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        matCategory === cat
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-sky-100/70 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Screw quick thread pills */}
                {(matCategory === 'Verzinkte Schrauben' || matCategory === 'VA Schrauben') && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Gewinde:</span>
                    {['M12', 'M16', 'M20', 'M24'].map(m => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setCatalogSearch(m)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono transition ${
                          catalogSearch.includes(m)
                            ? 'bg-sky-600 text-white'
                            : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => setCatalogSearch('')}
                        className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-auto"
                      >
                        Zurücksetzen
                      </button>
                    )}
                  </div>
                )}

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    placeholder={`In "${matCategory}" suchen (z. B. Bogen, DA, Skimmer)...`}
                    className="w-full bg-white border border-sky-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 border border-sky-200/60 rounded-xl bg-white p-1.5">
                  {(() => {
                    const filtered = catalog.filter(c => {
                      const matchesCategory = c.category === matCategory;
                      if (!catalogSearch) return matchesCategory;
                      const term = catalogSearch.toLowerCase();
                      return matchesCategory && (c.name.toLowerCase().includes(term) || (c.articleNumber && c.articleNumber.toLowerCase().includes(term)));
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-3 text-center text-slate-400 text-xs">
                          Keine Artikel in "{matCategory}" gefunden.
                        </div>
                      );
                    }

                    return filtered.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleCatalogSelect(item.id)}
                        className={`p-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          selectedCatalogId === item.id ? 'bg-sky-600 text-white font-bold' : 'hover:bg-sky-50 text-slate-800'
                        }`}
                      >
                        <span className="truncate pr-2">{item.name}</span>
                        <span className={`text-[10px] flex-shrink-0 font-medium ${selectedCatalogId === item.id ? 'text-sky-100 font-bold' : 'text-slate-400'}`}>
                          {item.unit}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Material Name Field */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.material} *</label>
                <input
                  type="text"
                  required
                  value={customMatName}
                  onChange={e => {
                    setCustomMatName(e.target.value);
                    setSelectedCatalogId('');
                  }}
                  placeholder="Artikelbezeichnung eingeben..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.category}</label>
                  <select
                    value={matCategory}
                    onChange={e => setMatCategory(e.target.value as MaterialCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="PE Rohre & Fittings">PE Rohre & Fittings</option>
                    <option value="PVC Rohre & Fittings">PVC Rohre & Fittings</option>
                    <option value="Verzinkte Schrauben">Verzinkte Schrauben</option>
                    <option value="VA Schrauben">VA Schrauben</option>
                    <option value="Schellen">Schellen</option>
                    <option value="PE Sonstiges">PE Sonstiges</option>
                    <option value="PVC Sonstiges">PVC Sonstiges</option>
                    <option value="Klappen">Klappen</option>
                    <option value="Chlorgas & Chlorgasraum">Chlorgas & Chlorgasraum</option>
                    <option value="Pumpen, Kompressor, WT, Messwasser">Pumpen, Kompressor, WT, Messwasser</option>
                    <option value="Einbauteile & Becken">Einbauteile & Becken</option>
                    <option value="Abdichtung & Bauchemie">Abdichtung & Bauchemie</option>
                    <option value="Sonstiges">Sonstiges</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.unit}</label>
                  <select
                    value={matUnit}
                    onChange={e => setMatUnit(e.target.value as MaterialUnit)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
                  >
                    <option value="Stk.">Stk.</option>
                    <option value="meter">meter</option>
                    <option value="Palette">Palette</option>
                  </select>
                </div>
              </div>

              {/* Quantities: Vor Ort, Zusätzlich, Gesamt Benötigt */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Vor Ort (Vorhanden)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={matOnSite}
                      onFocus={e => e.target.select()}
                      onChange={e => setMatOnSite(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      {role === 'admin' ? 'Zusätzlich bestellt' : 'Zusätzlich bestellen'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={matZusatz}
                      onFocus={e => e.target.select()}
                      onChange={e => setMatZusatz(e.target.value)}
                      placeholder="0"
                      className="w-full bg-amber-50/50 border border-amber-300 rounded-lg px-3 py-1.5 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200 pt-2 font-semibold">
                  <span>Benötigt (Gesamt):</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                    {(Number(matOnSite) || 0) + (Number(matZusatz) || 0)} {matUnit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notiz / Verwendungsort</label>
                <input
                  type="text"
                  value={matNotes}
                  onChange={e => setMatNotes(e.target.value)}
                  placeholder="z. B. Für Bodeneinströmung 1. Bauabschnitt"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </form>

            {/* Permanent Fixed Footer (Always visible above everything!) */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0 bg-slate-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                form="add-material-form"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Material erfassen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Edit Baustelle */}
      {showEditBaustelleModal && activeBaustelle && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 text-slate-900 max-h-[88dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between shrink-0 bg-white">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>Stammdaten bearbeiten</span>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Baustelle bearbeiten
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowEditBaustelleModal(false)}
                className="p-2 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form id="edit-baustelle-form" onSubmit={handleSaveEditBaustelle} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs overscroll-contain">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Baustellen-Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="z. B. Freibad Stadtpark, Villa Müller..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.projectNumber} *</label>
                  <input
                    type="text"
                    required
                    value={editProjectNumber}
                    onChange={e => setEditProjectNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">📍 Adresse (Straße, PLZ, Ort)</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  placeholder="z. B. Leopoldstraße 45, 80802 München"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.client}</label>
                  <input
                    type="text"
                    value={editClient}
                    onChange={e => setEditClient(e.target.value)}
                    placeholder="z. B. Stadtwerke / Privatkunde"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.manager}</label>
                  <input
                    type="text"
                    value={editManager}
                    onChange={e => setEditManager(e.target.value)}
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
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.targetDate}</label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={e => setEditTargetDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notizen / Projektbeschreibung</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Besonderheiten, Zufahrt, Ansprechpartner vor Ort..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </form>

            {/* Bottom Actions */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0 bg-slate-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
              <button
                type="button"
                onClick={() => setShowEditBaustelleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                form="edit-baustelle-form"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Änderungen speichern</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Delete Baustelle Confirmation */}
      {showDeleteBaustelleModal && activeBaustelle && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900 my-auto">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Baustelle löschen</h3>
                <p className="text-xs text-slate-500">{activeBaustelle.projectNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Möchten Sie die Baustelle <strong>"{activeBaustelle.name}"</strong> wirklich unwiderruflich löschen? 
              Alle {activeBaustelle.areas.length} zugehörigen Bereiche/Becken und sämtliche Materiallisten dieser Baustelle werden gelöscht.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}>
              <button
                type="button"
                onClick={() => setShowDeleteBaustelleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  const bId = activeBaustelle.id;
                  const remaining = baustellen.filter(b => b.id !== bId);
                  deleteBaustelle(bId);
                  setSelectedBaustelleId(remaining[0]?.id || null);
                  setActiveAreaId(null);
                  setShowDeleteBaustelleModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ja, Baustelle löschen</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Delete Area Confirmation */}
      {areaToDelete && activeBaustelle && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900 my-auto">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Bereich löschen</h3>
                <p className="text-xs text-slate-500">{areaToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Möchten Sie den Bereich <strong>"{areaToDelete.name}"</strong> wirklich aus der Baustelle <strong>"{activeBaustelle.name}"</strong> löschen?
              Alle in diesem Bereich erfassten Materialien werden entfernt.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}>
              <button
                type="button"
                onClick={() => setAreaToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteArea(activeBaustelle.id, areaToDelete.id);
                  setActiveAreaId(null);
                  setAreaToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Bereich löschen</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Delete Material Confirmation */}
      {materialToDelete && activeBaustelle && currentArea && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900 my-auto">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Material entfernen</h3>
                <p className="text-xs text-slate-500">{currentArea.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Möchten Sie <strong>"{materialToDelete.name}"</strong> wirklich aus der Bedarfsliste dieses Bereichs entfernen?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}>
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAreaMaterial(activeBaustelle.id, currentArea.id, materialToDelete.id);
                  setMaterialToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Entfernen</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast confirmation for 1-click order */}
      {orderSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 z-50 flex items-center space-x-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{orderSuccessToast}</span>
        </div>
      )}

      {/* Modal: Delivery / Wareneingang Check */}
      {selectedOrderForDeliveryCheck && (
        <DeliveryCheckModal
          order={selectedOrderForDeliveryCheck}
          onClose={() => setSelectedOrderForDeliveryCheck(null)}
        />
      )}
    </div>
  );
};
