// Trainingsziele: steuern Wochenplan (welche Einheiten wie oft), Wdh.-Schema, Volumen,
// Lauf-Schwerpunkte und den Auftrag an Claude.
import { todayISO, daysBetween } from './store.js';

// Läufer (Ausdauer, Marathon): statt Bizeps, Seitheben, Brust- und Trizeps-Isolation gezielt Waden (Soleus),
// seitliche Hüfte, Einbeinstand und Rumpf; reaktive Sprünge und einbeinige Kraft zuerst. Kraft- und
// Sprungtraining verbessert die Laufökonomie (Blagrove 2018; Balsalobre-Fernández 2016), Hüftabduktoren
// und Waden sind bei Läufer-Beschwerden zentral (Knie, Achillessehne) – Waden bleiben auch in Kurzeinheiten.
const RUNNER = {
  swap: {
    side_delt: { slot: 'hip_abd', sets: 2, prio: 2, prefer: ['hip_abduction_machine', 'cable_hip_abduction', 'band_lateral_walk', 'side_lying_abduction'] },
    biceps: { slot: 'calf', sets: 3, prio: 2, keep: true, prefer: ['seated_calf', 'seated_db_calf', 'bent_knee_calf', 'standing_calf', 'db_calf', 'bw_calf'] },
    calf: { slot: 'calf', sets: 3, prio: 2, keep: true, prefer: ['standing_calf', 'db_calf', 'seated_calf', 'bw_calf', 'seated_db_calf', 'bent_knee_calf'] },
    chest_iso: { slot: 'prev_lower', sets: 2, prio: 2, prefer: ['sl_balance', 'sl_landing'] },
    triceps: { slot: 'core', sets: 2, prio: 3, prefer: ['copenhagen', 'copenhagen_short', 'pallof', 'band_pallof', 'suitcase_carry', 'dead_bug'] },
    power_upper: { slot: 'power_lower', sets: 3, prio: 2, prefer: ['sl_hop', 'hurdle_hops', 'bounding', 'ankle_hops'] },
  },
  prefer: {
    power_lower: ['ankle_hops', 'sl_hop', 'bounding', 'cmj', 'box_jump', 'broad_jump'],
    lunge: ['bss_db', 'step_up', 'split_squat_db', 'reverse_lunge_bb', 'kb_reverse_lunge', 'bss_bw', 'reverse_lunge_bw'],
  },
};
// HYROX: Tragen und Griffkraft statt Brust-Isolation, seitliche Hüfte für die Lunges, Swing/Weitsprung zuerst
const HYROX_SLOTS = {
  swap: {
    chest_iso: { slot: 'core', sets: 3, prio: 2, prefer: ['farmer_walk', 'suitcase_carry', 'pallof', 'band_pallof', 'dead_bug'] },
    side_delt: { slot: 'hip_abd', sets: 2, prio: 3, prefer: ['hip_abduction_machine', 'cable_hip_abduction', 'band_lateral_walk', 'side_lying_abduction'] },
  },
  prefer: {
    power_lower: ['kb_swing', 'broad_jump', 'box_jump'],
    lunge: ['walking_lunge', 'kb_reverse_lunge', 'reverse_lunge_bb', 'bss_db', 'split_squat_db', 'reverse_lunge_bw'],
  },
};

