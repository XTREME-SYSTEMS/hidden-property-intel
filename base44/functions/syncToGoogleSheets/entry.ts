import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Syncs active property listings to a Google Sheet for external review.
 * Uses the SHARED Google Sheets connector (builder's account).
 * Creates a new spreadsheet on first run, or updates an existing one if spreadsheet_id is passed.
 */

const HEADERS = [
  "Address", "City", "State", "ZIP", "Property Type", "Distress Type", "Status",
  "Estimated Value", "Asking Price", "Score", "Beds", "Baths", "Sq Ft",
  "Year Built", "Days on Market", "Source URL", "Created Date"
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    // Get the Google Sheets OAuth token (SHARED connector)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all active properties
    const properties = await base44.asServiceRole.entities.Property.filter(
      { status: 'active' },
      '-created_date',
      500
    );

    if (!properties.length) {
      return Response.json({ error: 'No active properties to sync' }, { status: 400 });
    }

    // Build the rows: headers + one row per property
    const rows = [HEADERS];
    for (const p of properties) {
      rows.push([
        p.address || '',
        p.city || '',
        p.state || '',
        p.zip_code || '',
        p.property_type || '',
        p.distress_type || '',
        p.status || '',
        p.estimated_value?.toString() || '',
        p.proposed_asking_price?.toString() || '',
        p.property_score?.toString() || '',
        p.bedrooms?.toString() || '',
        p.bathrooms?.toString() || '',
        p.square_footage?.toString() || '',
        p.year_built?.toString() || '',
        p.days_on_market?.toString() || '',
        p.source_url || '',
        p.created_date ? new Date(p.created_date).toISOString().split('T')[0] : ''
      ]);
    }

    // Parse optional spreadsheet_id from request body
    let body = {};
    try { body = await req.json(); } catch (e) {}
    const existingId = body.spreadsheet_id;

    let spreadsheetId = existingId;
    let spreadsheetTitle = '';
    let spreadsheetUrl = '';

    if (existingId) {
      // Update existing spreadsheet — clear old data and write new
      // First clear the sheet
      const clearRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${existingId}/values/Sheet1!A1:Q1000:clear`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      if (!clearRes.ok) {
        const err = await clearRes.json().catch(() => ({}));
        return Response.json({ error: `Failed to clear sheet: ${err.error?.message || clearRes.statusText}` }, { status: 500 });
      }
      spreadsheetTitle = 'Existing sheet';
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${existingId}/edit`;
    } else {
      // Create a new spreadsheet
      const dateStr = new Date().toISOString().split('T')[0];
      spreadsheetTitle = `Hidden Property Intel — Active Listings (${dateStr})`;
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title: spreadsheetTitle, locale: 'en_US' },
          sheets: [{ properties: { sheetType: 'GRID', title: 'Sheet1', gridProperties: { rowCount: rows.length + 10, columnCount: HEADERS.length } } }]
        })
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        return Response.json({ error: `Failed to create spreadsheet: ${createJson.error?.message || createRes.statusText}` }, { status: 500 });
      }
      spreadsheetId = createJson.spreadsheetId;
      spreadsheetUrl = createJson.spreadsheetUrl;
    }

    // Write all rows in a single batch update
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Q${rows.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows })
      }
    );
    const writeJson = await writeRes.json().catch(() => ({}));
    if (!writeRes.ok) {
      return Response.json({ error: `Failed to write data: ${writeJson.error?.message || writeRes.statusText}` }, { status: 500 });
    }

    // Format header row (bold + freeze)
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount'
            }
          },
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.95, green: 0.93, blue: 0.88 }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          }
        ]
      })
    }).catch(() => {}); // non-critical formatting

    return Response.json({
      rows_synced: properties.length,
      spreadsheet_id: spreadsheetId,
      spreadsheet_title: spreadsheetTitle,
      spreadsheet_url: spreadsheetUrl
    });
  } catch (error) {
    console.error('syncToGoogleSheets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}