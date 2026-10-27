/* Flonu Hunger- und Sättigungsbarometer (0 bis 10), interaktiv. */
(function () {
  'use strict';
  var root = document.querySelector('[data-baro]');
  if (!root) return;

  var BARO = [
    { de: 'Ich könnte mir den Arm abbeißen.', en: 'I could bite my own arm off.' },
    { de: 'Magenschmerzen vor Hunger.', en: 'Stomach pain from hunger.' },
    { de: 'Magenknurren, eventuell leichter Schwindel.', en: 'Stomach growling, maybe slightly dizzy.' },
    { de: 'Leichtes Magenknurren. Der ideale Startpunkt.', en: 'Slight stomach growling. The ideal moment to start eating.' },
    { de: 'Ich beginne, an Essen zu denken.', en: 'I am starting to think about food.' },
    { de: 'Kein körperliches Hungergefühl.', en: 'No physical feeling of hunger.' },
    { de: 'Ich beginne, langsamer zu essen.', en: 'I am starting to eat more slowly.' },
    { de: 'Zufrieden, angenehm satt. Hier aufhören.', en: 'Satisfied, pleasantly full. Stop here.' },
    { de: 'Ich könnte ein Nickerchen machen.', en: 'I could take a nap.' },
    { de: 'Bauchweh, mir ist schlecht.', en: 'Stomach ache, I feel sick.' },
    { de: 'Hilfe, ich kann mich nicht bewegen!', en: 'Help, I can’t move!' }
  ];
  var ZONES = [
    { de: '0–2 überhungrig', en: '0–2 overhungry', short: { de: 'überhungrig', en: 'overhungry' }, c: '#c83e61' },
    { de: '2–4 leichter Hunger', en: '2–4 slightly hungry', short: { de: 'leichter Hunger', en: 'slightly hungry' }, c: '#75a151' },
    { de: '4–6 neutral', en: '4–6 neutral', short: { de: 'neutral', en: 'neutral' }, c: '#cecd58' },
    { de: '6–8 angenehm satt', en: '6–8 pleasantly full', short: { de: 'angenehm satt', en: 'pleasantly full' }, c: '#fcc246' },
    { de: '8–10 vollgestopft', en: '8–10 stuffed', short: { de: 'vollgestopft', en: 'stuffed' }, c: '#f28f47' }
  ];
  function zoneOf(n) { return Math.min(4, Math.floor(n / 2)); }

  var CX = 260, CY = 250, R1 = 132, R2 = 222, RN = 246;
  var START = -125, END = 125, N = 11, GAP = 1.6;
  var step = (END - START) / N;
  function pt(r, deg) { var a = deg * Math.PI / 180; return [CX + r * Math.sin(a), CY - r * Math.cos(a)]; }
  function arc(a0, a1) {
    var p1 = pt(R2, a0), p2 = pt(R2, a1), p3 = pt(R1, a1), p4 = pt(R1, a0);
    return 'M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) +
      ' A' + R2 + ' ' + R2 + ' 0 0 1 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) +
      ' L' + p3[0].toFixed(1) + ' ' + p3[1].toFixed(1) +
      ' A' + R1 + ' ' + R1 + ' 0 0 0 ' + p4[0].toFixed(1) + ' ' + p4[1].toFixed(1) + ' Z';
  }

  var svg = '<svg viewBox="0 -4 520 390" role="group" aria-label="Hunger- und Sättigungsbarometer">';
  for (var i = 0; i < N; i++) {
    var a0 = START + i * step + GAP / 2, a1 = START + (i + 1) * step - GAP / 2, mid = START + (i + 0.5) * step;
    var np = pt(RN, mid);
    svg += '<g class="baro__seg" data-n="' + i + '" role="button" tabindex="0" aria-pressed="false">' +
      '<path d="' + arc(a0, a1) + '" fill="' + ZONES[zoneOf(i)].c + '" stroke="transparent" stroke-width="4"/>' +
      '<text class="baro__num" x="' + np[0].toFixed(1) + '" y="' + (np[1] + 9).toFixed(1) + '" text-anchor="middle">' + i + '</text></g>';
  }
  svg += '<g class="baro__needle" data-needle><path d="M' + (CX - 9) + ' ' + CY + ' L' + CX + ' ' + (CY - 118) + ' L' + (CX + 9) + ' ' + CY + ' Z" fill="#003d30"/></g>' +
    '<circle cx="' + CX + '" cy="' + CY + '" r="26" fill="#003d30"/><circle cx="' + CX + '" cy="' + CY + '" r="9" fill="#f1dbca"/>' +
    '</svg>';
  root.querySelector('[data-baro-dial]').innerHTML = svg;

  var segs = root.querySelectorAll('.baro__seg');
  var needle = root.querySelector('[data-needle]');
  var current = 3;

  function render() {
    var l = window.Flonu ? window.Flonu.lang() : 'de';
    var z = ZONES[zoneOf(current)];
    for (var i = 0; i < segs.length; i++) {
      var n = +segs[i].getAttribute('data-n');
      segs[i].setAttribute('aria-pressed', n === current ? 'true' : 'false');
      segs[i].setAttribute('aria-label', n + ': ' + BARO[n][l]);
      segs[i].style.opacity = n === current ? '1' : '0.55';
    }
    needle.style.transform = 'rotate(' + (START + (current + 0.5) * step) + 'deg)';
    root.querySelector('[data-baro-n]').textContent = current;
    var zone = root.querySelector('[data-baro-zone]');
    zone.textContent = z.short[l];
    zone.style.setProperty('--c', z.c);
    root.querySelector('[data-baro-say]').textContent = BARO[current][l];
    var lg = root.querySelector('[data-baro-legend]');
    lg.innerHTML = ZONES.map(function (zz) { return '<li><i style="background:' + zz.c + '"></i>' + zz[l] + '</li>'; }).join('');
  }

  root.addEventListener('click', function (e) {
    var s = e.target.closest('.baro__seg');
    if (!s) return;
    current = +s.getAttribute('data-n');
    render();
  });
  root.addEventListener('keydown', function (e) {
    var s = e.target.closest('.baro__seg');
    if (!s) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); current = +s.getAttribute('data-n'); render(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); current = Math.min(10, current + 1); render(); segs[current].focus(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); current = Math.max(0, current - 1); render(); segs[current].focus(); }
  });
  document.addEventListener('flonu:lang', render);
  render();
})();
