/* ===================================================
   MiniERP GameStore — main.js
   Gestió de temes, toggles i preferències localStorage
   =================================================== */

const TEMES = ['tema-clar', 'tema-nit', 'tema-contrast'];

// ---- Temes ----
function canviaTema(tema) {
  if (!TEMES.includes(tema)) return;
  document.body.classList.remove(...TEMES);
  document.body.classList.add(tema);
  localStorage.setItem('erp-tema', tema);

  const sel = document.getElementById('selector-tema');
  if (sel) sel.value = tema;
}

function carregaTema() {
  const tema = localStorage.getItem('erp-tema') || 'tema-clar';
  canviaTema(tema);
}

// ---- Colors stock ----
function toggleColors(btn) {
  const actiu = document.body.classList.toggle('colors-stock');
  localStorage.setItem('erp-colors-stock', actiu ? '1' : '0');
  if (btn) btn.classList.toggle('actiu', actiu);
}

function carregaColorsStock() {
  if (localStorage.getItem('erp-colors-stock') === '1') {
    document.body.classList.add('colors-stock');
    document.querySelectorAll('#btn-colors, #btn-colors-prod').forEach(b => {
      if (b) b.classList.add('actiu');
    });
  }
}

// ---- Resalta nav actual ----
function resaltaNavActual() {
  const ruta = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    const coincideix = href === '/'
      ? ruta === '/'
      : ruta.startsWith(href);
    a.classList.toggle('nav-actiu', coincideix);
    if (coincideix) {
      a.style.background = 'rgba(255,255,255,0.15)';
      a.style.color = '#fff';
      a.style.fontWeight = '600';
    }
  });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  carregaTema();
  carregaColorsStock();
  resaltaNavActual();
});
