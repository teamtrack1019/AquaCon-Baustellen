import { Baustelle } from '../types';

export const INITIAL_BAUSTELLEN: Baustelle[] = [
  {
    id: 'bau-freibad-nord',
    name: 'Freibad Nordpark Sanierung',
    projectNumber: 'AQ-2026-081',
    address: 'Am Sportpark 14, 80331 München',
    client: 'Stadtwerke München Bäderbetrieb',
    manager: 'Mehmet Yilmaz',
    status: 'active',
    startDate: '2026-08-01',
    targetDate: '2026-11-30',
    notes: 'Komplettsanierung aller 3 Becken und Neubau Technikgebäude.',
    areas: [
      {
        id: 'area-schwimmer-nord',
        name: 'Schwimmerbecken',
        type: 'schwimmerbecken',
        description: '50m x 21m Wettkampfbecken, 8 Bahnen',
        materials: [
          {
            id: 'mat-1',
            catalogItemId: 'cat-pe-b90-315',
            name: 'PE Bogen 90° DA 315',
            category: 'PE Rohre & Fittings',
            unit: 'Stk.',
            requiredQty: 6,
            onSiteQty: 2, // 4 fehlt -> Nachbestellt
            orderedQty: 4,
            notes: 'Hauptverrohrung Rücklauf'
          },
          {
            id: 'mat-2',
            catalogItemId: 'cat-pe-vb-140',
            name: 'PE Vorschweißbund DA 140',
            category: 'PE Rohre & Fittings',
            unit: 'Stk.',
            requiredQty: 10,
            onSiteQty: 5,
            orderedQty: 5,
            notes: 'Für Einlaufdüsen-Verteiler'
          },
          {
            id: 'mat-3',
            catalogItemId: 'cat-pe-b90-63',
            name: 'PE Bogen 90° DA 63',
            category: 'PE Rohre & Fittings',
            unit: 'Stk.',
            requiredQty: 24,
            onSiteQty: 24,
            notes: 'Ausreichend am Lager'
          },
          {
            id: 'mat-4',
            catalogItemId: 'cat-dichtschlaemme-2k',
            name: 'Dichtschlämme 2K hochflexibel (25kg Sack)',
            category: 'Abdichtung & Bauchemie',
            unit: 'Palette',
            requiredQty: 80,
            onSiteQty: 30,
            orderedQty: 50,
            notes: '1. Schicht fertig, 2. Schicht benötigt Material'
          },
          {
            id: 'mat-5',
            catalogItemId: 'cat-duese-v4a',
            name: 'Einlaufdüse V4A / Rotguss 2" AG kugelgelagert',
            category: 'Einbauteile & Becken',
            unit: 'Stk.',
            requiredQty: 16,
            onSiteQty: 16
          }
        ]
      },
      {
        id: 'area-nichtschwimmer-nord',
        name: 'Nichtschwimmerbecken',
        type: 'nichtschwimmerbecken',
        description: '25m x 12m Lehrschwimmbecken',
        materials: [
          {
            id: 'mat-6',
            catalogItemId: 'cat-pe-b90-63',
            name: 'PE Bogen 90° DA 63',
            category: 'PE Rohre & Fittings',
            unit: 'Stk.',
            requiredQty: 12,
            onSiteQty: 4,
            orderedQty: 8,
            notes: 'Dringend für Bodeneinströmung benötigt'
          },
          {
            id: 'mat-7',
            catalogItemId: 'cat-skimmer-v4a',
            name: 'Skimmer Breitmaul 500mm V4A Edelstahl',
            category: 'Einbauteile & Becken',
            unit: 'Stk.',
            requiredQty: 4,
            onSiteQty: 4
          },
          {
            id: 'mat-8',
            catalogItemId: 'cat-dichtband-120',
            name: 'Dichtband 120mm beidseitig vlieskaschiert (50m Rolle)',
            category: 'Abdichtung & Bauchemie',
            unit: 'meter',
            requiredQty: 150,
            onSiteQty: 50,
            orderedQty: 100
          }
        ]
      },
      {
        id: 'area-plansch-nord',
        name: 'Planschbecken / Kinderbereich',
        type: 'planschbecken',
        description: 'Wassertiefe 0 - 40cm mit Wasserigel & Rutsche',
        materials: [
          {
            id: 'mat-9',
            catalogItemId: 'cat-pe-b90-63',
            name: 'PE Bogen 90° DA 63',
            category: 'PE Rohre & Fittings',
            unit: 'Stk.',
            requiredQty: 8,
            onSiteQty: 8
          },
          {
            id: 'mat-10',
            catalogItemId: 'cat-dichtecke-innen',
            name: 'Dichtecke innen 90° vorkonfektioniert',
            category: 'Abdichtung & Bauchemie',
            unit: 'Stk.',
            requiredQty: 16,
            onSiteQty: 6,
            notes: '10 Stück fehlen noch'
          }
        ]
      },
      {
        id: 'area-haus-nord',
        name: 'Technikgebäude & Personalhaus',
        type: 'haus',
        description: 'Neubau Massivgebäude für Filtertechnik und Sanitär',
        materials: [
          {
            id: 'mat-11',
            catalogItemId: 'cat-dichtschlaemme-2k',
            name: 'Dichtschlämme 2K hochflexibel (25kg Sack)',
            category: 'Abdichtung & Bauchemie',
            unit: 'Palette',
            requiredQty: 45,
            onSiteQty: 45
          },
          {
            id: 'mat-12',
            catalogItemId: 'cat-bodenablauf-150',
            name: 'Bodenablauf V4A DN 150 Antiwirbeldeckel',
            category: 'Einbauteile & Becken',
            unit: 'Stk.',
            requiredQty: 3,
            onSiteQty: 2,
            orderedQty: 1,
            notes: '1 Stück im Lieferrückstand'
          }
        ]
      }
    ]
  },
  {
    id: 'bau-villa-starnberg',
    name: 'Privatvilla Starnberg Luxuspool',
    projectNumber: 'AQ-2026-094',
    address: 'Seeweg 12, 82319 Starnberg',
    client: 'Familie Dr. Weber',
    manager: 'Christian Bauer',
    status: 'active',
    startDate: '2026-09-01',
    targetDate: '2026-10-25',
    notes: 'Infinity-Pool mit Panorama-Überlaufrinne und Poolhaus.',
    areas: [
      {
        id: 'area-schwimmer-starnberg',
        name: 'Infinity-Schwimmbecken (12x5m)',
        type: 'schwimmerbecken',
        description: 'Überlaufbecken mit Granit-Rinne',
        materials: [
          {
            id: 'mat-13',
            catalogItemId: 'cat-pe-140-vorge',
            name: 'PE Vorschweißbund DA 140',
            category: 'PE Rohre & Fittings',
            unit: 'Stk.',
            requiredQty: 6,
            onSiteQty: 6
          },
          {
            id: 'mat-14',
            catalogItemId: 'cat-pe-b90-110',
            name: 'PE Bogen 90° DA 110',
            category: 'PE Rohre & Fittings',
            unit: 'Stk.',
            requiredQty: 34,
            onSiteQty: 0,
            orderedQty: 34,
            notes: 'Für Hauptverrohrung angefordert'
          },
          {
            id: 'mat-15',
            catalogItemId: 'cat-led-rgbw',
            name: 'Unterwasserscheinwerfer LED RGBW 12V V4A',
            category: 'Einbauteile & Becken',
            unit: 'Stk.',
            requiredQty: 4,
            onSiteQty: 4
          }
        ]
      },
      {
        id: 'area-poolhaus-starnberg',
        name: 'Poolhaus & Sauna-Pavillon',
        type: 'haus',
        description: 'Exklusives Poolhaus mit Dusche & Saunabereich',
        materials: [
          {
            id: 'mat-16',
            catalogItemId: 'cat-fliesenkleber-c2te',
            name: 'Fliesenkleber C2TE S1 hochverformbar (25kg Sack)',
            category: 'Abdichtung & Bauchemie',
            unit: 'Palette',
            requiredQty: 18,
            onSiteQty: 8,
            notes: '10 Säcke nachbestellen für Saunabereich'
          }
        ]
      }
    ]
  }
];
