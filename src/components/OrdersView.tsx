import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  PlusCircle,
  Truck,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Trash2,
  PackageCheck,
  Building2,
  Layers,
  MessageSquare,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Order, OrderStatus, ItemDispoStatus } from '../types';
import { generateOrderPdf, shareOrderPdf } from '../utils/pdfGenerator';
import { DeliveryCheckModal } from './DeliveryCheckModal';

interface OrdersViewProps {
  onOpenNewOrder: (prefill?: { baustelleId?: string; areaId?: string }) => void;
}

const getNextMondayFormatted = (): string => {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilNextMonday = ((1 + 7 - day) % 7) || 7;
  d.setDate(d.getDate() + daysUntilNextMonday);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getImLagerAdminNote = (): string => {
  return `Admin bitte wenn Im Lager, Drücke bei Geliefert - ${getNextMondayFormatted()}`;
};

const getBestelltAdminNote = (): string => {
  return `Beim Lieferanten bestellt - Voraussichtliche Lieferung: ${getNextMondayFormatted()}`;
};

export const OrdersView: React.FC<OrdersViewProps> = ({ onOpenNewOrder }) => {
  const {
    role,
    t,
    orders,
    deleteOrder,
    updateItemDispoStatus,
    markEntireOrderDispo,
    confirmWorkerDelivery,
    baustellen,
    workers
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [baustelleFilter, setBaustelleFilter] = useState<string>('all');
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [selectedOrderForDeliveryCheck, setSelectedOrderForDeliveryCheck] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingNoteItemId, setEditingNoteItemId] = useState<{ orderId: string; itemId: string } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.baustelleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.createdByName && order.createdByName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.areaName && order.areaName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesBaustelle = baustelleFilter === 'all' || order.baustelleId === baustelleFilter;
    const matchesWorker = workerFilter === 'all' || (order.createdByName && order.createdByName.toLowerCase().includes(workerFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesBaustelle && matchesWorker;
  });

  const getItemStatusBadge = (status: ItemDispoStatus) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
            <span>📦 Im Lager vorhanden</span>
          </span>
        );
      case 'ordered':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
            <Clock className="w-3.5 h-3.5" />
            <span>🛒 Beim Lieferanten bestellt</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <span>🚚 Unterwegs zur Baustelle</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✅ Vor Ort eingetroffen</span>
          </span>
        );
      case 'missing_backorder':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>⚠️ Offener Rückstand</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>⏳ Wartet auf Admin</span>
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'in_progress':
      case 'ordered':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3.5 h-3.5" />
            <span>In Bearbeitung / Disponiert</span>
          </span>
        );
      case 'partially_delivered':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Teillieferung vor Ort</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Vollständig abgeschlossen</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Neu / Offen</span>
          </span>
        );
    }
  };

  const handleShareWhatsApp = async (order: Order) => {
    await shareOrderPdf(order);
  };

  const handleSaveAdminNote = (orderId: string, itemId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const targetItem = targetOrder?.items.find(i => i.id === itemId);
    if (targetItem) {
      updateItemDispoStatus(orderId, itemId, targetItem.status, adminNoteInput.trim());
    }
    setEditingNoteItemId(null);
    setAdminNoteInput('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">
            <span className={`w-2 h-2 rounded-full ${role === 'admin' ? 'bg-sky-500' : 'bg-amber-500'}`} />
            <span>{role === 'admin' ? 'Zentrale Verwaltung' : 'Mitarbeiter Bedarfs-Verfolgung'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-sky-600" />
            <span>{role === 'admin' ? 'Materialanforderungen' : 'Meine Anforderungen'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {role === 'admin'
              ? 'Prüfen Sie eingehende Anforderungen der Baustellen und markieren Sie jede Position mit einem Klick: [Im Lager vorhanden] oder [Beim Admin bestellt].'
              : 'Übersicht Ihrer angeforderten Materialien und der aktuelle Lieferstatus von der Zentrale.'}
          </p>
        </div>

        <button
          onClick={() => onOpenNewOrder()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{role === 'admin' ? 'Neue Bestellung erfassen' : 'Material anfordern'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Anforderungs-Nr, Baustelle, Artikel suchen..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Alle Status</option>
            <option value="pending">Neu / Offen</option>
            <option value="in_progress">In Bearbeitung (Disponiert)</option>
            <option value="delivered">Vollständig abgeschlossen</option>
          </select>

          {/* Baustelle Filter */}
          <select
            value={baustelleFilter}
            onChange={e => setBaustelleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Alle Baustellen</option>
            {baustellen.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Worker Filter */}
          <select
            value={workerFilter}
            onChange={e => setWorkerFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Alle Mitarbeiter</option>
            {workers.map(w => (
              <option key={w.id} value={w.name}>👷 {w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => {
          const isExpanded = expandedOrderId === order.id;
          const pendingCount = order.items.filter(i => i.status === 'pending').length;
          const inStockCount = order.items.filter(i => i.status === 'in_stock').length;
          const orderedCount = order.items.filter(i => i.status === 'ordered').length;
          const shippedCount = order.items.filter(i => i.status === 'shipped').length;
          const deliveredCount = order.items.filter(i => i.status === 'delivered').length;

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 to-white">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {order.orderNumber}
                    </span>
                    {getOrderStatusBadge(order.status)}

                    {/* Quick Counts Pills */}
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                      {inStockCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                          📦 {inStockCount} im Lager
                        </span>
                      )}
                      {orderedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                          🛒 {orderedCount} bestellt
                        </span>
                      )}
                      {shippedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                          🚚 {shippedCount} unterwegs
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          ⏳ {pendingCount} offen
                        </span>
                      )}
                      {deliveredCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ {deliveredCount} vor Ort
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>{order.baustelleName}</span>
                    {order.areaName && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
                        {order.areaName}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    <span>📅 Anforderung vom: <strong>{order.orderDate || new Date(order.createdAt).toLocaleDateString('de-DE')}</strong></span>
                    {order.createdByName && (
                      <span>👤 Gemeldet von: <strong>{order.createdByName}</strong></span>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Admin Bulk Actions */}
                  {role === 'admin' && (
                    order.items.every(i => i.status === 'delivered') ? (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Komplett vor Ort eingetroffen</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => markEntireOrderDispo(order.id, 'in_stock', getImLagerAdminNote())}
                          className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs transition-colors"
                          title="Alle Positionen als 'Im Lager' markieren"
                        >
                          Alle 📦 Lager
                        </button>
                        <button
                          onClick={() => markEntireOrderDispo(order.id, 'ordered', getBestelltAdminNote())}
                          className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs transition-colors"
                          title="Alle Positionen als 'Bestellt' markieren"
                        >
                          Alle 🛒 Bestellt
                        </button>
                        <button
                          onClick={() => markEntireOrderDispo(order.id, 'shipped', '🚚 Ausgeliefert / Unterwegs zur Baustelle')}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                          title="Alle Positionen als 'Geliefert / Unterwegs' markieren"
                        >
                          Alle 🚚 Geliefert
                        </button>
                      </div>
                    )
                  )}

                  {/* Wareneingang / Lieferschein Button ONLY for Worker */}
                  {role === 'worker' && (
                    <button
                      onClick={() => setSelectedOrderForDeliveryCheck(order)}
                      className="px-3.5 py-2 font-black rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse hover:animate-none ring-2 ring-emerald-400/40"
                      title="Lieferung prüfen, Stückzahlen abgleichen & eventuelle Fehlmengen erfassen"
                    >
                      <Truck className="w-4 h-4" />
                      <span>📦 Wareneingang prüfen (Lieferschein)</span>
                    </button>
                  )}

                  <button
                    onClick={() => generateOrderPdf(order)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1"
                    title={t.downloadPdf}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(order)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                    title="WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {role === 'admin' && (
                    <button
                      onClick={() => setOrderToDelete(order)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-colors border border-rose-200"
                      title="Anforderung löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table with Interactive Disposition */}
              <div className="border-t border-slate-100 p-4 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Angefordertes Material</th>
                        <th className="p-3 text-center">Menge</th>
                        <th className="p-3">Status der Lager</th>
                        <th className="p-3">Rückmeldung von Admin</th>
                        <th className="p-3 text-right pr-4">
                          {role === 'admin' ? 'Admin-Entscheidung' : 'Aktion'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {order.items.map(item => {
                        const isEditingThisNote = editingNoteItemId?.orderId === order.id && editingNoteItemId?.itemId === item.id;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 pl-4">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              {item.notes && (
                                <div className="text-[10px] text-slate-400 mt-0.5 italic">
                                  Bedarfs-Grund: {item.notes}
                                </div>
                              )}
                            </td>

                            <td className="p-3 text-center font-bold text-slate-900 whitespace-nowrap">
                              <span className="px-2 py-1 bg-slate-100 rounded-md font-mono text-xs">
                                {item.orderedQty} {item.unit}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="p-3">
                              {getItemStatusBadge(item.status)}
                            </td>

                            {/* Admin Note / Rückmeldung */}
                            <td className="p-3">
                              {isEditingThisNote ? (
                                <div className="flex items-center space-x-1.5">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={adminNoteInput}
                                    onChange={e => setAdminNoteInput(e.target.value)}
                                    placeholder="z. B. Kommt morgen früh mit Transporter..."
                                    className="px-2.5 py-1 bg-white border border-sky-400 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 w-64"
                                  />
                                  <button
                                    onClick={() => handleSaveAdminNote(order.id, item.id)}
                                    className="px-2 py-1 bg-sky-600 text-white rounded-lg text-[11px] font-bold"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => setEditingNoteItemId(null)}
                                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs ${item.adminNote ? 'font-semibold text-slate-800' : 'text-slate-400 italic'}`}>
                                    {item.adminNote || 'Keine Rückmeldung hinterlegt'}
                                  </span>
                                  {role === 'admin' && item.status !== 'delivered' && (
                                    <button
                                      onClick={() => {
                                        setEditingNoteItemId({ orderId: order.id, itemId: item.id });
                                        setAdminNoteInput(item.adminNote || '');
                                      }}
                                      className="text-[10px] text-sky-600 hover:text-sky-800 font-bold underline"
                                    >
                                      {item.adminNote ? 'Ändern' : '+ Info hinzufügen'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions based on Role */}
                            <td className="p-3 text-right pr-4 whitespace-nowrap">
                              {role === 'admin' ? (
                                item.status === 'delivered' ? (
                                  <div className="inline-flex items-center space-x-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Vor Ort eingetroffen ✓</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      onClick={() => updateItemDispoStatus(order.id, item.id, 'in_stock', getImLagerAdminNote())}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        item.status === 'in_stock'
                                          ? 'bg-teal-600 text-white shadow-xs'
                                          : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                                      }`}
                                      title="Im Lager vorhanden"
                                    >
                                      📦 Im Lager
                                    </button>

                                    <button
                                      onClick={() => updateItemDispoStatus(order.id, item.id, 'ordered', getBestelltAdminNote())}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        item.status === 'ordered'
                                          ? 'bg-sky-600 text-white shadow-xs'
                                          : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                                      }`}
                                      title="Beim Lieferanten bestellt"
                                    >
                                      🛒 Bestellen
                                    </button>

                                    <button
                                      onClick={() => updateItemDispoStatus(order.id, item.id, 'shipped', item.adminNote || '🚚 Unterwegs zur Baustelle')}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        item.status === 'shipped'
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      }`}
                                      title="Als Geliefert markieren (Unterwegs zur Baustelle)"
                                    >
                                      🚚 Geliefert
                                    </button>
                                  </div>
                                )
                              ) : (
                                /* Worker Action: Confirm Receipt / Check Delivery when arrived */
                                <div>
                                  {item.status !== 'delivered' ? (
                                    <button
                                      onClick={() => setSelectedOrderForDeliveryCheck(order)}
                                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 ml-auto active:scale-95"
                                      title="Lieferschein / Stückzahl prüfen und Wareneingang erfassen"
                                    >
                                      <Truck className="w-4 h-4" />
                                      <span>📦 Ware prüfen</span>
                                    </button>
                                  ) : (
                                    <span className="text-emerald-700 text-xs font-bold flex items-center justify-end space-x-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>✓ Erhalten & gebucht</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {order.notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200/60 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <strong>Hinweis des Mitarbeiters:</strong> {order.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700">
              Keine passenden Materialanforderungen gefunden
            </h3>
            <p className="text-xs text-slate-400">
              {role === 'admin'
                ? 'Sobald Mitarbeiter vor Ort Fehlmengen melden, erscheinen sie direkt hier in der Disposition.'
                : 'Sie haben derzeit keine offenen Anforderungen für diese Baustelle.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Anforderung löschen</h3>
                <p className="text-xs text-slate-500">{orderToDelete.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Möchten Sie die Materialanforderung <strong>"{orderToDelete.orderNumber}"</strong> für <strong>"{orderToDelete.baustelleName}"</strong> wirklich löschen?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Löschen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Check Modal */}
      {selectedOrderForDeliveryCheck && (
        <DeliveryCheckModal
          order={selectedOrderForDeliveryCheck}
          onClose={() => setSelectedOrderForDeliveryCheck(null)}
        />
      )}
    </div>
  );
};
