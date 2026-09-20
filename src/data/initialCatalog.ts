import { CatalogItem } from '../types';

// Standard dimension steps for PE pool piping & civil engineering
const PE_SIZES = [50, 63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450];

// Flange DN mappings for each DA dimension
const FLANGE_DN_MAP: Record<number, number> = {
  15: 10,
  20: 15,
  25: 20,
  32: 25,
  40: 32,
  50: 40,
  63: 50,
  75: 65,
  90: 80,
  110: 100,
  125: 100,
  140: 125,
  160: 150,
  180: 150,
  200: 200,
  225: 200,
  250: 250,
  280: 250,
  315: 300,
  355: 350,
  400: 400,
  450: 500
};

// Standard Reducer combinations (Large / Small)
const REDUCER_COMBOS: [number, number][] = [
  // DA 63
  [63, 50],
  // DA 75
  [75, 50], [75, 63],
  // DA 90
  [90, 50], [90, 63], [90, 75],
  // DA 110
  [110, 50], [110, 63], [110, 75], [110, 90],
  // DA 125
  [125, 63], [125, 75], [125, 90], [125, 110],
  // DA 140
  [140, 75], [140, 90], [140, 110], [140, 125],
  // DA 160
  [160, 90], [160, 110], [160, 125], [160, 140],
  // DA 180
  [180, 110], [180, 125], [180, 140], [180, 160],
  // DA 200
  [200, 125], [200, 140], [200, 160], [200, 180],
  // DA 225
  [225, 140], [225, 160], [225, 180], [225, 200],
  // DA 250
  [250, 160], [250, 180], [250, 200], [250, 225],
  // DA 280
  [280, 180], [280, 200], [280, 225], [280, 250],
  // DA 315
  [315, 200], [315, 225], [315, 250], [315, 280],
  // DA 355
  [355, 225], [355, 250], [355, 280], [355, 315],
  // DA 400
  [400, 250], [400, 280], [400, 315], [400, 355],
  // DA 450
  [450, 280], [450, 315], [450, 355], [450, 400]
];

// Reduced Tee combinations (Main DA / Branch DA)
const REDUCED_TEE_COMBOS: [number, number][] = [
  [63, 50],
  [75, 50], [75, 63],
  [90, 63], [90, 75],
  [110, 63], [110, 75], [110, 90],
  [125, 90], [125, 110],
  [140, 90], [140, 110],
  [160, 90], [160, 110], [160, 125],
  [180, 110], [180, 160],
  [200, 110], [200, 160],
  [225, 110], [225, 160],
  [250, 110], [250, 160],
  [280, 160], [280, 225],
  [315, 160], [315, 225],
  [355, 225], [355, 280],
  [400, 250], [400, 315],
  [450, 280], [450, 315]
];

const pad3 = (num: number): string => num.toString().padStart(3, '0');

