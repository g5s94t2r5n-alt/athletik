# Regelwerk – Trainingsplanung (Muskelaufbau 70 % / Athletik 30 %)

Dieses Dokument ist die wissenschaftliche Grundlage der App. Die Regeln stecken an zwei Stellen:

- `js/engine.js` – lokaler Plan-Generator und Progressionslogik (funktioniert offline)
- `js/coach.js` – Systemprompt für Claude (erstellt Einheiten und Wochen-Checks)

Die Regeln sind Vereinfachungen der Studienlage (Stand Ende 2026). Sie ersetzen keine
ärztliche Abklärung bei Beschwerden.

---

## 1. Muskelaufbau

| Stellgröße | Regel in der App | Grundlage |
|---|---|---|
| Wochenvolumen | 10–20 harte Sätze pro Muskelgruppe/Woche; Start bei ~12, Steigerung im Block | Schoenfeld et al. 2017 (Dosis-Wirkung Volumen); Pelland et al. 2024 (Meta-Regression Volumen & Frequenz) |
| Frequenz | Jede Muskelgruppe 2×/Woche (Ober-/Unterkörper-Split bzw. Ganzkörper) | Schoenfeld, Ogborn & Krieger 2016 (Frequenz-Metaanalyse); Pelland et al. 2024 |
| Intensität | Sätze bis ca. 1–3 Wdh. vor Muskelversagen | Refalo et al. 2023 (Nähe zum Muskelversagen) |
| Wiederholungen | Grundübungen 5–10, Isolation 8–15 (bis 20); breiter Bereich ist gleich wirksam | Schoenfeld et al. 2021 („Repetition Continuum“ neu bewertet) |
| Pausen | Grundübungen 2–3 min, Isolation 60–90 s | Schoenfeld et al. 2016 (längere Satzpausen) |
| Übungsauswahl | Übungen mit Belastung in gedehnter Position bevorzugen (z. B. RDL, Schrägbankdrücken, Overhead-Trizeps, Beinbeuger sitzend) | Maeo et al. 2021/2023 (Training bei langer Muskellänge) |
| Progression | Doppelte Progression (siehe Abschnitt 4) | Gängige Praxis, deckt sich mit Progressive Overload |
| Deload | Nach 4 Belastungswochen 1 Woche mit ~50 % Volumen und ~10 % weniger Gewicht, früher bei Leistungsabfall | Bell et al. 2023 (Delphi-Konsens zum Deloading) |

## 2. Athletik (Schnellkraft, Ausdauer, Mobilität)

| Bereich | Regel in der App | Grundlage |
|---|---|---|
| Schnellkraft | Am Anfang der Einheit (ermüdungsfrei): 3–5 Sätze × 3–5 Wdh. Sprünge, Würfe, Swings oder explosive Hantelvarianten, volle Pause (~2 min) | Sáez de Villarreal et al. 2009 (Plyometrie & Sprunghöhe); Slimani et al. 2016 |
| Kombination Kraft + Ausdauer | Ausdauer stört den Muskelaufbau kaum, die Explosivkraft aber schon, besonders in derselben Einheit → Intervalle nach dem Krafttraining oder an eigenen Tagen, nie davor | Schumann et al. 2022 (Metaanalyse zum Concurrent Training) |
| Ausdauer | 2 Reize/Woche: 1× Intervalle (z. B. 4×4 min oder 6–10×30 s), 1× locker/Zone 2 (20–40 min), sonst als kurzer Finisher | Milanović et al. 2015 (HIIT & VO₂max); Stöggl & Sperlich 2014 (polarisiertes Training) |
| Mobilität | Vor dem Training: dynamisch (RAMP-Aufwärmen). Danach oder separat: statisches Dehnen bzw. Krafttraining über die volle Bewegungsamplitude | Behm et al. 2016 (akute Wirkung von Dehnen); Afonso et al. 2021 (Krafttraining vs. Dehnen für die Beweglichkeit) |

### Nachgetragene Trainings (HIIT, Joggen, Yoga, Kurse, CrossFit, Padel …)

