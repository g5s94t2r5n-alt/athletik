// Plan-Generator & Progression nach REGELWERK.md – funktioniert komplett offline.
import { EXERCISES, EX, MUSCLES, ACT, INTENSITY, available } from './exercises.js';
import { todayISO, daysBetween, uid } from './store.js';
import { goalOf, rotationFor, daysToRace, matchInfo, levelOf } from './goals.js';

// ---------- Vorlagen (Split) ----------
export const TEMPLATES = {
  UK_A: {
    name: 'Unterkörper – Kniebeuge & Sprungkraft', focus: 'lower', cond: 'short',
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
    name: 'Oberkörper – Drücken & Wurfkraft', focus: 'upper', cond: null,
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
    name: 'Unterkörper – Hüfte & Explosivität', focus: 'lower', cond: null,
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
    name: 'Oberkörper – Ziehen & Schulter', focus: 'upper', cond: 'short',
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
    name: 'Ganzkörper – Kniebeuge & Drücken', focus: 'full', cond: 'short',
    slots: [
      { slot: 'power_lower', sets: 3, prio: 1, prefer: ['box_jump', 'cmj', 'db_jump_squat'] },
      { slot: 'squat', sets: 4, main: true, prio: 1, prefer: ['back_squat', 'hack_squat', 'leg_press', 'goblet_squat', 'kb_goblet_squat', 'tempo_squat_bw'] },
      { slot: 'hpush', sets: 4, main: true, prio: 1, prefer: ['bench_press', 'db_bench', 'chest_press', 'dips', 'pushup'] },
      { slot: 'hpull', sets: 3, prio: 1, prefer: ['cable_row', 'cs_db_row', 'bb_row', 'one_arm_row', 'machine_row', 'inverted_row', 'band_row', 'table_row'] },
      { slot: 'knee_flexion', sets: 3, prio: 2, prefer: ['seated_leg_curl', 'nordic_curl', 'lying_leg_curl', 'slider_curl'] },
      { slot: 'side_delt', sets: 3, prio: 2, prefer: ['cable_lateral', 'lateral_raise', 'band_lateral', 'ytw_bw'] },
      { slot: 'biceps', sets: 2, prio: 3, prefer: ['incline_curl', 'cable_curl', 'hammer_curl', 'band_curl'] },
      { slot: 'core', sets: 2, prio: 3, prefer: ['hanging_leg_raise', 'cable_crunch', 'dead_bug'] },
    ],
  },
  FB_B: {
    name: 'Ganzkörper – Hüfte & Ziehen', focus: 'full', cond: 'long',
    slots: [
      { slot: 'power_upper', sets: 3, prio: 2, prefer: ['mb_slam', 'mb_chest_pass', 'plyo_pushup', 'db_push_press'] },
      { slot: 'hinge', sets: 3, main: true, prio: 1, prefer: ['deadlift', 'rdl', 'db_rdl', 'kb_rdl', 'sl_rdl_bw'] },
      { slot: 'vpull', sets: 3, main: true, prio: 1, prefer: ['pullup', 'chinup', 'lat_pulldown', 'band_pulldown', 'towel_row_door'] },
      { slot: 'vpush', sets: 3, prio: 1, prefer: ['ohp', 'db_shoulder_press', 'machine_shoulder', 'db_shoulder_press_st', 'kb_press', 'pike_pushup'] },
      { slot: 'lunge', sets: 3, prio: 2, prefer: ['bss_db', 'walking_lunge', 'reverse_lunge_bb', 'step_up', 'bss_bw'] },
      { slot: 'chest_iso', sets: 3, prio: 2, prefer: ['cable_fly', 'pec_deck', 'db_fly'] },
      { slot: 'triceps', sets: 2, prio: 3, prefer: ['oh_cable_ext', 'db_oh_ext', 'pushdown', 'band_pushdown', 'diamond_pushup'] },
      { slot: 'calf', sets: 3, prio: 2, prefer: ['standing_calf', 'db_calf', 'bw_calf'] },
    ],
  },
  FB_C: {
    name: 'Ganzkörper – Beine & Oberkörper-Mix', focus: 'full', cond: null,
    slots: [
      { slot: 'power_lower', sets: 3, prio: 1, prefer: ['broad_jump', 'kb_swing', 'lateral_bound'] },
      { slot: 'squat', sets: 3, main: true, prio: 1, prefer: ['front_squat', 'leg_press', 'hack_squat', 'goblet_squat', 'kb_goblet_squat', 'tempo_squat_bw'] },
      { slot: 'hpush', sets: 3, prio: 1, prefer: ['incline_db', 'incline_bench', 'chest_press', 'pushup'] },
      { slot: 'vpull', sets: 3, prio: 1, prefer: ['lat_pulldown', 'chinup', 'pullup', 'band_pulldown', 'towel_row_door'] },
      { slot: 'hinge', sets: 3, prio: 2, prefer: ['hip_thrust', 'db_rdl', 'kb_rdl', 'glute_bridge_sl'] },
      { slot: 'knee_flexion', sets: 2, prio: 2, prefer: ['seated_leg_curl', 'nordic_curl', 'lying_leg_curl', 'slider_curl'] },
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
  HYX: { name: 'HYROX – Lauf & Stationen', focus: 'full', cond: null, slots: [], hyrox: true },
  // Sportartspezifisch (Präferenzen je Sportart kommen aus goals.js → SPORTS)
  SP_L: {
    name: 'Unterkörper Sport – Sprung, Speed & Kraft', focus: 'lower', cond: null, sport: true,
    slots: [
      { slot: 'power_lower', sets: 3, prio: 1, prefer: ['cmj', 'box_jump', 'broad_jump', 'lateral_bound', 'depth_jump'] },
      { slot: 'cod', sets: 3, prio: 1, prefer: ['cod_505', 'lateral_shuffle'] },
      { slot: 'squat', sets: 3, main: true, prio: 1, prefer: ['back_squat', 'front_squat', 'hack_squat', 'leg_press', 'goblet_squat', 'kb_goblet_squat', 'tempo_squat_bw'] },
      { slot: 'hinge', sets: 3, prio: 1, prefer: ['rdl', 'hip_thrust', 'db_rdl', 'kb_rdl', 'sl_rdl_bw', 'glute_bridge_sl'] },
      { slot: 'lunge', sets: 2, prio: 2, prefer: ['bss_db', 'reverse_lunge_bb', 'step_up', 'walking_lunge', 'bss_bw'] },
      { slot: 'knee_flexion', sets: 2, prio: 1, prefer: ['nordic_curl', 'lying_leg_curl', 'seated_leg_curl', 'slider_curl', 'cable_leg_curl'] },
      { slot: 'prev_lower', sets: 2, prio: 2, prefer: ['sl_landing', 'sl_balance'] },
      { slot: 'core', sets: 2, prio: 2, prefer: ['pallof', 'copenhagen', 'band_pallof', 'dead_bug'] },
      { slot: 'calf', sets: 2, prio: 3, prefer: ['standing_calf', 'db_calf', 'bw_calf'] },
    ],
  },
  SP_U: {
    name: 'Oberkörper Sport – Wurf, Zug & Rumpf', focus: 'upper', cond: null, sport: true,
    slots: [
      { slot: 'power_upper', sets: 3, prio: 1, prefer: ['mb_rot_throw', 'mb_chest_pass', 'mb_overhead_throw', 'plyo_pushup', 'band_punch'] },
      { slot: 'hpush', sets: 3, main: true, prio: 1, prefer: ['bench_press', 'db_bench', 'incline_db', 'dips', 'pushup', 'band_pushup'] },
      { slot: 'vpull', sets: 3, prio: 1, prefer: ['pullup', 'chinup', 'lat_pulldown', 'band_pulldown', 'towel_row_door'] },
      { slot: 'hpull', sets: 3, prio: 1, prefer: ['cs_db_row', 'one_arm_row', 'cable_row', 'bb_row', 'inverted_row', 'band_row', 'table_row'] },
      { slot: 'vpush', sets: 2, prio: 2, prefer: ['db_shoulder_press_st', 'kb_press', 'db_shoulder_press', 'ohp', 'pike_pushup'] },
      { slot: 'prev_shoulder', sets: 2, prio: 2, prefer: ['ext_rotation_cable', 'ext_rotation_band', 'ext_rotation_db'] },
      { slot: 'core', sets: 3, prio: 2, prefer: ['pallof', 'band_pallof', 'hanging_leg_raise', 'dead_bug', 'farmer_walk'] },
      { slot: 'rear_delt', sets: 2, prio: 3, prefer: ['face_pull', 'band_face_pull', 'reverse_fly', 'ytw_bw'] },
    ],
  },
  SP_C: {
    name: 'Speed & Spielausdauer – Sprints, Richtungswechsel', focus: 'lower', cond: 'rsa', condMain: true, sport: true,
    slots: [
      { slot: 'sprint_short', sets: 4, prio: 1, prefer: ['acceleration_10m', 'wall_drill'] },
      { slot: 'cod', sets: 3, prio: 1, prefer: ['cod_505', 'lateral_shuffle'] },
      { slot: 'power_lower', sets: 3, prio: 2, prefer: ['lateral_bound', 'broad_jump', 'ankle_hops', 'cmj'] },
      { slot: 'knee_flexion', sets: 2, prio: 2, prefer: ['nordic_curl', 'slider_curl', 'lying_leg_curl', 'seated_leg_curl'] },
      { slot: 'core', sets: 2, prio: 3, prefer: ['copenhagen', 'band_pallof', 'pallof', 'dead_bug'] },
    ],
  },
  PRIME: {
    name: 'Aktivierung – kurz vor dem Spiel', focus: 'lower', cond: null, light: true, sport: true,
    slots: [
      { slot: 'power_lower', sets: 2, prio: 1, prefer: ['cmj', 'box_jump', 'approach_jump'] },
      { slot: 'sprint_short', sets: 3, prio: 1, prefer: ['acceleration_10m', 'wall_drill'] },
      { slot: 'power_upper', sets: 2, prio: 2, prefer: ['mb_chest_pass', 'mb_rot_throw', 'plyo_pushup', 'band_punch'] },
      { slot: 'core', sets: 2, prio: 2, prefer: ['dead_bug', 'band_pallof', 'pallof', 'ab_rollout_bw'] },
    ],
  },
};

// Varianten einer Einheit: in der Auswahl nur „Unterkörper“, „Oberkörper“, „Ganzkörper“ –
// die App wechselt die Varianten (z. B. Kniebeuge- bzw. Hüft-Schwerpunkt) selbst ab
export const TEMPLATE_GROUPS = { UK: ['UK_A', 'UK_B'], OK: ['OK_A', 'OK_B'], FB: ['FB_A', 'FB_B', 'FB_C'] };
export const groupOf = (id) => Object.keys(TEMPLATE_GROUPS).find((g) => TEMPLATE_GROUPS[g].includes(id)) || id;
// Fällige Variante: die am längsten nicht gemachte (bei Gleichstand die erste)
export function nextVariant(data, ids) {
  const last = (id) => data.sessions.filter((s) => s.template === id).map((s) => s.date).sort().pop() || '';
  return [...ids].sort((a, b) => last(a).localeCompare(last(b)))[0];
}

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
  rsa: ['rsa_sprints', 'shuttle_runs', 'bike_sprints', 'bw_circuit'], // wiederholte Sprints (Spielausdauer)
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

// ---------- Empfehlung der nächsten Einheit ----------
// Keine feste Reihenfolge: Erholung der Körperregion (≥ 48 h), Wochenvolumen-Defizite
// und A/B-Abwechslung entscheiden. Läufe und nachgetragene Beinbelastung zählen mit.
const REGION_MUSCLES = {
  lower: ['quadrizeps', 'beinbeuger', 'gesaess', 'waden'],
  upper: ['brust', 'ruecken', 'schultern', 'bizeps', 'trizeps'],
};
const REGION_NAME = { lower: 'Unterkörper', upper: 'Oberkörper' };
const dayWord = (d) => (d === 0 ? 'heute' : d === 1 ? 'gestern' : `vor ${d} Tagen`);

export function recommendTemplate(data, date = todayISO()) {
  const goal = goalOf(data);
  const rot = rotationFor(data);
  const ids = [...new Set(rot)];
  const target = (id) => rot.filter((x) => x === id).length;
  const sessions = data.sessions.filter((s) => daysBetween(s.date, date) >= 0);
  const acts = recentActivities(data, 28, date);
  const dtr = daysToRace(data, date);
  if (dtr !== null && dtr <= 3) return { id: 'RUN', why: dtr === 0 ? 'Heute ist Wettkampf – viel Erfolg! Höchstens locker einlaufen.' : `Noch ${dtr} ${dtr === 1 ? 'Tag' : 'Tage'} bis zum Wettkampf – nur kurz locker laufen oder Pause.` };
  // Spieltag (Sportart-Ziel): MD und MD+1 Regeneration, MD-1 nur Aktivierung, MD-2 keine schweren Beine
  const mi = matchInfo(data, date);
  if (mi && (mi.toMatch === 0 || mi.sinceMatch === 0)) return { id: 'REG', why: 'Heute ist Spieltag – kein Zusatztraining. Höchstens 10 min Mobilität. Viel Erfolg!' };
  if (mi && mi.toMatch === 1) return { id: 'PRIME', why: 'Morgen ist Spiel – nur kurze Aktivierung (ca. 30 min): wenige Sprünge und Antritte, nichts Ermüdendes.' };
  if (mi && mi.sinceMatch === 1) return { id: 'REG', why: 'Gestern war Spiel – heute Regeneration: locker bewegen und Mobilität.' };
  if (!sessions.length && !acts.length && !(mi && mi.toMatch === 2)) return { id: rot[0], why: `Start deines Plans (${goal.name}).` };
  const since = (d) => (d ? daysBetween(d, date) : 99);
  const latest = (dates) => dates.filter(Boolean).sort().pop() || null;
  const lastOf = (pred) => latest(sessions.filter(pred).map((s) => s.date));
  const focusOf = (s) => TEMPLATES[s.template]?.focus;
  const hits = (s, region) => (['REG', 'PRIME'].includes(s.template) ? false : s.template === 'ATH' ? region === 'lower' : [region, 'full'].includes(focusOf(s)));
  // Bei Lauf-Zielen zählt ein Lauf nur 24 h als Beinbelastung („harte Tage hart“), sonst 48 h
  const runFocus = ids.includes('RUN') || ids.includes('HYX');
  const dayBefore = (iso) => todayISO(new Date(new Date(iso + 'T12:00:00').getTime() - 86400000));
  // Sportart-Ziel: Teamtraining und Läufe belasten die Beine nur 24 h (sonst bliebe zwischen Teamtrainings und Spiel
  // kein Tag für Beinkraft); ein Spiel zählt voll
  const shortLoad = (a) => (runFocus && a.type === 'jogging') || (goal.id === 'sport' && ['teamsport', 'jogging'].includes(a.type));
  const legLoad = acts.filter((a) => ACT[a.type]?.legs && a.intensity !== 'leicht').map((a) => (shortLoad(a) ? dayBefore(a.date) : a.date));
  const lastLower = latest([lastOf((s) => hits(s, 'lower')), ...legLoad]);
  const lastUpper = lastOf((s) => hits(s, 'upper'));
  const dRegion = { lower: since(lastLower), upper: since(lastUpper) };
  const runs = acts.filter((a) => a.type === 'jogging');
  const dRun = since(latest(runs.map((a) => a.date)));
  const vol = weeklyVolume(data, 7, date);
  const deficit = (region) => (goal.volumeFocus ? REGION_MUSCLES[region].filter((m) => vol[m] < 10) : []);
  const doneWeek = (id) => (id === 'RUN'
    ? runs.filter((a) => a.runType !== 'hx_runs' && daysBetween(a.date, date) < 7).length
    : sessions.filter((s) => s.template === id && daysBetween(s.date, date) < 7).length);

  const scored = ids.map((id) => {
    const tpl = TEMPLATES[id];
    const dTpl = since(lastOf((s) => s.template === id));
    const tgt = target(id); const done = doneWeek(id); const missing = tgt - done;
    let d = 99; let score = missing > 0 ? missing * 20 : -30 + missing * 10; const reasons = [];
    if (tpl.focus === 'lower' || tpl.focus === 'upper') {
      d = dRegion[tpl.focus];
      score += Math.min(d, 4) * 10 - (d < 2 ? 40 : 0);
      const def = deficit(tpl.focus);
      score += def.length * 3;
      const lastSame = [...sessions].reverse().find((s) => focusOf(s) === tpl.focus && !['ATH', 'REG', 'PRIME'].includes(s.template));
      if (lastSame && lastSame.template === id) score -= 8;
      reasons.push(d >= 99 ? `${REGION_NAME[tpl.focus]} noch nicht trainiert.` : `${REGION_NAME[tpl.focus]} zuletzt ${dayWord(d)} – ${d >= 2 ? 'erholt' : 'noch nicht erholt'}.`);
      if (def.length && d >= 2) reasons.push(`Unter Zielvolumen: ${def.slice(0, 3).map((m) => MUSCLES[m]).join(', ')}.`);
      if (lastSame && lastSame.template !== id && d >= 2) reasons.push('Abwechslung zur letzten Variante.');
    } else if (id === 'RUN') {
      score += Math.min(dRun, 3) * 8 - (dRun < 1 ? 40 : 0) - (dRegion.lower === 0 ? 15 : 0);
      const auto = autoRunType(data);
      reasons.push(dRun >= 99 ? 'Noch kein Lauf.' : `Letzter Lauf ${dayWord(dRun)}.`);
      if (missing <= 0) { score -= 10; reasons.push('Lauf-Wochenziel erreicht – heute nur locker (oder Pause).'); }
      else reasons.push(`Diese Woche ${done} von ${tgt} ${tgt === 1 ? 'Lauf' : 'Läufen'}.`);
      reasons.push(`Vorschlag: ${EX[auto.id].name}.`);
    } else if (id === 'HYX') {
      d = Math.min(dRegion.lower, dRegion.upper);
      score += Math.min(d, 4) * 10 - (d < 2 ? 40 : 0) + Math.min(dTpl, 7);
      reasons.push(dTpl >= 99 ? 'Noch keine HYROX-Einheit.' : `Letzte HYROX-Einheit ${dayWord(dTpl)}.`);
      if (d < 2) reasons.push('Muskeln noch nicht ganz erholt.');
    } else if (id === 'ATH') {
      d = Math.min(dRegion.lower, dRegion.upper);
      score += Math.min(dTpl, 7) * 5 - (dRegion.lower < 2 ? 25 : 0);
      reasons.push(dTpl >= 99 ? 'Athletik-Tag noch nicht gemacht.' : `Letzter Athletik-Tag ${dayWord(dTpl)}.`);
    } else if (id === 'REG') {
      score += Math.min(dTpl, 7) * 2;
      reasons.push('Lockere Einheit zur Erholung.');
    } else { // Ganzkörper
      d = Math.min(dRegion.lower, dRegion.upper);
      score += Math.min(d, 4) * 10 - (d < 2 ? 40 : 0) + Math.min(dTpl, 7);
      reasons.push(d >= 99 ? 'Noch keine Krafteinheit.' : `Letzte Krafteinheit ${dayWord(d)} – ${d >= 2 ? 'erholt' : 'noch nicht erholt'}.`);
      if (tgt > 1 || ['endurance', 'marathon', 'hyrox'].includes(goal.id)) reasons.push(`Kraft diese Woche: ${sessions.filter((s) => ['FB_A', 'FB_B', 'FB_C'].includes(s.template) && daysBetween(s.date, date) < 7).length}×.`);
    }
    if (goal.key === id && missing > 0) score += 6; // Schlüsseleinheit des Ziels bei Gleichstand bevorzugen
    // 3–4 Tage vor dem Spiel ist das letzte Fenster für schwere Beine (MD-2/MD-1 gesperrt) → fällige
    // Beineinheit vorziehen, wenn sie länger her ist als die letzte Oberkörper-Einheit
    if (mi && (mi.toMatch === 3 || mi.toMatch === 4) && tpl.focus === 'lower' && missing > 0 && d >= 2 && dTpl >= dRegion.upper) {
      score += 25; reasons.push(`Letztes gutes Fenster für Beinkraft vor dem Spiel (in ${mi.toMatch} Tagen).`);
    }
    return { id, score, d, missing, why: reasons.join(' ') };
  }).sort((a, b) => b.score - a.score);

  const isHeavy = (c) => !['ATH', 'REG', 'RUN', 'PRIME'].includes(c.id);
  if (mi && mi.toMatch === 2) {
    // Zwei Tage vor dem Spiel: nichts, was die Beine ermüdet – Oberkörper oder locker
    const legs = (id) => !['REG', 'PRIME', 'RUN'].includes(id) && ['lower', 'full'].includes(TEMPLATES[id].focus);
    const ok = scored.find((c) => !legs(c.id) && c.missing > 0 && !(isHeavy(c) && c.d < 2));
    if (ok) return { ...ok, why: `In 2 Tagen ist Spiel – heute keine schweren Beine. ${ok.why}` };
    return { id: 'REG', why: 'In 2 Tagen ist Spiel – heute keine schweren Beine. Locker regenerieren oder Pause.' };
  }
  const best = scored[0];
  if (!(isHeavy(best) && best.d < 2)) return best;
  // Beste Option wäre eine nicht erholte Region → erholte, noch fehlende Einheit oder locker
  const alt = scored.find((c) => !(isHeavy(c) && c.d < 2) && c.missing > 0);
  if (alt) return alt;
  const pending = TEMPLATES[best.id].name.split(' – ')[0];
  if (ids.includes('REG') || goal.id === 'sport') return { id: 'REG', why: `${pending} steht noch aus, aber die Muskeln sind noch nicht erholt – heute locker regenerieren.` };
  return { id: 'RUN', why: `${pending} steht noch aus, aber die Muskeln sind noch nicht erholt – heute lieber locker laufen (oder Pause).` };
}

export function nextTemplate(data) {
  return recommendTemplate(data).id;
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

// ---------- Richtwerte (Gewichtsempfehlungen) ----------
// Geschätztes 1RM als Vielfaches des Körpergewichts für einen trainierten Mann (fortgeschritten).
// Kurzhantel/Kettlebell: pro Hand bzw. Gerät. Klimmzug/Chin-up/Dips: Gesamtlast inkl. Körpergewicht.
const STD = {
  back_squat: 1.5, front_squat: 1.2, hack_squat: 1.9, leg_press: 3.0, goblet_squat: 0.5, kb_goblet_squat: 0.45,
  deadlift: 1.9, rdl: 1.4, db_rdl: 0.55, hip_thrust: 2.0, kb_rdl: 0.45,
  bss_db: 0.35, walking_lunge: 0.35, step_up: 0.35, reverse_lunge_bb: 1.0,
  seated_leg_curl: 0.8, lying_leg_curl: 0.65, cable_leg_curl: 0.25, leg_extension: 1.0,
  standing_calf: 1.6, db_calf: 0.4, seated_calf: 1.1,
  bench_press: 1.2, incline_bench: 1.0, db_bench: 0.45, incline_db: 0.38, chest_press: 1.2, dips: 1.5,
  ohp: 0.75, db_shoulder_press: 0.32, db_shoulder_press_st: 0.28, machine_shoulder: 0.85, kb_press: 0.28,
  bb_row: 1.0, cs_db_row: 0.45, one_arm_row: 0.55, cable_row: 1.05, machine_row: 1.05,
  pullup: 1.4, chinup: 1.45, lat_pulldown: 1.0, sa_pulldown: 0.45,
  cable_fly: 0.3, db_fly: 0.22, pec_deck: 0.9, lateral_raise: 0.15, cable_lateral: 0.12, machine_lateral: 0.45,
  face_pull: 0.4, reverse_fly: 0.13, reverse_pec_deck: 0.55,
  incline_curl: 0.2, bb_curl: 0.55, cable_curl: 0.45, hammer_curl: 0.24, kb_curl: 0.22,
  oh_cable_ext: 0.45, db_oh_ext: 0.35, pushdown: 0.55, skullcrusher: 0.5, cable_crunch: 0.8, pallof: 0.25,
  ext_rotation_cable: 0.12, ext_rotation_db: 0.1, wrist_ext_ecc: 0.08,
};
// Arbeitsgewicht direkt als Vielfaches des Körpergewichts (Schnellkraft & Tragen)
const WORK = { kb_swing: 0.27, hang_power_clean: 0.5, db_jump_squat: 0.12, db_push_press: 0.22, farmer_walk: 0.4 };
const LOWER_M = ['quadrizeps', 'beinbeuger', 'gesaess', 'waden'];
const regionOfEx = (ex) => (ex.prim.some((m) => LOWER_M.includes(m)) ? 'lower' : 'upper');
const kg = (v) => String(Math.round(v * 10) / 10).replace('.', ',');

// Trainingsziel → Wdh. in Reserve: Ausdauer-Ziele etwas mehr Puffer
export const goalRir = (data) => (goalOf(data).volume < 0.8 ? 3 : 2);

let bestCache = { key: '', map: {} };
function bestE1rms(data) {
  const last = data.sessions[data.sessions.length - 1];
  const key = `${data.sessions.length}:${last ? last.id : ''}:${data.bodyweight.length}`;
  if (bestCache.key === key) return bestCache.map;
  const map = {}; const cnt = {};
  for (let i = data.sessions.length - 1; i >= 0; i--) {
    const s = data.sessions[i];
    for (const b of s.blocks) for (const it of b.items) {
      const ex = EX[it.exId];
      if (!ex || !STD[ex.id] || (cnt[ex.id] || 0) >= 3) continue;
      const sets = (it.sets || []).filter((x) => x.done && Number(x.r) > 0);
      if (!sets.length) continue;
      cnt[ex.id] = (cnt[ex.id] || 0) + 1;
      const e = Math.max(...sets.map((x) => e1rm(loadOf(data, ex, x.w, s.date), Number(x.r))));
      map[ex.id] = Math.max(map[ex.id] || 0, e);
    }
  }
  bestCache = { key, map };
  return map;
}

function profileFactor(data, region) {
  const level = levelOf(data.profile).factor;
  const sex = data.profile.sex === 'weiblich' ? (region === 'lower' ? 0.7 : 0.55) : 1;
  return level * sex;
}

// Persönlicher Kraftfaktor aus den letzten Leistungen (Median, bevorzugt gleiche Körperregion)
function historyFactor(data, region, bw) {
  const map = bestE1rms(data);
  const pick = (filter) => {
    const arr = Object.entries(map).filter(([id]) => filter(EX[id])).map(([id, e]) => ({ id, f: e / (STD[id] * bw) })).sort((a, b) => a.f - b.f);
    if (!arr.length) return null;
    const m = arr[Math.floor(arr.length / 2)];
    return { f: m.f, ref: EX[m.id].name };
  };
  return pick((ex) => regionOfEx(ex) === region) || pick(() => true);
}

export function estimateWeight(data, ex, lo, hi) {
  let bw = bodyweightAt(data, todayISO());
  // Referenzwerte gelten für ca. 15 % Körperfett → bei bekanntem Körperfett über die fettfreie Masse skalieren
  const bc = bodyComp(data);
  if (bc && bc.cur.fat && !bc.stale) bw = Math.min(1.1, Math.max(0.8, (1 - bc.cur.fat / 100) / 0.85)) * bw;
  const region = regionOfEx(ex);
  const hf = historyFactor(data, region, bw);
  const factor = hf ? hf.f : profileFactor(data, region);
  const basis = hf ? `aus deinen bisherigen Leistungen (z. B. ${hf.ref})` : `für dein Profil (${kg(bw)} kg)`;
  if (WORK[ex.id]) return { w: WORK[ex.id] * bw * factor, basis };
  if (!STD[ex.id]) return null;
  const reps = Math.round((lo + hi) / 2);
  let w = (STD[ex.id] * bw * factor) / (1 + (reps + goalRir(data)) / 30);
  if (ex.load === 'bw') w -= bw; // Zusatzgewicht
  return { w, basis };
}

// Doppelte Progression -> Zielgewicht + Hinweis
export function target(data, ex, lo, hi, deload) {
  if (ex.load === 'none' || (['rehab', 'prev_lower'].includes(ex.slot) && ex.load === 'bw')) return { w: null, note: '' };
  const hist = performances(data, ex.id);
  const step = ex.inc || 0;
  if (!hist.length) {
    // Noch nie gemacht → Richtwert aus anderen Übungen bzw. Profil, passend zu Wdh.-Ziel und Trainingsziel
    const est = estimateWeight(data, ex, lo, hi);
    const dl = deload ? 0.9 : 1;
    if (ex.cat === 'power') {
      if (est && ex.load === 'kg') { const w = roundTo(est.w * dl, step || 1); return { w, note: `Richtwert ${est.basis}: ${kg(w)} kg – explosiv, jede Wdh. maximal schnell.` }; }
      return { w: ex.load === 'bw' ? 0 : null, note: 'Explosiv, jede Wdh. maximal schnell.' };
    }
    if (!est) return { w: ex.load === 'bw' ? 0 : null, note: ex.load === 'bw' ? 'Ohne Zusatzgewicht starten.' : `Startgewicht wählen: Satzende mit ${goalRir(data)} Wdh. in Reserve.` };
    if (ex.load === 'bw') {
      const add = roundTo(Math.max(0, est.w * dl), step || 2.5);
      return { w: add, note: add > 0 ? `Richtwert ${est.basis}: +${kg(add)} kg Zusatzgewicht für ${lo}–${hi} Wdh.` : `Richtwert ${est.basis}: ohne Zusatzgewicht${est.w < -10 ? ', bei Bedarf mit Band-Unterstützung' : ''}.` };
    }
    const w = Math.max(step || 1, roundTo(est.w * dl, step || 1));
    return { w, note: `Richtwert ${est.basis}: ${kg(w)} kg für ${lo}–${hi} Wdh. – erste Sätze mit ${goalRir(data)} Wdh. Reserve testen und anpassen.` };
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
    w = best / (1 + (Math.round((lo + hi) / 2) + goalRir(data)) / 30);
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

// Varianten derselben Übung: höchstens eine pro Einheit (z. B. Liegestütze + Enge Liegestütze)
const FAMILY = {
  pushup: 'pushup', band_pushup: 'pushup', diamond_pushup: 'pushup', plyo_pushup: 'pushup',
  inverted_row: 'bwrow', table_row: 'bwrow',
  pallof: 'pallof', band_pallof: 'pallof',
  rdl: 'rdl', db_rdl: 'rdl', kb_rdl: 'rdl', sl_rdl_bw: 'rdl',
  bss_db: 'bss', bss_bw: 'bss',
  goblet_squat: 'goblet', kb_goblet_squat: 'goblet',
};
const familyOf = (id) => FAMILY[id] || id;
// Schließt alle Übungen aus, deren Familie in der Einheit schon vorkommt
const familyBlocked = (used) => { const f = new Set(used.map(familyOf)); return EXERCISES.filter((e) => f.has(familyOf(e.id))).map((e) => e.id); };

function pick(data, key, slotDef, equip, used, opts = {}) {
  const coachAvoid = (data.coach && data.coach.avoid) || [];
  // Ausgeblendete Übungen meiden (notfalls doch nehmen); bei Beschwerden belastende Übungen nie –
  // dann entfällt der Platz lieber. Keine zweite Variante einer schon gewählten Übung.
  const pain = opts.pain || [];
  const fam = familyBlocked(used);
  let pool = candidates(slotDef.slot, equip, [...fam, ...coachAvoid, ...pain, ...(opts.avoid || [])]);
  if (!pool.length) pool = candidates(slotDef.slot, equip, [...fam, ...coachAvoid, ...pain]);
  if (!pool.length) return null;
  const order = slotDef.prefer || [];
  const sorted = [...pool].sort((a, b) => {
    const ia = order.indexOf(a.id); const ib = order.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  // Präventionsübungen der Sportart (z. B. Nordic Curls, Copenhagen) bleiben – Fortschritt über Wdh./Variante
  if (slotDef.keep) return sorted[0];
  const remembered = data.slotMemory[key];
  if (remembered && !opts.vary && pool.some((e) => e.id === remembered) && !isStagnating(data, remembered)) return EX[remembered];
  // Bei Stagnation oder Wunsch nach Abwechslung die nächste Variante nehmen
  if (remembered && (opts.vary || isStagnating(data, remembered))) {
    const alt = sorted.find((e) => e.id !== remembered);
    if (alt) return alt;
  }
  return sorted[0];
}

export function alternatives(exId, equip, usedIds) {
  const ex = EX[exId];
  if (!ex) return [];
  const others = usedIds.filter((x) => x !== exId);
  return candidates(ex.slot, equip, [...others, ...familyBlocked(others)]).filter((e) => e.id !== exId);
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

// ---------- Bewegungstempo ----------
// Code „ablassen–Pause in der Dehnung–zurück“ in Sekunden, X = explosiv (maximal schnell gewollt).
// Wdh.-Dauern von ca. 0,5–8 s bauen ähnlich Muskeln auf (Schoenfeld 2015); maximal schnell gewollte
// konzentrische Phase bringt mehr Kraft (Pareja-Blanco 2017). Im Block: Woche 1–2 langsam ablassen +
// Pause (Technik, Spannung in der Dehnung), Woche 3–4 zügig/explosiv mit mehr Gewicht, Deload ruhig.
export function tempoFor(data, ex, lo, hi, week, deload) {
  if (!ex || ex.cat !== 'strength' || ['core', 'prev_lower', 'rehab'].includes(ex.slot)) return null;
  if (ex.id === 'nordic_curl') return '4-0-X';
  if (ex.slot === 'calf') return '2-2-1'; // Pause unten nimmt den Achillessehnen-Federeffekt raus
  if (ex.slot === 'prev_shoulder') return '2-0-2';
  const g = data && data.profile ? goalOf(data) : null;
  const inSeason = !!g && g.id === 'sport' && g.season === 'saison'; // in der Saison keine betonte Exzentrik (Muskelkater)
  const iso = ISOLATION.includes(ex.slot);
  if (deload) return '2-0-1';
  if (hi <= 6 || inSeason) return week <= 2 && !inSeason && !['hinge'].includes(ex.slot) ? '2-1-X' : '2-0-X';
  if (iso) return week <= 2 ? '3-1-1' : '2-1-1';
  return week <= 2 ? '3-1-1' : '2-0-X';
}

// ---------- Pulszonen ----------
// Eingabe: Max-Puls und Ruhepuls. Mit beiden → Herzfrequenzreserve (Karvonen 1957); nur Max-Puls → Prozent
// vom Max-Puls; ohne Max-Puls wird er aus dem Alter geschätzt (208 − 0,7 × Alter, Tanaka 2001).
export const HR_ZONES = {
  recovery: { name: 'Erholung', max: [0.6, 0.7], hrr: [0.5, 0.6] },
  easy: { name: 'Locker (Zone 2)', max: [0.65, 0.75], hrr: [0.6, 0.7] },
  tempo: { name: 'Schwelle', max: [0.85, 0.9], hrr: [0.8, 0.87] },
  interval: { name: 'Intervall (VO₂max)', max: [0.9, 0.95], hrr: [0.87, 0.93] },
  short: { name: 'Kurz & schnell', max: [0.85, 0.95], hrr: [0.8, 0.93], lag: true },
};
const pnum = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return n > 30 && n < 230 ? n : null; };
export function hrBase(profile) {
  const age = Number(profile.age) || 30;
  const measured = pnum(profile.hrMax);
  const max = measured || Math.round(208 - 0.7 * age);
  const rest = pnum(profile.hrRest) && pnum(profile.hrRest) < max - 40 ? pnum(profile.hrRest) : null;
  return {
    method: rest ? 'hrr' : 'max', max, rest, estimated: !measured,
    name: `${rest ? 'Herzfrequenzreserve aus Max- und Ruhepuls' : 'Prozent vom Max-Puls'}${measured ? '' : ' (Max-Puls aus dem Alter geschätzt)'}`,
  };
}
export function hrRange(profile, zone) {
  const z = HR_ZONES[zone];
  if (!z) return null;
  const b = hrBase(profile);
  const calc = (f) => Math.round(b.method === 'hrr' ? b.rest + f * (b.max - b.rest) : f * b.max);
  const [lo, hi] = (b.method === 'hrr' ? z.hrr : z.max).map(calc);
  return { lo, hi, text: `${lo}–${hi}`, zone, name: z.name, lag: !!z.lag };
}
// Welche Zone gilt in welcher Phase einer Übung?
const HR_SHORT = ['run_3030', 'run_1515', 'run_rsa', 'run_shuttle', 'run_sprints', 'bike_sprints', 'sprints', 'shuttle_runs', 'rsa_sprints', 'bw_circuit', 'kb_emom', 'row_2k'];
export function hrPlan(exId) {
  if (['run_easy', 'run_long', 'zone2_cardio', 'zone2_run'].includes(exId)) return { all: 'easy' };
  if (exId === 'run_fartlek') return { all: 'easy', surge: 'tempo' };
  if (exId === 'run_tempo') return { warm: 'easy', work: 'tempo', rest: 'recovery', cool: 'recovery' };
  if (['run_4x4', 'interval_4x4', 'run_intervals'].includes(exId)) return { warm: 'easy', work: 'interval', rest: 'recovery', cool: 'recovery' };
  if (HR_SHORT.includes(exId)) return { warm: 'easy', work: 'short', rest: 'recovery', cool: 'recovery' };
  return null;
}
// Kurztext für die Übungskarte
export function hrSummary(profile, exId) {
  const pl = hrPlan(exId);
  if (!pl) return '';
  const r = (z) => hrRange(profile, z);
  if (pl.all) return `${r(pl.all).text} (${r(pl.all).name})${pl.surge ? ` · Tempowechsel bis ${r(pl.surge).text}` : ''}`;
  const w = r(pl.work);
  return `Belastung ${w.text}${w.lag ? ' (Puls hinkt nach – nach Tempo laufen)' : ''} · Pause ${r(pl.rest).text}`;
}

// ---------- Intervall-Uhr ----------
// Phasen aus der Intervall-Definition einer Übung (Runden/Serien anpassbar)
export function intervalPhases(iv, rounds = iv.rounds, sets = iv.sets || 1) {
  const ph = [];
  if (iv.warm) ph.push({ kind: 'warm', label: 'Einlaufen', sec: iv.warm });
  for (let st = 1; st <= sets; st++) {
    for (let r = 1; r <= rounds; r++) {
      ph.push({ kind: 'work', label: iv.workLabel || 'Belastung', sec: iv.work, round: r, rounds, set: st, sets });
      if (r < rounds && iv.rest) ph.push({ kind: 'rest', label: 'Pause', sec: iv.rest, round: r, rounds, set: st, sets });
      if (r === rounds && st < sets) ph.push({ kind: 'rest', label: 'Serienpause', sec: iv.setRest || iv.rest || 120, round: r, rounds, set: st, sets });
    }
  }
  if (iv.cool) ph.push({ kind: 'cool', label: 'Auslaufen', sec: iv.cool });
  return ph;
}

export function tempoText(code) {
  if (!code) return '';
  if (code === '4-0-X') return 'so langsam wie möglich ablassen (3–5 s), mit den Händen abfangen, zügig zurück';
  const [e, p, c] = code.split('-');
  return [`${e} s ablassen`, Number(p) ? `${p} s Pause in der Dehnung` : '', c === 'X' ? 'explosiv zurück' : `${c} s zurück`].filter(Boolean).join(' · ');
}

const defaultRest = (ex, main) => (ex.cat === 'power' ? 120 : ex.slot === 'squat' || ex.slot === 'hinge' || (main && ex.cat === 'strength') ? 180 : 90);

// ---------- Einheit bauen ----------
export function makeItem(data, ex, nSets, opts = {}) {
  const [dlo, dhi] = ex.reps;
  const lo = opts.lo || dlo;
  const hi = opts.hi || dhi;
  const t = target(data, ex, lo, hi, opts.deload);
  let tempo = null;
  if (ex.cat === 'strength' && data && data.block) { const bi = blockInfo(data); tempo = tempoFor(data, ex, lo, hi, opts.week || bi.week, opts.deload ?? bi.deload); }
  const rest = opts.rest || defaultRest(ex, opts.main);
  const tracked = ex.cat === 'strength' || (ex.cat === 'power' && ex.load !== 'none');
  return {
    uid: uid(),
    exId: ex.id,
    lo, hi, rest,
    main: !!opts.main,
    note: [opts.note, t.note].filter(Boolean).join(' '),
    presc: ex.presc || '',
    done: false,
    ...(tempo ? { tempo } : {}),
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

const ISOLATION = ['knee_flexion', 'quad_iso', 'calf', 'chest_iso', 'side_delt', 'rear_delt', 'biceps', 'triceps', 'core', 'prev_lower', 'prev_shoulder', 'rehab'];
const COND_MIN = { short: 12, long: 25, zone2: 30, rsa: 20 };
const condKind = (exId) => Object.keys(COND).find((k) => COND[k].includes(exId)) || 'short';

// Minuten inkl. Pausen. Isolation mit ~1,75 min/Satz (Supersätze möglich).
export function estimateMinutes(session) {
  let m = 0;
  for (const b of session.blocks) {
    if (b.type === 'warmup') m += 7;
    else if (b.type === 'cooldown') m += b.items.length * 1.5;
    else if (b.type === 'conditioning') m += b.items.reduce((s, i) => s + (i.exId.startsWith('hx_') ? 5 : COND_MIN[condKind(i.exId)]), 0);
    else if (b.type === 'run') m += b.items.reduce((s, i) => s + (RUN_MIN[i.exId] || 40), 0);
    else for (const it of b.items) {
      const ex = EX[it.exId];
      const iso = ex && ISOLATION.includes(ex.slot);
      // Supersatz: Pause des einen Muskels = Arbeit des Gegenspielers → ca. 2 min pro Satz (Isolation 1,25)
      const per = b.type === 'power' ? 2 : it.ss ? (iso ? 1.25 : 2) : it.main ? 3.5 : iso ? 1.75 : 2.75;
      m += it.sets.length * per + (ex && ISOLATION.includes(ex.slot) ? 0.5 : 1);
    }
  }
  return Math.round(m);
}

// ---------- Körperzusammensetzung (optional: Muskelmasse kg, Körperfett %) ----------
// Waagen mit Bioimpedanz schwanken von Tag zu Tag deutlich → nur Mittelwerte und Trends über ≥ 3 Wochen werten.
export function bodyCompSeries(data) {
  return [...data.bodyweight].filter((e) => e.muscle > 0 || e.fat > 0).sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, kg: e.kg, muscle: e.muscle > 0 ? e.muscle : null, fat: e.fat > 0 ? e.fat : null, fatKg: e.fat > 0 ? Math.round(e.kg * e.fat) / 100 : null }));
}

export function bodyComp(data, date = todayISO()) {
  const pts = bodyCompSeries(data).filter((e) => daysBetween(e.date, date) >= 0);
  if (!pts.length) return null;
  const last = pts[pts.length - 1];
  const mean = (arr, k) => { const v = arr.map((e) => e[k]).filter((x) => x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const midDate = (arr) => arr[Math.floor(arr.length / 2)].date;
  const recent = pts.filter((e) => daysBetween(e.date, last.date) <= 10);
  const ref = pts.filter((e) => { const d = daysBetween(e.date, last.date); return d >= 21 && d <= 56; });
  const cur = { muscle: mean(recent, 'muscle'), fat: mean(recent, 'fat'), fatKg: mean(recent, 'fatKg') };
  const old = ref.length ? { muscle: mean(ref, 'muscle'), fat: mean(ref, 'fat'), fatKg: mean(ref, 'fatKg') } : null;
  const d = (k) => (old && cur[k] != null && old[k] != null ? Math.round((cur[k] - old[k]) * 10) / 10 : null);
  const female = data.profile.sex === 'weiblich';
  return {
    cur, old, last: last.date,
    weeks: old ? Math.round(daysBetween(midDate(ref), midDate(recent)) / 7) : null,
    dMuscle: d('muscle'), dFat: d('fat'), dFatKg: d('fatKg'),
    level: cur.fat == null ? null : cur.fat > (female ? 32 : 25) ? 'high' : cur.fat < (female ? 18 : 10) ? 'low' : 'normal',
    stale: daysBetween(last.date, date) > 21,
  };
}

const kgS = (v) => String(Math.abs(Math.round(v * 10) / 10)).replace('.', ',');
// Was bedeutet die Körperzusammensetzung für die heutige Einheit?
export function compAdjust(data, date = todayISO()) {
  const out = { mainDelta: 0, dropCond: false, addCond: false, notes: [] };
  const bc = bodyComp(data, date);
  if (!bc || bc.stale) return out;
  const goal = goalOf(data);
  const build = ['muscle', 'strength', 'fitness'].includes(goal.id) || (goal.id === 'sport' && goal.season === 'pause');
  if (bc.dMuscle != null && bc.dMuscle <= -0.5) {
    out.mainDelta = 1; out.dropCond = true;
    out.notes.push(`Muskelmasse in ${bc.weeks} Wochen um ${kgS(bc.dMuscle)} kg gesunken – heute mehr Kraftreiz (Hauptübungen +1 Satz) und kein intensiver Finisher. Kaloriendefizit ggf. verkleinern, Protein 1,6–2,2 g/kg.`);
  } else if (bc.dFat != null && bc.dFat >= 1 && build && !(bc.dMuscle != null && bc.dMuscle >= 0.5)) {
    out.addCond = goal.id !== 'sport';
    out.notes.push(`Körperfett in ${bc.weeks} Wochen +${kgS(bc.dFat)} %-Punkte bei kaum mehr Muskelmasse – ${out.addCond ? 'Ausdauer-Finisher dazu, ' : ''}Kalorienüberschuss etwas verringern (ca. 200–300 kcal).`);
  } else if (bc.dFat != null && bc.dFat >= 1 && goal.id === 'lose') {
    out.notes.push(`Körperfett steigt trotz Ziel Abnehmen (+${kgS(bc.dFat)} %-Punkte) – Kaloriendefizit und Alltagsbewegung prüfen.`);
  } else if (bc.dFat != null && bc.dFat <= -1 && (bc.dMuscle == null || bc.dMuscle >= -0.3)) {
    out.notes.push(`Körperfett −${kgS(bc.dFat)} %-Punkte in ${bc.weeks} Wochen${bc.dMuscle != null ? ` bei ${bc.dMuscle >= 0 ? '+' : '−'}${kgS(bc.dMuscle)} kg Muskelmasse` : ''} – weiter so.`);
  }
  if (bc.level === 'high' && build && !out.dropCond && goal.id !== 'sport') {
    if (!out.addCond) out.notes.push(`Körperfett ca. ${kgS(bc.cur.fat)} % – Muskelaufbau mit Ausdauer-Finishern und ohne Kalorienüberschuss (Rekomposition) ist sinnvoll.`);
    out.addCond = true;
  }
  if (bc.level === 'low' && goal.id === 'lose') {
    out.dropCond = true;
    out.notes.push(`Körperfett nur noch ca. ${kgS(bc.cur.fat)} % – höchstens langsam weiter abnehmen, Muskelerhalt hat Vorrang (kein intensiver Finisher).`);
  }
  return out;
}

// ---------- Rückmeldungen nach dem Training ----------
export const PAIN_NAME = { knie: 'Knie', schulter: 'Schulter', ruecken: 'Rücken', ellbogen: 'Ellbogen', huefte: 'Hüfte', sprunggelenk: 'Sprunggelenk' };

// Anstrengung automatisch aus den Wiederholungen: viele Sätze unter dem Ziel = zu schwer,
// fast alle am oberen Ende = zu leicht
export function autoEffort(session) {
  let total = 0; let miss = 0; let top = 0;
  for (const b of session.blocks) for (const it of b.items) {
    if (EX[it.exId]?.cat !== 'strength') continue;
    for (const st of it.sets || []) {
      if (!st.done || !(Number(st.r) > 0)) continue;
      total++; if (Number(st.r) < it.lo) miss++; if (Number(st.r) >= it.hi) top++;
    }
  }
  if (total < 3) return '';
  if (miss / total >= 0.5) return 'too_hard';
  if (top / total >= 0.8) return 'easy';
  return 'right';
}
export const effortOf = (s) => (s.feedback && s.feedback.effort) || s.autoEffort || '';

// ---------- Ausgleich bei Beschwerden ----------
// Statt Schonung: gezielte Stabilisation/Kräftigung (gut belegt) plus Mobilität und Dehnung für die Region.
// Je Gruppe wird die erste verfügbare Übung genommen. Schmerz-Monitoring statt Pause (Silbernagel 2007).
export const REGION_WORK = {
  sprunggelenk: { stab: [['sl_balance', 'star_balance'], ['ankle_eversion_band', 'bw_calf']], warm: ['ankle_mob'], cool: ['calf_stretch'] },
  knie: { stab: [['wall_sit', 'spanish_squat'], ['clamshell', 'step_down']], warm: ['leg_swings'], cool: ['couch_stretch', 'ham_stretch'] },
  schulter: { stab: [['ext_rotation_band', 'ext_rotation_cable', 'ext_rotation_db'], ['wall_slide', 'scap_pushup', 'ytw_bw']], warm: ['band_pull_apart', 'arm_circles'], cool: ['sleeper_stretch', 'doorway_stretch'] },
  ruecken: { stab: [['bird_dog', 'dead_bug'], ['side_plank', 'band_pallof']], warm: ['cat_cow'], cool: ['childs_pose', 'pigeon'] },
  ellbogen: { stab: [['wrist_ext_ecc', 'wrist_ext_iso']], warm: ['arm_circles'], cool: ['forearm_stretch'] },
  huefte: { stab: [['adductor_squeeze', 'copenhagen'], ['clamshell', 'side_plank']], warm: ['hip_9090'], cool: ['adductor_stretch', 'pigeon'] },
};
export const PAIN_FOCUS_DAYS = 28;

// Regionen mit Beschwerden in den letzten 4 Wochen (bis man sie als „wieder gut“ markiert)
export function painFocus(data, date = todayISO()) {
  const last = {};
  for (const s of data.sessions) {
    if (!s.feedback || !(s.feedback.pain || []).length) continue;
    const d = daysBetween(s.date, date);
    if (d < 0 || d >= PAIN_FOCUS_DAYS) continue;
    s.feedback.pain.forEach((p) => { if (!last[p] || s.date > last[p]) last[p] = s.date; });
  }
  const cleared = data.painCleared || {};
  return Object.entries(last).filter(([p, d]) => REGION_WORK[p] && !(cleared[p] && cleared[p] >= d))
    .map(([region, since]) => ({ region, since, until: todayISO(new Date(new Date(since + 'T12:00:00').getTime() + PAIN_FOCUS_DAYS * 86400000)) }));
}

// Ergänzt eine Einheit um Ausgleichsübungen. full = auch Stabilisationsblock (nicht bei Lauf-/HYROX-Einheiten
// und der Aktivierung vor dem Spiel – dort nur Mobilität und Dehnen).
export function addRegionWork(data, session, equip, { full = true } = {}) {
  const focus = painFocus(data);
  if (!focus.length) return session;
  const inSession = new Set(session.blocks.flatMap((b) => b.items.map((i) => i.exId)));
  const ok = (id) => EX[id] && available(EX[id], equip) && !inSession.has(id) && !familyBlocked([...inSession]).includes(id);
  const take = (id) => { inSession.add(id); return id; };
  const stab = []; const warm = []; const cool = [];
  for (const { region } of focus) {
    const w = REGION_WORK[region];
    if (full) w.stab.forEach((grp) => { const id = grp.find(ok); if (id && stab.length < 4) stab.push(take(id)); });
    const wu = w.warm.find(ok); if (wu && warm.length < 2) warm.push(take(wu));
    w.cool.filter(ok).slice(0, 2).forEach((id) => { if (cool.length < 4) cool.push(take(id)); });
  }
  const names = focus.map((f) => PAIN_NAME[f.region]).join(', ');
  const wb = session.blocks.find((b) => b.type === 'warmup');
  if (wb) warm.forEach((id) => wb.items.push(makeItem(data, EX[id], 0)));
  const cb = session.blocks.find((b) => b.type === 'cooldown');
  if (cb) cool.forEach((id) => cb.items.push(makeItem(data, EX[id], 0)));
  if (stab.length) {
    const items = stab.map((id) => { const it = makeItem(data, EX[id], 2, { rest: 45 }); it.prio = 1; return it; });
    const at = session.blocks.findIndex((b) => ['strength', 'conditioning', 'cooldown'].includes(b.type));
    session.blocks.splice(at < 0 ? session.blocks.length : at, 0, { type: 'stability', title: `Ausgleich: ${names}`, items });
  }
  if (stab.length || warm.length || cool.length) {
    session.note = [session.note, `Ausgleich für ${names}: ${stab.length ? 'Stabilisation und ' : ''}Mobilität/Dehnung sind ergänzt. Schmerz-Regel: Beschwerden bis etwa 3–5 von 10 sind bei allen Übungen in Ordnung, wenn sie bis zum nächsten Morgen abklingen – sonst Gewicht oder Umfang reduzieren bzw. die Übung tauschen. Bei anhaltenden oder starken Schmerzen ärztlich abklären.`].filter(Boolean).join(' ');
  }
  return session;
}

export function feedbackAdjust(data, templateId, date = todayISO()) {
  const out = { setDelta: 0, mainDelta: 0, deload: false, dropCond: false, vary: false, avoid: [...(data.dislikes || [])], pain: [], notes: [] };
  const recent = data.sessions.filter((s) => (s.feedback || s.autoEffort) && daysBetween(s.date, date) >= 0 && daysBetween(s.date, date) < 10);
  if (!recent.length) return out;
  const rated = recent.filter((s) => effortOf(s));
  const lastEff = rated.length ? effortOf(rated[rated.length - 1]) : '';
  const heavy = rated.slice(-3).filter((s) => effortOf(s) === 'too_hard').length;
  if (heavy >= 2) {
    out.deload = true; out.setDelta = -1; out.dropCond = true;
    out.notes.push('Zuletzt mehrmals viele Sätze unter dem Wdh.-Ziel – heute Deload-Charakter (weniger Sätze, −10 % Gewicht).');
  } else if (lastEff === 'too_hard') {
    out.setDelta = -1; out.dropCond = true;
    out.notes.push('Letzte Einheit: viele Sätze unter dem Wdh.-Ziel – heute 1 Satz weniger pro Übung und kein Finisher.');
  } else if (lastEff === 'easy') {
    out.mainDelta = 1;
    out.notes.push('Letzte Einheit: fast alle Sätze am oberen Wdh.-Ende – heute 1 Satz mehr bei den Hauptübungen.');
  }
  const sameTpl = [...recent].reverse().find((s) => s.template === templateId && s.feedback);
  if (sameTpl && sameTpl.feedback.liked === 'no') { out.vary = true; out.notes.push('Diese Einheit hat dir zuletzt nicht gefallen – heute andere Übungsvarianten.'); }
  // Beschwerden: keine Schonung mehr – stattdessen Ausgleichsübungen für die Region (addRegionWork)
  return out;
}

// ---------- Persönliche Rekorde ----------
const num = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;
function runEntries(data, exclude) {
  const out = [];
  for (const s of data.sessions) {
    if (s.id === exclude) continue;
    for (const b of s.blocks) for (const it of b.items) if (it.run && num(it.run.km) > 0) out.push({ km: num(it.run.km), min: num(it.run.min), date: s.date });
  }
  for (const a of data.activities || []) if (a.type === 'jogging' && num(a.km) > 0) out.push({ km: num(a.km), min: num(a.minutes), date: a.date });
  return out;
}
const paceOf = (r) => (r.km >= 3 && r.min > 0 ? r.min / r.km : null);

// Rekorde einer abgeschlossenen Einheit im Vergleich zu allen früheren Einheiten
export function sessionRecords(data, session) {
  const prior = data.sessions.filter((x) => x.id !== session.id);
  const best = (exId) => {
    const ex = EX[exId]; let e1 = 0; let w = 0; let any = false;
    for (const p of prior) for (const b of p.blocks) for (const it of b.items) {
      if (it.exId !== exId) continue;
      for (const st of it.sets || []) { if (!st.done || !(Number(st.r) > 0)) continue; any = true; e1 = Math.max(e1, e1rm(loadOf(data, ex, st.w, p.date), Number(st.r))); w = Math.max(w, Number(st.w) || 0); }
    }
    return any ? { e1, w } : null;
  };
  const recs = [];
  for (const b of session.blocks) for (const it of b.items) {
    const ex = EX[it.exId];
    if (!ex || ex.slot === 'rehab') continue;
    const sets = (it.sets || []).filter((st) => st.done && Number(st.r) > 0);
    if (sets.length && ex.load !== 'none') {
      const prev = best(ex.id);
      if (prev) {
        const top = sets.reduce((a, st) => { const e = e1rm(loadOf(data, ex, st.w, session.date), Number(st.r)); return e > a.e ? { e, w: Number(st.w) || 0, r: Number(st.r) } : a; }, { e: 0, w: 0, r: 0 });
        const maxW = Math.max(...sets.map((st) => Number(st.w) || 0));
        if (ex.cat === 'strength' && top.e > prev.e1 + 0.4) recs.push({ exId: ex.id, kind: '1rm', value: top.e, prev: prev.e1, w: top.w, r: top.r, bw: ex.load === 'bw' });
        else if (maxW > prev.w && maxW > 0) recs.push({ exId: ex.id, kind: 'weight', value: maxW, prev: prev.w, bw: ex.load === 'bw' });
      }
    }
    if (it.run && num(it.run.km) > 0) {
      const runs = runEntries(data, session.id);
      const cur = { km: num(it.run.km), min: num(it.run.min) };
      if (runs.length) {
        const longest = Math.max(...runs.map((r) => r.km));
        if (cur.km > longest) recs.push({ kind: 'distance', value: cur.km, prev: longest });
        const paces = runs.map(paceOf).filter(Boolean);
        const p = paceOf(cur);
        if (p && paces.length && p < Math.min(...paces)) recs.push({ kind: 'pace', value: p, prev: Math.min(...paces) });
      }
    }
  }
  return recs;
}

// Bestwerte für die Rekordliste im Fortschritt
export function allRecords(data) {
  const lifts = trackedExercises(data).map((ex) => {
    const ser = exerciseSeries(data, ex.id);
    const top = ser.reduce((a, x) => (x.e1rm > a.e1rm ? x : a), ser[0]);
    return { exId: ex.id, name: ex.name, e1rm: top.e1rm, w: top.w, r: top.r, date: top.date, bw: top.bw };
  });
  const runs = runEntries(data, null);
  const longest = runs.reduce((a, r) => (!a || r.km > a.km ? r : a), null);
  const fastest = runs.filter(paceOf).reduce((a, r) => (!a || paceOf(r) < paceOf(a) ? r : a), null);
  return { lifts, longest, fastest };
}

// ---------- Nachgetragene Aktivitäten ----------
// Abgeschlossene Laufeinheiten als Aktivitäten (für Belastung, Interferenz, Claude)
export function runActivities(data) {
  const out = [];
  for (const s of data.sessions) {
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

export const RUN_MIN = { hx_runs: 30, run_easy: 40, run_4x4: 45, run_3030: 40, run_tempo: 45, run_fartlek: 40, run_sprints: 35, run_long: 65, run_1515: 32, run_rsa: 32, run_shuttle: 32 };
const RUN_INTENSITY = { hx_runs: 'hart', run_easy: 'leicht', run_long: 'mittel', run_fartlek: 'mittel', run_4x4: 'hart', run_3030: 'hart', run_tempo: 'hart', run_sprints: 'hart', run_1515: 'hart', run_rsa: 'hart', run_shuttle: 'hart' };

// Polarisiert: hart nur nach lockeren Tagen, sonst locker. Ziel bestimmt Schwerpunkte
// (z. B. Marathon: wöchentlicher langer Lauf), vor dem Wettkampf Tapering.
export function autoRunType(data) {
  const goal = goalOf(data);
  const { deload } = blockInfo(data);
  const dtr = daysToRace(data);
  if (dtr !== null && dtr <= 3) return { id: 'run_easy', why: `Noch ${dtr} Tage bis zum Wettkampf – nur kurz und locker.` };
  const runsAll = runActivities(data);
  const hadLongWeek = runsAll.some((r) => r.runType === 'run_long' && daysBetween(r.date, todayISO()) < 6);
  const lastHard = [...data.sessions].reverse().find((x) => daysBetween(x.date, todayISO()) < 2 && effortOf(x) === 'too_hard');
  if (lastHard) return { id: 'run_easy', why: 'Locker, weil bei deiner letzten Einheit viele Sätze unter dem Wdh.-Ziel lagen.' };
  if (goal.id === 'sport') return sportRunType(data, goal, deload);
  if (deload) {
    if (goal.longRun && !hadLongWeek && !(dtr !== null && dtr <= 10)) return { id: 'run_long', why: 'Deload-Woche: langer Lauf etwas kürzer (ca. 45–60 min), ganz locker.' };
    return { id: 'run_easy', why: 'Deload-Woche – nur locker.' };
  }
  const last2 = recentActivities(data, 2);
  const hard = last2.find((a) => ACT[a.type]?.cardio && a.intensity === 'hart');
  if (hard) return { id: 'run_easy', why: `Locker, weil ${activityName(hard)} (hart) erst vor Kurzem war.` };
  const runs = runActivities(data);
  const lastRun = runs[runs.length - 1];
  if (lastRun && RUN_INTENSITY[lastRun.runType] !== 'leicht' && daysBetween(lastRun.date, todayISO()) < (lastRun.runType === 'run_long' ? 2 : 4)) {
    return { id: 'run_easy', why: `Locker, weil dein letzter Lauf (${EX[lastRun.runType]?.name || 'intensiv'}) fordernd war.` };
  }
  const runTarget = rotationFor(data).filter((x) => x === 'RUN').length;
  const runsWeek = recentActivities(data, 7).filter((a) => a.type === 'jogging' && a.runType !== 'hx_runs').length;
  if (runTarget && runsWeek >= runTarget) return { id: 'run_easy', why: `Wochenziel (${runTarget} ${runTarget === 1 ? 'Lauf' : 'Läufe'}) schon erreicht – heute nur locker.` };
  const taper = dtr !== null && dtr <= 10;
  const hadLong = runs.some((r) => r.runType === 'run_long' && daysBetween(r.date, todayISO()) < 6);
  if (goal.longRun && !hadLong && !taper) return { id: 'run_long', why: 'Langer Lauf dieser Woche steht noch aus.' };
  const cycle = goal.runCycle.filter((id) => !(taper && id === 'run_long'));
  const nKey = runs.filter((r) => cycle.includes(r.runType)).length;
  const id = cycle[nKey % cycle.length];
  return { id, why: taper ? `Tapering (noch ${dtr} Tage): kurzer, knackiger Reiz.` : 'Intensiver Reiz – du bist ausgeruht genug.' };
}

// Sportart-Ziel: nicht polarisiert wie im Ausdauersport, sondern spielnahe kurze, intensive Formate
// (15/15, wiederholte Sprints mit Richtungswechsel, Pendelintervalle; Buchheit & Laursen 2013, Bishop 2011).
// Locker nur zur Erholung: rund ums Spiel, nach harten Tagen, wenn das Wochenlimit erreicht ist.
const SPORT_RUN_WHY = {
  run_4x4: 'Aerobe Basis – 4×4 hebt die VO₂max und die Laufleistung im Spiel (Helgerud 2001).',
  run_1515: 'Spielnah: kurze, intensive Belastungen mit kurzen Pausen – Ausdauer für wiederholte Antritte.',
  run_rsa: 'Spielnah: wiederholte Sprints mit Richtungswechsel – schnell bleiben, auch spät im Spiel.',
  run_shuttle: 'Spielnah: viele Wenden und Tempowechsel wie auf dem Feld.',
  run_sprints: 'Schnelligkeit: kurze Sprints mit voller Pause.',
  run_fartlek: 'Lockere Grundlage mit Tempowechseln – gut in der Saisonpause.',
  run_tempo: 'Grundlage in der Saisonpause: zügig an der Schwelle.',
};
function sportRunType(data, goal, deload) {
  const today = todayISO();
  const mi = matchInfo(data);
  const easy = (why) => ({ id: 'run_easy', why });
  if (mi && (mi.toMatch === 0 || mi.sinceMatch === 0)) return easy('Spieltag – höchstens 15–20 min ganz locker zum Auflockern.');
  if (mi && mi.toMatch != null && mi.toMatch <= 2) return easy(`${mi.toMatch === 1 ? 'Morgen' : 'In 2 Tagen'} ist Spiel – nur locker (20–30 min), damit die Beine frisch sind.`);
  if (mi && mi.sinceMatch === 1) return easy('Tag nach dem Spiel – lockerer Regenerationslauf (20–30 min).');
  if (deload) return easy('Deload-Woche – nur locker.');
  // Zwischen zwei harten Einheiten (Teamtraining, Spiel, harter Lauf) mindestens ein Ruhetag
  const hard = recentActivities(data, 2).find((a) => ACT[a.type]?.cardio && a.intensity === 'hart');
  if (hard) return easy(`Locker, weil ${activityName(hard)} (hart) ${daysBetween(hard.date, today) === 0 ? 'heute' : 'gestern'} war – zwischen zwei harten Einheiten ein Ruhetag.`);
  const runs = runActivities(data);
  const hardRuns = runs.filter((r) => RUN_INTENSITY[r.runType] === 'hart' && daysBetween(r.date, today) < 7);
  if (hardRuns.length >= goal.hardRuns) return easy(`Diese Woche schon ${hardRuns.length} ${hardRuns.length === 1 ? 'harter Lauf' : 'harte Läufe'} – ${goal.season === 'saison' ? 'in der Saison reicht einer, den Rest erledigen Teamtraining und Spiel' : 'mehr bringt kaum zusätzlichen Nutzen'}. Heute locker.`);
  const cycle = goal.runCycle;
  const nKey = runs.filter((r) => cycle.includes(r.runType)).length;
  const id = cycle[nKey % cycle.length];
  const why = (SPORT_RUN_WHY[id] || 'Intensiver Reiz – du bist ausgeruht genug.').replace('Spielnah:', `Spielnah für ${goal.sportProfile.name}:`);
  return { id, why: `${why}${goal.season === 'saison' ? ' Saison: knackig, aber nicht ausbelasten.' : ''}` };
}

export function buildRunSession(data, { equip, runType }) {
  const { week, deload } = blockInfo(data);
  const dtr = daysToRace(data);
  const taper = dtr !== null && dtr <= 14;
  const auto = autoRunType(data);
  const id = runType && runType !== 'auto' && EX[runType] ? runType : auto.id;
  const ex = EX[id];
  const blocks = [
    { type: 'warmup', title: 'Lauf-Aufwärmen', items: WARMUP.run.map((w) => makeItem(data, EX[w], 0)) },
    { type: 'run', title: 'Laufen', items: [makeItem(data, ex, 0, { note: runType && runType !== 'auto' ? '' : auto.why })] },
  ];
  // Keine Kraftübungen nach dem Lauf – Kraft kommt aus den Ganzkörper-Einheiten des Wochenplans
  blocks.push({ type: 'cooldown', title: 'Cool-down & Beweglichkeit', items: COOLDOWN.run.map((c) => makeItem(data, EX[c], 0)) });
  return addRegionWork(data, {
    id: uid(), date: todayISO(), template: 'RUN', title: `Laufeinheit – ${ex.name}`, week, deload,
    source: 'regel', equipment: [...equip], status: 'active', startedAt: Date.now(),
    note: [taper ? `Tapering: noch ${dtr} Tage bis zum Wettkampf – Umfang runter, Frische zählt.` : '', 'Draußen oder auf dem Laufband. Trag danach Dauer und Strecke ein.'].filter(Boolean).join(' '), blocks,
  }, equip, { full: false });
}
const HX_STATIONS = ['hx_skierg', 'hx_sled_push', 'hx_sled_pull', 'hx_bbj', 'hx_row', 'hx_farmers', 'hx_lunges', 'hx_wallballs'];

export function buildHyroxSession(data, { equip }) {
  const { week, deload } = blockInfo(data);
  const dtr = daysToRace(data);
  const avail = HX_STATIONS.filter((id) => available(EX[id], equip));
  const rounds = deload || (dtr !== null && dtr <= 7) ? 3 : 4;
  const done = data.sessions.filter((s) => s.template === 'HYX').length;
  const stations = [];
  for (let i = 0; i < avail.length && stations.length < rounds; i++) stations.push(avail[(done * rounds + i) % avail.length]);
  const runItem = makeItem(data, EX.hx_runs, 0);
  runItem.presc = `${stations.length} × 1 km zügig, jeweils vor einer Station`;
  const blocks = [
    { type: 'warmup', title: 'Aufwärmen', items: WARMUP.full.slice(0, 4).map((w) => makeItem(data, EX[w], 0)) },
    { type: 'run', title: 'HYROX-Läufe', items: [runItem] },
    { type: 'conditioning', title: 'Stationen (im Wechsel mit den Läufen)', items: stations.map((id) => makeItem(data, EX[id], 0)) },
    { type: 'cooldown', title: 'Cool-down & Beweglichkeit', items: COOLDOWN.full.slice(0, 4).map((c) => makeItem(data, EX[c], 0)) },
  ];
  return addRegionWork(data, {
    id: uid(), date: todayISO(), template: 'HYX', title: 'HYROX – Lauf & Stationen', week, deload,
    source: 'regel', equipment: [...equip], status: 'active', startedAt: Date.now(),
    note: [
      `Ablauf: ${stations.map((id, i) => `1 km Lauf → ${EX[id].name}`).join(' → ')}.`,
      'Stationen abhaken, am Ende Gesamtzeit und Strecke der Läufe eintragen.',
      dtr !== null && dtr <= 14 ? `Noch ${dtr} Tage bis zum Wettkampf – Tempo kontrolliert, nicht ausbelasten.` : '',
    ].filter(Boolean).join(' '),
    blocks,
  }, equip, { full: false });
}

export const activityName = (a) => (a.fromPlan ? a.note : a.type === 'course' && a.note ? `Kurs „${a.note.split(/[,\n]/)[0].trim()}“` : ACT[a.type]?.name || a.type);
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

// Sportart-Ziel: Übungsvorlieben, Prioritäten und Sätze der Sportart auf den Slot anwenden.
// prefer gilt in den Sport-Vorlagen, always (z. B. Nordic Curls beim Fußball) in allen Vorlagen.
function sportSlot(goal, tpl, sd) {
  const sp = goal.sportProfile;
  if (!sp) return { sd, tag: '' };
  const pre = (tpl.sport && sp.prefer && sp.prefer[sd.slot]) || (sp.always && sp.always[sd.slot]);
  const prio = tpl.sport && !tpl.light && sp.prio && sp.prio[sd.slot];
  const sets = tpl.sport && !tpl.light && sp.sets && sp.sets[sd.slot];
  if (!pre && !prio && !sets) return { sd, tag: '' };
  const keep = !!pre && ['knee_flexion', 'core', 'prev_lower', 'prev_shoulder'].includes(sd.slot);
  return {
    sd: { ...sd, ...(pre ? { prefer: [...new Set([...pre, ...(sd.prefer || [])])] } : {}), ...(prio ? { prio } : {}), ...(sets ? { sets } : {}), ...(keep ? { keep } : {}) },
    tag: pre ? `:${sp.id}` : '', // eigene Übungs-Erinnerung je Sportart
  };
}

export function buildSession(data, { templateId, equip, runType }) {
  if (templateId === 'RUN') return buildRunSession(data, { equip, runType });
  if (templateId === 'HYX') return buildHyroxSession(data, { equip });
  const tpl = TEMPLATES[templateId];
  const { week, deload } = blockInfo(data);
  const goal = goalOf(data);
  const dtr = daysToRace(data);
  const mi = matchInfo(data);
  const taper = dtr !== null && dtr <= 14;
  const vf = goal.volume * (taper ? 0.7 : 1);
  const actAdj = activityAdjust(data, tpl.focus);
  const fb = feedbackAdjust(data, templateId);
  const ca = compAdjust(data);
  const adj = muscleAdjustments(data);
  const adjUsed = new Set();
  const used = [];
  const power = []; const strength = [];
  // Auswahl-Reihenfolge: Hauptübungen zuerst, dann nach Priorität – so hat z. B. Liegestütze als Hauptübung
  // Vorrang vor plyometrischen Liegestützen. Angezeigt wird danach wieder in der Reihenfolge der Vorlage.
  const order = tpl.slots.map((sd0, idx) => ({ sd0, idx })).sort((a, b) => (b.sd0.main ? 1 : 0) - (a.sd0.main ? 1 : 0) || (a.sd0.prio || 9) - (b.sd0.prio || 9) || a.idx - b.idx);
  order.forEach(({ sd0, idx }) => {
    const { sd, tag } = sportSlot(goal, tpl, sd0);
    const key = `${templateId}:${idx}${tag}`;
    const ex = pick(data, key, sd, equip, used, { avoid: fb.avoid, pain: fb.pain, vary: fb.vary });
    if (!ex) return;
    used.push(ex.id);
    let a = 0;
    const m = ex.prim[0];
    if (m && adj[m] && !adjUsed.has(m) && ex.cat === 'strength') { a = adj[m]; adjUsed.add(m); }
    let n = tpl.light ? sd.sets : setsFor(sd, week, deload, a);
    if (!tpl.light) {
      // Präventionsübungen (Landung, Außenrotation) bleiben auch bei reduziertem Volumen vollständig
      if (ex.cat === 'strength' && vf !== 1 && !['prev_lower', 'prev_shoulder'].includes(ex.slot)) n = Math.max(2, Math.round(n * vf));
      if (actAdj.reducePower && ex.slot === 'power_lower') n = Math.max(2, n - 1);
      if (ex.cat === 'strength') n = Math.min(6, Math.max(sd.main ? 2 : 1, n + fb.setDelta + (sd.main ? fb.mainDelta + ca.mainDelta : 0)));
    }
    const heavy = !tpl.light && goal.reps === 'strength' && ex.cat === 'strength' && ex.load === 'kg' && !ISOLATION.includes(ex.slot);
    // Aktivierung vor dem Spiel: wenige Wdh., volle Pausen, keine Ermüdung
    const primeReps = tpl.light && ex.cat === 'power' && ex.reps[1] <= 6 ? { lo: 2, hi: 3, rest: 90 } : {};
    const item = makeItem(data, ex, n, { main: sd.main, deload: deload || fb.deload, ...(heavy ? { lo: sd.main ? 3 : 5, hi: sd.main ? 6 : 8, rest: sd.main ? 210 : 150 } : {}), ...primeReps });
    item.prio = sd.prio;
    item.slotKey = key;
    item.pos = idx;
    (ex.cat === 'power' ? power : strength).push(item);
  });
  [power, strength].forEach((arr) => { arr.sort((a, b) => a.pos - b.pos); arr.forEach((it) => delete it.pos); });

  const blocks = [];
  blocks.push({ type: 'warmup', title: 'Aufwärmen & Mobilität', items: mobilityBlock('warmup', tpl.focus, equip).map((id) => makeItem(data, EX[id], 0)) });
  if (power.length) blocks.push({ type: 'power', title: tpl.light ? 'Aktivierung – Sprünge & Antritte' : tpl.sport ? 'Speed, Sprung & Richtungswechsel' : 'Schnellkraft', items: power });
  const strengthBlock = strength.length ? { type: 'strength', title: tpl.sport ? 'Kraft & Prävention' : 'Kraft & Muskelaufbau', items: strength } : null;
  // Spielausdauer (condMain) ist Hauptinhalt und kommt vor den Kraft-/Präventionsübungen:
  // Sprints nie mit ermüdeten Beinbeugern (z. B. nach Nordic Curls)
  if (strengthBlock && !tpl.condMain) blocks.push(strengthBlock);
  const matchDay = mi && (mi.toMatch === 0 || mi.sinceMatch === 0);
  if (tpl.cond && !((actAdj.dropCond || fb.dropCond || ca.dropCond) && tpl.cond !== 'zone2') && (goal.finisher || ca.addCond || tpl.cond === 'zone2' || tpl.condMain) && !(matchDay && templateId === 'REG')) {
    const c = COND[tpl.cond].map((id) => EX[id]).find((e) => available(e, equip));
    if (c) blocks.push({ type: 'conditioning', title: tpl.cond === 'zone2' ? 'Ausdauer – locker' : tpl.condMain ? 'Spielausdauer – wiederholte Sprints' : 'Ausdauer-Finisher', items: [makeItem(data, c, 0)] });
  }
  if (strengthBlock && tpl.condMain) blocks.push(strengthBlock);
  blocks.push({ type: 'cooldown', title: 'Cool-down & Beweglichkeit', items: mobilityBlock('cooldown', tpl.focus, equip, tpl.longCooldown).map((id) => makeItem(data, EX[id], 0)) });

  // Regenerationstag (keine Kraftübungen): Hinweise zu Finisher/Sprüngen und Saisonphase passen nicht
  const plain = !tpl.slots.length;
  const actNotes = plain ? [] : tpl.condMain ? actAdj.notes.map((n) => n.replace('Kein Ausdauer-Finisher', 'Ohne Sprint-Ausdauer-Block')) : actAdj.notes;
  const session = {
    id: uid(), date: todayISO(), template: templateId, title: tpl.name, week, deload,
    source: 'regel', equipment: [...equip], status: 'active', startedAt: Date.now(),
    note: [
      taper ? `Tapering: noch ${dtr} Tage bis zum Wettkampf – weniger Volumen, Frische zählt.` : '',
      matchDay && templateId === 'REG' ? 'Spieltag: nur Mobilität, kein Ausdauerteil – die Energie gehört dem Spiel.' : '',
      tpl.light ? 'Aktivierung: kurz und explosiv mit vollen Pausen – du sollst dich danach frischer fühlen als vorher. Kein Muskelkater, nichts bis zur Ermüdung.' : '',
      deload && !tpl.light && !plain ? 'Deload-Woche: weniger Sätze, −10 % Gewicht. Erholung ist Teil des Fortschritts.' : '',
      tpl.light || plain ? '' : goal.sessionNote != null ? goal.sessionNote : goal.reps === 'strength' ? 'Kraftaufbau: Grundübungen schwer, lange Pausen, saubere Technik.' : '',
      mi && mi.toMatch != null && mi.toMatch >= 2 && !matchDay ? `Nächstes Spiel in ${mi.toMatch} Tagen.` : '',
      ...actNotes,
      ...fb.notes,
      ...(plain ? [] : ca.notes),
    ].filter(Boolean).join(' '),
    blocks,
  };
  addRegionWork(data, session, equip, { full: !tpl.light });
  fitDuration(session, data.profile.duration, equip, !!tpl.condMain, goal.reps !== 'strength' && !tpl.light);
  const iso = strength.filter((it) => ISOLATION.includes(EX[it.exId].slot) && !it.ss).length;
  if (iso >= 3) session.note = [session.note, `Tipp: Isolationsübungen paarweise als Supersatz (z. B. ${tpl.focus === 'lower' ? 'Beinbeuger + Waden' : 'Bizeps + Trizeps'}) – spart Zeit ohne Nachteil für den Muskelaufbau.`].filter(Boolean).join(' ');
  return session;
}

// Gegenspieler-Supersätze (nur Oberkörper, nie Beine/Sprünge): Drücken + Ziehen im Wechsel erhält die
// Trainingslast bei deutlich kürzerer Dauer (Robbins 2010; Zhang et al. 2025)
const SS_PAIRS = [['hpush', 'hpull'], ['vpush', 'vpull'], ['biceps', 'triceps']];
function makeSupersets(session, over) {
  const sb = session.blocks.find((b) => b.type === 'strength');
  if (!sb) return 0;
  let n = 0;
  for (const [a, b] of SS_PAIRS) {
    if (!over()) break;
    const A = sb.items.find((i) => !i.ss && EX[i.exId]?.slot === a);
    const B = sb.items.find((i) => !i.ss && EX[i.exId]?.slot === b);
    if (!A || !B) continue;
    const L = 'ABC'[n++];
    A.ss = `${L}1`; B.ss = `${L}2`;
    A.rest = B.rest = ISOLATION.includes(a) && ISOLATION.includes(b) ? 60 : 90; // Grundübungen 90 s, Isolation 60 s
    sb.items.splice(sb.items.indexOf(B), 1);
    sb.items.splice(sb.items.indexOf(A) + 1, 0, B);
  }
  return n;
}

// Kürzt nach Priorität, bis die Einheit in die gewünschte Zeit passt. Bei Hypertrophie-Zielen zuerst
// Supersätze statt Übungen zu streichen.
function fitDuration(session, minutes, equip, keepCond = false, superset = false) {
  const strength = session.blocks.find((b) => b.type === 'strength');
  const power = session.blocks.find((b) => b.type === 'power');
  const items = () => [...(strength ? strength.items : []), ...(power ? power.items : [])].reverse();
  const drop = (it) => {
    for (const b of [strength, power]) if (b && b.items.includes(it)) b.items.splice(b.items.indexOf(it), 1);
    // Fällt eine Supersatz-Übung weg, wird der Partner wieder ein normaler Satz mit normaler Pause
    const p = it.ss && strength && strength.items.find((x) => x.ss && x.ss[0] === it.ss[0]);
    if (p) { delete p.ss; p.rest = defaultRest(EX[p.exId], p.main); }
  };
  const over = () => estimateMinutes(session) > minutes;
  const cond = session.blocks.find((b) => b.type === 'conditioning');
  // 1. Lange Intervalle -> kurze Intervalle
  if (cond && !keepCond && over() && condKind(cond.items[0].exId) !== 'short') {
    const c = COND.short.map((id) => EX[id]).find((e) => available(e, equip));
    if (c) cond.items = [makeItem({ sessions: [], bodyweight: [], profile: {} }, c, 0)];
  }
  if (superset && over() && makeSupersets(session, over)) {
    session.note = [session.note, 'Zeit knapp: Drücken und Ziehen als Supersätze (z. B. A1 → A2 im Wechsel, kurze Pause dazwischen) – spart Zeit ohne Nachteil für den Muskelaufbau.'].filter(Boolean).join(' ');
  }
  let guard = 60;
  while (over() && guard-- > 0) {
    const p3 = items().find((it) => it.prio === 3);
    if (p3) { drop(p3); continue; }
    const big2 = items().find((it) => it.prio === 2 && it.sets.length > 2);
    if (big2) { big2.sets.pop(); continue; }
    const c = session.blocks.find((b) => b.type === 'conditioning');
    if (c && minutes < 60 && !keepCond) { session.blocks.splice(session.blocks.indexOf(c), 1); continue; }
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
  const seen = new Set(); // jede Übung (und Variante) nur einmal pro Einheit
  for (const b of plan.blocks || []) {
    if (templateId === 'RUN' && !['warmup', 'run', 'cooldown'].includes(b.type)) continue;
    const items = [];
    for (const it of b.items || []) {
      const ex = EX[it.exId];
      if (!ex || !available(ex, equip)) continue;
      const fk = ['strength', 'power'].includes(ex.cat) ? familyOf(ex.id) : ex.id;
      if (seen.has(fk)) continue;
      seen.add(fk);
      const lo = Number(it.repsLow) > 0 ? Math.round(it.repsLow) : undefined;
      const hi = Number(it.repsHigh) >= (lo || 1) ? Math.round(it.repsHigh) : undefined;
      const sets = Math.min(8, Math.max(1, Math.round(Number(it.sets) || 3)));
      const item = makeItem(data, ex, ex.cat === 'strength' || ex.cat === 'power' ? sets : 0, {
        lo, hi, main: !!it.main, deload, note: it.note, rest: Number(it.restSec) > 0 ? Math.round(it.restSec) : undefined,
      });
      if (it.prescription) item.presc = it.prescription;
      if (/^[A-C][12]$/.test(it.superset || '') && ex.cat === 'strength') item.ss = it.superset;
      if (/^[1-5]-[0-3]-([1-4]|X)$/.test(it.tempo || '') && item.tempo) item.tempo = it.tempo;
      items.push(item);
    }
    if (items.length) blocks.push({ type: b.type, title: b.title || '', items });
  }
  fixSupersets(blocks);
  return {
    id: uid(), date: todayISO(), template: templateId, title: plan.title || TEMPLATES[templateId].name,
    week, deload, source: 'claude', equipment: [...equip], status: 'active', startedAt: Date.now(),
    note: plan.note || '', blocks,
  };
}

// Supersätze aufräumen: nur vollständige Paare aus zwei verschiedenen Übungen, jede Übung in höchstens
// einem Paar, Partner direkt hintereinander
export function fixSupersets(blocks) {
  for (const b of blocks) {
    const groups = {};
    b.items.forEach((it) => { if (it.ss) (groups[it.ss[0]] = groups[it.ss[0]] || []).push(it); });
    Object.values(groups).forEach((g) => {
      const a = g.find((x) => x.ss.endsWith('1')); const c = g.find((x) => x.ss.endsWith('2'));
      g.forEach((x) => { if (x !== a && x !== c) delete x.ss; });
      if (!a || !c || a.exId === c.exId) { g.forEach((x) => delete x.ss); return; }
      b.items.splice(b.items.indexOf(c), 1);
      b.items.splice(b.items.indexOf(a) + 1, 0, c);
    });
  }
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
    if (ex && ex.cat === 'strength' && ex.slot !== 'rehab' && (it.sets || []).some((x) => x.done && Number(x.r) > 0)) seen.set(ex.id, (seen.get(ex.id) || 0) + 1);
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
    koerpergewicht: { aktuell_7_tage_mittel: bwNow, vor_4_wochen: bwThen, ...(goalOf(data).weightGoal && data.profile.goalWeight ? { zielgewicht: data.profile.goalWeight } : {}) },
    ...(() => {
      const bc = bodyComp(data);
      if (!bc) return {};
      const r = (v) => (v == null ? null : Math.round(v * 10) / 10);
      return { koerperzusammensetzung: { letzte_messung: bc.last, muskelmasse_kg: r(bc.cur.muscle), koerperfett_pct: r(bc.cur.fat), ...(bc.old ? { vor_ca_wochen: bc.weeks, muskelmasse_kg_damals: r(bc.old.muscle), koerperfett_pct_damals: r(bc.old.fat) } : {}), einordnung_koerperfett: bc.level, app_anpassung: compAdjust(data).notes } };
    })(),
    rueckmeldungen_letzte_einheiten: data.sessions.filter((x) => (x.feedback || x.autoEffort) && daysBetween(x.date, todayISO()) < 21).slice(-6).map((x) => ({
      datum: x.date, einheit: x.title, anstrengung_aus_wdh: effortOf(x) || null,
      ...(x.feedback ? { gefallen: x.feedback.liked || null, beschwerden: (x.feedback.pain || []).map((p) => PAIN_NAME[p]), ...(x.feedback.note ? { notiz: x.feedback.note } : {}) } : {}),
    })),
    nicht_gemochte_uebungen: (data.dislikes || []).map((id) => EX[id]?.name || id),
    weitere_aktivitaeten_14_tage: recentActivities(data, 14).map((a) => ({
      datum: a.date, art: activityName(a), minuten: a.minutes, intensitaet: a.intensity,
      ...(a.km ? { km: a.km } : {}), ...(a.note ? { notiz: a.note } : {}), last_srpe: activityLoad(a),
    })),
  };
}