export const GOALS = [
  {
    id: 'muscle', name: 'Muskelaufbau & Athletik',
    desc: '70 % Muskelaufbau, 30 % Athletik (Schnellkraft, Ausdauer, Mobilität).',
    reps: 'hyp', volume: 1, finisher: true, volumeFocus: true, race: false,
    runCycle: ['run_4x4', 'run_tempo', 'run_3030', 'run_sprints', 'run_fartlek'],
    rot: {
      2: ['FB_A', 'FB_B'], 3: ['FB_A', 'FB_B', 'FB_C'], 4: ['UK_A', 'OK_A', 'UK_B', 'OK_B'],
      5: ['UK_A', 'OK_A', 'ATH', 'UK_B', 'OK_B'], 6: ['UK_A', 'OK_A', 'ATH', 'UK_B', 'OK_B', 'REG'],
    },
    prompt: 'Ziel: 70 % Muskelaufbau, 30 % Athletik (Schnellkraft, Ausdauer, Mobilität).',
  },
  {
    id: 'strength', name: 'Kraftaufbau',
    desc: 'Maximalkraft in den Grundübungen steigern: schwer, wenige Wiederholungen, lange Pausen.',
    reps: 'strength', volume: 0.9, finisher: false, volumeFocus: true, race: false,
    runCycle: ['run_3030', 'run_sprints', 'run_4x4'],
    rot: {
      2: ['FB_A', 'FB_B'], 3: ['FB_A', 'FB_B', 'FB_C'], 4: ['UK_A', 'OK_A', 'UK_B', 'OK_B'],
      5: ['UK_A', 'OK_A', 'UK_B', 'OK_B', 'ATH'], 6: ['UK_A', 'OK_A', 'UK_B', 'OK_B', 'ATH', 'REG'],
    },
    prompt: 'Ziel: Maximalkraft in Kniebeuge, Kreuzheben, Bank-/Schulterdrücken und Klimmzug steigern. Grundübungen schwer (3–6 Wdh., 1–3 Wdh. Reserve, 3–4 min Pause), Ergänzungsübungen 5–8 Wdh., wenig Isolation, Schnellkraft nur kurz als Aktivierung, kein Ausdauer-Finisher.',
  },
  {
    id: 'endurance', name: 'Ausdauer aufbauen',
    desc: 'Grundlagenausdauer und VO₂max verbessern, Kraft 2× pro Woche zum Erhalt.',
    reps: 'hyp', volume: 0.65, finisher: false, volumeFocus: false, race: false,
    runCycle: ['run_4x4', 'run_long', 'run_tempo', 'run_hills', 'run_3030', 'run_fartlek'], ...RUNNER,
    rot: {
      2: ['RUN', 'FB_A'], 3: ['RUN', 'FB_A', 'RUN'], 4: ['RUN', 'FB_A', 'RUN', 'FB_B'],
      5: ['RUN', 'FB_A', 'RUN', 'FB_B', 'RUN'], 6: ['RUN', 'FB_A', 'RUN', 'FB_B', 'RUN', 'REG'],
    },
    prompt: 'Ziel: Ausdauer (Grundlagenausdauer und VO₂max) aufbauen. Polarisiert: ca. 80 % locker, 1–2 harte Einheiten pro Woche. Kraft 2× pro Woche ganzkörper zum Erhalt und zur Verletzungsprävention, moderates Volumen.',
  },
  {
    id: 'marathon', name: 'Marathon-Vorbereitung',
    desc: 'Wöchentlicher langer Lauf, Tempoläufe, sonst locker – plus kurzes Krafttraining für Läufer.',
    reps: 'hyp', volume: 0.6, finisher: false, volumeFocus: false, race: true, key: 'RUN',
    runCycle: ['run_tempo', 'run_4x4', 'run_tempo', 'run_hills', 'run_3030'], longRun: true, ...RUNNER,
    rot: {
      2: ['RUN', 'RUN'], 3: ['RUN', 'FB_A', 'RUN'], 4: ['RUN', 'FB_A', 'RUN', 'RUN'],
      5: ['RUN', 'FB_A', 'RUN', 'FB_B', 'RUN'], 6: ['RUN', 'FB_A', 'RUN', 'RUN', 'FB_B', 'RUN'],
    },
    prompt: 'Ziel: Marathon-Vorbereitung. Pro Woche ein langer Lauf, ein Tempo-/Schwellenlauf oder Intervalle, alle anderen Läufe locker (polarisiert). Kraft 2× pro Woche kurz (einbeinig, Waden, Hüfte, Rumpf, etwas Plyometrie) für Laufökonomie und Verletzungsprävention, kein Muskelversagen. In den letzten 2 Wochen vor dem Wettkampf Umfang deutlich reduzieren (Tapering), Intensität kurz halten.',
  },
  {
    id: 'hyrox', name: 'HYROX',
    desc: '8 × 1 km Laufen im Wechsel mit Stationen: Kraftausdauer und Laufen unter Vorermüdung.',
    reps: 'hyp', volume: 0.7, finisher: false, volumeFocus: false, race: true, key: 'HYX',
    runCycle: ['run_3030', 'run_4x4', 'run_tempo'], ...HYROX_SLOTS,
    rot: {
      2: ['HYX', 'FB_A'], 3: ['FB_A', 'RUN', 'HYX'], 4: ['FB_A', 'RUN', 'FB_B', 'HYX'],
      5: ['FB_A', 'RUN', 'FB_B', 'HYX', 'RUN'], 6: ['FB_A', 'RUN', 'FB_B', 'HYX', 'RUN', 'REG'],
    },
    prompt: 'Ziel: HYROX (8 × 1 km Lauf im Wechsel mit SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, Rudern, Farmers Carry, Sandbag Lunges, Wall Balls). Kraftausdauer, Laufen unter Vorermüdung (Compromised Running), Ganzkörperkraft 2× pro Woche, Schnellkraft erhalten. Vor dem Wettkampf 1–2 Wochen Umfang reduzieren.',
  },
  {
    id: 'sport', name: 'Sportartspezifisch',
    desc: 'Athletik für deine Sportart: Schnelligkeit, Sprungkraft, Richtungswechsel, Kraft und Verletzungsprävention – abgestimmt auf Saisonphase und Spieltag.',
    reps: 'strength', volume: 0.6, finisher: false, volumeFocus: false, race: false,
    runCycle: ['run_sprints', 'run_3030', 'run_4x4', 'run_fartlek'],
    rot: { 2: ['SP_L', 'SP_U'], 3: ['SP_L', 'SP_U', 'REG'], 4: ['SP_L', 'SP_U', 'SP_C', 'REG'] },
    prompt: '',
  },
  {
    id: 'fitness', name: 'Allgemeine Fitness',
    desc: 'Ausgewogen: Kraft, Ausdauer und Beweglichkeit mit moderatem Volumen.',
    reps: 'hyp', volume: 0.9, finisher: true, volumeFocus: true, race: false, minSets: 6,
    runCycle: ['run_easy', 'run_fartlek', 'run_easy', 'run_4x4'],
    rot: {
      2: ['FB_A', 'FB_B'], 3: ['FB_A', 'FB_B', 'FB_C'], 4: ['FB_A', 'RUN', 'FB_B', 'FB_C'],
      5: ['UK_A', 'OK_A', 'RUN', 'UK_B', 'OK_B'], 6: ['UK_A', 'OK_A', 'RUN', 'UK_B', 'OK_B', 'ATH'],
    },
    prompt: 'Ziel: Allgemeine Fitness und Gesundheit – ausgewogen Kraft, Ausdauer und Beweglichkeit, moderates Volumen, Regelmäßigkeit vor Höchstleistung.',
  },
  {
    id: 'lose', name: 'Abnehmen',
    desc: 'Fett verlieren, Muskeln behalten: Krafttraining bleibt, dazu Ausdauer und viel Alltagsbewegung.',
    reps: 'hyp', volume: 0.85, finisher: true, volumeFocus: true, race: false, minSets: 6, weightGoal: true,
    runCycle: ['run_easy', 'run_4x4', 'run_easy', 'run_3030'],
    rot: {
      2: ['FB_A', 'FB_B'], 3: ['FB_A', 'RUN', 'FB_B'], 4: ['FB_A', 'RUN', 'FB_B', 'FB_C'],
      5: ['FB_A', 'RUN', 'FB_B', 'RUN', 'FB_C'], 6: ['FB_A', 'RUN', 'FB_B', 'RUN', 'FB_C', 'REG'],
    },
    prompt: 'Ziel: Abnehmen (Fettabbau) bei Erhalt der Muskulatur. Krafttraining bleibt der wichtigste Reiz (Ganzkörper, 6–15 Wdh., 1–3 Wdh. Reserve, Gewichte möglichst halten), dazu Ausdauer überwiegend locker (Zone 2) und ca. 1× pro Woche Intervalle; Finisher erlaubt. Empfiehl viel Alltagsbewegung (Schritte) und ausreichend Protein (ca. 1,6–2,2 g pro kg Körpergewicht). Angestrebt sind ca. 0,5–1 % Körpergewicht pro Woche; deutlich schneller → auf Leistungsabfall und Erholung achten.',
  },
];

