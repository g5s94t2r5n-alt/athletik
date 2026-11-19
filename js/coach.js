// Claude als Coach: erstellt Einheiten und macht den Wochen-Check.
// Der API-Key bleibt lokal auf dem Gerät und geht nur an api.anthropic.com.
import { EXERCISES, MUSCLES, available } from './exercises.js';
import { TEMPLATES, blockInfo, aiContext, estimateMinutes, activityAdjust, activitySummary } from './engine.js';
import { todayISO } from './store.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.4.0/+esm';
export const MODEL = 'claude-opus-5-5';

export class CoachError extends Error {}

const SYSTEM = `Du bist ein evidenzbasierter Kraft- und Athletiktrainer. Du planst Trainingseinheiten für genau einen Athleten.
Ziel: 70 % Muskelaufbau, 30 % Athletik (Schnellkraft, Ausdauer, Mobilität).

Regeln (aus der Sportwissenschaft, nicht verhandelbar):
- Volumen: 10–20 harte Sätze pro Muskelgruppe und Woche, jede Muskelgruppe ca. 2×/Woche.
- Arbeitssätze enden 1–3 Wdh. vor Muskelversagen. Grundübungen 5–10 Wdh., Isolation 8–15 (bis 20).
- Pausen: Grundübungen 150–180 s, Isolation 60–90 s, Schnellkraft 90–120 s.
- Bevorzuge Übungen mit Belastung in gedehnter Position (z. B. RDL, Schrägbank, Overhead-Trizeps, Beinbeuger sitzend).
- Reihenfolge der Blöcke: warmup (dynamisch, 3–5 Übungen) → power (explosiv, 3–5 Wdh., ermüdungsfrei, 2–4 Sätze) → strength (1–2 Grundübungen zuerst, dann Ergänzung/Isolation) → conditioning (Intervalle oder locker, nie vor dem Krafttraining) → cooldown (statisches Dehnen, 3–6 Übungen).
- Ausdauer stört Explosivkraft in derselben Einheit am stärksten → kurz halten oder weglassen, wenn Schnellkraft im Fokus steht.
- Deload-Woche: Sätze ca. halbieren, keine Übungen bis ans Limit, Ausdauer nur locker.
- Für Progression ist Konstanz wichtig: Nutze bevorzugt dieselben Übungen wie in den letzten Einheiten desselben Typs, außer eine Übung stagniert, das Equipment fehlt oder der Athlet wünscht etwas anderes.
- Nachgetragene Trainings (HIIT, Joggen, CrossFit, Padel, Yoga usw.) zählen mit: Hartes Ausdauer- oder Beintraining in den letzten 48 h → keinen Ausdauer-Finisher, weniger Sprungvolumen, beinlastige Grundübungen ggf. 1 Satz weniger. Wurde diese Woche schon ≥ 2× Ausdauer gemacht, ist kein Finisher nötig. Yoga/Mobility ersetzt keinen Kraftreiz, kann aber das Cool-down verkürzen.
- Berücksichtige Wünsche und Beschwerden des Athleten für heute (z. B. Schmerzen → schonende Alternative, keine Belastung der Stelle).
- Halte die geplante Dauer ein (warmup ≈ 7 min, pro Kraftsatz inkl. Pause ≈ 2,5–3,5 min, Finisher ≈ 10–15 min).

Ausgabe:
- Nur Übungs-IDs aus dem mitgeschickten Katalog. Gewichte rechnet die App selbst, gib keine Gewichte an.
- Für warmup/cooldown/conditioning: sets = 0, repsLow = 0, repsHigh = 0 und eine kurze "prescription" (z. B. "45 s je Seite" oder "6 × 30 s hart / 90 s locker").
- Für power/strength: sets, repsLow, repsHigh, restSec. "main": true nur für die 1–2 Hauptübungen.
- "note" pro Übung: höchstens ein kurzer Satz, nur wenn er hilft (sonst leer). "note" der Einheit: 1–2 Sätze zum Fokus heute.
- Alles auf Deutsch.`;

