import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Download,
  Share2,
  X,
  Package,
  Calendar,
  Building2,
  Waves,
  Search
} from 'lucide-react';
import { MaterialCategory, MaterialUnit, OrderItem } from '../types';
import { generateOrderPdf } from '../utils/pdfGenerator';
import {
  findMatchingFlange,
  getMatchingScrewsForFlange,
  parseScrewInfo,
  SCREW_LENGTHS_MAP,
  buildScrewName
} from '../utils/flangeHelper';
import { ScrewConfigurator } from './ScrewConfigurator';

interface NewOrderModalProps {
  prefill?: { baustelleId?: string; areaId?: string };
  onClose: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ prefill, onClose }) => {
  const {
    role,
    lang,
    t,
    baustellen,
    catalog,
    createOrder,
    allShortages,
    workers,
    activeWorker
  } = useApp();

  const [selectedBaustelleId, setSelectedBaustelleId] = useState(prefill?.baustelleId || baustellen[0]?.id || '');
  const [selectedAreaId, setSelectedAreaId] = useState(prefill?.areaId || '');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [createdByName, setCreatedByName] = useState(
    role === 'worker' ? (activeWorker?.name || 'Mitarbeiter') : 'Bauleitung'
  );

  // Items to order
  const [items, setItems] = useState<Omit<OrderItem, 'id'>[]>([]);

  // Catalog item picker in modal
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [pickQty, setPickQty] = useState<string | number>(1);

  // Free text material
  const [freeName, setFreeName] = useState('');
  const [freeUnit, setFreeUnit] = useState<MaterialUnit>('Stk.');
  const [freeQty, setFreeQty] = useState<string | number>(1);
  const [showScrewWizard, setShowScrewWizard] = useState(false);
  const [screwPreference, setScrewPreference] = useState<'vz' | 'va' | 'none'>('vz');

  const currentBaustelle = baustellen.find(b => b.id === selectedBaustelleId);

  // Helper to merge order items without creating duplicate rows
  const mergeOrderItems = (existing: Omit<OrderItem, 'id'>[], newEntries: Omit<OrderItem, 'id'>[]) => {
    let updated = [...existing];
    for (const entry of newEntries) {
      const existingIdx = updated.findIndex(item => {
        if (entry.catalogItemId && item.catalogItemId && entry.catalogItemId === item.catalogItemId) {
          return true;
        }
        return item.name.trim().toLowerCase() === entry.name.trim().toLowerCase() && item.unit === entry.unit;
      });

      if (existingIdx >= 0) {
        const target = updated[existingIdx];
        const newOrderedQty = (target.orderedQty || 0) + (entry.orderedQty || 0);
        updated[existingIdx] = {
          ...target,
          orderedQty: newOrderedQty,
          flaggedMissingQty: newOrderedQty
        };
      } else {
        updated.push(entry);
      }
    }
    return updated;
  };

  // Initialize with prefilled shortages if requested
  useEffect(() => {
    if (prefill?.baustelleId) {
      setSelectedBaustelleId(prefill.baustelleId);
      if (prefill.areaId) {
        setSelectedAreaId(prefill.areaId);
      }
    }
  }, [prefill]);

  const handleLoadShortages = () => {
    if (!currentBaustelle) return;

    let relevantShortages = allShortages.filter(s => s.baustelleId === selectedBaustelleId);
    if (selectedAreaId) {
      relevantShortages = relevantShortages.filter(s => s.areaId === selectedAreaId);
    }

    const newItems: Omit<OrderItem, 'id'>[] = relevantShortages.map(s => ({
      catalogItemId: s.material.catalogItemId,
      name: s.material.name,
      category: s.material.category,
      unit: s.material.unit,
      orderedQty: s.shortageQty,
      deliveredQty: 0,
      flaggedMissingQty: s.shortageQty,
      isFlagged: false,
      status: 'pending'
    }));

    setItems(prev => mergeOrderItems(prev, newItems));
  };

  const handleAddCatalogItem = () => {
    if (!selectedCatalogItem) return;

    const qty = Number(pickQty) || 1;
    const newEntries: Omit<OrderItem, 'id'>[] = [
      {
        catalogItemId: selectedCatalogItem.id,
        name: selectedCatalogItem.name,
        category: selectedCatalogItem.category,
        unit: selectedCatalogItem.unit,
        orderedQty: qty,
        deliveredQty: 0,
        flaggedMissingQty: qty,
        isFlagged: false,
        status: 'pending'
      }
    ];

    // Check matching Losflansch
    const flangeCheck = findMatchingFlange(selectedCatalogItem.name, selectedCatalogItem.category, catalog);
    if (flangeCheck.matchingFlange) {
      newEntries.push({
        catalogItemId: flangeCheck.matchingFlange.catalogItemId,
        name: flangeCheck.matchingFlange.name,
        category: flangeCheck.matchingFlange.category,
        unit: flangeCheck.matchingFlange.unit,
        orderedQty: qty,
        deliveredQty: 0,
        flaggedMissingQty: qty,
        isFlagged: false,
        status: 'pending'
      });
    }

    // Auto-add matching Schraubensatz
    if (screwPreference !== 'none') {
      const screwCheck = getMatchingScrewsForFlange(selectedCatalogItem.name, catalog);
      if (screwCheck) {
        const screwCat: MaterialCategory = screwPreference === 'va' ? 'VA Schrauben' : 'Verzinkte Schrauben';
        const screwName = screwPreference === 'va' ? screwCheck.recommendedNameVa : screwCheck.recommendedNameVz;
        const screwCatItem = screwPreference === 'va' ? screwCheck.matchingCatalogItemVa : screwCheck.matchingCatalogItemVz;
        const screwCount = screwCheck.countPerFlange * qty;

        newEntries.push({
          catalogItemId: screwCatItem?.id,
          name: screwName,
          category: screwCat,
          unit: 'Stk.',
          orderedQty: screwCount,
          deliveredQty: 0,
          flaggedMissingQty: screwCount,
          isFlagged: false,
          status: 'pending'
        });
      }
    }

    setItems(prev => mergeOrderItems(prev, newEntries));

    setSelectedCatalogItem(null);
    setPickQty(1);
    setCatalogSearch('');
  };

  const handleAddDirectScrew = (name: string, category: MaterialCategory, qty: number) => {
    const catItem = catalog.find(c => c.name.toLowerCase() === name.toLowerCase());
    const newEntry: Omit<OrderItem, 'id'> = {
      catalogItemId: catItem?.id,
      name: catItem?.name || name,
      category,
      unit: 'Stk.',
      orderedQty: qty,
      deliveredQty: 0,
      flaggedMissingQty: qty,
      isFlagged: false,
      status: 'pending'
    };
    setItems(prev => mergeOrderItems(prev, [newEntry]));
  };

  const handleAddFreeItem = () => {
    if (!freeName.trim()) return;

    const qty = Number(freeQty) || 1;
    const newEntries: Omit<OrderItem, 'id'>[] = [
      {
        name: freeName.trim(),
        unit: freeUnit,
        orderedQty: qty,
        deliveredQty: 0,
        flaggedMissingQty: qty,
        isFlagged: false,
        status: 'pending'
      }
    ];

    // Check matching Losflansch
    const flangeCheck = findMatchingFlange(freeName.trim(), 'PE Rohre & Fittings', catalog);
    if (flangeCheck.matchingFlange) {
      newEntries.push({
        catalogItemId: flangeCheck.matchingFlange.catalogItemId,
        name: flangeCheck.matchingFlange.name,
        category: flangeCheck.matchingFlange.category,
        unit: flangeCheck.matchingFlange.unit,
        orderedQty: qty,
        deliveredQty: 0,
        flaggedMissingQty: qty,
        isFlagged: false,
        status: 'pending'
      });
    }

    // Check matching Schraubensatz
    if (screwPreference !== 'none') {
      const screwCheck = getMatchingScrewsForFlange(freeName.trim(), catalog);
      if (screwCheck) {
        const screwCat: MaterialCategory = screwPreference === 'va' ? 'VA Schrauben' : 'Verzinkte Schrauben';
        const screwName = screwPreference === 'va' ? screwCheck.recommendedNameVa : screwCheck.recommendedNameVz;
        const screwCatItem = screwPreference === 'va' ? screwCheck.matchingCatalogItemVa : screwCheck.matchingCatalogItemVz;
        const screwCount = screwCheck.countPerFlange * qty;

        newEntries.push({
          catalogItemId: screwCatItem?.id,
          name: screwName,
          category: screwCat,
          unit: 'Stk.',
          orderedQty: screwCount,
          deliveredQty: 0,
          flaggedMissingQty: screwCount,
          isFlagged: false,
          status: 'pending'
        });
      }
    }

    setItems(prev => mergeOrderItems(prev, newEntries));

    setFreeName('');
    setFreeQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQty = (index: number, qty: number) => {
    setItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      orderedQty: qty,
      flaggedMissingQty: qty
    } : item));
  };

  const handleUpdateItemScrew = (index: number, newName: string, newCategory: MaterialCategory) => {
    setItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      name: newName,
      category: newCategory
    } : item));
  };

  const handleSubmit = (e: React.FormEvent, andDownloadPdf: boolean = false) => {
    e.preventDefault();
    if (!currentBaustelle || items.length === 0) return;

    const area = currentBaustelle.areas.find(a => a.id === selectedAreaId);

    const orderId = createOrder({
      baustelleId: currentBaustelle.id,
      baustelleName: currentBaustelle.name,
      areaId: area?.id,
      areaName: area?.name,
      orderDate,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      status: 'ordered',
      createdByRole: role,
      createdByName,
      notes: orderNotes.trim() || undefined,
      items: items.map((item, idx) => ({
        ...item,
        id: `oi-${Date.now()}-${idx}`
      }))
    });

    if (andDownloadPdf) {
      generateOrderPdf({
        id: orderId,
        orderNumber: `ANF-${new Date().getFullYear()}-NEU`,
        baustelleId: currentBaustelle.id,
        baustelleName: currentBaustelle.name,
        areaId: area?.id,
        areaName: area?.name,
        orderDate,
        expectedDeliveryDate,
        status: 'ordered',
        createdAt: new Date().toISOString(),
        createdByRole: role,
        createdByName,
        notes: orderNotes,
        items: items.map((item, idx) => ({
          ...item,
          id: `oi-${Date.now()}-${idx}`
        }))
      });
    }

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 text-slate-900 max-h-[88dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between shrink-0 bg-white">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Bestellwesen & Materialanforderung</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Neue Bestellung erfassen
            </h2>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs overscroll-contain">
          {/* Baustelle & Becken Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1">{t.baustelle} *</label>
              <select
                value={selectedBaustelleId}
                onChange={e => {
                  setSelectedBaustelleId(e.target.value);
                  setSelectedAreaId('');
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {baustellen.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.projectNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Bereich (Becken / Gebäude)</label>
              <select
                value={selectedAreaId}
                onChange={e => setSelectedAreaId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Gesamte Baustelle (Alle Bereiche)</option>
                {currentBaustelle?.areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            {/* Quick 1-Click Shortages Auto-fill */}
            <div className="sm:col-span-2 flex items-center justify-between pt-1">
              <span className="text-slate-500 text-[11px]">
                Fehlende Materialien automatisch übernehmen?
              </span>
              <button
                type="button"
                onClick={handleLoadShortages}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-xs transition-colors flex items-center space-x-1"
              >
                <span>⚡ Fehlmengen laden (1-Klick)</span>
              </button>
            </div>
          </div>

          {/* Dates & Requester */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.orderDate} *</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t.deliveryDate}</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={e => setExpectedDeliveryDate(e.target.value)}
                placeholder="Gewünschter Liefertermin"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Anforderer / Erfasser</label>
              <div className="flex items-center space-x-1">
                <select
                  value={
                    createdByName === 'Bauleitung' || createdByName === 'Admin (Zentrale)' || workers.some(w => w.name === createdByName)
                      ? createdByName
                      : 'custom'
                  }
                  onChange={e => {
                    if (e.target.value !== 'custom') {
                      setCreatedByName(e.target.value);
                    }
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none flex-1"
                >
                  <option value="Bauleitung">🛡️ Bauleitung (Admin)</option>
                  <option value="Admin (Zentrale)">🛡️ Admin (Zentrale)</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.name}>👷 {w.name}</option>
                  ))}
                  <option value="custom">✍️ Anderer Name...</option>
                </select>
                {createdByName !== 'Bauleitung' && createdByName !== 'Admin (Zentrale)' && !workers.some(w => w.name === createdByName) && (
                  <input
                    type="text"
                    value={createdByName}
                    onChange={e => setCreatedByName(e.target.value)}
                    placeholder="Name eingeben"
                    className="w-28 bg-white border border-slate-300 rounded-xl px-2 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-sky-950 block">
                ➕ Materialien zur Bestellung hinzufügen:
              </span>
              <button
                type="button"
                onClick={() => setShowScrewWizard(!showScrewWizard)}
                className="px-3 py-1 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔩</span>
                <span>{showScrewWizard ? 'Schrauben-Assistent schließen' : 'Schraubensatz konfigurieren (M12-M24)'}</span>
              </button>
            </div>

            {showScrewWizard && (
              <div className="my-2">
                <ScrewConfigurator
                  onSelectScrew={(screw) => {
                    handleAddDirectScrew(screw.name, screw.category, screw.quantity);
                    setShowScrewWizard(false);
                  }}
                />
              </div>
            )}

            {/* A-Z Catalog Quick Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Aus A-Z Katalog suchen (z. B. PE Bogen, Vorschweißbund)..."
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />

                {catalogSearch && !selectedCatalogItem && (
                  <div className="max-h-52 overflow-y-auto bg-white border border-sky-300 rounded-xl p-1.5 mt-1 shadow-xl z-20 divide-y divide-slate-100">
                    {catalog
                      .filter(c => {
                        const searchParts = catalogSearch.toLowerCase().split(' ').filter(Boolean);
                        const itemText = `${c.name} ${c.category} ${c.articleNumber || ''}`.toLowerCase();
                        return searchParts.every(part => itemText.includes(part));
                      })
                      .slice(0, 50)
                      .map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedCatalogItem(item);
                            setCatalogSearch(item.name);
                          }}
                          className="p-2 hover:bg-sky-50 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">{item.name}</span>
                            {item.notes && <span className="text-[10px] text-slate-400 block">{item.notes}</span>}
                          </div>
                          <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded ml-2 whitespace-nowrap">{item.unit}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  min="1"
                  value={pickQty}
                  onFocus={e => e.target.select()}
                  onChange={e => setPickQty(e.target.value)}
                  placeholder="Menge"
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-bold text-center text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddCatalogItem}
                  disabled={!selectedCatalogItem}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Einfügen</span>
                </button>
              </div>
            </div>

            {/* Auto Flange & Schrauben preview indicator */}
            {selectedCatalogItem && (() => {
              const flangeCheck = findMatchingFlange(selectedCatalogItem.name, selectedCatalogItem.category, catalog);
              const screwCheck = getMatchingScrewsForFlange(selectedCatalogItem.name, catalog);
              const qty = Number(pickQty) || 1;

              if (!flangeCheck.matchingFlange && !screwCheck) return null;

              return (
                <div className="space-y-2 bg-gradient-to-r from-sky-50 to-amber-50 p-3 rounded-xl border border-sky-200">
                  <div className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Wird beim Klick auf "+ Einfügen" automatisch mitbestellt:</span>
                  </div>

                  {flangeCheck.matchingFlange && (
                    <div className="bg-amber-100/90 border border-amber-300 rounded-lg px-2.5 py-1.5 text-[11px] flex items-center justify-between text-amber-900 font-medium">
                      <span>• <strong>Losflansch:</strong> {flangeCheck.matchingFlange.name}</span>
                      <span className="font-mono font-bold">{qty} Stk.</span>
                    </div>
                  )}

                  {screwCheck && (
                    <div className="bg-sky-100/90 border border-sky-300 rounded-lg px-2.5 py-1.5 text-[11px] text-sky-950">
                      <div className="flex items-center justify-between font-medium mb-1">
                        <span className="flex items-center gap-1">
                          <span>🔩</span>
                          <span><strong>Passender Schraubensatz:</strong> {screwCheck.countPerFlange * qty}x {screwCheck.metric} x {screwCheck.length} mm</span>
                        </span>
                        <span className="font-mono font-bold">{screwCheck.countPerFlange * qty} Stk.</span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1 border-t border-sky-200">
                        <span className="text-[10px] text-slate-500 font-semibold">Material:</span>
                        <button
                          type="button"
                          onClick={() => setScrewPreference('vz')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            screwPreference === 'vz'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-sky-50 border border-slate-200'
                          }`}
                        >
                          ✓ Verzinkt (8.8)
                        </button>
                        <button
                          type="button"
                          onClick={() => setScrewPreference('va')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            screwPreference === 'va'
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
                          }`}
                        >
                          ✓ VA (Edelstahl)
                        </button>
                        <button
                          type="button"
                          onClick={() => setScrewPreference('none')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            screwPreference === 'none'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          Keine Schrauben
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Manual free text row */}
            <div className="pt-2 border-t border-sky-200/60 grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={freeName}
                  onChange={e => setFreeName(e.target.value)}
                  placeholder="Oder freier Materialname..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={freeUnit}
                  onChange={e => setFreeUnit(e.target.value as MaterialUnit)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-bold focus:outline-none"
                >
                  <option value="Stk.">Stk.</option>
                  <option value="meter">meter</option>
                  <option value="Palette">Palette</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  min="1"
                  value={freeQty}
                  onFocus={e => e.target.select()}
                  onChange={e => setFreeQty(e.target.value)}
                  placeholder="Menge"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-center text-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddFreeItem}
                  disabled={!freeName.trim()}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Freitext +</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Order Items Table */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block">
              📋 Bestellpositionen ({items.length} Artikel):
            </span>

            {items.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Noch keine Positionen hinzugefügt. Wählen Sie oben Artikel aus oder klicken Sie auf "⚡ Fehlmengen laden".
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 pl-4">Pos</th>
                      <th className="p-2.5">{t.material}</th>
                      <th className="p-2.5 text-center">Bestellmenge</th>
                      <th className="p-2.5 text-right pr-4">Entfernen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 pl-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <div>{item.name}</div>
                          {(() => {
                            const screwInfo = parseScrewInfo(item.name);
                            if (!screwInfo.isScrew) return null;
                            const availableLengths = SCREW_LENGTHS_MAP[screwInfo.metric] || [50, 60, 70, 80, 90, 100, 120, 140];
                            return (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 font-normal">
                                <span className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
                                  <span>🔩 Länge:</span>
                                </span>
                                <select
                                  value={screwInfo.length}
                                  onChange={(e) => {
                                    const newLen = parseInt(e.target.value, 10);
                                    const built = buildScrewName(screwInfo.materialType, screwInfo.metric, newLen);
                                    handleUpdateItemScrew(idx, built.name, built.category);
                                  }}
                                  className="bg-white border border-sky-300 text-sky-950 text-[11px] font-bold rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer"
                                >
                                  {availableLengths.map(l => (
                                    <option key={l} value={l}>{l} mm ({screwInfo.metric} x {l})</option>
                                  ))}
                                </select>

                                {/* Thread Metric selector */}
                                <select
                                  value={screwInfo.metric}
                                  onChange={(e) => {
                                    const newM = e.target.value as any;
                                    const newLengths = SCREW_LENGTHS_MAP[newM] || [80];
                                    const newLen = newLengths.includes(screwInfo.length) ? screwInfo.length : newLengths[0];
                                    const built = buildScrewName(screwInfo.materialType, newM, newLen);
                                    handleUpdateItemScrew(idx, built.name, built.category);
                                  }}
                                  className="bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer"
                                >
                                  <option value="M12">M12</option>
                                  <option value="M16">M16</option>
                                  <option value="M20">M20</option>
                                  <option value="M24">M24</option>
                                </select>

                                {/* Quick Material Switch vz / va */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextMat = screwInfo.materialType === 'vz' ? 'va' : 'vz';
                                    const built = buildScrewName(nextMat, screwInfo.metric, screwInfo.length);
                                    handleUpdateItemScrew(idx, built.name, built.category);
                                  }}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border transition cursor-pointer ${
                                    screwInfo.materialType === 'va'
                                      ? 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100'
                                      : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                                  }`}
                                  title="Zwischen Verzinkt und VA Edelstahl wechseln"
                                >
                                  {screwInfo.materialType === 'va' ? '✓ VA Edelstahl' : '✓ Verzinkt 8.8'} ⇄
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.orderedQty}
                            onFocus={e => e.target.select()}
                            onChange={e => handleUpdateQty(idx, Number(e.target.value) || 1)}
                            className="w-16 text-center py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                          />{' '}
                          <span className="font-semibold text-slate-500">{item.unit}</span>
                        </td>
                        <td className="p-2.5 text-right pr-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Bestellhinweis / Anmerkung</label>
            <input
              type="text"
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="z. B. Lieferung bitte direkt auf Baustelle Tor 2 abladen"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-slate-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            {t.cancel}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={items.length === 0}
              onClick={e => handleSubmit(e, true)}
              className="px-3 sm:px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              disabled={items.length === 0}
              onClick={e => handleSubmit(e, false)}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/25 transition-all"
            >
              Bestellung anlegen
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
