import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BaustellenView } from './components/BaustellenView';
import { OrdersView } from './components/OrdersView';
import { BackordersView } from './components/BackordersView';
import { CatalogView } from './components/CatalogView';
import { AufmassView } from './components/AufmassView';
import { NewOrderModal } from './components/NewOrderModal';
import { NewBaustelleModal } from './components/NewBaustelleModal';

const AppContent: React.FC = () => {
  // Parse initial tab & baustelle from URL hash
  const parseHash = () => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return { tab: 'dashboard', bId: null };
    const [path, query] = hash.split('?');
    const params = new URLSearchParams(query || '');
    const validTabs = ['dashboard', 'baustellen', 'aufmass', 'orders', 'backorders', 'catalog'];
    const tab = validTabs.includes(path) ? path : 'dashboard';
    const bId = params.get('id') || null;
    return { tab, bId };
  };

  const initial = parseHash();
  const [activeTab, setActiveTabState] = useState(initial.tab);
  const [selectedBaustelleId, setSelectedBaustelleIdState] = useState<string | null>(initial.bId);

  // Modals
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [orderPrefill, setOrderPrefill] = useState<{ baustelleId?: string; areaId?: string } | undefined>(undefined);
  const [showNewBaustelleModal, setShowNewBaustelleModal] = useState(false);

  // Navigation helper that updates state & browser history
  const navigateTo = useCallback((tab: string, bId?: string | null) => {
    setActiveTabState(tab);
    if (bId !== undefined) {
      setSelectedBaustelleIdState(bId);
    }
    const currentBId = bId !== undefined ? bId : selectedBaustelleId;
    const newHash = currentBId && tab === 'baustellen' ? `#${tab}?id=${currentBId}` : `#${tab}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [selectedBaustelleId]);

  const setActiveTab = (tab: string) => {
    navigateTo(tab);
  };

  const setSelectedBaustelleId = (id: string | null) => {
    setSelectedBaustelleIdState(id);
    if (activeTab === 'baustellen') {
      const newHash = id ? `#baustellen?id=${id}` : '#baustellen';
      if (window.location.hash !== newHash) {
        window.location.hash = newHash;
      }
    }
  };

  // Listen to browser Back / Forward buttons & Mouse back buttons
  useEffect(() => {
    const handleHashChange = () => {
      const { tab, bId } = parseHash();
      setActiveTabState(tab);
      if (bId) {
        setSelectedBaustelleIdState(bId);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // If initial load has no hash, initialize it with #dashboard
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#dashboard');
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Handle ESC key to close global modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNewOrderModal(false);
        setShowNewBaustelleModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenNewOrder = (prefill?: { baustelleId?: string; areaId?: string }) => {
    setOrderPrefill(prefill);
    setShowNewOrderModal(true);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-900 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => handleOpenNewOrder()}
        onOpenNewBaustelle={() => setShowNewBaustelleModal(true)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-20 lg:pb-12 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onOpenNewOrder={handleOpenNewOrder}
            onOpenNewBaustelle={() => setShowNewBaustelleModal(true)}
            setSelectedBaustelleId={(id) => {
              setSelectedBaustelleId(id);
              navigateTo('baustellen', id);
            }}
          />
        )}

        {activeTab === 'baustellen' && (
          <BaustellenView
            selectedBaustelleId={selectedBaustelleId}
            setSelectedBaustelleId={setSelectedBaustelleId}
            onOpenNewOrder={handleOpenNewOrder}
            onOpenNewBaustelle={() => setShowNewBaustelleModal(true)}
          />
        )}

        {activeTab === 'aufmass' && (
          <AufmassView initialBaustelleId={selectedBaustelleId} />
        )}

        {activeTab === 'orders' && (
          <OrdersView onOpenNewOrder={handleOpenNewOrder} />
        )}

        {activeTab === 'backorders' && (
          <BackordersView />
        )}

        {activeTab === 'catalog' && (
          <CatalogView />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-40 px-1 py-1.5 flex items-center justify-around shadow-2xl safe-bottom-nav" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center p-1 rounded-lg text-[9px] font-semibold transition-colors ${
            activeTab === 'dashboard' ? 'text-sky-400' : 'text-slate-400'
          }`}
        >
          <span className="text-base mb-0.5">📊</span>
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('baustellen')}
          className={`flex flex-col items-center p-1 rounded-lg text-[9px] font-semibold transition-colors ${
            activeTab === 'baustellen' ? 'text-sky-400' : 'text-slate-400'
          }`}
        >
          <span className="text-base mb-0.5">🏊</span>
          <span>Baustelle</span>
        </button>

        <button
          onClick={() => handleOpenNewOrder()}
          className="flex flex-col items-center p-1.5 rounded-full bg-sky-500 text-slate-950 shadow-lg -mt-3 ring-4 ring-slate-950"
        >
          <span className="text-base leading-none font-bold">＋</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center p-1 rounded-lg text-[9px] font-semibold transition-colors ${
            activeTab === 'orders' ? 'text-sky-400' : 'text-slate-400'
          }`}
        >
          <span className="text-base mb-0.5">📦</span>
          <span>Bestellung</span>
        </button>

        <button
          onClick={() => setActiveTab('backorders')}
          className={`flex flex-col items-center p-1 rounded-lg text-[9px] font-semibold transition-colors relative ${
            activeTab === 'backorders' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <span className="text-base mb-0.5">⚠️</span>
          <span>Rückstand</span>
        </button>

        <button
          onClick={() => setActiveTab('aufmass')}
          className={`flex flex-col items-center p-1 rounded-lg text-[9px] font-semibold transition-colors ${
            activeTab === 'aufmass' ? 'text-teal-400' : 'text-slate-400'
          }`}
        >
          <span className="text-base mb-0.5">📐</span>
          <span>Aufmaß</span>
        </button>
      </nav>

      {/* Global Modals */}
      {showNewOrderModal && (
        <NewOrderModal
          prefill={orderPrefill}
          onClose={() => {
            setShowNewOrderModal(false);
            setOrderPrefill(undefined);
          }}
        />
      )}

      {showNewBaustelleModal && (
        <NewBaustelleModal
          onClose={() => setShowNewBaustelleModal(false)}
          onCreated={(newId) => {
            setSelectedBaustelleId(newId);
            navigateTo('baustellen', newId);
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
