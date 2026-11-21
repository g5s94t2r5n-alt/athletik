import { EX, EQUIPMENT, LOCATIONS, MUSCLES, ACTIVITIES, ACT, INTENSITY, videoSearchUrl, youtubeId } from './exercises.js';
import { load, save, todayISO, daysBetween, uid, exportJSON, importJSON, requestPersistence } from './store.js';
import {
  TEMPLATES, ROTATIONS, blockInfo, recommendTemplate, buildSession, sessionFromPlan, rememberSlots, alternatives,
  makeItem, estimateMinutes, bodyweightSeries, exerciseSeries, trackedExercises, weeklyVolume, isStagnating,
  activityAdjust, activitySummary, activityLoad, activityName, autoRunType,
  feedbackAdjust, sessionRecords, allRecords, PAIN_NAME, autoEffort,
  tempoText, intervalPhases, bodyComp, bodyCompSeries, compAdjust,
} from './engine.js';
import { planSession, weeklyReview, CoachError, MODEL } from './coach.js';
import { GOALS, GOAL, goalOf, rotationFor, daysToRace, weightStatus, SPORTS, SPORT, SEASONS, SEASON, WEEKDAYS, matchInfo, LEVELS, levelOf } from './goals.js';
import { lineChart, barChart } from './charts.js';

const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
let data = DEMO ? (await import('./demo.js')).demoData(params.get('view')) : load();
let view = 'today';
let busy = null;
let todayTpl = null;
let wish = '';
let runType = 'auto';
let progressEx = null;
let openHistory = null;
const persist = () => { if (DEMO) return; if (!save(data)) toast('Speichern fehlgeschlagen – bitte Backup exportieren.'); };

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
const num = (v) => (Math.round(v * 10) / 10).toLocaleString('de-DE');
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function toast(msg, ms = 3500) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, ms);
}

// ---------- Navigation ----------
function setView(v) {
  view = v;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  window.scrollTo(0, 0); // erst nach oben, dann neue (evtl. kürzere) Seite – sonst verrutscht iOS die Leiste
  render();
  window.scrollTo(0, 0);
}

function render() {
  const root = $('#view');
  if (view === 'today') root.innerHTML = data.active ? renderSession() : renderToday();
  if (view === 'history') { root.innerHTML = renderHistory(); drawMonth(); }
  if (view === 'progress') { root.innerHTML = renderProgress(); drawCharts(); }
  if (view === 'coach') root.innerHTML = renderCoach();
  if (view === 'settings') { root.innerHTML = renderSettings(); fillVersion(); }
  renderTimer();
}

// ---------- Heute (Planung) ----------
function renderToday() {
  const b = blockInfo(data);
  const rot0 = [...new Set(rotationFor(data))];
  const rec = recommendTemplate(data);
  // Empfehlung außerhalb des Wochenplans (z. B. Aktivierung vor dem Spiel) als eigener Chip
  const rot = rot0.includes(rec.id) || rec.id === 'RUN' ? rot0 : [...rot0, rec.id];
  todayTpl = todayTpl || rec.id;
  const others = Object.keys(TEMPLATES).filter((k) => !rot.includes(k) && k !== 'RUN');
  const mi = matchInfo(data);
  const goal = goalOf(data);
  const dtr = daysToRace(data);
  const hasKey = data.settings.useClaude && data.settings.apiKey;
  const reviewDue = hasKey && data.sessions.length >= 2 && (!data.coach || daysBetween(data.coach.date, todayISO()) >= 7);
  const last = data.sessions[data.sessions.length - 1];
  const loc = data.location || 'gym';
  return `
  <header class="page-head">
    <h1>Heute</h1>
    <span class="pill ${b.deload ? 'warn' : ''}">${b.deload ? 'Deload-Woche' : `Block-Woche ${b.week}/4`}</span>
  </header>
  <p class="goal-line">Ziel: <strong>${esc(goal.name)}</strong>${dtr !== null ? ` · noch ${dtr} ${dtr === 1 ? 'Tag' : 'Tage'} bis zum Wettkampf` : ''}${mi ? ` · ${mi.toMatch === 0 || mi.sinceMatch === 0 ? 'heute Spiel' : mi.toMatch === 1 ? 'morgen Spiel' : mi.toMatch != null ? `Spiel in ${mi.toMatch} Tagen` : mi.sinceMatch === 1 ? 'gestern Spiel' : `letztes Spiel vor ${mi.sinceMatch} Tagen`}` : ''}${(() => {
    if (!goal.weightGoal) return '';
    const ws = weightStatus(data, bodyweightSeries(data));
    if (!ws.goalW || ws.toGo == null) return '';
    return ws.toGo > 0 ? ` · noch ${num(ws.toGo)} kg bis ${num(ws.goalW)} kg` : ' · Zielgewicht erreicht';
  })()}</p>
  ${!data.profile.setup ? `<button class="banner" data-action="setup">Profil & Home-Gym einrichten →</button>` : ''}
  ${reviewDue ? `<button class="banner" data-action="goto" data-to="coach">Wochen-Check fällig – Claude passt deinen Plan an →</button>` : ''}
  ${data.coach && data.coach.focus ? `<div class="card soft"><div class="label">Fokus diese Woche</div><p>${esc(data.coach.focus)}</p></div>` : ''}

  <section class="card">
    <div class="label">Einheit</div>
    <div class="chips">
      ${rot.map((k) => `<button class="chip ${k === todayTpl ? 'on' : ''}" data-action="tpl" data-tpl="${k}">${esc(TEMPLATES[k].name.split(' – ')[0])}${k === rec.id ? ' ★' : ''}</button>`).join('')}
      ${rot.includes('RUN') ? '' : `<button class="chip ${todayTpl === 'RUN' ? 'on' : ''}" data-action="tpl" data-tpl="RUN">Laufeinheit${rec.id === 'RUN' ? ' ★' : ''}</button>`}
    </div>
    <p class="rec"><span class="rec-star">★</span> ${todayTpl === rec.id ? `<strong>Empfohlen:</strong> ${esc(rec.why)}` : `Empfohlen wäre <button class="link" data-action="tpl" data-tpl="${rec.id}">${esc(TEMPLATES[rec.id].name.split(' – ')[0])}</button>: ${esc(rec.why)}`}</p>
    <p class="muted small">${esc(TEMPLATES[todayTpl].name)}</p>
    ${todayTpl === 'RUN' ? (() => {
      const auto = autoRunType(data);
      return `<div class="label mt">Lauftyp</div>
      <div class="chips">
        <button class="chip ${runType === 'auto' ? 'on' : ''}" data-action="runtype" data-id="auto">Automatisch: ${esc(EX[auto.id].name)}</button>
        ${RUN_TYPES.map((id) => `<button class="chip ${runType === id ? 'on' : ''}" data-action="runtype" data-id="${id}">${esc(EX[id].name)}</button>`).join('')}
      </div>
      <p class="muted small">${runType === 'auto' ? esc(auto.why) : esc(EX[runType].presc)}</p>
      <p class="muted small">Draußen oder auf dem Laufband: Aufwärmen, Laufen, Dehnen – ohne Kraftübungen.</p>`;
    })() : ''}
    <details class="more"><summary>Andere Einheit</summary>
      <div class="chips">${others.map((k) => `<button class="chip ${k === todayTpl ? 'on' : ''}" data-action="tpl" data-tpl="${k}">${esc(TEMPLATES[k].name)}</button>`).join('')}</div>
    </details>
  </section>

  ${todayTpl === 'RUN' ? '' : `<section class="card">
    <div class="label">Wo trainierst du heute?</div>
    <div class="chips">
      ${LOCATIONS.map((l) => `<button class="chip ${loc === l.id ? 'on' : ''}" data-action="loc" data-id="${l.id}">${esc(l.name)}${l.id === 'home' && !data.homeGym ? ' +' : ''}</button>`).join('')}
    </div>
    ${loc === 'travel' ? `
      <p class="muted small">Was ist verfügbar? Körpergewicht-Übungen gehen immer.</p>
      <div class="chips">
        ${EQUIPMENT.map((e) => `<button class="chip ${(data.travelEquip || []).includes(e.id) ? 'on' : ''}" data-action="equip" data-id="${e.id}">${esc(e.name)}</button>`).join('')}
      </div>` : `<p class="muted small">${locationSummary(loc)}</p>`}
  </section>`}

  <section class="card">
    <div class="label">Zeit heute</div>
    <div class="chips">${[45, 60, 75, 90, 105].map((m) => `<button class="chip ${data.profile.duration === m ? 'on' : ''}" data-action="dur" data-min="${m}">${m} min</button>`).join('')}</div>
  </section>

  ${(() => { const n = [...(todayTpl === 'REG' ? [] : activityAdjust(data, TEMPLATES[todayTpl].focus).notes), ...(todayTpl === 'RUN' ? [] : feedbackAdjust(data, todayTpl).notes), ...(TEMPLATES[todayTpl].slots.length ? compAdjust(data).notes : [])]; return n.length ? `<div class="card soft"><div class="label">Berücksichtigt</div><p>${n.map(esc).join('<br>')}</p></div>` : ''; })()}

  ${hasKey ? `<section class="card">
    <div class="label">Wunsch oder Befinden (optional)</div>
    <textarea id="wish" rows="2" placeholder="z. B. „Nur 45 min“, „Linke Schulter zwickt“, „Heute Fokus Sprungkraft“">${esc(wish)}</textarea>
  </section>` : ''}

  <div class="actions">
    ${hasKey ? `<button class="btn primary" data-action="plan-ai" ${busy ? 'disabled' : ''}>${busy === 'plan' ? '<span class="spinner"></span> Claude plant …' : 'Mit Claude planen'}</button>` : ''}
    <button class="btn ${hasKey ? '' : 'primary'}" data-action="plan-rule" ${busy ? 'disabled' : ''}>${hasKey ? 'Offline planen' : 'Training erstellen'}</button>
    ${!hasKey ? `<p class="muted small center">Tipp: Hinterlege in den Einstellungen deinen Claude-API-Key für KI-Planung und Wochen-Check.</p>` : ''}
    <button class="btn ghost" data-action="act-new">+ Anderes Training nachtragen</button>
    <p class="muted small center">z. B. HIIT, Joggen, Yoga, CrossFit, Padel – fließt in die Planung ein.</p>
  </div>

  ${(() => {
    const lastAct = [...(data.activities || [])].sort((x, y) => x.date.localeCompare(y.date)).pop();
    if (lastAct && (!last || lastAct.date > last.date)) {
      return `<section class="card soft"><div class="label">Letzte Einheit</div>
      <p><strong>${esc(activityName(lastAct))}</strong> <span class="tag t-activity">Nachgetragen</span><br><span class="muted">${fmtDate(lastAct.date)} · ${lastAct.minutes} min · ${esc(lastAct.intensity)}${lastAct.km ? ` · ${num(lastAct.km)} km` : ''}</span></p></section>`;
    }
    return last ? `<section class="card soft"><div class="label">Letzte Einheit</div>
    <p><strong>${esc(last.title)}</strong><br><span class="muted">${fmtDate(last.date)} · ${sessionSummary(last)}${last.template === 'RUN' ? '' : ' bewegt'}</span></p></section>` : '';
  })()}
  `;
}

function equipFor(loc) {
  if (loc === 'home') return [...(data.homeGym || [])];
  if (loc === 'travel') return [...(data.travelEquip || [])];
  return [...((LOCATIONS.find((l) => l.id === loc) || LOCATIONS[0]).equip)];
}

function locationSummary(loc) {
  if (loc === 'gym') return 'Alle Geräte verfügbar.';
  if (loc === 'home') {
    const names = (data.homeGym || []).map((id) => EQUIPMENT.find((e) => e.id === id)?.name).filter(Boolean);
    return `${names.length ? esc(names.join(', ')) : 'Nur Körpergewicht'} · <button class="link" data-action="goto" data-to="settings">ändern</button>`;
  }
  if (loc === 'outdoor') return 'Freifläche zum Laufen und Springen, dazu Körpergewicht-Übungen.';
  return 'Nur Körpergewicht-Übungen, keine Geräte.';
}

function countSets(s) { return s.blocks.flatMap((b) => b.items).reduce((n, it) => n + (it.sets || []).filter((x) => x.done).length, 0); }
function tonnage(s) { return s.blocks.flatMap((b) => b.items).reduce((n, it) => n + (it.sets || []).filter((x) => x.done).reduce((m, x) => m + (Number(x.w) || 0) * (Number(x.r) || 0), 0), 0); }