const generatePeCatalog = (): CatalogItem[] => {
  const items: CatalogItem[] = [];

  // 1. PE Druckrohre (DA 50 - 450) -> OZ 01.04.01.xxx
  PE_SIZES.forEach((da, idx) => {
    items.push({
      id: `cat-pe-rohr-${da}`,
      name: `PE Druckrohr DA ${da}`,
      category: 'PE Rohre & Fittings',
      unit: 'meter',
      articleNumber: `OZ 01.04.01.${pad3(idx + 1)}`,
      notes: `5m / 6m Stange (Ø ${da}mm)`
    });
  });

  // 2. PE Bogen 90° (DA 50 - 450) -> OZ 01.04.02.xxx
  PE_SIZES.forEach((da, idx) => {
    items.push({
      id: `cat-pe-b90-${da}`,
      name: `PE Bogen 90° DA ${da}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.02.${pad3(idx + 1)}`,
      notes: `Formteil für Spiegelschweißung / E-Muffe`
    });
  });

  // 3. PE T-Stücke egal (DA 50 - 450) & reduziert -> OZ 01.04.03.xxx
  PE_SIZES.forEach((da, idx) => {
    items.push({
      id: `cat-pe-t-egal-${da}`,
      name: `PE T-Stück egal DA ${da}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.03.${pad3(idx + 1)}`,
      notes: `Abgang gleicher Durchmesser (DA ${da} x ${da})`
    });
  });

  REDUCED_TEE_COMBOS.forEach(([mainDa, branchDa], idx) => {
    items.push({
      id: `cat-pe-t-red-${mainDa}-${branchDa}`,
      name: `PE T-Stück reduziert DA ${mainDa} / ${branchDa}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.03.${pad3(PE_SIZES.length + idx + 1)}`,
      notes: `Durchgang DA ${mainDa}, Abgang DA ${branchDa}`
    });
  });

  // 4. PE Reduktionen zentrisch lang (DA 63/50 bis DA 450/400) -> OZ 01.04.04.xxx
  REDUCER_COMBOS.forEach(([bigDa, smallDa], idx) => {
    items.push({
      id: `cat-pe-red-${bigDa}-${smallDa}`,
      name: `PE Reduktion zentrisch DA ${bigDa} / ${smallDa}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.04.${pad3(idx + 1)}`,
      notes: `Reduzierstück lang für Stumpf- & Elektromuffenschweißung`
    });
  });

  // 5. PE Vorschweißbunde (DA 50 - 450) -> OZ 01.04.05.xxx
  PE_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pe-vb-${da}`,
      name: `PE Vorschweißbund DA ${da}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.05.${pad3(idx + 1)}`,
      notes: `Passend für Losflansch DN ${dn}`
    });
  });

  // PE Losflansche (DA 50 - 450) -> OZ 01.04.05.018+
  PE_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-fl-pp-${da}`,
      name: `Losflansch DA ${da} / DN ${dn}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.05.${pad3(PE_SIZES.length + idx + 1)}`,
      notes: `Lochkreis nach DIN EN 1092-1`
    });
  });

  // PE Flachdichtungen mit Stahleinlage (DA 50 - 450)
  PE_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-dicht-${da}`,
      name: `Flachdichtung DA ${da} / DN ${dn}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.05.${pad3(PE_SIZES.length * 2 + idx + 1)}`,
      notes: `Profil-Dichtung mit Stahleinlage für Flanschverbindungen`
    });
  });

  // PE Elektroschweißmuffen (E-Muffe DA 50 - 450)
  PE_SIZES.forEach((da, idx) => {
    items.push({
      id: `cat-pe-emuffe-${da}`,
      name: `PE Elektroschweißmuffe DA ${da}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.05.${pad3(PE_SIZES.length * 3 + idx + 1)}`,
      notes: `Heizwendelschweißmuffe 40V`
    });
  });

  // PE Endkappen (DA 50 - 450)
  PE_SIZES.forEach((da, idx) => {
    items.push({
      id: `cat-pe-kappe-${da}`,
      name: `PE Endkappe DA ${da}`,
      category: 'PE Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.05.${pad3(PE_SIZES.length * 4 + idx + 1)}`,
      notes: `Rohrabschlusskappe`
    });
  });

  return items;
};

const PVC_SIZES = [20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400];

const PVC_REDUCED_TEE_COMBOS: [number, number][] = [
  [25, 20],
  [32, 20], [32, 25],
  [40, 20], [40, 25], [40, 32],
  [50, 25], [50, 32], [50, 40],
  [63, 25], [63, 32], [63, 40], [63, 50],
  [75, 32], [75, 40], [75, 50], [75, 63],
  [90, 40], [90, 50], [90, 63], [90, 75],
  [110, 50], [110, 63], [110, 75], [110, 90],
  [125, 63], [125, 75], [125, 90], [125, 110],
  [140, 90], [140, 110],
  [160, 90], [160, 110], [160, 125],
  [180, 110], [180, 160],
  [200, 110], [200, 160],
  [225, 110], [225, 160],
  [250, 110], [250, 160],
  [280, 160], [280, 225],
  [315, 160], [315, 225],
  [355, 225], [355, 280],
  [400, 250], [400, 315]
];

const PVC_REDUCER_COMBOS: [number, number][] = [
  [25, 20],
  [32, 20],
  [32, 25],
  [40, 20],
  [40, 25],
  [40, 32],
  [50, 20],
  [50, 25],
  [50, 32],
  [50, 40],
  [63, 25],
  [63, 32],
  [63, 40],
  [63, 50],
  [75, 32],
  [75, 40],
  [75, 50],
  [75, 63],
  [90, 40],
  [90, 50],
  [90, 63],
  [90, 75],
  [110, 50],
  [110, 63],
  [110, 75],
  [110, 90],
  [125, 63],
  [125, 75],
  [125, 90],
  [125, 110],
  [140, 75],
  [140, 90],
  [140, 110],
  [140, 125],
  [160, 90],
  [160, 110],
  [160, 125],
  [160, 140],
  [180, 110],
  [180, 125],
  [180, 140],
  [180, 160],
  [200, 110],
  [200, 125],
  [200, 140],
  [200, 160],
  [200, 180],
  [225, 140],
  [225, 160],
  [225, 180],
  [225, 200],
  [250, 160],
  [250, 180],
  [250, 200],
  [250, 225],
  [280, 180],
  [280, 200],
  [280, 225],
  [280, 250],
  [315, 200],
  [315, 225],
  [315, 250],
  [315, 280],
  [355, 225],
  [355, 250],
  [355, 280],
  [355, 315],
  [400, 250],
  [400, 280],
  [400, 315],
  [400, 355]
];

