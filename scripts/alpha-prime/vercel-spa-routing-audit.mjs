import fs from 'node:fs';

const CONFIG_PATH = 'vercel.json';
const REQUIRED_SOURCE = '/(.*)';
const REQUIRED_DESTINATION = '/index.html';
const REQUIRED_SPA_PATHS = ['/', '/listings', '/login', '/properties/REAL_PROPERTY_ID'];
const REQUIRED_NON_SPA_ROUTES = ['/functions/dynamicSitemap'];

function fail(message) {
  console.error(`VERCEL_SPA_ROUTING_AUDIT=FAIL ${message}`);
  process.exit(1);
}

if (!fs.existsSync(CONFIG_PATH)) {
  fail('vercel.json is missing');
}

let config;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
} catch (error) {
  fail(`vercel.json is not valid JSON: ${error.message}`);
}

if (!fs.existsSync('index.html')) {
  fail('index.html is missing; SPA fallback has no shell target');
}

if (!Array.isArray(config.rewrites)) {
  fail('rewrites must be an array');
}

const spaRewriteIndex = config.rewrites.findIndex(
  (rewrite) =>
    rewrite &&
    rewrite.source === REQUIRED_SOURCE &&
    rewrite.destination === REQUIRED_DESTINATION,
);

if (spaRewriteIndex < 0) {
  fail(`missing Vercel SPA fallback ${REQUIRED_SOURCE} -> ${REQUIRED_DESTINATION}`);
}

if (spaRewriteIndex !== config.rewrites.length - 1) {
  fail('SPA catch-all rewrite must be the final rewrite');
}

for (const route of REQUIRED_NON_SPA_ROUTES) {
  const protectedRouteIndex = config.rewrites.findIndex(
    (rewrite, index) =>
      index < spaRewriteIndex &&
      rewrite &&
      rewrite.source === route &&
      typeof rewrite.destination === 'string' &&
      rewrite.destination !== REQUIRED_DESTINATION,
  );

  if (protectedRouteIndex < 0) {
    fail(`${route} must be explicitly preserved before the SPA catch-all and must not resolve to index.html`);
  }
}

if (Array.isArray(config.routes) && config.routes.length > 0) {
  fail('legacy/custom routes are present; routing precedence must be reviewed before PASS');
}

console.log('VERCEL_SPA_ROUTING_AUDIT=PASS');
console.log(`CONFIG=${CONFIG_PATH}`);
console.log(`SPA_REWRITE=${REQUIRED_SOURCE} -> ${REQUIRED_DESTINATION}`);
console.log(`REPRESENTATIVE_SPA_DEEP_LINKS=${REQUIRED_SPA_PATHS.join(',')}`);
console.log(`REQUIRED_NON_SPA_ROUTES=${REQUIRED_NON_SPA_ROUTES.join(',')}`);
console.log('NOTE=Static configuration proof only. Exact-SHA deployed HTTP validation is still required, including application/xml for /functions/dynamicSitemap rather than SPA HTML.');
