import { CatalogItem, MaterialCategory, MaterialUnit } from '../types';

export interface MatchingFlangeResult {
  isVorschweissbundOrBundbuchse: boolean;
  matchingFlange: {
    catalogItemId?: string;
    name: string;
    category: MaterialCategory;
    unit: MaterialUnit;
    articleNumber?: string;
  } | null;
}

/**
 * Checks if a material is a PE Vorschweißbund or PVC Bundbuchse,
 * and finds the matching Losflansch in the catalog.
 */
export const findMatchingFlange = (
  materialName: string,
  category: MaterialCategory,
  catalog: CatalogItem[]
): MatchingFlangeResult => {
  if (!materialName) {
    return { isVorschweissbundOrBundbuchse: false, matchingFlange: null };
  }

  const isVb = /vorschwei[ßs]bund/i.test(materialName);
  const isBb = /bundbuchse/i.test(materialName);

  if (!isVb && !isBb) {
    return { isVorschweissbundOrBundbuchse: false, matchingFlange: null };
  }

  // Determine if it's PVC or PE
  const isPvc = /pvc/i.test(materialName) || category === 'PVC Rohre & Fittings' || category === 'PVC Sonstiges';

  // Extract DA dimension (e.g. DA 140, DA140, d140, 140)
  let da: string | null = null;
  const matchDa = materialName.match(/DA\s*(\d+)/i) || materialName.match(/(?:d|DN)\s*(\d+)/i);
  if (matchDa && matchDa[1]) {
    da = matchDa[1];
  } else {
    // Fallback search for any 2-3 digit number
    const matchNum = materialName.match(/\b(\d{2,3})\b/);
    if (matchNum && matchNum[1]) {
      da = matchNum[1];
    }
  }

  if (!da) {
    return { isVorschweissbundOrBundbuchse: true, matchingFlange: null };
  }

  // Look for matching Losflansch in catalog
  if (isPvc) {
    // 1. Direct ID match for PVC
    const directMatch = catalog.find(c => c.id === `cat-pvc-fl-${da}`);
    if (directMatch) {
      return {
        isVorschweissbundOrBundbuchse: true,
        matchingFlange: {
          catalogItemId: directMatch.id,
          name: directMatch.name,
          category: directMatch.category,
          unit: directMatch.unit,
          articleNumber: directMatch.articleNumber
        }
      };
    }

    // 2. Name search for PVC
    const nameMatch = catalog.find(
      c =>
        c.category === 'PVC Rohre & Fittings' &&
        /losflansch/i.test(c.name) &&
        (c.name.includes(`DA ${da}`) || c.name.includes(`DA${da}`) || c.name.includes(` ${da} `) || c.name.endsWith(` ${da}`))
    );
    if (nameMatch) {
      return {
        isVorschweissbundOrBundbuchse: true,
        matchingFlange: {
          catalogItemId: nameMatch.id,
          name: nameMatch.name,
          category: nameMatch.category,
          unit: nameMatch.unit,
          articleNumber: nameMatch.articleNumber
        }
      };
    }

    // Fallback generated PVC Losflansch
    return {
      isVorschweissbundOrBundbuchse: true,
      matchingFlange: {
        name: `PVC Losflansch DA ${da}`,
        category: 'PVC Rohre & Fittings',
        unit: 'Stk.'
      }
    };
  } else {
    // PE Losflansch
    // 1. Direct ID match for PE
    const directMatch = catalog.find(c => c.id === `cat-fl-pp-${da}`);
    if (directMatch) {
      return {
        isVorschweissbundOrBundbuchse: true,
        matchingFlange: {
          catalogItemId: directMatch.id,
          name: directMatch.name,
          category: directMatch.category,
          unit: directMatch.unit,
          articleNumber: directMatch.articleNumber
        }
      };
    }

    // 2. Name search for PE Losflansch
    const nameMatch = catalog.find(
      c =>
        c.category === 'PE Rohre & Fittings' &&
        /losflansch/i.test(c.name) &&
        (c.name.includes(`DA ${da}`) || c.name.includes(`DA${da}`) || c.name.includes(` ${da} `) || c.name.endsWith(` ${da}`))
    );
    if (nameMatch) {
      return {
        isVorschweissbundOrBundbuchse: true,
        matchingFlange: {
          catalogItemId: nameMatch.id,
          name: nameMatch.name,
          category: nameMatch.category,
          unit: nameMatch.unit,
          articleNumber: nameMatch.articleNumber
        }
      };
    }

    // Fallback generated PE Losflansch
    return {
      isVorschweissbundOrBundbuchse: true,
      matchingFlange: {
        name: `Losflansch DA ${da}`,
        category: 'PE Rohre & Fittings',
        unit: 'Stk.'
      }
    };
  }
};

