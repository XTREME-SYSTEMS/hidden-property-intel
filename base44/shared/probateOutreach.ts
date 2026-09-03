/**
 * Probate outreach — personalized email templates for contacting heirs of deceased homeowners.
 *
 * These templates are specifically crafted for the sensitive nature of reaching out to someone
 * who has recently inherited a property through a family member's passing. They are empathetic,
 * professional, and respectful of the grieving process while clearly communicating value.
 */

const BROKER = {
  name: 'Steve Giordano',
  title: 'Licensed Real Estate Broker',
  company: 'Giordano Customs',
  phone: '772-812-3930',
  address: '951 SW Country Club Dr, Suite 102, Port St. Lucie, FL',
};

const SITE = 'https://my-property-intel.base44.app';
const POST = `${SITE}/seller/post-property`;

export function probateHeirSubject(heir, property, deceasedName) {
  const addr = property ? `${property.address}, ${property.city}` : 'an inherited property';
  return `Regarding the property at ${addr} — our condolences and a potential offer`;
}

export function probateHeirBody(heir, property, deceasedName) {
  const name = heir.name || 'there';
  const relationship = heir.relationship_to_property || 'heir';
  const addr = property
    ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`
    : 'the inherited property';
  const deceasedRef = deceasedName ? ` ${deceasedName}` : '';

  return `Dear ${name},

I hope this message finds you surrounded by support during this difficult time. My name is Steve Giordano, and I'm a licensed Florida real estate broker with Giordano Customs. I'm reaching out because public records indicate that you may be connected to the estate of${deceasedRef}, and that the property at ${addr} may be part of the estate.

First, please accept my sincere condolences for your loss. Losing a loved one is never easy, and managing their estate — especially a property — can feel overwhelming.

If the property is something you'd like to sell, I'd like to help. Here's what we can offer:

  • A fair cash offer within 48 hours — no appraisals, no financing contingencies.
  • We cover all closing costs — you pay zero commissions or fees.
  • We can close on your timeline — whether that's 7 days or 3 months.
  • We handle the property as-is — no repairs, no clean-out, no staging required.
  • Our AI negotiation assistant ensures you get a transparent, fair evaluation.

If the property is still in probate, we can work with the estate's executor or personal representative to facilitate the sale once the court grants authority. We've helped many families through this process and understand the legal requirements.

If you're not ready to sell, that's completely understandable. I'm happy to provide a free property valuation and answer any questions about the probate real estate process — with no obligation whatsoever.

You can list the property free on our platform anytime:
${POST}

Or call me directly at ${BROKER.phone} — I'm available to talk through your options at no cost or pressure.

Warm regards,
Steve Giordano
${BROKER.title} · ${BROKER.company}
${BROKER.phone}
${BROKER.address}

---
You received this email because public records indicated you may be connected to the estate of a property in ${property?.city || 'Florida'}. We sincerely apologize if this reached you at a difficult time. To stop receiving these emails, reply with "unsubscribe" and we'll remove you immediately.`;
}

/**
 * Send probate outreach emails to heirs with contact info.
 * Only contacts heirs who haven't been contacted yet and have email or phone.
 */
export async function emailProbateHeirs(base44, limit = 30) {
  // Find all probate properties
  const probateProperties = await base44.asServiceRole.entities.Property.filter({
    distress_type: 'probate_inherited',
    status: 'draft'
  }, '-created_date', 100);

  let sent = 0;
  let skipped = 0;

  for (const property of probateProperties) {
    if (sent >= limit) break;

    // Get heirs for this property
    const owners = await base44.asServiceRole.entities.Owner.filter({
      property_id: property.id,
      owner_type: 'potential_heir'
    });

    // Get the deceased owner's name
    const deceasedOwner = owners.find(o => o.owner_type === 'previous' && o.relationship_to_property === 'deceased owner');
    const deceasedName = deceasedOwner?.name || '';

    for (const heir of owners) {
      if (sent >= limit) break;
      if (!heir.contact_email) continue;
      if (heir.outreach_status && heir.outreach_status !== 'new') { skipped++; continue; }

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: heir.contact_email,
          from_name: 'Hidden Property Intel',
          subject: probateHeirSubject(heir, property, deceasedName),
          body: probateHeirBody(heir, property, deceasedName)
        });

        await base44.asServiceRole.entities.Owner.update(heir.id, {
          outreach_status: 'contacted',
          contacted_at: new Date().toISOString(),
          last_outreach_subject: probateHeirSubject(heir, property, deceasedName),
          last_outreach_body: probateHeirBody(heir, property, deceasedName)
        });
        sent++;
      } catch (e) {
        console.error('probate email failed', heir.contact_email, e?.message);
      }
    }
  }

  return { sent, skipped, properties_scanned: probateProperties.length };
}