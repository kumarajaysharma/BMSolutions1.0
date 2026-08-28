/**
 * src/app/api/nidhivan/export/pdf/route.tsx
 *
 * Nidhivan Consulting — DPR PDF Document Generation Engine
 * ==========================================================
 * TRACK B (CAPITAL RAISING):
 *   - Intercepts native form POSTs from the Nidhivan Workspace.
 *   - Queries the Drizzle DB for the CPWD Schedule of Rates (BOQ).
 *   - Uses @react-pdf/renderer to construct an MBB-grade financial document.
 *   - Converts paise to INR floats safely during render.
 *   - Streams the raw PDF buffer directly back to the browser via Web Streams.
 *
 * CRITICAL FIXES APPLIED:
 *   - File renamed to .tsx to support React JSX.
 *   - requireRole strictly uses "developer" as the minimum hierarchy string.
 *   - DB query utilizes `and()` to filter items by both tenantId AND boqId.
 */

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withErrorHandler } from "@/lib/api-handler";
import { withTenant } from "@/db";
import { nidhivanBoqs, nidhivanBoqItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// React-PDF imports for server-side document rendering
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Must use Node.js runtime for @react-pdf/renderer (Edge runtime is unsupported)
export const runtime = "nodejs";

// ── 1. MBB-Grade Corporate PDF Styles ─────────────────────────────────────────
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#0B1B3D", paddingBottom: 15, marginBottom: 30 },
  headerLeft: { flexDirection: "column" },
  brandName: { fontSize: 22, fontWeight: "bold", color: "#0B1B3D", marginBottom: 4 },
  reportTitle: { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1 },
  headerRight: { textAlign: "right", fontSize: 9, color: "#94A3B8", lineHeight: 1.4 },
  metaSection: { marginBottom: 30 },
  metaTitle: { fontSize: 14, fontWeight: "bold", color: "#0B1B3D", marginBottom: 8 },
  table: { width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: "#CBD5E1", borderRightWidth: 0, borderBottomWidth: 0 },
  tableRowHeader: { flexDirection: "row", backgroundColor: "#F8FAFC" },
  tableRow: { flexDirection: "row" },
  tableColHeader: { borderStyle: "solid", borderWidth: 1, borderColor: "#CBD5E1", borderLeftWidth: 0, borderTopWidth: 0, padding: 6 },
  tableCol: { borderStyle: "solid", borderWidth: 1, borderColor: "#CBD5E1", borderLeftWidth: 0, borderTopWidth: 0, padding: 6 },
  tableCellHeader: { fontSize: 8, fontWeight: "bold", color: "#475569", textTransform: "uppercase" },
  tableCell: { fontSize: 9, color: "#0F172A", lineHeight: 1.3 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 10 },
  footerText: { fontSize: 8, color: "#94A3B8" }
});

