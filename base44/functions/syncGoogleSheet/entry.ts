import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

/**
 * Two-way sync between a Google Sheet ("Active Listings") and the Property entity.
 *
 * Ownership model (avoids ping-pong conflicts):
 *  - SHEET owns the raw listing facts: address, city, state, zip, property_type,
 *    distress_type, status, beds, baths, sqft, year_built, source_url.
 *    Sheet → Base44 always wins for these.
 *  - BASE44 owns enrichment outputs: estimated_value, proposed_asking_price,
 *    property_score, days_on_market. Base44 → Sheet always wins for these
 *    (only written back when Base44 actually has a value).
 *  - On first import of a brand-new row, any enrichment values present in the
 *    sheet are accepted (initial fill); afterwards Base44 owns them.
 *
 * Matching key: normalized address (lowercased, trimmed, single-spaced).
 *
 * Auth: admin user, BASE44_SYNC_TOKEN, or a trusted Base44 workflow trigger.
 */

const DEFAULT_SHEET_ID = "1W_FAObJllQH_macT7sAL6CRn0aGTzRTn-lSw7g0jvjw";
const SHEET_NAME = "Sheet1";

const HEADER_MAP: Record<string, string> = {
  "Address": "address",
  "City": "city",
  "State": "state",
  "ZIP": "zip_code",
  "Property Type": "property_type",
  "Distress Type": "distress_type",
  "Status": "status",
  "Estimated Value": "estimated_value",
  "Asking Price": "proposed_asking_price",
  "Score": "property_score",
  "Beds": "bedrooms",
  "Baths": "bathrooms",
  "Sq Ft": "square_footage",
  "Year Built": "year_built",
  "Days on Market": "days_on_market",
  "Source URL": "source_url",
  "Created Date": "_created",
};

const SHEET_OWNED = new Set([
  "address", "city", "state", "zip_code", "property_type",
  "distress_type", "status", "bedrooms", "bathrooms",
  "square_footage", "year_built", "source_url",
]);
const B44_OWNED = ["estimated_value", "proposed_asking_price", "property_score", "days_on_market"];

const norm = (s: any) => (s == null ? "" : String(s).trim().toLowerCase().replace(/\s+/g, " "));
const num = (v: any) => {
  if (v == null || v === "") return undefined;
  const n = parseFloat(String(v).replace(/[$,]/g, ""));
  return isNaN(n) ? undefined : n;
};
const str = (v: any) => (v == null || v === "") ? undefined : String(v).trim();

