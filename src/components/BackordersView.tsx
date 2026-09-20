import React from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  Building2,
  Waves,
  Truck,
  CheckCircle2,
  Share2,
  Clock,
  PackageCheck
} from 'lucide-react';

export const BackordersView: React.FC = () => {
  const { role, lang, t, flaggedBackorders, markBackorderNachgeliefert, workerConfirmBackorder } = useApp();

  const handleAdminNachliefern = (orderId: string, itemId: string, qty: number, name: string) => {
    if (window.confirm(`Wurden die restlichen ${qty} Stück von "${name}" versendet / nachgeliefert? Der Mitarbeiter vor Ort wird benachrichtigt.`)) {
      markBackorderNachgeliefert(orderId, itemId);
    }
  };

  const handleWorkerReceive = (orderId: string, itemId: string, qty: number, name: string) => {
    if (window.confirm(`Haben Sie die nachgelieferten ${qty} Stück von "${name}" erhalten und geprüft?`)) {
      workerConfirmBackorder(orderId, itemId);
    }
  };

  const handleShareSummary = () => {
    let text = `*AquaCon Offene Material-Rückstände*\nStand: ${new Date().toLocaleDateString('de-DE')}\n\n`;
    
    flaggedBackorders.forEach((b, idx) => {
      text += `${idx + 1}. *${b.item.name}* - *${b.item.flaggedMissingQty} ${b.item.unit} FEHLT*\n`;
      text += `   📍 Baustelle: ${b.order.baustelleName} (${b.order.areaName || 'Gesamt'})\n`;
      text += `   📦 Angeforderte Menge: ${b.item.orderedQty} (Bereits vor Ort: ${b.item.deliveredQty})\n`;
      if (b.item.flagNote) {
        text += `   💬 Notiz: ${b.item.flagNote}\n`;
      }
      text += `\n`;
    });

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Rückstands- & Nachlieferungs-Cockpit</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Offene Rückstände (Gemerkte Fehlmengen)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Materialien, die bestellt wurden, aber bei der Lieferschein-Prüfung gefehlt haben und nachgeliefert werden müssen.
          </p>
        </div>

        {flaggedBackorders.length > 0 && (
          <button
            onClick={handleShareSummary}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Rückstände per WhatsApp teilen</span>
          </button>
        )}
      </div>

      {/* Backorders Table / Cards */}
      {flaggedBackorders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            Keine offenen Lieferrückstände!
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Alle bisherigen Bestellungen wurden vollständig geliefert oder es wurden keine Artikel als Rückstand markiert.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flaggedBackorders.map(({ order, item }) => (
            <div
              key={`${order.id}-${item.id}`}
              className={`bg-white rounded-2xl border-2 p-5 shadow-sm space-y-3 flex flex-col justify-between transition-all ${
                item.adminNachgeliefert ? 'border-emerald-400 bg-emerald-50/20' : 'border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {order.orderNumber}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {item.name}
                    </h3>
                  </div>

                  {/* Badge: If admin has delivered the backorder, show green badge; else show red missing badge */}
                  {item.adminNachgeliefert ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1 animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Admin hat neu geliefert ({item.flaggedMissingQty} {item.unit})</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{item.flaggedMissingQty} {item.unit} FEHLT</span>
                    </span>
                  )}
                </div>

                {/* Location & Details */}
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>{order.baustelleName}</span>
                  </div>
                  {order.areaName && (
                    <div className="flex items-center space-x-1.5 text-sky-700 font-semibold">
                      <Waves className="w-3.5 h-3.5" />
                      <span>{order.areaName}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
                    <span>Angefordert: {item.orderedQty} {item.unit}</span>
                    <span className="text-emerald-700 font-semibold">Bisher vor Ort: {item.deliveredQty} {item.unit}</span>
                  </div>
                </div>

                {/* Note / Merkzettel */}
                {item.flagNote && (
                  <div className="mt-2 p-2.5 bg-amber-50 rounded-lg text-xs text-amber-900 border border-amber-200">
                    <strong>💬 Notiz / Merkzettel:</strong> {item.flagNote}
                  </div>
                )}
              </div>

              {/* Action Buttons based on Role */}
              <div className="pt-2 flex justify-end">
                {role === 'admin' ? (
                  !item.adminNachgeliefert ? (
                    <button
                      onClick={() => handleAdminNachliefern(order.id, item.id, item.flaggedMissingQty, item.name)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5 active:scale-95"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Jetzt nachgeliefert (Aufbuchen)</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Wartet auf Mitarbeiter-Bestätigung</span>
                    </div>
                  )
                ) : (
                  /* Worker Side */
                  item.adminNachgeliefert ? (
                    <button
                      onClick={() => handleWorkerReceive(order.id, item.id, item.flaggedMissingQty, item.name)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-1.5 active:scale-95 animate-pulse"
                      title="Wareneingang der Nachlieferung bestätigen und in Ist-Bestand aufbuchen"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Nachlieferung erhalten & aufbuchen</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic flex items-center space-x-1 py-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>In Bearbeitung bei Zentrale / Lieferant...</span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
