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

// 1. LLISTAT DE CLIENTS (GET /clients)
router.get('/', async (req, res) => {
  try {
    const textCercat = req.query.cerca;
    let rows;
    
    if (textCercat) {
      const queryFiltre = `
        SELECT c.*, 
               COUNT(s.id) AS num_compres, 
               COALESCE(SUM(s.total), 0) AS total_gastat
        FROM customers c
        LEFT JOIN sales s ON s.customer_id = c.id
        WHERE (c.name LIKE ? OR c.email LIKE ?)
        GROUP BY c.id
        ORDER BY c.id DESC
      `;
      const valorCercat = `%${textCercat}%`;
      rows = await db.query(queryFiltre, [valorCercat, valorCercat]);
    } else {
      rows = await db.query(`
        SELECT c.*, 
               COUNT(s.id) AS num_compres, 
               COALESCE(SUM(s.total), 0) AS total_gastat
        FROM customers c
        LEFT JOIN sales s ON s.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.id DESC
      `);
    }

    const records = db.table_to_json(rows, {
      num_compres: 'number',
      total_gastat: 'number'
    });

    res.render('clients', {
      titol: 'Gestió de Clients',
      clients: records,
      cerca: textCercat,
      total: records.length
    });
  } catch (err) {
    console.error('Error a llistat de clients:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 2. FITXA DE DETALL DEL CLIENT (GET /clients/detall/:id)
router.get('/detall/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const client = await db.queryOne('SELECT * FROM customers WHERE id = ?', [id]);

    if (!client) return res.status(404).send('Client no trobat');

    // Busquem l'historial de vendes d'aquest client
    const vendesRows = await db.query('SELECT * FROM sales WHERE customer_id = ? ORDER BY sale_date DESC', [id]);
    const vendes = db.table_to_json(vendesRows, { total: 'number' });

    res.render('clientFitxa', {
      titol: 'Fitxa del Client',
      client,
      vendes
    });
  } catch (err) {
    console.error('Error en obrir detall del client:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 3. FORMULARI D'EDITAR CLIENT (GET /clients/editar/:id)
router.get('/editar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const client = await db.queryOne('SELECT * FROM customers WHERE id = ?', [id]);

    if (!client) return res.status(404).send('Client no trobat');

    res.render('clientForm', {
      titol: 'Editar Client',
      isNew: false,
      client
    });
  } catch (err) {
    console.error('Error en obrir formulari d\'editar client:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 4. ACCIÓ D'ACTUALITZAR CLIENT (POST /clients/editar/:id)
router.post('/editar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, phone } = req.body;

    await db.query(
      'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name, email, phone || null, id]
    );
    res.redirect('/clients');
  } catch (err) {
    console.error('Error en actualitzar client:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

module.exports = router;