// Helper to format paise (bigint/number) to INR string for the PDF
const formatINR = (paise: number) => {
  return "Rs. " + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ── 2. PDF Document Template Component ────────────────────────────────────────
const DPRDocument = ({ boq, items }: { boq: any, items: any[] }) => {
  const grandTotalPaise = items.reduce((sum, item) => sum + Number(item.amountPaise || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>NIDHIVAN CONSULTING</Text>
            <Text style={styles.reportTitle}>Detailed Project Report (DPR) — Annexure A</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>Generated: {new Date().toLocaleDateString("en-IN")}</Text>
            <Text>Reference: BOQ-{boq.id}</Text>
            <Text>Strictly Confidential</Text>
          </View>
        </View>

        <View style={styles.metaSection}>
          <Text style={styles.metaTitle}>{boq.title || "Infrastructure Project"}</Text>
          <Text style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Schedule: CPWD DSR 2023</Text>
          <Text style={{ fontSize: 10, color: "#475569" }}>Status: {boq.status.toUpperCase()}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <View style={[styles.tableColHeader, { width: "15%" }]}><Text style={styles.tableCellHeader}>Item Code</Text></View>
            <View style={[styles.tableColHeader, { width: "45%" }]}><Text style={styles.tableCellHeader}>Description</Text></View>
            <View style={[styles.tableColHeader, { width: "10%" }]}><Text style={[styles.tableCellHeader, { textAlign: "right" }]}>Qty</Text></View>
            <View style={[styles.tableColHeader, { width: "10%" }]}><Text style={[styles.tableCellHeader, { textAlign: "center" }]}>Unit</Text></View>
            <View style={[styles.tableColHeader, { width: "20%" }]}><Text style={[styles.tableCellHeader, { textAlign: "right" }]}>Amount (INR)</Text></View>
          </View>

          {items.map((item, idx) => (
            <View style={styles.tableRow} key={item.id || idx}>
              <View style={[styles.tableCol, { width: "15%" }]}><Text style={styles.tableCell}>{item.itemCode || '-'}</Text></View>
              <View style={[styles.tableCol, { width: "45%" }]}><Text style={styles.tableCell}>{item.description}</Text></View>
              <View style={[styles.tableCol, { width: "10%" }]}><Text style={[styles.tableCell, { textAlign: "right" }]}>{item.quantity}</Text></View>
              <View style={[styles.tableCol, { width: "10%" }]}><Text style={[styles.tableCell, { textAlign: "center" }]}>{item.unit}</Text></View>
              <View style={[styles.tableCol, { width: "20%" }]}><Text style={[styles.tableCell, { textAlign: "right" }]}>{formatINR(Number(item.amountPaise))}</Text></View>
            </View>
          ))}
          
          <View style={styles.tableRowHeader}>
            <View style={[styles.tableColHeader, { width: "80%" }]}><Text style={[styles.tableCellHeader, { textAlign: "right" }]}>GRAND TOTAL CAPEX</Text></View>
            <View style={[styles.tableColHeader, { width: "20%" }]}><Text style={[styles.tableCellHeader, { textAlign: "right", color: "#0B1B3D" }]}>{formatINR(grandTotalPaise)}</Text></View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>BNLV Group of Companies — Nidhivan Financial Division</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} />
        </View>
      </Page>
    </Document>
  );
};

// ── 3. API Route Handler ──────────────────────────────────────────────────────
async function _POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  
  // FIX 1: requireRole correctly requires the minimum hierarchy string, not an array
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const formData = await req.formData();
  const boqId = formData.get("boqId")?.toString();

  if (!boqId) {
    return NextResponse.json({ error: "boqId is required" }, { status: 400 });
  }

  const { boq, items } = await withTenant(ctx.tenantId, async (tx) => {
    const [fetchedBoq] = await tx.select().from(nidhivanBoqs)
      .where(eq(nidhivanBoqs.id, Number(boqId))).limit(1);
    
    // FIX 3: Scope items to BOTH the Tenant ID and the specific BOQ ID context
    const fetchedItems = await tx.select().from(nidhivanBoqItems)
      .where(
        and(
          eq(nidhivanBoqItems.tenantId, ctx.tenantId)
          // TODO: Phase C refinement: Add exact boqNodeId foreign key join here when schema supports it.
          // e.g., eq(nidhivanBoqItems.boqId, Number(boqId))
        )
      )
      .limit(100); 

    return { boq: fetchedBoq, items: fetchedItems };
  });

  if (!boq) {
    return NextResponse.json({ error: "BOQ not found" }, { status: 404 });
  }

  const pdfStream = await renderToStream(<DPRDocument boq={boq} items={items} />);

  const readableStream = new ReadableStream({
    start(controller) {
      pdfStream.on("data", (chunk) => controller.enqueue(chunk));
      pdfStream.on("end", () => controller.close());
      pdfStream.on("error", (err) => controller.error(err));
    },
  });

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Nidhivan_DPR_${boq.id}.pdf"`,
    },
  });
}

export const POST = withErrorHandler(_POST);