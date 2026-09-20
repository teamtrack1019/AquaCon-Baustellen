import { Order } from '../types';

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-2026-001',
    orderNumber: 'ANF-2026-081-01',
    baustelleId: 'bau-freibad-nord',
    baustelleName: 'Freibad Nordpark Sanierung',
    areaId: 'area-schwimmer-nord',
    areaName: 'Schwimmerbecken',
    createdAt: '2026-09-15T09:30:00Z',
    orderDate: '2026-09-15',
    status: 'in_progress',
    createdByRole: 'worker',
    createdByName: 'Ahmet (Baustelle Vor Ort)',
    notes: 'Dringende Großrohr-Anforderung für Hauptverteiler',
    hasMissingBackorder: false,
    items: [
      {
        id: 'oi-1',
        catalogItemId: 'cat-pe-b90-315',
        name: 'PE Bogen 90° DA 315',
        unit: 'Stk.',
        category: 'PE Rohre & Fittings',
        orderedQty: 6,
        deliveredQty: 0,
        flaggedMissingQty: 6,
        isFlagged: false,
        status: 'in_stock',
        adminNote: '📦 Im Lager vorhanden – geht mit dem heutigen Transporter raus!'
      },
      {
        id: 'oi-2',
        catalogItemId: 'cat-pe-vb-140',
        name: 'PE Vorschweißbund DA 140',
        unit: 'Stk.',
        category: 'PE Rohre & Fittings',
        orderedQty: 5,
        deliveredQty: 5,
        flaggedMissingQty: 0,
        isFlagged: false,
        status: 'delivered',
        adminNote: '✅ Bereits auf Baustelle übergeben'
      }
    ]
  },
  {
    id: 'ord-2026-002',
    orderNumber: 'ANF-2026-081-02',
    baustelleId: 'bau-freibad-nord',
    baustelleName: 'Freibad Nordpark Sanierung',
    areaId: 'area-nichtschwimmer-nord',
    areaName: 'Nichtschwimmerbecken',
    createdAt: '2026-09-16T14:15:00Z',
    orderDate: '2026-09-16',
    status: 'in_progress',
    createdByRole: 'worker',
    createdByName: 'Murat (Baustelle Vor Ort)',
    notes: 'Verrohrung Bodendüsen',
    hasMissingBackorder: false,
    items: [
      {
        id: 'oi-3',
        catalogItemId: 'cat-pe-b90-63',
        name: 'PE Bogen 90° DA 63',
        unit: 'Stk.',
        category: 'PE Rohre & Fittings',
        orderedQty: 8,
        deliveredQty: 0,
        flaggedMissingQty: 8,
        isFlagged: false,
        status: 'ordered',
        adminNote: '🛒 Beim Admin bestellt – Lieferung zur Baustelle in Vorbereitung'
      }
    ]
  },
  {
    id: 'ord-2026-003',
    orderNumber: 'ANF-2026-094-01',
    baustelleId: 'bau-villa-starnberg',
    baustelleName: 'Privatvilla Starnberg Luxuspool',
    areaId: 'area-schwimmer-starnberg',
    areaName: 'Infinity-Schwimmbecken (12x5m)',
    createdAt: '2026-09-18T10:00:00Z',
    orderDate: '2026-09-18',
    status: 'pending',
    createdByRole: 'worker',
    createdByName: 'Alex (Baustelle Vor Ort)',
    notes: 'Bögen für Rücklaufleitung',
    hasMissingBackorder: false,
    items: [
      {
        id: 'oi-4',
        catalogItemId: 'cat-pe-b90-110',
        name: 'PE Bogen 90° DA 110',
        unit: 'Stk.',
        category: 'PE Rohre & Fittings',
        orderedQty: 10,
        deliveredQty: 0,
        flaggedMissingQty: 10,
        isFlagged: false,
        status: 'pending',
        adminNote: ''
      }
    ]
  }
];
