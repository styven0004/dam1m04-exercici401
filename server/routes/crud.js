const express = require('express');
const router = express.Router();
const MySQL = require('../utilsMySQL');

const db = new MySQL();

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

const taulaMapping = {
  'productes': { tabla: 'products', vistaForm: 'producteForm', redirect: '/productes' },
  'clients': { tabla: 'customers', vistaForm: 'clientForm', redirect: '/clients' },
  'vendes': { tabla: 'sales', vistaForm: 'vendaAfegir', redirect: '/vendes' }
};

// 1. RUTA PER MOSTRAR FORMULARIS D'AFEGIR (Escolta a: GET /accions/:seccio/afegir)
router.get('/:seccio/afegir', async (req, res, next) => {
  const seccio = req.params.seccio;
  const mapa = taulaMapping[seccio];
  
  if (!mapa) return next();

  try {
    const renderData = {
      titol: `Afegir Nou a ${seccio}`,
      isNew: true
    };

    if (seccio === 'productes') {
      const categoriesRows = await db.query(
        'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC'
      );
      let llistaCategories = categoriesRows.map(row => row.category);
      if (llistaCategories.length === 0) {
        llistaCategories = ['Acció', 'Estratègia', 'Aventura', 'RPG', 'Esports', 'Simulació'];
      }
      renderData.categories = llistaCategories;
    }

    if (seccio === 'clients') {
      renderData.titol = 'Afegir Nou Client';
    }

    if (seccio === 'vendes') {
      const clientsRows = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
      renderData.clients = db.table_to_json(clientsRows, { id: 'number', name: 'string' });

      const productsRows = await db.query('SELECT id, name, price, stock FROM products WHERE active = 1 ORDER BY name ASC');
      const productesNetejats = db.table_to_json(productsRows, { id: 'number', name: 'string', price: 'number', stock: 'number' });
      
      renderData.productesJSON = JSON.stringify(productesNetejats);
      renderData.dataAvui = new Date().toISOString().slice(0, 16);
    }

    res.render(mapa.vistaForm, renderData);
  } catch (err) {
    console.error(`Error en carregar formulari d'afegir per a ${seccio}:`, err);
    res.status(500).send('Error del servidor al carregar el formulari: ' + err.message);
  }
});

// 2. RUTA PER REBRE LES DADES I PROCESSAR LA INSERCIÓ (Escolta a: POST /accions/:seccio/afegir)
router.post('/:seccio/afegir', async (req, res, next) => {
  const seccio = req.params.seccio;
  const mapa = taulaMapping[seccio];
  
  if (!mapa) return next();

  try {
    if (mapa.tabla === 'products') {
      const { name, category, price, stock, active } = req.body;
      if (!name || !category) return res.status(400).send('Error: El nom i la categoria són obligatoris.');

      await db.query(
        'INSERT INTO products (name, category, price, stock, active) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), category, parseFloat(price) || 0, parseInt(stock) || 0, active ? 1 : 0]
      );
    } else if (mapa.tabla === 'customers') {
      const { name, email, phone } = req.body;
      if (!name || !email) return res.status(400).send('Error: El nom i l\'email són obligatoris.');

      await db.query(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [name.trim(), email.trim(), phone ? phone.trim() : null]
      );
    } else if (mapa.tabla === 'sales') {
      const { customer_id, payment_method, total, sale_date } = req.body;
      if (!customer_id) return res.status(400).send('Error: Heu de seleccionar un client.');

      const dataFinal = sale_date ? sale_date.replace('T', ' ') + ':00' : new Date();

      await db.query(
        'INSERT INTO sales (customer_id, sale_date, payment_method, total) VALUES (?, ?, ?, ?)',
        [parseInt(customer_id), dataFinal, payment_method || 'Targeta', parseFloat(total) || 0]
      );
    }
    res.redirect(mapa.redirect);
  } catch (err) {
    console.error(`Error al desar a ${mapa.tabla}:`, err);
    res.status(500).send('Error del servidor al desar les dades: ' + err.message);
  }
});

// 3. RUTA GENERAL PER ELIMINAR REGISTRES (Escolta a: GET /accions/:seccio/eliminar/:id)
router.get('/:seccio/eliminar/:id', async (req, res, next) => {
  const { seccio, id } = req.params;
  const mapa = taulaMapping[seccio];

  if (!mapa) return next();

  try {
    if (mapa.tabla === 'products') {
      await db.query('UPDATE products SET active = 0 WHERE id = ?', [id]);
    } else {
      await db.query(`DELETE FROM ${mapa.tabla} WHERE id = ?`, [id]);
    }
    res.redirect(mapa.redirect);
  } catch (err) {
    console.error(`Error en eliminar de ${mapa.tabla}:`, err);
    res.status(500).send('No es pot eliminar el registre perquè té elements dependents.');
  }
});

module.exports = router;