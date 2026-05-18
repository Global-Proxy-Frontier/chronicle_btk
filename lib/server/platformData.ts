import fs from 'fs';
import path from 'path';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

export type CustomerRiskRow = {
  customer_id: string;
  full_name: string;
  nationality: string;
  residency_country: string;
  kyc_level: string;
  risk_score: number;
  risk_tier: RiskTier;
  transaction_count: number;
  cross_border_count: number;
  cash_count: number;
  incoming_total_try: number;
  outgoing_total_try: number;
  updated_at: string;
};

type DatasetRow = Record<string, string>;

type Dataset = {
  customers: DatasetRow[];
  accounts: DatasetRow[];
  summaries: DatasetRow[];
  transactions: DatasetRow[];
  txByCustomer: Map<string, DatasetRow[]>;
  customerById: Map<string, DatasetRow>;
  accountByCustomerId: Map<string, DatasetRow>;
  summaryByCustomerId: Map<string, DatasetRow>;
  loadedAt: string;
};

type PrecomputeData = {
  generated_at: string;
  total_customers: number;
  rows: CustomerRiskRow[];
  global: {
    risk_distribution: Array<{ name: RiskTier; count: number }>;
    top10: CustomerRiskRow[];
    currency: Array<{ name: string; count: number }>;
    channel: Array<{ name: string; count: number }>;
    category: Array<{ name: string; count: number }>;
    daily_volume: Array<{ date: string; count: number; amount_try: number }>;
    cross_border_ratio: number;
  };
};

type LiveCacheEntry = {
  customer_id: string;
  analysis: string;
  created_at: string;
  model: string;
};

type LiveCache = {
  updated_at: string;
  entries: Record<string, LiveCacheEntry>;
};

const DATASET_DIR = path.join(process.cwd(), 'data', 'gemini_flash_ready_v1');
const PRECOMPUTE_FILE = path.join(DATASET_DIR, 'precompute_1000.json');
const LIVE_CACHE_FILE = path.join(DATASET_DIR, 'live_demo_cache.json');

let datasetCache: Dataset | null = null;
let precomputeCache: PrecomputeData | null = null;

function parseCsvLine(line: string) {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  out.push(current);
  return out;
}

function parseCsvFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: DatasetRow = {};

    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = values[i] ?? '';
    }

    return row;
  });
}

function toInt(value: string | undefined) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function countBy(rows: DatasetRow[], key: string) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = row[key] || 'UNKNOWN';
    map.set(value, (map.get(value) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function countByTransactions(transactions: DatasetRow[], key: string, limit = 10) {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    const value = tx[key] || 'UNKNOWN';
    map.set(value, (map.get(value) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function buildCustomerDailyVolume(transactions: DatasetRow[], dayLimit = 30) {
  const map = new Map<string, { date: string; count: number; amount_try: number }>();

  for (const tx of transactions) {
    const date = (tx.transaction_datetime || '').slice(0, 10) || 'UNKNOWN';
    if (date === 'UNKNOWN') continue;

    const current = map.get(date) || { date, count: 0, amount_try: 0 };
    current.count += 1;
    current.amount_try += toInt(tx.amount_try);
    map.set(date, current);
  }

  return Array.from(map.values())
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-dayLimit);
}

function buildHourDistribution(transactions: DatasetRow[]) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    name: `${hour.toString().padStart(2, '0')}:00`,
    count: 0,
  }));

  for (const tx of transactions) {
    const dt = new Date(tx.transaction_datetime || '');
    if (Number.isNaN(dt.getTime())) continue;
    const hour = dt.getHours();
    buckets[hour].count += 1;
  }

  return buckets;
}

function buildWeekdayDistribution(transactions: DatasetRow[]) {
  const labels = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];
  const buckets = labels.map((name) => ({ name, count: 0 }));

  for (const tx of transactions) {
    const dt = new Date(tx.transaction_datetime || '');
    if (Number.isNaN(dt.getTime())) continue;

    const index = (dt.getDay() + 6) % 7;
    buckets[index].count += 1;
  }

  return buckets;
}

