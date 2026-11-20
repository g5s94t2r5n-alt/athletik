// Plan-Simulator: spielt mehrere Wochen pro Trainingsziel durch, folgt dabei immer der
// Empfehlung (★) und prüft die entstandenen Einheiten gegen die Vorgaben des Ziels.
// Nutzung im Browser (lokaler Server): const m = await import('/tools/simulate.js'); m.runAll()
import * as eng from '../js/engine.js';
import * as st from '../js/store.js';
import { GOAL, rotationFor, goalOf, matchInfo, SPORT, SEASON } from '../js/goals.js';
import { EX, EQUIPMENT, MUSCLES } from '../js/exercises.js';

const RealDate = Date;
let offset = 0;
class FakeDate extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + offset); }
  static now() { return RealDate.now() + offset; }
}

const ALL = EQUIPMENT.map((e) => e.id);
const PATTERN = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
const HARD = ['run_4x4', 'run_3030', 'run_tempo', 'run_sprints', 'hx_runs'];
const BIG = ['brust', 'ruecken', 'schultern', 'quadrizeps', 'beinbeuger', 'gesaess'];

// Sportart: sport, season, matchRel (Spieltag als Tag 0–6 der Simulationswoche), team (Teamtrainings, Tage 0–6)
export function simulate({ goal, days = 4, weeks = 8, raceInDays = null, duration = 75, seed = 3, sport = 'football', season = 'saison', matchRel = null, team = [] }) {
  let rnd = seed; const R = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
  window.Date = FakeDate; offset = 0;
  try {
    const d = st.load();
    Object.assign(d, { sessions: [], activities: [], bodyweight: [], slotMemory: {}, coach: null, active: null, location: 'gym' });
    const wd0 = new Date().getDay();
    d.profile = { ...d.profile, goal, days, duration, setup: true, age: 32, weight: 90, goalDate: raceInDays != null ? st.todayISO(new Date(RealDate.now() + raceInDays * 86400000)) : '', sport, season, matchDay: matchRel != null ? String((wd0 + matchRel) % 7) : '' };
    const evening = (type, min) => d.activities.push({ id: st.uid(), type, date: st.todayISO(), minutes: min, intensity: 'hart' });
    d.block = { start: st.todayISO() };
    const log = []; const vol = [];
    for (let day = 0; day < weeks * 7; day++) {
      offset = day * 86400000;
      if (PATTERN[days].includes(day % 7)) {
        const mi = matchInfo(d);
        const rec = eng.recommendTemplate(d);
        const s = eng.buildSession(d, { templateId: rec.id, equip: rec.id === 'RUN' ? [] : ALL, runType: 'auto' });
        const runIt = s.blocks.flatMap((b) => b.items).find((it) => it.run);
        s.blocks.forEach((b) => b.items.forEach((it) => {
          it.done = true;
          if (it.run) { const m = eng.RUN_MIN[it.exId] || 40; it.run.min = String(m); it.run.km = String(Math.round((m / 5.5) * 10) / 10); }
          it.sets.forEach((x) => { if (x.w === '' || x.w == null) x.w = '30'; x.r = String(R() < 0.5 ? it.hi : Math.max(it.lo, it.hi - 1)); x.done = true; });
        }));
        s.status = 'done';
        d.sessions.push(s); eng.rememberSlots(d, s);
        log.push({
          day, week: Math.floor(day / 7) + 1, tpl: rec.id, why: rec.why, deload: s.deload, note: s.note, mi,
          ex: s.blocks.flatMap((b) => b.items.map((i) => i.exId)),
          run: runIt ? runIt.exId : null, min: eng.estimateMinutes(s),
          blocks: s.blocks.map((b) => b.type),
          stations: s.blocks.filter((b) => b.type === 'conditioning').flatMap((b) => b.items.map((i) => i.exId)).filter((x) => x.startsWith('hx_')),
          strength: s.blocks.filter((b) => b.type === 'strength').flatMap((b) => b.items.map((i) => ({ ex: i.exId, sets: i.sets.length, lo: i.lo, hi: i.hi, main: i.main }))),
        });
      }
      // Teamtraining und Spiel am Abend (nach einer evtl. App-Einheit)
      if (team.includes(day % 7)) evening('teamsport', 90);
      if (matchRel != null && day % 7 === matchRel) evening('match', 90);
      if (day % 7 === 6) vol.push(eng.weeklyVolume(d, 7));
    }
    return { goal, days, weeks, raceInDays, rot: rotationFor(d), g: goalOf(d), match: matchRel != null, team, log, vol };
  } finally { window.Date = RealDate; offset = 0; }
}

