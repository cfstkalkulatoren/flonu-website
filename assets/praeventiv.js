/* Mini-Tool "Schnell-Check für deinen Tag". Nichts wird gespeichert. */
(function () {
  'use strict';
  var box = document.querySelector('[data-qcheck]');
  if (!box) return;
  var checks = box.querySelectorAll('.check');
  var num = box.querySelector('[data-qc-num]');
  var msgs = box.querySelectorAll('[data-qc-msg]');
  var nexts = box.querySelectorAll('[data-qc-next]');
  var touched = false;

  function render() {
    var n = 0, i;
    for (i = 0; i < checks.length; i++) {
      var on = checks[i].getAttribute('aria-pressed') === 'true';
      if (on) n++;
      if (nexts[i]) nexts[i].hidden = on;
    }
    num.textContent = n + '/' + checks.length;
    var state = !touched ? '0' : (n === checks.length ? '2' : '1');
    for (i = 0; i < msgs.length; i++) msgs[i].hidden = msgs[i].getAttribute('data-qc-msg') !== state;
  }

  box.addEventListener('click', function (e) {
    var b = e.target.closest('.check');
    if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    touched = true;
    render();
  });
  render();
})();
