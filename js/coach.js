// Claude als Coach: optionaler KI-Wochen-Check (die Planung läuft komplett ohne KI).
// Der API-Key bleibt lokal auf dem Gerät und geht nur an api.anthropic.com.
import { EXERCISES, MUSCLES } from './exercises.js';
import { blockInfo, aiContext, activitySummary, activityName, PAIN_NAME } from './engine.js';
import { todayISO } from './store.js';
import { goalOf, daysToRace, levelOf, levelHint } from './goals.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.4.0/+esm';
export const MODEL = 'claude-opus-5-5';

export class CoachError extends Error {}

const REVIEW_SYSTEM = `Du bist ein evidenzbasierter Kraft-, Ausdauer- und Athletiktrainer und machst den wöchentlichen Check für einen Athleten. Sein Trainingsziel steht in der Nachricht und ist der Maßstab für deine Bewertung (bei Ausdauer-, Marathon- oder HYROX-Zielen zählen Laufumfang, langer Lauf, Intensitätsverteilung und Wettkampfnähe stärker als das Satzvolumen; beim Sportart-Ziel zählen Saisonphase, Teamtraining/Spiele als Last, Erhalt von Kraft und Schnelligkeit und regelmäßige Prävention – in der Saison ist niedriges Satzvolumen gewollt).
Beurteile anhand der Daten: Wochenvolumen pro Muskel (Ziel 10–20 Sätze), Leistungstrends (geschätztes 1RM), Stagnation, Körpergewicht (für Muskelaufbau ideal ca. +0,25–0,5 % pro Monat im Aufbau) und Trainingsfrequenz.
Nachgetragene Trainings (HIIT, Joggen, CrossFit, Padel, Yoga …) mit Session-RPE-Last (Minuten × Anstrengung) gehören zur Gesamtbelastung: Sie decken Ausdauer/Athletik ab, können aber Erholung und Kraftleistung kosten. Bewerte, ob Ausdauer (Ziel ca. 2 Reize/Woche) und Mobilität ausreichend abgedeckt sind und ob die Gesamtlast plötzlich stark gestiegen ist.
Gib konkrete Anpassungen:
- volumeAdjust: Satz-Änderung pro Woche für einzelne Muskelgruppen (−4 bis +4), nur wo sinnvoll, mit kurzer Begründung.
- deloadNow: true nur bei klaren Ermüdungszeichen (Leistung fällt bei mehreren Übungen).
- avoid: Übungs-IDs, die vorerst ersetzt werden sollen (z. B. bei Stagnation über mehrere Einheiten), sonst leer.
- summary: 2–4 Sätze, ehrlich und konkret. focus: ein Satz für die nächste Woche. tips: 2–4 kurze Tipps (Training, Regeneration, Ernährung).
Wenn kaum Daten vorliegen, sag das und gib trotzdem sinnvolle Starttipps. Alles auf Deutsch.
Körperzusammensetzung (falls angegeben, Waagen-Messungen schwanken – nur Trends werten): Muskelmasse und Körperfett im Verhältnis zum Ziel bewerten (Aufbau: Muskel ↑, Fett höchstens leicht ↑; Abnehmen: Fett ↓, Muskel halten).
Berücksichtige die Rückmeldungen nach den Einheiten (aus den Wiederholungen geschätzte Anstrengung, Gefallen, Beschwerden): wiederholt „too_hard“ spricht für weniger Volumen oder einen Deload, „easy“ für mehr; wiederkehrende Beschwerden kurz und vorsichtig ansprechen (bei anhaltenden Schmerzen ärztliche Abklärung empfehlen).`;

let sdkPromise = null;
async function getClient(apiKey) {
  if (!apiKey) throw new CoachError('Kein API-Key hinterlegt (Mehr → Claude).');
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
    `Athlet: ${p.sex || "Geschlecht k. A."}, ${p.age} Jahre, ${p.weight} kg, Kraftniveau: ${levelOf(p).name} (${levelHint(levelOf(p), p.sex)}).${(p.zones || []).length ? ` Dauerhafte Problemzonen: ${p.zones.map((z) => PAIN_NAME[z]).join(', ')}.` : ''}`,
    (() => { const g = goalOf(data); const dtr = daysToRace(data); return `Trainingsziel: ${g.name}. ${g.prompt}${dtr !== null ? ` Wettkampf in ${dtr} Tagen.` : ''}`; })(),
    `Trainingstage pro Woche (geplant): ${p.days}. Block-Woche ${block.week} von 5${block.deload ? ' (Deload)' : ''}.`,
    (() => {
      // Nachgetragene Trainings zählen als Einheiten; Läufe aus dem Plan stecken schon in den Plan-Einheiten
      const days = (d) => (new Date(todayISO()) - new Date(d)) / 86400000;
      const week = data.sessions.filter((s) => days(s.date) >= 0 && days(s.date) < 7);
      const plan = week.filter((s) => !s.logged).length;
      const logged = [...(data.activities || []).filter((a) => days(a.date) >= 0 && days(a.date) < 7), ...week.filter((s) => s.logged)];
      const a = activitySummary(data, 7);
      return `Einheiten in den letzten 7 Tagen: ${plan + logged.length} insgesamt (${plan} Plan-Einheiten, ${logged.length} nachgetragen) bei ${p.days} geplanten Trainingstagen – nachgetragene Trainings zählen als vollwertige Einheiten. Ausdauer & Sport gesamt (inkl. Läufe aus dem Plan): ${a.minutes} min, sRPE-Last ${a.load}.`;
    })(),
    (() => {
      const days = (d) => (new Date(todayISO()) - new Date(d)) / 86400000;
      const list = [
        ...(data.activities || []).filter((a) => days(a.date) >= 0 && days(a.date) < 14).map((a) => ({ datum: a.date, art: activityName(a), minuten: a.minutes, anstrengung: a.intensity, ...(a.km ? { km: a.km } : {}), ...(a.note ? { notiz: String(a.note).slice(0, 120) } : {}) })),
        // Nachgetragenes Krafttraining: Sätze stehen in den Trainingsdaten unter letzte_einheiten
        ...data.sessions.filter((s) => s.logged && days(s.date) >= 0 && days(s.date) < 14).map((s) => ({ datum: s.date, art: s.title, minuten: s.minutes, anstrengung: s.intensity, saetze: s.blocks.reduce((n, b) => n + b.items.reduce((m, it) => m + (it.sets || []).length, 0), 0), ...(s.note ? { notiz: String(s.note).slice(0, 120) } : {}) })),
      ].sort((x, y) => x.datum.localeCompare(y.datum));
      return list.length ? `Nachgetragene Trainings der letzten 14 Tage (JSON): ${JSON.stringify(list)}` : 'Keine nachgetragenen Trainings in den letzten 14 Tagen.';
    })(),
    `Nachgetragene Trainings vorherige Woche (Tag 8–14): sRPE-Last ${activitySummary(data, 14).load - activitySummary(data, 7).load}.`,
    data.coach ? `Vorheriger Check (${data.coach.date}): ${JSON.stringify({ focus: data.coach.focus, volumeAdjust: data.coach.volumeAdjust, avoid: data.coach.avoid })}` : '',
    'Trainingsdaten (JSON):',
    JSON.stringify(aiContext(data)),
    '',
    'Mache den Wochen-Check.',
  ].join('\n');
  return ask({ apiKey: data.settings.apiKey, system: REVIEW_SYSTEM, user, schema, effort: 'high' });
}
