/* Flonu Protein-Rechner. Logik unverändert aus dem Original-Kalkulator übernommen. */
(function () {
  'use strict';
  var root = document.querySelector('[data-protein]');
  if (!root) return;
  var T = function (o) { return window.Flonu ? window.Flonu.t(o) : o.de; };
  var lang = function () { return window.Flonu ? window.Flonu.lang() : 'de'; };

  var state = { weight: null, age: null, sex: null, menopause: null, diet: null, goal: null, activity: null };
  var steps = root.querySelectorAll('[data-step]');
  var bars = root.querySelectorAll('.progress span');
  var current = 0;
  var lastResult = null;

  function show(n) {
    current = n;
    for (var i = 0; i < steps.length; i++) steps[i].hidden = +steps[i].getAttribute('data-step') !== n;
    for (var j = 0; j < bars.length; j++) {
      bars[j].className = j < n ? 'done' : (j === n ? 'now' : '');
    }
    var top = root.getBoundingClientRect().top + window.scrollY - 100;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
  }
  function err(n, msg) { var e = root.querySelector('[data-err="' + n + '"]'); if (e) e.textContent = msg || ''; }

  var MSG = {
    body: { de: 'Bitte gib ein gültiges Gewicht (ab 30 kg) und Alter (ab 15) ein.', en: 'Please enter a valid weight (30 kg or more) and age (15 or older).' },
    pick: { de: 'Bitte wähle eine Option.', en: 'Please choose an option.' },
    meno: { de: 'Bitte beantworte noch die Frage zur Menopause.', en: 'Please answer the menopause question too.' }
  };

  root.addEventListener('click', function (e) {
    var opt = e.target.closest('.opt');
    if (opt) {
      var group = opt.parentNode;
      var key = group.getAttribute('data-group');
      state[key] = opt.getAttribute('data-val');
      var all = group.querySelectorAll('.opt');
      for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-pressed', all[i] === opt ? 'true' : 'false');
      if (key === 'sex') updateMenopause();
      err(current, '');
      return;
    }
    var next = e.target.closest('[data-next]');
    if (next) { goNext(+next.getAttribute('data-next')); return; }
    var back = e.target.closest('[data-back]');
    if (back) { show(+back.getAttribute('data-back') - 1); return; }
    if (e.target.closest('[data-calc]')) { calc(); return; }
    if (e.target.closest('[data-restart]')) { restart(); }
  });

  function updateMenopause() {
    var block = root.querySelector('[data-menopause]');
    var age = parseInt(root.querySelector('#p-age').value, 10) || 0;
    var showIt = state.sex === 'weiblich' && age >= 40;
    block.hidden = !showIt;
    if (!showIt) {
      state.menopause = null;
      var b = block.querySelectorAll('.opt');
      for (var i = 0; i < b.length; i++) b[i].setAttribute('aria-pressed', 'false');
    }
  }

  function goNext(from) {
    if (from === 0) {
      var w = parseFloat(String(root.querySelector('#p-weight').value).replace(',', '.'));
      var a = parseFloat(root.querySelector('#p-age').value);
      if (!w || w < 30 || w > 250 || !a || a < 15 || a > 100) { err(0, T(MSG.body)); return; }
      state.weight = w; state.age = a;
      updateMenopause();
    }
    if (from === 1 && !state.sex) { err(1, T(MSG.pick)); return; }
    if (from === 1 && !root.querySelector('[data-menopause]').hidden && !state.menopause) { err(1, T(MSG.meno)); return; }
    if (from === 2 && !state.diet) { err(2, T(MSG.pick)); return; }
    if (from === 3 && !state.goal) { err(3, T(MSG.pick)); return; }
    err(from, '');
    show(from + 1);
  }

  function fmt(x) { var s = x.toFixed(1); return lang() === 'de' ? s.replace('.', ',') : s; }

  function calc() {
    if (!state.activity) { err(4, T(MSG.pick)); return; }
    var w = state.weight;
    var isMenopause = state.menopause === 'ja';
    var isVegan = state.diet === 'vegan';
    var isVegetarian = state.diet === 'vegetarisch';
    var plantBased = isVegan || isVegetarian;
    var goal = state.goal, act = state.activity;
    var low, high;

    if (goal === 'muskel') {
      low = 1.6; high = 2.2;
      if (act === 'sehr-aktiv') { low = 1.8; high = 2.4; }
    } else if (goal === 'abnehmen') {
      low = 1.8; high = 2.4;
      if (act === 'gering') { low = 1.6; high = 2.0; }
    } else if (goal === 'halten') {
      low = 1.4; high = 1.8;
      if (act === 'sehr-aktiv' || act === 'aktiv') { low = 1.6; high = 2.0; }
    } else {
      low = 1.2; high = 1.6;
      if (act === 'aktiv' || act === 'sehr-aktiv') { low = 1.4; high = 1.8; }
    }
    if (isMenopause) { low += 0.1; high += 0.2; }
    if (plantBased) { low *= 1.1; high *= 1.1; }

    lastResult = {
      w: w, low: low, high: high,
      gLow: Math.round(low * w / 5) * 5,
      gHigh: Math.round(high * w / 5) * 5,
      goal: goal, isMenopause: isMenopause, isVegan: isVegan, isVegetarian: isVegetarian, plantBased: plantBased
    };
    renderResult();
    show(5);
  }

  var EXPLAIN = {
    muskel: { de: 'Für Muskelaufbau empfiehlt die ISSN eine Zufuhr von 1,6 bis 2,2 g pro kg Körpergewicht täglich. Protein liefert die Bausteine für die Muskelproteinsynthese. Besonders wichtig rund ums Training.', en: 'For building muscle the ISSN recommends 1.6 to 2.2 g per kg of body weight per day. Protein supplies the building blocks for muscle protein synthesis. Especially important around training.' },
    abnehmen: { de: 'Beim Abnehmen zählt ausreichend Protein besonders. Es schützt deine Muskelmasse im Kaloriendefizit, hält dich länger satt und stabilisiert deinen Blutzucker. Höhere Werte (bis 2,4 g pro kg) sind in Defizitphasen gut belegt.', en: 'When losing weight, enough protein matters most. It protects your muscle mass in a calorie deficit, keeps you full for longer and steadies your blood sugar. Higher amounts (up to 2.4 g per kg) are well supported during a deficit.' },
    halten: { de: 'Wer sein Gewicht halten möchte, profitiert von 1,4 bis 2,0 g pro kg, je nach Trainingsvolumen. Protein unterstützt Muskelerhalt, Sättigung und Stoffwechsel.', en: 'If you want to maintain your weight, 1.4 to 2.0 g per kg works well, depending on training volume. Protein supports muscle maintenance, fullness and metabolism.' },
    gesundheit: { de: 'Für allgemeine Gesundheit und Wohlbefinden empfiehlt die ISSN 1,2 bis 1,8 g pro kg täglich. Das liegt deutlich über der offiziellen Mindestempfehlung von 0,8 g pro kg, die für aktive Menschen zu niedrig angesetzt ist.', en: 'For general health and wellbeing the ISSN recommends 1.2 to 1.8 g per kg per day. That is well above the official minimum of 0.8 g per kg, which is set too low for active people.' }
  };
  var MENO = { de: 'In und nach der Menopause sinkt die Rate der Muskelproteinsynthese. Empfohlen wird eine höhere Zufuhr im oberen Drittel der Spanne.', en: 'In and after menopause the rate of muscle protein synthesis drops. A higher intake in the upper third of the range is recommended.' };
  var VEGAN = { de: 'Pflanzliche Proteine haben eine niedrigere Bioverfügbarkeit (DIAAS). Deshalb wurde dein Richtwert um ca. 10 % erhöht. Kombiniere verschiedene Quellen: Hülsenfrüchte, Soja, Nüsse, Vollkorn.', en: 'Plant proteins have lower bioavailability (DIAAS), so your target was raised by about 10%. Combine different sources: legumes, soy, nuts, whole grains.' };
  var VEGGIE = { de: 'Vegetarische Kost enthält Eier und Milchprodukte mit hoher Bioverfügbarkeit. Trotzdem wurde ein kleiner Aufschlag eingerechnet.', en: 'A vegetarian diet includes eggs and dairy with high bioavailability. A small buffer has still been added.' };
  var CALL_HIGH = { de: 'So viel Protein fühlt sich nach viel an. Der Trick: Verteile die Menge auf 3 bis 4 Mahlzeiten mit je 25 bis 40 g Protein. Das maximiert die Muskelproteinsynthese.', en: 'That much protein can feel like a lot. The trick: spread it over 3 to 4 meals with 25 to 40 g of protein each. That maximises muscle protein synthesis.' };
  var CALL_LOW = { de: 'Protein musst du nicht auf einmal essen. 3 bis 4 Portionen über den Tag verteilt sind ideal und machen die Menge gut machbar.', en: 'You do not have to eat protein all at once. 3 to 4 portions across the day are ideal and make the amount easy to manage.' };

  var FOODS = {
    omnivor: [
      [{ de: 'Hähnchenbrust (100 g)', en: 'Chicken breast (100 g)' }, 31],
      [{ de: 'Griechischer Joghurt (200 g)', en: 'Greek yoghurt (200 g)' }, 20],
      [{ de: 'Eier (2 Stück)', en: 'Eggs (2)' }, 12],
      [{ de: 'Thunfisch (Dose, 120 g)', en: 'Tuna (tin, 120 g)' }, 28],
      [{ de: 'Quark (150 g)', en: 'Quark (150 g)' }, 18],
      [{ de: 'Lachs (100 g)', en: 'Salmon (100 g)' }, 25]
    ],
    vegetarisch: [
      [{ de: 'Griechischer Joghurt (200 g)', en: 'Greek yoghurt (200 g)' }, 20],
      [{ de: 'Hüttenkäse (150 g)', en: 'Cottage cheese (150 g)' }, 22],
      [{ de: 'Eier (2 Stück)', en: 'Eggs (2)' }, 12],
      [{ de: 'Edamame (100 g)', en: 'Edamame (100 g)' }, 11],
      [{ de: 'Tempeh (100 g)', en: 'Tempeh (100 g)' }, 19],
      [{ de: 'Quark (150 g)', en: 'Quark (150 g)' }, 18]
    ],
    vegan: [
      [{ de: 'Tempeh (100 g)', en: 'Tempeh (100 g)' }, 19],
      [{ de: 'Edamame (100 g)', en: 'Edamame (100 g)' }, 11],
      [{ de: 'Linsen, gekocht (150 g)', en: 'Lentils, cooked (150 g)' }, 13],
      [{ de: 'Seitan (100 g)', en: 'Seitan (100 g)' }, 25],
      [{ de: 'Soja-Drink, natur (300 ml)', en: 'Soy drink, unsweetened (300 ml)' }, 11],
      [{ de: 'Hanfsamen (30 g)', en: 'Hemp seeds (30 g)' }, 10]
    ]
  };

  function renderResult() {
    var r = lastResult;
    if (!r) return;
    var de = lang() === 'de';
    root.querySelector('[data-r-range]').textContent = r.gLow + '–' + r.gHigh + (de ? ' g/Tag' : ' g/day');
    root.querySelector('[data-r-sub]').textContent = de ? 'Für ' + fmt(r.w).replace(',0', '') + ' kg Körpergewicht' : 'For ' + fmt(r.w).replace('.0', '') + ' kg body weight';
    root.querySelector('[data-r-perkg]').textContent = fmt(r.low) + '–' + fmt(r.high) + (de ? ' g pro kg Körpergewicht' : ' g per kg body weight');
    var ex = T(EXPLAIN[r.goal]);
    if (r.isMenopause) ex += ' ' + T(MENO);
    if (r.plantBased) ex += ' ' + (r.isVegan ? T(VEGAN) : T(VEGGIE));
    root.querySelector('[data-r-explain]').textContent = ex;
    root.querySelector('[data-r-callout]').textContent = T(r.gHigh >= 150 ? CALL_HIGH : CALL_LOW);
    var key = r.isVegan ? 'vegan' : (r.isVegetarian ? 'vegetarisch' : 'omnivor');
    var title = { omnivor: { de: 'Gute Proteinquellen', en: 'Good protein sources' }, vegetarisch: { de: 'Gute vegetarische Proteinquellen', en: 'Good vegetarian protein sources' }, vegan: { de: 'Gute vegane Proteinquellen', en: 'Good vegan protein sources' } };
    root.querySelector('[data-r-foods-title]').textContent = T(title[key]);
    root.querySelector('[data-r-foods]').innerHTML = FOODS[key].map(function (f) {
      return '<li><span>' + T(f[0]) + '</span><b>' + f[1] + ' g Protein</b></li>';
    }).join('');
  }

  function restart() {
    for (var k in state) state[k] = null;
    lastResult = null;
    var o = root.querySelectorAll('.opt');
    for (var i = 0; i < o.length; i++) o[i].setAttribute('aria-pressed', 'false');
    root.querySelector('#p-weight').value = '';
    root.querySelector('#p-age').value = '';
    root.querySelector('[data-menopause]').hidden = true;
    for (var n = 0; n < 5; n++) err(n, '');
    show(0);
  }

  document.addEventListener('flonu:lang', function () { renderResult(); for (var n = 0; n < 5; n++) err(n, ''); });
  show(0);
})();
