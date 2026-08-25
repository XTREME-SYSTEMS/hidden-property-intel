import { base44 } from '@/api/base44Client';

const DISTRESS_LABELS = {
  'pre-foreclosure': 'Pre-Foreclosure',
  'foreclosure': 'Foreclosure',
  'probate_inherited': 'Inherited / Probate',
  'tax_delinquent': 'Tax Delinquent',
  'code_violation': 'Code Violation',
  'divorce': 'Divorce',
  'bankruptcy': 'Bankruptcy',
  'auction': 'Auction',
  'short_sale': 'Short Sale',
  'bank_owned': 'Bank Owned (REO)',
};

export const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

function mapProperty(p, score) {
  const img = p.images?.[0]?.url || `/property/house-${(Number(String(p.id).slice(-1)) || 1) % 6 + 1}.jpg`;
  const arv = score?.after_repair_value || p.estimated_value || 0;
  const repairs = score?.repair_cost_estimate || 0;
  const price = p.proposed_asking_price || p.estimated_value || 0;
  const equity = (p.estimated_value || arv) - price;
  const roi = score?.estimated_roi || (equity && price ? Math.round(equity / price * 100) : 0);
  return {
    id: p.id,
    _raw: p,
    address: p.address,
    city: p.city,
    state: p.state,
    zip: p.zip_code,
    price,
    arv,
    repairs,
    equity,
    roi,
    score: p.property_score || 0,
    distress: DISTRESS_LABELS[p.distress_type] || p.distress_type || 'Distressed',
    beds: p.bedrooms || 0,
    baths: p.bathrooms || 0,
    sqft: p.square_footage || 0,
    image: img,
    saved: false,
    bids: 0,
  };
}

async function fetchScores() {
  try {
    return await base44.entities.PropertyScore.list('-scored_at', 200);
  } catch { return []; }
}

export const backend = {
  mode: 'base44',

  async me() {
    try { return await base44.auth.me(); }
    catch { return { id: null, name: 'Guest', email: '', role: 'investor' }; }
  },

  async listProperties() {
    const [props, scores] = await Promise.all([
      base44.entities.Property.filter({ status: 'active' }, '-property_score', 100),
      fetchScores(),
    ]);
    const scoreMap = {};
    for (const s of scores) scoreMap[s.property_id] = s;
    return props.map(p => mapProperty(p, scoreMap[p.id]));
  },

  async getProperty(id) {
    const [p, scores] = await Promise.all([
      base44.entities.Property.get(id),
      fetchScores(),
    ]);
    const score = scores.find(s => s.property_id === id);
    return mapProperty(p, score);
  },

  async listOffers() {
    try {
      const me = await this.me();
      if (!me.id) return [];
      return base44.entities.Bid.filter({ investor_id: me.id }, '-created_date', 100);
    } catch { return []; }
  },

  async createOffer(data) {
    const me = await this.me();
    return base44.entities.Bid.create({
      property_id: data.property_id,
      investor_id: me?.id,
      investor_name: me?.full_name || me?.email,
      bid_amount: data.amount,
      bid_type: 'initial',
      status: 'active',
    });
  },

  async saveProperty(propertyId) {
    const me = await this.me();
    return base44.entities.Watchlist.create({ property_id: propertyId, user_id: me?.id });
  },

  async unsaveProperty(propertyId) {
    const me = await this.me();
    const items = await base44.entities.Watchlist.filter({ property_id: propertyId, user_id: me.id });
    if (items[0]) await base44.entities.Watchlist.delete(items[0].id);
  },

  async listSaved() {
    const me = await this.me();
    if (!me.id) return [];
    const items = await base44.entities.Watchlist.filter({ user_id: me.id }, '-created_date', 100);
    const props = await Promise.all(items.map(i => this.getProperty(i.property_id).catch(() => null)));
    return props.filter(Boolean);
  },

  async createAlert(data) {
    const me = await this.me();
    return base44.entities.DealAlert.create({
      user_id: me?.id,
      alert_type: 'new_match',
      title: data.name || 'Saved Search',
      message: JSON.stringify(data.criteria || {}),
    });
  },

  async listAlerts() {
    const me = await this.me();
    if (!me.id) return [];
    return base44.entities.DealAlert.filter({ user_id: me.id }, '-created_date', 100);
  },

  async listTransactions() {
    try {
      const me = await this.me();
      if (!me.id) return [];
      return base44.entities.SmartContract.filter({ investor_id: me.id }, '-updated_date', 100);
    } catch { return []; }
  },

  async listMessages() {
    try {
      const me = await this.me();
      if (!me.id) return [];
      return base44.entities.NegotiationThread.filter({ investor_id: me.id }, '-updated_date', 100);
    } catch { return []; }
  },

  async createListing(data) {
    return base44.entities.Property.create({
      ...data,
      status: 'draft',
      source: 'user_submitted',
    });
  },
};