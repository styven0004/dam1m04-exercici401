/* ===================================================
   MiniERP GameStore — validacio.js
   Validació de formularis amb errors per camp
   =================================================== */

function mostraError(campId, errId, missatge) {
  const camp = document.getElementById(campId);
  const err  = document.getElementById(errId);
  if (camp)  camp.classList.add('invalid');
  if (err)   err.textContent = missatge;
}

function netejaError(campId, errId) {
  const camp = document.getElementById(campId);
  const err  = document.getElementById(errId);
  if (camp) camp.classList.remove('invalid');
  if (err)  err.textContent = '';
}

function netejaTotsErrors() {
  document.querySelectorAll('.form-control').forEach(c => c.classList.remove('invalid'));
  document.querySelectorAll('.error-msg').forEach(e => e.textContent = '');
}

// ---- Validació producte ----
function validaProducte() {
  netejaTotsErrors();
  let valid = true;

  const name     = document.getElementById('name');
  const category = document.getElementById('category');
  const price    = document.getElementById('price');
  const stock    = document.getElementById('stock');

  if (!name || !name.value.trim() || name.value.trim().length < 3) {
    mostraError('name', 'err-name', 'El nom és obligatori i ha de tenir almenys 3 caràcters.');
    valid = false;
  }

  if (!category || !category.value) {
    mostraError('category', 'err-category', 'Selecciona una categoria.');
    valid = false;
  }

  const preuVal = parseFloat(price ? price.value : '');
  if (!price || isNaN(preuVal) || preuVal <= 0) {
    mostraError('price', 'err-price', 'El preu ha de ser un número major que 0.');
    valid = false;
  }

  const stockVal = stock ? stock.value : '';
  if (!stock || stockVal === '' || !Number.isInteger(Number(stockVal)) || Number(stockVal) < 0) {
    mostraError('stock', 'err-stock', 'El stock ha de ser un número enter major o igual a 0.');
    valid = false;
  }

  return valid;
}

// ---- Validació client ----
function validaClient() {
  netejaTotsErrors();
  let valid = true;

  const name  = document.getElementById('name');
  const email = document.getElementById('email');
  const phone = document.getElementById('phone');

  if (!name || !name.value.trim() || name.value.trim().length < 2) {
    mostraError('name', 'err-name', 'El nom és obligatori i ha de tenir almenys 2 caràcters.');
    valid = false;
  }

  const emailVal = email ? email.value.trim() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(emailVal)) {
    mostraError('email', 'err-email', 'Introdueix un email vàlid (exemple: nom@domini.cat).');
    valid = false;
  }

  const phoneVal = phone ? phone.value.trim() : '';
  if (!phone || phoneVal.length < 9) {
    mostraError('phone', 'err-phone', 'El telèfon ha de tenir almenys 9 caràcters.');
    valid = false;
  }

  return valid;
}

// ---- Validació en temps real (live) ----
document.addEventListener('DOMContentLoaded', () => {
  const name = document.getElementById('name');
  if (name) name.addEventListener('blur', () => {
    if (name.value.trim().length >= 2) netejaError('name', 'err-name');
  });

  const email = document.getElementById('email');
  if (email) email.addEventListener('blur', () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (re.test(email.value.trim())) netejaError('email', 'err-email');
  });

  const phone = document.getElementById('phone');
  if (phone) phone.addEventListener('blur', () => {
    if (phone.value.trim().length >= 9) netejaError('phone', 'err-phone');
  });

  const price = document.getElementById('price');
  if (price) price.addEventListener('blur', () => {
    if (parseFloat(price.value) > 0) netejaError('price', 'err-price');
  });

  const stock = document.getElementById('stock');
  if (stock) stock.addEventListener('blur', () => {
    const v = stock.value;
    if (v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0) netejaError('stock', 'err-stock');
  });
});
