// Plan-Generator & Progression nach REGELWERK.md – funktioniert komplett offline.
import { EXERCISES, EX, MUSCLES, ACT, INTENSITY, available } from './exercises.js';
import { todayISO, daysBetween, uid } from './store.js';

// ---------- Vorlagen (Split) ----------
export const TEMPLATES = {
  UK_A: {
    name: 'Unterkörper A – Kniebeuge & Sprungkraft', focus: 'lower', cond: 'short',
    slots: [
      { slot: 'power_lower', sets: 4, prio: 1, prefer: ['box_jump', 'cmj', 'db_jump_squat'] },
      { slot: 'squat', sets: 3, main: true, prio: 1, prefer: ['back_squat', 'hack_squat', 'front_squat', 'leg_press', 'goblet_squat', 'kb_goblet_squat', 'tempo_squat_bw'] },
      { slot: 'hinge', sets: 3, prio: 1, prefer: ['rdl', 'db_rdl', 'kb_rdl', 'sl_rdl_bw'] },
      { slot: 'knee_flexion', sets: 3, prio: 2, prefer: ['seated_leg_curl', 'lying_leg_curl', 'nordic_curl', 'cable_leg_curl', 'slider_curl'] },
      { slot: 'quad_iso', sets: 2, prio: 3, prefer: ['leg_extension', 'spanish_squat', 'sissy_squat'] },
      { slot: 'calf', sets: 4, prio: 2, prefer: ['standing_calf', 'db_calf', 'seated_calf', 'bw_calf'] },
      { slot: 'core', sets: 3, prio: 3, prefer: ['hanging_leg_raise', 'cable_crunch', 'dead_bug', 'ab_rollout_bw'] },
    ],
  },
  OK_A: {
    name: 'Oberkörper A – Drücken & Wurfkraft', focus: 'upper', cond: null,
    slots: [
      { slot: 'power_upper', sets: 3, prio: 2, prefer: ['mb_chest_pass', 'plyo_pushup', 'db_push_press', 'band_punch'] },
      { slot: 'hpush', sets: 4, main: true, prio: 1, prefer: ['bench_press', 'db_bench', 'chest_press', 'dips', 'band_pushup', 'pushup'] },
      { slot: 'vpull', sets: 3, prio: 1, prefer: ['pullup', 'lat_pulldown', 'band_pulldown', 'towel_row_door'] },
      { slot: 'vpush', sets: 3, prio: 2, prefer: ['db_shoulder_press', 'ohp', 'machine_shoulder', 'db_shoulder_press_st', 'kb_press', 'pike_pushup'] },
      { slot: 'hpull', sets: 3, prio: 1, prefer: ['cable_row', 'cs_db_row', 'machine_row', 'bb_row', 'one_arm_row', 'inverted_row', 'band_row', 'table_row'] },
      { slot: 'side_delt', sets: 3, prio: 2, prefer: ['cable_lateral', 'lateral_raise', 'machine_lateral', 'band_lateral', 'ytw_bw'] },
      { slot: 'triceps', sets: 2, prio: 2, prefer: ['oh_cable_ext', 'db_oh_ext', 'skullcrusher', 'band_pushdown', 'diamond_pushup'] },
      { slot: 'biceps', sets: 2, prio: 2, prefer: ['incline_curl', 'cable_curl', 'bb_curl', 'hammer_curl', 'kb_curl', 'band_curl'] },
    ],
  },
  UK_B: {
    name: 'Unterkörper B – Hüfte & Explosivität', focus: 'lower', cond: null,
    slots: [
      { slot: 'power_lower', sets: 4, prio: 1, prefer: ['broad_jump', 'kb_swing', 'hang_power_clean', 'lateral_bound'] },
      { slot: 'hinge', sets: 3, main: true, prio: 1, prefer: ['deadlift', 'hip_thrust', 'rdl', 'db_rdl', 'kb_rdl', 'glute_bridge_sl'] },
      { slot: 'lunge', sets: 3, prio: 1, prefer: ['bss_db', 'reverse_lunge_bb', 'walking_lunge', 'step_up', 'bss_bw'] },
      { slot: 'quad_iso', sets: 3, prio: 2, prefer: ['leg_extension', 'spanish_squat', 'sissy_squat'] },
      { slot: 'knee_flexion', sets: 3, prio: 2, prefer: ['lying_leg_curl', 'nordic_curl', 'cable_leg_curl', 'slider_curl', 'seated_leg_curl'] },
      { slot: 'calf', sets: 4, prio: 2, prefer: ['seated_calf', 'standing_calf', 'db_calf', 'bw_calf'] },
      { slot: 'core', sets: 3, prio: 3, prefer: ['pallof', 'copenhagen', 'farmer_walk', 'band_pallof', 'dead_bug'] },
    ],
  },
  OK_B: {
    name: 'Oberkörper B – Ziehen & Schulter', focus: 'upper', cond: 'short',
    slots: [
      { slot: 'power_upper', sets: 3, prio: 2, prefer: ['mb_slam', 'mb_rot_throw', 'band_punch', 'plyo_pushup'] },
      { slot: 'vpull', sets: 3, main: true, prio: 1, prefer: ['chinup', 'pullup', 'lat_pulldown', 'sa_pulldown', 'band_pulldown', 'towel_row_door'] },
      { slot: 'hpush', sets: 4, prio: 1, prefer: ['incline_db', 'incline_bench', 'db_bench', 'chest_press', 'dips', 'pushup', 'band_pushup'] },
      { slot: 'hpull', sets: 3, prio: 1, prefer: ['cs_db_row', 'one_arm_row', 'bb_row', 'machine_row', 'cable_row', 'inverted_row', 'band_row', 'table_row'] },
      { slot: 'rear_delt', sets: 3, prio: 2, prefer: ['face_pull', 'reverse_pec_deck', 'reverse_fly', 'band_face_pull', 'ytw_bw'] },
      { slot: 'chest_iso', sets: 3, prio: 2, prefer: ['cable_fly', 'pec_deck', 'db_fly'] },
      { slot: 'biceps', sets: 3, prio: 2, prefer: ['hammer_curl', 'cable_curl', 'bb_curl', 'incline_curl', 'kb_curl', 'band_curl'] },
      { slot: 'triceps', sets: 3, prio: 2, prefer: ['pushdown', 'oh_cable_ext', 'db_oh_ext', 'skullcrusher', 'band_pushdown', 'diamond_pushup'] },
    ],
  },
  FB_A: {
    name: 'Ganzkörper A', focus: 'full', cond: 'short',
    slots: [
      { slot: 'power_lower', sets: 3, prio: 1, prefer: ['box_jump', 'cmj', 'db_jump_squat'] },
      { slot: 'squat', sets: 3, main: true, prio: 1, prefer: ['back_squat', 'hack_squat', 'leg_press', 'goblet_squat', 'kb_goblet_squat', 'tempo_squat_bw'] },
      { slot: 'hpush', sets: 3, main: true, prio: 1, prefer: ['bench_press', 'db_bench', 'chest_press', 'dips', 'pushup'] },
      { slot: 'hpull', sets: 3, prio: 1, prefer: ['cable_row', 'cs_db_row', 'bb_row', 'one_arm_row', 'machine_row', 'inverted_row', 'band_row', 'table_row'] },
      { slot: 'knee_flexion', sets: 3, prio: 2, prefer: ['seated_leg_curl', 'nordic_curl', 'lying_leg_curl', 'slider_curl'] },
      { slot: 'side_delt', sets: 3, prio: 2, prefer: ['cable_lateral', 'lateral_raise', 'band_lateral', 'ytw_bw'] },
      { slot: 'biceps', sets: 2, prio: 3, prefer: ['incline_curl', 'cable_curl', 'hammer_curl', 'band_curl'] },
      { slot: 'core', sets: 2, prio: 3, prefer: ['hanging_leg_raise', 'cable_crunch', 'dead_bug'] },
    ],
  },
  FB_B: {
    name: 'Ganzkörper B', focus: 'full', cond: 'long',
    slots: [
      { slot: 'power_upper', sets: 3, prio: 2, prefer: ['mb_slam', 'mb_chest_pass', 'plyo_pushup', 'db_push_press'] },
      { slot: 'hinge', sets: 3, main: true, prio: 1, prefer: ['deadlift', 'rdl', 'db_rdl', 'kb_rdl', 'sl_rdl_bw'] },
      { slot: 'vpull', sets: 3, main: true, prio: 1, prefer: ['pullup', 'chinup', 'lat_pulldown', 'band_pulldown', 'towel_row_door'] },
      { slot: 'vpush', sets: 3, prio: 1, prefer: ['ohp', 'db_shoulder_press', 'machine_shoulder', 'db_shoulder_press_st', 'kb_press', 'pike_pushup'] },
      { slot: 'lunge', sets: 3, prio: 2, prefer: ['bss_db', 'walking_lunge', 'reverse_lunge_bb', 'step_up', 'bss_bw'] },
      { slot: 'triceps', sets: 2, prio: 3, prefer: ['oh_cable_ext', 'db_oh_ext', 'pushdown', 'band_pushdown', 'diamond_pushup'] },
      { slot: 'calf', sets: 3, prio: 3, prefer: ['standing_calf', 'db_calf', 'bw_calf'] },
    ],
  },
  FB_C: {
    name: 'Ganzkörper C', focus: 'full', cond: null,
    slots: [
      { slot: 'power_lower', sets: 3, prio: 1, prefer: ['broad_jump', 'kb_swing', 'lateral_bound'] },
      { slot: 'squat', sets: 3, main: true, prio: 1, prefer: ['front_squat', 'leg_press', 'hack_squat', 'goblet_squat', 'kb_goblet_squat', 'tempo_squat_bw'] },
      { slot: 'hpush', sets: 3, prio: 1, prefer: ['incline_db', 'incline_bench', 'chest_press', 'pushup'] },
      { slot: 'vpull', sets: 3, prio: 1, prefer: ['lat_pulldown', 'chinup', 'pullup', 'band_pulldown', 'towel_row_door'] },
      { slot: 'hinge', sets: 3, prio: 2, prefer: ['hip_thrust', 'db_rdl', 'kb_rdl', 'glute_bridge_sl'] },
      { slot: 'rear_delt', sets: 3, prio: 2, prefer: ['face_pull', 'reverse_fly', 'band_face_pull', 'ytw_bw'] },
      { slot: 'triceps', sets: 2, prio: 3, prefer: ['skullcrusher', 'oh_cable_ext', 'db_oh_ext', 'diamond_pushup'] },
      { slot: 'core', sets: 2, prio: 3, prefer: ['pallof', 'copenhagen', 'band_pallof', 'dead_bug'] },
    ],
  },
  ATH: {
    name: 'Athletik – Schnellkraft & Ausdauer', focus: 'full', cond: 'long',
    slots: [
      { slot: 'power_lower', sets: 4, prio: 1, prefer: ['broad_jump', 'box_jump', 'lateral_bound', 'cmj'] },
      { slot: 'power_upper', sets: 4, prio: 1, prefer: ['mb_rot_throw', 'mb_slam', 'mb_chest_pass', 'plyo_pushup', 'band_punch'] },
      { slot: 'power_lower', sets: 3, prio: 2, prefer: ['kb_swing', 'hang_power_clean', 'db_jump_squat', 'cmj'] },
      { slot: 'core', sets: 3, prio: 2, prefer: ['copenhagen', 'pallof', 'band_pallof', 'dead_bug'] },
      { slot: 'core', sets: 3, prio: 3, prefer: ['farmer_walk', 'hanging_leg_raise', 'ab_rollout_bw'] },
    ],
    longCooldown: true,
  },
  REG: {
    name: 'Regeneration – Zone 2 & Mobilität', focus: 'full', cond: 'zone2', slots: [], longCooldown: true,
  },
  RUN: { name: 'Laufeinheit', focus: 'run', cond: null, slots: [], run: true },
};

