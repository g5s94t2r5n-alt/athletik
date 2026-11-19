// Übungsdatenbank.
// slot = Rolle im Plan (Generator wählt pro Slot eine passende Übung).
// equip = ALLE benötigten Geräte. Körpergewicht ist immer verfügbar.
// prim/sec = Muskelgruppen (prim zählt 1 Satz, sec 0,5 Satz fürs Wochenvolumen).
// load: 'kg' (Gewicht), 'bw' (Körpergewicht, Zusatzgewicht optional), 'none' (nur abhaken).

export const EQUIPMENT = [
  { id: 'barbell', name: 'Langhantel + Rack' },
  { id: 'dumbbell', name: 'Kurzhanteln' },
  { id: 'kettlebell', name: 'Kettlebell' },
  { id: 'bench', name: 'Hantelbank' },
  { id: 'cable', name: 'Kabelzug' },
  { id: 'machine', name: 'Maschinen' },
  { id: 'pullup', name: 'Klimmzugstange' },
  { id: 'dip', name: 'Dip-Barren' },
  { id: 'band', name: 'Widerstandsband' },
  { id: 'medball', name: 'Medizinball' },
  { id: 'box', name: 'Plyo-Box / Kasten' },
  { id: 'cardio', name: 'Cardio-Gerät (Rad/Ruder/Laufband)' },
  { id: 'space', name: 'Freifläche / Laufstrecke' },
];

// Trainingsorte: Ausstattung kommt automatisch, nur unterwegs wird sie ausgewählt.
export const LOCATIONS = [
  { id: 'gym', name: 'Fitnessstudio', equip: EQUIPMENT.map((e) => e.id) },
  { id: 'home', name: 'Home-Gym' },
  { id: 'travel', name: 'Hotel / unterwegs' },
  { id: 'outdoor', name: 'Draußen', equip: ['space'] },
  { id: 'bodyweight', name: 'Nur Körpergewicht', equip: [] },
];

// Nachgetragene Trainings außerhalb des Plans.
// cardio = zählt als Ausdauerreiz, legs = belastet die Beine stark (Sprünge/Sprints), dist = Strecke sinnvoll.
export const ACTIVITIES = [
  { id: 'hiit', name: 'HIIT', cardio: true, legs: true },
  { id: 'jogging', name: 'Joggen', cardio: true, legs: true, dist: true },
  { id: 'crossfit', name: 'CrossFit', cardio: true, legs: true },
  { id: 'padel', name: 'Padel', cardio: true, legs: true },
  { id: 'paddling', name: 'Paddeln (SUP/Kajak)', cardio: true, dist: true },
  { id: 'yoga', name: 'Yoga', mobility: true },
  { id: 'cycling', name: 'Radfahren', cardio: true, dist: true },
  { id: 'swimming', name: 'Schwimmen', cardio: true, dist: true },
  { id: 'teamsport', name: 'Fußball / Teamsport', cardio: true, legs: true },
  { id: 'hiking', name: 'Wandern', cardio: true, dist: true },
  { id: 'mobility', name: 'Mobility / Dehnen', mobility: true },
  { id: 'other', name: 'Sonstiges', cardio: true },
];
export const ACT = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
// Session-RPE (Foster et al. 2001): Last = Minuten × Anstrengung (0–10)
export const INTENSITY = { leicht: 3, mittel: 5, hart: 8 };

export const MUSCLES = {
  brust: 'Brust',
  ruecken: 'Rücken',
  schultern: 'Schultern',
  bizeps: 'Bizeps',
  trizeps: 'Trizeps',
  quadrizeps: 'Quadrizeps',
  beinbeuger: 'Beinbeuger',
  gesaess: 'Gesäß',
  waden: 'Waden',
  bauch: 'Bauch/Core',
};

const E = (id, name, en, slot, equip, prim, sec, cues, o = {}) => ({
  id, name, en, slot, equip, prim, sec, cues,
  cat: o.cat || 'strength',
  load: o.load || 'kg',
  inc: o.inc ?? 2.5,
  reps: o.reps || [8, 12],
  presc: o.presc || '',
});

const P = { cat: 'power', inc: 0 };
const C = { cat: 'conditioning', load: 'none', inc: 0 };
const M = { cat: 'mobility', load: 'none', inc: 0 };