| Regel in der App | Grundlage |
|---|---|
| Last jeder Einheit = Minuten × Anstrengung (leicht 3 / mittel 5 / hart 8) | Session-RPE-Methode, Foster et al. 2001 |
| Hartes Ausdauertraining (oder ≥ 45 min mittel) in den letzten 48 h → kein Ausdauer-Finisher | Interferenz Ausdauer ↔ Explosivkraft, Schumann et al. 2022 |
| Schon ≥ 2 Ausdauer-Reize in dieser Woche → kein Finisher nötig | Ziel ~2 Reize/Woche (s. o.) |
| Harte Beinbelastung (HIIT, Joggen, CrossFit, Padel, Teamsport) in den letzten 48 h → 1 Sprung-Satz weniger | Ermüdung mindert Sprungqualität; Plyometrie braucht Frische |
| Claude sieht alle Trainings der letzten 14 Tage und bewertet die Gesamtlast im Wochen-Check | – |

### Laufeinheit

| Regel in der App | Grundlage |
|---|---|
| Polarisiert: ca. 80 % locker (Zone 2), höchstens 1–2 harte Läufe pro Woche | Stöggl & Sperlich 2014 |
| Automatischer Lauftyp: nach hartem Training (≤ 48 h), nach hartem letzten Lauf (< 4 Tage) oder im Deload → locker; sonst rotierend 4×4, Tempo, 30/30, Sprints, Fahrtspiel | Polarisiertes Training; 4×4-Intervalle als starker VO₂max-Reiz (Helgerud et al. 2007) |
| Laufeinheit = Aufwärmen, Laufen, Dehnen – keine Kraftübungen danach; Kraft für Läufer (einbeinig, Waden, Rumpf, Plyometrie) steckt in den Ganzkörper-Einheiten des Wochenplans | Krafttraining verbessert die Laufökonomie (Balsalobre-Fernández et al. 2016) |
| Läufe zählen als Ausdauerreiz (Session-RPE) und fließen in die Interferenz-Regeln und den Wochen-Check ein | Foster et al. 2001 |

## 3. Aufbau einer Einheit

1. **Aufwärmen & Mobilität** (5–8 min): dynamisch, auf die Einheit abgestimmt
2. **Schnellkraft-Block** (8–12 min): explosiv, wenige Wiederholungen, volle Pausen
3. **Kraft/Hypertrophie** (40–55 min): 1–2 Grundübungen, dann 3–4 Ergänzungs- und Isolationsübungen
4. **Ausdauer-Finisher** (0–12 min): Intervalle oder lockeres Cardio
5. **Cool-down-Mobilität** (3–5 min)

Die Übungen hängen von dem Equipment ab, das du vor dem Training auswählst.

## 3a. Trainingsziele

Das Ziel legt fest, welche Einheiten in einer Woche vorkommen (bei z. B. 4 Tagen) und wie trainiert wird:

| Ziel | Woche (4 Tage) | Besonderheiten |
|---|---|---|
| Muskelaufbau & Athletik | Unterkörper A/B, Oberkörper A/B | 70/30, Ausdauer-Finisher, Volumen 10–20 Sätze |
| Kraftaufbau | Unterkörper A/B, Oberkörper A/B | Grundübungen 3–6 Wdh. (Ergänzung 5–8), 2,5–3,5 min Pause, kein Finisher |
| Ausdauer aufbauen | 2 × Lauf, 2 × Ganzkörper | Polarisiert, Kraft mit ~65 % Volumen zum Erhalt |
| Marathon-Vorbereitung | 3 × Lauf, 1 × Ganzkörper | Wöchentlicher langer Lauf (auch im Deload, dann kürzer), Tempo/Intervalle, Kraft kurz (~60 % Volumen); Tapering in den letzten 14 Tagen (−30 % Volumen, kein langer Lauf ab 10 Tagen, nur locker ab 3 Tagen) |
| HYROX | 2 × Ganzkörper, 1 × Lauf, 1 × HYROX | HYROX-Einheit: 1-km-Läufe im Wechsel mit Stationen (Compromised Running), alle 8 Stationen rotieren, Kraft ~70 % Volumen, Tapering vor dem Wettkampf |
| Allgemeine Fitness | 3 × Ganzkörper, 1 × Lauf | Moderates Volumen (~90 %, Ziel ≥ 6 Sätze/Muskel), Läufe abwechselnd locker und fordernd |
| Sportartspezifisch | je nach Saisonphase (s. u.) | Sportart (Fußball, Handball, Basketball, Volleyball, Tennis/Padel), Saisonphase und optional fester Spieltag |
| Abnehmen | 3 × Ganzkörper, 1 × Lauf | Krafttraining bleibt (Muskelerhalt im Kaloriendefizit, ~85 % Volumen), Läufe überwiegend locker + Intervalle, Finisher; optionales Zielgewicht, angestrebtes Tempo 0,5–1 % Körpergewicht pro Woche (Anzeige im Fortschritt), Hinweise zu Alltagsbewegung und Protein (1,6–2,2 g/kg) über Claude |