export const ROTATIONS = {
  2: ['FB_A', 'FB_B'],
  3: ['FB_A', 'FB_B', 'FB_C'],
  4: ['UK_A', 'OK_A', 'UK_B', 'OK_B'],
  5: ['UK_A', 'OK_A', 'ATH', 'UK_B', 'OK_B'],
  6: ['UK_A', 'OK_A', 'ATH', 'UK_B', 'OK_B', 'REG'],
};

const COND = {
  short: ['bike_sprints', 'sprints', 'shuttle_runs', 'kb_emom', 'bw_circuit'],
  long: ['interval_4x4', 'run_intervals', 'row_2k', 'kb_emom', 'bw_circuit'],
  zone2: ['zone2_cardio', 'zone2_run'],
};
const WARMUP = {
  run: ['leg_swings', 'ankle_mob', 'hip_9090', 'a_skips'],
  lower: ['leg_swings', 'hip_9090', 'ankle_mob', 'worlds_greatest', 'glute_bridge_wu', 'a_skips'],
  upper: ['cat_cow', 'thoracic_rot', 'arm_circles', 'band_pull_apart', 'worlds_greatest'],
  full: ['worlds_greatest', 'inchworm', 'hip_9090', 'thoracic_rot', 'leg_swings', 'a_skips'],
};
const COOLDOWN = {
  run: ['calf_stretch', 'couch_stretch', 'ham_stretch', 'pigeon'],
  lower: ['couch_stretch', 'pigeon', 'ham_stretch', 'calf_stretch'],
  upper: ['lat_stretch', 'doorway_stretch', 'childs_pose'],
  full: ['couch_stretch', 'ham_stretch', 'lat_stretch', 'doorway_stretch', 'pigeon', 'deep_squat_hold'],
};