const chunk = <T,>(arr: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole.entities;

    // Auth: sync token (cron) OR admin user OR trusted Base44 workflow trigger.
    const syncToken = secrets.get("BASE44_SYNC_TOKEN");
    let body: any = {};
    try { body = await req.json(); } catch (e) {}
    const isWorkflow = body.trigger_source === "workflow";
    if (!isWorkflow && (!syncToken || body.sync_token !== syncToken)) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const sheetId = body.spreadsheet_id || DEFAULT_SHEET_ID;
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");
    const auth = { Authorization: `Bearer ${accessToken}` };

    // 1. Read the whole sheet (header + all data rows)
    const range = `${SHEET_NAME}!A1:Z`;
    const vRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
      { headers: auth }
    );
    const vJson = await vRes.json().catch(() => ({}));
    if (!vRes.ok) {
      return Response.json({ error: `Sheet read failed: ${vJson.error?.message || vRes.statusText}` }, { status: 502 });
    }
    const rows: any[][] = vJson.values || [];
    if (rows.length < 2) {
      return Response.json({ sheet_to_b44: { created: 0, updated: 0 }, b44_to_sheet: { cells_written: 0 }, total_sheet_rows: 0, message: "Sheet has no data rows" });
    }

    // 2. Build column index from the actual header row (robust to reordering)
    const header = rows[0];
    const colIndex: Record<string, number> = {};
    header.forEach((h: string, i: number) => {
      const field = HEADER_MAP[String(h).trim()];
      if (field) colIndex[field] = i;
    });
    if (colIndex.address === undefined) {
      return Response.json({ error: "Sheet is missing an 'Address' column" }, { status: 400 });
    }
    const val = (r: any[], field: string) => (colIndex[field] === undefined ? undefined : r[colIndex[field]]);

    const dataRows = rows.slice(1).filter((r) => norm(val(r, "address")));

    // 3. Load existing properties into a map keyed by normalized address
    const allProps: any[] = await sr.Property.list("-created_date", 1000).catch(() => []);
    const propByAddr = new Map<string, any>();
    for (const p of allProps) propByAddr.set(norm(p.address), p);

    // 4. SHEET → BASE44 upsert
    const toCreate: any[] = [];
    const toUpdate: any[] = [];
    let created = 0, updated = 0;

    for (const r of dataRows) {
      const address = str(val(r, "address"));
      const key = norm(address);
      const sheetFacts: Record<string, any> = {
        address,
        city: str(val(r, "city")),
        state: str(val(r, "state")),
        zip_code: str(val(r, "zip_code")),
        property_type: str(val(r, "property_type")) || "residential",
        distress_type: str(val(r, "distress_type")),
        status: str(val(r, "status")) || "active",
        bedrooms: num(val(r, "bedrooms")),
        bathrooms: num(val(r, "bathrooms")),
        square_footage: num(val(r, "square_footage")),
        year_built: num(val(r, "year_built")),
        source_url: str(val(r, "source_url")),
        source: "scraped",
      };

      const existing = propByAddr.get(key);
      if (existing) {
        const patch: any = {};
        for (const f of SHEET_OWNED) {
          if (sheetFacts[f] !== undefined && sheetFacts[f] !== existing[f]) patch[f] = sheetFacts[f];
        }
        // initial fill of enrichment fields from sheet only when Base44 has none
        for (const f of B44_OWNED) {
          if (existing[f] === undefined) {
            const sv = num(val(r, f));
            if (sv !== undefined) patch[f] = sv;
          }
        }
        if (Object.keys(patch).length) {
          toUpdate.push({ id: existing.id, ...patch });
          updated++;
        }
      } else {
        const rec: any = { ...sheetFacts };
        for (const f of B44_OWNED) {
          const sv = num(val(r, f));
          if (sv !== undefined) rec[f] = sv;
        }
        toCreate.push(rec);
        created++;
      }
    }

    for (const c of chunk(toCreate, 500)) await sr.Property.bulkCreate(c);
    for (const c of chunk(toUpdate, 500)) await sr.Property.bulkUpdate(c);

    // 5. BASE44 → SHEET write-back (enrichment columns only)
    // Reload to capture freshly created records + any enrichment run since last sync.
    const fresh: any[] = await sr.Property.list("-created_date", 1000).catch(() => []);
    const propByAddrFresh = new Map<string, any>();
    for (const p of fresh) propByAddrFresh.set(norm(p.address), p);

    // sheet row number (1-based) for each address: dataRows[i] is sheet row i+2
    const rowByAddr = new Map<string, number>();
    dataRows.forEach((r, i) => {
      const key = norm(val(r, "address"));
      if (key) rowByAddr.set(key, i + 2);
    });

    const colLetter = (n: number) => {
      let s = "";
      n += 1;
      while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
      return s;
    };

    const writeData: { range: string; values: string[][] }[] = [];
    for (const p of fresh) {
      const key = norm(p.address);
      const rowNum = rowByAddr.get(key);
      if (!rowNum) continue; // property not present in sheet — skip (sheet is the row authority)
      for (const f of B44_OWNED) {
        if (p[f] === undefined || p[f] === null) continue;
        const ci = colIndex[f];
        if (ci === undefined) continue;
        writeData.push({
          range: `${SHEET_NAME}!${colLetter(ci)}${rowNum}`,
          values: [[String(p[f])]],
        });
      }
    }

    let cellsWritten = 0;
    if (writeData.length) {
      const wbRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate?valueInputOption=RAW`,
        {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({ data: writeData }),
        }
      );
      if (wbRes.ok) cellsWritten = writeData.length;
    }

    return Response.json({
      spreadsheet_id: sheetId,
      total_sheet_rows: dataRows.length,
      sheet_to_b44: { created, updated },
      b44_to_sheet: { cells_written: cellsWritten },
      sync_direction: "two-way",
    });
  } catch (error) {
    console.error("syncGoogleSheet error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}