Hinweise: Bei 5–6 Tagen ergänzen Athletik- bzw. Regenerationstage den Plan, damit die 48-h-Regel einhaltbar bleibt. Mit nur 2 Tagen sind ca. 6–9 Sätze pro Muskel und Woche realistisch (wirksam, aber unter dem Optimum).

### Sportartspezifisch

Teamtrainings und Spiele werden nachgetragen („Teamtraining“, „Spiel / Match“) und zählen zur Belastung (Beine, Ausdauer). Die App plant die Athletik drumherum:

| Saisonphase | Woche (4 Tage) | Besonderheiten |
|---|---|---|
| Vorbereitung | Unterkörper Sport, Oberkörper Sport, Speed & Spielausdauer, Oberkörper Sport | Grundübungen schwer (3–6 Wdh., 2 Wdh. Reserve), ~80 % Volumen, Sprünge/Sprints/Richtungswechsel mit vollen Pausen, wiederholte Sprints als Spielausdauer |
| Saison | Unterkörper Sport, Oberkörper Sport, Speed & Spielausdauer, Regeneration | Erhalt: 2–3 Sätze pro Übung (~60 % Volumen), schwer, 3 Wdh. Reserve, kein Muskelversagen, kein Finisher (Teamtraining deckt Ausdauer ab). Bei 2 Tagen genügen Unter- und Oberkörper – schon 1 Krafteinheit pro Woche erhält Kraft und Sprint in der Saison (Rønnestad 2011) |
| Saisonpause | wie Muskelaufbau (Unterkörper A/B, Oberkörper A/B), ab 5 Tagen + Speed | Hypertrophie, volles Volumen, Finisher; Prävention läuft weiter |

**Spieltag** (fester Wochentag und/oder nachgetragenes Spiel, nicht in der Saisonpause):
- Spieltag (MD) und Tag danach (MD+1): Regeneration – am Spieltag nur Mobilität, danach locker + Mobilität.
- Tag vor dem Spiel (MD-1): **Aktivierung** (~30 min): 2–3 Sätze à 2–3 explosive Sprünge/Antritte, volle Pausen, kein Ausdauerteil, kein Muskelkater.
- Zwei Tage vorher (MD-2): keine Einheit, die die Beine ermüdet – Oberkörper oder locker.
- Schwere Beine also an MD-3 oder früher – Kraft- und Schnelligkeitsreize so legen, dass sie bis zum Spiel verarbeitet sind.

**Aufbau der Sport-Einheiten:** Sprints, Sprünge und Richtungswechsel zuerst (ausgeruht, Qualität vor Menge), dann Grundübungen, einbeinige Übungen und Prävention. Bei „Speed & Spielausdauer“ kommen die wiederholten Sprints (z. B. 2–3 × 6 × 20–30 m, 20 s Pause) direkt nach den Drills und **vor** Nordic Curls – nie mit ermüdeten Beinbeugern sprinten.

**Je Sportart** (Reihenfolge der Übungsauswahl und Gewichtung):