// Prüfungen gegen die Ziel-Vorgaben → Liste von { ok, text }
export function evaluate(res) {
  const g = res.g || GOAL[res.goal];
  const out = [];
  const check = (ok, text) => out.push({ ok: !!ok, text });
  const target = {}; res.rot.forEach((t) => { target[t] = (target[t] || 0) + 1; });
  const weeksArr = [...Array(res.weeks).keys()].map((i) => i + 1);
  const raceWeek = res.raceInDays != null ? Math.floor((res.raceInDays - 14) / 7) + 1 : null;

  // 1. Wochenplan
  const mism = [];
  weeksArr.forEach((w) => {
    const cnt = {}; res.log.filter((l) => l.week === w).forEach((l) => { cnt[l.tpl] = (cnt[l.tpl] || 0) + 1; });
    const ok = Object.keys(target).every((t) => (cnt[t] || 0) === target[t]) && Object.keys(cnt).every((t) => target[t]);
    if (!ok) mism.push(`W${w}: ${Object.entries(cnt).map(([k, v]) => `${k}×${v}`).join(' ')}`);
  });
  // Mit festem Spieltag haben die Spieltag-Regeln Vorrang vor dem Wochenplan (eigene Prüfung unten)
  if (!res.match) check(mism.length <= 1, `Wochenplan wie Ziel (${Object.entries(target).map(([k, v]) => `${k}×${v}`).join(' ')}) – Abweichungen: ${mism.length ? mism.join('; ') : 'keine'}`);

  // 2. Keine Region < 48 h erneut hart (Athletik-Tag zählt nur für Beine, Regeneration/Lauf gar nicht)
  const regionsOf = (t) => (t === 'ATH' ? ['lower'] : ['REG', 'RUN', 'PRIME'].includes(t) ? [] : ({ lower: ['lower'], upper: ['upper'], full: ['lower', 'upper'] }[eng.TEMPLATES[t]?.focus] || []));
  const clashes = [];
  res.log.forEach((l, i) => {
    if (l.tpl === 'ATH') return; // Athletik-Tag ist leicht genug
    regionsOf(l.tpl).forEach((r) => {
      const prev = res.log.slice(0, i).reverse().find((p) => regionsOf(p.tpl).includes(r));
      if (prev && l.day - prev.day < 2) clashes.push(`Tag ${l.day}: ${l.tpl} nach ${prev.tpl} (Tag ${prev.day})`);
    });
  });
  check(clashes.length === 0, `Erholung ≥ 48 h je Region – Verstöße: ${clashes.length ? [...new Set(clashes)].join('; ') : 'keine'}`);

  // 3. Ausdauer-Finisher passend zum Ziel
  const withFin = res.log.filter((l) => l.blocks.includes('conditioning') && !['HYX', 'REG'].includes(l.tpl) && !eng.TEMPLATES[l.tpl].condMain).length; // Zone 2 am Regenerationstag ist Hauptinhalt, kein Finisher
  check(g.finisher ? withFin > 0 : withFin === 0, `Ausdauer-Finisher ${g.finisher ? 'vorhanden' : 'nicht vorhanden'} (Einheiten mit Finisher: ${withFin})`);

  // 4. Läufe: polarisiert, max. 2 harte pro Woche
  const runs = res.log.filter((l) => l.run);
  if (runs.length) {
    const hardWeeks = weeksArr.map((w) => runs.filter((r) => r.week === w && HARD.includes(r.run)).length);
    const plain = runs.filter((r) => r.run !== 'hx_runs');
    const easyShare = plain.length ? plain.filter((r) => ['run_easy', 'run_long'].includes(r.run)).length / plain.length : 1;
    check(hardWeeks.every((n) => n <= 2), `Höchstens 2 harte Lauf-Einheiten/Woche inkl. HYROX (pro Woche: ${hardWeeks.join(', ')})`);
    if ((target.RUN || 0) >= 2) check(easyShare >= 0.4, `Polarisiert: lockere/lange Läufe ${Math.round(easyShare * 100)} % (${plain.map((r) => r.run.replace('run_', '')).join(', ')})`);
  }

  // 5. Marathon: langer Lauf pro Woche (vor dem Tapering)
  if (g.longRun) {
    const pre = weeksArr.filter((w) => raceWeek == null || w < raceWeek);
    const missing = pre.filter((w) => !runs.some((r) => r.week === w && r.run === 'run_long'));
    check(missing.length === 0, `Langer Lauf jede Woche vor dem Tapering – fehlt in Woche: ${missing.length ? missing.join(', ') : '–'}`);
  }

  // 6. Tapering
  if (res.raceInDays != null) {
    const taper = res.log.filter((l) => res.raceInDays - l.day <= 14 && res.raceInDays - l.day >= 0);
    const strengthTaper = taper.filter((l) => l.strength.length);
    check(strengthTaper.every((l) => /Tapering/.test(l.note)), `Tapering-Hinweis in Krafteinheiten der letzten 14 Tage (${strengthTaper.length} Einheiten)`);
    const late = taper.filter((l) => res.raceInDays - l.day <= 10 && l.run === 'run_long');
    check(late.length === 0, 'Kein langer Lauf in den letzten 10 Tagen');
    const last3 = taper.filter((l) => res.raceInDays - l.day <= 3 && l.run);
    check(last3.every((l) => l.run === 'run_easy'), `Letzte 3 Tage nur locker (${last3.map((l) => l.run).join(', ') || 'kein Lauf'})`);
  }

  // 7. Wdh.-Schema
  const mains = res.log.flatMap((l) => l.strength.filter((s) => s.main && EX[s.ex].load === 'kg'));
  if (g.reps === 'strength') check(mains.length && mains.every((s) => s.lo === 3 && s.hi === 6), `Hauptübungen 3–6 Wdh. (${mains.length} geprüft)`);
  else if (mains.length) check(mains.every((s) => s.hi >= 8 || s.lo >= 4), `Hauptübungen im Hypertrophie-Bereich (${[...new Set(mains.map((s) => `${s.lo}-${s.hi}`))].join(', ')})`);

  // 8. Volumen (nur Ziele mit Volumen-Fokus, ohne Deload-Wochen)
  if (g.volumeFocus) {
    // Bei 2 Tagen sind 10+ Sätze pro Muskel nicht erreichbar → untere wirksame Grenze 6 (Hinweis in der App)
    const minSets = res.days <= 2 ? Math.min(g.minSets || 10, 6) : (g.minSets || 10);
    const low = [];
    res.vol.forEach((v, i) => {
      const w = i + 1; if (w % 5 === 0) return; // Deload
      BIG.forEach((m) => { if (v[m] < minSets - 0.5) low.push(`W${w} ${MUSCLES[m]} ${v[m]}`); });
    });
    check(low.length <= 2, `Wochenvolumen große Muskeln ≥ ${minSets} Sätze (unter Ziel: ${low.length ? low.slice(0, 6).join(', ') : 'keine'})`);
  } else {
    // Gesäß wird über alle Bein-Grundübungen mitgezählt und bleibt hier außen vor
    const maxStrength = Math.max(...res.vol.map((v) => Math.max(...BIG.filter((m) => m !== 'gesaess').map((m) => v[m]))));
    check(maxStrength <= (g.maxSets || 13), `Kraftvolumen moderat (max. ${maxStrength} Sätze/Muskel/Woche)`);
  }

  // 9. HYROX
  if (res.goal === 'hyrox') {
    const st8 = new Set(res.log.flatMap((l) => l.stations));
    check(st8.size === 8, `Alle 8 HYROX-Stationen geübt (${st8.size})`);
  }

  // 9b. Sportart: Spieltag, Aktivierung, Reihenfolge, Prävention
  if (res.goal === 'sport') {
    const legsTpl = (t) => !['REG', 'PRIME', 'RUN'].includes(t) && ['lower', 'full'].includes(eng.TEMPLATES[t].focus);
    if (res.match) {
      const bad = res.log.filter((l) => l.mi && (
        ((l.mi.toMatch === 0 || l.mi.sinceMatch === 0 || l.mi.sinceMatch === 1) && l.tpl !== 'REG')
        || (l.mi.toMatch === 1 && l.tpl !== 'PRIME')
        || (l.mi.toMatch === 2 && legsTpl(l.tpl))));
      check(bad.length === 0, `Spieltag-Regeln (MD/MD+1 Regeneration, MD-1 Aktivierung, MD-2 keine Beine) – Verstöße: ${bad.map((l) => `T${l.day} MD-${l.mi.toMatch}:${l.tpl}`).join(', ') || 'keine'}`);
      const md = res.log.filter((l) => l.mi && l.mi.toMatch === 0 && l.blocks.includes('conditioning'));
      check(md.length === 0, `Am Spieltag kein Ausdauerteil (${md.length})`);
    }
    const prime = res.log.filter((l) => l.tpl === 'PRIME');
    check(prime.every((l) => l.min <= 40 && !l.blocks.includes('conditioning')), `Aktivierung kurz und ohne Ausdauer (${prime.map((l) => l.min + ' min').join(', ') || 'keine'})`);
    const spc = res.log.filter((l) => l.tpl === 'SP_C' && l.blocks.includes('conditioning') && l.blocks.includes('strength'));
    check(spc.every((l) => l.blocks.indexOf('conditioning') < l.blocks.indexOf('strength')), `Sprints vor Nordic Curls/Kraft (${spc.length} geprüft)`);
    const sp = res.g.sport;
    const has = (tpl, ids) => { const L = res.log.filter((l) => l.tpl === tpl); return { n: L.length, ok: L.every((l) => ids.some((id) => l.ex.includes(id))) }; };
    const prev = {
      football: [['SP_L', ['nordic_curl']], ['SP_L', ['copenhagen']]],
      handball: [['SP_U', ['ext_rotation_cable', 'ext_rotation_band', 'ext_rotation_db']]],
      volleyball: [['SP_U', ['ext_rotation_cable', 'ext_rotation_band', 'ext_rotation_db']], ['SP_L', ['sl_landing', 'sl_balance']]],
      basketball: [['SP_L', ['sl_landing', 'sl_balance']]],
      racket: [['SP_U', ['ext_rotation_cable', 'ext_rotation_band', 'ext_rotation_db']]],
    }[sp] || [];
    if (res.g.season !== 'pause') prev.forEach(([tpl, ids]) => { const r = has(tpl, ids); if (r.n) check(r.ok, `Prävention ${SPORT[sp].name}: ${ids[0]} in jeder ${tpl}-Einheit (${r.n})`); });
    if (res.g.season === 'pause' && sp === 'football') { const L = res.log.filter((l) => l.ex.some((x) => EX[x].slot === 'knee_flexion')); check(L.every((l) => l.ex.includes('nordic_curl')), `Fußball-Pause: Nordic Curls auch in den Aufbau-Einheiten (${L.length})`); }
  }

  // 10. Dauer
  const tooLong = res.log.filter((l) => l.min > (res.duration || 75) + 15);
  check(tooLong.length === 0, `Einheiten passen in die Zeit (zu lang: ${tooLong.map((l) => `${l.tpl} ${l.min} min`).join(', ') || 'keine'})`);
  return out;
}