async function startPlan(useAI) {
  // Laufeinheit: kein Trainingsort, keine Geräte nötig
  const equip = todayTpl === 'RUN' ? [] : equipFor(data.location || 'gym');
  if (todayTpl !== 'RUN') data.equipment = equip;
  const rule = buildSession(data, { templateId: todayTpl, equip, runType });
  let session = rule;
  if (useAI) {
    busy = 'plan'; render();
    try {
      const plan = await planSession(data, { templateId: todayTpl, equip, wish, ruleSession: rule, runType });
      const s = sessionFromPlan(data, plan, { templateId: todayTpl, equip });
      if (s.blocks.some((b) => b.type === 'strength' || b.type === 'power' || b.type === 'conditioning')) {
        // Slot-Gedächtnis aus der Regel-Logik übernehmen, wenn Claude dieselbe Übung gewählt hat
        const ruleSlots = Object.fromEntries(rule.blocks.flatMap((b) => b.items).filter((i) => i.slotKey).map((i) => [i.exId, i.slotKey]));
        s.blocks.forEach((b) => b.items.forEach((i) => { if (ruleSlots[i.exId]) i.slotKey = ruleSlots[i.exId]; }));
        session = s;
      } else {
        toast('Claude-Plan war leer – Offline-Plan verwendet.');
      }
    } catch (e) {
      const msg = e instanceof CoachError ? e.message : 'Unerwarteter Fehler.';
      toast(`${msg} Offline-Plan verwendet.`, 5000);
      console.error(e);
    } finally {
      busy = null;
    }
  }
  session.estMin = estimateMinutes(session);
  data.active = session;
  wish = '';
  persist();
  keepAwake(true);
  render();
}

// ---------- Aktive Einheit ----------
const BLOCK_ICON = { warmup: 'Aufwärmen', power: 'Schnellkraft', strength: 'Kraft', conditioning: 'Ausdauer', run: 'Laufen', cooldown: 'Mobilität' };
const RUN_TYPES = ['run_easy', 'run_4x4', 'run_3030', 'run_tempo', 'run_fartlek', 'run_sprints', 'run_long'];

function pace(min, km) {
  const m = parseFloat(String(min).replace(',', '.')); const k = parseFloat(String(km).replace(',', '.'));
  if (!(m > 0 && k > 0)) return '';
  const p = m / k; const s = Math.round((p % 1) * 60);
  return `${Math.floor(p) + (s === 60 ? 1 : 0)}:${String(s === 60 ? 0 : s).padStart(2, '0')} min/km`;
}

function sessionSummary(s) {
  if (s.template !== 'RUN') return `${plural(countSets(s), 'Satz', 'Sätze')} · ${num(tonnage(s))} kg`;
  const r = runStats(s);
  return `${r.km ? num(r.km) + ' km · ' : ''}${r.min ? num(r.min) + ' min' : 'Lauf'}${pace(r.min, r.km) ? ' · ' + pace(r.min, r.km) : ''}${countSets(s) ? ` · ${plural(countSets(s), 'Satz', 'Sätze')}` : ''}`;
}

function runStats(s) {
  let min = 0; let km = 0;
  s.blocks.forEach((b) => b.items.forEach((it) => { if (it.run) { min += parseFloat(String(it.run.min).replace(',', '.')) || 0; km += parseFloat(String(it.run.km).replace(',', '.')) || 0; } }));
  return { min, km };
}

function renderSession() {
  const s = data.active;
  const doneSets = countSets(s);
  const allSets = s.blocks.flatMap((b) => b.items).reduce((n, it) => n + it.sets.length, 0);
  return `
  <header class="page-head">
    <div>
      <h1 class="h-session">${esc(s.title)}</h1>
      <div class="muted small">${s.deload ? 'Deload · ' : `Woche ${s.week} · `}${s.source === 'claude' ? 'geplant von Claude' : s.source === 'repeat' ? 'Wiederholung' : 'Regel-Logik'} · ca. ${s.estMin || estimateMinutes(s)} min</div>
    </div>
  </header>
  ${s.note ? `<div class="card soft"><p>${esc(s.note)}</p></div>` : ''}
  <div class="progress-line"><div style="width:${allSets ? (doneSets / allSets) * 100 : 0}%"></div></div>
  ${s.blocks.map((b, bi) => `
    <section class="block">
      <h2 class="block-title"><span class="tag t-${b.type}">${BLOCK_ICON[b.type] || ''}</span> ${esc(b.title)}</h2>
      ${b.items.map((it, ii) => renderItem(it, bi, ii, b.type)).join('')}
    </section>`).join('')}
  <div class="actions">
    <button class="btn primary" data-action="finish">Training abschließen</button>
    <button class="btn ghost danger" data-action="discard">Einheit verwerfen</button>
  </div>`;
}

function renderItem(it, bi, ii, type) {
  const ex = EX[it.exId];
  if (!ex) return '';
  const tracked = it.sets.length > 0;
  const showW = ex.load === 'kg' || (ex.load === 'bw' && ex.cat === 'strength');
  const allDone = tracked ? it.sets.every((x) => x.done) : it.done;
  const partner = it.ss ? data.active.blocks[bi].items.find((x) => x !== it && x.ss && x.ss[0] === it.ss[0]) : null;
  return `
  <article class="ex ${allDone ? 'done' : ''}" id="it-${it.uid}">
    <div class="ex-head">
      ${!tracked ? `<button class="check ${it.done ? 'on' : ''}" data-action="item-done" data-b="${bi}" data-i="${ii}" aria-label="Erledigt"></button>` : ''}
      <div class="ex-name">
        <strong>${esc(ex.name)}</strong>${it.ss ? ` <span class="ss-tag">Supersatz ${esc(it.ss)}</span>` : ''}
        <div class="muted small">${tracked ? `${it.sets.length} × ${it.lo}–${it.hi} Wdh.${showW && Number(it.sets[0]?.tw) > 0 ? ` · <b class="rw">Richtwert ${ex.load === 'bw' ? '+' : ''}${fmtW(it.sets[0].tw)} kg</b>` : ''}${showW && ex.load === 'bw' ? ' · kg = Zusatzgewicht' : ''} · Pause&nbsp;${it.rest < 120 ? `${it.rest}&nbsp;s` : `${num(it.rest / 60)}&nbsp;min`}` : esc(it.presc || ex.presc)}</div>
      </div>
      <button class="icon-btn" data-action="video" data-ex="${ex.id}" aria-label="Video">${ICON_PLAY}</button>
    </div>
    ${it.tempo ? `<p class="tempo"><b>Tempo ${esc(it.tempo)}</b> · ${esc(tempoText(it.tempo))}</p>` : ''}
    ${partner ? `<p class="ex-note ss-note">Im Wechsel mit <b>${esc(EX[partner.exId]?.name || '')}</b> (${esc(partner.ss)}): je 1 Satz, dann ${it.rest} s Pause.</p>` : ''}
    ${it.note ? `<p class="ex-note">${esc(it.note)}</p>` : ''}
    ${ex.iv ? `<button class="btn small iv-btn" data-action="iv-open" data-b="${bi}" data-i="${ii}">${ICON_CLOCK} Intervall-Uhr</button>` : ''}
    ${it.run ? `
    <div class="run-log">
      <label class="field"><span>Dauer (min)</span><input class="in" inputmode="decimal" data-run="min" data-b="${bi}" data-i="${ii}" value="${esc(it.run.min)}" placeholder="min"></label>
      <label class="field"><span>Strecke (km)</span><input class="in" inputmode="decimal" data-run="km" data-b="${bi}" data-i="${ii}" value="${esc(it.run.km)}" placeholder="km"></label>
      <div class="pace" id="pace-${it.uid}">${pace(it.run.min, it.run.km) || 'Pace –'}</div>
    </div>` : ''}
    ${tracked ? `
    <div class="sets">
      <div class="set-row head"><span>Satz</span>${showW ? '<span>kg</span>' : '<span></span>'}<span>Wdh.</span><span></span></div>
      ${it.sets.map((st, si) => `
      <div class="set-row ${st.done ? 'done' : ''}">
        <span class="set-n">${si + 1}</span>
        ${showW ? `<input inputmode="decimal" class="in" data-field="w" data-b="${bi}" data-i="${ii}" data-s="${si}" value="${esc(fmtW(st.w))}" placeholder="${st.tw != null && st.tw !== '' ? esc(fmtW(st.tw)) : 'kg'}">` : '<span></span>'}
        <input inputmode="numeric" class="in" data-field="r" data-b="${bi}" data-i="${ii}" data-s="${si}" value="${esc(st.r)}" placeholder="${it.lo}–${it.hi}">
        <button class="check ${st.done ? 'on' : ''}" data-action="set-done" data-b="${bi}" data-i="${ii}" data-s="${si}" aria-label="Satz erledigt"></button>
      </div>`).join('')}
    </div>` : ''}
    <div class="ex-tools">
      <button class="link" data-action="cues" data-ex="${ex.id}" data-uid="${it.uid}">Technik</button>
      ${type === 'strength' || type === 'power' || ex.slot === 'hyrox_station' ? `<button class="link" data-action="swap" data-b="${bi}" data-i="${ii}">Tauschen</button>` : ''}
      ${tracked ? `<button class="link" data-action="add-set" data-b="${bi}" data-i="${ii}">+ Satz</button>` : ''}
      <button class="link danger" data-action="remove" data-b="${bi}" data-i="${ii}">Entfernen</button>
    </div>
    <ul class="cues" id="cues-${it.uid}" hidden>${ex.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
  </article>`;
}

const ICON_CLOCK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 9v4.2l2.6 1.6M9.5 2.8h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.2v7.6l6-3.8z" fill="currentColor"/></svg>';

let lastAuto = { key: '', at: 0 };
const setFilled = (it, st) => st.r !== '' && Number(st.r) > 0 && (EX[it.exId]?.load !== 'kg' || (st.w !== '' && st.w != null));

// Gewicht in Folgesätze übernehmen, wenn dort noch nichts geändert wurde
function carryWeight(it, si, bi, ii) {
  const st = it.sets[si];
  it.sets.slice(si + 1).forEach((n, k) => {
    if (n.done || !(n.w === '' || n.w == null || String(n.w) === String(n.tw))) return;
    n.w = st.w;
    if (bi != null) {
      const inp = document.querySelector(`input[data-field="w"][data-b="${bi}"][data-i="${ii}"][data-s="${si + 1 + k}"]`);
      if (inp && document.activeElement !== inp) inp.value = fmtW(st.w);
    }
  });
}

// Automatisch abhaken, ohne die Ansicht neu aufzubauen (Fokus bleibt im nächsten Feld)
function autoComplete(t) {
  const bi = +t.dataset.b; const ii = +t.dataset.i; const si = +t.dataset.s;
  const it = data.active.blocks[bi].items[ii]; const st = it.sets[si];
  if (st.done || !setFilled(it, st)) return;
  st.done = true;
  lastAuto = { key: `${bi}:${ii}:${si}`, at: Date.now() };
  carryWeight(it, si, bi, ii);
  startTimer(it.rest);
  persist();
  const row = t.closest('.set-row');
  if (row) { row.classList.add('done'); row.querySelector('.check')?.classList.add('on'); }
  const card = t.closest('.ex');
  if (card && it.sets.every((x) => x.done)) card.classList.add('done');
  const bar = document.querySelector('.progress-line > div');
  if (bar) { const all = data.active.blocks.flatMap((b) => b.items).reduce((n, x) => n + x.sets.length, 0); bar.style.width = `${all ? (countSets(data.active) / all) * 100 : 0}%`; }
}

const fmtW = (w) => (w === '' || w == null ? '' : String(w).replace('.', ','));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function finishSession() {
  const s = data.active;
  s.blocks.forEach((b) => b.items.forEach((it) => it.sets.forEach((st) => { if (!st.done && setFilled(it, st)) st.done = true; })));
  if (!countSets(s) && !s.blocks.some((b) => b.items.some((i) => i.done))) {
    if (!confirm('Noch nichts abgehakt. Trotzdem abschließen?')) return;
  }
  s.blocks.forEach((b) => b.items.forEach((it) => { if (it.run && parseFloat(String(it.run.min).replace(',', '.')) > 0) it.done = true; }));
  s.status = 'done';
  s.finishedAt = Date.now();
  s.blocks.forEach((b) => b.items.forEach((it) => { if (it.sets.length) it.planned = it.sets.length; it.sets = it.sets.filter((x) => x.done); }));
  data.sessions.push(s);
  rememberSlots(data, s);
  data.active = null;
  todayTpl = null;
  stopTimer();
  keepAwake(false);
  s.records = sessionRecords(data, s);
  s.autoEffort = autoEffort(s);
  persist();
  setView('history');
  openHistory = s.id;
  render();
  openFeedback(s);
}