function buildAmountBands(transactions: DatasetRow[]) {
  const bands = [
    { name: '0-1K', min: 0, max: 1000, count: 0, total_amount: 0 },
    { name: '1K-5K', min: 1000, max: 5000, count: 0, total_amount: 0 },
    { name: '5K-20K', min: 5000, max: 20000, count: 0, total_amount: 0 },
    { name: '20K+', min: 20000, max: Number.POSITIVE_INFINITY, count: 0, total_amount: 0 },
  ];

  for (const tx of transactions) {
    const amount = toInt(tx.amount_try);
    const band = bands.find((row) => amount >= row.min && amount < row.max);
    if (!band) continue;
    band.count += 1;
    band.total_amount += amount;
  }

  return bands.map(({ name, count, total_amount }) => ({ name, count, total_amount }));
}

function buildTopRoutes(transactions: DatasetRow[], limit = 10) {
  const map = new Map<string, number>();

  for (const tx of transactions) {
    const route = `${tx.source_country || 'UNK'} -> ${tx.destination_country || 'UNK'}`;
    map.set(route, (map.get(route) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function buildCustomerSignals(transactions: DatasetRow[]) {
  const txCount = transactions.length;
  const amounts = transactions.map((tx) => toInt(tx.amount_try));
  const avgAmount = txCount === 0 ? 0 : Math.round(amounts.reduce((sum, amount) => sum + amount, 0) / txCount);
  const maxAmount = amounts.length === 0 ? 0 : Math.max(...amounts);

  const crossBorder = transactions.filter((tx) => (tx.is_cross_border || '0') === '1').length;
  const nightTx = transactions.filter((tx) => {
    const dt = new Date(tx.transaction_datetime || '');
    if (Number.isNaN(dt.getTime())) return false;
    const hour = dt.getHours();
    return hour < 6 || hour >= 23;
  }).length;

  const ipMap = new Map<string, number>();
  for (const tx of transactions) {
    const ip = tx.ip_address || 'UNKNOWN';
    ipMap.set(ip, (ipMap.get(ip) || 0) + 1);
  }

  const uniqueIpCount = ipMap.size;
  const singleUseIpCount = Array.from(ipMap.values()).filter((count) => count === 1).length;

  return {
    tx_count: txCount,
    cross_border_ratio: txCount === 0 ? 0 : Number(((crossBorder / txCount) * 100).toFixed(1)),
    night_tx_ratio: txCount === 0 ? 0 : Number(((nightTx / txCount) * 100).toFixed(1)),
    unique_ip_ratio: txCount === 0 ? 0 : Number(((uniqueIpCount / txCount) * 100).toFixed(1)),
    avg_amount_try: avgAmount,
    max_amount_try: maxAmount,
    unique_ip_count: uniqueIpCount,
    single_use_ip_count: singleUseIpCount,
  };
}

function buildCustomerAnalytics(transactions: DatasetRow[]) {
  return {
    daily_volume_30: buildCustomerDailyVolume(transactions, 30),
    hour_distribution: buildHourDistribution(transactions),
    weekday_distribution: buildWeekdayDistribution(transactions),
    channel_distribution: countByTransactions(transactions, 'channel', 8),
    category_distribution: countByTransactions(transactions, 'category', 8),
    top_routes: buildTopRoutes(transactions, 10),
    amount_bands: buildAmountBands(transactions),
    signals: buildCustomerSignals(transactions),
  };
}

function calcRiskScore(summary: DatasetRow, customer: DatasetRow) {
  const tx = toInt(summary.transaction_count);
  const crossBorder = toInt(summary.cross_border_count);
  const cashCount = toInt(summary.cash_count);
  const incoming = toInt(summary.incoming_total_try);
  const outgoing = toInt(summary.outgoing_total_try);

  const debt = toInt(customer.current_debt_try);
  const income = Math.max(1, toInt(customer.monthly_income_try));
  const debtIncomeRatio = debt / income;

  let score = 15;
  score += Math.min(25, Math.round((crossBorder / Math.max(1, tx)) * 100 * 0.5));
  score += Math.min(15, Math.round((cashCount / Math.max(1, tx)) * 100 * 0.4));
  score += Math.min(20, Math.round((outgoing / Math.max(1, incoming + outgoing)) * 100 * 0.2));
  score += Math.min(15, Math.round(debtIncomeRatio * 8));

  if ((customer.pep_flag || '0') === '1') score += 10;
  if ((customer.watchlist_flag || '0') === '1') score += 8;
  if ((customer.sanctions_flag || '0') === '1') score += 12;
  if ((customer.kyc_level || '').toUpperCase() === 'BASIC') score += 5;

  return Math.max(1, Math.min(99, score));
}

function getRiskTier(score: number): RiskTier {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function loadDataset(): Dataset {
  if (datasetCache) return datasetCache;

  const customers = parseCsvFile(path.join(DATASET_DIR, 'customers.csv'));
  const accounts = parseCsvFile(path.join(DATASET_DIR, 'accounts.csv'));
  const summaries = parseCsvFile(path.join(DATASET_DIR, 'customer_transaction_summary.csv'));

  const transactionFiles = fs.readdirSync(DATASET_DIR)
    .filter((name) => /^transactions(?:_part\d+)?\.csv$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const transactions = transactionFiles.flatMap((fileName) =>
    parseCsvFile(path.join(DATASET_DIR, fileName))
  );

  const txByCustomer = new Map<string, DatasetRow[]>();
  for (const tx of transactions) {
    const list = txByCustomer.get(tx.customer_id) || [];
    list.push(tx);
    txByCustomer.set(tx.customer_id, list);
  }

  for (const [, list] of txByCustomer) {
    list.sort((a, b) => (a.transaction_datetime < b.transaction_datetime ? 1 : -1));
  }

  const customerById = new Map(customers.map((c) => [c.customer_id, c]));
  const accountByCustomerId = new Map(accounts.map((a) => [a.customer_id, a]));
  const summaryByCustomerId = new Map(summaries.map((s) => [s.customer_id, s]));

  datasetCache = {
    customers,
    accounts,
    summaries,
    transactions,
    txByCustomer,
    customerById,
    accountByCustomerId,
    summaryByCustomerId,
    loadedAt: new Date().toISOString(),
  };

  return datasetCache;
}

function ensurePrecompute() {
  if (precomputeCache) return precomputeCache;

  if (fs.existsSync(PRECOMPUTE_FILE)) {
    const raw = fs.readFileSync(PRECOMPUTE_FILE, 'utf8');
    precomputeCache = JSON.parse(raw) as PrecomputeData;
    if (!precomputeCache.global.daily_volume) {
      const dataset = loadDataset();
      precomputeCache.global.daily_volume = buildDailyVolume(dataset.transactions);
      fs.writeFileSync(PRECOMPUTE_FILE, `${JSON.stringify(precomputeCache, null, 2)}\n`, 'utf8');
    }
    return precomputeCache;
  }

  const dataset = loadDataset();

  const rows: CustomerRiskRow[] = dataset.customers.map((c) => {
    const s = dataset.summaryByCustomerId.get(c.customer_id) || {};
    const score = calcRiskScore(s, c);
    return {
      customer_id: c.customer_id,
      full_name: c.full_name,
      nationality: c.nationality,
      residency_country: c.residency_country,
      kyc_level: c.kyc_level,
      risk_score: score,
      risk_tier: getRiskTier(score),
      transaction_count: toInt(s.transaction_count),
      cross_border_count: toInt(s.cross_border_count),
      cash_count: toInt(s.cash_count),
      incoming_total_try: toInt(s.incoming_total_try),
      outgoing_total_try: toInt(s.outgoing_total_try),
      updated_at: new Date().toISOString(),
    };
  }).sort((a, b) => b.risk_score - a.risk_score);

  const riskDistribution = ['LOW', 'MEDIUM', 'HIGH'].map((tier) => ({
    name: tier as RiskTier,
    count: rows.filter((r) => r.risk_tier === tier).length,
  }));

  const global = {
    risk_distribution: riskDistribution,
    top10: rows.slice(0, 10),
    currency: countBy(dataset.transactions, 'currency').slice(0, 10),
    channel: countBy(dataset.transactions, 'channel').slice(0, 10),
    category: countBy(dataset.transactions, 'category').slice(0, 12),
    daily_volume: buildDailyVolume(dataset.transactions),
    cross_border_ratio: Math.round(
      (dataset.transactions.filter((x) => (x.is_cross_border || '0') === '1').length /
        Math.max(1, dataset.transactions.length)) *
        100
    ),
  };

  precomputeCache = {
    generated_at: new Date().toISOString(),
    total_customers: rows.length,
    rows,
    global,
  };

  fs.writeFileSync(PRECOMPUTE_FILE, `${JSON.stringify(precomputeCache, null, 2)}\n`, 'utf8');
  return precomputeCache;
}

function readLiveCache(): LiveCache {
  if (!fs.existsSync(LIVE_CACHE_FILE)) {
    return { updated_at: new Date().toISOString(), entries: {} };
  }

  const raw = fs.readFileSync(LIVE_CACHE_FILE, 'utf8');
  return JSON.parse(raw) as LiveCache;
}

function writeLiveCache(data: LiveCache) {
  fs.writeFileSync(LIVE_CACHE_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function getDashboardData() {
  const dataset = loadDataset();
  const precompute = ensurePrecompute();

  return {
    updated_at: precompute.generated_at,
    loaded_at: dataset.loadedAt,
    totals: {
      customers: dataset.customers.length,
      accounts: dataset.accounts.length,
      transactions: dataset.transactions.length,
    },
    risk_distribution: precompute.global.risk_distribution,
    top10_risk: precompute.global.top10,
    channel: precompute.global.channel,
    category: precompute.global.category,
    currency: precompute.global.currency,
    daily_volume: precompute.global.daily_volume,
    cross_border_ratio: precompute.global.cross_border_ratio,
  };
}

function buildDailyVolume(transactions: DatasetRow[]) {
  const map = new Map<string, { count: number; amount_try: number }>();
  for (const tx of transactions) {
    const date = (tx.transaction_datetime || '').slice(0, 10) || 'UNKNOWN';
    const current = map.get(date) || { count: 0, amount_try: 0 };
    current.count += 1;
    current.amount_try += toInt(tx.amount_try);
    map.set(date, current);
  }

  return Array.from(map.entries())
    .map(([date, v]) => ({ date, count: v.count, amount_try: v.amount_try }))
    .filter((x) => x.date !== 'UNKNOWN')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-14);
}

export function getCustomersPage(query: { q?: string; tier?: string; page?: number; size?: number }) {
  const precompute = ensurePrecompute();
  const page = Math.max(1, query.page || 1);
  const size = Math.min(200, Math.max(10, query.size || 100));
  const q = (query.q || '').trim().toLowerCase();
  const tier = (query.tier || '').toUpperCase();

  let rows = precompute.rows;

  if (q) {
    rows = rows.filter((r) =>
      r.customer_id.toLowerCase().includes(q) ||
      r.full_name.toLowerCase().includes(q) ||
      r.nationality.toLowerCase().includes(q) ||
      r.residency_country.toLowerCase().includes(q)
    );
  }

  if (tier && ['LOW', 'MEDIUM', 'HIGH'].includes(tier)) {
    rows = rows.filter((r) => r.risk_tier === tier);
  }

  const total = rows.length;
  const start = (page - 1) * size;

  return {
    total,
    page,
    size,
    rows: rows.slice(start, start + size),
  };
}

export function getMixedDemoCustomerIds() {
  const precompute = ensurePrecompute();
  const selected: string[] = [];

  const pick = (rows: CustomerRiskRow[], count: number) => {
    for (const row of rows) {
      if (selected.length >= 5) return;
      if (selected.includes(row.customer_id)) continue;
      selected.push(row.customer_id);
      if (selected.length >= count) break;
    }
  };

  pick(precompute.rows.filter((r) => r.risk_tier === 'LOW'), 2);
  pick(precompute.rows.filter((r) => r.risk_tier === 'MEDIUM'), 4);
  pick(precompute.rows.filter((r) => r.risk_tier === 'HIGH'), 5);

  if (selected.length < 5) {
    for (const row of precompute.rows) {
      if (selected.length >= 5) break;
      if (selected.includes(row.customer_id)) continue;
      selected.push(row.customer_id);
    }
  }

  return selected.slice(0, 5);
}

export function getCustomerDetail(customerId: string, txLimit = 120) {
  const dataset = loadDataset();
  const precompute = ensurePrecompute();

  const customer = dataset.customerById.get(customerId);
  if (!customer) return null;

  const account = dataset.accountByCustomerId.get(customerId) || null;
  const summary = dataset.summaryByCustomerId.get(customerId) || null;
  const risk = precompute.rows.find((x) => x.customer_id === customerId) || null;
  const transactions = (dataset.txByCustomer.get(customerId) || []).slice(0, txLimit);
  const analytics = buildCustomerAnalytics(transactions);

  const mapPoints = transactions.slice(0, 80).map((tx) => ({
    id: tx.transaction_id,
    source_country: tx.source_country,
    source_city: tx.source_city,
    source_latitude: Number(tx.source_latitude || 0),
    source_longitude: Number(tx.source_longitude || 0),
    destination_country: tx.destination_country,
    destination_city: tx.destination_city,
    destination_latitude: Number(tx.destination_latitude || 0),
    destination_longitude: Number(tx.destination_longitude || 0),
    ip_address: tx.ip_address,
    is_cross_border: tx.is_cross_border,
    amount_try: toInt(tx.amount_try),
    channel: tx.channel,
    category: tx.category,
    transaction_datetime: tx.transaction_datetime,
  }));

  return {
    customer,
    account,
    summary,
    risk,
    transactions,
    map_points: mapPoints,
    analytics,
  };
}

export function getLiveDemoProfiles() {
  const ids = getMixedDemoCustomerIds();

  return ids
    .map((id) => getCustomerDetail(id, 240))
    .filter((detail): detail is NonNullable<typeof detail> => Boolean(detail))
    .map((detail) => ({
      customer_id: detail.customer.customer_id,
      full_name: detail.customer.full_name,
      nationality: detail.customer.nationality,
      residency_country: detail.customer.residency_country,
      risk_score: detail.risk?.risk_score || 0,
      risk_tier: detail.risk?.risk_tier || 'MEDIUM',
      transaction_count: detail.summary?.transaction_count || '0',
      cross_border_count: detail.summary?.cross_border_count || '0',
      last_transaction_at: detail.transactions[0]?.transaction_datetime || null,
      analytics: detail.analytics,
    }));
}

export function getLiveProfileDetail(customerId: string) {
  const ids = getMixedDemoCustomerIds();
  if (!ids.includes(customerId)) {
    return null;
  }

  return getCustomerDetail(customerId, 320);
}

export function getCompareData() {
  const ids = getMixedDemoCustomerIds();
  return ids
    .map((id) => getCustomerDetail(id, 60))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => ({
      customer_id: x.customer.customer_id,
      full_name: x.customer.full_name,
      risk: x.risk,
      summary: x.summary,
      account: x.account,
    }));
}

export function getMapOverview() {
  const demoIds = getMixedDemoCustomerIds();
  const details = demoIds
    .map((id) => getCustomerDetail(id, 120))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const flows = details.flatMap((d) =>
    d.map_points.map((p) => ({
      customer_id: d.customer.customer_id,
      customer_name: d.customer.full_name,
      risk_tier: d.risk?.risk_tier || 'MEDIUM',
      source_country: p.source_country,
      source_city: p.source_city,
      source_latitude: p.source_latitude,
      source_longitude: p.source_longitude,
      destination_country: p.destination_country,
      destination_city: p.destination_city,
      destination_latitude: p.destination_latitude,
      destination_longitude: p.destination_longitude,
      ip_address: p.ip_address,
      amount_try: p.amount_try,
      is_cross_border: p.is_cross_border,
      channel: p.channel,
      category: p.category,
      transaction_datetime: p.transaction_datetime,
    }))
  );

  const routeMap = new Map<string, { route: string; count: number }>();
  const ipMap = new Map<string, { ip: string; countries: Set<string>; count: number }>();

  for (const f of flows) {
    const route = `${f.source_country} -> ${f.destination_country}`;
    const r = routeMap.get(route) || { route, count: 0 };
    r.count += 1;
    routeMap.set(route, r);

    const ip = ipMap.get(f.ip_address) || { ip: f.ip_address, countries: new Set<string>(), count: 0 };
    ip.count += 1;
    ip.countries.add(f.source_country);
    ip.countries.add(f.destination_country);
    ipMap.set(f.ip_address, ip);
  }

  const topRoutes = Array.from(routeMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  const ipAnomalies = Array.from(ipMap.values())
    .map((x) => ({ ip: x.ip, count: x.count, country_count: x.countries.size }))
    .filter((x) => x.country_count > 1)
    .sort((a, b) => b.country_count - a.country_count || b.count - a.count)
    .slice(0, 12);

  return {
    demo_ids: demoIds,
    flow_count: flows.length,
    flows: flows.slice(0, 350),
    top_routes: topRoutes,
    ip_anomalies: ipAnomalies,
  };
}

export async function runLiveAnalysis(customerId: string) {
  const demoIds = getMixedDemoCustomerIds();
  if (!demoIds.includes(customerId)) {
    return {
      ok: false,
      message: 'Canli analiz yalnizca sabit 5 demo kayit icin aciktir.',
    };
  }

  const detail = getCustomerDetail(customerId, 120);
  if (!detail) {
    return { ok: false, message: 'Musteri bulunamadi.' };
  }

  const cache = readLiveCache();
  if (cache.entries[customerId]) {
    return { ok: true, cached: true, data: cache.entries[customerId] };
  }

  const baseUrl = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1';
  const model = process.env.LM_STUDIO_MODEL || 'qwen2.5-7b-instruct';

  const prompt = [
    'Sen bir AML uyum analistisin.',
    'Turkce, net ve profesyonel yanit ver.',
    'Asagidaki kayit icin 6 baslikta detayli degerlendirme ver:',
    '1) Durum Ozeti',
    '2) Risk Bulgulari',
    '3) Davranis Paternleri',
    '4) Nedenler',
    '5) Inceleme Onceligi',
    '6) Onerilen Aksiyonlar',
    '',
    JSON.stringify({
      customer: detail.customer,
      account: detail.account,
      summary: detail.summary,
      risk: detail.risk,
      analytics: detail.analytics,
      transactions: detail.transactions.slice(0, 120),
    }),
  ].join('\n');

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'Turkce ve resmi dil kullan.' },
          { role: 'user', content: prompt },
        ],
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, message: `Local model hatasi: ${response.status} ${text}` };
    }

    const payload = await response.json();
    const analysis =
      payload?.choices?.[0]?.message?.content ||
      'Canli analiz cevabi alinamadi; cache fallback kullanin.';

    const entry: LiveCacheEntry = {
      customer_id: customerId,
      analysis,
      created_at: new Date().toISOString(),
      model,
    };

    cache.entries[customerId] = entry;
    cache.updated_at = new Date().toISOString();
    writeLiveCache(cache);

    return { ok: true, cached: false, data: entry };
  } catch (error: any) {
    return {
      ok: false,
      message: `Local model baglanti hatasi: ${error?.message || 'bilinmeyen hata'}`,
    };
  }
}

export function resetLiveDemoCache() {
  const cache = readLiveCache();
  cache.entries = {};
  cache.updated_at = new Date().toISOString();
  writeLiveCache(cache);
  return { ok: true, updated_at: cache.updated_at };
}

export function getLiveCache() {
  return readLiveCache();
}
