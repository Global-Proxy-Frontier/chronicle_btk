const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(process.cwd(), 'data', 'gemini_flash_ready_v1');
const CUSTOMER_COUNT = 1000;
const TX_PER_CUSTOMER = 100;
const TX_CHUNK_SIZE = 50000;
const RANDOM_SEED = 20260513;

function mulberry32(seed) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(RANDOM_SEED);

function rand() {
  return random();
}

function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const r = rand() * total;
  let acc = 0;
  for (const item of items) {
    acc += item.weight;
    if (r <= acc) return item.value;
  }
  return items[items.length - 1].value;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTime(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[ç]/g, 'c')
    .replace(/[ğ]/g, 'g')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ş]/g, 's')
    .replace(/[ü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
}

function hashValue(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 20);
}

function jitterCoord(value, spread = 0.15) {
  return +(value + (rand() - 0.5) * spread).toFixed(6);
}

const turkishFirstNames = [
  'Ahmet', 'Mehmet', 'Ayse', 'Fatma', 'Ali', 'Veli', 'Elif', 'Zeynep', 'Mert', 'Ece',
  'Can', 'Deniz', 'Emir', 'Asli', 'Omer', 'Ceren', 'Yusuf', 'Buse', 'Kerem', 'Derya'
];

const turkishLastNames = [
  'Yilmaz', 'Demir', 'Kaya', 'Sahin', 'Celik', 'Yildiz', 'Aydin', 'Ozdemir', 'Arslan', 'Dogan',
  'Kilic', 'Aslan', 'Cetin', 'Karaca', 'Eren', 'Polat', 'Acar', 'Bulut', 'Ucar', 'Aksoy'
];

const foreignFirstNames = [
  'John', 'Emma', 'Liam', 'Olivia', 'Noah', 'Mia', 'Lucas', 'Sofia', 'Artem', 'Elena',
  'Omar', 'Nadia', 'Hassan', 'Amina', 'David', 'Anna', 'Mark', 'Julia', 'Ivan', 'Sara'
];

const foreignLastNames = [
  'Smith', 'Johnson', 'Brown', 'Garcia', 'Miller', 'Wilson', 'Taylor', 'Anderson', 'Petrov', 'Ivanov',
  'Khan', 'Hussein', 'Lopez', 'Martin', 'Silva', 'Rossi', 'Muller', 'Schmidt', 'Kowalski', 'Aliyev'
];

const occupations = [
  { name: 'Software Engineer', min: 55000, max: 130000 },
  { name: 'Teacher', min: 28000, max: 60000 },
  { name: 'Accountant', min: 35000, max: 90000 },
  { name: 'Doctor', min: 90000, max: 240000 },
  { name: 'Nurse', min: 32000, max: 80000 },
  { name: 'Sales Specialist', min: 25000, max: 75000 },
  { name: 'Freelancer', min: 18000, max: 110000 },
  { name: 'Small Business Owner', min: 30000, max: 180000 },
  { name: 'Student', min: 5000, max: 25000 },
  { name: 'Retired', min: 12000, max: 45000 }
];

const trCities = [
  { city: 'Istanbul', country: 'TR', lat: 41.0082, lon: 28.9784 },
  { city: 'Ankara', country: 'TR', lat: 39.9334, lon: 32.8597 },
  { city: 'Izmir', country: 'TR', lat: 38.4237, lon: 27.1428 },
  { city: 'Bursa', country: 'TR', lat: 40.1885, lon: 29.0610 },
  { city: 'Antalya', country: 'TR', lat: 36.8969, lon: 30.7133 },
  { city: 'Adana', country: 'TR', lat: 37.0000, lon: 35.3213 },
  { city: 'Konya', country: 'TR', lat: 37.8746, lon: 32.4932 },
  { city: 'Gaziantep', country: 'TR', lat: 37.0662, lon: 37.3833 },
  { city: 'Trabzon', country: 'TR', lat: 41.0027, lon: 39.7168 },
  { city: 'Kayseri', country: 'TR', lat: 38.7312, lon: 35.4787 }
];

