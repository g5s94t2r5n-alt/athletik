// Lokale Datenhaltung (bleibt auf dem iPhone). Backup über Export/Import.
const KEY = 'athletik.v1';

export function todayISO(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function defaults() {
  return {
    version: 1,
    profile: { age: 30, weight: 80, sex: '', level: 'fortgeschritten', days: 4, duration: 75, notes: '', setup: false, goal: 'muscle', goalDate: '', goalWeight: '', sport: 'football', season: 'saison', matchDay: '', hrMethod: 'age', hrMax: '', hrRest: '', hrLthr: '' },
    settings: { apiKey: '', useClaude: true, accent: 'lavender' },
    location: 'gym',
    travelEquip: ['dumbbell', 'cardio'],
    dislikes: [],
    homeGym: null,
    homeGymNotes: '',
    equipment: ['barbell', 'dumbbell', 'kettlebell', 'bench', 'cable', 'machine', 'pullup', 'dip', 'band', 'medball', 'box', 'cardio'],
    sessions: [],
    activities: [],
    bodyweight: [],
    block: { start: todayISO() },
    coach: null,
    slotMemory: {},
    videos: {},
    active: null,
  };
}

let memoryFallback = null;

export function load() {
  let data = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) {
    data = memoryFallback;
  }
  const d = defaults();
  if (!data) return d;
  return {
    ...d,
    ...data,
    profile: { ...d.profile, ...(data.profile || {}) },
    settings: { ...d.settings, ...(data.settings || {}) },
    block: { ...d.block, ...(data.block || {}) },
  };
}

export function save(data) {
  memoryFallback = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export function exportJSON(data) {
  const copy = { ...data, settings: { ...data.settings, apiKey: '' } };
  const blob = new Blob([JSON.stringify(copy, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `athletik-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export async function importJSON(file, current) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.sessions)) throw new Error('Keine gültige Backup-Datei');
  parsed.settings = { ...(parsed.settings || {}), apiKey: current.settings.apiKey };
  return parsed;
}

export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
  } catch (e) { /* optional */ }
}