const REVIEW_SYSTEM = `Du bist ein evidenzbasierter Kraft- und Athletiktrainer und machst den wöchentlichen Check für einen Athleten (Ziel 70 % Muskelaufbau, 30 % Athletik).
Beurteile anhand der Daten: Wochenvolumen pro Muskel (Ziel 10–20 Sätze), Leistungstrends (geschätztes 1RM), Stagnation, Körpergewicht (für Muskelaufbau ideal ca. +0,25–0,5 % pro Monat im Aufbau) und Trainingsfrequenz.
Nachgetragene Trainings (HIIT, Joggen, CrossFit, Padel, Yoga …) mit Session-RPE-Last (Minuten × Anstrengung) gehören zur Gesamtbelastung: Sie decken Ausdauer/Athletik ab, können aber Erholung und Kraftleistung kosten. Bewerte, ob Ausdauer (Ziel ca. 2 Reize/Woche) und Mobilität ausreichend abgedeckt sind und ob die Gesamtlast plötzlich stark gestiegen ist.
Gib konkrete Anpassungen:
- volumeAdjust: Satz-Änderung pro Woche für einzelne Muskelgruppen (−4 bis +4), nur wo sinnvoll, mit kurzer Begründung.
- deloadNow: true nur bei klaren Ermüdungszeichen (Leistung fällt bei mehreren Übungen).
- avoid: Übungs-IDs, die vorerst ersetzt werden sollen (z. B. bei Stagnation über mehrere Einheiten), sonst leer.
- summary: 2–4 Sätze, ehrlich und konkret. focus: ein Satz für die nächste Woche. tips: 2–4 kurze Tipps (Training, Regeneration, Ernährung).
Wenn kaum Daten vorliegen, sag das und gib trotzdem sinnvolle Starttipps. Alles auf Deutsch.`;

let sdkPromise = null;
async function getClient(apiKey) {
  if (!apiKey) throw new CoachError('Kein API-Key hinterlegt (Einstellungen).');
  sdkPromise = sdkPromise || import(SDK_URL);
  let mod;
  try { mod = await sdkPromise; } catch (e) { sdkPromise = null; throw new CoachError('Claude-SDK konnte nicht geladen werden (offline?).'); }
  const Anthropic = mod.default;
  return { Anthropic, client: new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 }) };
}