export const BLOCK_WEEKS = 5; // 4 Belastung + 1 Deload

// ---------- Block / Periodisierung ----------
export function blockInfo(data, date = todayISO()) {
  let diff = daysBetween(data.block.start, date);
  if (diff < 0) diff = 0;
  const week = (Math.floor(diff / 7) % BLOCK_WEEKS) + 1;
  const forced = data.coach && data.coach.deloadUntil && data.coach.deloadUntil >= date;
  return { week, deload: week === BLOCK_WEEKS || !!forced, forced: !!forced };
}

export function nextTemplate(data) {
  const rot = ROTATIONS[data.profile.days] || ROTATIONS[4];
  const done = data.sessions.filter((s) => rot.includes(s.template));
  if (!done.length) return rot[0];
  const last = done[done.length - 1].template;
  return rot[(rot.indexOf(last) + 1) % rot.length];
}

// ---------- Historie & Kennzahlen ----------
export function e1rm(w, r) {
  if (!w || !r) return 0;
  return w * (1 + Math.min(r, 20) / 30); // Epley
}

function bodyweightAt(data, date) {
  const bw = [...data.bodyweight].sort((a, b) => a.date.localeCompare(b.date));
  let kg = data.profile.weight;
  for (const e of bw) { if (e.date <= date) kg = e.kg; }
  return kg;
}

function loadOf(data, ex, w, date) {
  if (ex.load === 'bw') return bodyweightAt(data, date) + (Number(w) || 0);
  return Number(w) || 0;
}