// ---------- Sportartspezifisch ----------
// prefer: Übungsreihenfolge je Slot in den Sport-Vorlagen; always: gilt in allen Vorlagen (Prävention);
// prio/sets: Gewichtung der Slots in den Sport-Vorlagen.
export const SPORTS = [
  {
    id: 'football', name: 'Fußball',
    // Laufeinheiten je Saisonphase: spielnahe kurze Intervalle statt polarisiertem Ausdauertraining
    runs: { vorbereitung: ['run_4x4', 'run_1515', 'run_rsa', 'run_4x4', 'run_sprints'], saison: ['run_1515', 'run_rsa', 'run_sprints'], pause: ['run_4x4', 'run_fartlek', 'run_tempo'] },
    desc: 'Antritt, wiederholte Sprints, Richtungswechsel, Sprung- und Schusskraft. Prävention für Beinbeuger (Nordic Curls) und Leiste (Copenhagen).',
    prefer: {
      power_lower: ['broad_jump', 'lateral_bound', 'cmj', 'box_jump', 'sl_hop'], cod: ['cod_505', 'cod_45', 'lateral_shuffle', 'reactive_agility'],
      core: ['copenhagen', 'copenhagen_short', 'pallof', 'band_pallof', 'dead_bug'], prev_lower: ['sl_landing', 'sl_balance'],
      power_upper: ['mb_rot_throw', 'mb_chest_pass', 'band_punch'],
    },
    always: { knee_flexion: ['nordic_curl'] },
    prio: { core: 1, prev_lower: 1 },
    prompt: 'Sportart: Fußball. Schwerpunkte: Beschleunigung und Sprint, wiederholte Sprints (RSA), Richtungswechsel, Sprung- und Schusskraft (Hüfte, Gesäß, Quadrizeps), Rumpf. Prävention: Nordic Hamstring Curls (Beinbeuger), Copenhagen Plank (Adduktoren/Leiste), Landetechnik und Gleichgewicht (wie FIFA 11+).',
  },
  {
    id: 'handball', name: 'Handball',
    // Laufeinheiten je Saisonphase: spielnahe kurze Intervalle statt polarisiertem Ausdauertraining
    runs: { vorbereitung: ['run_1515', 'run_rsa', 'run_4x4', 'run_shuttle'], saison: ['run_1515', 'run_rsa', 'run_shuttle'], pause: ['run_4x4', 'run_fartlek', 'run_1515'] },
    desc: 'Wurfkraft, Sprungkraft, Richtungswechsel und Zweikampf. Prävention für Schulter (Außenrotation) und Knie (Landetechnik).',
    prefer: {
      power_upper: ['mb_overhead_throw', 'mb_rot_throw', 'mb_chest_pass', 'plyo_pushup'], power_lower: ['cmj', 'lateral_bound', 'box_jump', 'broad_jump'],
      cod: ['lateral_shuffle', 'cod_505', 'cod_45', 'reactive_agility'], prev_shoulder: ['ext_rotation_cable', 'ext_rotation_band', 'ext_rotation_db', 'band_ir', 'full_can', 'prone_er'],
    },
    always: { knee_flexion: ['nordic_curl'] },
    prio: { prev_shoulder: 1, prev_lower: 1 }, sets: { prev_shoulder: 3 },
    prompt: 'Sportart: Handball. Schwerpunkte: Wurfkraft (Überkopf- und Rotationswürfe, Brust, Rücken, Schulter), Sprungkraft, Richtungswechsel, Zweikampfkraft (Ganzkörper, Rumpf). Prävention: Schulter-Außenrotation und Schulterblattkontrolle, Landetechnik und Kniekontrolle, Beinbeuger.',
  },
  {
    id: 'basketball', name: 'Basketball',
    // Laufeinheiten je Saisonphase: spielnahe kurze Intervalle statt polarisiertem Ausdauertraining
    runs: { vorbereitung: ['run_1515', 'run_shuttle', 'run_rsa', 'run_4x4'], saison: ['run_rsa', 'run_1515', 'run_shuttle'], pause: ['run_4x4', 'run_fartlek', 'run_1515'] },
    desc: 'Vertikale Sprungkraft, Antritt, seitliche Schnelligkeit. Prävention für Knie (Landetechnik) und Sprunggelenk.',
    prefer: {
      power_lower: ['approach_jump', 'depth_jump', 'cmj', 'box_jump', 'hurdle_hops'], cod: ['lateral_shuffle', 'cod_505', 'reactive_agility', 'cod_45'],
      prev_lower: ['sl_landing', 'sl_balance'], calf: ['standing_calf', 'db_calf', 'bw_calf'],
    },
    prio: { prev_lower: 1, calf: 2 },
    prompt: 'Sportart: Basketball. Schwerpunkte: vertikale Sprungkraft (mit Anlauf und reaktiv), Antritt, seitliche Schnelligkeit und Richtungswechsel, Rumpf. Prävention: Landetechnik (Knie über dem Fuß, Kreuzband), Sprunggelenk (Gleichgewicht, Waden), Patellasehne (Sprungvolumen dosieren).',
  },
  {
    id: 'volleyball', name: 'Volleyball',
    // Laufeinheiten je Saisonphase: spielnahe kurze Intervalle statt polarisiertem Ausdauertraining
    runs: { vorbereitung: ['run_sprints', 'run_rsa', 'run_1515'], saison: ['run_sprints', 'run_rsa'], pause: ['run_fartlek', 'run_1515', 'run_4x4'] },
    desc: 'Sprungkraft mit Anlauf, Schlagarm und Rumpf. Prävention für Schulter, Knie und Sprunggelenk.',
    prefer: {
      power_lower: ['approach_jump', 'cmj', 'depth_jump', 'box_jump', 'hurdle_hops'], power_upper: ['mb_overhead_throw', 'mb_slam', 'mb_rot_throw'],
      cod: ['lateral_shuffle', 'cod_505', 'reactive_agility'], prev_shoulder: ['ext_rotation_cable', 'ext_rotation_band', 'ext_rotation_db', 'full_can', 'band_ir', 'prone_er'], prev_lower: ['sl_landing', 'sl_balance'],
    },
    prio: { prev_shoulder: 1, prev_lower: 1 },
    prompt: 'Sportart: Volleyball. Schwerpunkte: vertikale Sprungkraft (Anlauf- und Blocksprung), Schlagarm (Überkopfwurf, Rotation), Rumpf, kurze seitliche Antritte. Prävention: Schulter-Außenrotation, Landetechnik, Sprunggelenk, Patellasehne (Sprungvolumen dosieren).',
  },
  {
    id: 'racket', name: 'Tennis / Padel',
    // Laufeinheiten je Saisonphase: spielnahe kurze Intervalle statt polarisiertem Ausdauertraining
    runs: { vorbereitung: ['run_shuttle', 'run_1515', 'run_4x4', 'run_rsa'], saison: ['run_shuttle', 'run_1515', 'run_sprints'], pause: ['run_4x4', 'run_fartlek', 'run_shuttle'] },
    desc: 'Rotationskraft, seitliche Schnelligkeit, einbeinige Beinkraft. Prävention für Schulter und Sprunggelenk.',
    prefer: {
      power_upper: ['mb_rot_throw', 'mb_overhead_throw', 'band_rotation_explosive', 'band_punch'], power_lower: ['lateral_bound', 'sl_lateral_hop', 'cmj', 'ankle_hops'],
      cod: ['lateral_shuffle', 'cod_505', 'reactive_agility', 'cod_45'], prev_shoulder: ['ext_rotation_cable', 'ext_rotation_band', 'ext_rotation_db', 'full_can', 'prone_er'],
      core: ['pallof', 'cable_woodchop', 'band_pallof', 'band_woodchop', 'copenhagen', 'dead_bug'],
    },
    prio: { prev_shoulder: 1 },
    prompt: 'Sportart: Tennis/Padel. Schwerpunkte: Rotationskraft (Medizinball-Rotationswürfe, Anti-Rotation), seitliche Schnelligkeit und Richtungswechsel, einbeinige Beinkraft, Griffkraft. Prävention: Schulter-Außenrotation, Ellbogen (Unterarm kräftigen), Sprunggelenk.',
  },
];
export const SPORT = Object.fromEntries(SPORTS.map((x) => [x.id, x]));

