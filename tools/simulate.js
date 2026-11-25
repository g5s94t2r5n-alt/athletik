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
const HARD = ['run_4x4', 'run_3030', 'run_tempo', 'run_sprints', 'hx_runs', 'run_1515', 'run_rsa', 'run_shuttle', 'run_hills'];
const BIG = ['brust', 'ruecken', 'schultern', 'quadrizeps', 'beinbeuger', 'gesaess'];

// Sportart: sport, season, matchRel (Spieltag als Tag 0–6 der Simulationswoche), team (Teamtrainings, Tage 0–6)
export function simulate({ goal, days = 4, weeks = 8, raceInDays = null, duration = 75, seed = 3, sport = 'football', season = 'saison', matchRel = null, team = [], runDays = [] }) {
  let rnd = seed; const R = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
  window.Date = FakeDate; offset = 0;
  try {
    const d = st.load();
    Object.assign(d, { sessions: [], activities: [], bodyweight: [], slotMemory: {}, slotSince: {}, coach: null, active: null, location: 'gym', today: null, dislikes: [], painCleared: {}, strainCleared: {}, sore: null });
    const wd0 = new Date().getDay();
    d.profile = { ...d.profile, goal, days, duration, setup: true, age: 32, weight: 90, goalDate: raceInDays != null ? st.todayISO(new Date(RealDate.now() + raceInDays * 86400000)) : '', sport, season, matchDay: matchRel != null ? String((wd0 + matchRel) % 7) : '' };
    const evening = (type, min) => d.activities.push({ id: st.uid(), type, date: st.todayISO(), minutes: min, intensity: 'hart' });
    d.block = { start: st.todayISO() };
    const log = []; const vol = [];
    for (let day = 0; day < weeks * 7; day++) {
      offset = day * 86400000;
      const forced = runDays.includes(day % 7); // zusätzlich gewünschte Laufeinheit (Lauf-Chip)
      if (PATTERN[days].includes(day % 7) || forced) {
        const mi = matchInfo(d);
        const prevHard = d.activities.some((a) => a.intensity === 'hart' && st.daysBetween(a.date, st.todayISO()) === 1);
        const rec = forced ? { id: 'RUN', why: 'Lauf-Wunsch' } : eng.recommendTemplate(d);
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
          day, week: Math.floor(day / 7) + 1, tpl: rec.id, why: rec.why, deload: s.deload, note: s.note, mi, forced, prevHard,
          ex: s.blocks.flatMap((b) => b.items.map((i) => i.exId)),
          // wechselbare Ergänzungsübungen (ohne Hauptübungen, feste Prävention, Ausgleich)
          rot: s.blocks.filter((b) => ['power', 'strength'].includes(b.type)).flatMap((b) => b.items).filter((i) => !i.main && !i.keep).map((i) => i.exId),
          run: runIt ? runIt.exId : null, min: eng.estimateMinutes(s),
          blocks: s.blocks.map((b) => b.type),
          stations: s.blocks.filter((b) => b.type === 'conditioning').flatMap((b) => b.items.map((i) => i.exId)).filter((x) => x.startsWith('hx_')),
          strength: s.blocks.filter((b) => b.type === 'strength').flatMap((b) => b.items.map((i) => ({ ex: i.exId, sets: i.sets.length, lo: i.lo, hi: i.hi, main: i.main, ss: i.ss || '', tempo: i.tempo || '' }))),
        });
      }
      // Teamtraining und Spiel am Abend (nach einer evtl. App-Einheit)
      if (team.includes(day % 7)) evening('teamsport', 90);
      if (matchRel != null && day % 7 === matchRel) evening('match', 90);
      if (day % 7 === 6) vol.push(eng.weeklyVolume(d, 7));
    }
    return { goal, days, weeks, raceInDays, rot: rotationFor(d), g: goalOf(d), match: matchRel != null, team, forcedRuns: runDays.length > 0, log, vol };
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
  if (!res.match && !res.forcedRuns) check(mism.length <= 1, `Wochenplan wie Ziel (${Object.entries(target).map(([k, v]) => `${k}×${v}`).join(' ')}) – Abweichungen: ${mism.length ? mism.join('; ') : 'keine'}`);

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
  // Unter 60 min entfällt der Finisher bewusst zugunsten der Kraftübungen
  if ((res.duration || 75) >= 60 || !g.finisher) check(g.finisher ? withFin > 0 : withFin === 0, `Ausdauer-Finisher ${g.finisher ? 'vorhanden' : 'nicht vorhanden'} (Einheiten mit Finisher: ${withFin})`);

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
  if (g.volumeFocus && (res.duration || 75) >= 75) {
    // Bei 2 Tagen sind 10+ Sätze pro Muskel nicht erreichbar → untere wirksame Grenze 6 (Hinweis in der App)
    const minSets = res.days <= 2 ? Math.min(g.minSets || 10, 6) : (g.minSets || 10);
    const low = [];
    res.vol.forEach((v, i) => {
      const w = i + 1; if (w % 5 === 0) return; // Deload
      BIG.forEach((m) => { if (v[m] < minSets - 0.5) low.push(`W${w} ${MUSCLES[m]} ${v[m]}`); });
    });
    check(low.length <= 2, `Wochenvolumen große Muskeln ≥ ${minSets} Sätze (unter Ziel: ${low.length ? low.slice(0, 6).join(', ') : 'keine'})`);
  } else if (!g.volumeFocus) {
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
      const bad = res.log.filter((l) => l.mi && !l.forced && (
        ((l.mi.toMatch === 0 || l.mi.sinceMatch === 0 || l.mi.sinceMatch === 1) && l.tpl !== 'REG')
        || (l.mi.toMatch === 1 && l.tpl !== 'PRIME')
        || (l.mi.toMatch === 2 && legsTpl(l.tpl))));
      check(bad.length === 0, `Spieltag-Regeln (MD/MD+1 Regeneration, MD-1 Aktivierung, MD-2 keine Beine) – Verstöße: ${bad.map((l) => `T${l.day} MD-${l.mi.toMatch}:${l.tpl}`).join(', ') || 'keine'}`);
      const md = res.log.filter((l) => l.mi && l.mi.toMatch === 0 && l.blocks.includes('conditioning'));
      check(md.length === 0, `Am Spieltag kein Ausdauerteil (${md.length})`);
    }
    // Läufe beim Sportart-Ziel: spielnah statt polarisiert, locker rund ums Spiel und nach harten Tagen
    const sruns = res.log.filter((l) => l.run);
    if (sruns.length) {
      const allowed = [...res.g.runCycle, 'run_easy'];
      const wrongType = sruns.filter((l) => !allowed.includes(l.run));
      check(wrongType.length === 0, `Lauftypen passend zu ${res.g.name} (${[...new Set(sruns.map((l) => l.run.replace('run_', '')))].join(', ')})`);
      const hardL = sruns.filter((l) => HARD.includes(l.run));
      const nearMatch = hardL.filter((l) => l.mi && ((l.mi.toMatch != null && l.mi.toMatch <= 2) || l.mi.sinceMatch <= 1));
      check(nearMatch.length === 0, `Kein harter Lauf 2 Tage vor bis 1 Tag nach dem Spiel (Verstöße: ${nearMatch.map((l) => `T${l.day}:${l.run}`).join(', ') || 'keine'})`);
      const afterHard = hardL.filter((l) => l.prevHard);
      check(afterHard.length === 0, `Kein harter Lauf am Tag nach hartem Teamtraining/Spiel (Verstöße: ${afterHard.map((l) => `T${l.day}`).join(', ') || 'keine'})`);
      const tooMany = hardL.filter((l) => hardL.filter((x) => x.day < l.day && l.day - x.day < 7).length >= res.g.hardRuns);
      check(tooMany.length === 0, `Höchstens ${res.g.hardRuns} harte(r) Lauf/Läufe pro 7 Tage (${hardL.length} harte von ${sruns.length})`);
      const close = hardL.filter((l) => hardL.some((x) => x.day < l.day && l.day - x.day < 2));
      check(close.length === 0, `Harte Läufe mit mind. 48 h Abstand (Verstöße: ${close.map((l) => `T${l.day}`).join(', ') || 'keine'})`);
      if (!res.match) check(hardL.length > 0, `Spielnahe Intervalle kommen vor (${hardL.length})`);
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

  // 9c. Supersätze: nur Oberkörper-Gegenspieler, direkt hintereinander, nie bei schweren Kraftsätzen
  const SS_OK = { hpush: 'hpull', vpush: 'vpull', biceps: 'triceps' };
  const ssBad = [];
  res.log.forEach((l) => {
    const st = l.strength;
    st.forEach((x, i) => {
      if (!x.ss || !x.ss.endsWith('1')) return;
      const y = st[i + 1];
      const a = EX[x.ex].slot; const b = y && EX[y.ex].slot;
      if (!y || y.ss !== x.ss[0] + '2' || SS_OK[a] !== b) ssBad.push(`T${l.day} ${x.ex}+${y ? y.ex : '–'}`);
    });
    if (g.reps === 'strength' && st.some((x) => x.ss)) ssBad.push(`T${l.day} Supersatz bei Kraftziel`);
  });
  check(ssBad.length === 0, `Supersätze nur als Oberkörper-Gegenspieler (${res.log.reduce((n, l) => n + l.strength.filter((x) => x.ss).length, 0) / 2} Paare) – Verstöße: ${ssBad.slice(0, 4).join(', ') || 'keine'}`);

  // 9d. Tempo: jede Kraftübung (außer Rumpf/Landung) hat ein Tempo; schwere Sätze explosiv zurück; Saison ohne 3-s-Exzentrik; Deload ruhig
  const tBad = [];
  res.log.forEach((l) => l.strength.forEach((x) => {
    const sl = EX[x.ex].slot;
    if (['core', 'prev_lower'].includes(sl)) return;
    if (!x.tempo) tBad.push(`T${l.day} ${x.ex} ohne Tempo`);
    else if (x.hi <= 6 && !l.deload && !x.tempo.endsWith('X')) tBad.push(`T${l.day} ${x.ex} ${x.tempo} (schwer, nicht explosiv)`);
    else if (res.g.season === 'saison' && res.g.id === 'sport' && x.tempo.startsWith('3')) tBad.push(`T${l.day} ${x.ex} ${x.tempo} in der Saison`);
    else if (l.deload && !['calf', 'prev_shoulder'].includes(sl) && !['nordic_curl', 'neg_pullup'].includes(x.ex) && x.tempo !== '2-0-1') tBad.push(`T${l.day} ${x.ex} ${x.tempo} im Deload`);
  }));
  const wk = (w) => [...new Set(res.log.filter((l) => l.week === w && !l.deload).flatMap((l) => l.strength.filter((x) => x.main).map((x) => x.tempo)))].join('/');
  check(tBad.length === 0, `Tempo passend zu Wdh., Blockwoche und Saison (W1: ${wk(1) || '–'}, W3: ${wk(3) || '–'}) – Verstöße: ${tBad.slice(0, 4).join(', ') || 'keine'}`);

  // 9e. Abwechslung je Block: Ergänzungsübungen (inkl. Sprung/Sprint) wechseln mit dem neuen Block, Hauptübungen
  // nicht (nur Ziele mit Abwechslung; Kurzeinheiten ohne Ergänzungsübungen zählen nicht)
  if (eng.rotatesExercises(g) && res.weeks > eng.BLOCK_WEEKS) {
    const mainsOf = (l) => l.strength.filter((x) => x.main).map((x) => x.ex);
    const acc = (l) => l.rot;
    const pairs = [...new Set(res.log.filter((l) => l.strength.length && !eng.TEMPLATES[l.tpl].light).map((l) => l.tpl))].map((t) => ({
      t, a: res.log.filter((l) => l.tpl === t && l.week <= eng.BLOCK_WEEKS).pop(), b: res.log.find((l) => l.tpl === t && l.week > eng.BLOCK_WEEKS),
    })).filter((p) => p.a && p.b && acc(p.a).length && acc(p.b).length);
    const same = pairs.filter((p) => acc(p.b).every((x) => acc(p.a).includes(x))).map((p) => p.t);
    check(same.length === 0, `Neue Varianten der Ergänzungsübungen im 2. Block (unverändert: ${same.join(', ') || 'keine'})`);
    const base = (id) => Object.keys(eng.STRENGTH_VARIANT).find((k) => eng.STRENGTH_VARIANT[k] === id) || id;
    const moved = pairs.filter((p) => mainsOf(p.a).map(base).join() !== mainsOf(p.b).map(base).join()).map((p) => `${p.t} ${mainsOf(p.a)}→${mainsOf(p.b)}`);
    check(moved.length === 0, `Hauptübungen wechseln nicht mit dem Block (geändert: ${moved.join(', ') || 'keine'})`);
  }
  // 9f. Laufziele/HYROX: Isolationsplätze ersetzt (Waden, Hüfte, Einbeinstand, Rumpf statt Bizeps & Co.)
  if (g.swap) {
    const gone = Object.keys(g.swap).filter((k) => g.swap[k].slot !== k); // ersetzte Plätze (calf → calf heißt nur „bleibt“)
    const bad = res.log.filter((l) => l.strength.length && l.ex.some((x) => gone.includes(EX[x].slot)));
    check(bad.length === 0, `Zielgerechte Ergänzungen statt ${gone.join('/')} (Verstöße: ${bad.map((l) => `T${l.day}`).join(', ') || 'keine'})`);
    if (g.swap.biceps) {
      const fb = res.log.filter((l) => l.strength.length);
      check(fb.every((l) => l.ex.some((x) => EX[x].slot === 'calf')), `Waden in jeder Krafteinheit für Läufer (${fb.length})`);
    }
  }

  // 10. Dauer
  // Lauf- und HYROX-Einheiten richten sich nach Strecke/Stationen, nicht nach der Zeitvorgabe für Kraft
  const tooLong = res.log.filter((l) => l.min > (res.duration || 75) + 15 && !((res.duration || 75) < 75 && ['RUN', 'HYX'].includes(l.tpl)));
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
  // Zusätzliche Laufeinheiten (Lauf-Chip) bei Sportarten
  { goal: 'sport', sport: 'handball', season: 'vorbereitung', days: 2, runDays: [1, 3, 5] },
  { goal: 'sport', sport: 'handball', season: 'saison', days: 2, matchRel: 6, team: [2], runDays: [1, 4, 5] },
  { goal: 'sport', sport: 'football', season: 'vorbereitung', days: 3, matchRel: 6, team: [1, 3], runDays: [2, 5] },
  { goal: 'sport', sport: 'basketball', season: 'saison', days: 2, runDays: [1, 3, 5] },
  { goal: 'sport', sport: 'volleyball', season: 'pause', days: 3, duration: 90, runDays: [1, 5] },
  { goal: 'sport', sport: 'racket', season: 'vorbereitung', days: 2, team: [2], runDays: [1, 4, 6] },
];
// Wenig Zeit: Supersätze statt gestrichener Übungen
export const SHORT_CONFIGS = [
  { goal: 'muscle', days: 4, duration: 60 }, { goal: 'muscle', days: 4, duration: 45 }, { goal: 'muscle', days: 2, duration: 60 },
  { goal: 'fitness', days: 5, duration: 45 }, { goal: 'strength', days: 4, duration: 45 }, { goal: 'lose', days: 3, duration: 45 },
  { goal: 'muscle', days: 4, duration: 30 }, { goal: 'fitness', days: 3, duration: 30 }, { goal: 'strength', days: 3, duration: 30 },
  { goal: 'sport', sport: 'football', season: 'saison', days: 4, duration: 30 },
];

