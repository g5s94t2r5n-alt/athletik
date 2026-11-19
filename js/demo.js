// Demo-Daten für Design-Vorschau (?demo=1). Wird nie gespeichert.
import { buildSession, rememberSlots } from './engine.js';
import { load, todayISO } from './store.js';

export function demoData(view) {
  const d = load();
  Object.assign(d, { active: null, sessions: [], bodyweight: [], activities: [], slotMemory: {}, coach: null, videos: {} });
  d.settings = { apiKey: 'demo', useClaude: true };
  d.profile = { ...d.profile, days: 4, duration: 75, setup: true };
  d.equipment = ['barbell', 'dumbbell', 'kettlebell', 'bench', 'cable', 'machine', 'pullup', 'dip', 'band', 'medball', 'box', 'cardio'];
  const start = new Date(); start.setDate(start.getDate() - 42);
  d.block.start = todayISO(start);
  const base = { back_squat: 120, rdl: 110, deadlift: 160, bench_press: 95, incline_db: 32, cable_row: 70, cs_db_row: 34, db_shoulder_press: 28, cable_fly: 15, lateral_raise: 12, cable_lateral: 8, pushdown: 30, oh_cable_ext: 25, incline_curl: 14, hammer_curl: 18, leg_extension: 60, seated_leg_curl: 55, lying_leg_curl: 45, standing_calf: 80, seated_calf: 50, bss_db: 26, face_pull: 25, lat_pulldown: 75, kb_swing: 24, hanging_leg_raise: 0, cable_crunch: 40, pallof: 15 };
  let seed = 5; const R = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const rot = ['UK_A', 'OK_A', 'UK_B', 'OK_B']; let k = 0;
  for (let day = 0; day < 42; day++) {
    const date = new Date(start); date.setDate(start.getDate() + day); const iso = todayISO(date);
    d.bodyweight.push({ date: iso, kg: +(80 + day * 0.025 + (R() - 0.5) * 0.7).toFixed(1) });
    if (![0, 1, 3, 4].includes(day % 7)) continue;
    const s = buildSession(d, { templateId: rot[k++ % 4], equip: d.equipment });
    s.date = iso;
    for (const b of s.blocks) for (const it of b.items) {
      if (!it.sets.length) { it.done = true; continue; }
      const strong = R() < 0.55;
      for (const set of it.sets) {
        let w = set.tw; if (w == null || w === '') w = base[it.exId] ?? 0;
        set.w = String(w); set.r = String(strong ? it.hi : Math.max(it.lo, it.hi - 2)); set.done = true;
      }
    }
    s.status = 'done'; s.finishedAt = date.getTime(); d.sessions.push(s); rememberSlots(d, s);
  }
  const ago = (n) => todayISO(new Date(Date.now() - n * 86400000));
  d.activities = [
    { id: 'a1', type: 'yoga', date: ago(4), minutes: 30, intensity: 'leicht', note: '' },
    { id: 'a2', type: 'jogging', date: ago(2), minutes: 40, intensity: 'mittel', km: 7.2, note: 'Locker am Fluss' },
  ];
  d.coach = {
    date: ago(3), summary: 'Starke Woche: Kniebeuge und Bankdrücken steigen weiter, das Volumen passt.',
    focus: 'Waden und Rumpf etwas mehr, Sprünge mit voller Qualität.', tips: ['7–9 h Schlaf vor Unterkörpertagen.'],
    volumeAdjust: [{ muscle: 'waden', delta: 2, reason: 'Unter 10 Sätzen pro Woche.' }], avoid: [], deloadUntil: null,
  };
  if (view === 'session') {
    const s = buildSession(d, { templateId: 'OK_A', equip: d.equipment });
    s.estMin = 72;
    const items = s.blocks.flatMap((b) => b.items);
    items.filter((i) => !i.sets.length).slice(0, 4).forEach((i) => { i.done = true; });
    const strength = s.blocks.find((b) => b.type === 'strength');
    const power = s.blocks.find((b) => b.type === 'power');
    if (power) power.items[0].sets.forEach((st) => { st.r = '5'; st.done = true; });
    if (strength) {
      const first = strength.items[0];
      first.sets.forEach((st, i) => { if (i < 2) { st.w = st.w || '97.5'; st.r = String(first.hi - i); st.done = true; } });
    }
    d.active = s;
  }
  return d;
}
