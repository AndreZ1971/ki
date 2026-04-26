require('dotenv').config();
const axios = require('axios');

// Configuration
const WC_URL = process.env.WOOCOMMERCE_URL;
const WC_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WC_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

if (!WC_URL || !WC_KEY || !WC_SECRET) {
  console.error('❌ Fehlende Umgebungsvariablen. Bitte .env pruefen.');
  process.exit(1);
}

const AUTH_HEADER = 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');
const API_BASE = `${WC_URL.replace(/\/$/, '')}/wp-json/wc/v3`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// WooCommerce API Helpers
async function wcGet(endpoint, params = {}) {
  try {
    const response = await axios.get(`${API_BASE}${endpoint}`, {
      headers: { Authorization: AUTH_HEADER },
      params: { per_page: 100, ...params },
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error(`  ⚠️  GET ${endpoint} fehlgeschlagen: ${msg}`);
    return null;
  }
}

async function wcPost(endpoint, data) {
  try {
    const response = await axios.post(`${API_BASE}${endpoint}`, data, {
      headers: {
        Authorization: AUTH_HEADER,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error(`  ⚠️  POST ${endpoint} fehlgeschlagen: ${msg}`);
    return null;
  }
}

async function wcDelete(endpoint, force = true) {
  try {
    const response = await axios.delete(`${API_BASE}${endpoint}`, {
      headers: { Authorization: AUTH_HEADER },
      params: { force },
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error(`  ⚠️  DELETE ${endpoint} fehlgeschlagen: ${msg}`);
    return null;
  }
}

async function wcPut(endpoint, data) {
  try {
    const response = await axios.put(`${API_BASE}${endpoint}`, data, {
      headers: {
        Authorization: AUTH_HEADER,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error(`  ⚠️  PUT ${endpoint} fehlgeschlagen: ${msg}`);
    return null;
  }
}

// Task 3: Categories
const DEMO_CATEGORIES = [
  { name: 'Rotwein', slug: 'rotwein-demo', description: 'Edle Rotweine aus den besten Anbaugebieten der Welt.' },
  { name: 'Weisswein', slug: 'weisswein-demo', description: 'Frische und charaktervolle Weissweine fuer jeden Anlass.' },
  { name: 'Schaumwein', slug: 'schaumwein-demo', description: 'Champagner, Prosecco und Cremant fuer besondere Momente.' },
  { name: 'Feinkost & Delikatessen', slug: 'feinkost-demo', description: 'Erlesene Delikatessen aus den Kuechen der Welt.' },
  { name: 'Wein-Sets & Geschenke', slug: 'weinsets-demo', description: 'Kuratierte Weinsets und Geschenkideen fuer Geniesser.' },
];

async function createCategories() {
  console.log('\n🗂️  Erstelle Kategorien...');
  const existing = (await wcGet('/products/categories', { per_page: 100 })) || [];
  const existingBySlug = new Map(existing.map((c) => [c.slug, c]));
  const categoryMap = {};

  for (const cat of DEMO_CATEGORIES) {
    if (existingBySlug.has(cat.slug)) {
      const found = existingBySlug.get(cat.slug);
      categoryMap[cat.slug] = found.id;
      console.log(`  ⏭️  Kategorie "${found.name}" existiert bereits (ID: ${found.id})`);
      continue;
    }

    await sleep(200);
    const created = await wcPost('/products/categories', cat);
    if (created) {
      categoryMap[cat.slug] = created.id;
      console.log(`  ✅ Kategorie "${created.name}" erstellt (ID: ${created.id})`);
    }
  }

  console.log(`✅ Kategorien bereit: ${Object.keys(categoryMap).length}/5`);
  return categoryMap;
}

// Task 4: Products
function buildProducts(categoryMap) {
  const base = [
    ['WEIN-ROT-001', 'Chateau Margaux Reserve 2019', 'rotwein-demo', '89.90'],
    ['WEIN-ROT-002', 'Barolo DOCG Riserva 2018', 'rotwein-demo', '74.50'],
    ['WEIN-ROT-003', 'Rioja Gran Reserva 2017', 'rotwein-demo', '45.90'],
    ['WEIN-ROT-004', 'Malbec Alto Valle 2020', 'rotwein-demo', '32.90'],
    ['WEIN-ROT-005', 'Pinot Noir Bourgogne 2021', 'rotwein-demo', '38.50'],
    ['WEIN-ROT-006', 'Amarone della Valpolicella 2016', 'rotwein-demo', '98.00'],
    ['WEIN-ROT-007', 'Shiraz Barossa Valley 2019', 'rotwein-demo', '42.90'],
    ['WEIN-ROT-008', 'Cabernet Sauvignon Napa 2020', 'rotwein-demo', '67.00'],
    ['WEIN-WEI-001', 'Chablis Premier Cru 2022', 'weisswein-demo', '54.90'],
    ['WEIN-WEI-002', 'Riesling Spaetlese Mosel 2021', 'weisswein-demo', '28.50'],
    ['WEIN-WEI-003', 'Gruener Veltliner Smaragd 2022', 'weisswein-demo', '35.90'],
    ['WEIN-WEI-004', 'Sauvignon Blanc Marlborough 2023', 'weisswein-demo', '22.90'],
    ['WEIN-WEI-005', 'Chardonnay Burgundy Blanc 2021', 'weisswein-demo', '48.00'],
    ['WEIN-WEI-006', 'Gewuerztraminer Alsace 2022', 'weisswein-demo', '31.50'],
    ['WEIN-WEI-007', 'Pinot Gris Grand Cru 2020', 'weisswein-demo', '59.90'],
    ['WEIN-SCH-001', 'Champagne Brut Millesime 2018', 'schaumwein-demo', '89.00'],
    ['WEIN-SCH-002', 'Prosecco Superiore DOCG', 'schaumwein-demo', '18.90'],
    ['WEIN-SCH-003', 'Cremant d Alsace Brut Rose', 'schaumwein-demo', '24.50'],
    ['FEINK-001', 'Trueffel-Olivenoel Extra Virgin 250ml', 'feinkost-demo', '34.90'],
    ['FEINK-002', 'Parmigiano Reggiano DOP 24 Monate', 'feinkost-demo', '28.50'],
    ['FEINK-003', 'Beluga Kaviar Sibirisch 50g', 'feinkost-demo', '149.00'],
    ['FEINK-004', 'Foie Gras de Canard Entier 200g', 'feinkost-demo', '54.90'],
    ['FEINK-005', 'Aceto Balsamico Tradizionale 25 Jahre', 'feinkost-demo', '89.00'],
    ['FEINK-006', 'Iberico de Bellota Schinken 100g', 'feinkost-demo', '42.00'],
    ['FEINK-007', 'Fleur de Sel de Guerande 250g', 'feinkost-demo', '12.90'],
  ];

  return base.map(([sku, name, catSlug, price], index) => ({
    name,
    sku,
    type: 'simple',
    status: 'draft',
    regular_price: price,
    description: `${name} ist ein hochwertiges Demo-Produkt fuer die A.R.I. Sommelier-Demo mit detaillierter Genussbeschreibung und realistischer Shop-Praesentation.`,
    short_description: `${name} - hochwertiges Demo-Produkt fuer Wein & Feinkost Analytics.`,
    categories: [{ id: categoryMap[catSlug] }],
    tags: [{ name: 'ari-demo' }, { name: 'sommelier' }],
    stock_quantity: Math.max(8, 50 - index),
    manage_stock: true,
    weight: sku.startsWith('FEINK') ? '0.5' : '1.3',
    dimensions: sku.startsWith('FEINK')
      ? { length: '12', width: '8', height: '6' }
      : { length: '31', width: '9', height: '9' },
    meta_data: [{ key: '_ari_demo', value: 'true' }],
  }));
}

async function createProducts(categoryMap) {
  console.log('\n🍷 Erstelle Produkte...');
  const products = buildProducts(categoryMap);
  const existingProducts = (await wcGet('/products', { per_page: 100, status: 'any' })) || [];
  const existingBySku = new Map(existingProducts.filter((p) => p.sku).map((p) => [p.sku, p]));

  const productIdMap = {};
  let created = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = existingBySku.get(product.sku);
    if (existing) {
      productIdMap[product.sku] = existing.id;
      console.log(`  ⏭️  Produkt "${product.name}" (${product.sku}) existiert bereits`);
      skipped++;
      continue;
    }

    await sleep(200);
    const result = await wcPost('/products', product);
    if (result) {
      productIdMap[product.sku] = result.id;
      created++;
      console.log(`  ✅ [${created + skipped}/25] "${result.name}" erstellt (ID: ${result.id})`);
    }
  }

  console.log(`✅ Produkte: ${created} erstellt, ${skipped} uebersprungen`);
  return productIdMap;
}

// Task 5: Customers
const DEMO_CUSTOMERS = [
  { first_name: 'Hans', last_name: 'Berger', email: 'hans.berger@demo-wein.de', city: 'Berlin', postcode: '10115', state: 'BE' },
  { first_name: 'Maria', last_name: 'Schmidt', email: 'maria.schmidt@demo-wein.de', city: 'Muenchen', postcode: '80331', state: 'BY' },
  { first_name: 'Klaus', last_name: 'Weber', email: 'klaus.weber@demo-wein.de', city: 'Hamburg', postcode: '20095', state: 'HH' },
  { first_name: 'Anna', last_name: 'Fischer', email: 'anna.fischer@demo-wein.de', city: 'Frankfurt', postcode: '60311', state: 'HE' },
  { first_name: 'Stefan', last_name: 'Mueller', email: 'stefan.mueller@demo-wein.de', city: 'Koeln', postcode: '50667', state: 'NW' },
  { first_name: 'Laura', last_name: 'Becker', email: 'laura.becker@demo-wein.de', city: 'Stuttgart', postcode: '70173', state: 'BW' },
  { first_name: 'Thomas', last_name: 'Hoffmann', email: 'thomas.hoffmann@demo-wein.de', city: 'Duesseldorf', postcode: '40213', state: 'NW' },
  { first_name: 'Sabine', last_name: 'Koch', email: 'sabine.koch@demo-wein.de', city: 'Leipzig', postcode: '04109', state: 'SN' },
  { first_name: 'Michael', last_name: 'Schaefer', email: 'michael.schaefer@demo-wein.de', city: 'Berlin', postcode: '10178', state: 'BE' },
  { first_name: 'Christine', last_name: 'Bauer', email: 'christine.bauer@demo-wein.de', city: 'Muenchen', postcode: '80333', state: 'BY' },
  { first_name: 'Peter', last_name: 'Zimmermann', email: 'peter.zimmermann@demo-wein.de', city: 'Hamburg', postcode: '20144', state: 'HH' },
  { first_name: 'Monika', last_name: 'Wagner', email: 'monika.wagner@demo-wein.de', city: 'Frankfurt', postcode: '60313', state: 'HE' },
  { first_name: 'Wolfgang', last_name: 'Braun', email: 'wolfgang.braun@demo-wein.de', city: 'Koeln', postcode: '50668', state: 'NW' },
  { first_name: 'Elisabeth', last_name: 'Schulz', email: 'elisabeth.schulz@demo-wein.de', city: 'Stuttgart', postcode: '70174', state: 'BW' },
  { first_name: 'Rainer', last_name: 'Krause', email: 'rainer.krause@demo-wein.de', city: 'Duesseldorf', postcode: '40215', state: 'NW' },
  { first_name: 'Helga', last_name: 'Meyer', email: 'helga.meyer@demo-wein.de', city: 'Leipzig', postcode: '04103', state: 'SN' },
  { first_name: 'Andreas', last_name: 'Lange', email: 'andreas.lange@demo-wein.de', city: 'Berlin', postcode: '10117', state: 'BE' },
  { first_name: 'Ursula', last_name: 'Richter', email: 'ursula.richter@demo-wein.de', city: 'Muenchen', postcode: '80335', state: 'BY' },
  { first_name: 'Juergen', last_name: 'Hartmann', email: 'juergen.hartmann@demo-wein.de', city: 'Hamburg', postcode: '20146', state: 'HH' },
  { first_name: 'Renate', last_name: 'Lehmann', email: 'renate.lehmann@demo-wein.de', city: 'Frankfurt', postcode: '60316', state: 'HE' },
  { first_name: 'Frank', last_name: 'Neumann', email: 'frank.neumann@demo-wein.de', city: 'Koeln', postcode: '50670', state: 'NW' },
  { first_name: 'Brigitte', last_name: 'Klein', email: 'brigitte.klein@demo-wein.de', city: 'Stuttgart', postcode: '70176', state: 'BW' },
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function createCustomers() {
  console.log('\n👥 Erstelle Kunden...');

  const existingCustomers = (await wcGet('/customers', { per_page: 100 })) || [];
  const existingByEmail = new Map(existingCustomers.map((c) => [c.email, c]));

  const customerIdMap = {};
  let created = 0;
  let skipped = 0;

  for (const cust of DEMO_CUSTOMERS) {
    const existing = existingByEmail.get(cust.email);
    if (existing) {
      skipped++;
      customerIdMap[cust.email] = existing.id;
      console.log(`  ⏭️  Kunde "${cust.first_name} ${cust.last_name}" existiert bereits`);
      continue;
    }

    await sleep(200);
    const payload = {
      email: cust.email,
      first_name: cust.first_name,
      last_name: cust.last_name,
      username: cust.email.split('@')[0],
      billing: {
        first_name: cust.first_name,
        last_name: cust.last_name,
        address_1: `Musterstrasse ${randomBetween(1, 99)}`,
        city: cust.city,
        postcode: cust.postcode,
        state: cust.state,
        country: 'DE',
        email: cust.email,
        phone: `+49 ${randomBetween(100, 999)} ${randomBetween(1000000, 9999999)}`,
      },
      shipping: {
        first_name: cust.first_name,
        last_name: cust.last_name,
        address_1: `Musterstrasse ${randomBetween(1, 99)}`,
        city: cust.city,
        postcode: cust.postcode,
        state: cust.state,
        country: 'DE',
      },
      meta_data: [{ key: '_ari_demo', value: 'true' }],
    };

    const result = await wcPost('/customers', payload);
    if (result) {
      created++;
      customerIdMap[cust.email] = result.id;
      console.log(`  ✅ [${created + skipped}/22] "${result.first_name} ${result.last_name}" erstellt (ID: ${result.id})`);
    }
  }

  console.log(`✅ Kunden: ${created} erstellt, ${skipped} uebersprungen`);
  return customerIdMap;
}

// Task 6: Orders
function buildOrderDefinitions(productIdMap, customerIdMap) {
  const customerEmails = Object.keys(customerIdMap);
  const skus = Object.keys(productIdMap);
  const redWineSkus = skus.filter((s) => s.startsWith('WEIN-ROT'));
  const whiteWineSkus = skus.filter((s) => s.startsWith('WEIN-WEI'));
  const sparklingSkus = skus.filter((s) => s.startsWith('WEIN-SCH'));
  const deliSkus = skus.filter((s) => s.startsWith('FEINK'));

  const phases = [
    { daysRange: [90, 61], count: 12, statuses: ['completed', 'completed', 'completed', 'failed'] },
    { daysRange: [60, 31], count: 20, statuses: ['completed', 'completed', 'failed', 'processing'] },
    { daysRange: [30, 8], count: 28, statuses: ['completed', 'completed', 'completed', 'failed', 'on-hold'] },
    { daysRange: [7, 1], count: 15, statuses: ['completed', 'completed', 'processing', 'completed'] },
  ];

  const lineItems = (skuPool, n) =>
    Array.from({ length: n }).map(() => ({
      product_id: productIdMap[pickRandom(skuPool)],
      quantity: randomBetween(1, 3),
    }));

  const orders = [];

  for (const phase of phases) {
    for (let i = 0; i < phase.count; i++) {
      const custEmail = pickRandom(customerEmails);
      const custData = DEMO_CUSTOMERS.find((c) => c.email === custEmail);
      const status = phase.statuses[i % phase.statuses.length];
      const daysBack = randomBetween(phase.daysRange[1], phase.daysRange[0]);

      let pool = [...redWineSkus, ...whiteWineSkus, ...sparklingSkus, ...deliSkus];
      let itemCount = 1;
      if (phase.count >= 20) itemCount = randomBetween(1, 3);
      if (phase.count >= 28) itemCount = randomBetween(2, 4);

      orders.push({
        status,
        customer_id: customerIdMap[custEmail],
        date_created: daysAgo(daysBack),
        billing: {
          first_name: custData.first_name,
          last_name: custData.last_name,
          address_1: `Musterstrasse ${randomBetween(1, 99)}`,
          city: custData.city,
          postcode: custData.postcode,
          state: custData.state,
          country: 'DE',
          email: custData.email,
          phone: `+49 ${randomBetween(100, 999)} ${randomBetween(1000000, 9999999)}`,
        },
        shipping: {
          first_name: custData.first_name,
          last_name: custData.last_name,
          address_1: `Musterstrasse ${randomBetween(1, 99)}`,
          city: custData.city,
          postcode: custData.postcode,
          state: custData.state,
          country: 'DE',
        },
        payment_method: 'bacs',
        payment_method_title: 'Bankueberweisung',
        set_paid: status === 'completed',
        line_items: lineItems(pool, itemCount),
        meta_data: [{ key: '_ari_demo', value: 'true' }],
      });
    }
  }

  return orders;
}

async function createOrders(productIdMap, customerIdMap) {
  console.log('\n📦 Erstelle Bestellungen (75 Stueck)...');

  const existingOrders = (await wcGet('/orders', { per_page: 100 })) || [];
  const existingDemoOrders = existingOrders.filter((o) =>
    o.meta_data?.some((m) => m.key === '_ari_demo' && m.value === 'true')
  );

  if (existingDemoOrders.length >= 75) {
    console.log(`  ⏭️  ${existingDemoOrders.length} Demo-Bestellungen existieren bereits — uebersprungen`);
    return;
  }

  const defs = buildOrderDefinitions(productIdMap, customerIdMap);
  const toCreate = defs.slice(existingDemoOrders.length, 75);

  let created = existingDemoOrders.length;
  for (const orderDef of toCreate) {
    await sleep(200);
    const result = await wcPost('/orders', orderDef);
    if (result) {
      created++;
      const icon = result.status === 'completed' ? '✅' : result.status === 'failed' ? '❌' : '🔄';
      console.log(`  ${icon} [${created}/75] Bestellung #${result.id} (${result.status}) erstellt`);
    }
  }

  console.log(`✅ Bestellungen: ${created}/75 vorhanden`);
}

// Task 7: Seed / Status / Cleanup
async function runSeed() {
  console.log('🚀 A.R.I. Demo-Seed startet — Wein & Feinkost / Sommelier-Edition');
  console.log(`   Shop: ${WC_URL}`);
  console.log('   Erstelle: 5 Kategorien, 25 Produkte, 22 Kunden, 75 Bestellungen\n');

  const categoryMap = await createCategories();
  const productIdMap = await createProducts(categoryMap);
  const customerIdMap = await createCustomers();
  await createOrders(productIdMap, customerIdMap);

  console.log('\n🎉 Demo-Seed abgeschlossen!');
  console.log('   ℹ️  Alle Produkte sind als "Entwurf" gespeichert — nicht oeffentlich sichtbar');
  console.log('   ℹ️  Cleanup: node ari-demo-seed.js cleanup');
}

async function runStatus() {
  console.log('📊 A.R.I. Demo-Seed Status\n');

  const [categories, products, customers, orders] = await Promise.all([
    wcGet('/products/categories', { per_page: 100 }),
    wcGet('/products', { per_page: 100, status: 'any' }),
    wcGet('/customers', { per_page: 100 }),
    wcGet('/orders', { per_page: 100 }),
  ]);

  const demoCats = (categories || []).filter((c) =>
    ['rotwein-demo', 'weisswein-demo', 'schaumwein-demo', 'feinkost-demo', 'weinsets-demo'].includes(c.slug)
  );

  const hasDemoMeta = (x) => x.meta_data?.some((m) => m.key === '_ari_demo' && m.value === 'true');
  const demoProducts = (products || []).filter(hasDemoMeta);
  const demoCustomers = (customers || []).filter(hasDemoMeta);
  const demoOrders = (orders || []).filter(hasDemoMeta);

  const orderStatusCounts = demoOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`🗂️  Kategorien:   ${demoCats.length}/5`);
  console.log(`🍷 Produkte:     ${demoProducts.length}/25 (alle status: draft)`);
  console.log(`👥 Kunden:       ${demoCustomers.length}/22`);
  console.log(`📦 Bestellungen: ${demoOrders.length}/75`);
  if (demoOrders.length > 0) {
    console.log('   Status-Verteilung:', JSON.stringify(orderStatusCounts, null, 2));
  }

  const ok = demoCats.length === 5 && demoProducts.length === 25 && demoCustomers.length === 22 && demoOrders.length === 75;
  console.log(`\n${ok ? '✅ Vollstaendig eingespielt' : '⚠️  Nicht vollstaendig — "node ari-demo-seed.js seed" ausfuehren'}`);
}

async function runCleanup() {
  console.log('🧹 A.R.I. Demo-Daten werden geloescht...\n');
  const hasDemoMeta = (x) => x.meta_data?.some((m) => m.key === '_ari_demo' && m.value === 'true');

  console.log('📦 Loesche Bestellungen...');
  let deletedOrders = 0;
  const allOrders = (await wcGet('/orders', { per_page: 100 })) || [];
  for (const order of allOrders.filter(hasDemoMeta)) {
    await sleep(200);
    const result = await wcDelete(`/orders/${order.id}`, true);
    if (result) {
      deletedOrders++;
      console.log(`  🗑️  Bestellung #${order.id} geloescht`);
    }
  }
  console.log(`  ✅ ${deletedOrders} Bestellungen geloescht\n`);

  console.log('👥 Loesche Kunden...');
  let deletedCustomers = 0;
  const allCustomers = (await wcGet('/customers', { per_page: 100 })) || [];
  for (const customer of allCustomers.filter(hasDemoMeta)) {
    await sleep(200);
    const result = await wcDelete(`/customers/${customer.id}`, true);
    if (result) {
      deletedCustomers++;
      console.log(`  🗑️  Kunde "${customer.first_name} ${customer.last_name}" geloescht`);
    }
  }
  console.log(`  ✅ ${deletedCustomers} Kunden geloescht\n`);

  console.log('🍷 Loesche Produkte...');
  let deletedProducts = 0;
  const allProducts = (await wcGet('/products', { per_page: 100, status: 'any' })) || [];
  for (const product of allProducts.filter(hasDemoMeta)) {
    await sleep(200);
    const result = await wcDelete(`/products/${product.id}`, true);
    if (result) {
      deletedProducts++;
      console.log(`  🗑️  Produkt "${product.name}" geloescht`);
    }
  }
  console.log(`  ✅ ${deletedProducts} Produkte geloescht\n`);

  console.log('🗂️  Loesche Kategorien...');
  let deletedCats = 0;
  const demoSlugs = ['rotwein-demo', 'weisswein-demo', 'schaumwein-demo', 'feinkost-demo', 'weinsets-demo'];
  const allCats = (await wcGet('/products/categories', { per_page: 100 })) || [];
  for (const cat of allCats.filter((c) => demoSlugs.includes(c.slug))) {
    await sleep(200);
    const result = await wcDelete(`/products/categories/${cat.id}`, true);
    if (result) {
      deletedCats++;
      console.log(`  🗑️  Kategorie "${cat.name}" geloescht`);
    }
  }
  console.log(`  ✅ ${deletedCats} Kategorien geloescht\n`);

  console.log('🎉 Cleanup abgeschlossen — Shop ist wieder sauber!');
}

// Entry point
const command = process.argv[2];

(async () => {
  switch (command) {
    case 'seed':
      await runSeed();
      break;
    case 'cleanup':
      await runCleanup();
      break;
    case 'status':
      await runStatus();
      break;
    default:
      console.log('Verwendung: node ari-demo-seed.js [seed|cleanup|status]');
      process.exit(0);
  }
})();