// Einheit aus dem Verlauf wiederholen: gleiche Übungen, Sätze und Wdh.-Bereiche, Gewichte nach aktuellem Stand
function repeatSession(id) {
  const old = data.sessions.find((x) => x.id === id);
  if (!old) return;
  if (data.active) { toast('Schließe zuerst die laufende Einheit ab oder verwirf sie.'); return; }
  const { week, deload } = blockInfo(data);
  const blocks = old.blocks.map((b) => ({
    type: b.type, title: b.title,
    items: b.items.map((it) => {
      const ex = EX[it.exId];
      if (!ex) return null;
      const tracked = ex.cat === 'strength' || ex.cat === 'power';
      const n = tracked ? Math.max(1, it.planned || 0, it.sets.length || (it.main ? 3 : 2)) : 0; // geplante Satzzahl
      const ni = makeItem(data, ex, n, { lo: it.lo, hi: it.hi, main: it.main, rest: it.rest, deload });
      if (it.presc) ni.presc = it.presc;
      ['slotKey', 'prio', 'ss'].forEach((k) => { if (it[k] != null) ni[k] = it[k]; });
      return ni;
    }).filter(Boolean),
  })).filter((b) => b.items.length);
  const s = {
    id: uid(), date: todayISO(), template: old.template, title: old.title, week, deload,
    source: 'repeat', repeatOf: old.id, equipment: [...(old.equipment || [])], status: 'active', startedAt: Date.now(),
    note: `Wiederholung der Einheit vom ${fmtDate(old.date)} – Gewichte nach deinem aktuellen Stand${deload ? ' (Deload: weniger Gewicht)' : ''}.`,
    blocks,
  };
  s.estMin = estimateMinutes(s);
  data.active = s;
  todayTpl = null;
  persist();
  keepAwake(true);
  setView('today');
  toast('Einheit übernommen – viel Erfolg!');
}

// ---------- Rekorde & Umfrage nach dem Training ----------
const kgTxt = (v) => num(Math.round(v * 10) / 10);
const paceTxt = (p) => `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, '0')} min/km`;
function recordText(r) {
  const name = r.exId ? EX[r.exId]?.name || r.exId : '';
  if (r.kind === '1rm') return { name, text: `1RM ca. ${kgTxt(r.value)} kg (+${kgTxt(r.value - r.prev)} kg) · ${r.bw ? '+' : ''}${kgTxt(r.w)} kg × ${r.r}` };
  if (r.kind === 'weight') return { name, text: `schwerster Satz ${r.bw ? '+' : ''}${kgTxt(r.value)} kg (vorher ${kgTxt(r.prev)} kg)` };
  if (r.kind === 'distance') return { name: 'Längster Lauf', text: `${kgTxt(r.value)} km (vorher ${kgTxt(r.prev)} km)` };
  return { name: 'Schnellste Pace', text: `${paceTxt(r.value)} (vorher ${paceTxt(r.prev)})` };
}

let fbDraft = null;
function openFeedback(s) {
  fbDraft = { sid: s.id, liked: '', pain: [], dislikes: [], note: '' };
  feedbackModal();
}

function feedbackModal() {
  const s = data.sessions.find((x) => x.id === fbDraft.sid);
  if (!s) return;
  const f = fbDraft;
  const recs = s.records || [];
  const chips = (key, opts) => `<div class="chips">${opts.map(([v, l]) => `<button class="chip ${f[key] === v ? 'on' : ''}" data-action="fb" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const exs = [...new Set(s.blocks.filter((b) => b.type === 'strength' || b.type === 'power').flatMap((b) => b.items.map((i) => i.exId)))];
  openModal(`
    ${recs.length ? '<div class="confetti" aria-hidden="true">' + Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 9) * 0.12}s;background:var(--${['lav', 'mint', 'pink', 'sky', 'butter'][i % 5]})"></i>`).join('') + '</div>' : ''}
    <h2>Geschafft!</h2>
    <p class="muted">${esc(s.title)} · ${sessionSummary(s)}</p>
    ${recs.length ? `<div class="pr-box"><div class="pr-title">🏆 ${recs.length === 1 ? 'Neuer Rekord!' : `${recs.length} neue Rekorde!`}</div>${recs.map((r) => { const t = recordText(r); return `<div class="pr-row"><b>${esc(t.name)}</b><span>${esc(t.text)}</span></div>`; }).join('')}</div>` : ''}
    <div class="label mt">Hat dir das Training gefallen?</div>
    ${chips('liked', [['yes', 'Ja'], ['meh', 'Geht so'], ['no', 'Nein']])}
    ${(f.liked === 'no' || f.liked === 'meh') && exs.length ? `<div class="label">Welche Übungen magst du nicht? <span class="muted small">(werden künftig ersetzt)</span></div>
      <div class="chips">${exs.map((id) => `<button class="chip small ${f.dislikes.includes(id) ? 'on' : ''}" data-action="fb-dislike" data-id="${id}">${esc(EX[id]?.name || id)}</button>`).join('')}</div>` : ''}
    <div class="label">Beschwerden?</div>
    <div class="chips"><button class="chip ${!f.pain.length ? 'on' : ''}" data-action="fb-pain" data-id="none">Keine</button>${Object.entries(PAIN_NAME).map(([k, l]) => `<button class="chip ${f.pain.includes(k) ? 'on' : ''}" data-action="fb-pain" data-id="${k}">${l}</button>`).join('')}</div>
    <label class="field"><span>Notiz (optional)</span><textarea class="in wide" id="fb-note" rows="2" placeholder="z. B. Kniebeuge lief super, Schulter zwickt bei Überkopf">${esc(f.note)}</textarea></label>
    <button class="btn primary" data-action="fb-save">Speichern</button>
    <button class="btn ghost" data-action="fb-skip">Überspringen</button>`);
}

function saveFeedback() {
  const s = data.sessions.find((x) => x.id === fbDraft.sid);
  if (s) {
    const { liked, pain, dislikes, note } = fbDraft;
    s.feedback = { liked, pain: [...pain], dislikes: [...dislikes], note: note.trim(), at: todayISO() };
    data.dislikes = [...new Set([...(data.dislikes || []), ...dislikes])];
    persist();
  }
  fbDraft = null;
  closeModal();
  toast('Danke! Die nächsten Einheiten berücksichtigen deine Rückmeldung.');
  render();
}

// ---------- Pausen-Timer ----------
let timer = null;
function startTimer(sec) {
  timer = { end: Date.now() + sec * 1000, total: sec };
  clearInterval(startTimer._iv);
  startTimer._iv = setInterval(tick, 250);
  tick();
}
function stopTimer() { timer = null; clearInterval(startTimer._iv); renderTimer(); }
function tick() {
  if (!timer) return;
  if (Date.now() >= timer.end) { beep(); stopTimer(); toast('Pause vorbei – nächster Satz!', 2500); return; }
  renderTimer();
}
function renderTimer() {
  const t = $('#timer');
  if (!timer || !data.active) { t.hidden = true; return; }
  const left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
  t.hidden = false;
  $('#timer-val').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  $('#timer-bar').style.width = `${(left / timer.total) * 100}%`;
}
let audioCtx = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((d) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.2, audioCtx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d + 0.2);
      o.start(audioCtx.currentTime + d); o.stop(audioCtx.currentTime + d + 0.2);
    });
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (e) { /* kein Audio */ }
}
function audioUnlock() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* kein Audio */ }
}
function tone(freq, dur = 0.15, delay = 0, vol = 0.25) {
  try {
    audioUnlock();
    const t0 = audioCtx.currentTime + delay;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.start(t0); o.stop(t0 + dur);
  } catch (e) { /* kein Audio */ }
}

// ---------- Intervall-Uhr ----------
// Zeigt Belastungs- und Pausenzeiten groß an, piept 3-2-1 vor jedem Wechsel und hakt die Übung am Ende ab.
let ivc = null;
const mmss = (sec) => { const v = Math.max(0, Math.ceil(sec)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };
function ivEl() {
  let el = document.getElementById('ivclock');
  if (!el) { el = document.createElement('div'); el.id = 'ivclock'; el.className = 'ivclock'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Intervall-Uhr'); document.body.appendChild(el); }
  return el;
}
function ivOpen(bi, ii) {
  const it = data.active.blocks[bi].items[ii]; const ex = EX[it.exId];
  if (!ex || !ex.iv) return;
  stopTimer();
  ivc = { bi, ii, uid: it.uid, ex, iv: ex.iv, rounds: ex.iv.rounds, sets: ex.iv.sets || 1, phases: null, idx: 0, end: 0, paused: null, beeped: -1, done: false };
  ivRender();
}
const ivTotalSec = (c, from = 0) => (c.phases || intervalPhases(c.iv, c.rounds, c.sets)).slice(from).reduce((a, p) => a + p.sec, 0);
function ivStart() {
  audioUnlock();
  ivc.phases = intervalPhases(ivc.iv, ivc.rounds, ivc.sets);
  ivc.idx = 0; ivc.end = Date.now() + ivc.phases[0].sec * 1000; ivc.startedAt = Date.now();
  ivSignal(ivc.phases[0].kind);
  clearInterval(ivOpen._iv); ivOpen._iv = setInterval(ivTick, 200);
  ivRender();
}
function ivSignal(kind) {
  if (kind === 'work') { tone(1046, 0.18); tone(1318, 0.3, 0.2); } else tone(523, 0.45);
  if (navigator.vibrate) navigator.vibrate(kind === 'work' ? [150, 80, 150] : 300);
}
function ivTick() {
  if (!ivc || !ivc.phases || ivc.paused != null || ivc.done) return;
  const left = (ivc.end - Date.now()) / 1000;
  const s3 = Math.ceil(left);
  if (s3 >= 1 && s3 <= 3 && ivc.beeped !== s3 && ivc.phases[ivc.idx].sec > 5) { ivc.beeped = s3; tone(784, 0.1); }
  if (left <= 0) ivNext(); else ivRenderTime();
}
function ivNext() {
  ivc.idx++; ivc.beeped = -1;
  if (ivc.idx >= ivc.phases.length) { ivDone(); return; }
  const p = ivc.phases[ivc.idx];
  ivc.end = Date.now() + p.sec * 1000;
  ivSignal(p.kind);
  ivRender();
}
function ivDone() {
  clearInterval(ivOpen._iv);
  ivc.done = true;
  const it = data.active && data.active.blocks[ivc.bi]?.items[ivc.ii];
  if (it && it.uid === ivc.uid) {
    it.done = true;
    if (it.run && !(parseFloat(String(it.run.min).replace(',', '.')) > 0)) it.run.min = String(Math.round((Date.now() - ivc.startedAt) / 60000));
    persist();
  }
  tone(784, 0.15); tone(988, 0.15, 0.18); tone(1318, 0.4, 0.36);
  ivRender();
}
function ivClose() { clearInterval(ivOpen._iv); ivc = null; const el = document.getElementById('ivclock'); if (el) el.remove(); render(); }
function ivRenderTime() {
  const p = ivc.phases[ivc.idx];
  const left = ivc.paused != null ? ivc.paused / 1000 : (ivc.end - Date.now()) / 1000;
  const t = document.getElementById('ivc-time'); if (t) t.textContent = mmss(left);
  const b = document.getElementById('ivc-bar'); if (b) b.style.width = `${Math.max(0, Math.min(100, (left / p.sec) * 100))}%`;
  const tot = document.getElementById('ivc-total'); if (tot) tot.textContent = `Gesamt noch ${mmss(left + ivTotalSec(ivc, ivc.idx + 1))}`;
}
function ivRender() {
  const el = ivEl();
  const c = ivc; const iv = c.iv;
  if (c.done) {
    el.className = 'ivclock ivc-done';
    el.innerHTML = `<div class="ivc-inner"><div class="ivc-label">Geschafft!</div><p class="ivc-sub">${esc(c.ex.name)} ist abgehakt${c.ex.cat === 'run' ? ' – trag noch die Strecke ein' : ''}.</p><button class="btn primary" data-action="iv-close">Schließen</button></div>`;
    return;
  }
  if (!c.phases) {
    const parts = [iv.warm ? `${mmss(iv.warm)} Einlaufen` : '', `${c.sets > 1 ? `${c.sets} × ` : ''}${c.rounds} × ${mmss(iv.work)} ${iv.workLabel && iv.work <= 60 && iv.rest === 0 ? '(EMOM)' : 'Belastung'}`, iv.rest ? `${mmss(iv.rest)} Pause` : '', c.sets > 1 ? `${mmss(iv.setRest || iv.rest)} Serienpause` : '', iv.cool ? `${mmss(iv.cool)} Auslaufen` : ''].filter(Boolean);
    el.className = 'ivclock ivc-setup';
    el.innerHTML = `<div class="ivc-inner">
      <div class="ivc-title">${esc(c.ex.name)}</div>
      <p class="ivc-sub">${esc(parts.join(' · '))}</p>
      <div class="ivc-cfg"><span>Runden</span><button class="chip" data-action="iv-rounds" data-d="-1" aria-label="Weniger Runden">−</button><strong>${c.rounds}</strong><button class="chip" data-action="iv-rounds" data-d="1" aria-label="Mehr Runden">+</button></div>
      ${iv.sets ? `<div class="ivc-cfg"><span>Serien</span><button class="chip" data-action="iv-sets" data-d="-1" aria-label="Weniger Serien">−</button><strong>${c.sets}</strong><button class="chip" data-action="iv-sets" data-d="1" aria-label="Mehr Serien">+</button></div>` : ''}
      <p class="ivc-sub">Dauer ca. ${Math.round(ivTotalSec(c) / 60)} min · Signalton 3-2-1 vor jedem Wechsel</p>
      <button class="btn primary" data-action="iv-start">Start</button>
      <button class="btn ghost" data-action="iv-close">Abbrechen</button>
    </div>`;
    return;
  }
  const p = c.phases[c.idx]; const nx = c.phases[c.idx + 1];
  el.className = `ivclock ivc-${p.kind}`;
  el.innerHTML = `<div class="ivc-inner">
    <div class="ivc-title">${esc(c.ex.name)}</div>
    <div class="ivc-label">${esc(p.label)}</div>
    <div class="ivc-time" id="ivc-time">${mmss(p.sec)}</div>
    ${p.round ? `<div class="ivc-round">Runde ${p.round}/${p.rounds}${p.sets > 1 ? ` · Serie ${p.set}/${p.sets}` : ''}</div>` : '<div class="ivc-round">&nbsp;</div>'}
    <div class="ivc-bar"><div id="ivc-bar"></div></div>
    <div class="ivc-next">${nx ? `Danach: ${esc(nx.label)} ${mmss(nx.sec)}` : 'Letzte Phase'}</div>
    <div class="ivc-btns">
      <button class="btn" data-action="iv-pause">${c.paused != null ? 'Weiter' : 'Pause'}</button>
      <button class="btn" data-action="iv-skip">Nächste ›</button>
    </div>
    <button class="btn ghost" data-action="iv-stop">Beenden</button>
    <div class="ivc-total" id="ivc-total"></div>
  </div>`;
  ivRenderTime();
}

let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { /* optional */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && data.active) keepAwake(true); });

// ---------- Modals ----------
function openModal(html) {
  $('#modal-body').innerHTML = html;
  $('#modal').hidden = false;
}
function closeModal() { $('#modal').hidden = true; $('#modal-body').innerHTML = ''; }

function videoModal(exId) {
  const ex = EX[exId];
  const vid = youtubeId(data.videos[exId]);
  openModal(`
    <h2>${esc(ex.name)}</h2>
    ${vid ? `<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${vid}?playsinline=1&rel=0" title="${esc(ex.name)}" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
      : `<p class="muted">Noch kein Video gespeichert. Such dir ein gutes Technik-Video und speichere den Link, dann läuft es künftig direkt hier.</p>`}
    <a class="btn" href="${videoSearchUrl(ex)}" target="_blank" rel="noopener">${vid ? 'Andere Videos auf YouTube' : 'Videos auf YouTube suchen'}</a>
    <div class="label mt">Technik</div>
    <ul class="cues">${ex.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    <div class="label mt">Eigenes Video (YouTube-Link)</div>
    <div class="row">
      <input id="vid-url" class="in wide" placeholder="https://youtu.be/…" value="${esc(data.videos[exId] || '')}">
      <button class="btn small" data-action="save-video" data-ex="${exId}">Speichern</button>
    </div>
    <button class="btn ghost mt" data-action="close">Schließen</button>`);
}

