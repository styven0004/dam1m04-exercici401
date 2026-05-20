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

// 1. HISTORIAL DE VENDES (GET /vendes)
router.get('/', async (req, res) => {
  try {
    const textCercat = req.query.cerca;
    let rows;

    let sql = `
      SELECT s.id, s.sale_date, s.payment_method, s.total, c.name AS client_name
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
    `;

    if (textCercat) {
      sql += ` WHERE c.name LIKE ? ORDER BY s.id DESC`;
      rows = await db.query(sql, [`%${textCercat}%`]);
    } else {
      sql += ` ORDER BY s.id DESC`;
      rows = await db.query(sql);
    }

    const records = db.table_to_json(rows, { total: 'number' });

    res.render('vendes', {
      titol: 'Historial de Vendes',
      vendes: records.map(v => ({
        ...v,
        sale_date: v.sale_date ? new Date(v.sale_date).toLocaleString('ca-ES') : ''
      })),
      cerca: textCercat,
      total: records.length
    });
  } catch (err) {
    console.error('Error a llistat de vendes:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 2. DETALL / FACTURA D'UNA VENDA (GET /vendes/detall/:id)
router.get('/detall/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const venda = await db.queryOne(`
      SELECT s.*, c.name AS client_name, c.email AS client_email
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      WHERE s.id = ?
    `, [id]);

    if (!venda) return res.status(404).send('Venda no trobada');

    // Opcional: llista d'ítems si tens una taula anomenada sale_items
    const items = await db.query(`
      SELECT si.*, p.name AS product_name
      FROM sale_items si
      LEFT JOIN products p ON p.id = si.product_id
      WHERE si.sale_id = ?
    `, [id]);

    res.render('vendaFitxa', {
      titol: 'Detall de la Venda',
      venda: {
        ...venda,
        sale_date: venda.sale_date ? new Date(venda.sale_date).toLocaleString('ca-ES') : '',
        total: parseFloat(venda.total).toFixed(2)
      },
      items
    });
  } catch (err) {
    console.error('Error en obrir fitxa de venda:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

module.exports = router;