// Alle Leistungen einer Übung, neueste zuerst.
export function performances(data, exId) {
  const out = [];
  for (let i = data.sessions.length - 1; i >= 0; i--) {
    const s = data.sessions[i];
    for (const b of s.blocks) {
      for (const it of b.items) {
        if (it.exId !== exId) continue;
        const sets = (it.sets || []).filter((x) => x.done && Number(x.r) > 0).map((x) => ({ w: Number(x.w) || 0, r: Number(x.r) }));
        if (sets.length) out.push({ date: s.date, lo: it.lo, hi: it.hi, deload: !!s.deload, sets });
      }
    }
  }
  return out;
}

function bestE1rm(data, ex, perf) {
  return Math.max(...perf.sets.map((s) => e1rm(loadOf(data, ex, s.w, perf.date), s.r)));
}

export function isStagnating(data, exId) {
  const ex = EX[exId];
  if (!ex || ex.cat !== 'strength') return false;
  const p = performances(data, exId).filter((x) => !x.deload);
  if (p.length < 4) return false;
  const ref = bestE1rm(data, ex, p[3]);
  const recent = Math.max(...p.slice(0, 3).map((x) => bestE1rm(data, ex, x)));
  return recent <= ref * 1.005;
}

function roundTo(w, step) {
  if (!step) return Math.round(w * 2) / 2;
  return Math.max(0, Math.round(w / step) * step);
}

// Doppelte Progression -> Zielgewicht + Hinweis
export function target(data, ex, lo, hi, deload) {
  if (ex.load === 'none') return { w: null, note: '' };
  const hist = performances(data, ex.id);
  const step = ex.inc || 0;
  if (!hist.length) {
    if (ex.cat === 'power') return { w: ex.load === 'bw' ? 0 : null, note: 'Explosiv, jede Wdh. maximal schnell.' };
    return { w: ex.load === 'bw' ? 0 : null, note: ex.load === 'bw' ? 'Ohne Zusatzgewicht starten.' : 'Startgewicht wählen: Satzende mit 1–3 Wdh. in Reserve.' };
  }
  const last = hist[0];
  const topW = Math.max(...last.sets.map((s) => s.w));
  const top = last.sets.filter((s) => s.w === topW);
  const sameRange = last.lo === lo && last.hi === hi;
  let w = topW;
  let note = '';
  if (ex.cat === 'power') {
    note = 'Explosiv, jede Wdh. maximal schnell.';
  } else if (!sameRange && ex.load === 'kg') {
    const best = bestE1rm(data, ex, last);
    w = best / (1 + (Math.round((lo + hi) / 2) + 2) / 30);
    note = `Neuer Wdh.-Bereich – Gewicht aus deiner Bestleistung (${Math.round(best)} kg 1RM) umgerechnet.`;
  } else if (top.every((s) => s.r >= hi)) {
    if (step) { w = topW + step; note = `+${String(step).replace('.', ',')} kg – letztes Mal überall ${hi}+ Wdh.`; }
    else note = `Oberes Ziel erreicht – langsameres Tempo oder schwerere Variante.`;
  } else if (top.some((s) => s.r < lo)) {
    const prev = hist[1];
    const prevMiss = prev && prev.lo === lo && prev.hi === hi && prev.sets.some((s) => s.r < lo);
    if (prevMiss && step) { w = topW * 0.95; note = '−5 %: zweimal unter dem Wdh.-Ziel.'; }
    else note = 'Gleiches Gewicht – Wdh. aufbauen.';
  } else {
    note = `Gleiches Gewicht – Ziel: mehr Wdh. (bis ${hi}).`;
  }
  if (deload && ex.cat === 'strength') { w = w * 0.9; note = 'Deload: −10 % Gewicht, weniger Sätze.'; }
  return { w: roundTo(w, step || (ex.load === 'kg' ? 1 : 0)), note };
}

export function weeklyVolume(data, days = 7, endDate = todayISO()) {
  const vol = Object.fromEntries(Object.keys(MUSCLES).map((m) => [m, 0]));
  for (const s of data.sessions) {
    const d = daysBetween(s.date, endDate);
    if (d < 0 || d >= days) continue;
    for (const b of s.blocks) for (const it of b.items) {
      const ex = EX[it.exId];
      if (!ex || ex.cat !== 'strength') continue;
      const n = (it.sets || []).filter((x) => x.done && Number(x.r) > 0).length;
      ex.prim.forEach((m) => { vol[m] += n; });
      ex.sec.forEach((m) => { vol[m] += n * 0.5; });
    }
  }
  return vol;
}

// ---------- Übungsauswahl ----------
export function candidates(slot, equip, exclude = []) {
  return EXERCISES.filter((e) => e.slot === slot && available(e, equip) && !exclude.includes(e.id));
}

