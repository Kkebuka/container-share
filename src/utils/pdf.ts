import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Session, Owner } from "@/types";
import { computeItem, computeOwner, computeSession } from "@/utils/calculate";
import {
  formatUSD,
  formatCBM,
  formatPercent,
  sanitiseFilename,
  formatDate,
} from "@/utils/format";

// ─── Color constants for PDF (Print-friendly) ───────────────────────────────

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];
const DARK_GRAY: [number, number, number] = [60, 60, 60];
const MID_GRAY: [number, number, number] = [120, 120, 120];
const LIGHT_GRAY: [number, number, number] = [200, 200, 200];
const BRAND: [number, number, number] = [37, 99, 235];
const WARNING: [number, number, number] = [217, 119, 6];

// ─── Owner Invoice PDF ───────────────────────────────────────────────────────

export function generateOwnerInvoicePDF(session: Session, owner: Owner): void {
  const doc = new jsPDF("portrait", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Header - Premium brand section
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text("ContainerShare", margin, y + 8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("FREIGHT INVOICE", pageWidth - margin, y + 8, { align: "right" });

  y += 18;

  // Divider - Clean line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Session & Owner info - Single line layout
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Session:", margin, y);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(session.name, margin + 17, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Date:", pageWidth - margin - 40, y);
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  doc.text(formatDate(session.date), pageWidth - margin, y, { align: "right" });

  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Invoice To:", margin, y);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(owner.name, margin + 22, y);

  y += 12;

  // Items table
  const computedItems = owner.items.map(computeItem);
  const computed = computeOwner(owner, session);

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [
      [
        "#",
        "Item No",
        "Ctns",
        "CBM/Ctn",
        "Tot. CBM",
        "Price/Ctn",
        "Tot. Price",
      ],
    ],
    body: computedItems.map((item, idx) => [
      (idx + 1).toString(),
      item.itemNo,
      item.cartons.toString(),
      item.cbmPerCarton.toFixed(4),
      item.totalCBM.toFixed(4),
      formatUSD(item.pricePerCartonUSD),
      formatUSD(item.totalUSD),
    ]),
    foot: [
      [
        "",
        "TOTALS",
        computed.totalCartons.toString(),
        "",
        computed.totalCBM.toFixed(4),
        "",
        formatUSD(computed.totalGoodsUSD),
      ],
      ["", "Freight", "", "", "", "", formatUSD(computed.freightShareUSD)],
      ["", "Total Expense", "", "", "", "", formatUSD(computed.grandTotalUSD)],
    ],
    theme: "plain",
    tableWidth: "wrap",
    styles: {
      fillColor: WHITE,
      textColor: [30, 30, 30],
      fontSize: 9,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      font: "helvetica",
      lineColor: [225, 225, 225],
      lineWidth: 0,
      overflow: "ellipsize",
    },
    headStyles: {
      fillColor: [248, 248, 250],
      textColor: [70, 70, 70],
      fontSize: 8.5,
      fontStyle: "bold",
      lineWidth: { top: 0, right: 0, bottom: 0.8, left: 0 },
      lineColor: [210, 210, 210],
    },
    bodyStyles: {
      lineWidth: { top: 0, right: 0, bottom: 0.3, left: 0 },
      lineColor: [235, 235, 235],
    },
    footStyles: {
      fillColor: WHITE,
      textColor: [30, 30, 30],
      fontStyle: "bold",
      fontSize: 10,
      lineWidth: 0,
    },
    columnStyles: {
      // Total: 10+32+16+24+24+32+42 = 180mm (full A4 content width)
      0: {
        halign: "center",
        cellWidth: 10,
        fontStyle: "normal",
        textColor: [150, 150, 150],
        fontSize: 8,
      },
      1: { halign: "left", cellWidth: 32 },
      2: { halign: "right", cellWidth: 16, font: "courier" },
      3: { halign: "right", cellWidth: 24, font: "courier" },
      4: { halign: "right", cellWidth: 24, font: "courier" },
      5: { halign: "right", cellWidth: 32, font: "courier" },
      6: { halign: "right", cellWidth: 42, font: "courier" },
    },
    didParseCell: (data) => {
      // Bold item name in body
      if (data.section === "body" && data.column.index === 1) {
        data.cell.styles.fontStyle = "bold";
      }
      // Force courier + right-align on ALL numeric columns (2-6) in EVERY section
      // headStyles overrides columnStyles halign, so we must force it here
      if (data.column.index >= 2) {
        data.cell.styles.font = "courier";
        data.cell.styles.halign = "right";
      }
      // TOTALS row - top separator, light background
      if (data.section === "foot" && data.row.index === 0) {
        data.cell.styles.fillColor = [248, 248, 250];
        data.cell.styles.lineWidth = { top: 1.2, right: 0, bottom: 0, left: 0 };
        data.cell.styles.lineColor = [200, 200, 200];
        data.cell.styles.textColor = [30, 30, 30];
      }
      // Freight row - orange, warm tint
      if (data.section === "foot" && data.row.index === 1) {
        data.cell.styles.textColor = [217, 119, 6];
        data.cell.styles.fillColor = [255, 251, 245];
        data.cell.styles.fontStyle = "normal";
        data.cell.styles.lineWidth = 0;
      }
      // Total Expense row - subtle blue tint, strong text
      if (data.section === "foot" && data.row.index === 2) {
        data.cell.styles.fillColor = [241, 245, 255];
        data.cell.styles.lineWidth = {
          top: 0.8,
          right: 0,
          bottom: 0.8,
          left: 0,
        };
        data.cell.styles.lineColor = [210, 220, 240];
        data.cell.styles.fontStyle = "bold";
        if (data.column.index === 6) {
          data.cell.styles.fontSize = 11;
          data.cell.styles.textColor = [37, 99, 235];
        } else if (data.column.index === 1) {
          data.cell.styles.fontSize = 9;
          data.cell.styles.textColor = [50, 50, 50];
        } else {
          data.cell.styles.textColor = [50, 50, 50];
        }
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  // Grand total section - Clean styling
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL:", margin, y);

  doc.setFontSize(17);
  doc.setTextColor(37, 99, 235);
  doc.setFont("helvetica", "bold");
  doc.text(formatUSD(computed.grandTotalUSD), pageWidth - margin, y, {
    align: "right",
  });

  y += 10;

  // Footer - Professional styling
  const footerY = pageHeight - 15;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "normal");
  doc.text("Generated by ContainerShare", margin, footerY);
  doc.text(
    new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    pageWidth - margin,
    footerY,
    { align: "right" },
  );

  // Save
  const filename = `${sanitiseFilename(session.name)}_${sanitiseFilename(owner.name)}_${session.date}.pdf`;
  doc.save(filename);
}

// ─── Audit Report PDF ─────────────────────────────────────────────────────────

export function generateAuditReportPDF(session: Session): void {
  const doc = new jsPDF("landscape", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const sessionComputed = computeSession(session);

  // ── Page 1: Cover + Audit Summary ──────────────────────────────────────────

  let y = margin;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(...BRAND);
  doc.text("ContainerShare", margin, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(...MID_GRAY);
  doc.text("Full Audit Report", margin, y + 16);
  y += 24;

  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Session details
  doc.setFontSize(14);
  doc.setTextColor(...BLACK);
  doc.text(session.name, margin, y);
  doc.setFontSize(10);
  doc.setTextColor(...MID_GRAY);
  doc.text(formatDate(session.date), pageWidth - margin, y, { align: "right" });
  y += 10;

  // Constants
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "FD");
  doc.setFontSize(9);
  doc.setTextColor(...DARK_GRAY);
  const col1 = margin + 5;
  const col2 = margin + contentWidth / 2 + 5;
  doc.text(
    `Total Freight: ${formatUSD(session.constants.freightUSD)}`,
    col1,
    y + 9,
  );
  doc.text(
    `Container Invoice CBM: ${formatCBM(session.constants.containerCBM)}`,
    col1,
    y + 17,
  );
  doc.text(
    `Total Loaded: ${formatCBM(sessionComputed.sumOwnerCBM)}`,
    col2,
    y + 17,
  );

  const utilisation =
    session.constants.containerCBM > 0
      ? (sessionComputed.sumOwnerCBM / session.constants.containerCBM) * 100
      : 0;
  doc.text(
    `Container Utilisation: ${formatPercent(utilisation)}`,
    col1,
    y + 25,
  );
  doc.text(
    `Unassigned: ${formatCBM(sessionComputed.unassignedCBM)}`,
    col2,
    y + 25,
  );
  y += 43;

  // Freight audit
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "FD");
  doc.setFontSize(8);
  doc.setTextColor(...MID_GRAY);
  doc.text("FREIGHT AUDIT", col1, y + 7);
  doc.setFontSize(9);
  doc.setTextColor(...DARK_GRAY);
  doc.text(
    `Freight Input: ${formatUSD(session.constants.freightUSD)}`,
    col1,
    y + 15,
  );
  doc.text(
    `Freight Distributed: ${formatUSD(sessionComputed.sumOwnerFreightUSD)}`,
    col2,
    y + 15,
  );
  doc.setTextColor(22, 163, 74);
  doc.text(
    `Variance: ${formatUSD(Math.abs(session.constants.freightUSD - sessionComputed.sumOwnerFreightUSD))} ✓`,
    col1,
    y + 23,
  );
  if (sessionComputed.freightRoundingAdjustmentUSD !== 0) {
    doc.setTextColor(...WARNING);
    doc.text(
      `Rounding adj: ${formatUSD(Math.abs(sessionComputed.freightRoundingAdjustmentUSD))} on last owner`,
      col2,
      y + 23,
    );
  }
  y += 36;

  // Master summary table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [
      [
        "Owner",
        "Ctns",
        "CBM",
        "CBM %",
        "Goods ($)",
        "Freight ($)",
        "Grand Total ($)",
        "Status",
      ],
    ],
    body: session.owners.map((owner) => {
      const oc = computeOwner(owner, session);
      return [
        owner.name,
        oc.totalCartons.toString(),
        oc.totalCBM.toFixed(4),
        formatPercent(oc.cbmPercent),
        formatUSD(oc.totalGoodsUSD),
        formatUSD(oc.freightShareUSD),
        formatUSD(oc.grandTotalUSD),
        owner.status === "FINALISED" ? "✓ Finalised" : "Draft",
      ];
    }),
    foot: [
      [
        "TOTALS",
        sessionComputed.sumOwnerCartons.toString(),
        sessionComputed.sumOwnerCBM.toFixed(4),
        "100%",
        formatUSD(sessionComputed.sumOwnerGoodsUSD),
        formatUSD(sessionComputed.sumOwnerFreightUSD),
        formatUSD(sessionComputed.sumOwnerGrandTotalUSD),
        "",
      ],
    ],
    theme: "plain",
    styles: {
      fillColor: WHITE,
      textColor: BLACK,
      fontSize: 9,
      cellPadding: 3,
      lineColor: LIGHT_GRAY,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: DARK_GRAY,
      fontSize: 8,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [240, 249, 255],
      textColor: BLACK,
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "right", font: "courier" },
      2: { halign: "right", font: "courier" },
      3: { halign: "right", font: "courier" },
      4: { halign: "right", font: "courier" },
      5: { halign: "right", font: "courier" },
      6: { halign: "right", font: "courier" },
    },
  });

  // ── Pages 2+: One per owner ────────────────────────────────────────────────

  session.owners.forEach((owner) => {
    doc.addPage("a4", "landscape");

    let oy = margin;

    doc.setFontSize(14);
    doc.setTextColor(...BLACK);
    doc.text(`Owner: ${owner.name}`, margin, oy + 6);
    doc.setFontSize(9);
    doc.setTextColor(...MID_GRAY);
    doc.text(
      `${session.name} · ${formatDate(session.date)}`,
      pageWidth - margin,
      oy + 6,
      { align: "right" },
    );
    oy += 14;

    const items = owner.items.map(computeItem);
    const oc = computeOwner(owner, session);

    autoTable(doc, {
      startY: oy,
      margin: { left: margin, right: margin },
      head: [
        [
          "#",
          "Item No",
          "Ctns",
          "CBM/Ctn",
          "Tot. CBM",
          "Price/Ctn ($)",
          "Tot. Price ($)",
        ],
      ],
      body: items.map((item, idx) => [
        (idx + 1).toString(),
        item.itemNo,
        item.cartons.toString(),
        item.cbmPerCarton.toFixed(4),
        item.totalCBM.toFixed(4),
        formatUSD(item.pricePerCartonUSD),
        formatUSD(item.totalUSD),
      ]),
      foot: [
        [
          "",
          "TOTALS",
          oc.totalCartons.toString(),
          "",
          oc.totalCBM.toFixed(4),
          "",
          formatUSD(oc.totalGoodsUSD),
        ],
      ],
      theme: "plain",
      styles: {
        fillColor: WHITE,
        textColor: BLACK,
        fontSize: 9,
        cellPadding: 3,
        lineColor: LIGHT_GRAY,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: DARK_GRAY,
        fontSize: 8,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [240, 249, 255],
        textColor: BLACK,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        2: { halign: "right", font: "courier" },
        3: { halign: "right", font: "courier" },
        4: { halign: "right", font: "courier" },
        5: { halign: "right", font: "courier" },
        6: { halign: "right", font: "courier" },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oy = (doc as any).lastAutoTable.finalY + 8;

    // Freight + Grand total
    // Use Container Invoice CBM as basis
    const basisCBM = sessionComputed.basisCBM;

    doc.setDrawColor(...LIGHT_GRAY);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, oy, contentWidth, 30, 3, 3, "FD");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_GRAY);
    doc.text(
      `Freight: ${formatUSD(session.constants.freightUSD)} × (${oc.totalCBM.toFixed(4)} ÷ ${basisCBM.toFixed(4)}) = ${formatUSD(oc.freightShareUSD)}`,
      margin + 5,
      oy + 9,
    );
    doc.text(
      `Goods: ${formatUSD(oc.totalGoodsUSD)}  |  Freight: ${formatUSD(oc.freightShareUSD)}`,
      margin + 5,
      oy + 18,
    );
    doc.setFontSize(12);
    doc.setTextColor(...BRAND);
    doc.text(
      `GRAND TOTAL: ${formatUSD(oc.grandTotalUSD)}`,
      pageWidth - margin - 5,
      oy + 25,
      { align: "right" },
    );

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated by ContainerShare · ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 10,
    );
  });

  // Footer on page 1
  doc.setPage(1);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated by ContainerShare · ${new Date().toLocaleString()}`,
    margin,
    pageHeight - 10,
  );

  // Save
  const filename = `${sanitiseFilename(session.name)}_AUDIT-REPORT_${session.date}.pdf`;
  doc.save(filename);
}
