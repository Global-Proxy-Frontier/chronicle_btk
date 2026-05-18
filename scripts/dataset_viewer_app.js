const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.DATASET_VIEWER_PORT ? Number(process.env.DATASET_VIEWER_PORT) : 4080;
const DATASET_DIR = path.join(process.cwd(), 'data', 'gemini_flash_ready_v1');
const PAGE_FILE = path.join(__dirname, 'dataset_viewer_page.html');

function parseCsvLine(line) {
  const out = [];
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

function parseCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0]);

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = values[i] !== undefined ? values[i] : '';
    }

    return row;
  });

  return rows;
}

function countBy(rows, key) {
  const map = new Map();

  for (const row of rows) {
    const value = row[key] || 'UNKNOWN';
    map.set(value, (map.get(value) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function loadDataset() {
  const files = [
    'customers.csv',
    'accounts.csv',
    'customer_transaction_summary.csv'
  ];

  for (const file of files) {
    const fullPath = path.join(DATASET_DIR, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing dataset file: ${fullPath}`);
    }
  }

  if (!fs.existsSync(PAGE_FILE)) {
    throw new Error(`Missing page file: ${PAGE_FILE}`);
  }

  const transactionFiles = fs.readdirSync(DATASET_DIR)
    .filter((name) => /^transactions(?:_part\d+)?\.csv$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (transactionFiles.length === 0) {
    throw new Error(`Missing transaction files in: ${DATASET_DIR}`);
  }

  const customers = parseCsvFile(path.join(DATASET_DIR, 'customers.csv'));
  const accounts = parseCsvFile(path.join(DATASET_DIR, 'accounts.csv'));
  const transactions = transactionFiles.flatMap((fileName) => parseCsvFile(path.join(DATASET_DIR, fileName)));
  const summaries = parseCsvFile(path.join(DATASET_DIR, 'customer_transaction_summary.csv'));

  const customerById = new Map(customers.map((c) => [c.customer_id, c]));
  const accountByCustomerId = new Map(accounts.map((a) => [a.customer_id, a]));
  const summaryByCustomerId = new Map(summaries.map((s) => [s.customer_id, s]));

  const txByCustomerId = new Map();
  for (const tx of transactions) {
    const list = txByCustomerId.get(tx.customer_id) || [];
    list.push(tx);
    txByCustomerId.set(tx.customer_id, list);
  }

  for (const [, list] of txByCustomerId.entries()) {
    list.sort((a, b) => (a.transaction_datetime < b.transaction_datetime ? 1 : -1));
  }

  const globalSummary = {
    counts: {
      customers: customers.length,
      accounts: accounts.length,
      transactions: transactions.length
    },
    distributions: {
      nationality: countBy(customers, 'nationality'),
      residency_country: countBy(customers, 'residency_country'),
      category: countBy(transactions, 'category'),
      channel: countBy(transactions, 'channel'),
      direction: countBy(transactions, 'direction'),
      currency: countBy(transactions, 'currency'),
      is_cross_border: countBy(transactions, 'is_cross_border')
    }
  };

  return {
    pageHtml: fs.readFileSync(PAGE_FILE, 'utf8'),
    customers,
    customerById,
    accountByCustomerId,
    summaryByCustomerId,
    txByCustomerId,
    globalSummary
  };
}

let dataset;
try {
  dataset = loadDataset();
} catch (error) {
  console.error('[dataset-viewer] startup error:', error.message);
  process.exit(1);
}

function sendJson(res, payload, statusCode = 200) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function sendHtml(res, html, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html)
  });
  res.end(html);
}

function getCustomers(searchParams) {
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const nationality = (searchParams.get('nationality') || '').trim().toUpperCase();
  const offset = Math.max(0, Number(searchParams.get('offset') || 0));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 60)));

  let rows = dataset.customers;

  if (q) {
    rows = rows.filter((c) =>
      c.customer_id.toLowerCase().includes(q) ||
      c.full_name.toLowerCase().includes(q) ||
      c.nationality.toLowerCase().includes(q) ||
      c.residency_country.toLowerCase().includes(q)
    );
  }

  if (nationality) {
    rows = rows.filter((c) => c.nationality === nationality);
  }

  const total = rows.length;
  const page = rows.slice(offset, offset + limit).map((c) => {
    const summary = dataset.summaryByCustomerId.get(c.customer_id);
    return {
      customer_id: c.customer_id,
      full_name: c.full_name,
      nationality: c.nationality,
      residency_country: c.residency_country,
      kyc_level: c.kyc_level,
      monthly_income_try: toInt(c.monthly_income_try),
      current_debt_try: toInt(c.current_debt_try),
      transaction_count: summary ? toInt(summary.transaction_count) : 0
    };
  });

  return { total, offset, limit, rows: page };
}

function getCustomerDetail(customerId, limit = 80) {
  const customer = dataset.customerById.get(customerId);
  if (!customer) return null;

  const account = dataset.accountByCustomerId.get(customerId) || null;
  const summary = dataset.summaryByCustomerId.get(customerId) || null;
  const transactions = (dataset.txByCustomerId.get(customerId) || []).slice(0, limit);

  return {
    customer,
    account,
    summary,
    aggregates: {
      category: countBy(transactions, 'category'),
      channel: countBy(transactions, 'channel'),
      direction: countBy(transactions, 'direction')
    },
    transactions
  };
}

function notFound(res) {
  sendJson(res, { error: 'Not found' }, 404);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/') {
    return sendHtml(res, dataset.pageHtml);
  }

  if (pathname === '/api/summary') {
    return sendJson(res, dataset.globalSummary);
  }

  if (pathname === '/api/customers') {
    return sendJson(res, getCustomers(requestUrl.searchParams));
  }

  if (pathname.startsWith('/api/customer/')) {
    const customerId = decodeURIComponent(pathname.replace('/api/customer/', ''));
    const limit = Math.min(200, Math.max(10, Number(requestUrl.searchParams.get('limit') || 80)));
    const detail = getCustomerDetail(customerId, limit);
    if (!detail) return notFound(res);
    return sendJson(res, detail);
  }

  return notFound(res);
});

server.listen(PORT, () => {
  console.log(`[dataset-viewer] Started on http://localhost:${PORT}`);
  console.log(`[dataset-viewer] Dataset: ${DATASET_DIR}`);
});