function swapModal(bi, ii) {
  const s = data.active;
  const it = s.blocks[bi].items[ii];
  const used = s.blocks.flatMap((b) => b.items).map((x) => x.exId);
  const alts = alternatives(it.exId, s.equipment, used);
  openModal(`
    <h2>Übung tauschen</h2>
    <p class="muted">Statt <strong>${esc(EX[it.exId].name)}</strong>:</p>
    ${alts.length ? `<div class="list">${alts.map((a) => `<button class="list-item" data-action="do-swap" data-b="${bi}" data-i="${ii}" data-ex="${a.id}"><strong>${esc(a.name)}</strong><span class="muted small">${a.reps[0]}–${a.reps[1]} Wdh.${isStagnating(data, a.id) ? ' · stagniert' : ''}</span></button>`).join('')}</div>`
      : '<p>Keine Alternative mit deinem heutigen Equipment.</p>'}
    <button class="btn ghost mt" data-action="close">Abbrechen</button>`);
}

// ---------- Version & Update ----------
const APP_FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/design-d.css', 'js/app.js', 'js/store.js', 'js/engine.js', 'js/exercises.js', 'js/coach.js', 'js/charts.js', 'js/goals.js', 'js/demo.js', 'trailer.html', 'sw.js'];

async function fillVersion() {
  const el = document.getElementById('app-version');
  if (!el) return;
  let v = 0;
  try { (await caches.keys()).forEach((k) => { const m = /^athletik-v(\d+)$/.exec(k); if (m) v = Math.max(v, +m[1]); }); } catch (e) { /* kein Cache */ }
  el.textContent = v ? `Version ${v}` : 'Version unbekannt';
}

// Notfall-Knopf: Offline-Speicher leeren, alle App-Dateien frisch vom Server holen, neu laden.
// Trainingsdaten (localStorage) bleiben unberührt.
async function forceUpdate() {
  if (!confirm('App-Dateien neu vom Server laden? Deine Trainingsdaten bleiben erhalten.')) return;
  toast('Lade neue Version …', 8000);
  try {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
    await Promise.all(APP_FILES.map((u) => fetch(u, { cache: 'reload' }).catch(() => null)));
  } catch (e) { /* trotzdem neu laden */ }
  location.reload();
}

// ---------- Intro-Trailer ----------
function introSeen() { try { return localStorage.getItem('athletik.introSeen') === '1'; } catch (e) { return true; } }

function showIntro(then) {
  const ov = document.createElement('div');
  ov.className = 'intro';
  ov.innerHTML = '<iframe src="trailer.html?embed=1" title="Intro-Trailer"></iframe><button class="intro-skip">Überspringen ›</button>';
  document.body.appendChild(ov);
  const done = () => {
    window.removeEventListener('message', onMsg);
    ov.remove();
    try { localStorage.setItem('athletik.introSeen', '1'); } catch (e) { /* optional */ }
    if (then) then();
  };
  const onMsg = (e) => { if (e.origin === location.origin && e.data && e.data.type === 'trailer-end') done(); };
  window.addEventListener('message', onMsg);
  ov.querySelector('.intro-skip').addEventListener('click', done);
}

// ---------- Einrichtung: Profil & Home-Gym ----------
let setupDraft = null;
const ACCENTS = [
  { id: 'lavender', name: 'Lavendel', a: '#c7b8ff', b: '#ffb8d2' },
  { id: 'mint', name: 'Mint', a: '#a7ecc9', b: '#acd8ff' },
  { id: 'sky', name: 'Himmelblau', a: '#acd8ff', b: '#c7b8ff' },
  { id: 'rose', name: 'Rosa', a: '#ffb8d2', b: '#ffc6a5' },
  { id: 'butter', name: 'Butter', a: '#ffe59c', b: '#ffc6a5' },
];

function setAccent(id) {
  if (!ACCENTS.some((c) => c.id === id)) id = 'lavender';
  data.settings.accent = id;
  if (id === 'lavender') document.documentElement.removeAttribute('data-accent');
  else document.documentElement.setAttribute('data-accent', id);
  try { localStorage.setItem('athletik.accent', id); } catch (e) { /* optional */ }
  persist();
}

// Niveau-Auswahl (Dropdown); die Stufe bestimmt die Start-Richtwerte in kg
function levelSelect(attr, cur) {
  return `<select class="in wide" ${attr}>${LEVELS.map((l) => `<option value="${l.id}" ${cur === l.id ? 'selected' : ''}>${esc(l.name)} (${esc(l.hint)})</option>`).join('')}</select>`;
}

// Wochentag-Auswahl für den festen Spieltag (Werte = getDay(), Anzeige Mo–So)
function matchDaySelect(attr, cur) {
  const opts = [1, 2, 3, 4, 5, 6, 0].map((d) => `<option value="${d}" ${String(cur) === String(d) ? 'selected' : ''}>${WEEKDAYS[d]}</option>`).join('');
  return `<select class="in" ${attr}><option value="" ${cur === '' || cur == null ? 'selected' : ''}>Kein fester Spieltag</option>${opts}</select>`;
}

function openSetup() {
  const p = data.profile;
  setupDraft = {
    age: p.setup ? p.age : '', weight: p.setup ? p.weight : '', sex: p.sex || '', level: levelOf(p).id,
    goal: p.goal || 'muscle', goalDate: p.goalDate || '', goalWeight: p.goalWeight || '',
    sport: p.sport || 'football', season: p.season || 'saison', matchDay: p.matchDay ?? '',
    days: p.days, duration: p.duration, notes: p.notes || '',
    homeGym: [...(data.homeGym || [])], homeGymNotes: data.homeGymNotes || '',
  };
  setupModal();
}

function setupModal() {
  const s = setupDraft;
  const chips = (action, values, cur, fmt = (v) => v) => values.map((v) => `<button class="chip small ${String(cur) === String(v) ? 'on' : ''}" data-action="${action}" data-v="${v}">${esc(fmt(v))}</button>`).join('');
  openModal(`
    <h2>Profil & Home-Gym</h2>
    <p class="muted small">Damit Plan und Claude zu dir passen. Alles bleibt nur auf diesem Gerät.</p>
    <div class="label">1. Dein Trainingsziel</div>
    <div class="chips">${GOALS.map((g) => `<button class="chip ${s.goal === g.id ? 'on' : ''}" data-action="su-goal" data-v="${g.id}">${esc(g.name)}</button>`).join('')}</div>
    <p class="muted small">${esc(GOAL[s.goal].desc)}</p>
    ${GOAL[s.goal].race ? `<label class="field"><span>Wettkampfdatum (optional)</span><input type="date" class="in" data-su="goalDate" min="${todayISO()}" value="${esc(s.goalDate)}"></label>` : ''}
    ${GOAL[s.goal].weightGoal ? `<label class="field"><span>Zielgewicht in kg (optional)</span><input class="in" data-su="goalWeight" inputmode="decimal" placeholder="z. B. 85" value="${esc(s.goalWeight)}"></label>` : ''}
    ${s.goal === 'sport' ? `
      <div class="label">Sportart</div>
      <div class="chips">${SPORTS.map((x) => `<button class="chip small ${s.sport === x.id ? 'on' : ''}" data-action="su-sport" data-v="${x.id}">${esc(x.name)}</button>`).join('')}</div>
      <p class="muted small">${esc(SPORT[s.sport].desc)}</p>
      <div class="label">Saisonphase</div>
      <div class="chips">${SEASONS.map((x) => `<button class="chip small ${s.season === x.id ? 'on' : ''}" data-action="su-season" data-v="${x.id}">${esc(x.name)}</button>`).join('')}</div>
      <p class="muted small">${esc(SEASON[s.season].desc)}</p>
      ${s.season !== 'pause' ? `<label class="field"><span>Fester Spieltag (optional)</span>${matchDaySelect('data-su="matchDay"', s.matchDay)}</label>
      <p class="muted small">Am Tag vor dem Spiel gibt es nur eine kurze Aktivierung, zwei Tage vorher keine schweren Beine, am Spieltag und danach Regeneration.</p>` : ''}
      <p class="muted small">Teamtrainings und Spiele trägst du über „Training nachtragen“ ein (Teamtraining bzw. Spiel / Match) – sie zählen zur Belastung.</p>` : ''}
    <div class="grid2">
      <label class="field"><span>Alter</span><input class="in" data-su="age" inputmode="numeric" value="${esc(s.age)}" placeholder="Jahre"></label>
      <label class="field"><span>Gewicht (kg)</span><input class="in" data-su="weight" inputmode="decimal" value="${esc(s.weight)}" placeholder="kg"></label>
    </div>
    <div class="label">Geschlecht</div>
    <div class="chips">${chips('su-sex', ['männlich', 'weiblich', 'divers'], s.sex)}</div>
    <label class="field"><span>Niveau</span>${levelSelect('data-su="level"', s.level)}</label>
    <div class="label">Trainingstage pro Woche</div>
    <div class="chips">${chips('su-days', [2, 3, 4, 5, 6], s.days)}</div>
    <div class="info-box"><span class="rec-star">★</span> <strong>Der Stern</strong> markiert beim Training die empfohlene Einheit für heute. Es gibt keine feste Reihenfolge: Die App schaut, welche Körperregion erholt ist (mind. 48 h), welche Muskeln diese Woche unter Zielvolumen liegen und welche Variante zuletzt dran war. Läufe und nachgetragene Trainings zählen mit. Du kannst jederzeit eine andere Einheit wählen.</div>
    <div class="label">Übliche Dauer</div>
    <div class="chips">${chips('su-dur', [45, 60, 75, 90, 105], s.duration, (v) => `${v} min`)}</div>
    ${GOAL[s.goal].volumeFocus && s.days <= 2 && s.goal !== 'fitness' ? '<p class="muted small">Hinweis: Mit 2 Tagen kommt jeder Muskel auf ca. 6–9 Sätze pro Woche – das wirkt, für optimalen Muskel- bzw. Kraftaufbau sind aber 3–4 Tage besser.</p>' : GOAL[s.goal].volumeFocus && s.duration < 90 && (s.days <= 2 || (s.days <= 3 && s.goal !== 'fitness')) ? '<p class="muted small">Tipp: Bei nur ' + s.days + ' Tagen sind für dieses Ziel 90 min sinnvoll, damit jeder Muskel auf ~10 Sätze pro Woche kommt.</p>' : ''}
    <label class="field"><span>Verletzungen / Hinweise (optional)</span><textarea class="in wide" data-su="notes" rows="2" placeholder="z. B. Knie links empfindlich bei tiefen Sprüngen">${esc(s.notes)}</textarea></label>
    <div class="label mt">Dein Home-Gym</div>
    <p class="muted small">Was hast du zu Hause? Leer lassen, wenn du nur im Studio trainierst.</p>
    <div class="chips">${EQUIPMENT.map((e) => `<button class="chip ${s.homeGym.includes(e.id) ? 'on' : ''}" data-action="su-equip" data-id="${e.id}">${esc(e.name)}</button>`).join('')}</div>
    <label class="field"><span>Details (optional)</span><textarea class="in wide" data-su="homeGymNotes" rows="2" placeholder="z. B. Kurzhanteln verstellbar 2–24 kg, Langhantel mit 100 kg Scheiben">${esc(s.homeGymNotes)}</textarea></label>
    <button class="btn primary" data-action="su-save">Speichern</button>
    <button class="btn ghost" data-action="close">Später</button>`);
}

