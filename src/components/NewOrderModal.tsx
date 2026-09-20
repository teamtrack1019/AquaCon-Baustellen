import React, { useState, useEffect } from 'react';
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
import { findMatchingFlange } from '../utils/flangeHelper';

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

  const currentBaustelle = baustellen.find(b => b.id === selectedBaustelleId);

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

    setItems(newItems);
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

    setItems(prev => [...prev, ...newEntries]);

    setSelectedCatalogItem(null);
    setPickQty(1);
    setCatalogSearch('');
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

    setItems(prev => [...prev, ...newEntries]);

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto safe-top-header safe-bottom-nav">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 text-slate-900 max-h-[calc(100dvh-2.5rem)] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between shrink-0 bg-white sticky top-0 z-20">
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

          {/* Item Selector Section */}
          <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-100 space-y-3">
            <span className="font-bold text-sky-950 block">
              ➕ Materialien zur Bestellung hinzufügen:
            </span>

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

            {/* Auto Flange preview indicator */}
            {selectedCatalogItem && (() => {
              const flangeCheck = findMatchingFlange(selectedCatalogItem.name, selectedCatalogItem.category, catalog);
              if (!flangeCheck.matchingFlange) return null;
              return (
                <div className="bg-amber-100/90 border border-amber-300 rounded-lg px-2.5 py-1.5 text-[11px] flex items-center gap-1.5 text-amber-900 font-medium">
                  <span>⚡</span>
                  <span><strong>Automatischer Losflansch:</strong> {flangeCheck.matchingFlange.name} ({Number(pickQty) || 1} Stk.) wird automatisch mitbestellt.</span>
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
                        <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
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
        <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white sticky bottom-0 z-10">
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
              type="submit"
              disabled={items.length === 0}
              onClick={e => handleSubmit(e, false)}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/25 transition-all"
            >
              Bestellung anlegen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
