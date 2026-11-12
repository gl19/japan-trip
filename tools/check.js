#!/usr/bin/env node
// Run before every push: node tools/check.js
// Checks that the trip data parses, the app script compiles and renders for every
// traveler, and that nothing private (booking codes, PINs, emails) is in the data.
// This site is public, so a failed privacy check blocks publishing.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dataMatch = html.match(/<script type="application\/json" id="trip-data">([\s\S]*?)<\/script>/);
const codeMatch = html.match(/<script id="app-code">([\s\S]*?)<\/script>/);
if (!dataMatch || !codeMatch) fail('Could not find the trip-data or app-code script blocks in index.html.');

let trip;
try { trip = JSON.parse(dataMatch[1]); } catch (e) { fail('trip-data is not valid JSON: ' + e.message); }
try { new vm.Script(codeMatch[1]); } catch (e) { fail('app-code has a syntax error: ' + e.message); }

const problems = [];
const raw = dataMatch[1];
(trip.items || []).forEach(it => {
  if ('conf' in it) problems.push(`"${it.title}" has a conf (confirmation code) field`);
  if (!it.id || !it.type || !it.title) problems.push(`an item is missing id, type or title: ${JSON.stringify(it).slice(0, 80)}`);
});
if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(raw)) problems.push('an email address is in the data');
if (/\bPIN\b/i.test(raw)) problems.push('a PIN is mentioned in the data');
const seat = raw.match(/seats?\b[^"\\]{0,40}?\b\d{1,2}[A-K]\b/i);
if (seat) problems.push(`seat numbers are in the data ("${seat[0]}")`);
const codeLike = raw.match(/\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6,}\b|\b\d{8,}\b/g) || [];
codeLike.forEach(c => problems.push(`"${c}" looks like a booking code or reference number`));
const ids = (trip.items || []).map(i => i.id);
ids.filter((id, k) => ids.indexOf(id) !== k).forEach(id => problems.push(`duplicate item id "${id}"`));

function render(viewer) {
  const app = { innerHTML: '' };
  const els = { 'trip-data': { textContent: dataMatch[1] }, app };
  const store = { 'jptrip-viewer': JSON.stringify(viewer) };
  vm.runInNewContext(codeMatch[1], {
    document: { getElementById: id => els[id] || null, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: { classList: { add() {}, remove() {} }, appendChild() {} }, head: null, contains: () => false },
    window: { scrollY: 0, scrollTo() {}, addEventListener() {}, matchMedia: () => ({ matches: true }) },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem() {}, removeItem() {} },
    location: { hash: '' },
    requestAnimationFrame: () => 0, setInterval: () => 0, setTimeout: () => 0, clearTimeout() {}, console
  });
  return app.innerHTML;
}
const text = h => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
for (const person of [''].concat(trip.travelers || [])) {
  let h;
  try { h = render(person); } catch (e) { problems.push(`the page failed to render for ${person || 'Everyone'}: ${e.message}`); continue; }
  const facts = text((h.match(/<div class="facts">[\s\S]*?<\/div>/) || [''])[0]);
  const route = text((h.match(/<nav class="route-wrap"[\s\S]*?<\/nav>/) || [''])[0]);
  console.log(`${(person || 'Everyone').padEnd(9)} ${facts}\n          ${route}`);
}

if (problems.length) fail('Not ready to publish:\n- ' + problems.join('\n- '));
console.log(`\nOK: ${trip.items.length} items, nothing private found.`);

function fail(msg) { console.error('\n' + msg); process.exit(1); }