const foreignLocations = [
  { city: 'Berlin', country: 'DE', lat: 52.52, lon: 13.405 },
  { city: 'Munich', country: 'DE', lat: 48.1351, lon: 11.5820 },
  { city: 'London', country: 'GB', lat: 51.5072, lon: -0.1276 },
  { city: 'Manchester', country: 'GB', lat: 53.4808, lon: -2.2426 },
  { city: 'Baku', country: 'AZ', lat: 40.4093, lon: 49.8671 },
  { city: 'Moscow', country: 'RU', lat: 55.7558, lon: 37.6176 },
  { city: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
  { city: 'Doha', country: 'QA', lat: 25.2854, lon: 51.5310 },
  { city: 'Riyadh', country: 'SA', lat: 24.7136, lon: 46.6753 },
  { city: 'Amsterdam', country: 'NL', lat: 52.3676, lon: 4.9041 }
];

const trBanks = [
  { name: 'Ziraat Bankasi', bic: 'TCZBTR2A' },
  { name: 'Is Bankasi', bic: 'ISBKTRIS' },
  { name: 'Garanti BBVA', bic: 'TGBATRIS' },
  { name: 'Akbank', bic: 'AKBKTRIS' },
  { name: 'Yapi Kredi', bic: 'YAPITRIS' },
  { name: 'VakıfBank', bic: 'TVBATR2A' },
  { name: 'Halkbank', bic: 'TRHBTR2A' },
  { name: 'QNB Turkiye', bic: 'FNNBTRIS' }
];

const foreignBanks = [
  { name: 'Deutsche Bank', bic: 'DEUTDEFF' },
  { name: 'Barclays', bic: 'BARCGB22' },
  { name: 'HSBC UK', bic: 'HBUKGB4B' },
  { name: 'Citibank NA', bic: 'CITIUS33' },
  { name: 'BNP Paribas', bic: 'BNPAFRPP' },
  { name: 'ING Bank', bic: 'INGBNL2A' }
];

const branches = [
  { code: 'TR-001', name: 'Istanbul Levent Subesi', city: 'Istanbul' },
  { code: 'TR-002', name: 'Istanbul Kadikoy Subesi', city: 'Istanbul' },
  { code: 'TR-003', name: 'Ankara Cankaya Subesi', city: 'Ankara' },
  { code: 'TR-004', name: 'Izmir Konak Subesi', city: 'Izmir' },
  { code: 'TR-005', name: 'Bursa Nilufer Subesi', city: 'Bursa' },
  { code: 'TR-006', name: 'Antalya Merkez Subesi', city: 'Antalya' }
];

const merchantMccMap = {
  Market: '5411',
  Rent: '6513',
  Utilities: '4900',
  Restaurant: '5812',
  Transport: '4111',
  Ecommerce: '5999',
  Health: '8099',
  Subscription: '4899'
};

const appVersions = ['6.4.0', '6.4.1', '6.5.0', '6.5.1', '6.6.0'];
const deviceOsList = ['Android', 'iOS'];
const accountTypes = ['Vadesiz', 'Vadeli', 'Doviz'];

function randomHour() {
  const bucket = pickWeighted([
    { value: 'night', weight: 6 },
    { value: 'morning', weight: 28 },
    { value: 'day', weight: 42 },
    { value: 'evening', weight: 24 }
  ]);

  if (bucket === 'night') return randInt(0, 5);
  if (bucket === 'morning') return randInt(6, 11);
  if (bucket === 'day') return randInt(12, 17);
  return randInt(18, 23);
}

function randomDateBetween(start, end) {
  const t = start.getTime() + rand() * (end.getTime() - start.getTime());
  const date = new Date(t);
  date.setUTCHours(randomHour(), randInt(0, 59), randInt(0, 59), 0);
  return date;
}

function generateTRIban() {
  let digits = '';
  for (let i = 0; i < 24; i += 1) digits += String(randInt(0, 9));
  return `TR${String(randInt(10, 99))}${digits}`;
}

function generateAccountNo() {
  return `${randInt(100, 999)}-${randInt(1000000, 9999999)}-${randInt(10, 99)}`;
}

function generatePhone(country) {
  if (country === 'TR') return `+90${randInt(500, 599)}${randInt(1000000, 9999999)}`;
  if (country === 'GB') return `+44${randInt(7000, 7999)}${randInt(100000, 999999)}`;
  if (country === 'DE') return `+49${randInt(150, 179)}${randInt(1000000, 9999999)}`;
  if (country === 'AZ') return `+994${randInt(50, 77)}${randInt(1000000, 9999999)}`;
  return `+${randInt(30, 99)}${randInt(500, 999)}${randInt(1000000, 9999999)}`;
}

function randomIp() {
  return `${randInt(10, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}

function randomEmployer() {
  const wordsA = ['Anadolu', 'Delta', 'Nova', 'Atlas', 'Mavi', 'Liman', 'Global', 'Zen'];
  const wordsB = ['Teknoloji', 'Lojistik', 'Danismanlik', 'Ticaret', 'Yazilim', 'Enerji', 'Saglik', 'Insaat'];
  const suffix = ['AS', 'Ltd', 'Grup', 'Holding'];
  return `${pick(wordsA)} ${pick(wordsB)} ${pick(suffix)}`;
}

function randomCountryLocation(excludeCountry = null) {
  const pool = [...trCities, ...foreignLocations].filter((x) => x.country !== excludeCountry);
  return pick(pool);
}

function amountForCategory(category, income) {
  switch (category) {
    case 'Salary':
      return randInt(Math.round(income * 0.85), Math.round(income * 1.25));
    case 'Rent':
      return randInt(Math.round(income * 0.18), Math.round(income * 0.45));
    case 'Market':
      return randInt(150, Math.round(income * 0.09 + 250));
    case 'Utilities':
      return randInt(200, Math.round(income * 0.12 + 300));
    case 'Restaurant':
      return randInt(120, Math.round(income * 0.07 + 250));
    case 'Transport':
      return randInt(80, Math.round(income * 0.05 + 180));
    case 'Ecommerce':
      return randInt(150, Math.round(income * 0.14 + 400));
    case 'Transfer':
    case 'TransferIn':
      return randInt(300, Math.round(income * 0.8 + 30000));
    case 'CashWithdrawal':
      return randInt(200, Math.round(income * 0.25 + 7000));
    case 'CashDeposit':
      return randInt(250, Math.round(income * 0.4 + 12000));
    case 'Investment':
    case 'InvestmentReturn':
      return randInt(500, Math.round(income * 1.1 + 50000));
    case 'Freelance':
      return randInt(250, Math.round(income * 0.6 + 10000));
    case 'Health':
      return randInt(100, Math.round(income * 0.12 + 500));
    case 'Subscription':
      return randInt(60, Math.round(income * 0.04 + 220));
    default:
      return randInt(100, Math.round(income * 0.1 + 400));
  }
}

function toCsvRow(values) {
  return values
    .map((value) => {
      const str = value === null || value === undefined ? '' : String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  ensureDir(OUTPUT_DIR);

  const start = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(2026, 4, 1, 23, 59, 59));

  const customerHeaders = [
    'customer_id',
    'full_name',
    'national_id_hash',
    'passport_id_hash',
    'date_of_birth',
    'birth_country',
    'birth_city',
    'nationality',
    'residency_country',
    'residency_city',
    'phone_number',
    'email',
    'occupation',
    'employer_name',
    'onboarding_date',
    'account_open_date',
    'account_status',
    'kyc_level',
    'customer_type',
    'monthly_income_try',
    'current_debt_try',
    'pep_flag',
    'sanctions_flag',
    'watchlist_flag'
  ];

  const accountHeaders = [
    'account_id',
    'customer_id',
    'account_no',
    'iban',
    'account_type',
    'account_currency',
    'branch_code',
    'branch_name',
    'branch_city',
    'swift_bic',
    'account_open_date',
    'account_status',
    'opening_balance',
    'current_balance',
    'credit_limit',
    'current_debt_amount'
  ];

  const txHeaders = [
    'transaction_id',
    'customer_id',
    'account_id',
    'transaction_datetime',
    'timezone',
    'direction',
    'amount',
    'currency',
    'exchange_rate_try',
    'amount_try',
    'balance_before',
    'fee',
    'tax',
    'balance_after',
    'transaction_type',
    'channel',
    'category',
    'sub_category',
    'payment_purpose',
    'counterparty_name',
    'counterparty_account_hash',
    'counterparty_bank_name',
    'counterparty_bank_bic',
    'counterparty_country',
    'counterparty_city',
    'source_country',
    'source_city',
    'source_latitude',
    'source_longitude',
    'destination_country',
    'destination_city',
    'destination_latitude',
    'destination_longitude',
    'device_id',
    'device_os',
    'app_version',
    'ip_address',
    'terminal_id',
    'atm_id',
    'merchant_name',
    'merchant_mcc',
    'cash_flag',
    'card_present_flag',
    'remote_flag',
    'is_cross_border',
    'swift_reference'
  ];

  const summaryHeaders = [
    'customer_id',
    'transaction_count',
    'incoming_count',
    'outgoing_count',
    'incoming_total_try',
    'outgoing_total_try',
    'cross_border_count',
    'cash_count',
    'avg_tx_amount_try'
  ];

  const customers = [];
  const accounts = [];
  const transactions = [];
  const summaries = [];

  for (let i = 1; i <= CUSTOMER_COUNT; i += 1) {
    const customerId = `C${String(i).padStart(6, '0')}`;
    const accountId = `A${String(i).padStart(6, '0')}`;

    const isTurkish = rand() < 0.82;
    const nationality = isTurkish ? 'TR' : pick(['DE', 'GB', 'AZ', 'RU', 'AE', 'NL']);
    const residencyCountry = isTurkish ? 'TR' : pickWeighted([
      { value: nationality, weight: 65 },
      { value: 'TR', weight: 35 }
    ]);

    const birthLoc = isTurkish ? pick(trCities) : pick(foreignLocations);
    const residencyLoc = residencyCountry === 'TR'
      ? pick(trCities)
      : pick(foreignLocations.filter((x) => x.country === residencyCountry).length
        ? foreignLocations.filter((x) => x.country === residencyCountry)
        : foreignLocations);

    const firstName = isTurkish ? pick(turkishFirstNames) : pick(foreignFirstNames);
    const lastName = isTurkish ? pick(turkishLastNames) : pick(foreignLastNames);
    const fullName = `${firstName} ${lastName}`;

    const occupation = pick(occupations);
    const monthlyIncome = randInt(occupation.min, occupation.max);
    const currentDebt = randInt(0, Math.round(monthlyIncome * 7));
    const creditLimit = randInt(Math.round(monthlyIncome * 2), Math.round(monthlyIncome * 8));

    const onboardingDate = new Date(Date.UTC(randInt(2018, 2024), randInt(0, 11), randInt(1, 28)));
    const accountOpenDate = new Date(onboardingDate.getTime() + randInt(0, 60) * 24 * 3600 * 1000);

    const accountCurrency = pickWeighted([
      { value: 'TRY', weight: 90 },
      { value: 'USD', weight: 6 },
      { value: 'EUR', weight: 4 }
    ]);

    const openingBalance = randInt(Math.round(monthlyIncome * 0.5), Math.round(monthlyIncome * 5));

    const branch = pick(branches);
    const primaryBank = pick(trBanks);

    const customer = {
      customer_id: customerId,
      full_name: fullName,
      national_id_hash: hashValue(`${customerId}-nid-${randInt(10000000000, 99999999999)}`),
      passport_id_hash: hashValue(`${customerId}-pass-${randInt(100000000, 999999999)}`),
      date_of_birth: formatDate(new Date(Date.UTC(randInt(1958, 2005), randInt(0, 11), randInt(1, 28)))),
      birth_country: birthLoc.country,
      birth_city: birthLoc.city,
      nationality,
      residency_country: residencyCountry,
      residency_city: residencyLoc.city,
      phone_number: generatePhone(residencyCountry),
      email: `${normalizeText(firstName)}.${normalizeText(lastName)}.${randInt(10, 999)}@mail.com`,
      occupation: occupation.name,
      employer_name: randomEmployer(),
      onboarding_date: formatDate(onboardingDate),
      account_open_date: formatDate(accountOpenDate),
      account_status: pickWeighted([
        { value: 'ACTIVE', weight: 94 },
        { value: 'DORMANT', weight: 4 },
        { value: 'REVIEW', weight: 2 }
      ]),
      kyc_level: pickWeighted([
        { value: 'BASIC', weight: 25 },
        { value: 'STANDARD', weight: 55 },
        { value: 'ENHANCED', weight: 20 }
      ]),
      customer_type: 'INDIVIDUAL',
      monthly_income_try: monthlyIncome,
      current_debt_try: currentDebt,
      pep_flag: rand() < 0.01 ? 1 : 0,
      sanctions_flag: rand() < 0.002 ? 1 : 0,
      watchlist_flag: rand() < 0.015 ? 1 : 0
    };

    const account = {
      account_id: accountId,
      customer_id: customerId,
      account_no: generateAccountNo(),
      iban: generateTRIban(),
      account_type: pick(accountTypes),
      account_currency: accountCurrency,
      branch_code: branch.code,
      branch_name: branch.name,
      branch_city: branch.city,
      swift_bic: primaryBank.bic,
      account_open_date: customer.account_open_date,
      account_status: customer.account_status,
      opening_balance: openingBalance,
      current_balance: openingBalance,
      credit_limit: creditLimit,
      current_debt_amount: currentDebt
    };

    const devicePool = [`DEV-${customerId}-${randInt(100, 999)}`, `DEV-${customerId}-${randInt(1000, 1999)}`];
    const primaryDevice = pick(devicePool);
    const primaryOs = pick(deviceOsList);

    const txEvents = [];

    // Salary-like inflows across months for behavioral realism.
    for (let month = 0; month < 12; month += 1) {
      const baseDate = new Date(Date.UTC(2025, month, randInt(1, 28), randInt(8, 14), randInt(0, 59), randInt(0, 59)));
      txEvents.push({
        dt: baseDate,
        direction: 'IN',
        category: 'Salary',
        sub_category: 'Payroll',
        payment_purpose: 'Salary payment',
        amount: amountForCategory('Salary', monthlyIncome),
        channel: pickWeighted([
          { value: 'EFT', weight: 55 },
          { value: 'Havale', weight: 20 },
          { value: 'Internet', weight: 15 },
          { value: 'Mobile', weight: 10 }
        ]),
        transaction_type: 'Transfer',
        merchant_name: '',
        merchant_mcc: '',
        counterparty_type: 'employer'
      });
    }

    while (txEvents.length < TX_PER_CUSTOMER) {
      const direction = pickWeighted([
        { value: 'OUT', weight: 64 },
        { value: 'IN', weight: 36 }
      ]);

      const outCategory = pickWeighted([
        { value: 'Market', weight: 22 },
        { value: 'Rent', weight: 12 },
        { value: 'Utilities', weight: 11 },
        { value: 'Restaurant', weight: 9 },
        { value: 'Transport', weight: 8 },
        { value: 'Ecommerce', weight: 14 },
        { value: 'Transfer', weight: 13 },
        { value: 'CashWithdrawal', weight: 5 },
        { value: 'Investment', weight: 3 },
        { value: 'Health', weight: 2 },
        { value: 'Subscription', weight: 1 }
      ]);

      const inCategory = pickWeighted([
        { value: 'TransferIn', weight: 42 },
        { value: 'Freelance', weight: 19 },
        { value: 'Refund', weight: 10 },
        { value: 'CashDeposit', weight: 10 },
        { value: 'InvestmentReturn', weight: 9 },
        { value: 'Salary', weight: 10 }
      ]);

      const category = direction === 'OUT' ? outCategory : inCategory;

      const channel = (() => {
        if (category === 'CashWithdrawal' || category === 'CashDeposit') return 'ATM';
        if (category === 'Market') return pickWeighted([
          { value: 'POS', weight: 65 },
          { value: 'Mobile', weight: 20 },
          { value: 'Internet', weight: 15 }
        ]);
        if (category === 'Ecommerce' || category === 'Subscription') return pickWeighted([
          { value: 'Internet', weight: 70 },
          { value: 'Mobile', weight: 30 }
        ]);
        return pickWeighted([
          { value: 'EFT', weight: 34 },
          { value: 'Havale', weight: 21 },
          { value: 'Mobile', weight: 27 },
          { value: 'Internet', weight: 14 },
          { value: 'POS', weight: 4 }
        ]);
      })();

      const transactionType = (() => {
        if (category === 'CashWithdrawal' || category === 'CashDeposit') return 'Cash';
        if (['Market', 'Restaurant', 'Transport', 'Ecommerce', 'Health', 'Subscription'].includes(category)) return 'CardPayment';
        if (category === 'Investment' || category === 'InvestmentReturn') return 'Investment';
        return 'Transfer';
      })();

      const subCategoryMap = {
        Market: 'Groceries',
        Rent: 'Housing',
        Utilities: 'Bills',
        Restaurant: 'Food',
        Transport: 'Mobility',
        Ecommerce: 'Online Shopping',
        Transfer: 'Peer transfer',
        CashWithdrawal: 'Cash out',
        Investment: 'Portfolio transfer',
        Salary: 'Payroll',
        TransferIn: 'Peer transfer',
        Refund: 'Merchant refund',
        Freelance: 'Service income',
        CashDeposit: 'Cash in',
        InvestmentReturn: 'Portfolio return',
        Health: 'Medical',
        Subscription: 'Digital services'
      };

      const amount = amountForCategory(category, monthlyIncome);
      const dt = randomDateBetween(start, end);

      txEvents.push({
        dt,
        direction,
        category,
        sub_category: subCategoryMap[category] || 'General',
        payment_purpose: subCategoryMap[category] || 'General payment',
        amount,
        channel,
        transaction_type: transactionType,
        merchant_name: ['CardPayment'].includes(transactionType) ? `${category} Store ${randInt(1, 999)}` : '',
        merchant_mcc: merchantMccMap[category] || '',
        counterparty_type: direction === 'IN' ? pickWeighted([
          { value: 'individual', weight: 45 },
          { value: 'business', weight: 35 },
          { value: 'employer', weight: 20 }
        ]) : pickWeighted([
          { value: 'merchant', weight: 58 },
          { value: 'individual', weight: 25 },
          { value: 'business', weight: 17 }
        ])
      });
    }

    txEvents.sort((a, b) => a.dt - b.dt);

    let runningBalance = openingBalance;
    let inCount = 0;
    let outCount = 0;
    let inTotal = 0;
    let outTotal = 0;
    let crossBorderCount = 0;
    let cashCount = 0;

    for (let j = 0; j < txEvents.length; j += 1) {
      const evt = txEvents[j];
      const txId = `TX-${customerId}-${String(j + 1).padStart(4, '0')}`;

      const crossBorderChance = nationality === 'TR' ? 0.08 : 0.18;
      const isCrossBorder = rand() < crossBorderChance ? 1 : 0;

      const customerLoc = residencyCountry === 'TR'
        ? pick(trCities.filter((x) => x.city === residencyLoc.city).length
          ? trCities.filter((x) => x.city === residencyLoc.city)
          : trCities)
        : pick(foreignLocations.filter((x) => x.country === residencyCountry).length
          ? foreignLocations.filter((x) => x.country === residencyCountry)
          : foreignLocations);

      const cpLoc = isCrossBorder
        ? randomCountryLocation(evt.direction === 'OUT' ? residencyCountry : null)
        : (residencyCountry === 'TR' ? pick(trCities) : pick(foreignLocations));

      const cpBank = cpLoc.country === 'TR' ? pick(trBanks) : pick(foreignBanks);
      const currency = isCrossBorder
        ? pickWeighted([{ value: 'USD', weight: 45 }, { value: 'EUR', weight: 35 }, { value: 'TRY', weight: 20 }])
        : (accountCurrency === 'TRY' ? 'TRY' : pickWeighted([{ value: accountCurrency, weight: 70 }, { value: 'TRY', weight: 30 }]));

      const exchangeRate = currency === 'TRY'
        ? 1
        : currency === 'USD'
          ? +(35 + rand() * 4).toFixed(4)
          : +(38 + rand() * 4).toFixed(4);

      let amount = evt.amount;
      let fee = 0;
      let tax = 0;

      if (evt.channel === 'SWIFT' || isCrossBorder) {
        fee = randInt(75, 360);
        tax = Math.round(fee * 0.05);
      } else if (['EFT', 'Havale'].includes(evt.channel)) {
        fee = randInt(2, 24);
        tax = Math.round(fee * 0.05);
      }

      const amountTry = Math.round(amount * exchangeRate);

      const maxOut = Math.max(50, Math.round(runningBalance + currentDebt * 0.8 - fee - tax));
      if (evt.direction === 'OUT' && amountTry > maxOut) {
        amount = Math.max(5, Math.floor(maxOut / exchangeRate));
      }

      const amountTryAdjusted = Math.round(amount * exchangeRate);
      const before = Math.round(runningBalance);
      const after = evt.direction === 'IN'
        ? before + amountTryAdjusted
        : before - amountTryAdjusted - fee - tax;
      runningBalance = after;

      const isCash = evt.transaction_type === 'Cash' ? 1 : 0;
      const isCardPresent = evt.channel === 'POS' ? 1 : 0;
      const isRemote = ['Mobile', 'Internet'].includes(evt.channel) ? 1 : 0;

      const source = evt.direction === 'OUT' ? customerLoc : cpLoc;
      const destination = evt.direction === 'OUT' ? cpLoc : customerLoc;

      const channelFinal = isCrossBorder && evt.transaction_type === 'Transfer'
        ? pickWeighted([{ value: 'SWIFT', weight: 70 }, { value: evt.channel, weight: 30 }])
        : evt.channel;

      const deviceId = rand() < 0.88 ? primaryDevice : pick(devicePool);
      const deviceOs = rand() < 0.88 ? primaryOs : pick(deviceOsList);
      const appVersion = pick(appVersions);

      const counterpartyName = `${pick(foreignFirstNames.concat(turkishFirstNames))} ${pick(foreignLastNames.concat(turkishLastNames))}`;
      const counterpartyAccountHash = hashValue(`${customerId}-${txId}-cp-${randInt(100000, 999999)}`);

      const terminalId = ['POS', 'ATM'].includes(channelFinal) ? `TERM-${randInt(10000, 99999)}` : '';
      const atmId = channelFinal === 'ATM' ? `ATM-${randInt(1000, 9999)}` : '';
      const swiftRef = channelFinal === 'SWIFT' ? `SWF-${randInt(10000000, 99999999)}` : '';

      if (evt.direction === 'IN') {
        inCount += 1;
        inTotal += amountTryAdjusted;
      } else {
        outCount += 1;
        outTotal += amountTryAdjusted;
      }

      if (isCrossBorder) crossBorderCount += 1;
      if (isCash) cashCount += 1;

      transactions.push({
        transaction_id: txId,
        customer_id: customerId,
        account_id: accountId,
        transaction_datetime: formatDateTime(evt.dt),
        timezone: 'Europe/Istanbul',
        direction: evt.direction,
        amount,
        currency,
        exchange_rate_try: exchangeRate,
        amount_try: amountTryAdjusted,
        balance_before: before,
        fee,
        tax,
        balance_after: after,
        transaction_type: evt.transaction_type,
        channel: channelFinal,
        category: evt.category,
        sub_category: evt.sub_category,
        payment_purpose: evt.payment_purpose,
        counterparty_name: counterpartyName,
        counterparty_account_hash: counterpartyAccountHash,
        counterparty_bank_name: cpBank.name,
        counterparty_bank_bic: cpBank.bic,
        counterparty_country: cpLoc.country,
        counterparty_city: cpLoc.city,
        source_country: source.country,
        source_city: source.city,
        source_latitude: jitterCoord(source.lat),
        source_longitude: jitterCoord(source.lon),
        destination_country: destination.country,
        destination_city: destination.city,
        destination_latitude: jitterCoord(destination.lat),
        destination_longitude: jitterCoord(destination.lon),
        device_id: deviceId,
        device_os: deviceOs,
        app_version: appVersion,
        ip_address: randomIp(),
        terminal_id: terminalId,
        atm_id: atmId,
        merchant_name: evt.merchant_name,
        merchant_mcc: evt.merchant_mcc,
        cash_flag: isCash,
        card_present_flag: isCardPresent,
        remote_flag: isRemote,
        is_cross_border: isCrossBorder,
        swift_reference: swiftRef
      });
    }

    account.current_balance = Math.round(runningBalance);

    customers.push(customer);
    accounts.push(account);

    summaries.push({
      customer_id: customerId,
      transaction_count: TX_PER_CUSTOMER,
      incoming_count: inCount,
      outgoing_count: outCount,
      incoming_total_try: Math.round(inTotal),
      outgoing_total_try: Math.round(outTotal),
      cross_border_count: crossBorderCount,
      cash_count: cashCount,
      avg_tx_amount_try: Math.round((inTotal + outTotal) / TX_PER_CUSTOMER)
    });
  }

  const customerRows = [toCsvRow(customerHeaders), ...customers.map((row) => toCsvRow(customerHeaders.map((h) => row[h])))]
    .join('\n');
  const accountRows = [toCsvRow(accountHeaders), ...accounts.map((row) => toCsvRow(accountHeaders.map((h) => row[h])))]
    .join('\n');
  const txDataRows = transactions.map((row) => toCsvRow(txHeaders.map((h) => row[h])));
  const txChunks = [];
  for (let i = 0; i < txDataRows.length; i += TX_CHUNK_SIZE) {
    txChunks.push(txDataRows.slice(i, i + TX_CHUNK_SIZE));
  }
  const txFileNames = txChunks.map((_, idx) => `transactions_part${idx + 1}.csv`);
  const summaryRows = [toCsvRow(summaryHeaders), ...summaries.map((row) => toCsvRow(summaryHeaders.map((h) => row[h])))]
    .join('\n');

  fs.writeFileSync(path.join(OUTPUT_DIR, 'customers.csv'), customerRows, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'accounts.csv'), accountRows, 'utf8');

  // Clean previous transaction outputs before writing current chunks.
  fs.readdirSync(OUTPUT_DIR)
    .filter((name) => /^transactions(?:_part\d+)?\.csv$/i.test(name))
    .forEach((name) => fs.rmSync(path.join(OUTPUT_DIR, name), { force: true }));

  txChunks.forEach((chunk, idx) => {
    const content = [toCsvRow(txHeaders), ...chunk].join('\n');
    fs.writeFileSync(path.join(OUTPUT_DIR, txFileNames[idx]), content, 'utf8');
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'customer_transaction_summary.csv'), summaryRows, 'utf8');

  const manifest = {
    dataset_name: 'gemini_flash_ready_v1',
    generated_at_utc: new Date().toISOString(),
    seed: RANDOM_SEED,
    customer_count: CUSTOMER_COUNT,
    transactions_per_customer: TX_PER_CUSTOMER,
    total_transactions: CUSTOMER_COUNT * TX_PER_CUSTOMER,
    files: [
      'customers.csv',
      'accounts.csv',
      ...txFileNames,
      'customer_transaction_summary.csv'
    ],
    notes: [
      'Dataset contains raw behavioral and transactional fields.',
      'No precomputed risk scores or suspicious labels are included.',
      'Prepared for per-customer Gemini Flash analysis workloads.'
    ]
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  console.log(`Dataset generated in ${OUTPUT_DIR}`);
  console.log(`customers.csv rows: ${customers.length}`);
  console.log(`accounts.csv rows: ${accounts.length}`);
  txChunks.forEach((chunk, idx) => {
    console.log(`${txFileNames[idx]} rows: ${chunk.length}`);
  });
}

main();
