(function () {
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  var stage = document.getElementById('stage'), vp = document.getElementById('vp');
  var count = document.getElementById('count'), nameEl = document.getElementById('name');
  var i = 0;

  // ---------- diagramas (bpmn-js) ----------
  var diags = {};            // id -> { viewer, ready: Promise }
  var MARGEM = 24;

  function ajustar(v) {
    var canvas = v.get('canvas');
    canvas.resized();
    var c = canvas._container, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    var inner = canvas.viewbox().inner;
    if (!inner.width || !inner.height) return;
    // enquadra o diagrama inteiro; diagramas pequenos não passam de 1,5× (evita ampliar demais)
    var s = Math.min((w - 2 * MARGEM) / inner.width, (h - 2 * MARGEM) / inner.height, 1.5);
    canvas.viewbox({
      x: inner.x - (w / s - inner.width) / 2, y: inner.y - (h / s - inner.height) / 2,
      width: w / s, height: h / s
    });
  }

  function preparar(panel) {
    var id = panel.getAttribute('data-diag');
    if (diags[id]) return diags[id];
    var host = panel.querySelector('.dhost');
    var viewer = new BpmnJS({ container: host });
    var xml = document.getElementById(id + '-xml').textContent;
    var d = diags[id] = { viewer: viewer, panel: panel };
    d.ready = viewer.importXML(xml).then(function () {
      // ao entrar ou sair de um subprocesso (drill-down), enquadra o novo nível
      viewer.on('root.set', function () { setTimeout(function () { ajustar(viewer); }, 0); });
    }).catch(function (e) {
      host.textContent = 'Não foi possível abrir o diagrama ' + panel.getAttribute('data-file') + ': ' + e.message;
      console.error(e);
    });
    panel.closest('.slide').querySelector('.dctl').addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button'); if (!b) return;
      var z = Number(b.getAttribute('data-z'));
      if (z === 0) ajustar(viewer); else viewer.get('zoomScroll').stepZoom(z);
    });
    // roda do mouse = zoom no ponto do cursor (no bpmn-js a roda sozinha rola; o zoom pede Ctrl).
    // Shift + roda continua rolando na horizontal.
    host.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.stopPropagation(); e.preventDefault();
      e.target.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true, cancelable: true, ctrlKey: true, clientX: e.clientX, clientY: e.clientY,
        deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode
      }));
    }, { capture: true, passive: false });
    // interagir com o diagrama não troca de slide
    ['click', 'touchstart', 'touchend'].forEach(function (t) {
      panel.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true });
    });
    return d;
  }

  // títulos de diagrama (e subtítulos dos recortes) numa linha: reduz a fonte até caber
  function caberTitulos(slide) {
    [].forEach.call(slide.querySelectorAll('.dhead h2, .rtit p'), function (el) {
      var min = el.tagName === 'P' ? 12 : 26;
      if (!el.dataset.f0) el.dataset.f0 = el.style.fontSize || getComputedStyle(el).fontSize;
      el.style.fontSize = el.dataset.f0;
      var f = parseFloat(el.dataset.f0);
      while (el.scrollWidth > el.clientWidth + 1 && f > min) { f -= 1; el.style.fontSize = f + 'px'; }
    });
  }

  function mostrarDiagramas(slide) {
    caberTitulos(slide);
    [].forEach.call(slide.querySelectorAll('.dpanel[data-diag]'), function (p) {
      var d = preparar(p);
      d.ready.then(function () { ajustar(d.viewer); });
    });
  }

  // ---------- palco e navegação ----------
  function fit() {
    var w = vp.clientWidth, h = vp.clientHeight;
    var s = Math.min(w / 1456, h / 819);
    stage.style.transform = 'scale(' + s + ') translate(-50%,-50%)';
    stage.style.setProperty('--s', s);
    stage.style.setProperty('--inv', 1 / s);
    Object.keys(diags).forEach(function (k) {
      var d = diags[k];
      if (d.panel.closest('.slide').classList.contains('on')) d.ready.then(function () { ajustar(d.viewer); });
    });
  }
  function show(n) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    count.textContent = (i + 1) + ' / ' + slides.length;
    nameEl.textContent = slides[i].getAttribute('aria-label') || '';
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) {}
    mostrarDiagramas(slides[i]);
  }
  document.getElementById('prev').onclick = function () { show(i - 1); };
  document.getElementById('next').onclick = function () { show(i + 1); };
  document.getElementById('fs').onclick = function () {
    var d = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen();
  };
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(i + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(i - 1); }
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else if (e.key === 'f' || e.key === 'F') document.getElementById('fs').click();
  });
  var x0 = null;
  vp.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  vp.addEventListener('touchend', function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
  });
  vp.addEventListener('click', function (e) {
    var r = vp.getBoundingClientRect(); show(i + (e.clientX - r.left > r.width / 2 ? 1 : -1));
  });
  window.addEventListener('resize', fit);

  // ---------- impressão / PDF: todos os diagramas desenhados e enquadrados ----------
  window.addEventListener('beforeprint', function () {
    document.documentElement.classList.add('printing');
    stage.style.setProperty('--s', 1); stage.style.setProperty('--inv', 1);
    slides.forEach(caberTitulos);
    Object.keys(diags).forEach(function (k) { ajustar(diags[k].viewer); });
  });
  window.addEventListener('afterprint', function () {
    document.documentElement.classList.remove('printing');
    slides.forEach(caberTitulos);
    fit();
  });

  fit();
  var h = parseInt((location.hash || '').slice(1), 10);
  show(isNaN(h) ? 0 : h - 1);
  // importa os demais diagramas em segundo plano (prontos para navegar e imprimir)
  var pend = [].slice.call(document.querySelectorAll('.dpanel[data-diag]'));
  (function proximo() {
    var p = pend.shift(); if (!p) return;
    preparar(p).ready.then(function () { setTimeout(proximo, 30); });
  })();
})();
