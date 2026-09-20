import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Baustelle, Area, AreaMaterial } from '../types';
import { INITIAL_CATALOG } from '../data/initialCatalog';

export const sharePdfDoc = async (doc: jsPDF, filename: string, title: string) => {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const pdfBlob = doc.output('blob');

  if (typeof navigator !== 'undefined' && navigator.share) {
    const file = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: title,
          text: title
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.warn('Native share failed, fallback to download:', err);
      }
    }
  }

  // Fallback for browsers without Web Share Level 2 file sharing support
  doc.save(cleanFilename);
  const textMsg = encodeURIComponent(`${title} PDF olarak indirildi. WhatsApp üzerinden ekleyebilirsiniz.`);
  window.open(`https://wa.me/?text=${textMsg}`, '_blank');
};

export const createOrderPdfDoc = (order: Order) => {
  const doc = new jsPDF();

  // Header Background
  doc.setFillColor(2, 132, 199); // Sky blue #0284c7
  doc.rect(0, 0, 210, 28, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('AquaCon - MATERIALANFORDERUNG & LIEFERSCHEIN', 14, 18);

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const getStatusLabel = (st: string) => {
    switch (st) {
      case 'delivered':
        return 'Vollständig geliefert';
      case 'partially_delivered':
        return 'Teillieferung vor Ort';
      case 'in_progress':
        return 'In Bearbeitung';
      case 'pending':
      default:
        return 'Offen / Neu';
    }
  };

  doc.text(`Anforderungs-Nr.: ${order.orderNumber}`, 14, 38);
  doc.text(`Datum: ${order.orderDate || new Date(order.createdAt).toLocaleDateString('de-DE')}`, 14, 44);
  doc.text(`Status: ${getStatusLabel(order.status)}`, 14, 50);

  doc.text(`Baustelle / Projekt: ${order.baustelleName}`, 115, 38);
  doc.text(`Bereich / Becken: ${order.areaName || 'Gesamte Baustelle'}`, 115, 44);
  doc.text(`Anforderer: ${order.createdByName || (order.createdByRole === 'admin' ? 'Bauleitung / Admin' : 'Mitarbeiter Baustelle')}`, 115, 50);

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 56, 196, 56);

  // Notes if available
  if (order.notes) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Hinweis / Baustellen-Notiz: ${order.notes}`, 14, 62);
  }

  // Items Table
  const tableData = order.items.map((item, index) => [
    index + 1,
    item.name,
    item.category || '-',
    `${item.orderedQty} ${item.unit}`,
    item.deliveredQty > 0 ? `${item.deliveredQty} ${item.unit}` : '-',
    item.flaggedMissingQty > 0 && item.isFlagged ? `FEHLT: ${item.flaggedMissingQty} ${item.unit}` : 'OK / Vollständig'
  ]);

  autoTable(doc, {
    startY: order.notes ? 68 : 62,
    head: [['Pos', 'Materialbezeichnung', 'Kategorie', 'Bedarf (Soll)', 'Geliefert (Ist)', 'Rückstand / Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [240, 249, 255]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 27, halign: 'center' }
    }
  });

  // Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`AquaCon Baustellen & Materialführung • Seite ${i} von ${pageCount}`, 14, 290);
  }

  const cleanTitle = (order.orderNumber || 'Bestellung').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `AquaCon_${cleanTitle}_${order.baustelleName.slice(0, 15)}.pdf`;

  return { doc, filename };
};

export const generateOrderPdf = (order: Order) => {
  const { doc, filename } = createOrderPdfDoc(order);
  doc.save(filename);
};

export const shareOrderPdf = async (order: Order) => {
  const { doc, filename } = createOrderPdfDoc(order);
  await sharePdfDoc(doc, filename, `AquaCon Materialanforderung ${order.orderNumber}`);
};

export const createAreaMaterialPdfDoc = (baustelle: Baustelle, area: Area) => {
  const doc = new jsPDF();

  // Header Background
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 210, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AquaCon - MATERIALBESTAND & FEHLMENGEN', 14, 18);

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Baustelle: ${baustelle.name} (${baustelle.projectNumber})`, 14, 38);
  doc.text(`Bereich / Becken: ${area.name} [${area.type.toUpperCase()}]`, 14, 44);
  doc.text(`Projektleiter: ${baustelle.manager}`, 14, 50);

  doc.text(`Stand: ${new Date().toLocaleDateString('de-DE')}`, 130, 38);
  doc.text(`Adresse: ${baustelle.address}`, 130, 44);

  // Table
  const tableData = area.materials.map((m, idx) => {
    const shortage = Math.max(0, m.requiredQty - m.onSiteQty);
    let statusText = 'OK';
    if (shortage > 0 && (m.orderedQty || 0) >= shortage) {
      statusText = 'BESTELLT';
    } else if (shortage > 0) {
      statusText = `FEHLT (${shortage} ${m.unit})`;
    }

    return [
      idx + 1,
      m.name,
      m.category,
      `${m.requiredQty} ${m.unit}`,
      `${m.onSiteQty} ${m.unit}`,
      shortage > 0 ? `${shortage} ${m.unit}` : '0',
      statusText,
      m.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: 58,
    head: [['#', 'Material', 'Kategorie', 'Soll', 'Ist (Vor Ort)', 'Eksik (Fehlt)', 'Status', 'Notiz']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const cleanName = `${baustelle.name}_${area.name}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `Materialliste_${cleanName}.pdf`;

  return { doc, filename };
};

export const generateAreaMaterialPdf = (baustelle: Baustelle, area: Area) => {
  const { doc, filename } = createAreaMaterialPdfDoc(baustelle, area);
  doc.save(filename);
};

export const shareAreaMaterialPdf = async (baustelle: Baustelle, area: Area) => {
  const { doc, filename } = createAreaMaterialPdfDoc(baustelle, area);
  await sharePdfDoc(doc, filename, `AquaCon Materialbestand ${baustelle.name} - ${area.name}`);
};

export const createAufmassPdfDoc = (sheet: import('../types').AufmassSheet) => {
  const doc = new jsPDF();

  // Header Background (Emerald / Slate Teal Theme for Aufmaß)
  doc.setFillColor(15, 118, 110); // #0f766e Teal 700
  doc.rect(0, 0, 210, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AquaCon - AUFMAßBLATT & LÄNGENBERECHNUNG', 14, 18);

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Baustelle / Projekt: ${sheet.baustelleName}`, 14, 38);
  doc.text(`Bereich / Becken: ${sheet.areaName || 'Gesamtes Objekt'}`, 14, 44);
  doc.text(`Aufmaß-Titel: ${sheet.title || 'Aufmaß'}`, 14, 50);

  doc.text(`Datum: ${sheet.date || new Date(sheet.createdAt).toLocaleDateString('de-DE')}`, 130, 38);
  doc.text(`Erfasst durch: ${sheet.inspectorName || 'Baustelle / Monteur'}`, 130, 44);

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 56, 196, 56);

  // Items Table
  const pad3 = (num: number): string => num.toString().padStart(3, '0');

  const tableData = sheet.items.map((item, idx) => {
    // Find article number if not present on item
    let artNr = item.articleNumber;
    if (!artNr) {
      const match = INITIAL_CATALOG.find(c => (item.catalogItemId && c.id === item.catalogItemId) || c.name === item.name);
      if (match && match.articleNumber) {
        artNr = match.articleNumber;
      }
    }
    const ozDisplay = artNr || `OZ ${pad3(idx + 1)}`;

    let detailStr = '-';
    if (item.unit === 'meter' && item.segments && item.segments.length > 0) {
      detailStr = item.segments.map(s => Number(s).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })).join(' + ') + ' m';
    } else if (item.unit === 'meter') {
      detailStr = `${Number(item.total).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m`;
    } else {
      detailStr = '-';
    }

    const totalStr = item.unit === 'meter' 
      ? `${Number(item.total).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`
      : `${item.total || item.quantity || 1} Stk.`;

    return [
      ozDisplay,
      item.name,
      item.unit,
      detailStr,
      totalStr
    ];
  });

  autoTable(doc, {
    startY: 62,
    head: [['OZ', 'Materialbezeichnung', 'Einh.', 'Einzelmaße / Aufmaßkette', 'Gesamt']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [240, 253, 250]
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 68 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 54 },
      4: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }
    }
  });

  // Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`AquaCon Aufmaßblatt • Seite ${i} von ${pageCount}`, 14, 290);
  }

  const cleanTitle = (sheet.title || 'Aufmass').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `AquaCon_Aufmass_${cleanTitle}_${sheet.baustelleName.slice(0, 15)}.pdf`;

  return { doc, filename };
};

export const generateAufmassPdf = (sheet: import('../types').AufmassSheet) => {
  const { doc, filename } = createAufmassPdfDoc(sheet);
  doc.save(filename);
};

export const shareAufmassPdf = async (sheet: import('../types').AufmassSheet) => {
  const { doc, filename } = createAufmassPdfDoc(sheet);
  await sharePdfDoc(doc, filename, `AquaCon Aufmaß ${sheet.title || sheet.baustelleName}`);
};


