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

// 1. LLISTAT DE PRODUCTES (GET /productes)
router.get('/', async (req, res) => {
  try {
    const textCercat = req.query.cerca;
    let rows;
    
    if (textCercat) {
      const queryFiltre = `
        SELECT * FROM products 
        WHERE (name LIKE ? OR category LIKE ?)
        ORDER BY id DESC
      `;
      const valorCercat = `%${textCercat}%`; 
      rows = await db.query(queryFiltre, [valorCercat, valorCercat]);
    } else {
      rows = await db.query('SELECT * FROM products ORDER BY id DESC');
    }

    const records = db.table_to_json(rows, {
      price: 'number',
      stock: 'number',
      active: 'boolean'
    });

    res.render('productes', {
      titol: 'Gestió de Productes',
      productes: records,
      cerca: textCercat,
      total: records.length
    });
  } catch (err) {
    console.error('Error a llistat de productes:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 2. FORMULARI D'EDITAR PRODUCTE (GET /productes/editar/:id)
router.get('/editar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const producte = await db.queryOne('SELECT * FROM products WHERE id = ?', [id]);

    if (!producte) return res.status(404).send('Producte no trobat');

    const categoriesRows = await db.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');
    let llistaCategories = categoriesRows.map(row => row.category);
    if (llistaCategories.length === 0) {
      llistaCategories = ['Acció', 'Estratègia', 'Aventura', 'RPG', 'Esports', 'Simulació'];
    }

    res.render('producteForm', {
      titol: 'Editar Producte',
      isNew: false,
      producte: {
        id: producte.id,
        name: producte.name,
        category: producte.category,
        price: parseFloat(producte.price).toFixed(2),
        stock: parseInt(producte.stock),
        active: producte.active === 1
      },
      categories: llistaCategories
    });
  } catch (err) {
    console.error('Error en obrir formulari d\'editar producte:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 3. ACCIÓ D'ACTUALITZAR PRODUCTE (POST /productes/editar/:id)
router.post('/editar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, price, stock, active } = req.body;
    const isActive = active ? 1 : 0;

    await db.query(
      'UPDATE products SET name = ?, category = ?, price = ?, stock = ?, active = ? WHERE id = ?',
      [name, category, parseFloat(price) || 0, parseInt(stock) || 0, isActive, id]
    );
    res.redirect('/productes');
  } catch (err) {
    console.error('Error en actualitzar producte:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

module.exports = router;