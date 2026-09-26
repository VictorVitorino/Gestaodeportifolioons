// Lucide-style line icons (24x24) used by the FLOWS UI replicas.
const P = {
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  library: '<rect x="7.5" y="2.5" width="13" height="16" rx="2"/><path d="M4 6.5V19a2.5 2.5 0 0 0 2.5 2.5H16"/><path d="M11 7.5h6M11 11h6M11 14.5h4"/>',
  user: '<circle cx="12" cy="8" r="4.5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  star: '<path d="M12 2.8l2.84 5.76 6.36.93-4.6 4.48 1.09 6.33L12 17.3l-5.69 2.99 1.09-6.33-4.6-4.48 6.36-.93z"/>',
  chart: '<rect x="4" y="12.5" width="4" height="8" rx=".6"/><rect x="10" y="4.5" width="4" height="16" rx=".6"/><rect x="16" y="9" width="4" height="11.5" rx=".6"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  listpen: '<path d="M3 5.5h16M3 11h11M3 16.5h7"/><path d="M19.2 12.3a1.6 1.6 0 0 1 2.3 2.3L16 20.1l-3.1.8.8-3.1z"/>',
  lang: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  updown: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.6-4.6"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  uptoline: '<path d="M5 3h14"/><path d="m18 13-6-6-6 6"/><path d="M12 7v14"/>',
  fileplus: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 18v-6"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  network: '<circle cx="12" cy="12" r="2.6"/><circle cx="4.8" cy="5" r="2.1"/><circle cx="19.2" cy="5" r="2.1"/><circle cx="4.8" cy="19" r="2.1"/><circle cx="19.2" cy="19" r="2.1"/><circle cx="12" cy="3" r="1.4"/><path d="M6.5 6.6 10 10M17.5 6.6 14 10M6.5 17.4 10 14M17.5 17.4 14 14M12 4.5v5"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  award: '<circle cx="12" cy="9" r="6.5"/><path d="M12 5.8l1.1 2.2 2.4.35-1.75 1.7.4 2.4L12 11.3l-2.15 1.15.4-2.4L8.5 8.35l2.4-.35z"/><path d="M8.5 14.5 7 22l5-2.6 5 2.6-1.5-7.5"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevdown: '<path d="m6 9 6 6 6-6"/>',
  arrowright: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  folderzip: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M14 10h2M14 13h2M14 16h2"/><path d="M12 11.5h2M12 14.5h2"/>',
  filetext: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
  braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  sparkles: '<path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9z"/><path d="M19 3v4M17 5h4M5 17v4M3 19h4"/>',
  scale: '<path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
};
export function icon(name, cls = '', sw = 2) {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
}
export function dots(cls = '') {
  let c = '';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c += `<circle cx="${5 + j * 7}" cy="${5 + i * 7}" r="2.1"/>`;
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="currentColor">${c}</svg>`;
}
export function claudeMark(cls = '') {
  let r = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, l = i % 2 ? 8.2 : 10.5;
    r += `<path d="M12 12 L${(12 + Math.cos(a) * l).toFixed(2)} ${(12 + Math.sin(a) * l).toFixed(2)}" />`;
  }
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="#e8743b" stroke-width="2.6" stroke-linecap="round">${r}</svg>`;
}
export function cursorSvg() {
  return `<svg viewBox="0 0 40 48" width="40" height="48"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e8eefb"/></linearGradient></defs><path d="M4 3 L4 38 L13 30 L19.5 44 L26 41 L19.6 27.5 L31 27 Z" fill="url(#cg)" stroke="#0e2352" stroke-width="2.6" stroke-linejoin="round"/></svg>`;
}
