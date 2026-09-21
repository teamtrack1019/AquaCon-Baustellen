import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Ruler,
  PlusCircle,
  Download,
  Share2,
  Trash2,
  Building2,
  Layers,
  Search,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  Edit3,
  Plus,
  Minus,
  Calculator,
  Filter,
  Layers2
} from 'lucide-react';
import { AufmassSheet, AufmassItem, MaterialCategory, MaterialUnit } from '../types';
import { generateAufmassPdf, shareAufmassPdf } from '../utils/pdfGenerator';
import { findMatchingFlange } from '../utils/flangeHelper';

interface AufmassViewProps {
  initialBaustelleId?: string | null;
}

export const AufmassView: React.FC<AufmassViewProps> = ({ initialBaustelleId }) => {
  const {
    role,
    baustellen,
    catalog,
    aufmassSheets,
    saveAufmassSheet,
    deleteAufmassSheet,
    workers,
    activeWorker,
    t
  } = useApp();

  // Selected Baustelle & Area & Inspector Filter
  const [selectedBaustelleId, setSelectedBaustelleId] = useState<string>(
    initialBaustelleId || (baustellen.length > 0 ? baustellen[0].id : '')
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [inspectorFilter, setInspectorFilter] = useState<string>('all');

  // Mode: 'list' or 'edit'
  const [mode, setMode] = useState<'list' | 'edit'>('list');

  // Currently editing Aufmass Sheet
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string>(() => {
    const initBId = initialBaustelleId || (baustellen.length > 0 ? baustellen[0].id : '');
    const b = baustellen.find(item => item.id === initBId);
    return b ? `Aufmaß ${b.name}` : '';
  });
  const [sheetDate, setSheetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inspectorName, setInspectorName] = useState<string>(() => {
    if (role === 'admin') return 'Admin';
    return activeWorker?.name || 'Mitarbeiter';
  });
  const [sheetNotes, setSheetNotes] = useState<string>('');
  const [sheetItems, setSheetItems] = useState<AufmassItem[]>([]);

  React.useEffect(() => {
    if (initialBaustelleId && initialBaustelleId !== selectedBaustelleId) {
      setSelectedBaustelleId(initialBaustelleId);
      if (!currentSheetId) {
        const b = baustellen.find(item => item.id === initialBaustelleId);
        if (b) setSheetTitle(`Aufmaß ${b.name}`);
      }
    }
  }, [initialBaustelleId, currentSheetId, baustellen, selectedBaustelleId]);

  // Catalog picker in editor
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick segment input helper state for adding an item
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<{
    id?: string;
    name: string;
    category: MaterialCategory;
    unit: MaterialUnit;
    articleNumber?: string;
  } | null>(null);

  const [pipeSegmentsInput, setPipeSegmentsInput] = useState<string>('');
  const [pieceQuantity, setPieceQuantity] = useState<number>(1);
  const [itemNote, setItemNote] = useState<string>('');

  // Selected Baustelle object
  const currentBaustelle = useMemo(() => {
    return baustellen.find(b => b.id === selectedBaustelleId);
  }, [baustellen, selectedBaustelleId]);

  // Filtered Aufmass sheets for current Baustelle & Inspector
  const relevantSheets = useMemo(() => {
    return aufmassSheets.filter(s => {
      if (selectedBaustelleId && s.baustelleId !== selectedBaustelleId) return false;
      if (selectedAreaId && selectedAreaId !== 'all' && s.areaId !== selectedAreaId) return false;
      if (inspectorFilter !== 'all') {
        const insp = (s.inspectorName || '').toLowerCase();
        if (inspectorFilter === 'admin') {
          if (!insp.includes('admin') && !insp.includes('bauleitung')) return false;
        } else {
          if (!insp.includes(inspectorFilter.toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [aufmassSheets, selectedBaustelleId, selectedAreaId, inspectorFilter]);

  // Categories list
  const categories: MaterialCategory[] = [
    'PE Rohre & Fittings',
    'PVC Rohre & Fittings',
    'Schellen',
    'Klappen',
    'Pumpen, Kompressor, WT, Messwasser',
    'Chlorgas & Chlorgasraum',
    'Einbauteile & Becken',
    'Abdichtung & Bauchemie',
    'Verzinkte Schrauben',
    'VA Schrauben',
    'PE Sonstiges',
    'PVC Sonstiges',
    'Sonstiges'
  ];

  // Filter catalog items
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          (item.articleNumber && item.articleNumber.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [catalog, selectedCategory, searchTerm]);

  // Parse string like "0.5 + 1.0 + 2.2 + 1.8 + 1.0" or "0,5, 1,0, 2.2" into number array
  const parseSegments = (str: string): number[] => {
    if (!str.trim()) return [];
    return str
      .replace(/,/g, '.')
      .split(/[+\s;]/)
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0);
  };

  const parsedSegmentsPreview = useMemo(() => {
    return parseSegments(pipeSegmentsInput);
  }, [pipeSegmentsInput]);

  const parsedSegmentsTotal = useMemo(() => {
    return parsedSegmentsPreview.reduce((sum, n) => sum + n, 0);
  }, [parsedSegmentsPreview]);

  // Start new Aufmaß
  const handleStartNewSheet = () => {
    const b = currentBaustelle;
    const a = b?.areas.find(ar => ar.id === selectedAreaId);
    setCurrentSheetId(null);
    setSheetTitle(a ? `Aufmaß ${a.name}` : `Aufmaß ${b ? b.name : ''}`);
    setSheetDate(new Date().toISOString().split('T')[0]);
    const defaultInspector = role === 'admin' ? 'Admin' : (activeWorker?.name || 'Mitarbeiter');
    setInspectorName(defaultInspector);
    setSheetNotes('');
    setSheetItems([]);
    setSelectedCatalogItem(null);
    setPipeSegmentsInput('');
    setPieceQuantity(1);
    setItemNote('');
    setMode('edit');
  };

  // Edit existing Aufmaß
  const handleEditSheet = (sheet: AufmassSheet) => {
    setCurrentSheetId(sheet.id);
    setSelectedBaustelleId(sheet.baustelleId);
    if (sheet.areaId) setSelectedAreaId(sheet.areaId);
    setSheetTitle(sheet.title);
    setSheetDate(sheet.date);
    setInspectorName(sheet.inspectorName || '');
    setSheetNotes(sheet.notes || '');
    setSheetItems(sheet.items || []);
    setSelectedCatalogItem(null);
    setPipeSegmentsInput('');
    setPieceQuantity(1);
    setItemNote('');
    setMode('edit');
  };

  // Add item to current Aufmaß sheet
  const handleAddItemToSheet = () => {
    if (!selectedCatalogItem) return;

    let segments: number[] = [];
    let quantity = 1;
    let total = 0;

    if (selectedCatalogItem.unit === 'meter') {
      segments = parseSegments(pipeSegmentsInput);
      if (segments.length === 0 && pipeSegmentsInput.trim()) {
        const singleVal = parseFloat(pipeSegmentsInput.replace(/,/g, '.'));
        if (!isNaN(singleVal) && singleVal > 0) {
          segments = [singleVal];
        }
      }
      total = segments.reduce((a, b) => a + b, 0);
      if (total <= 0) {
        total = 1.0;
        segments = [1.0];
      }
    } else {
      quantity = pieceQuantity > 0 ? pieceQuantity : 1;
      total = quantity;
    }

    const newItem: AufmassItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      catalogItemId: selectedCatalogItem.id,
      articleNumber: selectedCatalogItem.articleNumber,
      name: selectedCatalogItem.name,
      category: selectedCatalogItem.category,
      unit: selectedCatalogItem.unit,
      quantity,
      segments,
      total: Number(total.toFixed(2)),
      notes: itemNote.trim() || undefined
    };

    const newEntries: AufmassItem[] = [newItem];

    // Check if it is a Vorschweißbund or Bundbuchse to auto-add matching Losflansch
    const flangeCheck = findMatchingFlange(selectedCatalogItem.name, selectedCatalogItem.category, catalog);
    if (flangeCheck.matchingFlange) {
      const flangeQty = quantity > 0 ? quantity : 1;
      const flangeItem: AufmassItem = {
        id: `item-${Date.now() + 1}-${Math.random().toString(36).substr(2, 4)}`,
        catalogItemId: flangeCheck.matchingFlange.catalogItemId,
        articleNumber: flangeCheck.matchingFlange.articleNumber,
        name: flangeCheck.matchingFlange.name,
        category: flangeCheck.matchingFlange.category,
        unit: flangeCheck.matchingFlange.unit,
        quantity: flangeQty,
        segments: [],
        total: flangeQty,
        notes: undefined
      };
      newEntries.push(flangeItem);
    }

    setSheetItems(prev => [...prev, ...newEntries]);

    // Reset inputs
    setSelectedCatalogItem(null);
    setPipeSegmentsInput('');
    setPieceQuantity(1);
    setItemNote('');
  };

  // Update item notes or delete item from sheet
  const handleDeleteItem = (itemId: string) => {
    setSheetItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleUpdateItemSegments = (itemId: string, newSegmentsStr: string) => {
    const segments = parseSegments(newSegmentsStr);
    const total = segments.reduce((sum, n) => sum + n, 0);
    setSheetItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            segments,
            total: Number(total.toFixed(2))
          };
        }
        return item;
      })
    );
  };

  const handleUpdateItemQuantity = (itemId: string, delta: number) => {
    setSheetItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(1, (item.quantity || 1) + delta);
          return {
            ...item,
            quantity: newQty,
            total: newQty
          };
        }
        return item;
      })
    );
  };

  // Save current sheet
  const handleSaveSheet = () => {
    if (!selectedBaustelleId) {
      alert('Bitte wählen Sie zuerst eine Baustelle aus.');
      return;
    }

    const b = baustellen.find(x => x.id === selectedBaustelleId);
    const a = b?.areas.find(x => x.id === selectedAreaId);

    const sheetData: Omit<AufmassSheet, 'id' | 'createdAt'> & { id?: string } = {
      id: currentSheetId || undefined,
      baustelleId: selectedBaustelleId,
      baustelleName: b ? b.name : 'Unbekannt',
      areaId: selectedAreaId !== 'all' ? selectedAreaId : undefined,
      areaName: a ? a.name : undefined,
      title: sheetTitle.trim() || 'Aufmaß',
      date: sheetDate || new Date().toISOString().split('T')[0],
      inspectorName: inspectorName.trim() || undefined,
      notes: sheetNotes.trim() || undefined,
      items: sheetItems
    };

    saveAufmassSheet(sheetData);
    setMode('list');
  };

  // Delete sheet
  const handleDeleteSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Möchten Sie dieses Aufmaßblatt wirklich löschen?')) {
      deleteAufmassSheet(id);
    }
  };

  // Export sheet PDF
  const handleExportPdf = (sheet: AufmassSheet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    generateAufmassPdf(sheet);
  };

  // Share sheet PDF
  const handleSharePdf = async (sheet: AufmassSheet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await shareAufmassPdf(sheet);
  };

  // Quick total calculations for sheet
  const totalMeters = useMemo(() => {
    return sheetItems
      .filter(i => i.unit === 'meter')
      .reduce((sum, i) => sum + (i.total || 0), 0);
  }, [sheetItems]);

  const totalPieces = useMemo(() => {
    return sheetItems
      .filter(i => i.unit !== 'meter')
      .reduce((sum, i) => sum + (i.total || 0), 0);
  }, [sheetItems]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-500/20 border border-teal-500/30 rounded-xl text-teal-400">
            <Ruler className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Aufmaß & Längenberechnung
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                A-Z Materialkatalog
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Rohrlängen stückweise addieren (z. B. 0,5 + 1,0 + 2,2 = 3,7m), Formteile zählen & PDF exportieren.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'list' ? (
            <button
              onClick={handleStartNewSheet}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Neues Aufmaß erstellen</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('list')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Zurück zur Liste
              </button>
              <button
                onClick={handleSaveSheet}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aufmaß speichern</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Baustelle & Bereich Filter Bar */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${mode === 'list' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 bg-slate-850 p-4 rounded-xl border border-slate-800 shadow-md`}>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            Baustelle wählen
          </label>
          <select
            value={selectedBaustelleId}
            onChange={e => {
              const newBId = e.target.value;
              setSelectedBaustelleId(newBId);
              setSelectedAreaId('all');
              const targetB = baustellen.find(b => b.id === newBId);
              if (targetB) {
                setSheetTitle(`Aufmaß ${targetB.name}`);
              }
              if (role === 'admin') {
                setInspectorName('Admin');
              } else if (activeWorker) {
                setInspectorName(activeWorker.name);
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            {baustellen.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.projectNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            Bereich / Becken
          </label>
          <select
            value={selectedAreaId}
            onChange={e => {
              const newAId = e.target.value;
              setSelectedAreaId(newAId);
              const targetB = baustellen.find(b => b.id === selectedBaustelleId);
              const targetA = targetB?.areas.find(a => a.id === newAId);
              if (targetA) {
                setSheetTitle(`Aufmaß ${targetA.name}`);
              } else if (targetB) {
                setSheetTitle(`Aufmaß ${targetB.name}`);
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="all">Alle Bereiche / Gesamte Baustelle</option>
            {currentBaustelle?.areas.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
              </option>
            ))}
          </select>
        </div>

        {mode === 'list' && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Filter nach Erfasser
            </label>
            <select
              value={inspectorFilter}
              onChange={e => setInspectorFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            >
              <option value="all">Alle Erfasser</option>
              <option value="admin">🛡️ Admin</option>
              {workers.map(w => (
                <option key={w.id} value={w.name}>👷 {w.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 text-xs text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-700/60 pt-3 sm:pt-0 sm:pl-4">
          <button
            type="button"
            onClick={() => setMode('list')}
            className={`px-3 py-2 rounded-lg border transition flex items-center gap-2 cursor-pointer ${
              mode === 'list'
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-sm'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/50 hover:border-teal-500/50 text-slate-300 hover:text-white'
            }`}
            title="Zu den gespeicherten Aufmaßen wechseln"
          >
            <span className="text-teal-400 font-bold text-base">{relevantSheets.length}</span>
            <span className="font-semibold">Gespeicherte Aufmaße</span>
          </button>
        </div>
      </div>

      {/* Mode 1: List of Aufmass Sheets */}
      {mode === 'list' && (
        <div className="space-y-4">
          {relevantSheets.length === 0 ? (
            <div className="bg-slate-800/60 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ruler className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Noch kein Aufmaß für diese Baustelle erfasst</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                Erfassen Sie Rohrstrecken stückweise oder zählen Sie eingebaute Fittings und Ventile. Alle Materialien aus dem A-Z Katalog stehen bereit.
              </p>
              <button
                onClick={handleStartNewSheet}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Erstes Aufmaß anlegen</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relevantSheets.map(sheet => {
                const pipeItems = sheet.items.filter(i => i.unit === 'meter');
                const pieceItems = sheet.items.filter(i => i.unit !== 'meter');
                const totalM = pipeItems.reduce((acc, i) => acc + (i.total || 0), 0);
                const totalP = pieceItems.reduce((acc, i) => acc + (i.total || 0), 0);
                const isAdminCreator = (sheet.inspectorName || '').toLowerCase().includes('admin') || (sheet.inspectorName || '').toLowerCase().includes('bauleitung');

                return (
                  <div
                    key={sheet.id}
                    onClick={() => handleEditSheet(sheet)}
                    className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                            {sheet.areaName || 'Gesamte Baustelle'}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition mt-1.5">
                            {sheet.title}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                          {sheet.date}
                        </span>
                      </div>

                      {sheet.inspectorName && (
                        <div className="text-xs mb-3 flex items-center">
                          {isAdminCreator ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                              <span>🛡️ {sheet.inspectorName}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              <span>👷 {sheet.inspectorName}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats preview */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/40 mb-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Rohrlänge (Gesamt):</span>
                          <span className="font-bold text-teal-400 text-sm">{totalM.toFixed(1)} m</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Formteile / Stk.:</span>
                          <span className="font-bold text-sky-400 text-sm">{totalP} Stk.</span>
                        </div>
                      </div>

                      {/* Item Preview list */}
                      <div className="space-y-1 mb-4">
                        {sheet.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-300 flex items-center justify-between">
                            <span className="truncate max-w-[180px]">• {item.name}</span>
                            <span className="font-mono text-slate-400 shrink-0">
                              {item.unit === 'meter' ? `${item.total} m` : `${item.total} ${item.unit}`}
                            </span>
                          </div>
                        ))}
                        {sheet.items.length > 3 && (
                          <div className="text-[11px] text-teal-400 italic">
                            + {sheet.items.length - 3} weitere Positionen
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/60 mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleExportPdf(sheet, e)}
                          className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-teal-300 rounded-lg transition"
                          title="PDF herunterladen"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={(e) => handleSharePdf(sheet, e)}
                          className="p-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-xs font-semibold transition"
                          title="Aufmaß PDF teilen / WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSheet(sheet);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                          title="Bearbeiten"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSheet(sheet.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Aufmaß Editor */}
      {mode === 'edit' && (
        <div className="space-y-6">
          {/* Sheet Header Metadata Inputs */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              Aufmaßblatt Stammdaten
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <div className="bg-slate-900/60 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  Aufmaß Bezeichnung / Titel *
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={e => setSheetTitle(e.target.value)}
                  placeholder="z. B. Beckenumgang Verrohrung"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-900/60 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  Datum
                </label>
                <input
                  type="date"
                  value={sheetDate}
                  onChange={e => setSheetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-teal-500 focus:outline-none block"
                />
              </div>

              <div className="bg-slate-900/60 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Erfasser / Monteur
                </label>
                <div className="space-y-1.5">
                  {role === 'admin' ? (
                    <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-sky-400 font-bold">
                      <span>🛡️</span>
                      <span>Admin</span>
                    </div>
                  ) : (
                    <select
                      value={workers.some(w => w.name === inspectorName) ? inspectorName : (activeWorker?.name || workers[0]?.name || '')}
                      onChange={e => setInspectorName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                    >
                      {workers.map(w => (
                        <option key={w.id} value={w.name}>
                          👷 {w.name} {w.roleTitle ? `(${w.roleTitle})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add Material to Sheet Section */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-400" />
              Material aus A-Z Katalog auswählen & Maße eintragen
            </h2>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Alle ({catalog.length})
              </button>
              {categories.map(cat => {
                const count = catalog.filter(c => c.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search and Quick Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Catalog list / Search */}
              <div className="lg:col-span-5 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Material suchen (z.B. d63, Flansch, Schelle)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 bg-slate-900/90 border border-slate-700/60 rounded-xl p-1.5 scrollbar-thin">
                  {filteredCatalog.length === 0 ? (
                    <div className="text-center p-4 text-xs text-slate-400">
                      Kein Material gefunden
                    </div>
                  ) : (
                    filteredCatalog.map(item => {
                      const isSelected = selectedCatalogItem?.name === item.name;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedCatalogItem({
                              id: item.id,
                              name: item.name,
                              category: item.category,
                              unit: item.unit
                            });
                          }}
                          className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-teal-500/20 border border-teal-500 text-teal-200'
                              : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <span className="font-medium text-white block truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.unit === 'meter' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                          }`}>
                            {item.unit}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Material Detail & Segment Dimension Input Box */}
              <div className="lg:col-span-7 bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
                {selectedCatalogItem ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                          Ausgewählt: {selectedCatalogItem.unit === 'meter' ? 'Meterware / Rohrleitung' : 'Stückware / Zählobjekt'}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">
                          {selectedCatalogItem.name}
                        </h4>
                        <span className="text-xs text-slate-400">{selectedCatalogItem.category}</span>
                      </div>
                      <button
                        onClick={() => setSelectedCatalogItem(null)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Abwählen
                      </button>
                    </div>

                    {/* Conditional Input based on Unit (Meter vs Stk) */}
                    {selectedCatalogItem.unit === 'meter' ? (
                      <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-teal-500/30">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                            <Calculator className="w-4 h-4 text-teal-400" />
                            Einzelmaße / Rohrabschnitte addieren:
                          </label>
                          <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-500/40">
                            Summe: {parsedSegmentsTotal.toFixed(2)} m
                          </span>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={pipeSegmentsInput}
                            onChange={e => setPipeSegmentsInput(e.target.value)}
                            placeholder="z. B.  0.5 + 1.0 + 2.2 + 1.8 + 1.0"
                            className="w-full bg-slate-900 border border-teal-500/50 rounded-lg px-3 py-2 text-base font-mono text-teal-200 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            Tipp: Geben Sie Teillängen getrennt mit <b className="text-teal-300">+</b> oder Leerzeichen ein.
                          </p>
                        </div>

                        {/* Quick segment buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-400">Schnellzugriff:</span>
                          {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0].map(val => (
                            <button
                              key={val}
                              onClick={() => {
                                setPipeSegmentsInput(prev => (prev ? `${prev} + ${val}` : `${val}`));
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs rounded border border-slate-700 transition"
                            >
                              +{val}m
                            </button>
                          ))}
                        </div>

                        {/* Visual Breakdown of parsed segments */}
                        {parsedSegmentsPreview.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 mr-1">Abschnitte:</span>
                            {parsedSegmentsPreview.map((seg, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-teal-500/20 text-teal-300 text-xs rounded font-mono border border-teal-500/30"
                              >
                                {seg}m
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-sky-500/30">
                        <label className="text-xs font-semibold text-sky-300 block">
                          Menge / Stückzahl:
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setPieceQuantity(q => Math.max(1, q - 1))}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={pieceQuantity}
                            onChange={e => setPieceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 bg-slate-900 border border-sky-500/50 rounded-lg px-3 py-2 text-center text-lg font-bold text-white focus:outline-none"
                          />
                          <button
                            onClick={() => setPieceQuantity(q => q + 1)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-slate-300 font-semibold">{selectedCatalogItem.unit}</span>
                        </div>
                      </div>
                    )}

                    {/* Auto Flange info banner if applicable */}
                    {(() => {
                      const flangeCheck = findMatchingFlange(selectedCatalogItem.name, selectedCatalogItem.category, catalog);
                      if (!flangeCheck.matchingFlange) return null;
                      return (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-xs flex items-center gap-2 text-amber-300">
                          <span className="text-base">⚡</span>
                          <div>
                            <span className="font-bold">Automatischer Losflansch:</span>{' '}
                            <span>{flangeCheck.matchingFlange.name} ({pieceQuantity} Stk.) wird automatisch mit aufgenommen.</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Add Button */}
                    <button
                      onClick={handleAddItemToSheet}
                      className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Position zur Aufmaßliste hinzufügen</span>
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <Ruler className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">Kein Material gewählt</p>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Wählen Sie links ein Material aus dem Katalog, um Einzelmaße einzugeben.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Sheet Items Table */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers2 className="w-5 h-5 text-teal-400" />
                  Erfasste Aufmaß-Positionen ({sheetItems.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Übersicht aller gemessenen Rohrstrecken und Stückzahlen für dieses Aufmaßblatt.
                </p>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg text-xs font-bold text-teal-300">
                  Gesamt Rohre: <span className="text-sm text-teal-400">{totalMeters.toFixed(2)} m</span>
                </div>
                <div className="px-3 py-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-xs font-bold text-sky-300">
                  Gesamt Formteile: <span className="text-sm text-sky-400">{totalPieces} Stk.</span>
                </div>
              </div>
            </div>

            {sheetItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                Noch keine Positionen erfasst. Wählen Sie oben ein Material aus.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">OZ / Art-Nr</th>
                      <th className="py-2.5 px-3">Materialbezeichnung</th>
                      <th className="py-2.5 px-3">Aufmaß-Details (Einzelmaße / Kette)</th>
                      <th className="py-2.5 px-3 text-center">Gesamt</th>
                      <th className="py-2.5 px-3 text-center">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {sheetItems.map((item, idx) => {
                      const oz = item.articleNumber || catalog.find(c => c.name === item.name || (item.catalogItemId && c.id === item.catalogItemId))?.articleNumber || `OZ ${(idx + 1).toString().padStart(3, '0')}`;
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-3 font-mono text-teal-400 text-xs font-bold whitespace-nowrap">{oz}</td>
                          <td className="py-3 px-3 font-semibold text-white">
                            {item.name}
                          </td>
                        <td className="py-3 px-3">
                          {item.unit === 'meter' && item.segments && item.segments.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1 font-mono text-teal-300">
                              {item.segments.map((seg, sIdx) => (
                                <span key={sIdx} className="bg-slate-900 px-1.5 py-0.5 rounded border border-teal-500/20">
                                  {seg.toFixed(1)}m{sIdx < item.segments.length - 1 ? ' +' : ''}
                                </span>
                              ))}
                            </div>
                          ) : item.unit === 'meter' ? (
                            <span className="font-mono text-teal-300">{item.total} m</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateItemQuantity(item.id, -1)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-white">{item.quantity || item.total} {item.unit}</span>
                              <button
                                onClick={() => handleUpdateItemQuantity(item.id, 1)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-teal-400 text-sm">
                          {item.unit === 'meter' ? `${item.total.toFixed(2)} m` : `${item.total} ${item.unit}`}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Position löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={() => setMode('list')}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition cursor-pointer"
              >
                Abbrechen / Zurück zur Liste
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const b = baustellen.find(x => x.id === selectedBaustelleId);
                    const a = b?.areas.find(x => x.id === selectedAreaId);
                    const tempSheet: AufmassSheet = {
                      id: currentSheetId || 'temp',
                      baustelleId: selectedBaustelleId,
                      baustelleName: b ? b.name : 'Unbekannt',
                      areaId: selectedAreaId !== 'all' ? selectedAreaId : undefined,
                      areaName: a ? a.name : undefined,
                      title: sheetTitle.trim() || 'Aufmaß',
                      date: sheetDate,
                      inspectorName: inspectorName.trim() || undefined,
                      notes: sheetNotes.trim() || undefined,
                      items: sheetItems,
                      createdAt: new Date().toISOString()
                    };
                    generateAufmassPdf(tempSheet);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 font-bold text-sm rounded-xl shadow transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF Vorschau</span>
                </button>

                <button
                  onClick={handleSaveSheet}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Aufmaßblatt speichern</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
