const express = require('express');
const router = express.Router();
const MySQL = require('../utilsMySQL'); // Pujem un nivell de carpeta

const db = new MySQL();

// Detectar si estem al Proxmox
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

// 1. LLISTAT DE CLIENTS
router.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM customers ORDER BY id DESC');
    const records = db.table_to_json(rows, {
      name: 'string',
      email: 'string',
      phone: 'string'
    });

    res.render('clients', {
      titol: 'Gestió de Clients',
      clients: records
    });
  } catch (err) {
    console.error('Error a llistat de clients:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 2. FORMULARI D'AFEGIR CLIENT
router.get('/afegir', (req, res) => {
  res.render('clientForm', {
    titol: 'Afegir Nou Client',
    isNew: true
  });
});

// 3. ACCIÓ D'INSERIR CLIENT
router.post('/afegir', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    await db.query(
      'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone || null]
    );

    res.redirect('/clients');
  } catch (err) {
    console.error('Error en afegir client:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 4. FORMULARI D'EDITAR CLIENT (QueryOne corregit!)
router.get('/editar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const client = await db.queryOne('SELECT * FROM customers WHERE id = ?', [id]);

    if (!client) {
      return res.status(404).send('Client no trobat');
    }

    res.render('clientForm', {
      titol: 'Editar Client',
      isNew: false,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone
      }
    });
  } catch (err) {
    console.error('Error en obrir formulari d\'editar client:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 5. ACCIÓ D'ACTUALITZAR CLIENT
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

// 6. ACCIÓ D'ELIMINAR CLIENT
router.get('/eliminar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM customers WHERE id = ?', [id]);
    res.redirect('/clients');
  } catch (err) {
    console.error('Error en eliminar client:', err);
    res.status(500).send('Error de restricció: No es pot eliminar un client amb vendes associades.');
  }
});

module.exports = router;