function saveSetup() {
  const s = setupDraft;
  const age = parseInt(s.age, 10);
  const kg = parseFloat(String(s.weight).replace(',', '.'));
  if (!(age >= 14 && age <= 90)) { toast('Bitte ein Alter zwischen 14 und 90 eingeben.'); return; }
  if (!(kg > 35 && kg < 250)) { toast('Bitte ein gültiges Gewicht eingeben.'); return; }
  Object.assign(data.profile, { age, weight: kg, sex: s.sex, level: s.level, days: s.days, duration: s.duration, notes: s.notes.trim(), goal: s.goal, sport: s.sport, season: s.season, matchDay: s.matchDay, goalDate: GOAL[s.goal].race ? s.goalDate : '', goalWeight: GOAL[s.goal].weightGoal && parseFloat(String(s.goalWeight).replace(',', '.')) > 0 ? parseFloat(String(s.goalWeight).replace(',', '.')) : '', setup: true });
  setBodyweight({ kg });
  data.homeGym = s.homeGym.length ? [...s.homeGym] : null;
  if (data.location === 'home' && !data.homeGym) data.location = 'gym';
  data.homeGymNotes = s.homeGymNotes.trim();
  todayTpl = null;
  persist();
  closeModal();
  setupDraft = null;
  toast('Profil gespeichert.');
  render();
}

// Messung von heute speichern; leere optionale Werte behalten die heutige Messung (z. B. Waage morgens, Gewicht später)
function setBodyweight({ kg, muscle = null, fat = null }) {
  const prev = data.bodyweight.find((x) => x.date === todayISO()) || {};
  const e = { date: todayISO(), kg };
  const m = muscle ?? prev.muscle; const f = fat ?? prev.fat;
  if (m) e.muscle = m;
  if (f) e.fat = f;
  data.bodyweight = data.bodyweight.filter((x) => x.date !== todayISO());
  data.bodyweight.push(e);
  data.profile.weight = kg;
}

// ---------- Training nachtragen ----------
let actDraft = null;
const INT_HELP = {
  leicht: 'Locker – Unterhaltung problemlos möglich (RPE 2–4)',
  mittel: 'Fordernd – Reden nur in kurzen Sätzen (RPE 5–6)',
  hart: 'Sehr anstrengend – kaum Reden möglich (RPE 7–10)',
};

function newActivity() {
  actDraft = { type: 'jogging', date: todayISO(), minutes: 45, intensity: 'mittel', km: '', note: '' };
  activityModal();
}