// Saisonphase bestimmt Volumen, Wdh.-Schema und Wochenplan
export const SEASONS = [
  {
    id: 'vorbereitung', name: 'Vorbereitung',
    desc: 'Kraft und Schnellkraft aufbauen: Grundübungen schwer, Sprünge, Sprints und Spielausdauer.',
    params: { reps: 'strength', volume: 0.8, finisher: false, volumeFocus: false, maxSets: 18, key: 'SP_L' },
    rot: {
      2: ['SP_L', 'SP_U'], 3: ['SP_L', 'SP_U', 'SP_C'], 4: ['SP_L', 'SP_U', 'SP_C', 'SP_U'],
      5: ['SP_L', 'SP_U', 'SP_C', 'SP_L', 'SP_U'], 6: ['SP_L', 'SP_U', 'SP_C', 'SP_L', 'SP_U', 'REG'],
    },
    note: 'Vorbereitung: Grundübungen schwer (3–6 Wdh.), Sprünge, Sprints und Richtungswechsel mit voller Qualität und vollen Pausen.',
    prompt: 'Saisonphase: Vorbereitung. Kraft- und Schnellkraftaufbau: Grundübungen schwer (3–6 Wdh., 2 Wdh. Reserve), Sprünge, Sprints und Richtungswechsel mit voller Qualität und vollen Pausen, Spielausdauer über wiederholte Sprints bzw. 4×4-Intervalle. Teamtraining kommt dazu – Gesamtlast im Blick behalten.',
  },
  {
    id: 'saison', name: 'Saison',
    desc: 'Kraft und Spritzigkeit erhalten: wenig Volumen, hohe Qualität, Rücksicht auf Spieltag und Teamtraining.',
    params: { reps: 'strength', volume: 0.6, finisher: false, volumeFocus: false, maxSets: 16, key: 'SP_L' },
    rot: {
      2: ['SP_L', 'SP_U'], 3: ['SP_L', 'SP_U', 'REG'], 4: ['SP_L', 'SP_U', 'SP_C', 'REG'],
      5: ['SP_L', 'SP_U', 'SP_C', 'REG', 'REG'], 6: ['SP_L', 'SP_U', 'SP_C', 'SP_U', 'REG', 'REG'],
    },
    note: 'Saison: wenig Sätze, schwer und schnell, aber nie bis zum Muskelversagen – Kraft und Spritzigkeit erhalten, ohne dich fürs Spiel zu ermüden.',
    prompt: 'Saisonphase: Saison. Erhalt von Kraft und Schnelligkeit mit wenig Volumen (2–3 Sätze pro Übung, 3 Wdh. Reserve, kein Muskelversagen), hohe Intensität, kurze Einheiten. Der Spieltag hat Vorrang: MD-1 nur Aktivierung, MD-2 keine schweren Beine, MD und MD+1 Regeneration. Kein zusätzlicher Ausdauer-Finisher – das Teamtraining deckt die Ausdauer ab.',
  },
  {
    id: 'pause', name: 'Saisonpause',
    desc: 'Muskelaufbau und Grundlagen: mehr Volumen, Schwächen angehen, Prävention weiterführen.',
    params: { reps: 'hyp', volume: 1, finisher: true, volumeFocus: true },
    rot: {
      2: ['FB_A', 'FB_B'], 3: ['FB_A', 'FB_B', 'FB_C'], 4: ['UK_A', 'OK_A', 'UK_B', 'OK_B'],
      5: ['UK_A', 'OK_A', 'SP_C', 'UK_B', 'OK_B'], 6: ['UK_A', 'OK_A', 'SP_C', 'UK_B', 'OK_B', 'REG'],
    },
    note: '',
    prompt: 'Saisonphase: Saisonpause (Off-Season). Muskelaufbau und allgemeine Kraft mit höherem Volumen (6–12 Wdh.), Schwächen und Dysbalancen angehen, Grundlagenausdauer, Verletzungsprävention weiterführen.',
  },
];
export const SEASON = Object.fromEntries(SEASONS.map((x) => [x.id, x]));
export const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function sportGoal(base, p) {
  const sp = SPORT[p.sport] || SPORTS[0];
  const se = SEASON[p.season] || SEASON.saison;
  const md = matchWeekday(p);
  return {
    ...base, ...se.params,
    name: `${sp.name} · ${se.name}`,
    sport: sp.id, season: se.id, sportProfile: sp, rot: se.rot, sessionNote: se.note,
    runCycle: (sp.runs && sp.runs[se.id]) || base.runCycle, hardRuns: se.id === 'saison' ? 1 : 2,
    prompt: `Ziel: Sportartspezifisches Athletiktraining (Sprint, Sprung, Richtungswechsel, Kraft, Verletzungsprävention). ${sp.prompt} ${se.prompt}${md !== null && se.id !== 'pause' ? ` Fester Spieltag: ${WEEKDAYS[md]}.` : ''} Teamtrainings und Spiele trägt der Athlet als nachgetragene Trainings ein – sie gehören zur Gesamtlast.`,
  };
}

