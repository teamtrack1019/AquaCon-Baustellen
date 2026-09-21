import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Layers,
  CheckCircle2,
  X,
  FileText,
  UploadCloud,
  Send
} from 'lucide-react';
import { CatalogItem, MaterialCategory, MaterialUnit } from '../types';
import { sortCatalogItems } from '../utils/catalogSorter';

export const CatalogView: React.FC = () => {
  const {
    role,
    lang,
    t,
    catalog,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    baustellen,
    addMaterialToArea
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showSendToBaustelleModal, setShowSendToBaustelleModal] = useState<CatalogItem | null>(null);

  // Single Item form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<MaterialCategory>('PE Rohre & Fittings');
  const [itemUnit, setItemUnit] = useState<MaterialUnit>('Stk.');
  const [itemArticleNo, setItemArticleNo] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Duplicate Article Number check
  const duplicateArticleItem = useMemo(() => {
    const trimmedNo = itemArticleNo.trim().toLowerCase();
    if (!trimmedNo) return null;
    return catalog.find(c =>
      c.articleNumber &&
      c.articleNumber.trim().toLowerCase() === trimmedNo &&
      (!editingItem || c.id !== editingItem.id)
    );
  }, [itemArticleNo, catalog, editingItem]);

  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaultCategory, setBulkDefaultCategory] = useState<MaterialCategory>('PE Rohre & Fittings');

  // Send to Baustelle state
  const [targetBaustelleId, setTargetBaustelleId] = useState(baustellen[0]?.id || '');
  const [targetAreaId, setTargetAreaId] = useState(baustellen[0]?.areas[0]?.id || '');
  const [targetRequiredQty, setTargetRequiredQty] = useState<string | number>(1);
  const [targetOnSiteQty, setTargetOnSiteQty] = useState<string | number>('0');

  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredCatalog = useMemo(() => {
    const filtered = catalog.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.articleNumber && item.articleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      const matchesDimension = selectedDimension === 'all' || new RegExp(`\\b${selectedDimension}\\b`, 'i').test(item.name);

      const matchesType = selectedType === 'all' || (() => {
        const n = item.name.toLowerCase();
        if (selectedType === 'rohr') return n.includes('druckrohr') || n.includes('rohr');
        if (selectedType === 'bogen') return n.includes('bogen');
        if (selectedType === 'vorschweissbund') return n.includes('vorschweißbund') || n.includes('bundbuchse');
        if (selectedType === 'flansch') return n.includes('flansch') || n.includes('dichtung');
        if (selectedType === 'tstueck') return n.includes('t-stück');
        if (selectedType === 'reduktion') return n.includes('reduktion');
        if (selectedType === 'emuffe') return n.includes('muffe');
        if (selectedType === 'uksmuffe') return n.includes('uks') || n.includes('überschieb');
        if (selectedType === 'schauglas') return n.includes('schauglas') || n.includes('schaugläser');
        if (selectedType === 'kappe') return n.includes('endkappe') || n.includes('kappe');
        return true;
      })();

      return matchesSearch && matchesCategory && matchesDimension && matchesType;
    });

    return sortCatalogItems(filtered);
  }, [catalog, searchTerm, selectedCategory, selectedDimension, selectedType]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory(selectedCategory !== 'all' ? (selectedCategory as MaterialCategory) : 'PE Rohre & Fittings');
    setItemUnit('Stk.');
    setItemArticleNo('');
    setItemNotes('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemUnit(item.unit);
    setItemArticleNo(item.articleNumber || '');
    setItemNotes(item.notes || '');
    setShowAddModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = itemName.trim();
    if (!finalName) return;

    if (duplicateArticleItem) {
      alert(`Diese Artikelnummer "${itemArticleNo.trim()}" existiert bereits für den Artikel "${duplicateArticleItem.name}" (${duplicateArticleItem.category})! Bitte wählen Sie eine andere Artikelnummer.`);
      return;
    }

    if (editingItem) {
      updateCatalogItem(editingItem.id, {
        name: finalName,
        category: itemCategory,
        unit: itemUnit,
        articleNumber: itemArticleNo.trim() || undefined,
        notes: itemNotes.trim() || undefined
      });
    } else {
      addCatalogItem({
        name: finalName,
        category: itemCategory,
        unit: itemUnit,
        articleNumber: itemArticleNo.trim() || undefined,
        notes: itemNotes.trim() || undefined
      });
    }

    setShowAddModal(false);
    setEditingItem(null);
    setItemName('');
    setItemArticleNo('');
    setItemNotes('');
  };

  const handleDeleteCatalogItem = (item: CatalogItem) => {
    if (window.confirm(`Möchten Sie den Artikel "${item.name}" wirklich aus dem A-Z Katalog löschen?`)) {
      deleteCatalogItem(item.id);
    }
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);

    lines.forEach(line => {
      // Examples to parse:
      // "2 stk. PE Bogen DA 63"
      // "6 stk. PE Bogen DA 315"
      // "5 stk. Vorschweißbund DA 140"
      // "PE T-Stück DA 110"
      let unit: MaterialUnit = 'Stk.';
      let name = line;

      const unitMatch = line.match(/^(\d+[\.,]?\d*|\d+)\s*(stk\.?|meter|m|lfm|m²|palette|pal\.?)\s*(.+)$/i);
      if (unitMatch) {
        const rawUnit = unitMatch[2].toLowerCase().replace('.', '');
        name = unitMatch[3].trim();
        if (rawUnit === 'stk') unit = 'Stk.';
        else if (rawUnit === 'meter' || rawUnit === 'm' || rawUnit === 'lfm' || rawUnit === 'm²') unit = 'meter';
        else if (rawUnit === 'palette' || rawUnit === 'pal') unit = 'Palette';
      }

      addCatalogItem({
        name: name,
        category: bulkDefaultCategory,
        unit: unit
      });
    });

    setShowBulkImportModal(false);
    setBulkText('');
  };

  const handleSendToBaustelle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSendToBaustelleModal || !targetBaustelleId || !targetAreaId) return;

    addMaterialToArea(targetBaustelleId, targetAreaId, {
      catalogItemId: showSendToBaustelleModal.id,
      name: showSendToBaustelleModal.name,
      category: showSendToBaustelleModal.category,
      unit: showSendToBaustelleModal.unit,
      requiredQty: Number(targetRequiredQty) || 0,
      onSiteQty: Number(targetOnSiteQty) || 0
    });

    setShowSendToBaustelleModal(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-sky-600" />
            <span>A-Z Materialkatalog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Zentraler Artikelstamm für schnelle Auswahl bei der Materialführung (z. B. PE Bogen DA 63, PE Bogen DA 315, Vorschweißbund DA 140).
          </p>
        </div>

        {role === 'admin' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <UploadCloud className="w-4 h-4 text-sky-600" />
              <span>Massen-Import (Liste)</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Neuer Artikel</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Artikel suchen (z. B. PE Bogen, Vorschweißbund)..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-full transition cursor-pointer"
              title="Suche leeren"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
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

      {/* Piping (PE / PVC) Sub-type Quick Pills */}
      {(selectedCategory === 'all' || selectedCategory === 'PE Rohre & Fittings' || selectedCategory === 'PVC Rohre & Fittings') && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs text-xs">
          {/* Component Types */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">Bauteil:</span>
            {[
              { id: 'all', label: 'Alle Bauteile' },
              { id: 'rohr', label: 'Druckrohre' },
              { id: 'bogen', label: selectedCategory === 'PE Rohre & Fittings' ? 'Bögen 90°' : 'Bögen 90°/45°' },
              { id: 'vorschweissbund', label: 'Vorschweißbunde / Bundbuchsen' },
              { id: 'flansch', label: 'Losflansche & Dichtungen' },
              { id: 'tstueck', label: 'T-Stücke' },
              { id: 'reduktion', label: 'Reduktionen' },
              { id: 'emuffe', label: selectedCategory === 'PE Rohre & Fittings' ? 'E-Muffen' : 'Muffen' },
              ...(selectedCategory !== 'PE Rohre & Fittings'
                ? [
                    { id: 'uksmuffe', label: 'UKS Muffen' },
                    { id: 'schauglas', label: 'Schaugläser' }
                  ]
                : []),
              { id: 'kappe', label: 'Endkappen' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedType === type.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screw Sub-type Quick Pills */}
      {(selectedCategory === 'Verzinkte Schrauben' || selectedCategory === 'VA Schrauben') && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs text-xs flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">Gewinde:</span>
          <button
            onClick={() => setSelectedDimension('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedDimension === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Alle Längen
          </button>
          {['M12', 'M16', 'M20', 'M24'].map(m => (
            <button
              key={m}
              onClick={() => setSelectedDimension(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono whitespace-nowrap transition-colors ${
                selectedDimension === m
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalog.map(item => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-50 text-sky-700 border border-sky-100">
                  {item.category}
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {item.unit}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                {item.name}
              </h3>

              {item.articleNumber && (
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Art-Nr: {item.articleNumber}
                </div>
              )}

              {item.notes && (
                <p className="text-[11px] text-slate-400 italic mt-1">{item.notes}</p>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSendToBaustelleModal(item);
                  if (baustellen.length > 0) {
                    setTargetBaustelleId(baustellen[0].id);
                    if (baustellen[0].areas.length > 0) {
                      setTargetAreaId(baustellen[0].areas[0].id);
                    }
                  }
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                title="In Baustelle einfügen"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Einfügen</span>
              </button>

              {role === 'admin' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Artikel bearbeiten"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCatalogItem(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Artikel löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCatalog.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700">
            Keine Artikel im Katalog gefunden
          </h3>
        </div>
      )}

      {/* Modal: Single Add / Edit Item */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                <span>{editingItem ? 'Artikel bearbeiten' : 'Neuen Katalogartikel anlegen'}</span>
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.material} *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="z. B. PE Bogen DA 63, Vorschweißbund DA 140"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.category}</label>
                  <select
                    value={itemCategory}
                    onChange={e => setItemCategory(e.target.value as MaterialCategory)}
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
                    value={itemUnit}
                    onChange={e => setItemUnit(e.target.value as MaterialUnit)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
                  >
                    <option value="Stk.">Stk.</option>
                    <option value="meter">meter</option>
                    <option value="Palette">Palette</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Artikelnummer</label>
                <input
                  type="text"
                  value={itemArticleNo}
                  onChange={e => setItemArticleNo(e.target.value)}
                  placeholder="z. B. PE-63-90"
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:outline-none ${
                    duplicateArticleItem
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-sky-500'
                  }`}
                />
                {duplicateArticleItem && (
                  <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Diese Artikelnummer ist bereits vergeben für &quot;{duplicateArticleItem.name}&quot; ({duplicateArticleItem.category})!</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notiz / Spezifikation (optional)</label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  placeholder="z. B. PN 16, SDR 11, etc."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!!duplicateArticleItem}
                  className={`px-4 py-2 text-white font-bold rounded-xl text-xs transition-colors ${
                    duplicateArticleItem
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-sky-600 hover:bg-sky-500'
                  }`}
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Import */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-sky-600" />
                <span>Massen-Import von Materialliste</span>
              </h3>
              <button onClick={() => setShowBulkImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Fügen Sie hier Ihre Liste zeilenweise ein. Unser intelligenter Parser erkennt Einheiten automatisch.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard-Kategorie für diesen Import</label>
                <select
                  value={bulkDefaultCategory}
                  onChange={e => setBulkDefaultCategory(e.target.value as MaterialCategory)}
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
                <label className="block font-bold text-slate-700 mb-1">Listeninhalt</label>
                <textarea
                  rows={6}
                  required
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={`2 stk. PE Bogen DA 63\n6 stk. PE Bogen DA 315\n5 stk. Vorschweißbund DA 140\n10 stk. Losflansch DA 140`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  In Katalog importieren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Send Item to Baustelle */}
      {showSendToBaustelleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Send className="w-5 h-5 text-sky-600" />
                <span>Auf Baustelle & Becken übernehmen</span>
              </h3>
              <button onClick={() => setShowSendToBaustelleModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendToBaustelle} className="space-y-4 text-xs">
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 font-bold text-sky-950">
                {showSendToBaustelleModal.name} ({showSendToBaustelleModal.unit})
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.baustelle}</label>
                <select
                  value={targetBaustelleId}
                  onChange={e => {
                    setTargetBaustelleId(e.target.value);
                    const b = baustellen.find(item => item.id === e.target.value);
                    if (b && b.areas[0]) setTargetAreaId(b.areas[0].id);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {baustellen.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.areas}</label>
                <select
                  value={targetAreaId}
                  onChange={e => setTargetAreaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {baustellen
                    .find(b => b.id === targetBaustelleId)
                    ?.areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.requiredQty}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={targetRequiredQty}
                    onFocus={e => e.target.select()}
                    onChange={e => setTargetRequiredQty(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.onSiteQty}</label>
                  <input
                    type="number"
                    min="0"
                    value={targetOnSiteQty}
                    onFocus={e => e.target.select()}
                    onChange={e => setTargetOnSiteQty(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSendToBaustelleModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
