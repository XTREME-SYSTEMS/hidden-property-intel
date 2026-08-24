/**
 * Deal-alert matching engine.
 * Matches a property against all investor SavedSearch records and creates
 * DealAlert records (+ sends email when the investor opted in via AlertPreference).
 */

function eq(a, b) {
  if (a == null || b == null) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

export function matchesFilters(property, filters) {
  if (!filters || typeof filters !== 'object') return true;
  const f = filters;
  if (f.state && !eq(property.state, f.state)) return false;
  if (f.city && !eq(property.city, f.city)) return false;
  if (f.distress_type && property.distress_type !== f.distress_type) return false;
  if (f.property_type && property.property_type !== f.property_type) return false;
  if (f.min_price != null && (property.estimated_value || 0) < Number(f.min_price)) return false;
  if (f.max_price != null && (property.estimated_value || 0) > Number(f.max_price)) return false;
  if (f.min_score != null && (property.property_score || 0) < Number(f.min_score)) return false;
  return true;
}

export async function matchPropertyToAlerts(base44, property) {
  if (!property || !property.id) return { matched: 0 };
  const searches = await base44.asServiceRole.entities.SavedSearch.filter({});
  let matched = 0;
  for (const s of searches) {
    if (!s.user_id) continue;
    if (!matchesFilters(property, s.filters)) continue;

    // Dedupe: skip if an alert for this property+user+type already exists.
    const existing = await base44.asServiceRole.entities.DealAlert.filter({
      user_id: s.user_id, property_id: property.id, alert_type: 'new_match'
    });
    if (existing && existing.length) continue;

    const title = `New match: ${property.city || ''}, ${property.state || ''}`.trim();
    const message = `A new ${property.distress_type || 'distressed'} property matched your saved search "${s.name}".` +
      ` Estimated value $${Number(property.estimated_value || 0).toLocaleString()}.`;

    await base44.asServiceRole.entities.DealAlert.create({
      user_id: s.user_id,
      property_id: property.id,
      alert_type: 'new_match',
      title,
      message,
      read: false,
      metadata: { search_id: s.id, score: property.property_score || null }
    });
    matched++;

    // Email notification if opted in (default on).
    let pref;
    try {
      pref = (await base44.asServiceRole.entities.AlertPreference.filter({ user_id: s.user_id }))[0];
    } catch (e) { pref = null; }
    const emailOn = !pref || pref.email_alerts !== false;
    if (emailOn) {
      try {
        const u = await base44.asServiceRole.entities.User.get(s.user_id);
        if (u && u.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            subject: title,
            body: `${message}\n\nView property: /properties/${property.id}\n\n— Hidden Property Intel`
          });
        }
      } catch (e) {
        console.error('alert email failed', s.user_id, e?.message);
      }
    }
  }
  return { matched };
}