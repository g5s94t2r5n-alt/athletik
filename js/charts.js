// Schlanke SVG-Diagramme: Liniendiagramm mit Fadenkreuz-Tooltip, Balkendiagramm, Tabellenansicht.
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};
const fmtDate = (iso) => { const [, m, d] = iso.split('-'); return `${d}.${m}.`; };
const fmtNum = (v) => (Math.round(v * 10) / 10).toLocaleString('de-DE');

function niceTicks(min, max, count = 4) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => span / s <= count) || mag * 10;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

function tableView(rows, headers) {
  const wrap = document.createElement('div');
  wrap.className = 'chart-table';
  const t = document.createElement('table');
  const tr = t.insertRow();
  headers.forEach((h) => { const th = document.createElement('th'); th.textContent = h; tr.appendChild(th); });
  [...rows].reverse().forEach((r) => {
    const row = t.insertRow();
    r.forEach((c) => { row.insertCell().textContent = c; });
  });
  wrap.appendChild(t);
  return wrap;
}

function frame(container, { title, sub, table }) {
  container.textContent = '';
  const card = document.createElement('div');
  card.className = 'chart-card';
  const head = document.createElement('div');
  head.className = 'chart-head';
  const h = document.createElement('div');
  const ht = document.createElement('div'); ht.className = 'chart-title'; ht.textContent = title;
  h.appendChild(ht);
  if (sub) { const hs = document.createElement('div'); hs.className = 'chart-sub'; hs.textContent = sub; h.appendChild(hs); }
  head.appendChild(h);
  const btn = document.createElement('button');
  btn.className = 'chip small';
  btn.textContent = 'Tabelle';
  head.appendChild(btn);
  card.appendChild(head);
  const body = document.createElement('div');
  body.className = 'chart-body';
  card.appendChild(body);
  let tbl = null;
  btn.addEventListener('click', () => {
    if (tbl) { tbl.remove(); tbl = null; btn.textContent = 'Tabelle'; return; }
    tbl = table(); card.appendChild(tbl); btn.textContent = 'Diagramm';
  });
  container.appendChild(card);
  return body;
}

// series: [{name, color, key, style:'line'|'dots', fmt}]
// rows: [{date, ...values}]
export function lineChart(container, { title, sub, rows, series, unit = 'kg', tableHeaders, tableRow, empty }) {
  const body = frame(container, {
    title, sub,
    table: () => tableView(rows.map(tableRow), tableHeaders),
  });
  if (!rows.length) {
    const p = document.createElement('p'); p.className = 'muted center'; p.textContent = empty || 'Noch keine Daten.';
    body.appendChild(p); return;
  }
  if (series.length > 1) {
    const lg = document.createElement('div'); lg.className = 'legend';
    series.forEach((s) => {
      const i = document.createElement('span'); i.className = 'legend-item';
      const k = document.createElement('span'); k.className = s.style === 'dots' ? 'key-dot' : 'key-line'; k.style.background = s.color;
      i.appendChild(k); i.appendChild(document.createTextNode(s.name)); lg.appendChild(i);
    });
    body.appendChild(lg);
  }
  const W = Math.max(280, body.clientWidth || container.clientWidth || 340);
  const H = 210;
  const m = { l: 40, r: 14, t: 12, b: 26 };
  const xs = rows.map((r) => new Date(r.date + 'T12:00:00').getTime());
  let x0 = Math.min(...xs); let x1 = Math.max(...xs);
  if (x0 === x1) { x0 -= 86400000 * 3; x1 += 86400000 * 3; }
  const vals = rows.flatMap((r) => series.map((s) => r[s.key])).filter((v) => v != null);
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals));
  const y0 = ticks[0]; const y1 = ticks[ticks.length - 1];
  const X = (t) => m.l + ((t - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = (v) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': title, class: 'chart-svg' });
  ticks.forEach((tv) => {
    el('line', { x1: m.l, x2: W - m.r, y1: Y(tv), y2: Y(tv), class: 'grid' }, svg);
    const t = el('text', { x: m.l - 6, y: Y(tv) + 4, 'text-anchor': 'end', class: 'axis' }, svg); t.textContent = fmtNum(tv);
  });
  const xt = [0, Math.floor((rows.length - 1) / 2), rows.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  xt.forEach((i) => {
    const t = el('text', { x: X(xs[i]), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === rows.length - 1 ? 'end' : 'middle', class: 'axis' }, svg);
    t.textContent = fmtDate(rows[i].date);
  });

  series.forEach((s) => {
    const pts = rows.map((r, i) => [X(xs[i]), r[s.key] == null ? null : Y(r[s.key])]).filter((p) => p[1] != null);
    if (s.style === 'dots') {
      pts.forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 3, fill: s.color, class: 'dot-muted' }, svg));
    } else {
      if (pts.length > 1) el('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(''), fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      if (pts.length <= 30) pts.forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 4, fill: s.color, class: 'dot-ring' }, svg));
      const [lx, ly] = pts[pts.length - 1];
      const lv = rows[rows.length - 1][s.key];
      if (lv != null) {
        const t = el('text', { x: Math.min(lx, W - m.r), y: ly - 9, 'text-anchor': 'end', class: 'end-label' }, svg);
        t.textContent = `${fmtNum(lv)} ${unit}`;
      }
    }
  });

  const cross = el('line', { y1: m.t, y2: H - m.b, class: 'crosshair', visibility: 'hidden' }, svg);
  const hit = el('rect', { x: m.l, y: 0, width: W - m.l - m.r, height: H, fill: 'transparent', tabindex: 0 }, svg);
  body.appendChild(svg);

  const tip = document.createElement('div');
  tip.className = 'tooltip'; tip.hidden = true;
  body.style.position = 'relative';
  body.appendChild(tip);

  const show = (i) => {
    const x = X(xs[i]);
    cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('visibility', 'visible');
    tip.textContent = '';
    const d = document.createElement('div'); d.className = 'tip-date'; d.textContent = fmtDate(rows[i].date) + rows[i].date.slice(0, 4);
    tip.appendChild(d);
    series.forEach((s) => {
      const v = rows[i][s.key];
      if (v == null) return;
      const row = document.createElement('div'); row.className = 'tip-row';
      const k = document.createElement('span'); k.className = 'key-line'; k.style.background = s.color;
      const b = document.createElement('strong'); b.textContent = s.fmt ? s.fmt(rows[i]) : `${fmtNum(v)} ${unit}`;
      const n = document.createElement('span'); n.className = 'muted'; n.textContent = ' ' + s.name;
      row.append(k, b, n); tip.appendChild(row);
    });
    tip.hidden = false;
    const px = (x / W) * svg.getBoundingClientRect().width;
    tip.style.left = `${Math.min(Math.max(px - 70, 0), body.clientWidth - 150)}px`;
  };
  const nearest = (clientX) => {
    const r = svg.getBoundingClientRect();
    const t = x0 + (((clientX - r.left) / r.width) * W - m.l) / (W - m.l - m.r) * (x1 - x0);
    let best = 0;
    xs.forEach((v, i) => { if (Math.abs(v - t) < Math.abs(xs[best] - t)) best = i; });
    return best;
  };
  let cur = rows.length - 1;
  hit.addEventListener('pointermove', (e) => { cur = nearest(e.clientX); show(cur); });
  hit.addEventListener('pointerdown', (e) => { cur = nearest(e.clientX); show(cur); });
  hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; });
  hit.addEventListener('focus', () => show(cur));
  hit.addEventListener('blur', () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; });
  hit.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { cur = Math.max(0, cur - 1); show(cur); }
    if (e.key === 'ArrowRight') { cur = Math.min(rows.length - 1, cur + 1); show(cur); }
  });
}