export function runAll(configs) {
  const list = configs || [
    { goal: 'muscle', days: 4 }, { goal: 'strength', days: 4 }, { goal: 'endurance', days: 4 },
    { goal: 'marathon', days: 4, raceInDays: 52 }, { goal: 'hyrox', days: 4, raceInDays: 52 }, { goal: 'fitness', days: 4 },
    { goal: 'muscle', days: 3, duration: 90 }, { goal: 'marathon', days: 5, raceInDays: 52 }, { goal: 'endurance', days: 3 }, { goal: 'hyrox', days: 3 },
    ...SPORT_CONFIGS, ...SHORT_CONFIGS,
  ];
  return list.map((c) => {
    const res = simulate(c);
    res.duration = c.duration || 75;
    const checks = evaluate(res);
    return { name: `${res.g.name} · ${c.days} Tage${c.raceInDays ? ' · Wettkampf Tag ' + c.raceInDays : ''}${c.matchRel != null ? ' · Spieltag' : ''}${c.team && c.team.length ? ` · ${c.team.length}× Teamtraining` : ''}`, checks, plan: res.log.map((l) => `T${l.day}:${l.tpl}${l.run ? '(' + l.run.replace('run_', '') + ')' : ''}`).join(' ') };
  });
}

// Ausstattungs-Batterie: jede Vorlage jedes Ziels mit jeder typischen Ausstattung bauen
// → genug Übungen, keine doppelten Übungen/Varianten, nur verfügbare Geräte
export const EQUIP_SETS = {
  Studio: ALL,
  'Home (Kurzhanteln, Bank, Band, Stange)': ['dumbbell', 'bench', 'band', 'pullup', 'space'],
  'Home (nur Kurzhanteln)': ['dumbbell'],
  'Home (Kettlebell, Band)': ['kettlebell', 'band', 'space'],
  'Unterwegs (Band)': ['band', 'space'],
  'Nur Körpergewicht': [],
};
export function equipmentBattery() {
  const out = [];
  const goals = ['muscle', 'strength', 'fitness', 'lose', 'endurance', 'marathon', 'hyrox', 'sport'];
  for (const goal of goals) {
    const d = st.load();
    Object.assign(d, { sessions: [], activities: [], bodyweight: [], slotMemory: {}, slotSince: {}, coach: null, active: null, today: null, dislikes: [], painCleared: {}, strainCleared: {}, sore: null });
    d.profile = { ...d.profile, goal, days: 4, duration: 75, setup: true, age: 32, weight: 90, sport: 'football', season: 'vorbereitung', matchDay: '', zones: [] };
    d.block = { start: st.todayISO() };
    const g = goalOf(d);
    const tpls = [...new Set(Object.values(g.rot).flat())].filter((t) => !['RUN', 'REG'].includes(t));
    for (const [where, equip] of Object.entries(EQUIP_SETS)) {
      const probs = [];
      for (const t of tpls) {
        const s = eng.buildSession(d, { templateId: t, equip, runType: 'auto' });
        const work = s.blocks.filter((b) => ['power', 'strength', 'conditioning'].includes(b.type)).flatMap((b) => b.items.map((i) => i.exId));
        const ids = s.blocks.flatMap((b) => b.items.map((i) => i.exId));
        const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
        const miss = ids.filter((x) => !EX[x].equip.every((q) => equip.includes(q)));
        const min = t === 'HYX' ? 3 : t === 'PRIME' ? 2 : 5;
        const n = t === 'HYX' ? s.blocks.filter((b) => b.type === 'conditioning').flatMap((b) => b.items).length : work.length;
        if (n < min) probs.push(`${t}: nur ${n} Übungen`);
        if (dup.length) probs.push(`${t}: doppelt ${dup.join(',')}`);
        if (miss.length) probs.push(`${t}: Gerät fehlt für ${miss.join(',')}`);
      }
      out.push({ ok: probs.length === 0, text: `${g.name} · ${where}: ${probs.length ? probs.join('; ') : 'ok'}` });
    }
  }
  return out;
}

