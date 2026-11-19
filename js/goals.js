// Trainingsziele: steuern Wochenplan (welche Einheiten wie oft), Wdh.-Schema, Volumen,
// Lauf-Schwerpunkte und den Auftrag an Claude.
import { todayISO, daysBetween } from './store.js';

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
    runCycle: ['run_4x4', 'run_long', 'run_tempo', 'run_3030', 'run_fartlek'],
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
    runCycle: ['run_tempo', 'run_4x4', 'run_tempo', 'run_3030'], longRun: true,
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
    runCycle: ['run_3030', 'run_4x4', 'run_tempo'],
    rot: {
      2: ['HYX', 'FB_A'], 3: ['FB_A', 'RUN', 'HYX'], 4: ['FB_A', 'RUN', 'FB_B', 'HYX'],
      5: ['FB_A', 'RUN', 'FB_B', 'HYX', 'RUN'], 6: ['FB_A', 'RUN', 'FB_B', 'HYX', 'RUN', 'REG'],
    },
    prompt: 'Ziel: HYROX (8 × 1 km Lauf im Wechsel mit SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, Rudern, Farmers Carry, Sandbag Lunges, Wall Balls). Kraftausdauer, Laufen unter Vorermüdung (Compromised Running), Ganzkörperkraft 2× pro Woche, Schnellkraft erhalten. Vor dem Wettkampf 1–2 Wochen Umfang reduzieren.',
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
];

export const GOAL = Object.fromEntries(GOALS.map((g) => [g.id, g]));

export function goalOf(data) {
  return GOAL[data.profile.goal] || GOAL.muscle;
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