| Sportart | Schwerpunkte | Prävention |
|---|---|---|
| Fußball | Antritt, wiederholte Sprints, Richtungswechsel (5-0-5), Weit-/Seitsprünge, Rotationswurf | Nordic Hamstring Curls in allen Einheiten (halbiert die Rate an Beinbeugerverletzungen, van Dyk 2019; van der Horst 2015), Copenhagen Plank (−41 % Leistenprobleme, Harøy 2019), Landetechnik und Gleichgewicht (FIFA 11+, Soligard 2008) |
| Handball | Überkopf- und Rotationswürfe, Strecksprung, seitliche Schnelligkeit | Schulter-Außenrotation (3 Sätze, hohe Priorität; −28 % Schulterprobleme, Andersson 2017), Landetechnik, Nordic Curls |
| Basketball | Sprung mit Anlauf, Niedersprung (reaktiv), seitliche Schritte + Antritt | Landetechnik/Kniekontrolle (Kreuzband, Hewett 1999), Gleichgewicht/Sprunggelenk (McGuine & Keene 2006), Waden |
| Volleyball | Anlauf- und Strecksprung, Überkopfwurf, Slams | Schulter-Außenrotation, Landetechnik, Sprunggelenk |
| Tennis / Padel | Rotationswürfe, Seitsprünge, Pogo-Sprünge, Anti-Rotation | Schulter-Außenrotation |

Plyometrie verbessert bei Teamsportlern Sprung, Sprint und Richtungswechsel (Slimani 2016); höhere Maximalkraft geht mit besserem Sprint und Sprung einher (Seitz 2014, Suchomel 2016). 4×4-Intervalle verbessern bei Fußballern VO₂max und Laufleistung im Spiel (Helgerud 2001).

Kraft vor Ausdauer-Zielen: Krafttraining verbessert die Laufökonomie (Balsalobre-Fernández et al. 2016) und wird deshalb auch bei Lauf-Zielen beibehalten.

## 3b. Welche Einheit heute? (Stern ★)

Keine feste Reihenfolge – die App empfiehlt jedes Mal neu:

1. **Erholung:** Eine Körperregion (Unter-/Oberkörper) wird frühestens nach ~48 h wieder hart trainiert – auch dann nicht, wenn eine Einheit dieser Region im Wochenplan noch fehlt (dann erholte Einheit oder locker). Nachgetragene Beinbelastung (HIIT, Joggen, Padel …) zählt für den Unterkörper mit; bei Lauf-Zielen zählt ein Lauf nur 24 h („harte Tage hart, lockere Tage locker“). Athletik-Tage belasten nur die Beine, Regenerationstage gar nicht.
2. **Wochenplan des Ziels:** Einheiten, die diese Woche laut Ziel noch fehlen (z. B. der 3. Lauf beim Marathon), bekommen Vorrang. Bei Muskel-/Kraft-/Fitness-Zielen zählen zusätzlich Muskeln unter 10 Sätzen in den letzten 7 Tagen.
3. **Abwechslung:** Innerhalb einer Region wechseln A- und B-Variante.
4. **Schlüsseleinheit:** Bei Gleichstand gewinnt die Kerneinheit des Ziels (HYROX-Einheit bzw. Lauf beim Marathon).
5. **Alles noch müde?** Dann empfiehlt die App eine lockere Laufeinheit (aktive Erholung) bzw. den Regenerationstag.
6. **Wettkampfwoche:** In den letzten 3 Tagen vor dem Wettkampf nur noch kurz locker laufen oder Pause.
7. **Spieltag (Sportart-Ziel):** Spieltag und Tag danach Regeneration, Tag vorher Aktivierung, zwei Tage vorher keine schweren Beine (s. 3a). Die Spieltag-Regel hat Vorrang vor dem Wochenplan.

Geprüft mit `tools/simulate.js`: alle Ziele inkl. Sportart (3 Saisonphasen, mit und ohne Spieltag) × 2–6 Trainingstage × 3 Startbedingungen über je 8 Wochen (inkl. Deload und Tapering) – alle Prüfungen bestanden.

## 4. Anpassung (die „lernende“ Komponente)

Du trägst nur **Gewicht und Wiederholungen** ein. Daraus leitet die App ab:

- **Doppelte Progression pro Übung:** Hast du in allen Sätzen das obere Ende des
  Wiederholungsbereichs erreicht, steigt das Gewicht beim nächsten Mal
  (Langhantel +2,5 kg, Kurzhantel/Kabel +1–2 kg). Liegst du unter dem unteren Ende,
  bleibt das Gewicht gleich; passiert das zweimal in Folge, sinkt es um ~5 %.
- **Geschätztes 1RM** (Epley-Formel) für jede Übung, das zeigt deinen Trend im Fortschritt-Tab.
- **Richtwerte in kg** für jede Hantelübung:
  1. Übung schon gemacht → Fortschreibung deiner letzten Gewichte (doppelte Progression, s. o.).
  2. Neue Übung → Hochrechnung aus deinen bisherigen Leistungen: persönlicher Kraftfaktor (Median der letzten 1RM-Schätzungen im Verhältnis zu Referenzwerten, bevorzugt gleiche Körperregion) × Referenzwert der neuen Übung.
  3. Noch keine Daten → Referenzwert × Körpergewicht × Niveau (Einsteiger 0,6 / leicht fortgeschritten 0,8 / fortgeschritten 1,0 / sehr erfahren 1,1 / Leistungssportler 1,15 / Profi/Elite 1,25) × Geschlecht.
  Aus dem geschätzten 1RM wird das Arbeitsgewicht für die Mitte des Wdh.-Bereichs plus Wdh. in Reserve berechnet (Epley): Muskel-/Kraft-/Fitness-Ziele 2, Ausdauer-/Marathon-/HYROX-Ziele 3 Wdh. Reserve. Kraftaufbau nutzt 3–6 Wdh. → höhere Gewichte. Deload −10 %.
- **Eintragen:** Ein Satz zählt, sobald Wdh. (und bei Hantelübungen das Gewicht) eingetragen sind – Abhaken ist optional.
- **Stagnation:** Bleibt das geschätzte 1RM über 3 Einheiten derselben Übung
  gleich oder sinkt, schlägt die App eine Variante vor.
- **Block-Periodisierung:** Woche 1–4 Belastung, das Volumen steigt von Woche zu Woche
  (+1 Satz bei den Hauptübungen ab Woche 3). Woche 5 ist der Deload.
- **Wochen-Check mit Claude:** Claude wertet Volumen pro Muskel, Leistungstrends und
  Körpergewicht aus und gibt Anpassungen (± Sätze pro Muskel, Fokus, Deload).
  Diese fließen in jede weitere Planung ein.

## 5. Rekorde & Rückmeldung nach dem Training

- **Rekorde:** Beim Abschließen vergleicht die App jede Übung mit allen früheren Einheiten – höheres geschätztes 1RM (Epley) oder schwerster Satz, beim Laufen längste Strecke und schnellste Pace (ab 3 km). Rekorde werden gefeiert, im Verlauf markiert und im Fortschritt gelistet.
- **Belastung automatisch:** Aus den eingetragenen Wdh. – ≥ 50 % der Kraftsätze unter dem Wdh.-Ziel = zu schwer → nächste Einheit 1 Satz weniger pro Übung, kein Finisher, nächster Lauf locker; zweimal innerhalb kurzer Zeit → Deload-Charakter (−10 % Gewicht). ≥ 80 % am oberen Ende = zu leicht → Hauptübungen +1 Satz.
- **Kurze Umfrage:** „Hat es dir gefallen?“ (bei „nein“: nächstes Mal andere Varianten dieser Einheit, einzelne Übungen dauerhaft ausblendbar) und „Beschwerden?“ (Knie, Schulter, Rücken, Ellbogen, Hüfte → belastende Übungen 7 Tage lang ersetzt bzw. weggelassen; Hinweis auf ärztliche Abklärung bei anhaltenden Schmerzen).
- Claude bekommt Belastung, Gefallen und Beschwerden der letzten Einheiten; ausgeblendete und schmerzauslösende Übungen sind aus seinem Übungskatalog entfernt.

## Quellen