const generatePvcCatalog = (): CatalogItem[] => {
  const items: CatalogItem[] = [];

  // 1. PVC Druckrohre (DA 20 - 400) -> OZ 01.04.07.xxx
  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-rohr-${da}`,
      name: `PVC Druckrohr DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'meter',
      articleNumber: `OZ 01.04.07.${pad3(idx + 1)}`,
      notes: `5m Stange (DN ${dn} / Ø ${da}mm)`
    });
  });

  // 2. PVC Bogen 90° (DA 20 - 400) & 45° -> OZ 01.04.08.xxx
  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-b90-${da}`,
      name: `PVC Bogen 90° DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.08.${pad3(idx + 1)}`,
      notes: `Klebefitting 90° DN ${dn} / DA ${da}`
    });
  });

  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-b45-${da}`,
      name: `PVC Bogen 45° DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.08.${pad3(PVC_SIZES.length + idx + 1)}`,
      notes: `Klebefitting 45° DN ${dn} / DA ${da}`
    });
  });

  // 3. PVC T-Stücke egal & reduziert -> OZ 01.04.09.xxx
  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-t-egal-${da}`,
      name: `PVC T-Stück egal DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.09.${pad3(idx + 1)}`,
      notes: `Klebefitting (DN ${dn} DA ${da} x ${da})`
    });
  });

  PVC_REDUCED_TEE_COMBOS.forEach(([mainDa, branchDa], idx) => {
    const mainDn = FLANGE_DN_MAP[mainDa] || mainDa;
    const branchDn = FLANGE_DN_MAP[branchDa] || branchDa;
    items.push({
      id: `cat-pvc-t-red-${mainDa}-${branchDa}`,
      name: `PVC T-Stück reduziert DN ${mainDn}/${branchDn} DA ${mainDa}/${branchDa}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.09.${pad3(PVC_SIZES.length + idx + 1)}`,
      notes: `Durchgang DN ${mainDn} DA ${mainDa}, Abgang DN ${branchDn} DA ${branchDa}`
    });
  });

  // 4. PVC Reduktionen kurz / zentrisch (DA 25/20 bis DA 400/355) -> OZ 01.04.10.xxx
  PVC_REDUCER_COMBOS.forEach(([bigDa, smallDa], idx) => {
    const bigDn = FLANGE_DN_MAP[bigDa] || bigDa;
    const smallDn = FLANGE_DN_MAP[smallDa] || smallDa;
    items.push({
      id: `cat-pvc-red-${bigDa}-${smallDa}`,
      name: `PVC Reduktion DN ${bigDn}/${smallDn} DA ${bigDa}/${smallDa}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.10.${pad3(idx + 1)}`,
      notes: `Klebefitting Reduzierstück DN ${bigDn}/${smallDn} (DA ${bigDa} x ${smallDa})`
    });
  });

  // 5. PVC Bundbuchsen (DA 20 - 400) -> OZ 01.04.11.xxx
  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-bb-${da}`,
      name: `PVC Bundbuchse DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.11.${pad3(idx + 1)}`,
      notes: `Passend für Losflansch DN ${dn}`
    });
  });

  // PVC Losflansche (DA 20 - 400)
  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-fl-${da}`,
      name: `PVC Losflansch DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.11.${pad3(PVC_SIZES.length + idx + 1)}`,
      notes: `Lochkreis nach DIN EN 1092-1`
    });
  });

  // PVC Flachdichtungen (DA 20 - 400)
  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-dicht-${da}`,
      name: `Flachdichtung DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.11.${pad3(PVC_SIZES.length * 2 + idx + 1)}`,
      notes: `Profil-Dichtung für Flanschverbindungen`
    });
  });

  // 6. PVC Klebemuffen, Endkappen, UKS, Schaugläser -> OZ 01.04.12.xxx
  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-muffe-${da}`,
      name: `PVC Klebemuffe DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.12.${pad3(idx + 1)}`,
      notes: `Verbindungsmuffe egal DN ${dn} / DA ${da}`
    });
  });

  PVC_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-kappe-${da}`,
      name: `PVC Endkappe DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.12.${pad3(PVC_SIZES.length + idx + 1)}`,
      notes: `Rohrabschlusskappe DN ${dn} / DA ${da}`
    });
  });

  const UKS_SIZES = [20, 25, 32, 40, 50, 63, 75, 90, 110, 140, 160, 200];
  UKS_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-uks-${da}`,
      name: `PVC UKS Muffe DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.12.${pad3(PVC_SIZES.length * 2 + idx + 1)}`,
      notes: `UKS Übergangs-Klebemuffe / Überschiebmuffe DN ${dn} / DA ${da}`
    });
  });

  const SCHAUGLAS_SIZES = [110, 140, 180, 225, 280, 315, 355];
  SCHAUGLAS_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-schauglas-${da}`,
      name: `PVC Schauglas DN ${dn} DA ${da}`,
      category: 'PVC Rohre & Fittings',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.12.${pad3(PVC_SIZES.length * 2 + UKS_SIZES.length + idx + 1)}`,
      notes: `Schauglas / Strömungsschauglas DN ${dn} / DA ${da}`
    });
  });

  return items;
};

const generateScrewCatalog = (): CatalogItem[] => {
  const items: CatalogItem[] = [];

  // M16 lengths: 50 to 200 (step 5)
  const m16Lengths: number[] = [];
  for (let l = 50; l <= 200; l += 5) {
    m16Lengths.push(l);
  }

  // M20 lengths: 60 to 240 (step 5)
  const m20Lengths: number[] = [];
  for (let l = 60; l <= 240; l += 5) {
    m20Lengths.push(l);
  }

  // 1. Verzinkte Schraubensätze -> OZ 01.04.06.xxx
  m16Lengths.forEach((len, idx) => {
    items.push({
      id: `cat-schr-vz-m16-${len}`,
      name: `Schraubensatz verzinkt M16 x ${len}`,
      category: 'Verzinkte Schrauben',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.06.${pad3(idx + 1)}`,
      notes: `Schraubensatz verzinkt M16 x ${len} mm (inkl. Mutter & 2 U-Scheiben)`
    });
  });

  m20Lengths.forEach((len, idx) => {
    items.push({
      id: `cat-schr-vz-m20-${len}`,
      name: `Schraubensatz verzinkt M20 x ${len}`,
      category: 'Verzinkte Schrauben',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.06.${pad3(m16Lengths.length + idx + 1)}`,
      notes: `Schraubensatz verzinkt M20 x ${len} mm (inkl. Mutter & 2 U-Scheiben)`
    });
  });

  // 2. VA Schraubensätze -> OZ 01.04.06.xxx (fortlaufend)
  m16Lengths.forEach((len, idx) => {
    items.push({
      id: `cat-schr-va-m16-${len}`,
      name: `Schraubensatz VA M16 x ${len}`,
      category: 'VA Schrauben',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.06.${pad3(m16Lengths.length + m20Lengths.length + idx + 1)}`,
      notes: `Schraubensatz Edelstahl VA M16 x ${len} mm (inkl. Mutter & 2 U-Scheiben)`
    });
  });

  m20Lengths.forEach((len, idx) => {
    items.push({
      id: `cat-schr-va-m20-${len}`,
      name: `Schraubensatz VA M20 x ${len}`,
      category: 'VA Schrauben',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.06.${pad3(m16Lengths.length * 2 + m20Lengths.length + idx + 1)}`,
      notes: `Schraubensatz Edelstahl VA M20 x ${len} mm (inkl. Mutter & 2 U-Scheiben)`
    });
  });

  return items;
};

const SCHELLEN_SIZES = [20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450];

const generateSchellenCatalog = (): CatalogItem[] => {
  const items: CatalogItem[] = [];

  SCHELLEN_SIZES.forEach((da, idx) => {
    items.push({
      id: `cat-schelle-${da}`,
      name: `Rohrschelle DA ${da}`,
      category: 'Schellen',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.14.${pad3(idx + 1)}`,
      notes: `Rohrschelle mit Einlage für Ø ${da}mm`
    });
  });

  return items;
};

