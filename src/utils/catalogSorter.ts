import { CatalogItem, MaterialCategory } from '../types';

export const CATEGORY_ORDER: MaterialCategory[] = [
  'PE Rohre & Fittings',
  'PVC Rohre & Fittings',
  'Schellen',
  'Klappen',
  'Pumpen, Kompressor, WT, Messwasser',
  'Chlorgas & Chlorgasraum',
  'Einbauteile & Becken',
  'Abdichtung & Bauchemie',
  'Verzinkte Schrauben',
  'VA Schrauben',
  'PE Sonstiges',
  'PVC Sonstiges',
  'Sonstiges'
];

interface ItemKey {
  categoryRank: number;
  subTypeRank: number;
  baseType: string;
  da1: number;
  da2: number;
  metric: number;
  ozNumber: string;
}

const getCategoryRank = (category?: string): number => {
  if (!category) return 999;
  const idx = CATEGORY_ORDER.indexOf(category as MaterialCategory);
  return idx === -1 ? 900 : idx;
};

const getPeSubTypeRank = (name: string): number => {
  const n = name.toLowerCase();
  if (n.includes('druckrohr') || (n.includes('rohr') && !n.includes('schelle'))) return 10;
  if (n.includes('bogen 90°') || n.includes('winkel 90°')) return 20;
  if (n.includes('bogen 45°') || n.includes('winkel 45°')) return 30;
  if (n.includes('bogen') || n.includes('winkel')) return 35;
  if (n.includes('t-stück') || n.includes('t-stueck') || n.includes('t stück') || n.includes('t stueck')) return 40;
  if (n.includes('reduktion')) return 50;
  if (n.includes('vorschweißbund') || n.includes('vorschweissbund') || n.includes('bundbuchse')) return 60;
  if (n.includes('flansch') || n.includes('dichtung')) return 70;
  if (n.includes('elektroschweißmuffe') || n.includes('e-muffe') || n.includes('muffe')) return 80;
  if (n.includes('endkappe') || n.includes('kappe')) return 90;
  return 100;
};

const getPvcSubTypeRank = (name: string): number => {
  const n = name.toLowerCase();
  if (n.includes('druckrohr') || (n.includes('rohr') && !n.includes('schelle'))) return 10;
  if (n.includes('bogen 90°') || n.includes('winkel 90°')) return 20;
  if (n.includes('bogen 45°') || n.includes('winkel 45°')) return 30;
  if (n.includes('bogen') || n.includes('winkel')) return 35;
  if (n.includes('t-stück') || n.includes('t-stueck') || n.includes('t stück') || n.includes('t stueck')) return 40;
  if (n.includes('reduktion')) return 50;
  if (n.includes('bundbuchse') || n.includes('vorschweißbund') || n.includes('vorschweissbund')) return 60;
  if (n.includes('flansch') || n.includes('dichtung')) return 70;
  if (n.includes('muffe') && !n.includes('uks') && !n.includes('überschieb')) return 80;
  if (n.includes('uks') || n.includes('überschieb')) return 85;
  if (n.includes('schauglas') || n.includes('schaugläser')) return 90;
  if (n.includes('endkappe') || n.includes('kappe')) return 95;
  return 100;
};

export const getItemSortKey = (item: CatalogItem): ItemKey => {
  const name = item.name || '';
  const category = item.category || 'Sonstiges';
  const categoryRank = getCategoryRank(category);

  let subTypeRank = 100;
  if (category === 'PE Rohre & Fittings') {
    subTypeRank = getPeSubTypeRank(name);
  } else if (category === 'PVC Rohre & Fittings') {
    subTypeRank = getPvcSubTypeRank(name);
  }

  // Check for screws: "Schraubensatz verzinkt M16 x 50"
  let metric = 0;
  const screwMatch = name.match(/^((?:Schraubensatz|Schraube).*?\bM(\d+))\s*x\s*(\d+)/i);
  if (screwMatch) {
    return {
      categoryRank,
      subTypeRank: 10,
      baseType: screwMatch[1].trim(),
      metric: parseInt(screwMatch[2], 10) || 0,
      da1: parseInt(screwMatch[3], 10) || 0,
      da2: 0,
      ozNumber: item.articleNumber || ''
    };
  }

  let da1 = 0;
  let da2 = 0;

  // Extract DA dimensions (e.g. "DA 280 / 140", "DA 63/50", "DA 110", "DA 20")
  const daMatch = name.match(/DA\s*(\d+)(?:\s*[/x]\s*(\d+))?/i);
  if (daMatch) {
    da1 = parseInt(daMatch[1], 10);
    da2 = daMatch[2] ? parseInt(daMatch[2], 10) : 0;
  } else {
    // Check for DN (e.g. "DN 50", "DN 100 / 80")
    const dnMatch = name.match(/DN\s*(\d+)(?:\s*[/x]\s*(\d+))?/i);
    if (dnMatch) {
      da1 = parseInt(dnMatch[1], 10);
      da2 = dnMatch[2] ? parseInt(dnMatch[2], 10) : 0;
    } else {
      const numMatch = name.match(/\d+/);
      if (numMatch) {
        da1 = parseInt(numMatch[0], 10);
      }
    }
  }

  // Extract base product type
  let baseType = name;
  const cutIndex = name.search(/\s+(?:DN|DA)\s+\d+/i);
  if (cutIndex !== -1) {
    baseType = name.substring(0, cutIndex).trim();
  } else {
    baseType = name.replace(/\s*\d+.*$/, '').trim();
  }

  return {
    categoryRank,
    subTypeRank,
    baseType,
    da1,
    da2,
    metric,
    ozNumber: item.articleNumber || ''
  };
};

export const compareCatalogItems = (a: CatalogItem, b: CatalogItem): number => {
  // 1. If both are standard OZ items in the same category, OZ number is gold standard
  const isOzA = /^OZ\s+\d/i.test(a.articleNumber || '');
  const isOzB = /^OZ\s+\d/i.test(b.articleNumber || '');
  if (a.category === b.category && isOzA && isOzB) {
    return (a.articleNumber || '').localeCompare(b.articleNumber || '', 'de', { numeric: true });
  }

  const keyA = getItemSortKey(a);
  const keyB = getItemSortKey(b);

  // 1. Category Rank
  if (keyA.categoryRank !== keyB.categoryRank) {
    return keyA.categoryRank - keyB.categoryRank;
  }

  // 2. Sub-type rank within category (e.g. Rohre < Bögen < T-Stücke < Reduktionen < Flansche)
  if (keyA.subTypeRank !== keyB.subTypeRank) {
    return keyA.subTypeRank - keyB.subTypeRank;
  }

  // 3. For screws: Metric first (M12 < M16 < M20 < M24)
  if (keyA.metric !== keyB.metric) {
    return keyA.metric - keyB.metric;
  }

  // 4. Base type string (if sub-types are same rank)
  if (keyA.baseType !== keyB.baseType) {
    return keyA.baseType.localeCompare(keyB.baseType, 'de');
  }

  // 5. Main diameter / length (da1)
  if (keyA.da1 !== keyB.da1) {
    return keyA.da1 - keyB.da1;
  }

  // 6. Secondary diameter (da2, e.g. branch diameter in reduced tees)
  if (keyA.da2 !== keyB.da2) {
    return keyA.da2 - keyB.da2;
  }

  // 7. Fallback to name or article number
  return (a.articleNumber || a.name).localeCompare(b.articleNumber || b.name, 'de', { numeric: true });
};

export const sortCatalogItems = (items: CatalogItem[]): CatalogItem[] => {
  return [...items].sort(compareCatalogItems);
};
