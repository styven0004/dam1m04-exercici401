const express = require('express');
const router = express.Router();
const MySQL = require('../utilsMySQL'); // Carrega el mòdul des de l'arrel

const db = new MySQL();

// Detectar entorn Proxmox / Local
const isProxmox = !!process.env.PM2_HOME;
if (!isProxmox) {
  db.init({
    host: 'localhost',
    port: 3306,
    user: 'appuser',
    password: '1234',
    database: 'minierp_videojocs'
  });
} else {
  db.init({
    host: '127.0.0.1',
    port: 3306,
    user: 'super',
    password: '1234',
    database: 'minierp_videojocs'
  });
}

// Mapes auxiliars per fer coincidir els paràmetres de la URL amb les taules reals i vistes
const taulaMapping = {
  'productes': { tabla: 'products', vistaForm: 'producteForm', redirect: '/productes' },
  'clients': { tabla: 'customers', vistaForm: 'clientForm', redirect: '/clients' },
  'vendes': { tabla: 'sales', vistaForm: 'vendaAfegir', redirect: '/vendes' }
};

// 1. RUTA PER MOSTRAR FORMULARIS D'AFEGIR (Rutes dinàmiques compatibles amb el menú)
router.get('/:seccio/afegir', (req, res, next) => {
  const seccio = req.params.seccio;
  const mapa = taulaMapping[seccio];
  
  if (!mapa) return next(); // Si no és una secció vàlida, passa a la següent ruta

  res.render(mapa.vistaForm, {
    titol: `Afegir Nou a ${seccio}`,
    isNew: true
  });
});

// 2. RUTA PER REBRE LES DADES I RECORRER EL POST D'INSERCIÓ
router.post('/:seccio/afegir', async (req, res, next) => {
  const seccio = req.params.seccio;
  const mapa = taulaMapping[seccio];
  
  if (!mapa) return next();

  try {
    if (mapa.tabla === 'products') {
      const { name, category, price, stock, active } = req.body;
      await db.query(
        'INSERT INTO products (name, category, price, stock, active) VALUES (?, ?, ?, ?, ?)',
        [name, category, parseFloat(price) || 0, parseInt(stock) || 0, active ? 1 : 0]
      );
    } else if (mapa.tabla === 'customers') {
      const { name, email, phone } = req.body;
      await db.query(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone || null]
      );
    }
    
    res.redirect(mapa.redirect);
  } catch (err) {
    console.error(`Error al desar a ${mapa.tabla}:`, err);
    res.status(500).send('Error del servidor al desar les dades: ' + err.message);
  }
});

// 3. RUTA GENERAL PER ELIMINAR REGISTRES
router.get('/:seccio/eliminar/:id', async (req, res, next) => {
  const { seccio, id } = req.params;
  const mapa = taulaMapping[seccio];

  if (!mapa) return next();

  try {
    if (mapa.tabla === 'products') {
      // Soft delete per no trencar l'historial de vendes (recomanat)
      await db.query('UPDATE products SET active = 0 WHERE id = ?', [id]);
    } else {
      // Hard delete directe per a clients si no tenen vincles restrictius
      await db.query(`DELETE FROM ${mapa.tabla} WHERE id = ?`, [id]);
    }
    res.redirect(mapa.redirect);
  } catch (err) {
    console.error(`Error en eliminar de ${mapa.tabla}:`, err);
    res.status(500).send('No es pot eliminar el registre perquè té elements dependents en l\'historial.');
  }
});

module.exports = router;