/* Bewerbungsformular: sendet die Antworten an eine Google-Sheets-Tabelle (über ein Google Apps Script).
   EINSTELLUNG: Trage hier die Web-App-URL deines Skripts ein (endet auf /exec).
   Anleitung: siehe EINRICHTUNG-FORMULAR.txt */
(function () {
  'use strict';
  var FORM_URL = 'https://script.google.com/macros/s/AKfycbxEdrxnGLsrOMWtJv5Lxkl2exMmt075P8UngAGOPc-1ux04tjSuyWlrc0jI0SJ3DEyJdg/exec';

  var form = document.getElementById('apply-form');
  if (!form) return;
  var done = document.getElementById('apply-done');
  var err = form.querySelector('[data-form-error]');
  var btn = form.querySelector('button[type="submit"]');
  var other = form.querySelector('[data-other]');
  var otherInput = form.querySelector('[data-other-input]');

  function lang() { return window.Flonu ? window.Flonu.lang() : 'de'; }
  function say(de, en) { err.textContent = lang() === 'en' ? en : de; }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'heard') {
      var isOther = e.target.value === 'Other';
      other.hidden = !isOther;
      otherInput.required = isOther;
      if (!isOther) otherInput.value = '';
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!FORM_URL) {
      say('Das Formular ist noch nicht mit der Tabelle verbunden. Bitte schreib mir stattdessen an aleks@flonu-coaching.com.',
          'The form is not connected to the spreadsheet yet. Please write to aleks@flonu-coaching.com instead.');
      return;
    }
    var data = new URLSearchParams(new FormData(form));
    data.set('lang', lang());
    btn.disabled = true;
    fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        form.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ block: 'start' });
      })
      .catch(function () {
        btn.disabled = false;
        say('Das Absenden hat nicht geklappt. Bitte versuch es noch einmal oder schreib mir an aleks@flonu-coaching.com.',
            'Sending did not work. Please try again or write to aleks@flonu-coaching.com.');
      });
  });
})();
