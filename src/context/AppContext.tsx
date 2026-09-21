import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Role,
  Language,
  WorkerProfile,
  Baustelle,
  Area,
  AreaMaterial,
  CatalogItem,
  Order,
  OrderItem,
  MaterialShortageItem,
  AreaType,
  MaterialCategory,
  MaterialUnit,
  ItemDispoStatus,
  OrderStatus,
  AufmassSheet,
  AufmassItem
} from '../types';
import { INITIAL_CATALOG } from '../data/initialCatalog';
import { INITIAL_BAUSTELLEN } from '../data/initialBaustellen';
import { INITIAL_ORDERS } from '../data/initialOrders';
import { INITIAL_WORKERS } from '../data/initialWorkers';
import { translations } from '../i18n/translations';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['de'];

  // Workers / Mitarbeiter
  workers: WorkerProfile[];
  activeWorkerId: string;
  setActiveWorkerId: (id: string) => void;
  activeWorker: WorkerProfile | undefined;
  addWorker: (worker: { name: string; phone?: string; roleTitle?: string; color?: string }) => string;
  updateWorker: (id: string, updates: Partial<WorkerProfile>) => void;
  deleteWorker: (id: string) => void;

  // Baustellen
  baustellen: Baustelle[];
  addBaustelle: (baustelle: Omit<Baustelle, 'id' | 'areas'> & { areas?: Area[] }) => string;
  updateBaustelle: (id: string, updates: Partial<Baustelle>) => void;
  deleteBaustelle: (id: string) => void;

  // Areas (Becken, Häuser etc.)
  addArea: (baustelleId: string, area: { name: string; type: AreaType; customTypeName?: string; description?: string }) => string;
  updateArea: (baustelleId: string, areaId: string, updates: Partial<Area>) => void;
  deleteArea: (baustelleId: string, areaId: string) => void;

  // Materials on Site
  addMaterialToArea: (baustelleId: string, areaId: string, material: {
    catalogItemId?: string;
    name: string;
    category: MaterialCategory;
    unit: MaterialUnit;
    requiredQty: number;
    onSiteQty: number;
    notes?: string;
  }) => void;
  updateAreaMaterial: (baustelleId: string, areaId: string, materialId: string, updates: Partial<AreaMaterial>) => void;
  deleteAreaMaterial: (baustelleId: string, areaId: string, materialId: string) => void;

  // Catalog A-Z
  catalog: CatalogItem[];
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => string;
  updateCatalogItem: (id: string, updates: Partial<CatalogItem>) => void;
  deleteCatalogItem: (id: string) => void;

  // Orders & Deliveries & Disposition
  orders: Order[];
  createOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => string;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  updateItemDispoStatus: (orderId: string, itemId: string, status: ItemDispoStatus, adminNote?: string) => void;
  markEntireOrderDispo: (orderId: string, status: ItemDispoStatus, adminNote?: string) => void;
  confirmWorkerDelivery: (orderId: string, itemId: string) => void;
  createMaterialRequestFromArea: (baustelleId: string, areaId: string, note?: string) => string | null;
  
  // Delivery check with "Merken" for missing items
  checkAndReceiveDelivery: (orderId: string, receivedItems: { itemId: string; deliveredQty: number; isFlaggedMissing: boolean; flagNote?: string }[]) => void;
  markBackorderNachgeliefert: (orderId: string, itemId: string) => void;
  workerConfirmBackorder: (orderId: string, itemId: string) => void;

  // Aufmass
  aufmassSheets: AufmassSheet[];
  saveAufmassSheet: (sheet: Omit<AufmassSheet, 'id' | 'createdAt'> & { id?: string }) => string;
  deleteAufmassSheet: (id: string) => void;
  
  // Computed helpers
  allShortages: MaterialShortageItem[];
  flaggedBackorders: { order: Order; item: OrderItem }[];
  
  // Admin Security / PIN
  adminPin: string;
  updateAdminPin: (newPin: string) => void;
  verifyAdminPin: (inputPin: string) => boolean;

  // Reset / Export / Import
  resetToSampleData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ROLE: 'aquacon_role_v1',
  LANG: 'aquacon_lang_v1',
  WORKERS: 'aquacon_workers_v1',
  ACTIVE_WORKER_ID: 'aquacon_active_worker_id_v1',
  ADMIN_PIN: 'aquacon_admin_pin_v1',
  BAUSTELLEN: 'aquacon_baustellen_v5',
  CATALOG: 'aquacon_catalog_v9',
  ORDERS: 'aquacon_orders_v8',
  AUFMASS: 'aquacon_aufmass_v1'
};