function activityModal() {
  const a = actDraft;
  const def = ACT[a.type];
  const editing = (data.activities || []).some((x) => x.id === a.id);
  openModal(`
    <h2>${editing ? 'Training bearbeiten' : 'Training nachtragen'}</h2>
    <div class="label">Art</div>
    <div class="chips">${ACTIVITIES.map((x) => `<button class="chip ${x.id === a.type ? 'on' : ''}" data-action="act-type" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>
    <div class="grid2">
      <label class="field"><span>Datum</span><input type="date" class="in" id="act-date" max="${todayISO()}" value="${esc(a.date)}"></label>
      <label class="field"><span>Dauer (min)</span><input class="in" id="act-min" inputmode="numeric" value="${esc(a.minutes)}"></label>
    </div>
    <div class="chips">${[20, 30, 45, 60, 90].map((m) => `<button class="chip small ${+a.minutes === m ? 'on' : ''}" data-action="act-min" data-min="${m}">${m} min</button>`).join('')}</div>
    <div class="label mt">Anstrengung</div>
    <div class="chips">${Object.keys(INTENSITY).map((k) => `<button class="chip ${a.intensity === k ? 'on' : ''}" data-action="act-int" data-k="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
    <p class="muted small">${INT_HELP[a.intensity]}</p>
    ${def.dist ? `<label class="field"><span>Strecke in km (optional)</span><input class="in" id="act-km" inputmode="decimal" value="${esc(a.km || '')}"></label>` : ''}
    <label class="field"><span>${a.type === 'course' ? 'Welcher Kurs?' : 'Notiz (optional)'}</span><textarea class="in wide" id="act-note" rows="2" placeholder="${a.type === 'course' ? 'z. B. Spinning, Bodypump, Pilates, Zumba' : 'z. B. 6 × 400 m Intervalle, Knie ok'}">${esc(a.note || '')}</textarea></label>
    <button class="btn primary" data-action="act-save">Speichern</button>
    <button class="btn ghost" data-action="close">Abbrechen</button>`);
}

function saveActivity() {
  const a = actDraft;
  const minutes = Math.round(parseFloat(String(a.minutes).replace(',', '.')));
  if (!(minutes > 0 && minutes <= 600)) { toast('Bitte eine Dauer zwischen 1 und 600 min eingeben.'); return; }
  if (!a.date || a.date > todayISO()) { toast('Bitte ein Datum bis heute wählen.'); return; }
  const km = parseFloat(String(a.km || '').replace(',', '.'));
  const entry = { id: a.id || uid(), type: a.type, date: a.date, minutes, intensity: a.intensity, note: (a.note || '').trim() };
  if (ACT[a.type].dist && km > 0) entry.km = Math.round(km * 100) / 100;
  data.activities = (data.activities || []).filter((x) => x.id !== entry.id);
  data.activities.push(entry);
  data.activities.sort((x, y) => x.date.localeCompare(y.date));
  persist();
  closeModal();
  actDraft = null;
  toast(`${ACT[entry.type].name} gespeichert.`);
  render();
}

// ---------- Verlauf ----------
function renderActivityCard(a) {
  const def = ACT[a.type] || { name: a.type };
  return `
    <article class="card hist">
      <div class="hist-head static">
        <div><strong>${esc(def.name)}</strong> <span class="tag t-activity">Nachgetragen</span>
          <div class="muted small">${fmtDate(a.date)} · ${a.minutes} min · ${esc(a.intensity)}${a.km ? ` · ${num(a.km)} km` : ''} · Last ${activityLoad(a)}</div>
          ${a.note ? `<div class="small mt-s">${esc(a.note)}</div>` : ''}
        </div>
        <div class="col-actions">
          <button class="link" data-action="act-edit" data-id="${a.id}">Bearbeiten</button>
          <button class="link danger" data-action="act-del" data-id="${a.id}">Löschen</button>
        </div>
      </div>
    </article>`;
}

// ---------- Monatsübersicht ----------
let histMonth = todayISO().slice(0, 7);
const monthName = (ym) => new Date(`${ym}-01T12:00:00`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
const unitLabel = (s) => (s.template === 'RUN' ? 'Laufen' : s.template === 'HYX' ? 'HYROX' : (TEMPLATES[s.template]?.name || s.title).split(' – ')[0]);
const actLabel = (a) => (a.type === 'jogging' ? 'Laufen' : a.type === 'course' && a.note ? `Kurs: ${a.note.split(/[,\n]/)[0].trim()}` : ACT[a.type]?.name || a.type);

function monthCounts(ym) {
  const m = new Map();
  const add = (label) => { const e = m.get(label) || { label, value: 0 }; e.value += 1; m.set(label, e); };
  data.sessions.filter((s) => s.date.startsWith(ym)).forEach((s) => add(unitLabel(s)));
  (data.activities || []).filter((a) => a.date.startsWith(ym)).forEach((a) => add(actLabel(a)));
  return [...m.values()].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function drawMonth() {
  const box = $('#chart-month');
  if (!box) return;
  const items = monthCounts(histMonth);
  const plan = data.sessions.filter((s) => s.date.startsWith(histMonth)).length;
  const act = (data.activities || []).filter((a) => a.date.startsWith(histMonth)).length;
  if (!items.length) { box.innerHTML = '<div class="chart-card"><p class="muted center">Keine Einheiten in diesem Monat.</p></div>'; return; }
  barChart(box, {
    title: `Einheiten im ${monthName(histMonth).split(' ')[0]}`,
    sub: `${plural(plan + act, 'Einheit', 'Einheiten')} · ${plan} Plan · ${act} nachgetragen`,
    items, band: null, color: cssVar('--series-1'), unit: 'Einheiten', labelHeader: 'Einheit', suffix: '×',
  });
}

function renderHistory() {
  const entries = [
    ...data.sessions.filter((s) => s.date.startsWith(histMonth)).map((s) => ({ date: s.date, ts: s.finishedAt || s.startedAt || 0, html: () => renderSessionCard(s) })),
    ...(data.activities || []).filter((a) => a.date.startsWith(histMonth)).map((a) => ({ date: a.date, ts: 0, html: () => renderActivityCard(a) })),
  ].sort((x, y) => y.date.localeCompare(x.date) || y.ts - x.ts);
  const isCurrent = histMonth >= todayISO().slice(0, 7);
  return `
  <header class="page-head"><h1>Verlauf</h1><button class="chip" data-action="act-new">+ Nachtragen</button></header>
  <div class="month-nav">
    <button class="chip small" data-action="hist-month" data-d="-1" aria-label="Vormonat">‹</button>
    <strong>${esc(monthName(histMonth))}</strong>
    <button class="chip small" data-action="hist-month" data-d="1" aria-label="Nächster Monat" ${isCurrent ? 'disabled' : ''}>›</button>
  </div>
  <div id="chart-month"></div>
  ${!entries.length ? '<p class="muted center mt">Noch keine Einheiten in diesem Monat.</p>' : ''}
  ${entries.map((e) => e.html()).join('')}`;
}

function renderSessionCard(s) {
  return `
    <article class="card hist ${openHistory === s.id ? 'open' : ''}">
      <button class="hist-head" data-action="hist" data-id="${s.id}">
        <div><strong>${esc(s.title)}</strong>${(s.records || []).length ? ' <span class="tag t-pr">Rekord</span>' : ''}<div class="muted small">${fmtDate(s.date)} · ${sessionSummary(s)}${s.source === 'claude' ? ' · Claude' : ''}</div></div>
        <span class="chev">›</span>
      </button>
      ${openHistory === s.id ? `<div class="hist-body">
        ${s.blocks.flatMap((b) => b.items).filter((it) => it.sets.some((x) => x.done) || it.done).map((it) => `
          <div class="hist-ex"><span>${esc(EX[it.exId]?.name || it.exId)}</span>
          <span class="muted">${it.sets.length ? it.sets.filter((x) => x.done).map((x) => `${x.w !== '' && x.w != null && EX[it.exId]?.load !== 'none' ? `${num(Number(x.w))}×` : ''}${x.r}`).join(' · ') : '✓'}</span></div>`).join('')}
        ${(s.records || []).length ? `<div class="pr-box small">${s.records.map((r) => { const t = recordText(r); return `<div class="pr-row"><b>${esc(t.name)}</b><span>${esc(t.text)}</span></div>`; }).join('')}</div>` : ''}
        ${s.autoEffort ? `<p class="muted small mt-s">Belastung laut Wdh.: ${({ easy: 'eher zu leicht', right: 'passend', too_hard: 'eher zu schwer' })[s.autoEffort]}</p>` : ''}
        ${s.feedback ? `<p class="muted small mt-s">Rückmeldung: ${esc([s.feedback.liked ? ({ yes: 'gefallen', meh: 'geht so', no: 'nicht gefallen' })[s.feedback.liked] : '', ...(s.feedback.pain || []).map((p) => PAIN_NAME[p])].filter(Boolean).join(' · ') || '–')}${s.feedback.note ? ` – „${esc(s.feedback.note)}“` : ''}</p>` : `<button class="link mt" data-action="fb-later" data-id="${s.id}">Rückmeldung geben</button>`}
        <div class="hist-actions">
          ${s.blocks.some((b) => b.items.length) ? `<button class="btn small" data-action="repeat" data-id="${s.id}">Nochmal machen</button>` : ''}
          <button class="link danger" data-action="del-session" data-id="${s.id}">Einheit löschen</button>
        </div>
      </div>` : ''}
    </article>`;
}

// ---------- Fortschritt ----------
function renderProgress() {
  const tracked = trackedExercises(data);
  if (!progressEx || !tracked.some((e) => e.id === progressEx)) progressEx = tracked[0]?.id || null;
  const bw = bodyweightSeries(data);
  const bwLast = bw[bw.length - 1];
  const bwOld = bw.filter((p) => daysBetween(p.date, todayISO()) >= 28).pop();
  const planWeek = data.sessions.filter((s) => daysBetween(s.date, todayISO()) < 7).length;
  const actWeek = (data.activities || []).filter((a) => { const d = daysBetween(a.date, todayISO()); return d >= 0 && d < 7; }).length;
  const thisWeek = planWeek + actWeek;
  const todayBw = data.bodyweight.find((e) => e.date === todayISO());
  const bc = bodyComp(data);
  const sgn = (v, unit) => `${v >= 0 ? '+' : '−'}${num(Math.abs(v))} ${unit}`;
  return `
  <header class="page-head"><h1>Fortschritt</h1></header>
  <div class="tiles">
    <div class="tile"><div class="tile-label">Einheiten (7 Tage)</div><div class="tile-val">${thisWeek}<span class="muted small"> / ${data.profile.days}</span></div>
      <div class="tile-delta">${planWeek} Plan · ${actWeek} nachgetragen</div></div>

    <div class="tile"><div class="tile-label">Körpergewicht Ø 7 Tage</div><div class="tile-val">${bwLast ? num(bwLast.avg) : '–'}<span class="muted small"> kg</span></div>
      ${bwLast && bwOld ? `<div class="tile-delta">${bwLast.avg - bwOld.avg >= 0 ? '+' : '−'}${num(Math.abs(bwLast.avg - bwOld.avg))} kg vs. vor 4 Wochen</div>` : ''}</div>
    ${goalOf(data).weightGoal ? (() => {
      const ws = weightStatus(data, bw);
      if (ws.perWeek == null) return '<div class="tile"><div class="tile-label">Abnehm-Tempo</div><div class="tile-val">–</div><div class="tile-delta">Ab 1 Woche Messungen sichtbar</div></div>';
      const pct = -ws.pctWeek;
      const verdict = pct < 0.25 ? 'langsam – Defizit prüfen' : pct <= 1 ? 'im Zielbereich 0,5–1 %' : 'schnell – Muskeln schützen';
      return `<div class="tile"><div class="tile-label">Abnehm-Tempo</div><div class="tile-val">${ws.perWeek <= 0 ? '−' : '+'}${num(Math.abs(ws.perWeek))}<span class="muted small"> kg/Woche</span></div><div class="tile-delta">${num(Math.abs(ws.pctWeek))} % · ${verdict}</div></div>`;
    })() : ''}
    ${bc ? `<div class="tile"><div class="tile-label">Körperzusammensetzung</div><div class="tile-val">${bc.cur.fat ? num(bc.cur.fat) : '–'}<span class="muted small"> % Fett</span></div>
      <div class="tile-delta">${bc.cur.muscle ? `${num(bc.cur.muscle)} kg Muskel` : ''}${bc.old ? `${bc.cur.muscle ? ' · ' : ''}${[bc.dFat != null ? sgn(bc.dFat, '%-P.') : '', bc.dMuscle != null ? sgn(bc.dMuscle, 'kg Muskel') : ''].filter(Boolean).join(', ')} in ${bc.weeks} Wo.` : ''}</div></div>` : ''}
    ${(() => { const a = activitySummary(data, 7); const prev = activitySummary(data, 14).load - a.load; return `
    <div class="tile"><div class="tile-label">Ausdauer & Sport (7 Tage)</div><div class="tile-val">${a.minutes}<span class="muted small"> min</span></div>
      <div class="tile-delta">${a.count} ${a.count === 1 ? 'Einheit' : 'Einheiten'}${a.km ? ` · ${num(a.km)} km gelaufen` : ''}</div></div>
    <div class="tile"><div class="tile-label">Zusatz-Last (sRPE)</div><div class="tile-val">${a.load}</div>
      <div class="tile-delta">Vorwoche: ${prev}</div></div>`; })()}
  </div>

  <section class="card">
    <div class="label">Körpergewicht heute eintragen</div>
    <div class="grid3">
      <label class="field"><span>Gewicht kg</span><input id="bw-in" class="in" inputmode="decimal" placeholder="kg" value="${todayBw ? esc(fmtW(todayBw.kg)) : ''}"></label>
      <label class="field"><span>Muskel kg</span><input id="bw-muscle" class="in" inputmode="decimal" placeholder="optional" value="${todayBw && todayBw.muscle ? esc(fmtW(todayBw.muscle)) : ''}"></label>
      <label class="field"><span>Fett %</span><input id="bw-fat" class="in" inputmode="decimal" placeholder="optional" value="${todayBw && todayBw.fat ? esc(fmtW(todayBw.fat)) : ''}"></label>
    </div>
    <button class="btn small primary" data-action="save-bw">Speichern</button>
    <p class="muted small">Am besten morgens nüchtern, gleiche Bedingungen. Muskelmasse und Körperfett (z. B. von einer Körperanalyse-Waage) sind optional – der Plan reagiert nur auf Trends über mehrere Wochen.</p>
  </section>
  <div id="chart-bw"></div>
  <div id="chart-muscle"></div>
  <div id="chart-fat"></div>

  ${(() => {
    const rec = allRecords(data);
    if (!rec.lifts.length && !rec.longest) return '';
    return `<section class="card"><div class="label">🏆 Deine Rekorde</div>
      ${rec.lifts.slice(0, 8).map((r) => `<div class="pr-row"><b>${esc(r.name)}</b><span>1RM ca. ${kgTxt(r.e1rm)} kg · ${r.bw ? '+' : ''}${kgTxt(r.w)} × ${r.r} · ${fmtDate(r.date)}</span></div>`).join('')}
      ${rec.longest ? `<div class="pr-row"><b>Längster Lauf</b><span>${kgTxt(rec.longest.km)} km · ${fmtDate(rec.longest.date)}</span></div>` : ''}
      ${rec.fastest ? `<div class="pr-row"><b>Schnellste Pace (ab 3 km)</b><span>${paceTxt(rec.fastest.min / rec.fastest.km)} · ${fmtDate(rec.fastest.date)}</span></div>` : ''}
    </section>`;
  })()}

  <section class="card">
    <div class="label">Kraftentwicklung</div>
    ${tracked.length ? `<select id="ex-select" class="in wide">${tracked.map((e) => `<option value="${e.id}" ${e.id === progressEx ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>` : '<p class="muted">Sobald du Sätze einträgst, siehst du hier deine Entwicklung.</p>'}
  </section>
  <div id="chart-ex"></div>
  <div id="chart-vol"></div>`;
}

function drawCharts() {
  const blue = cssVar('--series-1');
  const gray = cssVar('--series-muted');
  const bwRaw = bodyweightSeries(data);
  const gw = goalOf(data).weightGoal ? weightStatus(data, bwRaw).goalW : null;
  const bw = gw ? bwRaw.map((r) => ({ ...r, goal: gw })) : bwRaw;
  lineChart($('#chart-bw'), {
    title: 'Körpergewicht', sub: gw ? `Punkte = Messung, Linie = 7-Tage-Mittel, Ziel ${num(gw)} kg` : 'Punkte = Messung, Linie = 7-Tage-Mittel',
    rows: bw,
    series: [
      { name: 'Messung', key: 'kg', style: 'dots', color: gray },
      { name: '7-Tage-Mittel', key: 'avg', style: 'line', color: blue },
      ...(goalOf(data).weightGoal && weightStatus(data, bw).goalW ? [{ name: 'Zielgewicht', key: 'goal', style: 'line', color: cssVar(data.settings.accent === 'mint' ? '--lav' : '--mint') || gray }] : []),
    ],
    tableHeaders: ['Datum', 'kg', 'Ø 7 Tage'],
    tableRow: (r) => [r.date, num(r.kg), num(r.avg)],
    empty: 'Trag dein Gewicht ein, um den Verlauf zu sehen.',
  });
  const comp = bodyCompSeries(data);
  const box = (id) => { const b = $(id); if (b) b.innerHTML = ''; return b; };
  if (comp.some((r) => r.muscle) && box('#chart-muscle')) lineChart($('#chart-muscle'), {
    title: 'Muskelmasse', sub: 'Laut Waage – Trend über Wochen zählt', rows: comp.filter((r) => r.muscle),
    series: [{ name: 'Muskelmasse', key: 'muscle', style: 'line', color: cssVar('--mint') || blue }],
    tableHeaders: ['Datum', 'Muskel kg'], tableRow: (r) => [r.date, num(r.muscle)],
  });
  if (comp.some((r) => r.fat) && box('#chart-fat')) lineChart($('#chart-fat'), {
    title: 'Körperfett', sub: 'Laut Waage – Trend über Wochen zählt', unit: '%', rows: comp.filter((r) => r.fat),
    series: [{ name: 'Körperfett', key: 'fat', style: 'line', color: cssVar('--pink') || blue }],
    tableHeaders: ['Datum', 'Fett %', 'Fett kg'], tableRow: (r) => [r.date, num(r.fat), num(r.fatKg)],
  });
  if (progressEx) {
    const ex = EX[progressEx];
    const rows = exerciseSeries(data, progressEx);
    lineChart($('#chart-ex'), {
      title: ex.name, sub: ex.load === 'bw' ? 'Geschätztes 1RM inkl. Körpergewicht' : 'Geschätztes 1RM (Epley) aus dem besten Satz',
      rows,
      series: [{ name: 'geschätztes 1RM', key: 'e1rm', style: 'line', color: blue, fmt: (r) => `${num(r.e1rm)} kg · bester Satz ${r.bw ? '+' : ''}${num(r.w)} kg × ${r.r}` }],
      tableHeaders: ['Datum', 'Bester Satz', '1RM ca.'],
      tableRow: (r) => [r.date, `${r.bw ? '+' : ''}${num(r.w)} kg × ${r.r}`, `${num(r.e1rm)} kg`],
    });
  }
  const vol = weeklyVolume(data, 7);
  barChart($('#chart-vol'), {
    title: 'Wochenvolumen pro Muskel', sub: 'Harte Sätze, letzte 7 Tage · Zielbereich 10–20',
    items: Object.entries(MUSCLES).map(([k, label]) => ({ label, value: vol[k] })),
    color: blue,
  });
}

// ---------- Coach ----------
function renderCoach() {
  const c = data.coach;
  const hasKey = data.settings.useClaude && data.settings.apiKey;
  return `
  <header class="page-head"><h1>Coach</h1></header>
  <section class="card">
    <p>Einmal pro Woche wertet Claude dein Training aus: Volumen pro Muskel, Kraftentwicklung, Stagnation und Körpergewicht. Die Anpassungen fließen automatisch in jede neue Einheit ein, auch offline.</p>
    ${hasKey ? `<button class="btn primary" data-action="review" ${busy ? 'disabled' : ''}>${busy === 'review' ? '<span class="spinner"></span> Claude analysiert …' : 'Wochen-Check starten'}</button>`
      : '<p class="muted">Dafür brauchst du einen Claude-API-Key (Einstellungen).</p>'}
  </section>
  ${c ? `
  <section class="card">
    <div class="label">Check vom ${fmtDate(c.date)}</div>
    <p>${esc(c.summary)}</p>
    ${c.focus ? `<div class="label mt">Fokus</div><p>${esc(c.focus)}</p>` : ''}
    ${c.deloadUntil && c.deloadUntil >= todayISO() ? `<p class="pill warn">Deload aktiv bis ${fmtDate(c.deloadUntil)}</p>` : ''}
    ${(c.volumeAdjust || []).length ? `<div class="label mt">Volumen-Anpassung</div>
      <ul class="adj">${c.volumeAdjust.map((v) => `<li><strong>${esc(MUSCLES[v.muscle] || v.muscle)} ${v.delta > 0 ? '+' : ''}${esc(v.delta)} Sätze/Woche</strong><br><span class="muted small">${esc(v.reason)}</span></li>`).join('')}</ul>` : ''}
    ${(c.avoid || []).length ? `<div class="label mt">Vorerst ersetzen</div><p>${c.avoid.map((id) => esc(EX[id]?.name || id)).join(', ')}</p>` : ''}
    ${(c.tips || []).length ? `<div class="label mt">Tipps</div><ul class="cues">${c.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <button class="link danger mt" data-action="reset-coach">Anpassungen zurücksetzen</button>
  </section>` : ''}
  <section class="card soft">
    <div class="label">So passt sich dein Plan an</div>
    <ul class="cues">
      <li><strong>Jede Einheit:</strong> Schaffst du in allen Sätzen das obere Wdh.-Ziel, steigt das Gewicht. Zweimal darunter: −5 %.</li>
      <li><strong>Blöcke:</strong> 4 Wochen Belastung mit steigendem Volumen, dann 1 Woche Deload.</li>
      <li><strong>Stagnation:</strong> Kommt eine Übung 3 Einheiten nicht voran, wird eine Variante gewählt.</li>
      <li><strong>Wochen-Check:</strong> Claude justiert die Sätze pro Muskel und den Fokus.</li>
    </ul>
  </section>`;
}

async function runReview() {
  busy = 'review'; render();
  try {
    const r = await weeklyReview(data);
    const valid = (r.volumeAdjust || []).filter((v) => MUSCLES[v.muscle]).map((v) => ({ ...v, delta: Math.max(-4, Math.min(4, Math.round(v.delta))) }));
    data.coach = {
      date: todayISO(), summary: r.summary, focus: r.focus, tips: r.tips || [],
      volumeAdjust: valid, avoid: (r.avoid || []).filter((id) => EX[id]),
      deloadUntil: r.deloadNow ? todayISO(new Date(Date.now() + 6 * 86400000)) : null,
    };
    persist();
    toast('Plan angepasst.');
  } catch (e) {
    toast(e instanceof CoachError ? e.message : 'Unerwarteter Fehler.', 5000);
    console.error(e);
  } finally {
    busy = null; render();
  }
}

// ---------- Einstellungen ----------
function renderSettings() {
  const p = data.profile;
  return `
  <header class="page-head"><h1>Einstellungen</h1></header>
  <section class="card">
    <div class="label">Farbe</div>
    <div class="swatches">${ACCENTS.map((c) => `<div class="swatch-wrap"><button class="swatch ${(data.settings.accent || 'lavender') === c.id ? 'on' : ''}" style="background:linear-gradient(135deg, ${c.a}, ${c.b})" data-action="accent" data-v="${c.id}" aria-label="${c.name}"></button><span class="swatch-label">${c.name}</span></div>`).join('')}</div>
  </section>
  <section class="card">
    <div class="label">Mein Home-Gym</div>
    <div class="chips">${EQUIPMENT.map((e) => `<button class="chip ${(data.homeGym || []).includes(e.id) ? 'on' : ''}" data-action="home-equip" data-id="${e.id}">${esc(e.name)}</button>`).join('')}</div>
    <label class="field"><span>Details (optional, für Claude)</span><textarea class="in wide" id="home-notes" rows="2" placeholder="z. B. Kurzhanteln verstellbar 2–24 kg, Langhantel mit 100 kg Scheiben, Klimmzugstange im Türrahmen">${esc(data.homeGymNotes || '')}</textarea></label>
    <p class="muted small">Wird mit „Home-Gym“ beim Training übernommen.</p>
  </section>
  <section class="card">
    <div class="label">Claude</div>
    <label class="field"><span>API-Key</span><input id="api-key" class="in wide" type="password" autocomplete="off" placeholder="sk-ant-…" value="${esc(data.settings.apiKey)}"></label>
    <label class="switch"><input type="checkbox" id="use-claude" ${data.settings.useClaude ? 'checked' : ''}> Claude für Planung & Wochen-Check nutzen</label>
    <p class="muted small">Der Key bleibt nur auf diesem Gerät und wird ausschließlich an api.anthropic.com gesendet. Modell: ${MODEL}. Kosten ca. 5–10 Cent pro geplanter Einheit.</p>
  </section>
  <section class="card">
    <div class="label">Profil</div>
    <div class="grid2">
      <label class="field"><span>Alter</span><input class="in" data-prof="age" inputmode="numeric" value="${esc(p.age)}"></label>
      <label class="field"><span>Gewicht (kg)</span><input class="in" data-prof="weight" inputmode="decimal" value="${esc(p.weight)}"></label>
      <label class="field"><span>Trainingstage/Woche</span>
        <select class="in" data-prof="days">${[2, 3, 4, 5, 6].map((d) => `<option ${p.days === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
      <label class="field"><span>Dauer (min)</span>
        <select class="in" data-prof="duration">${[30, 45, 60, 75, 90, 105, 120].map((d) => `<option ${p.duration === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Trainingsziel</span><select class="in" data-prof="goal">${GOALS.map((g) => `<option value="${g.id}" ${goalOf(data).id === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
    ${goalOf(data).race ? `<label class="field"><span>Wettkampfdatum (optional)</span><input type="date" class="in" data-prof="goalDate" min="${todayISO()}" value="${esc(p.goalDate || '')}"></label>` : ''}
    ${goalOf(data).weightGoal ? `<label class="field"><span>Zielgewicht in kg (optional)</span><input class="in" data-prof="goalWeight" inputmode="decimal" placeholder="z. B. 85" value="${esc(p.goalWeight || '')}"></label>` : ''}
    ${p.goal === 'sport' ? `<div class="grid2">
      <label class="field"><span>Sportart</span><select class="in" data-prof="sport">${SPORTS.map((x) => `<option value="${x.id}" ${goalOf(data).sport === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Saisonphase</span><select class="in" data-prof="season">${SEASONS.map((x) => `<option value="${x.id}" ${goalOf(data).season === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
    </div>
    ${goalOf(data).season !== 'pause' ? `<label class="field"><span>Fester Spieltag (optional)</span>${matchDaySelect('data-prof="matchDay"', p.matchDay)}</label>` : ''}` : ''}
    <label class="field"><span>Geschlecht</span><select class="in" data-prof="sex">${['', 'männlich', 'weiblich', 'divers'].map((s) => `<option value="${s}" ${p.sex === s ? 'selected' : ''}>${s || '– bitte wählen –'}</option>`).join('')}</select></label>
    <label class="field"><span>Niveau</span>${levelSelect('data-prof="level"', levelOf(p).id)}</label>
    <label class="field"><span>Verletzungen / Hinweise für Claude</span><textarea class="in wide" data-prof="notes" rows="2" placeholder="z. B. Knie links empfindlich bei tiefen Sprüngen">${esc(p.notes)}</textarea></label>
    <button class="btn small" data-action="setup">Einrichtungs-Assistent öffnen</button>
    <p class="muted small">Wochenplan bei ${p.days} Tagen (${esc(goalOf(data).name)}): ${rotationFor(data).map((k) => TEMPLATES[k].name.split(' – ')[0]).join(', ')}. Die Reihenfolge empfiehlt der Stern ★ jeden Tag neu.</p>
  </section>
  <section class="card">
    <div class="label">Trainingsblock</div>
    <p class="muted small">Aktueller Block seit ${fmtDate(data.block.start)} · Woche ${blockInfo(data).week} von 5.</p>
    <button class="btn small" data-action="new-block">Neuen Block starten</button>
  </section>
  ${(data.dislikes || []).length ? `<section class="card">
    <div class="label">Ausgeblendete Übungen</div>
    <p class="muted small">Werden bei der Planung ersetzt. Tippen zum Wieder-Einblenden.</p>
    <div class="chips">${data.dislikes.map((id) => `<button class="chip small" data-action="undislike" data-id="${id}">${esc(EX[id]?.name || id)} ✕</button>`).join('')}</div>
  </section>` : ''}
  <section class="card">
    <div class="label">Über die App</div>
    <button class="btn small" data-action="intro">▶ Intro-Trailer ansehen</button>
    <p class="muted small mt"><span id="app-version">Version …</span> · Neue Versionen lädt die App automatisch.</p>
    <button class="btn small ghost" data-action="force-update">Update erzwingen</button>
  </section>
  <section class="card">
    <div class="label">Daten</div>
    <p class="muted small">Alle Daten liegen lokal auf dem iPhone. Exportiere regelmäßig ein Backup (z. B. in iCloud Drive).</p>
    <div class="row wrap">
      <button class="btn small" data-action="export">Backup exportieren</button>
      <label class="btn small">Backup importieren<input type="file" id="import-file" accept="application/json" hidden></label>
      <button class="btn small ghost danger" data-action="wipe">Alles löschen</button>
    </div>
  </section>
  <p class="muted small center">Athletik · Regelwerk siehe REGELWERK.md</p>`;
}

// ---------- Events ----------
function itemAt(el) { return data.active.blocks[+el.dataset.b].items[+el.dataset.i]; }

document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-action], .tab');
  if (!t) return;
  if (t.classList.contains('tab')) { setView(t.dataset.view); return; }
  const a = t.dataset.action;
  switch (a) {
    case 'goto': setView(t.dataset.to); break;
    case 'tpl': todayTpl = t.dataset.tpl; render(); break;
    case 'runtype': runType = t.dataset.id; render(); break;
    case 'dur': data.profile.duration = +t.dataset.min; persist(); render(); break;
    case 'loc': {
      const id = t.dataset.id;
      if (id === 'home' && !data.homeGym) { toast('Richte zuerst dein Home-Gym ein.'); openSetup(); break; }
      data.location = id; data.equipment = equipFor(id); persist(); render(); break;
    }
    case 'setup': openSetup(); break;
    case 'intro': showIntro(null); break;
    case 'force-update': forceUpdate(); break;
    case 'fb': fbDraft[t.dataset.k] = fbDraft[t.dataset.k] === t.dataset.v ? '' : t.dataset.v; feedbackModal(); break;
    case 'fb-pain': { const id = t.dataset.id; fbDraft.pain = id === 'none' ? [] : fbDraft.pain.includes(id) ? fbDraft.pain.filter((x) => x !== id) : [...fbDraft.pain, id]; feedbackModal(); break; }
    case 'fb-dislike': { const id = t.dataset.id; fbDraft.dislikes = fbDraft.dislikes.includes(id) ? fbDraft.dislikes.filter((x) => x !== id) : [...fbDraft.dislikes, id]; feedbackModal(); break; }
    case 'fb-save': saveFeedback(); break;
    case 'fb-skip': fbDraft = null; closeModal(); toast('Okay – du kannst die Rückmeldung im Verlauf nachholen.'); break;
    case 'fb-later': { const s = data.sessions.find((x) => x.id === t.dataset.id); if (s) openFeedback(s); break; }
    case 'undislike': data.dislikes = (data.dislikes || []).filter((x) => x !== t.dataset.id); persist(); render(); toast('Übung wieder eingeblendet.'); break;
    case 'su-sex': setupDraft.sex = t.dataset.v; setupModal(); break;
    case 'su-days': setupDraft.days = +t.dataset.v; setupModal(); break;
    case 'su-goal': setupDraft.goal = t.dataset.v; setupModal(); break;
    case 'su-sport': setupDraft.sport = t.dataset.v; setupModal(); break;
    case 'su-season': setupDraft.season = t.dataset.v; setupModal(); break;
    case 'su-dur': setupDraft.duration = +t.dataset.v; setupModal(); break;
    case 'su-equip': { const id = t.dataset.id; setupDraft.homeGym = setupDraft.homeGym.includes(id) ? setupDraft.homeGym.filter((x) => x !== id) : [...setupDraft.homeGym, id]; setupModal(); break; }
    case 'su-save': saveSetup(); break;
    case 'home-equip': {
      const id = t.dataset.id; const hg = data.homeGym || [];
      data.homeGym = hg.includes(id) ? hg.filter((x) => x !== id) : [...hg, id]; persist(); render(); break;
    }
    case 'accent': setAccent(t.dataset.v); render(); break;
    case 'equip': {
      const id = t.dataset.id; const tr = data.travelEquip || [];
      data.travelEquip = tr.includes(id) ? tr.filter((x) => x !== id) : [...tr, id];
      data.equipment = [...data.travelEquip];
      persist(); render(); break;
    }
    case 'plan-ai': wish = ($('#wish') || {}).value || ''; startPlan(true); break;
    case 'plan-rule': wish = ($('#wish') || {}).value || ''; startPlan(false); break;
    case 'set-done': {
      const it = itemAt(t); const st = it.sets[+t.dataset.s];
      const missing = st.r === '' ? 'r' : (EX[it.exId].load === 'kg' && st.w === '' ? 'w' : null);
      if (!st.done && missing) {
        const inp = document.querySelector(`input[data-field="${missing}"][data-b="${t.dataset.b}"][data-i="${t.dataset.i}"][data-s="${t.dataset.s}"]`);
        if (inp) { inp.focus(); inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); }
        return;
      }
      const key = `${t.dataset.b}:${t.dataset.i}:${t.dataset.s}`;
      if (st.done && lastAuto.key === key && Date.now() - lastAuto.at < 1500) { render(); break; } // gerade automatisch abgehakt
      st.done = !st.done;
      if (st.done) { carryWeight(it, +t.dataset.s); startTimer(it.rest); }
      persist(); render(); break;
    }
    case 'item-done': { const it = itemAt(t); it.done = !it.done; persist(); render(); break; }
    case 'add-set': { const it = itemAt(t); const lastS = it.sets[it.sets.length - 1]; it.sets.push({ tw: lastS?.w ?? '', w: lastS?.w ?? '', r: '', done: false }); persist(); render(); break; }
    case 'remove': { if (!confirm('Übung aus der heutigen Einheit entfernen?')) return; data.active.blocks[+t.dataset.b].items.splice(+t.dataset.i, 1); persist(); render(); break; }
    case 'cues': { const u = $(`#cues-${t.dataset.uid}`); if (u) u.hidden = !u.hidden; break; }
    case 'video': videoModal(t.dataset.ex); break;
    case 'save-video': {
      const url = $('#vid-url').value.trim();
      if (url && !youtubeId(url)) { toast('Bitte einen YouTube-Link einfügen.'); return; }
      if (url) data.videos[t.dataset.ex] = url; else delete data.videos[t.dataset.ex];
      persist(); videoModal(t.dataset.ex); toast(url ? 'Video gespeichert.' : 'Video entfernt.'); break;
    }
    case 'swap': swapModal(+t.dataset.b, +t.dataset.i); break;
    case 'do-swap': {
      const old = itemAt(t); const ex = EX[t.dataset.ex];
      const n = makeItem(data, ex, Math.max(1, old.sets.length), { main: old.main, deload: data.active.deload });
      n.slotKey = old.slotKey; n.prio = old.prio;
      if (old.ss) { n.ss = old.ss; n.rest = old.rest; }
      data.active.blocks[+t.dataset.b].items[+t.dataset.i] = n;
      persist(); closeModal(); render(); break;
    }
    case 'close': closeModal(); actDraft = null; setupDraft = null; fbDraft = null; break;
    case 'act-new': newActivity(); break;
    case 'act-type': actDraft.type = t.dataset.id; activityModal(); break;
    case 'act-min': actDraft.minutes = +t.dataset.min; activityModal(); break;
    case 'act-int': actDraft.intensity = t.dataset.k; activityModal(); break;
    case 'act-save': saveActivity(); break;
    case 'act-edit': { const a = data.activities.find((x) => x.id === t.dataset.id); if (a) { actDraft = { ...a }; activityModal(); } break; }
    case 'act-del': if (confirm('Dieses Training löschen?')) { data.activities = data.activities.filter((x) => x.id !== t.dataset.id); persist(); render(); } break;
    case 'finish': finishSession(); break;
    case 'discard': if (confirm('Einheit verwerfen? Eingetragene Sätze gehen verloren.')) { data.active = null; stopTimer(); keepAwake(false); persist(); render(); } break;
    case 'timer-minus': if (timer) { timer.end -= 15000; tick(); } break;
    case 'timer-plus': if (timer) { timer.end += 15000; timer.total += 15; tick(); } break;
    case 'timer-stop': stopTimer(); break;
    case 'hist-month': {
      const [y, mo] = histMonth.split('-').map(Number);
      const d = new Date(y, mo - 1 + Number(t.dataset.d), 1);
      const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (next <= todayISO().slice(0, 7)) { histMonth = next; render(); }
      break;
    }
    case 'repeat': repeatSession(t.dataset.id); break;
    case 'iv-open': ivOpen(+t.dataset.b, +t.dataset.i); break;
    case 'iv-start': ivStart(); break;
    case 'iv-rounds': if (ivc && !ivc.phases) { ivc.rounds = Math.min(30, Math.max(1, ivc.rounds + Number(t.dataset.d))); ivRender(); } break;
    case 'iv-sets': if (ivc && !ivc.phases) { ivc.sets = Math.min(6, Math.max(1, ivc.sets + Number(t.dataset.d))); ivRender(); } break;
    case 'iv-pause':
      if (ivc && ivc.phases) {
        if (ivc.paused != null) { ivc.end = Date.now() + ivc.paused; ivc.paused = null; } else ivc.paused = Math.max(0, ivc.end - Date.now());
        ivRender();
      }
      break;
    case 'iv-skip': if (ivc && ivc.phases) { if (ivc.paused != null) ivc.paused = null; ivNext(); } break;
    case 'iv-stop': if (ivc && confirm('Intervall-Uhr beenden?')) ivClose(); break;
    case 'iv-close': ivClose(); break;
    case 'hist': openHistory = openHistory === t.dataset.id ? null : t.dataset.id; render(); break;
    case 'del-session': if (confirm('Diese Einheit endgültig löschen?')) { data.sessions = data.sessions.filter((s) => s.id !== t.dataset.id); persist(); render(); } break;
    case 'save-bw': {
      const val = (id) => { const v = ($(id)?.value || '').trim(); return v === '' ? null : parseFloat(v.replace(',', '.')); };
      const kg = val('#bw-in'); const muscle = val('#bw-muscle'); const fat = val('#bw-fat');
      if (!(kg > 30 && kg < 300)) { toast('Bitte ein gültiges Gewicht eingeben.'); return; }
      if (muscle != null && !(muscle >= 10 && muscle < kg)) { toast('Muskelmasse in kg bitte prüfen (kleiner als das Körpergewicht).'); return; }
      if (fat != null && !(fat >= 3 && fat <= 60)) { toast('Körperfett bitte in % eingeben (3–60).'); return; }
      setBodyweight({ kg, muscle, fat });
      persist(); render(); toast(muscle || fat ? 'Gewicht und Körperwerte gespeichert.' : 'Gewicht gespeichert.'); break;
    }
    case 'review': runReview(); break;
    case 'reset-coach': if (confirm('Anpassungen aus dem Wochen-Check zurücksetzen?')) { data.coach = null; persist(); render(); } break;
    case 'new-block': if (confirm('Neuen 5-Wochen-Block ab heute starten?')) { data.block.start = todayISO(); persist(); render(); } break;
    case 'export': exportJSON(data); break;
    case 'wipe': if (confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.') && confirm('Sicher? Vorher Backup exportiert?')) { const key = data.settings.apiKey; localStorage.clear(); data = load(); data.settings.apiKey = key; persist(); render(); } break;
    default: break;
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.run && data.active) {
    const it = itemAt(t);
    it.run[t.dataset.run] = t.value;
    const p = document.getElementById(`pace-${it.uid}`);
    if (p) p.textContent = pace(it.run.min, it.run.km) || 'Pace –';
    persist();
  }
  if (t.dataset.field && data.active) {
    const st = itemAt(t).sets[+t.dataset.s];
    const v = t.value.replace(',', '.');
    st[t.dataset.field] = v === '' ? '' : (isNaN(+v) ? st[t.dataset.field] : v);
    persist();
  }
  if (t.id === 'wish') wish = t.value;
  if (t.id === 'fb-note' && fbDraft) fbDraft.note = t.value;
  if (t.id === 'home-notes') { data.homeGymNotes = t.value; persist(); }
  if (setupDraft && t.dataset.su) setupDraft[t.dataset.su] = t.value;
  if (actDraft && t.id && t.id.startsWith('act-')) {
    const map = { 'act-date': 'date', 'act-min': 'minutes', 'act-km': 'km', 'act-note': 'note' };
    if (map[t.id]) actDraft[map[t.id]] = t.value;
  }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.field && data.active) autoComplete(t);
  if (setupDraft && t.dataset.su) setupDraft[t.dataset.su] = t.value; // Auswahlfelder (Spieltag) zuverlässig übernehmen
  if (t.id === 'api-key') { data.settings.apiKey = t.value.trim(); persist(); toast('API-Key gespeichert.'); }
  if (t.id === 'use-claude') { data.settings.useClaude = t.checked; persist(); }
  if (t.dataset.prof) {
    const k = t.dataset.prof;
    const numeric = ['age', 'weight', 'days', 'duration', 'goalWeight'].includes(k);
    const v = k === 'goalWeight' && t.value.trim() === '' ? '' : numeric ? parseFloat(t.value.replace(',', '.')) : t.value;
    if (numeric && v !== '' && isNaN(v)) return;
    data.profile[k] = v;
    data.profile.setup = true;
    const replan = ['days', 'goal', 'sport', 'season', 'matchDay'].includes(k);
    if (replan) todayTpl = null;
    persist();
    if (replan) render();
  }
  if (t.id === 'ex-select') { progressEx = t.value; render(); }
  if (t.id === 'import-file' && t.files[0]) {
    try { data = await importJSON(t.files[0], data); persist(); toast('Backup importiert.'); render(); }
    catch (err) { toast(err.message || 'Import fehlgeschlagen.'); }
  }
});

// Vorgeschlagenes Gewicht beim Antippen leeren (wie bei den Wdh.) – bleibt als grauer Platzhalter sichtbar;
// ohne Eingabe wird es beim Verlassen wiederhergestellt
document.addEventListener('focusin', (e) => {
  const t = e.target;
  if (!t.dataset || t.dataset.field !== 'w' || !data.active) return;
  const st = itemAt(t).sets[+t.dataset.s];
  if (st.done || t.value === '') return;
  t.dataset.prev = t.value; t.placeholder = t.value; t.value = '';
});
document.addEventListener('focusout', (e) => {
  const t = e.target;
  if (!t.dataset || t.dataset.field !== 'w' || !data.active || t.dataset.prev == null) return;
  if (t.value.trim() === '') {
    t.value = t.dataset.prev;
    const st = itemAt(t).sets[+t.dataset.s];
    st.w = t.dataset.prev.replace(',', '.');
    persist();
  }
  delete t.dataset.prev;
});

$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
window.addEventListener('resize', () => { if (view === 'progress') drawCharts(); });

// ---------- Start ----------
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !DEMO) {
  // Updates: neuen Service Worker suchen (beim Start und beim Zurückkehren in die App);
  // wird er aktiv, lädt die App einmal neu – nie mitten in einem Training.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    if (data.active) { toast('Update geladen – aktiv beim nächsten Öffnen.'); return; }
    reloaded = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
}
setAccent(data.settings.accent || 'lavender');
if (!DEMO) requestPersistence();
if (data.active && !DEMO) keepAwake(true);
// Allererster Start: erst der Trailer, dann die Einrichtung
const firstLaunch = !DEMO && !data.profile.setup && !data.sessions.length && !introSeen();
if (['history', 'progress', 'coach', 'settings'].includes(params.get('view'))) setView(params.get('view')); else render();
if (firstLaunch) showIntro(() => openSetup());
if (DEMO && params.get('view') === 'setup') openSetup();
if (DEMO && params.get('view') === 'session') {
  const b = document.querySelector('.t-power') || document.querySelector('.t-strength');
  if (b) window.scrollTo(0, b.closest('.block').offsetTop - 12);
}