// Horizontale Balken mit Zielbereich (z. B. 10–20 Sätze)
// band = Zielbereich (z. B. [10, 20]) oder null; unit/labelHeader für Tooltip und Tabelle
export function barChart(container, { title, sub, items, band = [10, 20], color, unit = 'Sätze', labelHeader = 'Muskel', suffix = '', legend = null }) {
  const body = frame(container, {
    title, sub,
    table: () => tableView([...items].reverse().map((i) => [i.label, fmtNum(i.value)]), [labelHeader, unit]),
  });
  const max = Math.max(band ? band[1] + 2 : 1, ...items.map((i) => i.value)) * (band ? 1 : 1.1);
  const W = Math.max(280, body.clientWidth || 340);
  const longest = Math.max(...items.map((i) => String(i.label).length));
  const rowH = 26; const labelW = Math.min(150, Math.max(92, longest * 6.6)); const r = 34;
  const H = items.length * rowH + (band ? 22 : 6);
  const X = (v) => labelW + (v / max) * (W - labelW - r);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': title, class: 'chart-svg' });
  if (band) {
    el('rect', { x: X(band[0]), y: 0, width: X(band[1]) - X(band[0]), height: items.length * rowH, class: 'band' }, svg);
    [band[0], band[1]].forEach((v) => {
      const t = el('text', { x: X(v), y: H - 6, 'text-anchor': 'middle', class: 'axis' }, svg); t.textContent = v;
    });
  }
  items.forEach((it, i) => {
    const y = i * rowH + 6;
    const lt = el('text', { x: 0, y: y + 11, class: 'axis-label' }, svg); lt.textContent = it.label;
    const w = Math.max(0, X(it.value) - labelW);
    if (w > 0) el('rect', { x: labelW, y, width: w, height: 14, rx: 4, fill: it.color || color, class: 'bar' }, svg);
    const vt = el('text', { x: labelW + w + 6, y: y + 11, class: 'end-label' }, svg); vt.textContent = fmtNum(it.value) + suffix;
    const g = el('rect', { x: 0, y: y - 6, width: W, height: rowH, fill: 'transparent' }, svg);
    const tt = el('title', {}, g); tt.textContent = `${it.label}: ${fmtNum(it.value)} ${unit}`;
  });
  if (legend) {
    const lg = document.createElement('div'); lg.className = 'legend';
    lg.innerHTML = legend.map(([n, col]) => `<span class="legend-item"><i class="key-dot" style="background:${col}"></i>${n}</span>`).join('');
    body.appendChild(lg);
  }
  body.appendChild(svg);
}