const EINSCHWEISSMUFFEN_COMBOS: [number, string, string][] = [
  [20, '1/2"', '1/2'],
  [25, '3/4"', '3/4'],
  [32, '1"', '1'],
  [40, '1 1/4"', '1-14'],
  [50, '1 1/2"', '1-12'],
  [63, '2"', '2'],
  [75, '2 1/2"', '2-12'],
  [90, '3"', '3']
];

const generatePeSonstigesCatalog = (): CatalogItem[] => {
  const items: CatalogItem[] = [];

  // PE Einschweißmuffen (DA 20 bis 90) -> OZ 01.04.15.xxx
  EINSCHWEISSMUFFEN_COMBOS.forEach(([da, thread, artSuffix], idx) => {
    items.push({
      id: `cat-pe-esm-${da}`,
      name: `PE Einschweißmuffe DA ${da} / ${thread}`,
      category: 'PE Sonstiges',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.15.${pad3(idx + 1)}`,
      notes: `PE Einschweißmuffe DA ${da} x ${thread}`
    });
  });

  // PE Schläuche (DA 20 bis 63)
  const SCHLAUCH_SIZES = [20, 25, 32, 40, 50, 63];
  SCHLAUCH_SIZES.forEach((da, idx) => {
    items.push({
      id: `cat-pe-schlauch-${da}`,
      name: `PE Schlauch DA ${da}`,
      category: 'PE Sonstiges',
      unit: 'meter',
      articleNumber: `OZ 01.04.15.${pad3(EINSCHWEISSMUFFEN_COMBOS.length + idx + 1)}`,
      notes: `PE-Flexschlauch / Meterware (Ø ${da}mm)`
    });
  });

  return items;
};

const KLAPPEN_ITEMS: { name: string; artSuffix: string; notes?: string }[] = [
  { name: 'Klappe DN 40 / DA 50', artSuffix: 'DN40-DA50', notes: 'Absperrklappe DN 40 passend für DA 50' },
  { name: 'Klappe DN 50 / DA 63', artSuffix: 'DN50-DA63', notes: 'Absperrklappe DN 50 passend für DA 63' },
  { name: 'Klappe DN 65 / DA 75', artSuffix: 'DN65-DA75', notes: 'Absperrklappe DN 65 passend für DA 75' },
  { name: 'Klappe DN 80 / DA 90', artSuffix: 'DN80-DA90', notes: 'Absperrklappe DN 80 passend für DA 90' },
  { name: 'Klappe DN 100 / DA 110', artSuffix: 'DN100-DA110', notes: 'Absperrklappe DN 100 passend für DA 110' },
  { name: 'Klappe DN 125 / DA 140', artSuffix: 'DN125-DA140', notes: 'Absperrklappe DN 125 passend für DA 140' },
  { name: 'Klappe DN 150 / DA 160/180', artSuffix: 'DN150-DA160-180', notes: 'Absperrklappe DN 150 passend für DA 160 / 180' },
  { name: 'Klappe DN 200 / DA 225', artSuffix: 'DN200-DA225', notes: 'Absperrklappe DN 200 passend für DA 225' },
  { name: 'Klappe DN 250 / DA 280', artSuffix: 'DN250-DA280', notes: 'Absperrklappe DN 250 passend für DA 280' },
  { name: 'Klappe DN 300 / DA 315', artSuffix: 'DN300-DA315', notes: 'Absperrklappe DN 300 passend für DA 315' },
  { name: 'Klappe DN 350 / DA 355', artSuffix: 'DN350-DA355', notes: 'Absperrklappe DN 350 passend für DA 355' },
  { name: 'Klappe DA 400', artSuffix: 'DA400', notes: 'Absperrklappe passend für DA 400' },
];

const RSK_SIZES = [40, 50, 65, 80, 100, 125, 150, 200, 250, 300];

const generateKlappenCatalog = (): CatalogItem[] => {
  const items: CatalogItem[] = [];

  // Absperrklappen -> OZ 01.04.17.xxx
  KLAPPEN_ITEMS.forEach((item, idx) => {
    items.push({
      id: `cat-klappe-${idx + 1}`,
      name: item.name,
      category: 'Klappen',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.17.${pad3(idx + 1)}`,
      notes: item.notes
    });
  });

  // Rückschlagklappen (RSK)
  RSK_SIZES.forEach((dn, idx) => {
    items.push({
      id: `cat-rsk-${dn}`,
      name: `RSK DN ${dn}`,
      category: 'Klappen',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.17.${pad3(KLAPPEN_ITEMS.length + idx + 1)}`,
      notes: `Rückschlagklappe DN ${dn}`
    });
  });

  return items;
};

const PVC_VALVE_SIZES = [20, 25, 32, 40, 50, 63];

const PVC_UEBERGANG_COMBOS: [number, string, string][] = [
  [20, '1/2"', '1/2'],
  [25, '3/4"', '3/4'],
  [32, '1"', '1'],
  [40, '1 1/4"', '1-14'],
  [50, '1 1/2"', '1-12'],
  [63, '2"', '2'],
  [75, '2 1/2"', '2-12'],
  [90, '3"', '3']
];

const generatePvcSonstigesCatalog = (): CatalogItem[] => {
  const items: CatalogItem[] = [];

  // 1. PVC Kugelhähne (DN 15 DA 20 bis DN 50 DA 63) -> OZ 01.04.16.001 - 006
  PVC_VALVE_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-kugelhahn-${da}`,
      name: `PVC Kugelhahn DN ${dn} DA ${da}`,
      category: 'PVC Sonstiges',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.16.${pad3(idx + 1)}`,
      notes: `2-Wege Kugelhahn Klebemuffe DN ${dn} / DA ${da}`
    });
  });

  // 2. PVC Verschraubungen (DN 15 DA 20 bis DN 50 DA 63) -> OZ 01.04.16.007 - 012
  PVC_VALVE_SIZES.forEach((da, idx) => {
    const dn = FLANGE_DN_MAP[da] || da;
    items.push({
      id: `cat-pvc-verschraubung-${da}`,
      name: `PVC Verschraubung DN ${dn} DA ${da}`,
      category: 'PVC Sonstiges',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.16.${pad3(PVC_VALVE_SIZES.length + idx + 1)}`,
      notes: `PVC Klebeverschraubung 2-seitig Klebemuffe DN ${dn} / DA ${da}`
    });
  });

  // 3. PVC Übergänge AG (Außengewinde) -> OZ 01.04.16.013+
  PVC_UEBERGANG_COMBOS.forEach(([da, thread, artSuffix], idx) => {
    items.push({
      id: `cat-pvc-ug-ag-${da}`,
      name: `PVC Übergang AG ${thread} DA ${da}`,
      category: 'PVC Sonstiges',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.16.${pad3(PVC_VALVE_SIZES.length * 2 + idx + 1)}`,
      notes: `PVC Übergangsstück AG ${thread} x DA ${da}`
    });
  });

  // 4. PVC Übergänge IG (Innengewinde)
  PVC_UEBERGANG_COMBOS.forEach(([da, thread, artSuffix], idx) => {
    items.push({
      id: `cat-pvc-ug-ig-${da}`,
      name: `PVC Übergang IG ${thread} DA ${da}`,
      category: 'PVC Sonstiges',
      unit: 'Stk.',
      articleNumber: `OZ 01.04.16.${pad3(PVC_VALVE_SIZES.length * 2 + PVC_UEBERGANG_COMBOS.length + idx + 1)}`,
      notes: `PVC Übergangsstück IG ${thread} x DA ${da}`
    });
  });

  return items;
};

const generateEinbauteileCatalog = (): CatalogItem[] => {
  return [
    {
      id: 'cat-eb-beleuchtung-wasserspeicher',
      name: 'Beleuchtung Wasserspeicher',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-BEL-WS'
    },
    {
      id: 'cat-eb-scheinwerfer-alle',
      name: 'Scheinwerfer alle Art und Fabrikat',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-SW-ALL'
    },
    {
      id: 'cat-eb-topf-scheinwerfer-lautsprecher',
      name: 'Topf für Scheinwerfer und + Lautsprecher',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-TOPF-SW-LS'
    },
    {
      id: 'cat-eb-rinnenstutzen-kasten',
      name: 'Rinnenstutzen mit Kasten',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-RINN-KAST'
    },
    {
      id: 'cat-eb-schwimmende-absaugung',
      name: 'Schwimmende Absaugung',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-SCHW-ABS'
    },
    {
      id: 'cat-eb-rohwasserspeichertuer',
      name: 'Rohwasserspeichertür',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-RW-TUER'
    },
    {
      id: 'cat-eb-mannloch-alle',
      name: 'Mannloch alle Größen',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-MANNL-ALL'
    },
    {
      id: 'cat-eb-einbauteile-aller-art',
      name: 'Einbauteile aller Art und Größe',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-EBT-ALL'
    },
    {
      id: 'cat-eb-epple-pro-kg',
      name: 'Epple pro kg',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-EPPLE-KG'
    },
    {
      id: 'cat-eb-messwassersieb',
      name: 'Messwassersieb',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-MWS-SIEB'
    },
    {
      id: 'cat-eb-sieb-240-240',
      name: 'Sieb 240 x 240',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-SIEB-240'
    },
    {
      id: 'cat-eb-sieb-490-490',
      name: 'Sieb 490 x 490',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-SIEB-490'
    },
    {
      id: 'cat-eb-sieb-massageduesen',
      name: 'Sieb Massagedüsen',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-SIEB-MDUE'
    },
    {
      id: 'cat-eb-sieb-einstroemduese',
      name: 'Sieb Einströmdüse',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-SIEB-EDUE'
    },
    {
      id: 'cat-eb-sieb-stroemungskanalduese',
      name: 'Sieb Strömungskanaldüse',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-SIEB-SKDUE'
    },
    {
      id: 'cat-eb-einstroemduese-wand',
      name: 'Einströmdüse Wand',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-EDUE-WAND'
    },
    {
      id: 'cat-eb-einstroemduese-boden',
      name: 'Einströmdüse Boden',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-EDUE-BODEN'
    },
    {
      id: 'cat-eb-einstroemtopf-komplett',
      name: 'Einströmtopf Komplett',
      category: 'Einbauteile & Becken',
      unit: 'Stk.',
      articleNumber: 'EB-ETOPF-KOMPL'
    }
  ];
};

const generateChlorgasCatalog = (): CatalogItem[] => {
  return [
    {
      id: 'cat-cg-gaswarngeraet-sensor',
      name: 'Gaswarngerät mit Sensor',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-GWG-SENS'
    },
    {
      id: 'cat-cg-hupe-horn',
      name: 'Hupe / Horn',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-HUPE-HORN'
    },
    {
      id: 'cat-cg-rippenrohrheizkoerper',
      name: 'Rippenrohrheizkörper',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-RR-HK'
    },
    {
      id: 'cat-cg-tuerkontaktschalter',
      name: 'Türkontaktschalter',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-TK-SCHALT'
    },
    {
      id: 'cat-cg-chlorflaschenhalter',
      name: 'Chlorflaschenhalter',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-FL-HALT'
    },
    {
      id: 'cat-cg-chlorflaschenventil',
      name: 'Chlorflaschenventil',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-FL-VENT'
    },
    {
      id: 'cat-cg-raumthermostat',
      name: 'Raumthermostat',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-R-THERM'
    },
    {
      id: 'cat-cg-deckenbrause-4-duesen',
      name: 'Deckenbrause mit bis zu 4 Düsen',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-DB-4D'
    },
    {
      id: 'cat-cg-beschilderung-chlorgasraum',
      name: 'Beschilderung Chlorgasraum',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-BESCH-RAUM'
    },
    {
      id: 'cat-cg-aktivkohlefilter',
      name: 'Aktivkohlefilter',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-AKF-FILT'
    },
    {
      id: 'cat-cg-sicherheitsabblaseventil',
      name: 'Sicherheitsabblaseventil',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-SAV-VENT'
    },
    {
      id: 'cat-cg-aussenkasten-deckenbrauseventil',
      name: 'Außenkasten Deckenbrauseventil',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-AK-DBV'
    },
    {
      id: 'cat-cg-neutralisationsanlage-chlor',
      name: 'Neutralisationsanlage Chlor',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-NEUTR-CHLOR'
    },
    {
      id: 'cat-cg-chlorgranulatdosierung-alle',
      name: 'Chlorgranulatdosierung alle Fabrikate mit Zubehör',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-CGD-ALL'
    },
    {
      id: 'cat-cg-v10k',
      name: 'V10K',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-V10K'
    },
    {
      id: 'cat-cg-marmorkiesturm-zubehoer',
      name: 'Marmorkiesturm mit Zubehör',
      category: 'Chlorgas & Chlorgasraum',
      unit: 'Stk.',
      articleNumber: 'CG-MKT-ZUB'
    }
  ];
};

const generatePumpenCatalog = (): CatalogItem[] => {
  return [
    {
      id: 'cat-pu-mit-vf-ab-37kw',
      name: 'Pumpen mit Vorfilter ab 37 KW',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-VF-AB37'
    },
    {
      id: 'cat-pu-mit-vf-bis-30kw',
      name: 'Pumpen mit Vorfilter bis 30 KW',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-VF-BIS30'
    },
    {
      id: 'cat-pu-ohne-vf-ab-37kw',
      name: 'Pumpen ohne Vorfilter ab 37 KW',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-OVF-AB37'
    },
    {
      id: 'cat-pu-ohne-vf-bis-30kw',
      name: 'Pumpen ohne Vorfilter bis 30 KW',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-OVF-BIS30'
    },
    {
      id: 'cat-pu-ohne-vf-bis-75kw',
      name: 'Pumpen ohne Vorfilter bis 7,5 KW',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-OVF-BIS75'
    },
    {
      id: 'cat-pu-ohne-vf-bis-3kw',
      name: 'Pumpen ohne Vorfilter bis 3 KW',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-OVF-BIS3'
    },
    {
      id: 'cat-pu-manometer',
      name: 'Manometer',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-MANOM'
    },
    {
      id: 'cat-pu-kompressor-zubehoer',
      name: 'Kompressor mit Zubehör',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-KOMP-ZUB'
    },
    {
      id: 'cat-pu-cu-rohr-formteile',
      name: 'CU-Rohr mit Formteile',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-CU-ROHR'
    },
    {
      id: 'cat-pu-pneum-schlauch-leerrohr',
      name: 'pneum. Schlauch mit Leerrohr',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'meter',
      articleNumber: 'PU-PNEUM-SCHL'
    },
    {
      id: 'cat-pu-spuelluftgeblaese',
      name: 'Spülluftgebläse',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-SL-GEBL'
    },
    {
      id: 'cat-pu-attraktionsgeblaese-ab-11kw',
      name: 'Attraktionsgebläse ab 11 KW',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-AG-AB11'
    },
    {
      id: 'cat-pu-attraktionsgeblaese-bis-75kw',
      name: 'Attraktionsgebläse bis 7,5 KW',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-AG-BIS75'
    },
    {
      id: 'cat-pu-entlastungstopf',
      name: 'Entlastungstopf',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-ENTL-TOPF'
    },
    {
      id: 'cat-pu-plattenwaermetauscher-bis-50kg',
      name: 'Plattenwärmetauscher bis 50 kg',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-PWT-BIS50'
    },
    {
      id: 'cat-pu-plattenwaermetauscher-ab-50kg',
      name: 'Plattenwärmetauscher ab 50 kg',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-PWT-AB50'
    },
    {
      id: 'cat-pu-dosierpumpen-alle-art',
      name: 'Dosierpumpen alle Art',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-DP-ALL'
    },
    {
      id: 'cat-pu-wandkonsole',
      name: 'Wandkonsole',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-WAND-KONS'
    },
    {
      id: 'cat-pu-dosierleitung-leerrohr',
      name: 'Dosierleitung Leerrohr',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'meter',
      articleNumber: 'PU-DL-LEER'
    },
    {
      id: 'cat-pu-frischwassertafel',
      name: 'Frischwassertafel',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-FW-TAFEL'
    },
    {
      id: 'cat-pu-mess-regelgeraet-tafel',
      name: 'Mess- und Regelgerät auf Tafel',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-MR-TAFEL'
    },
    {
      id: 'cat-pu-messwasserpumpe',
      name: 'Messwasserpumpe',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-MW-PUMPE'
    },
    {
      id: 'cat-pu-messwasserrueckfuehrpumpe-behaelter',
      name: 'Messwasserrückführpumpe mit Behälter',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-MW-RUECK'
    },
    {
      id: 'cat-pu-messwasserschlauch',
      name: 'Messwasserschlauch',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'meter',
      articleNumber: 'PU-MW-SCHL'
    },
    {
      id: 'cat-pu-probeentnahme',
      name: 'Probeentnahme',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-PROBE-ENTN'
    },
    {
      id: 'cat-pu-impfstellen-dosierlanzen',
      name: 'Impfstellen / Dosierlanzen',
      category: 'Pumpen, Kompressor, WT, Messwasser',
      unit: 'Stk.',
      articleNumber: 'PU-IMPF-LANZ'
    }
  ];
};

export const INITIAL_CATALOG: CatalogItem[] = [
  // Complete PE Piping & Fittings Series (DA 50 bis 450)
  ...generatePeCatalog(),

  // Complete PVC Piping & Fittings Series (DA 50 bis 400)
  ...generatePvcCatalog(),

  // Complete Screws Series: Verzinkt & VA (M16 x 50-200, M20 x 60-240)
  ...generateScrewCatalog(),

  // Complete Schellen Series (DA 20 bis 450)
  ...generateSchellenCatalog(),

  // PE Sonstiges (Einschweißmuffen & Schläuche DA 20 bis 90)
  ...generatePeSonstigesCatalog(),

  // PVC Sonstiges (Übergänge AG / IG DA 20 bis 90)
  ...generatePvcSonstigesCatalog(),

  // Klappen (DN 40 / DA 50 bis DA 400 & RSK)
  ...generateKlappenCatalog(),

  // Chlorgas & Chlorgasraum
  ...generateChlorgasCatalog(),

  // Pumpen, Kompressor, WT, Messwasser
  ...generatePumpenCatalog(),

  // Einbauteile & Becken
  ...generateEinbauteileCatalog(),

  // Abdichtung & Bauchemie
  {
    id: 'cat-dichtschlaemme-2k',
    name: 'Dichtschlämme 2K hochflexibel (25kg Sack)',
    category: 'Abdichtung & Bauchemie',
    unit: 'Palette',
    articleNumber: 'DS-2K-25',
    notes: 'Für Beckenabdichtung nach DIN 18535'
  },
  {
    id: 'cat-dichtband-120',
    name: 'Dichtband 120mm beidseitig vlieskaschiert (50m Rolle)',
    category: 'Abdichtung & Bauchemie',
    unit: 'meter',
    articleNumber: 'DB-120-50M'
  },
  {
    id: 'cat-dichtecke-innen',
    name: 'Dichtecke innen 90° vorkonfektioniert',
    category: 'Abdichtung & Bauchemie',
    unit: 'Stk.',
    articleNumber: 'DE-INNEN-90'
  },
  {
    id: 'cat-dichtecke-aussen',
    name: 'Dichtecke außen 90° vorkonfektioniert',
    category: 'Abdichtung & Bauchemie',
    unit: 'Stk.',
    articleNumber: 'DE-AUSSEN-90'
  },
  {
    id: 'cat-fliesenkleber-c2te',
    name: 'Fliesenkleber C2TE S1 hochverformbar (25kg Sack)',
    category: 'Abdichtung & Bauchemie',
    unit: 'Palette',
    articleNumber: 'FK-C2TE-25'
  },
  {
    id: 'cat-epoxi-fuge-5kg',
    name: 'Epoxidharzfuge 2K chemikalienbeständig (5kg Eimer)',
    category: 'Abdichtung & Bauchemie',
    unit: 'Stk.',
    articleNumber: 'EP-FUGE-5KG'
  }
];
