// ============================================================
//  LUCAS FRANCHI — Animaciones del sitio público
//  Aparición al hacer scroll, nav que se achica, barra de
//  progreso, contadores y año del ©. Sin dependencias.
// ============================================================

(function () {
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const soportaObserver = 'IntersectionObserver' in window;

  // Solo se ocultan elementos si el script corre: sin JS el sitio se ve igual que siempre
  if (soportaObserver && !reducirMovimiento) document.documentElement.classList.add('anim');

  // Grupos de elementos que entran escalonados (cada hijo con un pequeño retraso)
  const GRUPOS = [
    '.beneficios-grid > *',
    '.acciones-grid > *',
    '.ccpim-links > *',
    '.acerca-stats > *',
    '.contacto-bar > *',
    '.footer-grid > *',
    '.ficha-specs > *',
    '.grilla > .prop-card',
    '.opiniones-grid > *'
  ];
  // Elementos sueltos
  const SUELTOS = [
    '.seccion-header-row', '.seccion-header', '.opiniones-header', '.seccion-azul > div:first-child',
    '.acerca-img', '.acerca-content > *', '.legal > *', '.mapa-page-header > *'
  ];

  let observer = null;
  if (soportaObserver && !reducirMovimiento) {
    observer = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  function preparar(el, retardo) {
    if (!observer || el.classList.contains('revelar')) return;
    el.classList.add('revelar');
    el.style.setProperty('--retardo', retardo + 's');
    observer.observe(el);
  }

  function prepararTodo() {
    SUELTOS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        preparar(el, sel.endsWith('> *') ? Math.min(i, 6) * 0.06 : 0);
      });
    });
    GRUPOS.forEach(function (sel) {
      const vistos = new Map();
      document.querySelectorAll(sel).forEach(function (el) {
        const padre = el.parentElement;
        const i = vistos.get(padre) || 0;
        vistos.set(padre, i + 1);
        preparar(el, (i % 6) * 0.08);
      });
    });
  }

  // ── Nav que se achica + barra de progreso ──
  function alScrollear() {
    const y = window.scrollY;
    const nav = document.querySelector('.nav');
    if (nav) nav.classList.toggle('scrolled', y > 24);
    if (barra) {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.transform = 'scaleX(' + (alto > 0 ? Math.min(y / alto, 1) : 0) + ')';
    }
  }
  let barra = null;
  let pendiente = false;
  window.addEventListener('scroll', function () {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () { pendiente = false; alScrollear(); });
  }, { passive: true });

  // ── Contador animado para números como "+10" ──
  function contar(el) {
    const m = el.textContent.match(/^(\D*)(\d+)(\D*)$/);
    if (!m || reducirMovimiento) return;
    const fin = parseInt(m[2], 10);
    const dur = 1400;
    let inicio = null;
    function paso(t) {
      if (!inicio) inicio = t;
      const p = Math.min((t - inicio) / dur, 1);
      const suave = 1 - Math.pow(1 - p, 3);
      el.textContent = m[1] + Math.round(fin * suave) + m[3];
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  // ── Link activo en la nav según la página ──
  function marcarActivo() {
    const pagina = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a:not(.nav-cta)').forEach(function (a) {
      if (a.getAttribute('href') === pagina) a.classList.add('activo');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    barra = document.createElement('div');
    barra.className = 'progreso-scroll';
    barra.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barra);

    // Año del © siempre actualizado
    document.querySelectorAll('.anio-actual').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    marcarActivo();
    prepararTodo();
    alScrollear();

    // Las tarjetas llegan después desde Supabase: observar las grillas
    if (observer && 'MutationObserver' in window) {
      document.querySelectorAll('.grilla').forEach(function (g) {
        new MutationObserver(prepararTodo).observe(g, { childList: true });
      });
    }

    // Contadores cuando entran en pantalla
    const numeros = document.querySelectorAll('.acerca-stat strong');
    if (soportaObserver && numeros.length) {
      const obsNum = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { contar(e.target); obsNum.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      numeros.forEach(function (n) { obsNum.observe(n); });
    }
  });
})();
