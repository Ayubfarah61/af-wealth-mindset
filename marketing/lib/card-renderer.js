// Forbidden-knowledge card renderer — 1080×1350 PNG.
// Uses workers-og (satori + resvg under the hood). All visuals must match SPEC.md.
//
// Input: { stamp, hook, accent_word, lead, list, brand }
// Output: PNG ArrayBuffer

import { ImageResponse } from 'workers-og';

const C = {
  midnight:     '#10243E',
  midnightDeep: '#081628',
  ivory:        '#F7F8F5',
  teal:         '#0F766E',
  tealBright:   '#1FE6D1',
  gold:         '#B88935',
  goldBright:   '#D7B46A',
  bodyDim:      'rgba(247,248,245,0.85)',
  border:       'rgba(31,230,209,0.18)',
};

const LOGO_URL = 'https://afwealthmindset.com/images/logo.png';

function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Replace the accent word in the hook with a teal-colored span.
function hookWithAccent(hook, accent) {
  const h = escapeHtml(hook);
  if (!accent) return h;
  const a = escapeHtml(accent);
  const idx = h.toLowerCase().indexOf(a.toLowerCase());
  if (idx === -1) return h;
  return h.slice(0, idx)
    + `<span style="color:${C.tealBright};font-style:italic;">${h.slice(idx, idx + a.length)}</span>`
    + h.slice(idx + a.length);
}

function buildHtml({ stamp, hook, accent_word, lead, list }) {
  const items = (list || []).map((item, i) => `
    <div style="display:flex;padding:14px 0 14px 0;border-bottom:1px solid ${C.border};font-size:30px;line-height:1.4;color:rgba(247,248,245,0.94);font-weight:500;align-items:flex-start;">
      <span style="color:${C.tealBright};font-weight:800;font-size:26px;margin-right:24px;font-family:Manrope;min-width:48px;">${String(i+1).padStart(2,'0')}</span>
      <span style="font-family:Manrope;">${escapeHtml(item)}</span>
    </div>
  `).join('');

  return `
  <div style="display:flex;flex-direction:column;width:1080px;height:1350px;
              background:radial-gradient(ellipse at 20% 10%, #1a3055 0%, ${C.midnight} 60%, ${C.midnightDeep} 100%);
              color:${C.ivory};padding:80px 72px;font-family:Manrope;position:relative;">

    <!-- Corner brackets -->
    <div style="position:absolute;top:30px;left:30px;width:60px;height:60px;border-top:3px solid ${C.tealBright};border-left:3px solid ${C.tealBright};opacity:0.55;"></div>
    <div style="position:absolute;bottom:30px;right:30px;width:60px;height:60px;border-bottom:3px solid ${C.tealBright};border-right:3px solid ${C.tealBright};opacity:0.55;"></div>

    <!-- Header -->
    <div style="display:flex;align-items:center;margin-bottom:38px;">
      <img src="${LOGO_URL}" width="80" height="80" style="margin-right:20px;"/>
      <div style="display:flex;flex-direction:column;">
        <div style="font-size:30px;font-weight:800;color:${C.ivory};line-height:1;">AF Wealth Mindset</div>
        <div style="font-size:16px;font-weight:700;color:${C.tealBright};margin-top:8px;letter-spacing:3px;text-transform:uppercase;">Money · Discipline · Truth</div>
      </div>
    </div>

    <!-- Stamp -->
    ${stamp ? `<div style="display:flex;align-self:flex-start;border:2px solid ${C.tealBright};color:${C.tealBright};
                            padding:6px 16px;font-size:14px;font-weight:800;letter-spacing:4px;text-transform:uppercase;
                            margin-bottom:32px;background:rgba(15,118,110,0.1);">${escapeHtml(stamp)}</div>` : ''}

    <!-- Hook -->
    <div style="font-family:Cormorant Garamond;font-style:italic;font-weight:700;font-size:64px;line-height:1.1;
                color:${C.ivory};margin-bottom:36px;letter-spacing:-0.01em;">
      ${hookWithAccent(hook, accent_word)}
    </div>

    ${lead ? `<div style="font-size:26px;line-height:1.5;color:${C.bodyDim};font-weight:500;font-style:italic;
                          margin-bottom:24px;font-family:Manrope;">${escapeHtml(lead)}</div>` : ''}

    <!-- List -->
    <div style="display:flex;flex-direction:column;flex:1;">
      ${items}
    </div>

    <!-- Footer -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(31,230,209,0.3);
                padding-top:20px;margin-top:24px;">
      <div style="font-size:18px;color:${C.tealBright};font-weight:700;letter-spacing:3px;text-transform:uppercase;font-family:Manrope;">afwealthmindset.com</div>
      <img src="${LOGO_URL}" width="36" height="36"/>
    </div>
  </div>`;
}

export async function renderCard(cardData) {
  const html = buildHtml(cardData);
  const response = new ImageResponse(html, {
    width: 1080,
    height: 1350,
    fonts: [
      {
        name: 'Manrope',
        data: await fontBuffer('https://cdn.jsdelivr.net/npm/@fontsource/manrope/files/manrope-latin-500-normal.woff'),
        weight: 500,
        style: 'normal',
      },
      {
        name: 'Manrope',
        data: await fontBuffer('https://cdn.jsdelivr.net/npm/@fontsource/manrope/files/manrope-latin-800-normal.woff'),
        weight: 800,
        style: 'normal',
      },
      {
        name: 'Cormorant Garamond',
        data: await fontBuffer('https://cdn.jsdelivr.net/npm/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-700-italic.woff'),
        weight: 700,
        style: 'italic',
      },
    ],
  });
  return response;
}

// Tiny font cache so we don't refetch on every render
const FONT_CACHE = new Map();
async function fontBuffer(url) {
  if (FONT_CACHE.has(url)) return FONT_CACHE.get(url);
  const r = await fetch(url);
  if (!r.ok) throw new Error('font fetch failed: ' + url);
  const buf = await r.arrayBuffer();
  FONT_CACHE.set(url, buf);
  return buf;
}