// Sportart-Szenarien: Spieltag = Tag 6 der Woche („Sonntag“), Teamtraining Tag 1 und 3 („Di/Do“)
export const SPORT_CONFIGS = [
  { goal: 'sport', sport: 'football', season: 'saison', days: 3, matchRel: 6, team: [1, 3] },
  { goal: 'sport', sport: 'football', season: 'saison', days: 4, matchRel: 6, team: [1, 3] },
  { goal: 'sport', sport: 'football', season: 'saison', days: 2, matchRel: 6, team: [1, 3] },
  { goal: 'sport', sport: 'football', season: 'vorbereitung', days: 3, matchRel: 6, team: [1, 3] },
  { goal: 'sport', sport: 'football', season: 'pause', days: 4 },
  { goal: 'sport', sport: 'handball', season: 'vorbereitung', days: 4, team: [1, 3] },
  { goal: 'sport', sport: 'handball', season: 'saison', days: 2, matchRel: 5, team: [1, 3] },
  { goal: 'sport', sport: 'basketball', season: 'saison', days: 3, matchRel: 5, team: [1, 3] },
  { goal: 'sport', sport: 'basketball', season: 'vorbereitung', days: 5 },
  { goal: 'sport', sport: 'volleyball', season: 'saison', days: 4 },
  { goal: 'sport', sport: 'volleyball', season: 'pause', days: 3, duration: 90 }, // 3 Tage Aufbau: 90 min (Tipp in der App)
  { goal: 'sport', sport: 'racket', season: 'vorbereitung', days: 3, team: [2] },
  { goal: 'sport', sport: 'racket', season: 'saison', days: 6 },
];

export function runAll(configs) {
  const list = configs || [
    { goal: 'muscle', days: 4 }, { goal: 'strength', days: 4 }, { goal: 'endurance', days: 4 },
    { goal: 'marathon', days: 4, raceInDays: 52 }, { goal: 'hyrox', days: 4, raceInDays: 52 }, { goal: 'fitness', days: 4 },
    { goal: 'muscle', days: 3, duration: 90 }, { goal: 'marathon', days: 5, raceInDays: 52 }, { goal: 'endurance', days: 3 }, { goal: 'hyrox', days: 3 },
    ...SPORT_CONFIGS,
  ];
  return list.map((c) => {
    const res = simulate(c);
    res.duration = c.duration || 75;
    const checks = evaluate(res);
    return { name: `${res.g.name} · ${c.days} Tage${c.raceInDays ? ' · Wettkampf Tag ' + c.raceInDays : ''}${c.matchRel != null ? ' · Spieltag' : ''}${c.team && c.team.length ? ` · ${c.team.length}× Teamtraining` : ''}`, checks, plan: res.log.map((l) => `T${l.day}:${l.tpl}${l.run ? '(' + l.run.replace('run_', '') + ')' : ''}`).join(' ') };
  });
}
