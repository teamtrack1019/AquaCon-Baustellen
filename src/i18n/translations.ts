const deTranslations = {
  appTitle: 'AquaCon Baustellen & Materialführung',
  tagline: 'Pool- & Baustellenverwaltung, Materialerfassung & Bestellwesen',
  role: 'Rolle',
  worker: 'Mitarbeiter / Baustelle',
  admin: 'Admin / Bauleiter',
  workerModeDesc: 'Materialbedarf vor Ort erfassen, Fehlmengen anfordern & Liefereingang prüfen',
  adminModeDesc: 'Zentrale Steuerung, Baustellenübersicht, Materialanforderungen & Rückstände',
  language: 'Sprache',
  
  // Navigation
  navDashboard: 'Dashboard & Übersicht',
  navBaustellen: 'Baustellen & Becken',
  navAufmass: 'Aufmaß & Längenberechnung',
  navMaterialStock: 'Materialbestand vor Ort',
  navOrders: 'Materialanforderungen',
  navBackorders: 'Gemerkte Rückstände',
  navCatalog: 'A-Z Materialkatalog',
  navNewOrder: 'Material anfordern / bestellen',

  // Baustellen
  baustelle: 'Baustelle',
  baustellen: 'Baustellen',
  newBaustelle: 'Neue Baustelle anlegen',
  projectNumber: 'Projekt-Nr.',
  address: 'Adresse / Ort',
  client: 'Kunde / Bauherr',
  manager: 'Projektleiter / Vorarbeiter',
  status: 'Status',
  statusPlanning: 'In Planung',
  statusActive: 'Aktiv / Im Bau',
  statusCompleted: 'Abgeschlossen',
  startDate: 'Startdatum',
  targetDate: 'Fertigstellung bis',
  areas: 'Bereiche & Becken',
  addArea: 'Becken / Gebäude hinzufügen',
  areaName: 'Bezeichnung',
  areaType: 'Typ',

  // Area types
  typeSchwimmer: 'Schwimmerbecken',
  typeNichtschwimmer: 'Nichtschwimmerbecken',
  typePlansch: 'Planschbecken / Kinderbereich',
  typeHaus: 'Gebäude / Außenbereich',
  typeTechnik: 'Technikraum',
  typeAussen: 'Außenanlagen / Garten',
  typeCustom: 'Individueller Bereich',

  // Material
  material: 'Material',
  materials: 'Materialien',
  category: 'Kategorie',
  unit: 'Einheit',
  requiredQty: 'Benötigt (Soll)',
  onSiteQty: 'Vor Ort (Ist)',
  shortageQty: 'Fehlmenge',
  orderedQty: 'Angefordert / Bestellt',
  addMaterial: 'Material erfassen',
  searchCatalog: 'Material aus A-Z Katalog suchen...',
  customMaterialName: 'Oder freier Materialname',
  materialStatusOk: 'Ausreichend vor Ort',
  materialStatusShortage: 'Fehlt / Anfordern',
  materialStatusOrdered: 'Bereits angefordert',
  materialStatusDelivered: 'Geliefert',

  // Orders & Delivery Check
  orders: 'Materialanforderungen',
  orderNumber: 'Anforderungs-Nr.',
  orderDate: 'Anforderungsdatum',
  deliveryDate: 'Gewünschter Termin',
  actualDeliveryDate: 'Eingegangen am',
  supplier: 'Quelle / Herkunft',
  createOrderFromShortages: 'Aus Fehlmengen anfordern (1-Klick)',
  receiveDelivery: 'Lieferung prüfen & annehmen',
  markMissingBackorder: 'Nicht gelieferte Artikel als Rückstand merken',
  flaggedBackorders: 'Offene Rückstände (Gemerkte Fehlmengen)',
  orderStatusDraft: 'Entwurf',
  orderStatusOrdered: 'Angefordert (Unterwegs)',
  orderStatusPartially: 'Teilweise eingegangen',
  orderStatusDelivered: 'Vollständig vor Ort',
  orderStatusCancelled: 'Storniert',

  // Actions & PDF
  downloadPdf: 'PDF herunterladen',
  print: 'Drucken',
  shareWhatsApp: 'Per WhatsApp teilen',
  save: 'Speichern',
  cancel: 'Abbrechen',
  delete: 'Löschen',
  edit: 'Bearbeiten',
  confirm: 'Bestätigen',
  filterByBaustelle: 'Nach Baustelle filtern',
  filterByCategory: 'Nach Kategorie filtern',
  searchPlaceholder: 'Suchen (Name, Art-Nr., Projekt)...',
  
  // Notifications & Stats
  totalBaustellen: 'Aktive Baustellen',
  totalPools: 'Erfasste Becken & Gebäude',
  totalShortages: 'Offene Fehlmengen',
  activeOrders: 'Laufende Anforderungen',
  urgentBackorders: 'Gemerkte Lieferrückstände'
};

export const translations = {
  de: deTranslations,
  tr: deTranslations // System is strictly German throughout
};