const matchWeekday = (p) => (p.matchDay === '' || p.matchDay == null || isNaN(Number(p.matchDay)) ? null : Number(p.matchDay));

// Spieltag-Abstand (nur Sportart-Ziel, nicht in der Saisonpause): fester Wochentag und/oder
// nachgetragene Spiele. toMatch = Tage bis zum nächsten Spiel, sinceMatch = Tage seit dem letzten.
export function matchInfo(data, date = todayISO()) {
  const p = data.profile;
  if (p.goal !== 'sport' || p.season === 'pause') return null;
  const md = matchWeekday(p);
  let toMatch = null; let sinceMatch = null;
  if (md !== null) {
    const wd = new Date(date + 'T12:00:00').getDay();
    toMatch = (md - wd + 7) % 7;
    sinceMatch = (wd - md + 7) % 7;
  }
  const played = (data.activities || []).filter((a) => a.type === 'match').map((a) => daysBetween(a.date, date)).filter((d) => d >= 0 && d < 7);
  if (played.length) sinceMatch = Math.min(sinceMatch ?? 99, ...played);
  if (toMatch === null && sinceMatch === null) return null;
  return { toMatch, sinceMatch, weekday: md };
}

// Abnehm-Ziel: Gewichtsverlauf, Tempo pro Woche, Abstand zum Zielgewicht
export function weightStatus(data, series) {
  const goalW = parseFloat(String(data.profile.goalWeight || '').replace(',', '.'));
  if (!series.length) return { goalW: goalW > 0 ? goalW : null };
  const now = series[series.length - 1];
  const ref = series.filter((p) => daysBetween(p.date, now.date) >= 21).pop() || series[0];
  const weeks = Math.max(1, daysBetween(ref.date, now.date) / 7);
  const perWeek = daysBetween(ref.date, now.date) >= 7 ? (now.avg - ref.avg) / weeks : null;
  return {
    goalW: goalW > 0 ? goalW : null,
    current: now.avg,
    toGo: goalW > 0 ? Math.round((now.avg - goalW) * 10) / 10 : null,
    perWeek: perWeek == null ? null : Math.round(perWeek * 100) / 100,
    pctWeek: perWeek == null ? null : Math.round((perWeek / now.avg) * 1000) / 10,
  };
}