export const EXERCISES = [
  // ---------- Schnellkraft Unterkörper ----------
  E('box_jump', 'Box Jump', 'box jump', 'power_lower', ['box'], [], ['quadrizeps', 'gesaess'],
    ['Aus dem Stand explosiv abspringen, Arme mitschwingen', 'Leise und stabil auf der Box landen', 'Heruntersteigen, nicht springen'], { ...P, load: 'bw', reps: [3, 5] }),
  E('cmj', 'Strecksprung (Countermovement Jump)', 'countermovement jump', 'power_lower', [], [], ['quadrizeps', 'gesaess'],
    ['Kurze Ausholbewegung, dann maximal hoch', 'Weiche Landung, Knie über den Zehen', 'Jeder Sprung mit voller Absicht – Qualität vor Menge'], { ...P, load: 'bw', reps: [3, 5] }),
  E('broad_jump', 'Standweitsprung', 'standing broad jump', 'power_lower', [], [], ['gesaess', 'beinbeuger'],
    ['Hüfte nach hinten laden, Arme kräftig nach vorn', 'So weit wie möglich nach vorn springen', 'Landung halten (stick the landing)'], { ...P, load: 'bw', reps: [3, 5] }),
  E('kb_swing', 'Kettlebell Swing', 'kettlebell swing', 'power_lower', ['kettlebell'], [], ['gesaess', 'beinbeuger'],
    ['Hüftbeuge statt Kniebeuge – Hüfte schnappt explosiv nach vorn', 'Arme sind nur Seile, die Kraft kommt aus der Hüfte', 'Rücken neutral, oben Gesäß anspannen'], { ...P, inc: 4, reps: [8, 12] }),
  E('hang_power_clean', 'Hang Power Clean', 'hang power clean', 'power_lower', ['barbell'], [], ['gesaess', 'ruecken'],
    ['Stange über den Knien, Hüfte nach hinten', 'Explosive Hüftstreckung, Schultern hochziehen', 'Ellbogen schnell nach vorn, Stange auf den Schultern fangen'], { ...P, inc: 2.5, reps: [3, 3] }),
  E('db_jump_squat', 'Kurzhantel-Sprungkniebeuge', 'dumbbell jump squat', 'power_lower', ['dumbbell'], [], ['quadrizeps', 'gesaess'],
    ['Leichte Hanteln (10–20 % KG)', 'Viertel-Kniebeuge, dann explosiv springen', 'Weich landen und neu ansetzen'], { ...P, inc: 2, reps: [4, 5] }),
  E('lateral_bound', 'Seitliche Sprünge (Skater Bounds)', 'skater bounds', 'power_lower', [], [], ['gesaess'],
    ['Kraftvoll seitlich von einem Bein aufs andere', 'Landung 1 s stabil halten', 'Knie bleibt über dem Fuß'], { ...P, load: 'bw', reps: [4, 6] }),

  // ---------- Schnellkraft Oberkörper ----------
  E('mb_chest_pass', 'Medizinball-Brustpass gegen die Wand', 'medicine ball chest pass', 'power_upper', ['medball'], [], ['brust', 'trizeps'],
    ['Ball vor der Brust, explosiv nach vorn stoßen', 'Ganzkörper: Beine und Rumpf mitnutzen', 'Maximale Geschwindigkeit pro Wurf'], { ...P, load: 'none', reps: [5, 6] }),
  E('mb_slam', 'Medizinball-Slam', 'medicine ball slam', 'power_upper', ['medball'], [], ['bauch', 'ruecken'],
    ['Ball über Kopf strecken, auf die Zehen', 'Mit voller Kraft auf den Boden schmettern', 'Rumpf aktiv einrollen'], { ...P, load: 'none', reps: [5, 6] }),
  E('mb_rot_throw', 'Medizinball-Rotationswurf', 'medicine ball rotational throw', 'power_upper', ['medball'], [], ['bauch'],
    ['Seitlich zur Wand stehen', 'Rotation aus Hüfte und hinterem Bein starten', 'Ball explosiv gegen die Wand werfen, beide Seiten'], { ...P, load: 'none', reps: [4, 5] }),
  E('plyo_pushup', 'Plyometrische Liegestütze', 'plyometric push up', 'power_upper', [], [], ['brust', 'trizeps'],
    ['Kontrolliert ab, explosiv hoch, sodass die Hände abheben', 'Körperspannung wie beim Brett', 'Weich landen'], { ...P, load: 'bw', reps: [4, 6] }),
  E('db_push_press', 'Kurzhantel Push Press', 'dumbbell push press', 'power_upper', ['dumbbell'], [], ['schultern', 'trizeps'],
    ['Kurzer Dip in den Knien', 'Explosiv aus den Beinen über Kopf drücken', 'Kontrolliert zurück auf die Schultern'], { ...P, inc: 2, reps: [3, 5] }),
  E('band_punch', 'Explosiver Band-Punch', 'resistance band explosive punch', 'power_upper', ['band'], [], ['brust', 'schultern'],
    ['Band hinter dir fixieren', 'Abwechselnd explosiv nach vorn stoßen', 'Rumpf stabil, Rotation aus der Hüfte'], { ...P, load: 'none', reps: [6, 8] }),

  // ---------- Kniebeuge-Muster ----------
  E('back_squat', 'Kniebeuge (Langhantel)', 'barbell back squat', 'squat', ['barbell'], ['quadrizeps', 'gesaess'], ['bauch'],
    ['Stange auf dem oberen Trapez, Füße schulterbreit', 'Tief gehen (mind. Oberschenkel parallel), Knie folgen den Zehen', 'Rumpf fest, aus der Mitte des Fußes drücken'], { reps: [5, 8] }),
  E('front_squat', 'Frontkniebeuge', 'front squat', 'squat', ['barbell'], ['quadrizeps', 'gesaess'], ['bauch'],
    ['Stange auf den vorderen Schultern, Ellbogen hoch', 'Oberkörper aufrecht, tief runter', 'Ellbogen bleiben oben beim Aufstehen'], { reps: [5, 8] }),
  E('hack_squat', 'Hackenschmidt-Kniebeuge', 'hack squat machine', 'squat', ['machine'], ['quadrizeps', 'gesaess'], [],
    ['Füße mittig, schulterbreit', 'Kontrolliert tief, 1 s unten', 'Knie nicht durchschlagen'], { reps: [6, 10] }),
  E('leg_press', 'Beinpresse', 'leg press', 'squat', ['machine'], ['quadrizeps', 'gesaess'], [],
    ['Ganze Fußsohle auf der Platte', 'So tief, wie das Becken nicht abrollt', 'Knie oben nicht ganz durchstrecken'], { reps: [8, 12], inc: 5 }),
  E('goblet_squat', 'Goblet Squat', 'goblet squat', 'squat', ['dumbbell'], ['quadrizeps', 'gesaess'], ['bauch'],
    ['Hantel vor der Brust halten', 'Ellbogen zwischen die Knie, tief sitzen', 'Brust bleibt oben'], { reps: [8, 15], inc: 2 }),
  E('kb_goblet_squat', 'Kettlebell Goblet Squat', 'kettlebell goblet squat', 'squat', ['kettlebell'], ['quadrizeps', 'gesaess'], ['bauch'],
    ['Kettlebell an den Hörnern vor der Brust', 'Tief sitzen, Knie nach außen', 'Aufrecht bleiben'], { reps: [10, 15], inc: 4 }),
  E('tempo_squat_bw', 'Tempo-Kniebeuge (Körpergewicht)', 'bodyweight tempo squat', 'squat', [], ['quadrizeps', 'gesaess'], [],
    ['3 s ab, 1 s Pause unten, schnell hoch', 'Volle Tiefe', 'Bis kurz vor Versagen'], { load: 'bw', reps: [15, 25], inc: 0 }),

  // ---------- Hüftbeuge-Muster ----------
  E('deadlift', 'Kreuzheben', 'conventional deadlift', 'hinge', ['barbell'], ['gesaess', 'beinbeuger', 'ruecken'], ['quadrizeps'],
    ['Stange über der Fußmitte, Schienbeine nah', 'Rücken neutral, Lat anspannen („Achseln zusammen“)', 'Boden wegdrücken, Hüfte und Schultern steigen gleichzeitig'], { reps: [4, 6], inc: 5 }),
  E('rdl', 'Rumänisches Kreuzheben', 'romanian deadlift', 'hinge', ['barbell'], ['beinbeuger', 'gesaess'], ['ruecken'],
    ['Leicht gebeugte Knie, Hüfte weit nach hinten', 'Stange gleitet an den Beinen entlang bis Dehnung im Beinbeuger', 'Rücken bleibt neutral'], { reps: [6, 10] }),
  E('db_rdl', 'Rumänisches Kreuzheben (Kurzhantel)', 'dumbbell romanian deadlift', 'hinge', ['dumbbell'], ['beinbeuger', 'gesaess'], ['ruecken'],
    ['Hanteln nah an den Beinen', 'Hüfte nach hinten bis zur Dehnung', 'Gesäß oben aktiv anspannen'], { reps: [8, 12], inc: 2 }),
  E('hip_thrust', 'Hip Thrust (Langhantel)', 'barbell hip thrust', 'hinge', ['barbell', 'bench'], ['gesaess'], ['beinbeuger'],
    ['Schulterblätter auf der Bank, Stange in der Hüftbeuge (Polster)', 'Kinn zur Brust, Becken hochdrücken', 'Oben 1 s Gesäß maximal anspannen'], { reps: [6, 10] }),
  E('kb_rdl', 'Kettlebell-Kreuzheben einbeinig', 'single leg kettlebell deadlift', 'hinge', ['kettlebell'], ['beinbeuger', 'gesaess'], [],
    ['Ein Bein nach hinten, Hüfte bleibt gerade', 'Kettlebell in der gegenüberliegenden Hand', 'Langsam bis zur Dehnung, Balance halten'], { reps: [8, 12], inc: 4 }),
  E('sl_rdl_bw', 'Einbeiniges Kreuzheben (Körpergewicht)', 'single leg romanian deadlift', 'hinge', [], ['beinbeuger', 'gesaess'], [],
    ['Langsam (3 s) nach unten', 'Becken gerade halten', 'Kurze Pause in der Dehnung'], { load: 'bw', reps: [10, 15], inc: 0 }),
  E('glute_bridge_sl', 'Einbeinige Glute Bridge', 'single leg glute bridge', 'hinge', [], ['gesaess'], ['beinbeuger'],
    ['Ferse nah am Gesäß', 'Becken hochdrücken, 2 s halten', 'Becken bleibt waagerecht'], { load: 'bw', reps: [12, 20], inc: 0 }),

  // ---------- Einbeinig ----------
  E('bss_db', 'Bulgarische Kniebeuge (Kurzhantel)', 'dumbbell bulgarian split squat', 'lunge', ['dumbbell', 'bench'], ['quadrizeps', 'gesaess'], [],
    ['Hinterer Fuß auf der Bank', 'Tief absenken, vorderes Knie darf nach vorn', 'Leichte Vorlage = mehr Gesäß'], { reps: [6, 10], inc: 2 }),
  E('bss_bw', 'Bulgarische Kniebeuge (Körpergewicht)', 'bulgarian split squat', 'lunge', [], ['quadrizeps', 'gesaess'], [],
    ['Hinterer Fuß erhöht (Stuhl/Bank)', 'Langsam 3 s ab', 'Bis kurz vor Versagen'], { load: 'bw', reps: [10, 20], inc: 0 }),
  E('walking_lunge', 'Ausfallschritte gehend (Kurzhantel)', 'dumbbell walking lunge', 'lunge', ['dumbbell'], ['quadrizeps', 'gesaess'], [],
    ['Großer Schritt, hinteres Knie fast am Boden', 'Aufrecht bleiben', 'Wdh. = pro Bein'], { reps: [8, 12], inc: 2 }),
  E('step_up', 'Step-up (Kurzhantel)', 'dumbbell step up', 'lunge', ['dumbbell', 'box'], ['quadrizeps', 'gesaess'], [],
    ['Ganzer Fuß auf die Box', 'Nur mit dem oberen Bein hochdrücken', 'Langsam ablassen'], { reps: [8, 12], inc: 2 }),
  E('reverse_lunge_bb', 'Ausfallschritt rückwärts (Langhantel)', 'barbell reverse lunge', 'lunge', ['barbell'], ['quadrizeps', 'gesaess'], [],
    ['Schritt nach hinten, vorderes Schienbein senkrecht', 'Knie kontrolliert absenken', 'Aus der vorderen Ferse hochdrücken'], { reps: [6, 10] }),

  // ---------- Kniebeugung (Beinbeuger) ----------
  E('seated_leg_curl', 'Beinbeuger sitzend', 'seated leg curl', 'knee_flexion', ['machine'], ['beinbeuger'], [],
    ['Oberkörper leicht nach vorn lehnen (mehr Dehnung)', 'Voll beugen, langsam zurück', 'Gedehnte Position bewusst mitnehmen'], { reps: [8, 12] }),
  E('lying_leg_curl', 'Beinbeuger liegend', 'lying leg curl', 'knee_flexion', ['machine'], ['beinbeuger'], [],
    ['Hüfte auf das Polster drücken', 'Kontrolliert hoch und langsam ab', 'Kein Schwung'], { reps: [8, 12] }),
  E('nordic_curl', 'Nordic Hamstring Curl', 'nordic hamstring curl', 'knee_flexion', [], ['beinbeuger'], [],
    ['Füße fixieren (Partner, Hantel, Sprossenwand)', 'Körper gerade, so langsam wie möglich nach vorn', 'Mit den Händen abfangen, hochdrücken'], { load: 'bw', reps: [4, 8], inc: 0 }),
  E('cable_leg_curl', 'Beinbeuger am Kabel stehend', 'standing cable leg curl', 'knee_flexion', ['cable'], ['beinbeuger'], [],
    ['Fußschlaufe, Knie bleibt an Ort', 'Ferse zum Gesäß', 'Langsam ablassen'], { reps: [10, 15], inc: 1.25 }),
  E('slider_curl', 'Slider Leg Curl', 'slider hamstring curl', 'knee_flexion', [], ['beinbeuger'], ['gesaess'],
    ['Fersen auf Handtuch/Slider, Becken oben', 'Fersen heranziehen ohne Becken abzusenken', 'Langsam ausstrecken'], { load: 'bw', reps: [8, 15], inc: 0 }),

  // ---------- Quadrizeps isoliert ----------
  E('leg_extension', 'Beinstrecker', 'leg extension', 'quad_iso', ['machine'], ['quadrizeps'], [],
    ['Rückenlehne so, dass das Knie an der Drehachse liegt', 'Oben 1 s halten', 'Langsam ablassen'], { reps: [10, 15] }),
  E('spanish_squat', 'Spanish Squat (Band)', 'spanish squat', 'quad_iso', ['band'], ['quadrizeps'], [],
    ['Band hinter den Knien fixieren', 'Schienbeine senkrecht, nach hinten sitzen', 'Kniefreundlich – gut bei Patellasehnen-Reizung'], { load: 'bw', reps: [12, 20], inc: 0 }),
  E('sissy_squat', 'Sissy Squat', 'sissy squat', 'quad_iso', [], ['quadrizeps'], [],
    ['Festhalten, auf die Zehen', 'Knie nach vorn, Hüfte gestreckt lassen', 'Nur so tief wie schmerzfrei'], { load: 'bw', reps: [10, 20], inc: 0 }),

  // ---------- Waden ----------
  E('standing_calf', 'Wadenheben stehend', 'standing calf raise', 'calf', ['machine'], ['waden'], [],
    ['Unten 2 s in der Dehnung pausieren', 'Voll auf die Zehen', 'Kein Federn'], { reps: [8, 15] }),
  E('db_calf', 'Wadenheben einbeinig (Kurzhantel)', 'single leg calf raise', 'calf', ['dumbbell'], ['waden'], [],
    ['Auf einer Stufe, Ferse tief', '2 s Pause unten', 'Wdh. = pro Bein'], { reps: [10, 15], inc: 2 }),
  E('bw_calf', 'Wadenheben einbeinig (Körpergewicht)', 'single leg calf raise', 'calf', [], ['waden'], [],
    ['Auf einer Stufe, volle Bewegung', '2 s Pause in der Dehnung', 'Bis kurz vor Versagen'], { load: 'bw', reps: [12, 25], inc: 0 }),
  E('seated_calf', 'Wadenheben sitzend', 'seated calf raise', 'calf', ['machine'], ['waden'], [],
    ['Trifft vor allem den Soleus', 'Unten pausieren', 'Langsam und voll'], { reps: [10, 20] }),

  // ---------- Horizontal drücken ----------
  E('bench_press', 'Bankdrücken (Langhantel)', 'barbell bench press', 'hpush', ['barbell', 'bench'], ['brust'], ['trizeps', 'schultern'],
    ['Schulterblätter zusammen und runter, leichtes Hohlkreuz', 'Stange zur unteren Brust, Ellbogen ~45°', 'Füße fest im Boden'], { reps: [5, 8] }),
  E('incline_bench', 'Schrägbankdrücken (Langhantel)', 'incline barbell bench press', 'hpush', ['barbell', 'bench'], ['brust'], ['schultern', 'trizeps'],
    ['Bank 30°', 'Stange zur oberen Brust', 'Volle Dehnung unten'], { reps: [6, 10] }),
  E('db_bench', 'Kurzhantel-Bankdrücken', 'dumbbell bench press', 'hpush', ['dumbbell', 'bench'], ['brust'], ['trizeps', 'schultern'],
    ['Hanteln tief ablassen (Dehnung)', 'Schulterblätter fixiert', 'Hanteln oben nicht zusammenschlagen'], { reps: [6, 12], inc: 2 }),
  E('incline_db', 'Schrägbankdrücken (Kurzhantel)', 'incline dumbbell press', 'hpush', ['dumbbell', 'bench'], ['brust'], ['schultern', 'trizeps'],
    ['Bank 30°', 'Tief in die Dehnung', 'Ellbogen leicht unter Schulterhöhe'], { reps: [8, 12], inc: 2 }),
  E('chest_press', 'Brustpresse (Maschine)', 'machine chest press', 'hpush', ['machine'], ['brust'], ['trizeps'],
    ['Griffe auf Brusthöhe', 'Volle Dehnung zurück', 'Kontrolliert drücken'], { reps: [8, 12] }),
  E('dips', 'Dips', 'chest dips', 'hpush', ['dip'], ['brust', 'trizeps'], ['schultern'],
    ['Leichte Vorlage für mehr Brust', 'Tief bis Schulter knapp unter Ellbogen', 'Zusatzgewicht, wenn 12+ Wdh. gehen'], { load: 'bw', reps: [6, 12], inc: 2.5 }),
  E('pushup', 'Liegestütze', 'push up', 'hpush', [], ['brust'], ['trizeps', 'schultern'],
    ['Körper wie ein Brett', 'Brust bis knapp über den Boden', 'Füße erhöht = schwerer'], { load: 'bw', reps: [10, 25], inc: 0 }),
  E('band_pushup', 'Liegestütze mit Band', 'banded push up', 'hpush', ['band'], ['brust'], ['trizeps', 'schultern'],
    ['Band über den Rücken, Enden unter den Händen', 'Tief und kontrolliert', 'Explosiv hochdrücken'], { load: 'bw', reps: [8, 20], inc: 0 }),

  // ---------- Vertikal drücken ----------
  E('ohp', 'Schulterdrücken stehend (Langhantel)', 'overhead press', 'vpush', ['barbell'], ['schultern'], ['trizeps'],
    ['Gesäß und Bauch fest, kein Hohlkreuz', 'Stange in gerader Linie, Kopf durch die Arme', 'Oben Schultern aktiv hoch'], { reps: [5, 8] }),
  E('db_shoulder_press', 'Kurzhantel-Schulterdrücken sitzend', 'seated dumbbell shoulder press', 'vpush', ['dumbbell', 'bench'], ['schultern'], ['trizeps'],
    ['Lehne fast senkrecht', 'Hanteln bis Ohrhöhe ablassen', 'Kontrolliert hochdrücken'], { reps: [8, 12], inc: 2 }),
  E('db_shoulder_press_st', 'Kurzhantel-Schulterdrücken stehend', 'standing dumbbell shoulder press', 'vpush', ['dumbbell'], ['schultern'], ['trizeps'],
    ['Rumpf fest', 'Hanteln tief ablassen', 'Nicht ins Hohlkreuz fallen'], { reps: [8, 12], inc: 2 }),
  E('machine_shoulder', 'Schulterpresse (Maschine)', 'machine shoulder press', 'vpush', ['machine'], ['schultern'], ['trizeps'],
    ['Sitz so, dass Griffe auf Schulterhöhe', 'Volle Bewegung', 'Langsam ablassen'], { reps: [8, 12] }),
  E('pike_pushup', 'Pike Push-up', 'pike push up', 'vpush', [], ['schultern'], ['trizeps'],
    ['Hüfte hoch, umgedrehtes V', 'Kopf vor die Hände absenken', 'Füße erhöht = schwerer'], { load: 'bw', reps: [6, 15], inc: 0 }),
  E('kb_press', 'Kettlebell-Schulterdrücken einarmig', 'kettlebell overhead press', 'vpush', ['kettlebell'], ['schultern'], ['trizeps', 'bauch'],
    ['Kettlebell im Rack, Unterarm senkrecht', 'Drücken mit leichter Rotation', 'Rumpf nicht seitlich wegknicken'], { reps: [6, 10], inc: 4 }),

  // ---------- Horizontal ziehen ----------
  E('bb_row', 'Langhantelrudern', 'barbell row', 'hpull', ['barbell'], ['ruecken'], ['bizeps'],
    ['Oberkörper ~45° vorgebeugt, Rücken neutral', 'Stange zum Bauchnabel ziehen', 'Kein Schwung aus der Hüfte'], { reps: [6, 10] }),
  E('cs_db_row', 'Brustgestütztes Kurzhantelrudern', 'chest supported dumbbell row', 'hpull', ['dumbbell', 'bench'], ['ruecken'], ['bizeps', 'schultern'],
    ['Brust auf der Schrägbank', 'Ellbogen nach hinten-oben ziehen', 'Unten voll dehnen'], { reps: [8, 12], inc: 2 }),
  E('one_arm_row', 'Einarmiges Kurzhantelrudern', 'one arm dumbbell row', 'hpull', ['dumbbell', 'bench'], ['ruecken'], ['bizeps'],
    ['Knie und Hand auf der Bank', 'Hantel Richtung Hüfte ziehen', 'Unten Schulter nach vorn dehnen lassen'], { reps: [8, 12], inc: 2 }),
  E('cable_row', 'Rudern am Kabel sitzend', 'seated cable row', 'hpull', ['cable'], ['ruecken'], ['bizeps'],
    ['Aufrecht sitzen', 'Griff zum Bauch, Schulterblätter zusammen', 'Vorne Arme lang machen (Dehnung)'], { reps: [8, 12], inc: 2.5 }),
  E('machine_row', 'Rudermaschine (Brust gestützt)', 'chest supported machine row', 'hpull', ['machine'], ['ruecken'], ['bizeps'],
    ['Brust ans Polster', 'Ellbogen weit nach hinten', 'Langsam zurück'], { reps: [8, 12] }),
  E('inverted_row', 'Umgekehrtes Rudern', 'inverted row', 'hpull', ['barbell'], ['ruecken'], ['bizeps'],
    ['Stange im Rack auf Hüfthöhe', 'Körper gerade, Brust zur Stange', 'Füße erhöht = schwerer'], { load: 'bw', reps: [8, 15], inc: 0 }),
  E('band_row', 'Rudern mit Band', 'resistance band row', 'hpull', ['band'], ['ruecken'], ['bizeps'],
    ['Band auf Brusthöhe fixieren', 'Ellbogen nach hinten, Schulterblätter zusammen', 'Langsam zurück'], { load: 'bw', reps: [12, 20], inc: 0 }),
  E('table_row', 'Tischrudern (Körpergewicht)', 'table inverted row', 'hpull', [], ['ruecken'], ['bizeps'],
    ['Unter einen stabilen Tisch legen', 'Brust zur Tischkante ziehen', 'Körper gerade'], { load: 'bw', reps: [8, 15], inc: 0 }),

  // ---------- Vertikal ziehen ----------
  E('pullup', 'Klimmzüge', 'pull up', 'vpull', ['pullup'], ['ruecken'], ['bizeps'],
    ['Aus dem vollen Hang starten', 'Brust zur Stange, Ellbogen nach unten', 'Zusatzgewicht, wenn 12+ Wdh. gehen'], { load: 'bw', reps: [5, 10], inc: 2.5 }),
  E('chinup', 'Klimmzüge Untergriff (Chin-up)', 'chin up', 'vpull', ['pullup'], ['ruecken', 'bizeps'], [],
    ['Schulterbreiter Untergriff', 'Voller Hang unten', 'Kinn über die Stange'], { load: 'bw', reps: [5, 10], inc: 2.5 }),
  E('lat_pulldown', 'Latziehen', 'lat pulldown', 'vpull', ['cable'], ['ruecken'], ['bizeps'],
    ['Oberschenkel fixiert, leicht zurücklehnen', 'Stange zur oberen Brust', 'Oben voll dehnen'], { reps: [8, 12], inc: 2.5 }),
  E('sa_pulldown', 'Einarmiges Latziehen am Kabel', 'single arm lat pulldown', 'vpull', ['cable'], ['ruecken'], ['bizeps'],
    ['Griff von oben, leicht seitlich', 'Ellbogen zur Hüfte', 'Oben Schulter strecken lassen'], { reps: [10, 15], inc: 1.25 }),
  E('band_pulldown', 'Latziehen mit Band', 'resistance band lat pulldown', 'vpull', ['band'], ['ruecken'], ['bizeps'],
    ['Band oben fixieren (Tür/Stange)', 'Ellbogen nach unten zur Hüfte', 'Langsam zurück'], { load: 'bw', reps: [12, 20], inc: 0 }),
  E('towel_row_door', 'Rücken-Isometrie am Türrahmen', 'door frame row', 'vpull', [], ['ruecken'], ['bizeps'],
    ['An Türrahmen/Geländer festhalten', 'Körper nach hinten lehnen, heranziehen', 'Langsam, 2 s halten'], { load: 'bw', reps: [10, 20], inc: 0 }),

  // ---------- Brust isoliert ----------
  E('cable_fly', 'Kabel-Fliegende', 'cable fly', 'chest_iso', ['cable'], ['brust'], [],
    ['Leicht gebeugte Ellbogen, fixiert', 'Weit öffnen (Dehnung)', 'Hände vor der Brust zusammenführen'], { reps: [10, 15], inc: 1.25 }),
  E('db_fly', 'Kurzhantel-Fliegende', 'dumbbell fly', 'chest_iso', ['dumbbell', 'bench'], ['brust'], [],
    ['Leicht gebeugte Arme', 'Tief öffnen bis zur Dehnung', 'Oben nicht zusammenschlagen'], { reps: [10, 15], inc: 2 }),
  E('pec_deck', 'Butterfly (Maschine)', 'pec deck', 'chest_iso', ['machine'], ['brust'], [],
    ['Griffe auf Brusthöhe', 'Voll öffnen', 'Kontrolliert schließen'], { reps: [10, 15] }),

  // ---------- Seitliche Schulter ----------
  E('lateral_raise', 'Seitheben (Kurzhantel)', 'dumbbell lateral raise', 'side_delt', ['dumbbell'], ['schultern'], [],
    ['Leichte Vorlage, Ellbogen leicht gebeugt', 'Bis Schulterhöhe, Ellbogen führt', 'Langsam ab, kein Schwung'], { reps: [10, 20], inc: 1 }),
  E('cable_lateral', 'Seitheben am Kabel', 'cable lateral raise', 'side_delt', ['cable'], ['schultern'], [],
    ['Kabel von unten, hinter dem Körper', 'Konstante Spannung auch unten', 'Bis Schulterhöhe'], { reps: [10, 20], inc: 1.25 }),
  E('band_lateral', 'Seitheben mit Band', 'band lateral raise', 'side_delt', ['band'], ['schultern'], [],
    ['Auf das Band stellen', 'Seitlich bis Schulterhöhe', 'Langsam zurück'], { load: 'bw', reps: [15, 25], inc: 0 }),
  E('machine_lateral', 'Seitheben (Maschine)', 'machine lateral raise', 'side_delt', ['machine'], ['schultern'], [],
    ['Drehpunkt auf Schulterhöhe', 'Bis Schulterhöhe', 'Kontrolliert ab'], { reps: [10, 20] }),
  E('ytw_bw', 'Y-T-W-Heben bäuchlings', 'prone YTW raise', 'side_delt', [], ['schultern'], ['ruecken'],
    ['Bäuchlings, Daumen nach oben', 'Je 1 Wdh. Y, T, W = 1 Runde', 'Schulterblätter aktiv'], { load: 'bw', reps: [8, 12], inc: 0 }),

  // ---------- Hintere Schulter ----------
  E('face_pull', 'Face Pull', 'face pull', 'rear_delt', ['cable'], ['schultern'], ['ruecken'],
    ['Seil auf Augenhöhe', 'Zum Gesicht ziehen, Hände nach außen rotieren', 'Ellbogen hoch'], { reps: [12, 20], inc: 1.25 }),
  E('band_face_pull', 'Face Pull mit Band', 'band face pull', 'rear_delt', ['band'], ['schultern'], ['ruecken'],
    ['Band auf Augenhöhe', 'Hände neben die Ohren ziehen', 'Kurz halten'], { load: 'bw', reps: [15, 25], inc: 0 }),
  E('reverse_fly', 'Reverse Flys vorgebeugt', 'bent over reverse fly', 'rear_delt', ['dumbbell'], ['schultern'], ['ruecken'],
    ['Vorgebeugt, Rücken gerade', 'Arme seitlich öffnen, Daumen leicht nach unten', 'Leichtes Gewicht, sauber'], { reps: [12, 20], inc: 1 }),
  E('reverse_pec_deck', 'Reverse Butterfly (Maschine)', 'reverse pec deck', 'rear_delt', ['machine'], ['schultern'], ['ruecken'],
    ['Brust ans Polster', 'Arme weit nach hinten öffnen', 'Langsam zurück'], { reps: [12, 20] }),

  // ---------- Bizeps ----------
  E('incline_curl', 'Schrägbank-Curls', 'incline dumbbell curl', 'biceps', ['dumbbell', 'bench'], ['bizeps'], [],
    ['Bank 45–60°, Arme hängen nach hinten (Dehnung)', 'Ellbogen bleibt hinten', 'Langsam ab'], { reps: [8, 15], inc: 1 }),
  E('bb_curl', 'Langhantel-Curls', 'barbell curl', 'biceps', ['barbell'], ['bizeps'], [],
    ['Ellbogen am Körper', 'Kein Schwung', 'Unten voll strecken'], { reps: [8, 12], inc: 2.5 }),
  E('cable_curl', 'Kabel-Curls', 'cable curl', 'biceps', ['cable'], ['bizeps'], [],
    ['Konstante Spannung', 'Ellbogen fixiert', 'Oben kurz halten'], { reps: [10, 15], inc: 1.25 }),
  E('hammer_curl', 'Hammer-Curls', 'hammer curl', 'biceps', ['dumbbell'], ['bizeps'], [],
    ['Neutraler Griff', 'Ellbogen ruhig', 'Trifft auch Brachialis'], { reps: [8, 15], inc: 1 }),
  E('band_curl', 'Curls mit Band', 'band bicep curl', 'biceps', ['band'], ['bizeps'], [],
    ['Auf das Band stellen', 'Ellbogen am Körper', 'Oben 1 s halten'], { load: 'bw', reps: [15, 25], inc: 0 }),
  E('kb_curl', 'Kettlebell-Curls', 'kettlebell curl', 'biceps', ['kettlebell'], ['bizeps'], [],
    ['Kettlebell an den Hörnern', 'Ellbogen fixiert', 'Langsam ab'], { reps: [8, 15], inc: 4 }),

  // ---------- Trizeps ----------
  E('oh_cable_ext', 'Trizepsstrecken über Kopf (Kabel)', 'overhead cable triceps extension', 'triceps', ['cable'], ['trizeps'], [],
    ['Rücken zum Kabel, Arme über Kopf', 'Tief in die Dehnung hinter dem Kopf', 'Ellbogen zeigen nach vorn'], { reps: [10, 15], inc: 1.25 }),
  E('db_oh_ext', 'Trizepsstrecken über Kopf (Kurzhantel)', 'overhead dumbbell triceps extension', 'triceps', ['dumbbell'], ['trizeps'], [],
    ['Hantel mit beiden Händen hinter dem Kopf', 'Ellbogen eng', 'Volle Dehnung unten'], { reps: [10, 15], inc: 2 }),
  E('pushdown', 'Trizepsdrücken am Kabel', 'triceps pushdown', 'triceps', ['cable'], ['trizeps'], [],
    ['Ellbogen am Körper', 'Unten voll strecken', 'Langsam hoch'], { reps: [10, 15], inc: 1.25 }),
  E('skullcrusher', 'French Press (SZ/Langhantel)', 'skull crusher', 'triceps', ['barbell', 'bench'], ['trizeps'], [],
    ['Stange hinter die Stirn absenken', 'Oberarme leicht nach hinten geneigt', 'Ellbogen nicht ausstellen'], { reps: [8, 12], inc: 2.5 }),
  E('diamond_pushup', 'Enge Liegestütze', 'diamond push up', 'triceps', [], ['trizeps'], ['brust'],
    ['Hände eng unter der Brust', 'Ellbogen am Körper', 'Volle Bewegung'], { load: 'bw', reps: [8, 20], inc: 0 }),
  E('band_pushdown', 'Trizepsdrücken mit Band', 'band triceps pushdown', 'triceps', ['band'], ['trizeps'], [],
    ['Band oben fixieren', 'Ellbogen am Körper', 'Unten voll strecken'], { load: 'bw', reps: [15, 25], inc: 0 }),

  // ---------- Core ----------
  E('hanging_leg_raise', 'Hängendes Beinheben', 'hanging leg raise', 'core', ['pullup'], ['bauch'], [],
    ['Ruhiger Hang, kein Schwung', 'Becken einrollen, Knie/Beine hoch', 'Langsam ab'], { load: 'bw', reps: [8, 15], inc: 0 }),
  E('cable_crunch', 'Kabel-Crunch', 'cable crunch', 'core', ['cable'], ['bauch'], [],
    ['Kniend, Seil am Kopf', 'Wirbelsäule einrollen, Hüfte bleibt', 'Langsam zurück'], { reps: [10, 15], inc: 2.5 }),
  E('pallof', 'Pallof Press', 'pallof press', 'core', ['cable'], ['bauch'], [],
    ['Seitlich zum Kabel', 'Griff vor die Brust, dann gerade wegdrücken', 'Rotation widerstehen, 2 s halten'], { reps: [10, 12], inc: 1.25 }),
  E('band_pallof', 'Pallof Press mit Band', 'band pallof press', 'core', ['band'], ['bauch'], [],
    ['Band seitlich fixieren', 'Wegdrücken und halten', 'Becken stabil'], { load: 'bw', reps: [10, 15], inc: 0 }),
  E('dead_bug', 'Dead Bug', 'dead bug', 'core', [], ['bauch'], [],
    ['Lendenwirbelsäule in den Boden drücken', 'Gegengleich Arm und Bein strecken', 'Langsam ausatmen'], { load: 'bw', reps: [8, 12], inc: 0 }),
  E('copenhagen', 'Copenhagen Plank', 'copenhagen plank', 'core', ['bench'], ['bauch'], [],
    ['Oberes Bein auf der Bank (Knie = leichter, Fuß = schwer)', 'Hüfte hochhalten', 'Wdh. = Sekunden pro Seite'], { load: 'bw', reps: [15, 30], inc: 0 }),
  E('farmer_walk', 'Farmer’s Walk', 'farmers walk', 'core', ['dumbbell'], ['bauch'], ['ruecken'],
    ['Schwere Hanteln, aufrecht gehen', 'Schultern unten, Rumpf fest', 'Wdh. = Meter ÷ 10'], { reps: [3, 4], inc: 2 }),
  E('ab_rollout_bw', 'Plank mit Armwechsel', 'plank shoulder tap', 'core', [], ['bauch'], [],
    ['Liegestützposition', 'Abwechselnd Schulter antippen', 'Becken bleibt ruhig'], { load: 'bw', reps: [16, 30], inc: 0 }),

  // ---------- Ausdauer ----------
  E('bike_sprints', 'Rad/Ruder-Intervalle kurz', 'assault bike sprint intervals', 'conditioning', ['cardio'], [], [],
    ['6–10 × 30 s hart / 90 s locker', 'Hart = ~90 % Maximalanstrengung', 'Nach dem Krafttraining'], { ...C, presc: '6–10 × 30 s hart / 90 s locker' }),
  E('interval_4x4', '4×4-Intervalle (Cardio-Gerät)', '4x4 interval training', 'conditioning', ['cardio'], [], [],
    ['4 × 4 min bei ~90 % HFmax, 3 min locker dazwischen', 'Sprechen nur noch in einzelnen Worten', 'Bester Reiz für die VO₂max'], { ...C, presc: '4 × 4 min hart / 3 min locker' }),
  E('zone2_cardio', 'Lockeres Ausdauertraining (Zone 2)', 'zone 2 cardio', 'conditioning', ['cardio'], [], [],
    ['20–40 min in lockerem Tempo', 'Unterhaltung in ganzen Sätzen möglich', 'Am besten an trainingsfreien Tagen oder separat'], { ...C, presc: '20–40 min locker' }),
  E('sprints', 'Sprints', 'sprint training', 'conditioning', ['space'], [], [],
    ['Gut aufwärmen, 2 Steigerungsläufe vorher', '6–8 × 40–60 m, volle Pause (Gehen zurück)', 'Maximal schnell, aber locker im Gesicht'], { ...C, presc: '6–8 × 40–60 m, Gehpause' }),
  E('shuttle_runs', 'Pendelläufe 5-10-5', 'pro agility shuttle 5-10-5', 'conditioning', ['space'], [], [],
    ['5 m – 10 m – 5 m mit Richtungswechsel', 'Tief in die Wende, Boden anfassen', '6–8 Läufe, 60 s Pause'], { ...C, presc: '6–8 Läufe, 60 s Pause' }),
  E('run_intervals', 'Lauf-Intervalle 4×4', 'running interval training', 'conditioning', ['space'], [], [],
    ['4 × 4 min zügig (~90 % HFmax)', '3 min Traben dazwischen', 'Alternative: 10 × 1 min hart / 1 min locker'], { ...C, presc: '4 × 4 min / 3 min Trab' }),
  E('kb_emom', 'Kettlebell-Swing EMOM', 'kettlebell swing emom', 'conditioning', ['kettlebell'], [], [],
    ['Jede Minute 15 Swings, Rest der Minute Pause', '8–12 Minuten', 'Saubere Hüftstreckung trotz Ermüdung'], { ...C, presc: '8–12 min: 15 Swings jede Minute' }),
  E('zone2_run', 'Lockerer Dauerlauf (Zone 2)', 'zone 2 running', 'conditioning', [], [], [],
    ['20–40 min locker laufen oder zügig gehen', 'Unterhaltung in ganzen Sätzen möglich', 'An trainingsfreien Tagen oder separat'], { ...C, presc: '20–40 min locker' }),
  E('bw_circuit','Körpergewicht-Intervalle', 'bodyweight hiit circuit', 'conditioning', [], [], [],
    ['40 s Arbeit / 20 s Pause, 8–12 Runden', 'Wechsel: Burpees, Mountain Climbers, Hampelmann, Squat Jumps', 'Hohe Herzfrequenz halten'], { ...C, presc: '8–12 × 40 s / 20 s' }),
  E('row_2k', 'Ruder-Pyramide', 'rowing machine intervals', 'conditioning', ['cardio'], [], [],
    ['250 – 500 – 750 – 500 – 250 m', 'Pause = halbe Arbeitszeit', 'Kraftvoller Beinstoß'], { ...C, presc: '250-500-750-500-250 m' }),

  // ---------- Laufeinheiten (Hauptteil) ----------
  E('run_easy', 'Lockerer Dauerlauf (Zone 2)', 'easy run zone 2', 'run', [], [], [],
    ['Tempo so, dass du in ganzen Sätzen reden kannst', 'Kurze, lockere Schritte, aufrecht laufen', 'Basis für Ausdauer und Erholung (ca. 80 % deiner Läufe)'], { cat: 'run', load: 'none', inc: 0, presc: '30–45 min locker' }),
  E('run_4x4', 'Intervalle 4 × 4 min', 'running 4x4 intervals', 'run', [], [], [],
    ['10 min einlaufen, 2–3 Steigerungen', '4 × 4 min bei ~90 % HFmax, 3 min Trab dazwischen', '10 min auslaufen – stärkster Reiz für die VO₂max'], { cat: 'run', load: 'none', inc: 0, presc: '10 min ein · 4 × 4 min hart / 3 min Trab · 10 min aus' }),
  E('run_3030', 'Kurze Intervalle 30/30', 'running 30 30 intervals', 'run', [], [], [],
    ['10 min einlaufen', '2 × 8 × 30 s schnell / 30 s Trab, 3 min Pause zwischen den Serien', 'Schnell, aber kontrolliert – nicht maximal sprinten'], { cat: 'run', load: 'none', inc: 0, presc: '10 min ein · 2 × 8 × 30 s schnell / 30 s Trab · 10 min aus' }),
  E('run_tempo', 'Tempolauf (Schwelle)', 'threshold tempo run', 'run', [], [], [],
    ['10 min einlaufen', '2 × 10 min „angenehm schwer“ (kurze Sätze möglich), 3 min Trab', '10 min auslaufen'], { cat: 'run', load: 'none', inc: 0, presc: '10 min ein · 2 × 10 min zügig / 3 min Trab · 10 min aus' }),
  E('run_fartlek', 'Fahrtspiel', 'fartlek run', 'run', [], [], [],
    ['Locker laufen und 8–10 × nach Gefühl beschleunigen', 'Tempowechsel 30–90 s, danach wieder locker', 'Spielerisch – gut, wenn du keine Lust auf Uhr hast'], { cat: 'run', load: 'none', inc: 0, presc: '35–45 min mit 8–10 Tempowechseln' }),
  E('run_sprints', 'Sprints & Steigerungen', 'sprint session', 'run', [], [], [],
    ['10 min einlaufen, Lauf-ABC, 4 Steigerungen', '6–8 × 40–60 m maximal schnell, zurückgehen als Pause', 'Volle Erholung – Qualität vor Menge, 5 min auslaufen'], { cat: 'run', load: 'none', inc: 0, presc: '10 min ein · 6–8 × 40–60 m Sprint · 5 min aus' }),
  E('run_long', 'Langer Lauf', 'long run', 'run', [], [], [],
    ['Locker, gleichmäßiges Tempo', 'Unterwegs trinken, wenn über 60 min', 'Höchstens etwa 1 × pro Woche'], { cat: 'run', load: 'none', inc: 0, presc: '50–75 min locker' }),

  // ---------- Mobilität (Aufwärmen) ----------
  E('worlds_greatest', 'World’s Greatest Stretch', 'worlds greatest stretch', 'warmup', [], [], [],
    ['Tiefer Ausfallschritt, Ellbogen zum Fuß', 'Oberkörper aufdrehen, Arm zur Decke', '5 je Seite'], { ...M, presc: '5 je Seite' }),
  E('hip_9090', 'Hüftrotation 90/90', '90 90 hip switch', 'warmup', [], [], [],
    ['Sitzen, beide Knie 90°', 'Knie von Seite zu Seite drehen', 'Aufrecht bleiben'], { ...M, presc: '8 je Seite' }),
  E('cat_cow', 'Katze-Kuh', 'cat cow', 'warmup', [], [], [],
    ['Vierfüßlerstand', 'Wirbel für Wirbel rund und hohl', 'Mit der Atmung'], { ...M, presc: '10 Wdh.' }),
  E('thoracic_rot', 'Brustwirbel-Rotation (Open Book)', 'open book thoracic rotation', 'warmup', [], [], [],
    ['Seitlage, Knie gebeugt', 'Oberen Arm wie ein Buch öffnen', 'Blick folgt der Hand'], { ...M, presc: '8 je Seite' }),
  E('ankle_mob', 'Sprunggelenk-Mobilisation', 'knee to wall ankle mobility', 'warmup', [], [], [],
    ['Knie zur Wand schieben, Ferse bleibt unten', 'Langsam vor und zurück', 'Wichtig für tiefe Kniebeugen'], { ...M, presc: '10 je Seite' }),
  E('leg_swings', 'Beinpendel', 'leg swings', 'warmup', [], [], [],
    ['Vor/zurück und seitlich', 'Locker steigern', 'Oberkörper ruhig'], { ...M, presc: '10 je Richtung/Bein' }),
  E('inchworm', 'Inchworm', 'inchworm', 'warmup', [], [], [],
    ['Mit gestreckten Beinen nach vorn laufen', 'Liegestützposition, zurücklaufen', 'Dehnt Beinbeuger, aktiviert Schultern'], { ...M, presc: '6 Wdh.' }),
  E('band_pull_apart', 'Band Pull-Apart', 'band pull apart', 'warmup', ['band'], [], [],
    ['Arme gestreckt vor der Brust', 'Band auseinanderziehen, Schulterblätter zusammen', 'Langsam zurück'], { ...M, presc: '15 Wdh.' }),
  E('arm_circles', 'Armkreisen & Schulter-Dislokationen', 'shoulder dislocates', 'warmup', [], [], [],
    ['Große Armkreise vor/zurück', 'Mit Stock/Handtuch über Kopf nach hinten führen', 'Schmerzfrei bleiben'], { ...M, presc: '10 je Richtung' }),
  E('glute_bridge_wu', 'Glute Bridge (Aktivierung)', 'glute bridge', 'warmup', [], [], [],
    ['Becken hoch, 2 s halten', 'Gesäß aktiv', 'Kein Hohlkreuz'], { ...M, presc: '12 Wdh.' }),
  E('a_skips', 'A-Skips & Kniehebelauf', 'a skips drill', 'warmup', [], [], [],
    ['Lauf-ABC auf 15–20 m', 'Fußgelenk aktiv, Knie hoch', 'Vor Sprüngen und Sprints'], { ...M, presc: '2 × 20 m' }),

  // ---------- Mobilität (Cool-down) ----------
  E('couch_stretch', 'Couch Stretch', 'couch stretch', 'cooldown', [], [], [],
    ['Hinteres Knie an der Wand, Fuß hoch', 'Gesäß anspannen, Hüfte nach vorn', 'Dehnt Hüftbeuger & Quadrizeps'], { ...M, presc: '60 s je Seite' }),
  E('pigeon', 'Taube (Pigeon Stretch)', 'pigeon stretch', 'cooldown', [], [], [],
    ['Vorderes Bein quer, hinteres lang', 'Oberkörper nach vorn sinken lassen', 'Ruhig atmen'], { ...M, presc: '60 s je Seite' }),
  E('ham_stretch', 'Beinbeuger-Dehnung', 'hamstring stretch', 'cooldown', [], [], [],
    ['Ferse auf erhöhter Fläche', 'Mit geradem Rücken aus der Hüfte vorbeugen', 'Kein Ziehen im Knie'], { ...M, presc: '45 s je Seite' }),
  E('lat_stretch', 'Lat-Dehnung', 'lat stretch', 'cooldown', [], [], [],
    ['An Stange/Rahmen festhalten', 'Hüfte nach hinten-seitlich schieben', 'In die Seite atmen'], { ...M, presc: '45 s je Seite' }),
  E('doorway_stretch', 'Brustdehnung im Türrahmen', 'doorway chest stretch', 'cooldown', [], [], [],
    ['Unterarm am Türrahmen, Ellbogen auf Schulterhöhe', 'Langsam nach vorn lehnen', 'Schulter nicht nach vorn rollen'], { ...M, presc: '45 s je Seite' }),
  E('childs_pose', 'Kindhaltung mit Seitneigung', 'childs pose', 'cooldown', [], [], [],
    ['Gesäß zu den Fersen', 'Arme lang, dann zur Seite wandern', 'Tief in den Bauch atmen'], { ...M, presc: '60 s' }),
  E('deep_squat_hold', 'Tiefe Hocke halten', 'deep squat hold', 'cooldown', [], [], [],
    ['Fersen am Boden, Ellbogen drücken Knie auseinander', 'Aufrecht bleiben', 'Gern festhalten'], { ...M, presc: '60 s' }),
  E('calf_stretch', 'Wadendehnung an der Wand', 'calf stretch', 'cooldown', [], [], [],
    ['Hinteres Bein gestreckt, Ferse unten', 'Dann Knie beugen (Soleus)', 'Ruhig halten'], { ...M, presc: '30 s je Position' }),
];

export const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function available(ex, equip) {
  return ex.equip.every((q) => equip.includes(q));
}

export function videoSearchUrl(ex) {
  const q = `${ex.en} proper form technique`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

// Extrahiert die Video-ID aus allen gängigen YouTube-Link-Formaten.
export function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