export const isSameMaterial = (
  m: { name: string; catalogItemId?: string },
  item: { name: string; catalogItemId?: string }
): boolean => {
  if (m.catalogItemId && item.catalogItemId && m.catalogItemId === item.catalogItemId) {
    return true;
  }
  const clean = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[(),/°"-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const c1 = clean(m.name);
  const c2 = clean(item.name);
  if (c1 === c2) return true;

  // Token comparison (order independent)
  const t1 = c1.split(' ').filter(Boolean).sort().join(' ');
  const t2 = c2.split(' ').filter(Boolean).sort().join(' ');
  if (t1 === t2) return true;

  const words1 = new Set(c1.split(' ').filter(Boolean));
  const words2 = new Set(c2.split(' ').filter(Boolean));
  const intersection = [...words1].filter(w => words2.has(w));
  if (intersection.length >= 2 && (intersection.length === words1.size || intersection.length === words2.size)) {
    return true;
  }

  return false;
};

const sanitizeUnit = (u: any): MaterialUnit => {
  if (u === 'meter' || u === 'lfm' || u === 'm' || u === 'm²') return 'meter';
  if (u === 'Palette' || u === 'pal' || u === 'Sack' || u === 'Karton') return 'Palette';
  return 'Stk.';
};

const sanitizeCategory = (c: any): MaterialCategory => {
  if (c === 'PE Rohre & Fittings') return 'PE Rohre & Fittings';
  if (c === 'PVC Rohre & Fittings') return 'PVC Rohre & Fittings';
  if (c === 'Verzinkte Schrauben' || c === 'Verzink Schrauben' || c === 'Verzinkt') return 'Verzinkte Schrauben';
  if (c === 'VA Schrauben' || c === 'VA' || c === 'Edelstahl') return 'VA Schrauben';
  if (c === 'Schellen' || c === 'Rohrschellen' || c === 'Befestigung') return 'Schellen';
  if (c === 'PE Sonstiges') return 'PE Sonstiges';
  if (c === 'PVC Sonstiges') return 'PVC Sonstiges';
  if (c === 'Klappen' || c === 'Klappe' || c === 'Absperrklappen') return 'Klappen';
  if (c === 'Chlorgas & Chlorgasraum' || c === 'Chlorgas' || c === 'Chlorgasraum') return 'Chlorgas & Chlorgasraum';
  if (c === 'Pumpen, Kompressor, WT, Messwasser' || c === 'Pumpen' || c === 'Kompressor' || c === 'Messwasser') return 'Pumpen, Kompressor, WT, Messwasser';
  if (c === 'Einbauteile & Becken') return 'Einbauteile & Becken';
  if (c === 'Abdichtung & Bauchemie') return 'Abdichtung & Bauchemie';
  return 'Sonstiges';
};

const mergeWithInitialCatalog = (items: CatalogItem[]): CatalogItem[] => {
  const initialMap = new Map(INITIAL_CATALOG.map(i => [i.id, i]));
  const existingIds = new Set<string>();

  const cleanedExisting = items
    .filter(item => !item.id.startsWith('cat-pe-b45-') && !(/^PE Bogen 45°/i.test(item.name)))
    // Purge deprecated default items from 'Einbauteile & Becken' (e.g. skimmer, old duese, bodenablauf, etc.)
    .filter(item => {
      if (item.category === 'Einbauteile & Becken' && (item.id.startsWith('cat-skimmer-') || item.id.startsWith('cat-duese-') || item.id.startsWith('cat-bodenablauf-') || item.id.startsWith('cat-led-') || item.id.startsWith('cat-anschlussdose'))) {
        return false;
      }
      return true;
    })
    .map(item => {
    existingIds.add(item.id);
    const initial = initialMap.get(item.id);
    if (initial) {
      return {
        ...item,
        name: initial.name,
        articleNumber: initial.articleNumber,
        category: sanitizeCategory(item.category || initial.category),
        unit: sanitizeUnit(item.unit || initial.unit)
      };
    }
    return {
      ...item,
      name: item.name.replace(/\bPP-Stahl\b/gi, '').replace(/\s+/g, ' ').trim(),
      category: sanitizeCategory(item.category),
      unit: sanitizeUnit(item.unit)
    };
  });

  const missingInitialItems = INITIAL_CATALOG.filter(i => !existingIds.has(i.id));
  return [...cleanedExisting, ...missingInitialItems];
};

const sanitizeAreaName = (name: string): string => {
  if (!name) return name;
  return name.replace(/\s*\(50m\)/gi, '').trim();
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ROLE) as Role) || 'worker';
  });

  const [lang, setLangState] = useState<Language>('de');

  const [workers, setWorkers] = useState<WorkerProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WORKERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved workers', e);
      }
    }
    return INITIAL_WORKERS;
  });

  const [activeWorkerId, setActiveWorkerIdState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKER_ID);
    return saved || 'worker-hakan';
  });

  const setActiveWorkerId = (id: string) => {
    setActiveWorkerIdState(id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKER_ID, id);
  };

  const activeWorker = useMemo(() => {
    return workers.find(w => w.id === activeWorkerId) || workers[0];
  }, [workers, activeWorkerId]);

  const [adminPin, setAdminPinState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '0000';
  });

  const updateAdminPin = (newPin: string) => {
    const trimmed = newPin.trim();
    if (!trimmed) return;
    setAdminPinState(trimmed);
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, trimmed);
  };

  const verifyAdminPin = (inputPin: string): boolean => {
    return inputPin.trim() === adminPin;
  };

  const [baustellen, setBaustellen] = useState<Baustelle[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BAUSTELLEN) || localStorage.getItem('aquacon_baustellen_v2') || localStorage.getItem('aquacon_baustellen_v1');
    if (saved) {
      try {
        const parsed: Baustelle[] = JSON.parse(saved);
        return parsed.map(b => ({
          ...b,
          areas: b.areas.map(a => ({
            ...a,
            name: sanitizeAreaName(a.name),
            materials: a.materials.map(m => ({
              ...m,
              name: m.name.replace(/\bPP-Stahl\b/gi, '').replace(/\s+/g, ' ').trim(),
              category: sanitizeCategory(m.category),
              unit: sanitizeUnit(m.unit)
            }))
          }))
        }));
      } catch (e) {
        console.error('Failed to parse saved baustellen', e);
      }
    }
    return INITIAL_BAUSTELLEN;
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATALOG) || localStorage.getItem('aquacon_catalog_v5') || localStorage.getItem('aquacon_catalog_v4') || localStorage.getItem('aquacon_catalog_v3') || localStorage.getItem('aquacon_catalog_v2') || localStorage.getItem('aquacon_catalog_v1');
    if (saved) {
      try {
        const parsed: CatalogItem[] = JSON.parse(saved);
        return mergeWithInitialCatalog(parsed);
      } catch (e) {
        console.error('Failed to parse saved catalog', e);
      }
    }
    return INITIAL_CATALOG;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS) || localStorage.getItem('aquacon_orders_v2') || localStorage.getItem('aquacon_orders_v1');
    if (saved) {
      try {
        const parsed: Order[] = JSON.parse(saved);
        return parsed.map(o => ({
          ...o,
          areaName: o.areaName ? sanitizeAreaName(o.areaName) : o.areaName,
          items: o.items.map(i => ({
            ...i,
            name: i.name ? i.name.replace(/\bPP-Stahl\b/gi, '').replace(/\s+/g, ' ').trim() : i.name,
            category: i.category ? sanitizeCategory(i.category) : undefined,
            unit: sanitizeUnit(i.unit)
          }))
        }));
      } catch (e) {
        console.error('Failed to parse saved orders', e);
      }
    }
    return INITIAL_ORDERS;
  });

  const [aufmassSheets, setAufmassSheets] = useState<AufmassSheet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUFMASS);
    if (saved) {
      try {
        const parsed: AufmassSheet[] = JSON.parse(saved);
        return parsed.map(sheet => ({
          ...sheet,
          items: sheet.items.map(item => ({
            ...item,
            notes: item.notes && /^Passend zu /i.test(item.notes) ? undefined : item.notes
          }))
        }));
      } catch (e) {
        console.error('Failed to parse saved aufmass', e);
      }
    }
    return [];
  });

  const lastSyncTimestampRef = React.useRef<number>(0);
  const isSyncingFromServerRef = React.useRef<boolean>(false);

  // Initial load from server database
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          if (data && !data.empty && data.baustellen && data.orders) {
            isSyncingFromServerRef.current = true;
            if (data.updatedAt) lastSyncTimestampRef.current = data.updatedAt;
            const cleanedBaustellen = (data.baustellen as Baustelle[]).map(b => ({
              ...b,
              areas: b.areas.map(a => ({
                ...a,
                name: sanitizeAreaName(a.name)
              }))
            }));
            const cleanedOrders = (data.orders as Order[]).map(o => ({
              ...o,
              areaName: o.areaName ? sanitizeAreaName(o.areaName) : o.areaName
            }));
            const cleanedAufmass = ((data.aufmassSheets || []) as AufmassSheet[]).map(sheet => ({
              ...sheet,
              items: sheet.items.map(item => ({
                ...item,
                notes: item.notes && /^Passend zu /i.test(item.notes) ? undefined : item.notes
              }))
            }));
            setBaustellen(cleanedBaustellen);
            if (data.catalog) setCatalog(mergeWithInitialCatalog(data.catalog));
            setOrders(cleanedOrders);
            setAufmassSheets(cleanedAufmass);
            if (data.workers && Array.isArray(data.workers) && data.workers.length > 0) {
              setWorkers(data.workers);
            }
            setTimeout(() => {
              isSyncingFromServerRef.current = false;
            }, 300);
          } else {
            // Push initial data to server
            await fetch('/api/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ baustellen, catalog, orders, aufmassSheets, workers })
            });
          }
        }
      } catch (e) {
        console.warn('Backend sync not reachable, using localStorage fallback', e);
      }
    };

    fetchServerData();
  }, []);

  // Sync with localStorage and Server
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BAUSTELLEN, JSON.stringify(baustellen));
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    localStorage.setItem(STORAGE_KEYS.AUFMASS, JSON.stringify(aufmassSheets));

    if (isSyncingFromServerRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baustellen, catalog, orders, aufmassSheets, workers })
        });
        if (res.ok) {
          const result = await res.json();
          if (result.updatedAt) {
            lastSyncTimestampRef.current = result.updatedAt;
          }
        }
      } catch (e) {
        // silent fallback
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [baustellen, catalog, orders, aufmassSheets, workers]);

  // Periodic polling for multi-device & multi-tab live real-time sync
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          if (data && !data.empty && data.updatedAt && data.updatedAt > lastSyncTimestampRef.current) {
            isSyncingFromServerRef.current = true;
            lastSyncTimestampRef.current = data.updatedAt;
            if (data.baustellen) setBaustellen(data.baustellen);
            if (data.catalog) setCatalog(mergeWithInitialCatalog(data.catalog));
            if (data.orders) setOrders(data.orders);
            if (data.aufmassSheets) setAufmassSheets(data.aufmassSheets);
            if (data.workers && Array.isArray(data.workers) && data.workers.length > 0) {
              setWorkers(data.workers);
            }
            setTimeout(() => {
              isSyncingFromServerRef.current = false;
            }, 300);
          }
        }
      } catch (e) {
        // silent
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const setRole = (newRole: Role) => setRoleState(newRole);
  const setLang = (newLang: Language) => setLangState(newLang);

  const t = translations[lang] || translations.de;

  // Worker Actions
  const addWorker = (workerData: { name: string; phone?: string; roleTitle?: string; color?: string }) => {
    const id = `worker-${Date.now()}`;
    const newWorker: WorkerProfile = {
      id,
      name: workerData.name.trim(),
      phone: workerData.phone?.trim() || undefined,
      roleTitle: workerData.roleTitle?.trim() || 'Monteur',
      color: workerData.color || 'sky'
    };
    setWorkers(prev => [...prev, newWorker]);
    return id;
  };

  const updateWorker = (id: string, updates: Partial<WorkerProfile>) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWorker = (id: string) => {
    setWorkers(prev => {
      const remaining = prev.filter(w => w.id !== id);
      if (activeWorkerId === id && remaining.length > 0) {
        setActiveWorkerId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Baustellen Actions
  const addBaustelle = (data: Omit<Baustelle, 'id' | 'areas'> & { areas?: Area[] }) => {
    const newId = `bau-${Date.now()}`;
    const newBaustelle: Baustelle = {
      ...data,
      id: newId,
      areas: data.areas || []
    };
    setBaustellen(prev => [newBaustelle, ...prev]);
    return newId;
  };

  const updateBaustelle = (id: string, updates: Partial<Baustelle>) => {
    setBaustellen(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBaustelle = (id: string) => {
    setBaustellen(prev => prev.filter(b => b.id !== id));
  };

  // Areas Actions
  const addArea = (baustelleId: string, areaData: { name: string; type: AreaType; customTypeName?: string; description?: string }) => {
    const areaId = `area-${Date.now()}`;
    const newArea: Area = {
      ...areaData,
      id: areaId,
      materials: []
    };
    setBaustellen(prev => prev.map(b => {
      if (b.id === baustelleId) {
        return {
          ...b,
          areas: [...b.areas, newArea]
        };
      }
      return b;
    }));
    return areaId;
  };

  const updateArea = (baustelleId: string, areaId: string, updates: Partial<Area>) => {
    setBaustellen(prev => prev.map(b => {
      if (b.id === baustelleId) {
        return {
          ...b,
          areas: b.areas.map(a => a.id === areaId ? { ...a, ...updates } : a)
        };
      }
      return b;
    }));
  };

  const deleteArea = (baustelleId: string, areaId: string) => {
    setBaustellen(prev => prev.map(b => {
      if (b.id === baustelleId) {
        return {
          ...b,
          areas: b.areas.filter(a => a.id !== areaId)
        };
      }
      return b;
    }));
  };

  // Material Actions
  const addMaterialToArea = (
    baustelleId: string,
    areaId: string,
    matData: {
      catalogItemId?: string;
      name: string;
      category: MaterialCategory;
      unit: MaterialUnit;
      requiredQty: number;
      onSiteQty: number;
      notes?: string;
    }
  ) => {
    setBaustellen(prev => prev.map(b => {
      if (b.id === baustelleId) {
        return {
          ...b,
          areas: b.areas.map(a => {
            if (a.id === areaId) {
              const existingIdx = a.materials.findIndex(m => {
                if (matData.catalogItemId && m.catalogItemId && m.catalogItemId === matData.catalogItemId) {
                  return true;
                }
                return m.name.trim().toLowerCase() === matData.name.trim().toLowerCase() && m.unit === matData.unit;
              });

              if (existingIdx >= 0) {
                const updatedMaterials = [...a.materials];
                const existing = updatedMaterials[existingIdx];
                updatedMaterials[existingIdx] = {
                  ...existing,
                  requiredQty: (existing.requiredQty || 0) + (matData.requiredQty || 0),
                  onSiteQty: (existing.onSiteQty || 0) + (matData.onSiteQty || 0),
                  notes: matData.notes
                    ? (existing.notes && !existing.notes.includes(matData.notes)
                        ? `${existing.notes} | ${matData.notes}`
                        : existing.notes || matData.notes)
                    : existing.notes,
                  lastUpdated: new Date().toISOString().split('T')[0]
                };
                return {
                  ...a,
                  materials: updatedMaterials
                };
              }

              const newMat: AreaMaterial = {
                ...matData,
                id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                lastUpdated: new Date().toISOString().split('T')[0]
              };
              return {
                ...a,
                materials: [...a.materials, newMat]
              };
            }
            return a;
          })
        };
      }
      return b;
    }));
  };

  const updateAreaMaterial = (baustelleId: string, areaId: string, materialId: string, updates: Partial<AreaMaterial>) => {
    setBaustellen(prev => prev.map(b => {
      if (b.id === baustelleId) {
        return {
          ...b,
          areas: b.areas.map(a => {
            if (a.id === areaId) {
              return {
                ...a,
                materials: a.materials.map(m => m.id === materialId ? { ...m, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : m)
              };
            }
            return a;
          })
        };
      }
      return b;
    }));
  };

  const deleteAreaMaterial = (baustelleId: string, areaId: string, materialId: string) => {
    setBaustellen(prev => prev.map(b => {
      if (b.id === baustelleId) {
        return {
          ...b,
          areas: b.areas.map(a => {
            if (a.id === areaId) {
              return {
                ...a,
                materials: a.materials.filter(m => m.id !== materialId)
              };
            }
            return a;
          })
        };
      }
      return b;
    }));
  };

  // Catalog Actions
  const addCatalogItem = (itemData: Omit<CatalogItem, 'id'>) => {
    const newId = `cat-${Date.now()}`;
    const newItem: CatalogItem = {
      ...itemData,
      id: newId
    };
    setCatalog(prev => [newItem, ...prev]);
    return newId;
  };

  const updateCatalogItem = (id: string, updates: Partial<CatalogItem>) => {
    setCatalog(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCatalogItem = (id: string) => {
    setCatalog(prev => prev.filter(c => c.id !== id));
  };

  // Orders Actions
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    const year = new Date().getFullYear();
    const count = orders.length + 1;
    const orderNumber = `BEST-${year}-${String(count).padStart(3, '0')}`;
    const newId = `ord-${Date.now()}`;

    const newOrder: Order = {
      ...orderData,
      id: newId,
      orderNumber,
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update orderedQty in Baustelle Area materials
    if (newOrder.baustelleId && newOrder.areaId) {
      setBaustellen(prev => prev.map(b => {
        if (b.id === newOrder.baustelleId) {
          return {
            ...b,
            areas: b.areas.map(a => {
              if (a.id === newOrder.areaId) {
                return {
                  ...a,
                  materials: a.materials.map(m => {
                    const orderItem = newOrder.items.find(oi => isSameMaterial(m, oi));
                    if (orderItem) {
                      return {
                        ...m,
                        orderedQty: (m.orderedQty || 0) + orderItem.orderedQty
                      };
                    }
                    return m;
                  })
                };
              }
              return a;
            })
          };
        }
        return b;
      }));
    }

    return newId;
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  // Admin Disposition: Set status of an individual item
  const updateItemDispoStatus = (orderId: string, itemId: string, newStatus: ItemDispoStatus, adminNote?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const updatedItems = order.items.map(item => {
        if (item.id !== itemId) return item;
        const willBeDelivered = newStatus === 'delivered';
        const deliveredQty = willBeDelivered ? item.orderedQty : (newStatus === 'pending' || newStatus === 'in_stock' || newStatus === 'ordered' || newStatus === 'shipped' ? 0 : item.deliveredQty);

        // If newly delivered, add to onSiteQty in baustelle and decrease orderedQty
        if (willBeDelivered && order.baustelleId) {
          const qtyToAdd = item.orderedQty;
          setBaustellen(bPrev => bPrev.map(b => {
            if (b.id === order.baustelleId) {
              return {
                ...b,
                areas: b.areas.map(a => {
                  if (!order.areaId || a.id === order.areaId) {
                    return {
                      ...a,
                      materials: a.materials.map(m => {
                        if (isSameMaterial(m, item)) {
                          const newOnSite = (m.onSiteQty || 0) + qtyToAdd;
                          return {
                            ...m,
                            onSiteQty: newOnSite,
                            requiredQty: 0,
                            orderedQty: 0
                          };
                        }
                        return m;
                      })
                    };
                  }
                  return a;
                })
              };
            }
            return b;
          }));
        }

        return {
          ...item,
          status: newStatus,
          deliveredQty: deliveredQty,
          adminNote: adminNote !== undefined ? adminNote : item.adminNote
        };
      });

      const allDelivered = updatedItems.every(i => i.status === 'delivered');
      const anyInStockOrOrdered = updatedItems.some(i => i.status === 'in_stock' || i.status === 'ordered' || i.status === 'shipped');
      let orderStatus: OrderStatus = 'pending';
      if (allDelivered) orderStatus = 'delivered';
      else if (anyInStockOrOrdered) orderStatus = 'in_progress';

      return {
        ...order,
        items: updatedItems,
        status: orderStatus
      };
    }));
  };

  // Bulk disposition for all items in an order (skips already delivered items)
  const markEntireOrderDispo = (orderId: string, status: ItemDispoStatus, adminNote?: string) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;
    target.items.forEach(item => {
      if (item.status !== 'delivered') {
        updateItemDispoStatus(orderId, item.id, status, adminNote);
      }
    });
  };

  // Worker confirms arrival on site
  const confirmWorkerDelivery = (orderId: string, itemId: string) => {
    const who = activeWorker ? activeWorker.name : 'Mitarbeiter';
    updateItemDispoStatus(orderId, itemId, 'delivered', `✅ Empfang vor Ort von ${who} bestätigt`);
  };

  // Worker creates one-click request for all shortages of a pool/area
  const createMaterialRequestFromArea = (baustelleId: string, areaId: string, note?: string): string | null => {
    const targetB = baustellen.find(b => b.id === baustelleId);
    if (!targetB) return null;
    const targetA = targetB.areas.find(a => a.id === areaId);
    if (!targetA) return null;

    const shortages = targetA.materials.filter(m => m.requiredQty > m.onSiteQty);
    if (shortages.length === 0) return null;

    const orderItems: OrderItem[] = shortages.map((m, idx) => ({
      id: `oi-${Date.now()}-${idx}`,
      catalogItemId: m.catalogItemId,
      name: m.name,
      unit: m.unit,
      category: m.category,
      orderedQty: m.requiredQty - m.onSiteQty,
      deliveredQty: 0,
      flaggedMissingQty: m.requiredQty - m.onSiteQty,
      isFlagged: false,
      status: 'pending',
      adminNote: '',
      notes: m.notes
    }));

    const workerLabel = activeWorker ? `${activeWorker.name} (Vor Ort)` : 'Mitarbeiter vor Ort';

    const newId = createOrder({
      baustelleId,
      baustelleName: targetB.name,
      areaId,
      areaName: targetA.name,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      items: orderItems,
      notes: note || `Bedarfsanforderung für ${targetA.name}`,
      createdByRole: role,
      createdByName: role === 'worker' ? workerLabel : 'Bauleitung'
    });

    return newId;
  };

  // Delivery check with "Merken" for missing items
  const checkAndReceiveDelivery = (
    orderId: string,
    receivedItems: { itemId: string; deliveredQty: number; isFlaggedMissing: boolean; flagNote?: string }[]
  ) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    let hasAnyUndelivered = false;
    let hasAnyFlagged = false;
    let allDeliveredFull = true;

    const updatedItems = targetOrder.items.map(item => {
      const rec = receivedItems.find(r => r.itemId === item.id);
      if (rec) {
        const deliveredTotal = Math.min(item.orderedQty, item.deliveredQty + rec.deliveredQty);
        const missingQty = Math.max(0, item.orderedQty - deliveredTotal);
        const isFlagged = missingQty > 0 ? (rec.isFlaggedMissing || item.isFlagged) : false;

        if (missingQty > 0) {
          hasAnyUndelivered = true;
          allDeliveredFull = false;
        }
        if (isFlagged) {
          hasAnyFlagged = true;
        }

        let itemStatus: OrderItem['status'] = 'pending';
        if (deliveredTotal >= item.orderedQty) {
          itemStatus = 'delivered';
        } else if (deliveredTotal > 0 && isFlagged) {
          itemStatus = 'missing_backorder';
        } else if (deliveredTotal > 0) {
          itemStatus = 'partially_delivered';
        } else if (isFlagged) {
          itemStatus = 'missing_backorder';
        }

        // Apply incoming goods to Baustelle material on-site stock (Ist-Menge)
        if (rec.deliveredQty > 0 && targetOrder.baustelleId) {
          setBaustellen(prev => prev.map(b => {
            if (b.id === targetOrder.baustelleId) {
              return {
                ...b,
                areas: b.areas.map(a => {
                  if (!targetOrder.areaId || a.id === targetOrder.areaId) {
                    return {
                      ...a,
                      materials: a.materials.map(m => {
                        if (isSameMaterial(m, item)) {
                          return {
                            ...m,
                            onSiteQty: m.onSiteQty + rec.deliveredQty,
                            orderedQty: Math.max(0, (m.orderedQty || 0) - rec.deliveredQty)
                          };
                        }
                        return m;
                      })
                    };
                  }
                  return a;
                })
              };
            }
            return b;
          }));
        }

        return {
          ...item,
          deliveredQty: deliveredTotal,
          flaggedMissingQty: missingQty,
          isFlagged,
          flagNote: rec.flagNote || item.flagNote,
          status: itemStatus
        };
      }
      return item;
    });

    let overallStatus: Order['status'] = 'ordered';
    if (allDeliveredFull) {
      overallStatus = 'delivered';
    } else if (hasAnyUndelivered) {
      overallStatus = 'partially_delivered';
    }

    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      items: updatedItems,
      status: overallStatus,
      actualDeliveryDate: new Date().toISOString().split('T')[0],
      hasMissingBackorder: hasAnyFlagged
    } : o));
  };

  // Admin marks backorder as "Nachgeliefert"
  const markBackorderNachgeliefert = (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        items: order.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            adminNachgeliefert: true
          };
        })
      };
    }));
  };

  // Worker confirms arrival of the nachgelieferte items (or Admin resolves completely)
  const workerConfirmBackorder = (orderId: string, itemId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const targetItem = targetOrder?.items.find(i => i.id === itemId);
    if (!targetOrder || !targetItem) return;

    const remainingQty = targetItem.flaggedMissingQty;
    checkAndReceiveDelivery(orderId, [
      {
        itemId,
        deliveredQty: remainingQty,
        isFlaggedMissing: false,
        flagNote: 'Vollständig nachgeliefert'
      }
    ]);
  };

  // Aufmass Actions
  const saveAufmassSheet = (sheetData: Omit<AufmassSheet, 'id' | 'createdAt'> & { id?: string }): string => {
    const id = sheetData.id || `aufmass-${Date.now()}`;
    const newSheet: AufmassSheet = {
      ...sheetData,
      id,
      createdAt: sheetData.id 
        ? (aufmassSheets.find(s => s.id === sheetData.id)?.createdAt || new Date().toISOString())
        : new Date().toISOString()
    };

    setAufmassSheets(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newSheet;
        return updated;
      }
      return [newSheet, ...prev];
    });

    return id;
  };

  const deleteAufmassSheet = (id: string) => {
    setAufmassSheets(prev => prev.filter(s => s.id !== id));
  };

  // Computed Shortages (Eksik Malzemeler)
  const allShortages = useMemo(() => {
    const list: MaterialShortageItem[] = [];
    baustellen.forEach(b => {
      b.areas.forEach(a => {
        a.materials.forEach(m => {
          const shortage = m.requiredQty - m.onSiteQty;
          if (shortage > 0) {
            list.push({
              baustelleId: b.id,
              baustelleName: b.name,
              areaId: a.id,
              areaName: a.name,
              areaType: a.type,
              material: m,
              shortageQty: shortage
            });
          }
        });
      });
    });
    return list;
  }, [baustellen]);

  // Computed Flagged Backorders (Gemerkte Rückstände / Eksik Kalanlar)
  const flaggedBackorders = useMemo(() => {
    const list: { order: Order; item: OrderItem }[] = [];
    orders.forEach(o => {
      o.items.forEach(item => {
        if (item.isFlagged && item.flaggedMissingQty > 0) {
          list.push({ order: o, item });
        }
      });
    });
    return list;
  }, [orders]);

  const resetToSampleData = () => {
    setBaustellen(INITIAL_BAUSTELLEN);
    setCatalog(INITIAL_CATALOG);
    setOrders(INITIAL_ORDERS);
    setAufmassSheets([]);
    setWorkers(INITIAL_WORKERS);
    localStorage.removeItem(STORAGE_KEYS.BAUSTELLEN);
    localStorage.removeItem(STORAGE_KEYS.CATALOG);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.AUFMASS);
    localStorage.removeItem(STORAGE_KEYS.WORKERS);
  };

  const exportDataJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      baustellen,
      catalog,
      orders,
      aufmassSheets,
      workers
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.baustellen && Array.isArray(data.baustellen)) {
        setBaustellen(data.baustellen);
      }
      if (data.catalog && Array.isArray(data.catalog)) {
        setCatalog(mergeWithInitialCatalog(data.catalog));
      }
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
      if (data.aufmassSheets && Array.isArray(data.aufmassSheets)) {
        setAufmassSheets(data.aufmassSheets);
      }
      if (data.workers && Array.isArray(data.workers)) {
        setWorkers(data.workers);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        lang,
        setLang,
        t,
        workers,
        activeWorkerId,
        setActiveWorkerId,
        activeWorker,
        addWorker,
        updateWorker,
        deleteWorker,
        baustellen,
        addBaustelle,
        updateBaustelle,
        deleteBaustelle,
        addArea,
        updateArea,
        deleteArea,
        addMaterialToArea,
        updateAreaMaterial,
        deleteAreaMaterial,
        catalog,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        orders,
        createOrder,
        updateOrder,
        deleteOrder,
        updateItemDispoStatus,
        markEntireOrderDispo,
        confirmWorkerDelivery,
        createMaterialRequestFromArea,
        checkAndReceiveDelivery,
        markBackorderNachgeliefert,
        workerConfirmBackorder,
        aufmassSheets,
        saveAufmassSheet,
        deleteAufmassSheet,
        allShortages,
        flaggedBackorders,
        adminPin,
        updateAdminPin,
        verifyAdminPin,
        resetToSampleData,
        exportDataJSON,
        importDataJSON
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