export const GOAL = Object.fromEntries(GOALS.map((g) => [g.id, g]));

// Trainingsniveau: steuert die Start-Richtwerte (Faktor auf die Referenz-1RM eines fortgeschrittenen
// Trainierenden) und wird Claude mitgeteilt
// Kraftniveau (nicht Trainingsjahre): Faktor auf die Referenz-1RM eines Fortgeschrittenen
// (Kniebeuge ≈ 1,5 × Körpergewicht bei Männern, Frauen ca. 30 % weniger)
export const LEVELS = [
  { id: 'einsteiger', name: 'Einsteiger', factor: 0.6 },
  { id: 'leicht', name: 'Grundlagen', factor: 0.8 },
  { id: 'fortgeschritten', name: 'Fortgeschritten', factor: 1 },
  { id: 'erfahren', name: 'Stark', factor: 1.13 },
  { id: 'leistungssport', name: 'Sehr stark', factor: 1.27 },
  { id: 'elite', name: 'Elite', factor: 1.4 },
];
export const LEVEL = Object.fromEntries(LEVELS.map((l) => [l.id, l]));

// Orientierung: bestes Kniebeugen-Gewicht für 1 Wdh. im Verhältnis zum Körpergewicht (KG)
export function levelHint(level, sex) {
  const i = LEVELS.indexOf(level);
  const r = Math.round(1.5 * level.factor * (sex === 'weiblich' ? 0.7 : 1) * 10) / 10;
  return `Kniebeuge ${i === 0 ? '≤' : i === LEVELS.length - 1 ? '≥' : 'ca.'} ${String(r).replace('.', ',')}× KG`;
}

