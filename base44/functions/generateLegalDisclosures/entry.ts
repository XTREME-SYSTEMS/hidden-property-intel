import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Generates Florida-mandated real estate disclosure forms.
 * - Seller Property Disclosure (Fla. Stat. §689.26)
 * - Lead-Based Paint Disclosure (42 U.S.C. §4852d, pre-1978 properties)
 * - Radon Gas Disclosure (Fla. Stat. §404.056)
 * - HOA/Condo Disclosure (Fla. Stat. §720.401 / §718.503)
 * - Mold Disclosure (industry standard)
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { property_id, disclosure_types, seller_name, buyer_name, property_address, year_built, has_hoa } = body;

    let property = null;
    if (property_id) {
      const props = await base44.asServiceRole.entities.Property.filter({ id: property_id });
      property = props[0];
    }

    const addr = property_address || (property ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code}` : '_______________________');
    const yrBuilt = year_built || property?.year_built;
    const hoa = has_hoa ?? false;
    const sName = seller_name || '_______________________';
    const bName = buyer_name || '_______________________';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const allTypes = !disclosure_types || disclosure_types.includes('all');
    const disclosures = {};

    if (allTypes || disclosure_types.includes('seller_property')) {
      disclosures.seller_property = `FLORIDA SELLER'S REAL PROPERTY DISCLOSURE
(Section 689.26, Florida Statutes)

Property Address: ${addr}
Date: ${date}

Seller: ${sName}
Buyer: ${bName}

The Seller hereby discloses the following information about the property
to the best of Seller's knowledge and belief as of the date above.

SECTION 1 — STRUCTURAL & SYSTEMS
1. Roof: Age ___ years. Any known leaks or repairs? [ ] Yes [ ] No [ ] Unknown
2. Foundation: Any known cracks, settlement, or water intrusion? [ ] Yes [ ] No [ ] Unknown
3. Plumbing: Any known leaks, low pressure, or polybutylene pipes? [ ] Yes [ ] No [ ] Unknown
4. Electrical: Any known issues, aluminum wiring, or ungrounded outlets? [ ] Yes [ ] No [ ] Unknown
5. HVAC: Age ___ years. Any known issues? [ ] Yes [ ] No [ ] Unknown
6. Water Heater: Age ___ years. [ ] Gas [ ] Electric

SECTION 2 — ENVIRONMENTAL & SAFETY
7. Any known termite/pest infestation or damage? [ ] Yes [ ] No [ ] Unknown
8. Any known mold or water damage? [ ] Yes [ ] No [ ] Unknown
9. Any known radon gas? [ ] Yes [ ] No [ ] Unknown
10. Any known lead-based paint? [ ] Yes [ ] No [ ] Unknown [ ] N/A (post-1978)
11. Any known Chinese drywall? [ ] Yes [ ] No [ ] Unknown
12. Is the property in a flood zone? [ ] Yes [ ] No [ ] Unknown

SECTION 3 — TITLE & LEGAL
13. Any known liens, encumbrances, or judgments? [ ] Yes [ ] No [ ] Unknown
14. Any known code violations or open permits? [ ] Yes [ ] No [ ] Unknown
15. Any known boundary disputes or encroachments? [ ] Yes [ ] No [ ] Unknown
16. Is the property subject to a homeowners association? [ ] Yes [ ] No [ ] Unknown

SECTION 4 — ADDITIONAL DISCLOSURES
17. Any known deaths on the property within the last 3 years? [ ] Yes [ ] No
18. Any known structural modifications without permits? [ ] Yes [ ] No [ ] Unknown
19. Any other material defects not listed above? [ ] Yes [ ] No

Seller certifies that the information above is true and correct to the best
of Seller's knowledge. Buyer acknowledges receipt of this disclosure.

Seller Signature: ______________________ Date: __________
Buyer Signature: ______________________ Date: __________`;
    }

    if ((allTypes || disclosure_types.includes('lead_paint')) && (!yrBuilt || yrBuilt < 1978)) {
      disclosures.lead_paint = `LEAD-BASED PAINT DISCLOSURE