function pick(data, key, slotDef, equip, used) {
  const avoid = (data.coach && data.coach.avoid) || [];
  const pool = candidates(slotDef.slot, equip, [...used, ...avoid]);
  if (!pool.length) return null;
  const remembered = data.slotMemory[key];
  if (remembered && pool.some((e) => e.id === remembered) && !isStagnating(data, remembered)) return EX[remembered];
  const order = slotDef.prefer || [];
  const sorted = [...pool].sort((a, b) => {
    const ia = order.indexOf(a.id); const ib = order.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  // Bei Stagnation die nächste Variante nehmen
  if (remembered && isStagnating(data, remembered)) {
    const alt = sorted.find((e) => e.id !== remembered);
    if (alt) return alt;
  }
  return sorted[0];
}

export function alternatives(exId, equip, usedIds) {
  const ex = EX[exId];
  if (!ex) return [];
  return candidates(ex.slot, equip, usedIds.filter((x) => x !== exId)).filter((e) => e.id !== exId);
}

function setsFor(slotDef, week, deload, adj) {
  let s = slotDef.sets;
  if (slotDef.main && week >= 3) s += 1;
  else if (!slotDef.main && week === 4 && s >= 3) s += 1;
  s += adj;
  if (deload) s = Math.ceil(s / 2);
  return Math.min(6, Math.max(1, s));
}

function muscleAdjustments(data) {
  const out = {};
  const list = (data.coach && data.coach.volumeAdjust) || [];
  for (const v of list) {
    const d = Number(v.delta) || 0;
    if (d) out[v.muscle] = Math.sign(d) * Math.ceil(Math.abs(d) / 2);
  }
  return out;
}

// ---------- Einheit bauen ----------
export function makeItem(data, ex, nSets, opts = {}) {
  const [dlo, dhi] = ex.reps;
  const lo = opts.lo || dlo;
  const hi = opts.hi || dhi;
  const t = target(data, ex, lo, hi, opts.deload);
  const rest = opts.rest || (ex.cat === 'power' ? 120 : ex.slot === 'squat' || ex.slot === 'hinge' || (opts.main && ex.cat === 'strength') ? 180 : 90);
  const tracked = ex.cat === 'strength' || (ex.cat === 'power' && ex.load !== 'none');
  return {
    uid: uid(),
    exId: ex.id,
    lo, hi, rest,
    main: !!opts.main,
    note: [opts.note, t.note].filter(Boolean).join(' '),
    presc: ex.presc || '',
    done: false,
    ...(ex.cat === 'run' ? { run: { min: '', km: '' } } : {}),
    sets: tracked || ex.cat === 'power'
      ? Array.from({ length: nSets }, () => ({ tw: t.w, w: t.w ?? '', r: '', done: false }))
      : [],
  };
}

function mobilityBlock(type, focus, equip, long) {
  const ids = (type === 'warmup' ? WARMUP : COOLDOWN)[focus].filter((id) => available(EX[id], equip));
  const n = type === 'warmup' ? 4 : long ? 6 : 3;
  return ids.slice(0, n);
}

const ISOLATION = ['knee_flexion', 'quad_iso', 'calf', 'chest_iso', 'side_delt', 'rear_delt', 'biceps', 'triceps', 'core'];
const COND_MIN = { short: 12, long: 25, zone2: 30 };
const condKind = (exId) => Object.keys(COND).find((k) => COND[k].includes(exId)) || 'short';

// Minuten inkl. Pausen. Isolation mit ~1,75 min/Satz (Supersätze möglich).
export function estimateMinutes(session) {
  let m = 0;
  for (const b of session.blocks) {
    if (b.type === 'warmup') m += 7;
    else if (b.type === 'cooldown') m += b.items.length * 1.5;
    else if (b.type === 'conditioning') m += b.items.reduce((s, i) => s + COND_MIN[condKind(i.exId)], 0);
    else if (b.type === 'run') m += b.items.reduce((s, i) => s + (RUN_MIN[i.exId] || 40), 0);
    else for (const it of b.items) {
      const ex = EX[it.exId];
      const per = b.type === 'power' ? 2 : it.main ? 3.5 : ex && ISOLATION.includes(ex.slot) ? 1.75 : 2.75;
      m += it.sets.length * per + (ex && ISOLATION.includes(ex.slot) ? 0.5 : 1);
    }
  }
  return Math.round(m);
}

// ---------- Nachgetragene Aktivitäten ----------
// Abgeschlossene Laufeinheiten als Aktivitäten (für Belastung, Interferenz, Claude)
export function runActivities(data) {
  const out = [];
  for (const s of data.sessions) {
    if (s.template !== 'RUN') continue;
    for (const b of s.blocks) for (const it of b.items) {
      const num = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;
      if (EX[it.exId]?.cat !== 'run' || !(it.done || num(it.run?.min) > 0)) continue;
      const min = num(it.run?.min) || RUN_MIN[it.exId] || 40;
      const km = num(it.run?.km);
      out.push({ id: `run-${s.id}`, type: 'jogging', date: s.date, minutes: min, intensity: RUN_INTENSITY[it.exId] || 'mittel', ...(km > 0 ? { km } : {}), note: EX[it.exId].name, fromPlan: true, runType: it.exId });
    }
  }
  return out;
}

export function recentActivities(data, days, endDate = todayISO()) {
  return [...(data.activities || []), ...runActivities(data)].filter((a) => { const d = daysBetween(a.date, endDate); return d >= 0 && d < days; });
}

export const RUN_MIN = { run_easy: 40, run_4x4: 45, run_3030: 40, run_tempo: 45, run_fartlek: 40, run_sprints: 35, run_long: 65 };
const RUN_INTENSITY = { run_easy: 'leicht', run_long: 'mittel', run_fartlek: 'mittel', run_4x4: 'hart', run_3030: 'hart', run_tempo: 'hart', run_sprints: 'hart' };
const HARD_RUNS = ['run_4x4', 'run_tempo', 'run_3030', 'run_sprints', 'run_fartlek'];

// Polarisiert: hart nur nach lockeren Tagen, sonst locker.
export function autoRunType(data) {
  const { deload } = blockInfo(data);
  if (deload) return { id: 'run_easy', why: 'Deload-Woche – nur locker.' };
  const last2 = recentActivities(data, 2);
  const hard = last2.find((a) => ACT[a.type]?.cardio && a.intensity === 'hart');
  if (hard) return { id: 'run_easy', why: `Locker, weil ${activityName(hard)} (hart) erst vor Kurzem war.` };
  const runs = runActivities(data);
  const lastRun = runs[runs.length - 1];
  if (lastRun && RUN_INTENSITY[lastRun.runType] === 'hart' && daysBetween(lastRun.date, todayISO()) < 4) return { id: 'run_easy', why: 'Locker, weil dein letzter Lauf intensiv war.' };
  const nHard = runs.filter((r) => HARD_RUNS.includes(r.runType)).length;
  const id = HARD_RUNS[nHard % HARD_RUNS.length];
  return { id, why: 'Intensiver Reiz – du bist ausgeruht genug.' };
}

export function buildRunSession(data, { equip, runType }) {
  const { week, deload } = blockInfo(data);
  const auto = autoRunType(data);
  const id = runType && runType !== 'auto' && EX[runType] ? runType : auto.id;
  const ex = EX[id];
  const blocks = [
    { type: 'warmup', title: 'Lauf-Aufwärmen', items: WARMUP.run.map((w) => makeItem(data, EX[w], 0)) },
    { type: 'run', title: 'Laufen', items: [makeItem(data, ex, 0, { note: runType && runType !== 'auto' ? '' : auto.why })] },
  ];
  // Kurzes Kraftprogramm für Läufer (verbessert die Laufökonomie) – nur wenn Zeit bleibt
  const extra = [];
  const pick = (ids) => ids.map((x) => EX[x]).find((e) => e && available(e, equip));
  [['db_calf', 'bw_calf'], ['bss_db', 'bss_bw', 'sl_rdl_bw'], ['copenhagen', 'dead_bug']].forEach((ids) => {
    const e = pick(ids);
    if (e) { const it = makeItem(data, e, deload ? 1 : 2); it.prio = 3; extra.push(it); }
  });
  if (extra.length && RUN_MIN[id] + 7 + 6 + extra.length * 4 <= (data.profile.duration || 75)) {
    blocks.push({ type: 'strength', title: 'Kraft für Läufer', items: extra });
  }
  blocks.push({ type: 'cooldown', title: 'Cool-down & Beweglichkeit', items: COOLDOWN.run.map((c) => makeItem(data, EX[c], 0)) });
  return {
    id: uid(), date: todayISO(), template: 'RUN', title: `Laufeinheit – ${ex.name}`, week, deload,
    source: 'regel', equipment: [...equip], status: 'active', startedAt: Date.now(),
    note: 'Draußen oder auf dem Laufband. Trag danach Dauer und Strecke ein.', blocks,
  };
}
export const activityName = (a) => (a.fromPlan ? a.note : ACT[a.type]?.name || a.type);
export const activityLoad = (a) => Math.round((Number(a.minutes) || 0) * (INTENSITY[a.intensity] || 5));

export function activitySummary(data, days = 7) {
  const list = recentActivities(data, days);
  return {
    count: list.length,
    minutes: list.reduce((s, a) => s + (Number(a.minutes) || 0), 0),
    cardioMinutes: list.filter((a) => ACT[a.type]?.cardio).reduce((s, a) => s + (Number(a.minutes) || 0), 0),
    load: list.reduce((s, a) => s + activityLoad(a), 0),
    km: Math.round(list.filter((a) => a.type === 'jogging').reduce((s, a) => s + (Number(a.km) || 0), 0) * 10) / 10,
  };
}

// Was bedeuten nachgetragene Trainings für die heutige Einheit? (Interferenz & Ermüdung)
export function activityAdjust(data, focus) {
  const last2 = recentActivities(data, 2);
  const week = recentActivities(data, 7);
  const hardCardio = last2.filter((a) => ACT[a.type]?.cardio && (a.intensity === 'hart' || (a.intensity === 'mittel' && a.minutes >= 45)));
  const weekCardio = week.filter((a) => ACT[a.type]?.cardio && a.intensity !== 'leicht');
  const legs = last2.filter((a) => ACT[a.type]?.legs && a.intensity === 'hart');
  const notes = [];
  let dropCond = false;
  if (hardCardio.length) { dropCond = true; notes.push(`Kein Ausdauer-Finisher – ${activityName(hardCardio[0])} (${hardCardio[0].intensity}) war erst vor Kurzem.`); }
  else if (weekCardio.length >= 2) { dropCond = true; notes.push(`Kein Ausdauer-Finisher – diese Woche schon ${weekCardio.length}× Ausdauer nachgetragen.`); }
  const reducePower = legs.length > 0 && focus !== 'upper';
  if (reducePower) notes.push(`Beine durch ${activityName(legs[0])} vorbelastet – weniger Sprünge, nur mit voller Qualität.`);
  return { dropCond, reducePower, notes };
}

export function buildSession(data, { templateId, equip, runType }) {
  if (templateId === 'RUN') return buildRunSession(data, { equip, runType });
  const tpl = TEMPLATES[templateId];
  const { week, deload } = blockInfo(data);
  const actAdj = activityAdjust(data, tpl.focus);
  const adj = muscleAdjustments(data);
  const adjUsed = new Set();
  const used = [];
  const power = []; const strength = [];
  tpl.slots.forEach((sd, idx) => {
    const key = `${templateId}:${idx}`;
    const ex = pick(data, key, sd, equip, used);
    if (!ex) return;
    used.push(ex.id);
    let a = 0;
    const m = ex.prim[0];
    if (m && adj[m] && !adjUsed.has(m) && ex.cat === 'strength') { a = adj[m]; adjUsed.add(m); }
    let n = setsFor(sd, week, deload, a);
    if (actAdj.reducePower && ex.slot === 'power_lower') n = Math.max(2, n - 1);
    const item = makeItem(data, ex, n, { main: sd.main, deload });
    item.prio = sd.prio;
    item.slotKey = key;
    (ex.cat === 'power' ? power : strength).push(item);
  });

  const blocks = [];
  blocks.push({ type: 'warmup', title: 'Aufwärmen & Mobilität', items: mobilityBlock('warmup', tpl.focus, equip).map((id) => makeItem(data, EX[id], 0)) });
  if (power.length) blocks.push({ type: 'power', title: 'Schnellkraft', items: power });
  if (strength.length) blocks.push({ type: 'strength', title: 'Kraft & Muskelaufbau', items: strength });
  if (tpl.cond && !(actAdj.dropCond && tpl.cond !== 'zone2')) {
    const c = COND[tpl.cond].map((id) => EX[id]).find((e) => available(e, equip));
    if (c) blocks.push({ type: 'conditioning', title: tpl.cond === 'zone2' ? 'Ausdauer – locker' : 'Ausdauer-Finisher', items: [makeItem(data, c, 0)] });
  }
  blocks.push({ type: 'cooldown', title: 'Cool-down & Beweglichkeit', items: mobilityBlock('cooldown', tpl.focus, equip, tpl.longCooldown).map((id) => makeItem(data, EX[id], 0)) });

  const session = {
    id: uid(), date: todayISO(), template: templateId, title: tpl.name, week, deload,
    source: 'regel', equipment: [...equip], status: 'active', startedAt: Date.now(),
    note: [deload ? 'Deload-Woche: weniger Sätze, −10 % Gewicht. Erholung ist Teil des Fortschritts.' : '', ...actAdj.notes].filter(Boolean).join(' '),
    blocks,
  };
  fitDuration(session, data.profile.duration, equip);
  const iso = strength.filter((it) => ISOLATION.includes(EX[it.exId].slot)).length;
  if (iso >= 3) session.note = [session.note, `Tipp: Isolationsübungen paarweise als Supersatz (z. B. ${tpl.focus === 'lower' ? 'Beinbeuger + Waden' : 'Bizeps + Trizeps'}) – spart Zeit ohne Nachteil für den Muskelaufbau.`].filter(Boolean).join(' ');
  return session;
}

// Kürzt nach Priorität, bis die Einheit in die gewünschte Zeit passt.
function fitDuration(session, minutes, equip) {
  const strength = session.blocks.find((b) => b.type === 'strength');
  const power = session.blocks.find((b) => b.type === 'power');
  const items = () => [...(strength ? strength.items : []), ...(power ? power.items : [])].reverse();
  const drop = (it) => { for (const b of [strength, power]) if (b && b.items.includes(it)) b.items.splice(b.items.indexOf(it), 1); };
  const over = () => estimateMinutes(session) > minutes;
  const cond = session.blocks.find((b) => b.type === 'conditioning');
  // 1. Lange Intervalle -> kurze Intervalle
  if (cond && over() && condKind(cond.items[0].exId) !== 'short') {
    const c = COND.short.map((id) => EX[id]).find((e) => available(e, equip));
    if (c) cond.items = [makeItem({ sessions: [], bodyweight: [], profile: {} }, c, 0)];
  }
  let guard = 60;
  while (over() && guard-- > 0) {
    const p3 = items().find((it) => it.prio === 3);
    if (p3) { drop(p3); continue; }
    const big2 = items().find((it) => it.prio === 2 && it.sets.length > 2);
    if (big2) { big2.sets.pop(); continue; }
    const c = session.blocks.find((b) => b.type === 'conditioning');
    if (c && minutes < 60) { session.blocks.splice(session.blocks.indexOf(c), 1); continue; }
    const big1 = items().find((it) => it.prio === 1 && !it.main && it.sets.length > 2);
    if (big1) { big1.sets.pop(); continue; }
    const p2 = items().find((it) => it.prio === 2);
    if (p2) { drop(p2); continue; }
    break;
  }
  for (const b of [strength, power]) if (b && !b.items.length) session.blocks.splice(session.blocks.indexOf(b), 1);
}

// Plan von Claude -> Einheit (Progression/Zielgewichte kommen weiterhin aus der lokalen Logik)
export function sessionFromPlan(data, plan, { templateId, equip }) {
  const { week, deload } = blockInfo(data);
  const blocks = [];
  for (const b of plan.blocks || []) {
    const items = [];
    for (const it of b.items || []) {
      const ex = EX[it.exId];
      if (!ex || !available(ex, equip)) continue;
      const lo = Number(it.repsLow) > 0 ? Math.round(it.repsLow) : undefined;
      const hi = Number(it.repsHigh) >= (lo || 1) ? Math.round(it.repsHigh) : undefined;
      const sets = Math.min(8, Math.max(1, Math.round(Number(it.sets) || 3)));
      const item = makeItem(data, ex, ex.cat === 'strength' || ex.cat === 'power' ? sets : 0, {
        lo, hi, main: !!it.main, deload, note: it.note, rest: Number(it.restSec) > 0 ? Math.round(it.restSec) : undefined,
      });
      if (it.prescription) item.presc = it.prescription;
      items.push(item);
    }
    if (items.length) blocks.push({ type: b.type, title: b.title || '', items });
  }
  return {
    id: uid(), date: todayISO(), template: templateId, title: plan.title || TEMPLATES[templateId].name,
    week, deload, source: 'claude', equipment: [...equip], status: 'active', startedAt: Date.now(),
    note: plan.note || '', blocks,
  };
}

export function rememberSlots(data, session) {
  for (const b of session.blocks) for (const it of b.items) {
    if (it.slotKey) data.slotMemory[it.slotKey] = it.exId;
  }
}

// ---------- Daten für Diagramme ----------
export function bodyweightSeries(data) {
  const pts = [...data.bodyweight].sort((a, b) => a.date.localeCompare(b.date));
  return pts.map((p) => {
    const win = pts.filter((q) => { const d = daysBetween(q.date, p.date); return d >= 0 && d < 7; });
    const avg = win.reduce((s, q) => s + q.kg, 0) / win.length;
    return { date: p.date, kg: p.kg, avg: Math.round(avg * 10) / 10 };
  });
}

export function exerciseSeries(data, exId) {
  const ex = EX[exId];
  return performances(data, exId).reverse().map((p) => {
    let best = { w: 0, r: 0, e: 0 };
    for (const s of p.sets) {
      const e = e1rm(loadOf(data, ex, s.w, p.date), s.r);
      if (e > best.e) best = { w: s.w, r: s.r, e };
    }
    return { date: p.date, e1rm: Math.round(best.e * 10) / 10, w: best.w, r: best.r, bw: ex.load === 'bw' };
  });
}

export function trackedExercises(data) {
  const seen = new Map();
  for (const s of data.sessions) for (const b of s.blocks) for (const it of b.items) {
    const ex = EX[it.exId];
    if (ex && ex.cat === 'strength' && (it.sets || []).some((x) => x.done && Number(x.r) > 0)) seen.set(ex.id, (seen.get(ex.id) || 0) + 1);
  }
  const MAIN = ['squat', 'hinge', 'hpush', 'vpull', 'vpush', 'hpull', 'lunge'];
  const rank = (id) => { const i = MAIN.indexOf(EX[id].slot); return i < 0 ? 99 : i; };
  return [...seen.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1]).map(([id]) => EX[id]);
}

// ---------- Kontext für Claude ----------
export function aiContext(data) {
  const recent = data.sessions.filter((s) => daysBetween(s.date, todayISO()) <= 21).slice(-12).map((s) => ({
    datum: s.date,
    titel: s.title,
    uebungen: s.blocks.flatMap((b) => b.items).filter((it) => (it.sets || []).some((x) => x.done)).map((it) => ({
      id: it.exId,
      saetze: it.sets.filter((x) => x.done).map((x) => `${x.w || 0}kg×${x.r}`).join(', '),
      ziel: `${it.lo}-${it.hi}`,
    })),
  }));
  const trends = trackedExercises(data).slice(0, 12).map((ex) => {
    const ser = exerciseSeries(data, ex.id);
    return {
      id: ex.id, name: ex.name,
      e1rm_aktuell: ser.length ? ser[ser.length - 1].e1rm : null,
      e1rm_vor_4_einheiten: ser.length > 4 ? ser[ser.length - 5].e1rm : null,
      stagniert: isStagnating(data, ex.id),
    };
  });
  const bw = bodyweightSeries(data);
  const bwNow = bw.length ? bw[bw.length - 1].avg : data.profile.weight;
  const bw4w = bw.filter((p) => daysBetween(p.date, todayISO()) >= 25)
  const bwThen = bw4w.length ? bw4w[bw4w.length - 1].avg : null;
  return {
    letzte_einheiten: recent,
    wochenvolumen_saetze_7_tage: weeklyVolume(data, 7),
    leistungstrends: trends,
    koerpergewicht: { aktuell_7_tage_mittel: bwNow, vor_4_wochen: bwThen },
    weitere_aktivitaeten_14_tage: recentActivities(data, 14).map((a) => ({
      datum: a.date, art: activityName(a), minuten: a.minutes, intensitaet: a.intensity,
      ...(a.km ? { km: a.km } : {}), ...(a.note ? { notiz: a.note } : {}), last_srpe: activityLoad(a),
    })),
  };
}