// Niveau aus dem Profil – frühere Freitext-Angaben werden der passenden Stufe zugeordnet
export function levelOf(profile) {
  const v = String((profile && profile.level) || '').trim().toLowerCase();
  if (LEVEL[v]) return LEVEL[v];
  if (/elite|profi|kader|national/.test(v)) return LEVEL.elite;
  if (/leistung|wettkampf|athlet|sehr stark/.test(v)) return LEVEL.leistungssport;
  if (/erfahren|stark/.test(v)) return LEVEL.erfahren;
  if (/leicht|mittel|grundlage/.test(v)) return LEVEL.leicht;
  if (/anf|einsteig|neu|beginn/.test(v)) return LEVEL.einsteiger;
  return LEVEL.fortgeschritten;
}

export function goalOf(data) {
  const g = GOAL[data.profile.goal] || GOAL.muscle;
  return g.id === 'sport' ? sportGoal(g, data.profile) : g;
}

export function rotationFor(data) {
  const g = goalOf(data);
  return g.rot[data.profile.days] || g.rot[4];
}

// Tage bis zum Wettkampf (nur bei Zielen mit Wettkampf und gesetztem Datum)
export function daysToRace(data, date = todayISO()) {
  const g = goalOf(data);
  if (!g.race || !data.profile.goalDate) return null;
  const d = daysBetween(date, data.profile.goalDate);
  return d >= 0 ? d : null;
}
