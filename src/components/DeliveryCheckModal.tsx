import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Order, OrderItem } from '../types';
import { CheckCircle2, AlertTriangle, PackageCheck, X, Truck } from 'lucide-react';

interface DeliveryCheckModalProps {
  order: Order;
  onClose: () => void;
}

export const DeliveryCheckModal: React.FC<DeliveryCheckModalProps> = ({ order, onClose }) => {
  const { lang, t, checkAndReceiveDelivery } = useApp();

  // State for each item in the order
  const [itemDeliveries, setItemDeliveries] = useState<{
    [itemId: string]: {
      deliveredQty: number; // newly delivered quantity in this shipment
      isFlaggedMissing: boolean;
      flagNote: string;
    };
  }>(() => {
    const initial: any = {};
    order.items.forEach(item => {
      const remaining = Math.max(0, item.orderedQty - item.deliveredQty);
      initial[item.id] = {
        deliveredQty: remaining, // default to receiving the full remaining amount
        isFlaggedMissing: item.isFlagged,
        flagNote: item.flagNote || ''
      };
    });
    return initial;
  });

  const handleQtyChange = (itemId: string, qty: number, ordered: number, previouslyDelivered: number) => {
    const maxPossible = ordered - previouslyDelivered;
    const cleanQty = Math.max(0, Math.min(maxPossible, qty));
    const missing = maxPossible - cleanQty;

    setItemDeliveries(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        deliveredQty: cleanQty,
        // If there is missing quantity, automatically prompt flag
        isFlaggedMissing: missing > 0 ? true : prev[itemId]?.isFlaggedMissing || false
      }
    }));
  };

  const handleToggleFlag = (itemId: string) => {
    setItemDeliveries(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isFlaggedMissing: !prev[itemId]?.isFlaggedMissing
      }
    }));
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItemDeliveries(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        flagNote: note
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = order.items.map(item => {
      const state = itemDeliveries[item.id] || { deliveredQty: 0, isFlaggedMissing: false, flagNote: '' };
      return {
        itemId: item.id,
        deliveredQty: Number(state.deliveredQty) || 0,
        isFlaggedMissing: state.isFlaggedMissing,
        flagNote: state.flagNote
      };
    });

    checkAndReceiveDelivery(order.id, payload);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 text-slate-900 max-h-[88dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between shrink-0 bg-white">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" />
              <span>Wareneingangsprüfung (Lieferschein)</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              {order.orderNumber} - {order.baustelleName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {order.areaName ? `${order.areaName} • ` : ''}
              Datum: <strong>{order.orderDate || new Date(order.createdAt).toLocaleDateString('de-DE')}</strong>
            </p>
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

        {/* Info Banner */}
        <div className="mx-4 sm:mx-6 my-3 p-3 sm:p-3.5 bg-sky-50 border border-sky-200/80 rounded-2xl text-xs text-sky-900 shrink-0">
          <div className="font-bold flex items-center space-x-1.5 mb-1">
            <PackageCheck className="w-4 h-4 text-sky-600" />
            <span>Lieferschein-Abgleich:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Tragen Sie ein, wie viele Stück tatsächlich angekommen sind. Fehlende Positionen werden automatisch als Rückstand ("Gemerkter Merkzettel") registriert und der Baustellenbestand wird erhöht.
          </p>
        </div>

        {/* Items Table / Form */}
        <form id="delivery-check-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-4 overscroll-contain">
          <div className="space-y-3">
            {order.items.map(item => {
              const deliveryState = itemDeliveries[item.id] || { deliveredQty: 0, isFlaggedMissing: false, flagNote: '' };
              const previouslyDelivered = item.deliveredQty;
              const remainingToDeliver = item.orderedQty - previouslyDelivered;
              const newlyDelivered = deliveryState.deliveredQty;
              const missingNow = Math.max(0, remainingToDeliver - newlyDelivered);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    missingNow > 0
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">
                        Gesamt bestellt: <strong>{item.orderedQty} {item.unit}</strong>
                        {previouslyDelivered > 0 && ` (Bereits geliefert: ${previouslyDelivered} ${item.unit})`}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Jetzt geliefert:
                        </label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            max={remainingToDeliver}
                            value={deliveryState.deliveredQty}
                            onFocus={e => e.target.select()}
                            onChange={e => handleQtyChange(item.id, Number(e.target.value) || 0, item.orderedQty, previouslyDelivered)}
                            className="w-20 text-center py-1 px-2 bg-white border border-slate-300 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          />
                          <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* If missing items remain */}
                  {missingNow > 0 && (
                    <div className="pt-3 border-t border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-800 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            FEHLT NOCH: {missingNow} {item.unit}
                          </span>
                        </span>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deliveryState.isFlaggedMissing}
                            onChange={() => handleToggleFlag(item.id)}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                          />
                          <span className="text-xs font-bold text-amber-900">
                            📌 Als Rückstand merken
                          </span>
                        </label>
                      </div>

                      {deliveryState.isFlaggedMissing && (
                        <input
                          type="text"
                          value={deliveryState.flagNote}
                          onChange={e => handleNoteChange(item.id, e.target.value)}
                          placeholder="Grund / Nachlieferungstermin z. B. Kommt laut Fahrer nächsten Dienstag..."
                          className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </form>

        {/* Bottom Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0 bg-slate-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            form="delivery-check-form"
            className="px-4 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Wareneingang buchen</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