async function ask({ apiKey, system, user, schema, effort }) {
  const { Anthropic, client } = await getClient(apiKey);
  const base = {
    model: MODEL,
    max_tokens: 16000,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
    output_config: { effort, format: { type: 'json_schema', schema } },
  };
  let res;
  try {
    try {
      // Server-seitiger Fallback auf ein anderes Modell, falls Opus die Anfrage ablehnt.
      res = await client.beta.messages.create({ ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
    } catch (e) {
      if (e instanceof Anthropic.BadRequestError) res = await client.messages.create(base);
      else throw e;
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new CoachError('API-Key ungültig.');
    if (e instanceof Anthropic.PermissionDeniedError) throw new CoachError('Kein Zugriff mit diesem API-Key.');
    if (e instanceof Anthropic.RateLimitError) throw new CoachError('Rate-Limit erreicht – kurz warten.');
    if (e instanceof Anthropic.APIConnectionError) throw new CoachError('Keine Verbindung zu Claude.');
    if (e instanceof Anthropic.APIError) throw new CoachError(`Claude-Fehler ${e.status || ''}: ${e.message}`);
    throw e;
  }
  if (res.stop_reason === 'refusal') throw new CoachError('Claude hat die Anfrage abgelehnt.');
  if (res.stop_reason === 'max_tokens') throw new CoachError('Antwort wurde abgeschnitten – bitte erneut versuchen.');
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  try { return JSON.parse(text); } catch (e) { throw new CoachError('Antwort von Claude war kein gültiges JSON.'); }
}

function sessionSchema(ids) {
  const item = {
    type: 'object', additionalProperties: false,
    required: ['exId', 'sets', 'repsLow', 'repsHigh', 'restSec', 'main', 'note', 'prescription'],
    properties: {
      exId: { type: 'string', enum: ids },
      sets: { type: 'integer' }, repsLow: { type: 'integer' }, repsHigh: { type: 'integer' },
      restSec: { type: 'integer' }, main: { type: 'boolean' },
      note: { type: 'string' }, prescription: { type: 'string' },
    },
  };
  return {
    type: 'object', additionalProperties: false, required: ['title', 'note', 'blocks'],
    properties: {
      title: { type: 'string' }, note: { type: 'string' },
      blocks: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['type', 'title', 'items'],
          properties: {
            type: { type: 'string', enum: ['warmup', 'power', 'strength', 'conditioning', 'cooldown'] },
            title: { type: 'string' },
            items: { type: 'array', items: item },
          },
        },
      },
    },
  };
}

function catalog(equip) {
  return EXERCISES.filter((e) => available(e, equip)).map((e) =>
    `${e.id} | ${e.name} | ${e.cat}/${e.slot} | Wdh. ${e.reps[0]}-${e.reps[1]} | ${e.prim.join(',') || '-'}`).join('\n');
}

export async function planSession(data, { templateId, equip, wish, ruleSession }) {
  const ids = EXERCISES.filter((e) => available(e, equip)).map((e) => e.id);
  const block = blockInfo(data);
  const tpl = TEMPLATES[templateId];
  const p = data.profile;
  const ruleSummary = ruleSession.blocks.map((b) => `${b.type}: ${b.items.map((i) => `${i.exId}${i.sets.length ? ` ${i.sets.length}×${i.lo}-${i.hi}` : ''}`).join(', ')}`).join('\n');
  const user = [
    `Datum: ${todayISO()}`,
    `Athlet: ${p.sex || "Geschlecht k. A."}, ${p.age} Jahre, ${p.weight} kg, ${p.level}. ${p.notes ? 'Hinweise: ' + p.notes : ''}`,
    `Trainingstage pro Woche: ${p.days}. Geplante Dauer heute: ${p.duration} min.`,
    `Heutiger Einheitstyp laut Split: ${tpl.name} (Fokus: ${tpl.focus}).`,
    `Block-Woche ${block.week} von 5${block.deload ? ' – DELOAD-WOCHE' : ''}.`,
    data.coach ? `Letzter Wochen-Check (${data.coach.date}): Fokus "${data.coach.focus}". Volumenanpassung: ${JSON.stringify(data.coach.volumeAdjust || [])}. Ersetzen: ${JSON.stringify(data.coach.avoid || [])}.` : 'Noch kein Wochen-Check vorhanden.',
    `Wunsch/Befinden heute: ${wish ? wish : '(keine Angabe)'}`,
    `Nachgetragene Trainings – Auswirkung laut Regel-Logik: ${activityAdjust(data, tpl.focus).notes.join(' ') || 'keine'}`,
    '',
    `Vorschlag der lokalen Regel-Logik (${estimateMinutes(ruleSession)} min) – übernimm, verbessere oder passe an:`,
    ruleSummary,
    '',
    'Trainingsdaten (JSON):',
    JSON.stringify(aiContext(data)),
    '',
    'Verfügbare Übungen mit dem heutigen Equipment (id | Name | Kategorie/Slot | Standard-Wdh. | Muskeln):',
    catalog(equip),
    '',
    'Erstelle die heutige Einheit.',
  ].join('\n');
  return ask({ apiKey: data.settings.apiKey, system: SYSTEM, user, schema: sessionSchema(ids), effort: 'medium' });
}

export async function weeklyReview(data) {
  const schema = {
    type: 'object', additionalProperties: false,
    required: ['summary', 'focus', 'tips', 'volumeAdjust', 'deloadNow', 'avoid'],
    properties: {
      summary: { type: 'string' }, focus: { type: 'string' },
      tips: { type: 'array', items: { type: 'string' } },
      volumeAdjust: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['muscle', 'delta', 'reason'],
          properties: { muscle: { type: 'string', enum: Object.keys(MUSCLES) }, delta: { type: 'integer' }, reason: { type: 'string' } },
        },
      },
      deloadNow: { type: 'boolean' },
      avoid: { type: 'array', items: { type: 'string', enum: EXERCISES.map((e) => e.id) } },
    },
  };
  const p = data.profile;
  const block = blockInfo(data);
  const user = [
    `Datum: ${todayISO()}`,
    `Athlet: ${p.sex || "Geschlecht k. A."}, ${p.age} Jahre, ${p.weight} kg, ${p.level}. ${p.notes ? 'Hinweise: ' + p.notes : ''}`,
    `Trainingstage pro Woche (geplant): ${p.days}. Block-Woche ${block.week} von 5${block.deload ? ' (Deload)' : ''}.`,
    `Einheiten in den letzten 7 Tagen: ${data.sessions.filter((s) => (new Date(todayISO()) - new Date(s.date)) / 86400000 < 7).length} Plan-Einheiten, dazu nachgetragen: ${(() => { const a = activitySummary(data, 7); return `${a.count} ${a.count === 1 ? 'Training' : 'Trainings'}, ${a.minutes} min, sRPE-Last ${a.load}`; })()}.`,
    `Nachgetragene Trainings vorherige Woche (Tag 8–14): sRPE-Last ${activitySummary(data, 14).load - activitySummary(data, 7).load}.`,
    data.coach ? `Vorheriger Check (${data.coach.date}): ${JSON.stringify({ focus: data.coach.focus, volumeAdjust: data.coach.volumeAdjust, avoid: data.coach.avoid })}` : '',
    'Trainingsdaten (JSON):',
    JSON.stringify(aiContext(data)),
    '',
    'Mache den Wochen-Check.',
  ].join('\n');
  return ask({ apiKey: data.settings.apiKey, system: REVIEW_SYSTEM, user, schema, effort: 'high' });
}
