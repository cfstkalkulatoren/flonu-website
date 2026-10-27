/* Flonu Biofeedback-Analyse. Logik unverändert aus dem Original-Kalkulator übernommen, zweisprachig. */
(function () {
  'use strict';
  var root = document.querySelector('[data-bio]');
  if (!root) return;
  var T = function (o) { return window.Flonu ? window.Flonu.t(o) : o.de; };

  var SLIDERS = [
    { id: 'hunger', bad: true, label: { de: 'Hunger', en: 'Hunger' }, lo: { de: 'Kein Hunger', en: 'No hunger' }, hi: { de: 'Extremer Hunger', en: 'Extreme hunger' } },
    { id: 'energy', bad: false, label: { de: 'Energie', en: 'Energy' }, lo: { de: 'Erschöpft', en: 'Exhausted' }, hi: { de: 'Voller Energie', en: 'Full of energy' } },
    { id: 'stress', bad: true, label: { de: 'Stress', en: 'Stress' }, lo: { de: 'Entspannt', en: 'Relaxed' }, hi: { de: 'Sehr gestresst', en: 'Highly stressed' } },
    { id: 'cravings', bad: true, label: { de: 'Cravings / Heißhunger', en: 'Cravings' }, lo: { de: 'Keine', en: 'None' }, hi: { de: 'Sehr stark', en: 'Intense' } },
    { id: 'digestion', bad: false, label: { de: 'Verdauung', en: 'Digestion' }, lo: { de: 'Probleme', en: 'Problems' }, hi: { de: 'Sehr gut', en: 'Excellent' } },
    { id: 'sleep', bad: false, label: { de: 'Schlafqualität', en: 'Sleep quality' }, lo: { de: 'Schlecht', en: 'Poor' }, hi: { de: 'Sehr gut', en: 'Excellent' } },
    { id: 'bodyimage', bad: false, label: { de: 'Körperbild', en: 'Body image' }, lo: { de: 'Negativ', en: 'Negative' }, hi: { de: 'Sehr positiv', en: 'Positive' } }
  ];
  var DIR = { bad: { de: 'höher = schlechter', en: 'higher = worse' }, good: { de: 'höher = besser', en: 'higher = better' } };

  var gender = null;
  var vals = { hunger: 5, energy: 5, stress: 5, cravings: 5, digestion: 5, sleep: 5, bodyimage: 5 };
  var showingResults = false;

  function color(id, v) {
    var bad = id === 'hunger' || id === 'stress' || id === 'cravings';
    if (bad) return v <= 3 ? '#75a151' : (v <= 6 ? '#fcc246' : '#c83e61');
    return v >= 7 ? '#75a151' : (v >= 5 ? '#fcc246' : '#c83e61');
  }

  function buildSliders() {
    var box = root.querySelector('[data-sliders]');
    box.innerHTML = SLIDERS.map(function (s) {
      var v = vals[s.id];
      return '<div class="slider" style="--sc:' + color(s.id, v) + ';--p:' + ((v - 1) / 9 * 100) + '%">' +
        '<div class="slider__head"><label for="bf-' + s.id + '">' + T(s.label) + '<small>' + T(s.bad ? DIR.bad : DIR.good) + '</small></label>' +
        '<span class="slider__val" data-v="' + s.id + '">' + v + '</span></div>' +
        '<input type="range" min="1" max="10" step="1" value="' + v + '" id="bf-' + s.id + '" data-id="' + s.id + '">' +
        '<div class="slider__hints"><span>' + T(s.lo) + '</span><span>' + T(s.hi) + '</span></div></div>';
    }).join('');
  }

  root.addEventListener('input', function (e) {
    var r = e.target.closest('input[type="range"]');
    if (!r) return;
    var id = r.getAttribute('data-id');
    vals[id] = parseInt(r.value, 10);
    var wrap = r.closest('.slider');
    wrap.style.setProperty('--sc', color(id, vals[id]));
    wrap.style.setProperty('--p', ((vals[id] - 1) / 9 * 100) + '%');
    wrap.querySelector('[data-v]').textContent = vals[id];
  });

  root.addEventListener('click', function (e) {
    var opt = e.target.closest('.opt');
    if (opt) {
      gender = opt.getAttribute('data-val');
      var all = opt.parentNode.querySelectorAll('.opt');
      for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-pressed', all[i] === opt ? 'true' : 'false');
      root.querySelector('[data-bio-err]').textContent = '';
      return;
    }
    if (e.target.closest('[data-analyze]')) {
      if (!gender) { root.querySelector('[data-bio-err]').textContent = T({ de: 'Bitte wähle zuerst dein biologisches Geschlecht.', en: 'Please choose your biological sex first.' }); return; }
      showingResults = true; renderResults(true); return;
    }
    if (e.target.closest('[data-bio-reset]')) reset();
  });

  function C(id, sev, icon, title, text, ev) { return { id: id, sev: sev, icon: icon, title: title, text: text, ev: ev || null }; }

  function analyze() {
    var hunger = vals.hunger, energy = vals.energy, stress = vals.stress, cravings = vals.cravings, digestion = vals.digestion, sleep = vals.sleep, bodyimage = vals.bodyimage;
    var highHunger = hunger >= 6, lowEnergy = energy <= 5, highStress = stress >= 7, highCravings = cravings >= 5,
      poorDigestion = digestion <= 5, poorSleep = sleep <= 5, lowBodyImage = bodyimage <= 6;
    var cards = [], used = {};

    if (poorDigestion && lowEnergy && highHunger) {
      cards.push(C('p1', 'HIGH', '⚡', { de: 'Mögliche Unterversorgung', en: 'Possible under-fuelling' },
        { de: 'Dein Körper sendet starke Signale: Er bekommt wahrscheinlich nicht genug. Ziel: mind. 40 kcal pro kg Körpergewicht täglich. Struktur: 3 Mahlzeiten und 1 bis 2 Snacks, jede davon mit einer Proteinquelle wie Eier, Hähnchen, Tofu, Quark oder Hülsenfrüchte. Keine Mahlzeit auslassen. Auch fehlender Hunger kann ein Zeichen von Unterversorgung sein.', en: 'Your body is sending strong signals: it is probably not getting enough. Target: at least 40 kcal per kg of body weight per day. Structure: 3 meals and 1 to 2 snacks, each with a protein source such as eggs, chicken, tofu, quark or legumes. Do not skip meals. A lack of hunger can also be a sign of under-fuelling.' },
        { de: 'Chronische Unterversorgung senkt den Grundumsatz und erhöht den Cortisolspiegel. Gleichzeitig leidet die Verdauung, weil weniger Verdauungsenzyme produziert werden. Die Kombination aus niedrigem Hunger, niedriger Energie und schlechter Verdauung ist ein klassisches Muster adaptiver Thermogenese: Der Körper fährt auf Sparflamme.', en: 'Chronic under-fuelling lowers your basal metabolic rate and raises cortisol. Digestion suffers too, because fewer digestive enzymes are produced. The combination of low hunger, low energy and poor digestion is a classic pattern of adaptive thermogenesis: the body switches to energy-saving mode.' }));
      used.p1 = 1;
    }
    if (!used.p1 && highHunger && highCravings && lowEnergy) {
      cards.push(C('p2a', 'HIGH', '🍽️', { de: 'Mahlzeitenstruktur fehlt', en: 'Meal structure is missing' },
        { de: '3 Hauptmahlzeiten und 2 Snacks täglich, jede Mahlzeit um eine Proteinquelle gebaut. Frühstück: Ei oder Joghurt. Mittag: Hähnchen oder Linsen. Abend: Fisch oder Hülsenfrüchte. Snacks: Quark mit Obst, Nüsse mit Käse. Kohlenhydrate nicht weglassen. Sie stabilisieren Energie und Stimmung.', en: '3 main meals and 2 snacks a day, each built around a protein source. Breakfast: eggs or yoghurt. Lunch: chicken or lentils. Dinner: fish or legumes. Snacks: quark with fruit, nuts with cheese. Keep the carbs. They steady energy and mood.' },
        { de: 'Unregelmäßige Mahlzeiten destabilisieren den Blutzucker und erhöhen die Ausschüttung von Ghrelin, dem Hungerhormon. Protein pro Mahlzeit verlangsamt die Magenentleerung und verlängert die Sättigung messbar. Ohne Struktur entstehen Energietiefs, die Heißhunger und Cravings begünstigen.', en: 'Irregular meals destabilise blood sugar and increase the release of ghrelin, the hunger hormone. Protein at every meal slows gastric emptying and measurably extends fullness. Without structure you get energy dips that encourage cravings.' }));
      used.p2a = 1;
    }
    if (!used.p1 && !used.p2a && highHunger && highCravings) {
      cards.push(C('p2b', 'MEDIUM', '🥚', { de: 'Proteinstruktur prüfen', en: 'Check your protein structure' },
        { de: '3 Mahlzeiten und 2 Snacks täglich, immer mit einer Proteinquelle: Eier, Hähnchen, Fisch, Tofu, Hülsenfrüchte, Quark, Skyr. Protein sättigt länger und stabilisiert den Blutzucker.', en: '3 meals and 2 snacks a day, always with a protein source: eggs, chicken, fish, tofu, legumes, quark, skyr. Protein keeps you full for longer and steadies blood sugar.' },
        { de: 'Protein hat den höchsten Sättigungsindex aller Makronährstoffe. Es stimuliert die Ausschüttung von GLP-1 und PYY, die beide den Hunger hemmen. Gleichzeitig hält es den Blutzucker stabiler als reine Kohlenhydrat-Mahlzeiten, was Heißhunger-Peaks reduziert.', en: 'Protein is the most filling macronutrient. It stimulates the release of GLP-1 and PYY, both of which curb hunger. It also keeps blood sugar steadier than carb-only meals, which reduces craving peaks.' }));
      used.p2b = 1;
    }
    if (!used.p1 && !used.p2a && !used.p2b && highHunger) {
      cards.push(C('p2c', 'MEDIUM', '🤔', { de: 'Hunger: körperlich oder emotional?', en: 'Hunger: physical or emotional?' },
        { de: 'Mahlzeitenstruktur prüfen: Isst du regelmäßig? Hast du heute zu jeder Mahlzeit Protein gegessen? Und: Ist es körperlicher Hunger oder ein anderes Bedürfnis wie Pause, Trost oder Langeweile?', en: 'Check your meal structure: do you eat regularly? Did you have protein with every meal today? And: is it physical hunger, or another need such as a break, comfort or boredom?' },
        { de: 'Körperlicher Hunger entsteht graduell und ist offen für verschiedene Lebensmittel. Emotionaler Hunger kommt plötzlich und ist spezifisch, oft auf bestimmte Geschmacksrichtungen (süß, salzig, fettig) gerichtet. Die beiden Signale zu unterscheiden ist eine erlernbare Kompetenz.', en: 'Physical hunger builds gradually and is open to different foods. Emotional hunger comes on suddenly and is specific, often aimed at certain flavours (sweet, salty, fatty). Telling the two apart is a learnable skill.' }));
    }
    if (lowEnergy && poorSleep && !highHunger && !poorDigestion) {
      cards.push(C('p3a', 'MEDIUM', '😴', { de: 'Energie und Schlaf: mehrere Baustellen', en: 'Energy and sleep: several things at once' },
        { de: 'Mögliche Ursachen: zu wenig gegessen (abends fehlen Protein und Kohlenhydrate, mind. 2 Stunden vor dem Schlafen, z. B. Hähnchen mit Reis oder Quark mit Obst), Koffein nach 15 Uhr (auch grüner Tee und Cola), Alkohol am Abend (stört die Schlafarchitektur), zu wenig Bewegung, zu wenig Flüssigkeit. Konkret: Koffein-Stopp um 15 Uhr, 7.000 Schritte täglich, 2 Liter Wasser.', en: 'Possible causes: not eating enough (protein and carbs missing in the evening, at least 2 hours before bed, e.g. chicken with rice or quark with fruit), caffeine after 3 pm (green tea and cola too), alcohol in the evening (disrupts sleep architecture), too little movement, too little fluid. In practice: caffeine cut-off at 3 pm, 7,000 steps a day, 2 litres of water.' },
        { de: 'Koffein hat eine Halbwertszeit von 5 bis 7 Stunden. Ein Kaffee um 15 Uhr heißt, dass um 21 Uhr noch die Hälfte des Koffeins aktiv ist. Alkohol unterdrückt den REM-Schlaf in der ersten Nachthälfte. Die Schlafarchitektur wird gestört, auch wenn du schnell einschläfst. Zu wenig Essen am Abend senkt den Tryptophanspiegel, der für die Melatoninproduktion gebraucht wird.', en: 'Caffeine has a half-life of 5 to 7 hours. A coffee at 3 pm means half of it is still active at 9 pm. Alcohol suppresses REM sleep in the first half of the night. Sleep architecture suffers even if you fall asleep quickly. Eating too little in the evening lowers tryptophan, which is needed to produce melatonin.' }));
    }
    if (lowEnergy && !poorSleep && !highHunger && !highStress) {
      cards.push(C('p3b', 'MEDIUM', '💧', { de: 'Energie niedrig: Wasser und Bewegung', en: 'Low energy: water and movement' },
        { de: 'Schon 1 bis 2 % Körpergewichtsverlust durch Flüssigkeitsmangel senken Energie und kognitive Leistung messbar. Ziel: 2 Liter Wasser täglich plus Alltagsbewegung. 7.000 Schritte als Basis.', en: 'Losing just 1 to 2% of body weight through dehydration measurably lowers energy and cognitive performance. Target: 2 litres of water a day plus everyday movement. 7,000 steps as a baseline.' },
        { de: 'Studien zeigen, dass schon milde Dehydration (1 bis 2 % des Körpergewichts) Konzentration, kognitive Leistung und Stimmung messbar senkt, ohne dass man sich zwingend durstig fühlt. Alltagsbewegung fördert die Funktion der Mitochondrien und verbessert die Energiebereitstellung auf Zellebene.', en: 'Studies show that even mild dehydration (1 to 2% of body weight) measurably lowers concentration, cognitive performance and mood, without necessarily feeling thirsty. Everyday movement supports mitochondrial function and improves energy supply at the cellular level.' }));
    }
    if (lowEnergy && highStress && !poorSleep) {
      cards.push(C('p3c', 'MEDIUM', '🧠', { de: 'Cortisol frisst Energie', en: 'Cortisol eats energy' },
        { de: 'Dauerhaft erhöhter Stress senkt langfristig die Energie. Box Breathing: 5 Minuten täglich, 4 Sekunden einatmen, 4 halten, 4 ausatmen, 4 halten. Dazu 20 Minuten Spaziergang.', en: 'Long-term stress drains energy over time. Box breathing: 5 minutes a day, 4 seconds in, 4 hold, 4 out, 4 hold. Plus a 20-minute walk.' },
        { de: 'Chronisch erhöhtes Cortisol hemmt die Funktion der Mitochondrien und damit die Energieproduktion der Zellen. Box Breathing aktiviert nachweislich den Parasympathikus und senkt die Cortisolkonzentration im Blut, messbar schon nach wenigen Minuten.', en: 'Chronically raised cortisol inhibits mitochondrial function and with it cellular energy production. Box breathing has been shown to activate the parasympathetic nervous system and lower blood cortisol, measurably within a few minutes.' }));
    }
    if (poorSleep && !lowEnergy && !highStress) {
      cards.push(C('p4', 'MEDIUM', '🌙', { de: 'Schlafhygiene prüfen', en: 'Check your sleep hygiene' },
        { de: 'Die häufigsten Störfaktoren: Koffein nach 15 Uhr (auch Tee und Cola), Alkohol (verkürzt den Tiefschlaf), Bildschirm kurz vor dem Schlafen, keine feste Schlafenszeit. Koffein-Stopp um 15 Uhr, kein Handy 30 Minuten vor dem Schlafen, feste Bettgehzeit.', en: 'The most common disruptors: caffeine after 3 pm (tea and cola too), alcohol (shortens deep sleep), screens shortly before bed, no fixed bedtime. Caffeine cut-off at 3 pm, no phone 30 minutes before bed, a fixed bedtime.' },
        { de: 'Blaues Licht von Bildschirmen hemmt die Melatoninausschüttung um bis zu 50 %. Eine feste Schlafenszeit synchronisiert den zirkadianen Rhythmus. Das Einschlafen wird einfacher, der Tiefschlaf tiefer. Koffein blockiert Adenosin-Rezeptoren, die für den Schlafdruck zuständig sind.', en: 'Blue light from screens suppresses melatonin release by up to 50%. A fixed bedtime synchronises your circadian rhythm. Falling asleep gets easier and deep sleep gets deeper. Caffeine blocks adenosine receptors, which create sleep pressure.' }));
    }
    if (highStress && poorSleep) {
      cards.push(C('p5a', 'HIGH', '🔄', { de: 'Stress und Schlaf: Kreislauf durchbrechen', en: 'Stress and sleep: break the cycle' },
        { de: 'Stress und schlechter Schlaf verstärken sich gegenseitig. Erhöhtes Cortisol am Abend macht das Einschlafen schwerer, und der nächste Tag wird stressanfälliger. Box Breathing vor dem Schlafen, Handy 30 Minuten vorher weg, keine Arbeit nach 20 Uhr.', en: 'Stress and poor sleep feed each other. Raised cortisol in the evening makes falling asleep harder, and the next day becomes more stress-prone. Box breathing before bed, phone away 30 minutes before, no work after 8 pm.' },
        { de: 'Erhöhtes Cortisol am Abend verzögert die Melatoninausschüttung. Schlechter Schlaf erhöht am nächsten Tag die Cortisol-Grundlinie. Ein sich selbst verstärkender Kreislauf, der ohne aktive Unterbrechung schwer zu durchbrechen ist. Schlafentzug erhöht außerdem die Reaktivität der Amygdala und verstärkt emotionalen Stress.', en: 'Raised cortisol in the evening delays melatonin release. Poor sleep raises the next day’s cortisol baseline. It is a self-reinforcing cycle that is hard to break without active interruption. Sleep deprivation also increases amygdala reactivity, which amplifies emotional stress.' }));
    }
    if (highStress && !poorSleep) {
      cards.push(C('p5b', 'MEDIUM', '🌊', { de: 'Stress wirkt sich auf alles aus', en: 'Stress affects everything' },
        { de: 'Stress beeinflusst Hunger, Cravings, Verdauung und Körperbild. Box Breathing, 20 Minuten Bewegung täglich, bildschirmfreie Pausen, keine Arbeit nach 20 Uhr.', en: 'Stress affects hunger, cravings, digestion and body image. Box breathing, 20 minutes of movement a day, screen-free breaks, no work after 8 pm.' },
        { de: 'Chronischer Stress aktiviert dauerhaft das sympathische Nervensystem. Das hemmt die Verdauung (Blut wird von der Verdauung weg in die Muskeln geleitet), erhöht das Verlangen nach kalorienreichen Lebensmitteln und verzerrt die Selbstwahrnehmung. Regelmäßige Bewegung ist einer der stärksten evidenzbasierten Stressreduktoren.', en: 'Chronic stress keeps the sympathetic nervous system switched on. That inhibits digestion (blood is diverted from digestion to the muscles), increases cravings for high-calorie food and distorts self-perception. Regular movement is one of the strongest evidence-based stress reducers.' }));
    }
    if (highCravings && !highHunger && !highStress) {
      cards.push(C('p6a', 'MEDIUM', '🍫', { de: 'Cravings: emotional ausgelöst?', en: 'Cravings: triggered by emotion?' },
        { de: 'Wenn kein körperlicher Hunger da ist, sind Cravings oft emotional ausgelöst: Langeweile, Erschöpfung, Frust. Check vor dem Essen: körperlicher Hunger oder ein anderes Bedürfnis? Hunger-Skala: essen ab 4, stoppen bei 6 bis 7.', en: 'Without physical hunger, cravings are often triggered by emotion: boredom, exhaustion, frustration. Check before eating: physical hunger or another need? Hunger scale: eat from 4, stop at 6 to 7.' },
        { de: 'Wenn kein Kaloriendefizit vorliegt, treibt das mesolimbische Dopaminsystem das Verlangen und nicht der Energiehaushalt. Emotionale Auslöser aktivieren dasselbe Belohnungssystem wie das Essen selbst. Das Innehalten vor dem Essen (STOP-Technik) unterbricht den automatischen Ablauf und gibt dem präfrontalen Kortex Zeit zu reagieren.', en: 'Without a calorie deficit, the craving is driven by the mesolimbic dopamine system rather than energy balance. Emotional triggers activate the same reward system as the food itself. Pausing before eating (the STOP technique) interrupts the automatic sequence and gives the prefrontal cortex time to respond.' }));
    }
    if (highCravings && highStress) {
      cards.push(C('p6b', 'MEDIUM', '🧂', { de: 'Cortisol und Cravings', en: 'Cortisol and cravings' },
        { de: 'Cortisol erhöht das Verlangen nach kalorienreichen Lebensmitteln. Das ist eine biologische Reaktion. STOP-Technik: Stopp. Tief atmen. Beobachten, was gerade passiert. Dann entscheiden.', en: 'Cortisol increases cravings for high-calorie food. That is a biological response. STOP technique: Stop. Breathe deeply. Observe what is happening. Then decide.' },
        { de: 'Cortisol erhöht die Aktivität im Belohnungszentrum und senkt gleichzeitig die hemmende Kontrolle des präfrontalen Kortex. Das Verlangen nach fett- und zuckerreichen Lebensmitteln ist evolutionär verankert, weil der Körper in Stresssituationen schnell Energie brauchte. Heute ist dieser Mechanismus oft fehl am Platz. Er ist trotzdem real und biologisch.', en: 'Cortisol increases activity in the reward centre and reduces the inhibitory control of the prefrontal cortex. The pull towards fatty and sugary food is rooted in evolution, because the body needed fast energy under stress. Today the mechanism is often out of place. It is still real and biological.' }));
    }
    if (poorDigestion && !lowEnergy && !highHunger) {
      cards.push(C('p7', 'MEDIUM', '🌿', { de: 'Verdauung: mögliche Ursachen', en: 'Digestion: possible causes' },
        { de: 'Häufige Ursachen: zu wenig Wasser, zu wenig Ballaststoffe, zu schnelles Essen, Stress (Darm und Nervensystem sind direkt verbunden), zu wenig Bewegung. Ziel: 2 Liter Wasser, Gemüse zu jeder Mahlzeit, 20 Minuten Bewegung täglich.', en: 'Common causes: too little water, too little fibre, eating too fast, stress (gut and nervous system are directly connected), too little movement. Target: 2 litres of water, vegetables with every meal, 20 minutes of movement a day.' },
        { de: 'Der Darm hat ein eigenes Nervensystem (enterisches Nervensystem) mit ca. 500 Millionen Nervenzellen, direkt mit dem Gehirn verbunden (Darm-Hirn-Achse). Stress hemmt die Darmperistaltik. Ballaststoffe ernähren die Darmmikrobiota und regulieren die Transitzeit. Bewegung fördert die Darmbewegung mechanisch.', en: 'The gut has its own nervous system (the enteric nervous system) with about 500 million nerve cells, directly linked to the brain (the gut-brain axis). Stress inhibits gut motility. Fibre feeds the gut microbiota and regulates transit time. Movement mechanically supports gut motility.' }));
    }
    if (lowBodyImage && highStress) {
      cards.push(C('p8a', 'MEDIUM', '🪞', { de: 'Stress verzerrt das Körperbild', en: 'Stress distorts body image' },
        { de: 'Körperbild beschreibt, wie du über deinen Körper denkst und fühlst. Stress verzerrt diese Selbstwahrnehmung. Abendübung: Schreib 3 Dinge auf, die dein Körper heute geleistet hat. Was er getan hat, nicht wie er aussah.', en: 'Body image describes how you think and feel about your body. Stress distorts this self-perception. Evening exercise: write down 3 things your body did for you today. What it did, not how it looked.' },
        { de: 'Cortisol beeinflusst die Aktivität im medialen präfrontalen Kortex, der für Selbstwahrnehmung zuständig ist. Unter Stress neigt das Gehirn zur negativen Verzerrung, auch bei der Körperwahrnehmung. Dankbarkeitsübungen (z. B. Körperleistungen aufschreiben) aktivieren nachweislich das ventrale Striatum und verbessern die Selbstwahrnehmung.', en: 'Cortisol affects activity in the medial prefrontal cortex, which handles self-perception. Under stress the brain leans towards negative bias, body perception included. Gratitude exercises (such as writing down what your body did) have been shown to activate the ventral striatum and improve self-perception.' }));
    }
    if (lowBodyImage && !highStress) {
      cards.push(C('p8b', 'MEDIUM', '💚', { de: 'Körperbild', en: 'Body image' },
        { de: 'Körperbild sind deine Gedanken und Gefühle über deinen Körper. Zwei Menschen mit demselben Körper können ein völlig unterschiedliches Körperbild haben. Es entsteht durch Vergleiche, Kommentare und gesellschaftliche Ideale. Abendübung: Schreib 3 Dinge auf, die dein Körper heute geleistet hat.', en: 'Body image is your thoughts and feelings about your body. Two people with the same body can have completely different body images. It is shaped by comparisons, comments and social ideals. Evening exercise: write down 3 things your body did for you today.' },
        { de: 'Body Image ist ein kognitiv-affektives Konstrukt und keine direkte Wahrnehmung. Social-Media-Konsum mit idealisierten Körperdarstellungen verschlechtert das Körperbild messbar, besonders bei Vergleichen nach oben. Reflexion über Körperfunktionen (was kann mein Körper?) verschiebt den Fokus von der Ästhetik zur Selbstwirksamkeit.', en: 'Body image is a cognitive-affective construct rather than a direct perception. Social media use with idealised bodies measurably worsens body image, especially through upward comparison. Reflecting on body function (what can my body do?) shifts the focus from aesthetics to self-efficacy.' }));
    }
    if (gender === 'female') {
      var pmsCount = [lowEnergy, highCravings, highHunger, poorSleep, lowBodyImage].filter(Boolean).length;
      if (pmsCount >= 3) {
        cards.push(C('pms', 'MEDIUM', '🌸', { de: 'Könnte es PMS sein?', en: 'Could it be PMS?' },
          { de: 'Tritt diese Kombination aus niedrigerer Energie, stärkerem Hunger, Cravings, schlechterem Schlaf und negativem Körperbild in der zweiten Zyklushälfte auf (ca. 1 bis 2 Wochen vor der Periode), kann sie zyklusbedingt sein. In der Lutealphase steigt der Energiebedarf um ca. 100 bis 150 kcal täglich. Iss etwas mehr, besonders kohlenhydrat- und proteinreiche Mahlzeiten, und sei nachsichtiger mit dir.', en: 'If this mix of lower energy, more hunger, cravings, worse sleep and negative body image shows up in the second half of your cycle (about 1 to 2 weeks before your period), it can be cycle-related. In the luteal phase energy needs rise by about 100 to 150 kcal a day. Eat a little more, especially carb- and protein-rich meals, and go easier on yourself.' },
          { de: 'In der Lutealphase sinkt die Insulinsensitivität leicht, der Serotoninspiegel fällt (Östrogen fällt nach dem LH-Peak), und der Grundumsatz steigt um 2 bis 10 %. Das erklärt mehr Hunger, Stimmungsschwankungen und veränderten Schlaf. Der höhere Energiebedarf ist Physiologie.', en: 'In the luteal phase insulin sensitivity drops slightly, serotonin falls (oestrogen drops after the LH peak) and basal metabolism rises by 2 to 10%. That explains more hunger, mood swings and changes in sleep. The higher energy need is physiology.' }));
      }
    }
    var redFlags = [highHunger, lowEnergy, highStress, highCravings, poorDigestion, poorSleep, lowBodyImage].filter(Boolean).length;
    if (redFlags === 0) {
      cards.push(C('allgood', 'GOOD', '✨', { de: 'Alles im grünen Bereich', en: 'All in the green' },
        { de: 'Dein Biofeedback sieht heute sehr gut aus. Was hat diese Woche dazu beigetragen? Es lohnt sich, das zu notieren. Dann weißt du, was bei dir funktioniert.', en: 'Your biofeedback looks great today. What helped this week? Worth writing down, so you know what works for you.' }));
    } else if (redFlags <= 3) {
      if (energy >= 7 && hunger <= 5) cards.push(C('good1', 'GOOD', '⚡', { de: 'Energie und Hunger: gut versorgt', en: 'Energy and hunger: well fuelled' }, { de: 'Deine Energie ist solide und du bist gut versorgt. Eine starke Basis.', en: 'Your energy is solid and you are well fuelled. A strong base.' }));
      if (sleep >= 7 && stress <= 4) cards.push(C('good2', 'GOOD', '🌙', { de: 'Schlaf und Stress: solide Basis', en: 'Sleep and stress: a solid base' }, { de: 'Guter Schlaf und niedriger Stress. Die beste Grundlage für alles andere.', en: 'Good sleep and low stress. The best foundation for everything else.' }));
      if (digestion >= 8) cards.push(C('good3', 'GOOD', '🌿', { de: 'Verdauung: top', en: 'Digestion: great' }, { de: 'Deine Verdauung läuft rund. Weiter so.', en: 'Your digestion is running smoothly. Keep it up.' }));
    }
    return cards;
  }

  var SEV = {
    HIGH: { c: '#c83e61', l: { de: 'Dringend', en: 'Urgent' } },
    MEDIUM: { c: '#fcc246', l: { de: 'Beachten', en: 'Watch' } },
    GOOD: { c: '#75a151', l: { de: 'Gut', en: 'Good' } }
  };

  function renderResults(scroll) {
    var cards = analyze();
    var n = cards.length;
    var l = window.Flonu ? window.Flonu.lang() : 'de';
    root.querySelector('[data-bio-input]').hidden = true;
    var res = root.querySelector('[data-bio-results]');
    res.hidden = false;
    root.querySelector('[data-bio-sub]').textContent = l === 'de'
      ? n + (n === 1 ? ' Hinweis' : ' Hinweise') + ' aus deinem Biofeedback'
      : n + (n === 1 ? ' note' : ' notes') + ' from your biofeedback';
    root.querySelector('[data-bio-cards]').innerHTML = cards.map(function (c, i) {
      var s = SEV[c.sev];
      return '<article class="bf-card" data-sev="' + c.sev + '" style="--sev:' + s.c + ';animation-delay:' + (i * 90) + 'ms">' +
        '<div class="bf-card__top"><span aria-hidden="true">' + c.icon + '</span><h3>' + T(c.title) + '</h3><span class="bf-card__badge">' + T(s.l) + '</span></div>' +
        '<p>' + T(c.text) + '</p>' +
        (c.ev ? '<div class="why"><b>' + T({ de: 'Warum das relevant ist', en: 'Why this matters' }) + '</b>' + T(c.ev) + '</div>' : '') +
        '</article>';
    }).join('');
    if (scroll) {
      var top = root.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function reset() {
    gender = null; showingResults = false;
    vals = { hunger: 5, energy: 5, stress: 5, cravings: 5, digestion: 5, sleep: 5, bodyimage: 5 };
    var o = root.querySelectorAll('.opt');
    for (var i = 0; i < o.length; i++) o[i].setAttribute('aria-pressed', 'false');
    root.querySelector('[data-bio-input]').hidden = false;
    root.querySelector('[data-bio-results]').hidden = true;
    buildSliders();
    var top = root.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  document.addEventListener('flonu:lang', function () {
    buildSliders();
    root.querySelector('[data-bio-err]').textContent = '';
    if (showingResults) renderResults(false);
  });
  buildSliders();
})();
