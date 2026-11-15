import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildStandaloneHtml} from './standalone-html';

test('buildStandaloneHtml integrates Calculadora Nutricional cleanly without preview script, rightpanel, or download button', () => {
  const html = buildStandaloneHtml();

  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<html lang="es">/);
  assert.match(html, /<title>Calculadora Nutricional<\/title>/);

  // Clean output: no AI Studio iframe script, no Tailwind CDN, no download button, no right panel
  assert.doesNotMatch(html, /_aistudio-iframe/i);
  assert.doesNotMatch(html, /tailwindcss/i);
  assert.doesNotMatch(html, /descargar/i);
  assert.doesNotMatch(html, /rightpanel/i);
  assert.doesNotMatch(html, /closeSidebar/i);

  // Integrated content: sidebar sections, 5 cards, FAB
  assert.match(html, /id="sidebar"/);
  assert.match(html, /id="sidebarInner"/);
  assert.match(html, /id="sidebarShadow"/);
  assert.match(html, /id="overlay"/);
  assert.match(html, /id="envoltorio"/);
  assert.match(html, /id="openSidebar"/);
  assert.doesNotMatch(html, /transition:\s*[^;]*box-shadow/);
  assert.match(html, /Desayuno/);
  assert.match(html, /Almuerzo/);
  assert.match(html, /Merienda/);
  assert.match(html, /Cena/);
  assert.match(html, /Resumen Total/);
  assert.match(html, /class="fab"/);

  // Flat surfaces: no box-shadow or hover transform animations on cards, FAB, or header; clean header without bottom border
  assert.doesNotMatch(html, /--elevation-3/);
  assert.doesNotMatch(html, /\.card:hover/);
  assert.doesNotMatch(html, /\.fab:hover/);
  assert.doesNotMatch(html, /header\s*\{[^}]*border-bottom/);

  // Scroll lock preserves sticky header at viewport top when scrolled down
  assert.match(html, /body\.drawer-scroll-locked\s*\{[^}]*overflow-y:\s*visible/);

  // Hidden scrollbars on main page and sidebar
  assert.match(html, /\.sidebar::-webkit-scrollbar\s*\{[^}]*display:\s*none/);
  assert.match(html, /\.sidebar\s*\{[^}]*scrollbar-width:\s*none/);
});

test('embedded script in buildStandaloneHtml parses with zero syntax errors', () => {
  const html = buildStandaloneHtml();
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match && match[1], 'Expected inline <script> block');

  assert.doesNotThrow(() => {
    new vm.Script(match[1]);
  });
});
