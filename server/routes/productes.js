const express = require('express');
const router = express.Router();
const MySQL = require('../utilsMySQL'); // Pugem un nivell per trobar el fitxer correcte

// Instanciem la base de dades local per a aquest ruter
const db = new MySQL();

// Detectar si estem al Proxmox per heretar la mateixa configuració que a app.js
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

// 1. LLISTAT DE PRODUCTES (Amb cercador integrat i filtre LIKE)
router.get('/', async (req, res) => {
  try {
    // Reben el text del cercador si existeix (ex: ?cerca=Pikmin)
    const textCercat = req.query.cerca;
    
    let rows;
    
    if (textCercat) {
      // Si l'usuari ha escrit alguna cosa, filtrem el nom o la categoria amb LIKE
      const queryFiltre = `
        SELECT * FROM products 
        WHERE (name LIKE ? OR category LIKE ?)
        ORDER BY id DESC
      `;
      // El % permet buscar coincidències en qualsevol posició del text
      const valorCercat = `%${textCercat}%`; 
      rows = await db.query(queryFiltre, [valorCercat, valorCercat]);
    } else {
      // Si el cercador està buit, es mostren tots per defecte
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
      cerca: textCercat // Retornem el text a la vista per si vols conservar-lo a la casella de text
    });
  } catch (err) {
    console.error('Error a llistat de productes amb filtre:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 2. FORMULARI D'AFEGIR PRODUCTE
router.get('/afegir', (req, res) => {
  res.render('producteForm', {
    titol: 'Afegir Nou Producte',
    isNew: true
  });
});

// 3. ACCIÓ D'INSERIR PRODUCTE
router.post('/afegir', async (req, res) => {
  try {
    const { name, category, price, stock, active } = req.body;
    const isActive = active ? 1 : 0;

    await db.query(
      'INSERT INTO products (name, category, price, stock, active) VALUES (?, ?, ?, ?, ?)',
      [name, category, parseFloat(price) || 0, parseInt(stock) || 0, isActive]
    );

    res.redirect('/productes');
  } catch (err) {
    console.error('Error en afegir producte:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 4. FORMULARI D'EDITAR PRODUCTE
router.get('/editar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const producte = await db.queryOne('SELECT * FROM products WHERE id = ?', [id]);

    if (!producte) {
      return res.status(404).send('Producte no trobat');
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
      }
    });
  } catch (err) {
    console.error('Error en obrir formulari d\'editar producte:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 5. ACCIÓ D'ACTUALITZAR PRODUCTE
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

// 6. ACCIÓ DE SOTERRAR / ELIMINAR PRODUCTE
router.get('/eliminar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('UPDATE products SET active = 0 WHERE id = ?', [id]);
    res.redirect('/productes');
  } catch (err) {
    console.error('Error en eliminar producte:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

module.exports = router;