(Title X, 42 U.S.C. §4852d — Required for properties built before 1978)

Property Address: ${addr}
Year Built: ${yrBuilt || 'Pre-1978'}
Date: ${date}

SELLER'S DISCLOSURE
(a) Presence of lead-based paint: I [ ] have [ ] have no knowledge of lead-based paint
    and/or lead-based paint hazards in the housing.

(b) Records and reports: I [ ] have [ ] have not provided the buyer with all available
    records and reports pertaining to lead-based paint and hazards.

BUYER'S ACKNOWLEDGMENT
(c) I have received copies of all available records and reports pertaining to
    lead-based paint and hazards in the housing.
(d) I [ ] have [ ] have not received a copy of the EPA pamphlet "Protect Your Family
    from Lead in Your Home."
(e) I [ ] have [ ] have not been given a 10-day opportunity to conduct a risk
    assessment or inspection for lead-based paint hazards.

AGENT'S ACKNOWLEDGMENT
(f) I am aware of my responsibility to ensure compliance with the lead-based paint
    disclosure requirements.

Seller: ${sName}  Signature: ____________ Date: ______
Buyer: ${bName}   Signature: ____________ Date: ______
Agent:             Signature: ____________ Date: ______`;
    }

    if (allTypes || disclosure_types.includes('radon')) {
      disclosures.radon = `RADON GAS DISCLOSURE
(Section 404.056(5), Florida Statutes)

Property Address: ${addr}
Date: ${date}

RADON NOTICE
"Radon is a naturally occurring radioactive gas that, when it has accumulated
in a building in sufficient quantities, can present health risks to residents
and occupants of the building. Elevated levels of radon have been found in
buildings in Florida. Additional information regarding radon and radon testing
may be obtained from your county health department."

Seller acknowledges that this disclosure has been provided to the Buyer.

Seller: ${sName}  Signature: ____________ Date: ______
Buyer: ${bName}   Signature: ____________ Date: ______`;
    }

    if ((allTypes || disclosure_types.includes('hoa')) && hoa) {
      disclosures.hoa = `HOMEOWNERS ASSOCIATION DISCLOSURE
(Section 720.401, Florida Statutes)

Property Address: ${addr}
Date: ${date}

SELLER'S DISCLOSURE
The property is located within a community association. The following
information is provided per Florida Statutes §720.401:

1. Association Name: _________________________
2. Monthly Assessment: $_______
3. Special Assessments (pending/approved): [ ] Yes [ ] No  Amount: $_______
4. Transfer Fees: $_______
5. Capital Reserve Study Available: [ ] Yes [ ] No
6. Pending Litigation Against Association: [ ] Yes [ ] No

BUYER'S RIGHTS
- Buyer has the right to cancel the contract within 3 business days after
  receiving the association documents (Fla. Stat. §720.401(4)).
- Buyer should review the association's declaration, bylaws, rules,
  and financial documents before completing the purchase.

Seller: ${sName}  Signature: ____________ Date: ______
Buyer: ${bName}   Signature: ____________ Date: ______`;
    }

    if (allTypes || disclosure_types.includes('mold')) {
      disclosures.mold = `MOLD DISCLOSURE NOTICE

Property Address: ${addr}
Date: ${date}

Mold is a type of fungus that can grow indoors and outdoors. Exposure to
mold can cause health effects including allergic reactions, asthma, and
other respiratory complaints.

SELLER'S DISCLOSURE
To the best of Seller's knowledge:
1. Any known mold growth or water intrusion? [ ] Yes [ ] No [ ] Unknown
2. Any known water damage or flooding? [ ] Yes [ ] No [ ] Unknown
3. Any mold testing or remediation performed? [ ] Yes [ ] No [ ] Unknown

Buyer is encouraged to obtain a professional mold inspection.

Seller: ${sName}  Signature: ____________ Date: ______
Buyer: ${bName}   Signature: ____________ Date: ______`;
    }

    return Response.json({
      disclosures,
      property_address: addr,
      year_built: yrBuilt,
      generated_at: date,
    });
  } catch (error) {
    console.error('generateLegalDisclosures error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}