export interface MatchingScrewResult {
  countPerFlange: number;
  metric: string;
  length: number;
  recommendedNameVz: string;
  recommendedNameVa: string;
  matchingCatalogItemVz?: CatalogItem;
  matchingCatalogItemVa?: CatalogItem;
}

export const getMatchingScrewsForFlange = (
  materialName: string,
  catalog: CatalogItem[]
): MatchingScrewResult | null => {
  if (!materialName) return null;

  const isFlangeLike = /(?:vorschwei[ßs]bund|bundbuchse|losflansch|flansch|klappe)/i.test(materialName);
  if (!isFlangeLike) return null;

  let da = 0;
  const matchDa = materialName.match(/DA\s*(\d+)/i) || materialName.match(/(?:d|DN)\s*(\d+)/i);
  if (matchDa && matchDa[1]) {
    da = parseInt(matchDa[1], 10);
  } else {
    const matchNum = materialName.match(/\b(\d{2,3})\b/);
    if (matchNum && matchNum[1]) {
      da = parseInt(matchNum[1], 10);
    }
  }

  if (!da || da < 20) return null;

  let count = 4;
  let metric = 'M16';
  let len = 70;

  if (da <= 32) { count = 4; metric = 'M12'; len = 60; }
  else if (da <= 40) { count = 4; metric = 'M16'; len = 60; }
  else if (da <= 50) { count = 4; metric = 'M16'; len = 65; }
  else if (da <= 63) { count = 4; metric = 'M16'; len = 70; }
  else if (da <= 75) { count = 4; metric = 'M16'; len = 75; }
  else if (da <= 125) { count = 8; metric = 'M16'; len = 80; }
  else if (da <= 140) { count = 8; metric = 'M16'; len = 85; }
  else if (da <= 180) { count = 8; metric = 'M20'; len = 90; }
  else if (da <= 225) { count = 8; metric = 'M20'; len = 100; }
  else if (da <= 280) { count = 12; metric = 'M20'; len = 110; }
  else if (da <= 315) { count = 12; metric = 'M20'; len = 120; }
  else if (da <= 355) { count = 16; metric = 'M20'; len = 130; }
  else { count = 16; metric = 'M24'; len = 140; }

  const nameVz = `Schraubensatz verzinkt ${metric} x ${len}`;
  const nameVa = `Schraubensatz VA ${metric} x ${len}`;

  const itemVz = catalog.find(c => c.name.toLowerCase() === nameVz.toLowerCase() || c.id === `cat-schr-vz-${metric.toLowerCase()}-${len}`);
  const itemVa = catalog.find(c => c.name.toLowerCase() === nameVa.toLowerCase() || c.id === `cat-schr-va-${metric.toLowerCase()}-${len}`);

  return {
    countPerFlange: count,
    metric,
    length: len,
    recommendedNameVz: nameVz,
    recommendedNameVa: nameVa,
    matchingCatalogItemVz: itemVz,
    matchingCatalogItemVa: itemVa
  };
};

export interface ParsedScrew {
  isScrew: boolean;
  materialType: 'vz' | 'va';
  metric: 'M12' | 'M16' | 'M20' | 'M24';
  length: number;
}

export const SCREW_LENGTHS_MAP: Record<string, number[]> = {
  M12: [40, 50, 60, 70, 80, 90, 100, 110, 120],
  M16: [40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200],
  M20: [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200, 220, 240],
  M24: [80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200, 220, 240, 260]
};

export const parseScrewInfo = (name: string): ParsedScrew => {
  const isScrew = /(?:schraubensatz|schraube)/i.test(name);
  if (!isScrew) {
    return { isScrew: false, materialType: 'vz', metric: 'M16', length: 80 };
  }

  const isVa = /\bva\b|\bedelstahl\b|\ba4\b/i.test(name);
  let metric: 'M12' | 'M16' | 'M20' | 'M24' = 'M16';
  const matchM = name.match(/\bM(12|16|20|24)\b/i);
  if (matchM && matchM[1]) {
    metric = `M${matchM[1]}` as any;
  }

  let length = 80;
  const matchLen = name.match(/x\s*(\d{2,3})\b/i) || name.match(/\b(\d{2,3})\s*mm\b/i);
  if (matchLen && matchLen[1]) {
    length = parseInt(matchLen[1], 10);
  }

  return {
    isScrew: true,
    materialType: isVa ? 'va' : 'vz',
    metric,
    length
  };
};

export const buildScrewName = (
  materialType: 'vz' | 'va',
  metric: 'M12' | 'M16' | 'M20' | 'M24',
  length: number
): { name: string; category: MaterialCategory } => {
  const name = materialType === 'va'
    ? `Schraubensatz VA ${metric} x ${length}`
    : `Schraubensatz verzinkt ${metric} x ${length}`;
  const category: MaterialCategory = materialType === 'va' ? 'VA Schrauben' : 'Verzinkte Schrauben';
  return { name, category };
};

