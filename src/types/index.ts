export type Role = 'worker' | 'admin';
export type Language = 'de' | 'tr';

export interface WorkerProfile {
  id: string;
  name: string;
  phone?: string;
  roleTitle?: string;
  color?: string;
}

export type MaterialCategory =
  | 'PE Rohre & Fittings'
  | 'PVC Rohre & Fittings'
  | 'Verzinkte Schrauben'
  | 'VA Schrauben'
  | 'Schellen'
  | 'PE Sonstiges'
  | 'PVC Sonstiges'
  | 'Klappen'
  | 'Chlorgas & Chlorgasraum'
  | 'Pumpen, Kompressor, WT, Messwasser'
  | 'Einbauteile & Becken'
  | 'Abdichtung & Bauchemie'
  | 'Sonstiges';

export type MaterialUnit = 'Stk.' | 'meter' | 'Palette';

export interface CatalogItem {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  articleNumber?: string;
  notes?: string;
}

export type AreaType =
  | 'schwimmerbecken'
  | 'nichtschwimmerbecken'
  | 'planschbecken'
  | 'haus'
  | 'technikraum'
  | 'aussenbereich'
  | 'custom';

export type MaterialStatus = 'ok' | 'shortage' | 'ordered' | 'delivered';

export interface AreaMaterial {
  id: string;
  catalogItemId?: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  requiredQty: number; // Soll-Menge / Benötigt
  onSiteQty: number;    // Ist-Menge / Vor Ort vorhanden
  orderedQty?: number;  // Bestellt
  notes?: string;
  lastUpdated?: string;
}

export interface Area {
  id: string;
  name: string;
  type: AreaType;
  customTypeName?: string;
  description?: string;
  materials: AreaMaterial[];
}

export type BaustelleStatus = 'planning' | 'active' | 'completed';

export interface Baustelle {
  id: string;
  name: string;
  projectNumber: string;
  address: string;
  client: string;
  manager: string;
  status: BaustelleStatus;
  startDate: string;
  targetDate: string;
  notes?: string;
  areas: Area[];
}

export type ItemDispoStatus = 
  | 'pending'           // Wartet auf Prüfung durch Admin
  | 'in_stock'          // Im Lager vorhanden (wird geliefert)
  | 'ordered'           // Beim Admin bestellt
  | 'shipped'           // Ausgeliefert / Unterwegs zur Baustelle (Admin hat geliefert geklickt)
  | 'delivered'         // Vor Ort eingetroffen (vom Mitarbeiter bestätigt)
  | 'partially_delivered'
  | 'missing_backorder';

export type OrderStatus = 'pending' | 'in_progress' | 'ordered' | 'partially_delivered' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  catalogItemId?: string;
  name: string;
  unit: MaterialUnit;
  category?: MaterialCategory;
  orderedQty: number;
  deliveredQty: number;
  flaggedMissingQty: number;
  isFlagged: boolean;
  flagNote?: string;
  adminNachgeliefert?: boolean; // Admin hat gemerkten Rückstand nachgeliefert
  status: ItemDispoStatus;
  adminNote?: string; // z. B. "Wird morgen mit Tour 1 geliefert"
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  baustelleId: string;
  baustelleName: string;
  areaId?: string;
  areaName?: string; // z. B. "Schwimmerbecken"
  createdAt: string;
  orderDate?: string; // Anforderungsdatum
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  supplier?: string;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  createdByRole: Role;
  createdByName?: string;
  hasMissingBackorder?: boolean;
}

export interface MaterialShortageItem {
  baustelleId: string;
  baustelleName: string;
  areaId: string;
  areaName: string;
  areaType: AreaType;
  material: AreaMaterial;
  shortageQty: number;
}

export interface AufmassItem {
  id: string;
  catalogItemId?: string;
  articleNumber?: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  // Stück quantity (for count items e.g. fittings, flanges, pumps, screws)
  quantity: number;
  // Pipe segments / dimensions list for meter items (e.g. [0.5, 1.0, 2.2, 1.8, 1.0])
  segments: number[];
  // Calculated total meters or total quantity
  total: number;
  notes?: string;
}

export interface AufmassSheet {
  id: string;
  baustelleId: string;
  baustelleName: string;
  areaId?: string;
  areaName?: string;
  title: string;
  date: string;
  inspectorName?: string;
  items: AufmassItem[];
  notes?: string;
  createdAt: string;
}
