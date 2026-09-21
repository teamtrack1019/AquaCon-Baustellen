import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Waves,
  AlertTriangle,
  ShoppingBag,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import { generateOrderPdf } from '../utils/pdfGenerator';
import { Logo } from './Logo';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenNewOrder: (prefill?: { baustelleId?: string; areaId?: string }) => void;
  onOpenNewBaustelle: () => void;
  setSelectedBaustelleId: (id: string | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onOpenNewOrder,
  onOpenNewBaustelle,
  setSelectedBaustelleId
}) => {
  const {
    role,
    lang,
    t,
    baustellen,
    orders,
    allShortages,
    flaggedBackorders
  } = useApp();

  const totalPools = baustellen.reduce((acc, b) => acc + b.areas.length, 0);
  const activeOrders = orders.filter(o => o.status === 'ordered' || o.status === 'partially_delivered');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Fast Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <Logo className="w-3.5 h-3.5" />
            <span>{role === 'worker' ? '👷 Mitarbeiter / Vor Ort' : '👔 Admin / Bauleiter'}</span>
            <span>•</span>
            <span>Live Baustellen-Cockpit</span>
          </div>

          <div className="flex items-center space-x-3 mb-2">
            <Logo className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 shadow-lg" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {role === 'worker'
                ? 'Baustellen-Materialerfassung & Bedarfsabgleich'
                : 'Zentrale Baustellen- & Materialführung'}
            </h1>
          </div>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Verwalten Sie Schwimmer-, Nichtschwimmer- und Planschbecken sowie Gebäude, behalten Sie Ist- und Sollmengen im Blick und steuern Sie Bestellungen und Teillieferungen lückenlos.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenNewOrder()}
              className="flex items-center space-x-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>{t.navNewOrder}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('baustellen');
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-750 text-white font-medium text-xs sm:text-sm rounded-xl border border-slate-700 transition-all"
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>{t.navBaustellen}</span>
            </button>

            {role === 'admin' && (
              <button
                onClick={onOpenNewBaustelle}
                className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-750 text-white font-medium text-xs sm:text-sm rounded-xl border border-slate-700 transition-all"
              >
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>{t.newBaustelle}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Baustellen */}
        <div
          onClick={() => setActiveTab('baustellen')}
          className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{baustellen.length}</div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Aktive Baustellen</div>
          <div className="text-[10px] sm:text-[11px] text-sky-600 font-medium mt-1.5 flex items-center space-x-1 truncate">
            <Waves className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{totalPools} Becken & Gebäude</span>
          </div>
        </div>

        {/* Shortages (Fehlmengen) */}
        <div
          onClick={() => {
            if (allShortages.length > 0 && allShortages[0]?.baustelleId) {
              setSelectedBaustelleId(allShortages[0].baustelleId);
            }
            setActiveTab('baustellen');
          }}
          className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${allShortages.length > 0 ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-600'} transition-colors`}>
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${allShortages.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {allShortages.length}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Offene Fehlmengen</div>
          <div className="text-[10px] sm:text-[11px] text-amber-600 font-medium mt-1.5 truncate">
            {allShortages.length > 0 ? 'Material fehlt vor Ort' : 'Alle Bestände gedeckt'}
          </div>
        </div>

        {/* Active Orders */}
        <div
          onClick={() => setActiveTab('orders')}
          className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{activeOrders.length}</div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Laufende Bestellungen</div>
          <div className="text-[10px] sm:text-[11px] text-blue-600 font-medium mt-1.5 truncate">
            {orders.length} Gesamtbestellungen
          </div>
        </div>

        {/* Flagged Backorders */}
        <div
          onClick={() => setActiveTab('backorders')}
          className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${flaggedBackorders.length > 0 ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white' : 'bg-slate-50 text-slate-600'} transition-colors`}>
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${flaggedBackorders.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {flaggedBackorders.length}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Gemerkte Rückstände</div>
          <div className="text-[10px] sm:text-[11px] text-rose-600 font-medium mt-1.5 truncate">
            {flaggedBackorders.length > 0 ? 'Nachlieferung offen' : 'Keine offenen Rückstände'}
          </div>
        </div>
      </div>

      {/* Main Grid: Shortages List & Active Baustellen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Shortages table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Aktuelle Material-Fehlmengen auf Baustellen</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Benötigte Mengen, die vor Ort noch nicht vorhanden sind
              </p>
            </div>
            {allShortages.length > 0 && (
              <button
                onClick={() => onOpenNewOrder()}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs rounded-lg border border-amber-200 transition-colors flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Bestellliste erstellen</span>
              </button>
            )}
          </div>

          {allShortages.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <div className="font-semibold text-slate-800">
                Hervorragend! Keine offenen Fehlmengen.
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Alle benötigten Materialien sind vor Ort ausreichend vorhanden.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-5">Baustelle & Becken</th>
                    <th className="p-3">{t.material}</th>
                    <th className="p-3 text-center">{t.requiredQty}</th>
                    <th className="p-3 text-center">{t.onSiteQty}</th>
                    <th className="p-3 text-center text-amber-600 font-bold">{t.shortageQty}</th>
                    <th className="p-3 text-right pr-5">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allShortages.slice(0, 7).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td
                        onClick={() => {
                          setSelectedBaustelleId(item.baustelleId);
                          setActiveTab('baustellen');
                        }}
                        className="p-3 pl-5 cursor-pointer group/item"
                        title={`${item.baustelleName} öffnen`}
                      >
                        <div className="font-semibold text-slate-900 group-hover/item:text-sky-600 transition-colors flex items-center space-x-1.5">
                          <span>{item.baustelleName}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 group-hover/item:translate-x-0.5 transition-transform" />
                        </div>
                        <div className="text-[11px] text-sky-600 flex items-center space-x-1">
                          <span>{item.areaName}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{item.material.name}</div>
                        <div className="text-[10px] text-slate-400">{item.material.category}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-medium">{item.material.requiredQty} {item.material.unit}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-slate-600 font-medium">{item.material.onSiteQty} {item.material.unit}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          {item.shortageQty} {item.material.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-5">
                        <button
                          onClick={() => {
                            onOpenNewOrder({
                              baustelleId: item.baustelleId,
                              areaId: item.areaId
                            });
                          }}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Bestellen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {allShortages.length > 7 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => setActiveTab('baustellen')}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center justify-center space-x-1 mx-auto"
              >
                <span>Alle {allShortages.length} Fehlmengen anzeigen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Baustellen Cards with Quick Pool Access */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>{t.baustellen}</span>
              </h3>
              <button
                onClick={() => setActiveTab('baustellen')}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
              >
                Alle anzeigen
              </button>
            </div>

            <div className="space-y-3">
              {baustellen.map(b => {
                const bShortages = allShortages.filter(s => s.baustelleId === b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBaustelleId(b.id);
                      setActiveTab('baustellen');
                    }}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-sky-700">
                        {b.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-200/80 text-slate-700 font-mono">
                        {b.projectNumber}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mb-2">{b.address}</div>

                    {/* Pools badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {b.areas.map(a => (
                        <span
                          key={a.id}
                          className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium"
                        >
                          {a.type === 'schwimmerbecken' ? '🏊' : a.type === 'nichtschwimmerbecken' ? '🏊‍♂️' : a.type === 'springerbecken' ? '🤿' : a.type === 'planschbecken' ? '👶' : a.type === 'haus' ? '🏠' : '⚙️'} {a.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500">{b.manager}</span>
                      {bShortages.length > 0 ? (
                        <span className="text-amber-600 font-bold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{bShortages.length} Fehlmengen</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Material OK</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick PDF / Print Tip */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sky-950">
            <div className="flex items-start space-x-3">
              <FileSpreadsheet className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-sky-900 mb-1">
                  PDF & WhatsApp Export
                </h4>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  Sie können jede Bedarfsliste und jeden Lieferschein direkt als druckfertiges PDF herunterladen oder per WhatsApp an Bauleiter & Mitarbeiter vor Ort senden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
