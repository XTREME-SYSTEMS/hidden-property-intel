import fs from 'node:fs';

const CONFIG_PATH = 'vercel.json';
const REQUIRED_SOURCE = '/(.*)';
const REQUIRED_DESTINATION = '/index.html';
const REQUIRED_PATHS = ['/', '/listings', '/login', '/properties/REAL_PROPERTY_ID'];

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

const spaRewrite = config.rewrites.find(
  (rewrite) =>
    rewrite &&
    rewrite.source === REQUIRED_SOURCE &&
    rewrite.destination === REQUIRED_DESTINATION,
);

if (!spaRewrite) {
  fail(`missing Vercel SPA fallback ${REQUIRED_SOURCE} -> ${REQUIRED_DESTINATION}`);
}

if (config.rewrites.at(-1) !== spaRewrite) {
  fail('SPA catch-all rewrite must be the final rewrite');
}

if (Array.isArray(config.routes) && config.routes.length > 0) {
  fail('legacy/custom routes are present; routing precedence must be reviewed before PASS');
}

console.log('VERCEL_SPA_ROUTING_AUDIT=PASS');
console.log(`CONFIG=${CONFIG_PATH}`);
console.log(`SPA_REWRITE=${REQUIRED_SOURCE} -> ${REQUIRED_DESTINATION}`);
console.log(`REPRESENTATIVE_DEEP_LINKS=${REQUIRED_PATHS.join(',')}`);
console.log('NOTE=Static configuration proof only. Exact-SHA deployed-route HTTP validation is still required.');