- Afonso J. et al. (2021). Strength Training versus Stretching for Improving Range of Motion: A Systematic Review and Meta-Analysis. *Healthcare*.
- Andersson S.H. et al. (2017). Preventing overuse shoulder injuries among throwing athletes: a cluster-randomised controlled trial in 660 elite handball players. *Br J Sports Med*.
- Balsalobre-Fernández C., Santos-Concejero J., Grivas G.V. (2016). Effects of Strength Training on Running Economy in Highly Trained Runners: A Systematic Review With Meta-Analysis of Controlled Trials. *J Strength Cond Res*.
- Behm D.G. et al. (2016). Acute effects of muscle stretching on physical performance, range of motion, and injury incidence. *Appl Physiol Nutr Metab*.
- Bell L. et al. (2023). Integrating Deloading into Strength and Physique Sports Training Programmes: An International Delphi Consensus Approach. *Sports Medicine – Open*.
- van Dyk N., Behan F.P., Whiteley R. (2019). Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries: a systematic review and meta-analysis of 8459 athletes. *Br J Sports Med*.
- Foster C. et al. (2001). A New Approach to Monitoring Exercise Training. *J Strength Cond Res*.
- Harøy J. et al. (2019). The Adductor Strengthening Programme prevents groin problems among male football players: a cluster-randomised controlled trial. *Br J Sports Med*.
- Helgerud J. et al. (2001). Aerobic endurance training improves soccer performance. *Med Sci Sports Exerc*.
- Helgerud J. et al. (2007). Aerobic High-Intensity Intervals Improve VO₂max More Than Moderate Training. *Med Sci Sports Exerc*.
- Hewett T.E. et al. (1999). The effect of neuromuscular training on the incidence of knee injury in female athletes. *Am J Sports Med*.
- van der Horst N. et al. (2015). The Preventive Effect of the Nordic Hamstring Exercise on Hamstring Injuries in Amateur Soccer Players: A Randomized Controlled Trial. *Am J Sports Med*.
- Maeo S. et al. (2021). Greater Hamstrings Muscle Hypertrophy but Similar Damage Protection after Training at Long versus Short Muscle Lengths. *Med Sci Sports Exerc*.
- McGuine T.A., Keene J.S. (2006). The effect of a balance training program on the risk of ankle sprains in high school athletes. *Am J Sports Med*.
- Milanović Z., Sporiš G., Weston M. (2015). Effectiveness of High-Intensity Interval Training and Continuous Endurance Training for VO₂max Improvements. *Sports Medicine*.
- Pelland J. et al. (2024). The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gain. *SportRxiv (Preprint)*.
- Refalo M.C. et al. (2023). Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy. *Sports Medicine*.
- Rønnestad B.R. et al. (2011). In-season strength maintenance training increases well-trained soccer players' performance. *J Strength Cond Res*.
- Sáez de Villarreal E. et al. (2009). Determining variables of plyometric training for improving vertical jump height performance: a meta-analysis. *J Strength Cond Res*.
- Schoenfeld B.J. et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. *J Strength Cond Res*.
- Schoenfeld B.J. et al. (2021). Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum. *Sports*.
- Schoenfeld B.J., Ogborn D., Krieger J.W. (2016). Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy. *Sports Medicine*.
- Schoenfeld B.J., Ogborn D., Krieger J.W. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. *J Sports Sci*.
- Schumann M. et al. (2022). Compatibility of Concurrent Aerobic and Strength Training for Skeletal Muscle Size and Function: An Updated Systematic Review and Meta-Analysis. *Sports Medicine*.
- Seitz L.B. et al. (2014). Increases in lower-body strength transfer positively to sprint performance: a systematic review with meta-analysis. *Sports Medicine*.
- Slimani M. et al. (2016). Effects of Plyometric Training on Physical Fitness in Team Sport Athletes: A Systematic Review. *J Hum Kinet*.
- Soligard T. et al. (2008). Comprehensive warm-up programme to prevent injuries in young female footballers: cluster randomised controlled trial. *BMJ*.
- Stöggl T., Sperlich B. (2014). Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. *Front Physiol*.
- Suchomel T.J., Nimphius S., Stone M.H. (2016). The Importance of Muscular Strength in Athletic Performance. *Sports Medicine*.