// Muskelbeschwerden: Zerrung je Muskel in Woche 1/2/3 und Muskelkater – für jedes Ziel und jede Vorlage
const STRETCH_OF = { beinbeuger: 'ham_stretch', waden: 'calf_stretch', adduktoren: 'adductor_stretch', quadrizeps: 'couch_stretch', gesaess: 'pigeon', brust: 'doorway_stretch', ruecken: 'lat_stretch', schultern: 'sleeper_stretch' };
const FAST_SLOTS = ['power_lower', 'sprint_short', 'cod'];
export function complaintBattery() {
  const out = [];
  const ago = (n) => st.todayISO(new RealDate(RealDate.now() - n * 86400000));
  const muscles = Object.keys(eng.MUSCLE_NAME);
  for (const goal of ['muscle', 'strength', 'fitness', 'endurance', 'hyrox', 'sport']) {
    const base = st.load();
    Object.assign(base, { activities: [], bodyweight: [], slotMemory: {}, slotSince: {}, coach: null, active: null, today: null, dislikes: [], painCleared: {}, strainCleared: {}, sore: null });
    base.profile = { ...base.profile, goal, days: 4, duration: 75, setup: true, age: 32, weight: 90, sport: 'football', season: 'vorbereitung', matchDay: '', zones: [] };
    base.block = { start: st.todayISO() };
    const g = goalOf(base);
    const tpls = [...new Set(Object.values(g.rot).flat())].filter((t) => t !== 'REG');
    const probs = []; let n = 0;
    const work = (s) => s.blocks.filter((b) => ['power', 'strength', 'conditioning'].includes(b.type)).flatMap((b) => b.items);
    for (const m of muscles) {
      const leg = eng.isLegMuscle(m);
      for (const [phase, days] of [[1, 2], [2, 9], [3, 16]]) {
        const d = { ...base, sessions: [{ id: 'strain', date: ago(days), template: 'X', blocks: [], feedback: { strain: [m] } }] };
        for (const t of tpls) {
          const s = eng.buildSession(d, { templateId: t, equip: t === 'RUN' ? [] : ALL, runType: 'auto' });
          n += 1;
          const w = work(s);
          const hold = s.blocks.some((b) => b.strain);
          const tag = `${eng.MUSCLE_NAME[m]} W${phase} ${t}`;
          if (phase === 1) {
            const bad = w.filter((i) => eng.loadsMuscle(EX[i.exId], m)).map((i) => i.exId);
            if (bad.length) probs.push(`${tag}: belastet noch ${bad.join(',')}`);
            if (STRETCH_OF[m] && s.blocks.some((b) => b.items.some((i) => i.exId === STRETCH_OF[m]))) probs.push(`${tag}: Dehnung ${STRETCH_OF[m]}`);
          }
          if (phase < 3) {
            if (leg && w.some((i) => FAST_SLOTS.includes(EX[i.exId].slot) || ['sprints', 'shuttle_runs', 'rsa_sprints'].includes(i.exId))) probs.push(`${tag}: Sprints/Sprünge`);
            if (!hold) probs.push(`${tag}: keine Halteübung`);
            if (t === 'RUN' && leg) { const r = s.blocks.flatMap((b) => b.items).find((i) => i.run); if (r && r.exId !== 'run_easy') probs.push(`${tag}: Lauf ${r.exId}`); }
          }
          if (phase === 2) {
            const unred = w.filter((i) => EX[i.exId].cat === 'strength' && eng.loadsMuscle(EX[i.exId], m) && i.sets.some((x) => Number(x.tw) > 0) && !i.reduced).map((i) => i.exId);
            if (unred.length) probs.push(`${tag}: nicht reduziert ${unred.join(',')}`);
            const ecc = w.filter((i) => ['nordic_curl', 'reverse_nordic', 'neg_pullup'].includes(i.exId) && eng.loadsMuscle(EX[i.exId], m)).map((i) => i.exId);
            if (ecc.length) probs.push(`${tag}: maximal exzentrisch ${ecc.join(',')}`);
          }
          if (phase === 3 && (hold || w.some((i) => i.reduced))) probs.push(`${tag}: Anpassung noch aktiv`);
        }
      }
      // Ersatz wegen Zerrung wird nicht gemerkt
      const d0 = { ...base, sessions: [], slotMemory: {} };
      const s0 = eng.buildSession(d0, { templateId: tpls[0], equip: ALL, runType: 'auto' }); eng.rememberSlots(d0, s0);
      const mem = { ...d0.slotMemory };
      const d1 = { ...d0, slotMemory: { ...mem }, sessions: [{ id: 'strain', date: ago(1), template: 'X', blocks: [], feedback: { strain: [m] } }] };
      const s1 = eng.buildSession(d1, { templateId: tpls[0], equip: ALL, runType: 'auto' }); s1.date = st.todayISO(); eng.rememberSlots(d1, s1);
      const changed = Object.keys(mem).filter((k) => d1.slotMemory[k] !== mem[k]);
      if (changed.length) probs.push(`${eng.MUSCLE_NAME[m]}: Übungs-Erinnerung geändert (${changed.join(',')})`);
      // Muskelkater: 1 Satz weniger, ruhiges Ablassen
      const dn = { ...base, sessions: [] };
      const ds = { ...base, sessions: [], sore: { date: st.todayISO(), muscles: [m] } };
      for (const t of tpls.filter((x) => !['RUN', 'HYX'].includes(x))) {
        const a = work(eng.buildSession(dn, { templateId: t, equip: ALL, runType: 'auto' }));
        const b = work(eng.buildSession(ds, { templateId: t, equip: ALL, runType: 'auto' }));
        n += 1;
        for (const it of b) {
          const ex = EX[it.exId];
          if (!eng.loadsMuscle(ex, m) || !it.sets.length) continue;
          const ref = a.find((x) => x.exId === it.exId);
          if (ref && ref.sets.length > 2 && it.sets.length >= ref.sets.length) probs.push(`Muskelkater ${eng.MUSCLE_NAME[m]} ${t}: ${it.exId} nicht reduziert`);
          if (it.tempo && it.tempo !== '4-0-X' && Number(it.tempo.split('-')[0]) > 2) probs.push(`Muskelkater ${eng.MUSCLE_NAME[m]} ${t}: ${it.exId} Tempo ${it.tempo}`);
        }
      }
    }
    // Empfehlung meidet die Region mit Muskelkater
    const hist = tpls.map((t, i) => ({ id: `h${i}`, date: ago(10 + i), template: t, blocks: [] }));
    for (const [m, region] of [['beinbeuger', 'lower'], ['brust', 'upper']]) {
      const rec = eng.recommendTemplate({ ...base, sessions: hist, sore: { date: st.todayISO(), muscles: [m] } });
      const alt = tpls.some((t) => eng.TEMPLATES[t].focus !== region && !['RUN', 'HYX', 'REG'].includes(t));
      n += 1;
      if (alt && eng.TEMPLATES[rec.id].focus === region) probs.push(`Empfehlung trotz Muskelkater ${eng.MUSCLE_NAME[m]}: ${rec.id}`);
    }
    out.push({ ok: probs.length === 0, text: `${g.name}: ${n} Fälle – ${probs.length ? probs.slice(0, 6).join('; ') + (probs.length > 6 ? ` … (+${probs.length - 6})` : '') : 'ok'}` });
  }
  return out;
}
