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

// 1. LLISTAT DE VENDES GENERAL
router.get('/', async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT s.id, s.sale_date, s.payment_method, s.total, c.name AS client_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      ORDER BY s.id DESC
    `);

    const records = db.table_to_json(rows, {
      id: 'number',
      total: 'number',
      client_name: 'string',
      payment_method: 'string'
    });

    // Formategem les dates de cara a la vista
    const vendesFormatades = records.map(v => ({
      ...v,
      sale_date: v.sale_date ? new Date(v.sale_date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
      total: parseFloat(v.total).toFixed(2)
    }));

    res.render('vendes', {
      titol: 'Historial de Vendes',
      vendes: vendesFormatades
    });
  } catch (err) {
    console.error('Error a llistat de vendes:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// 2. DETALL / FITXA D'UNA VENDA (QueryOne corregit!)
router.get('/fitxa/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Obtenir la capçalera de la venda
    const venda = await db.queryOne(`
      SELECT s.*, c.name AS client_name, c.email AS client_email 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = ?
    `, [id]);

    if (!venda) {
      return res.status(404).send('Venda no trobada');
    }

    // Obtenir les línies d'articles d'aquesta venda
    const itemsRaw = await db.query(`
      SELECT si.*, p.name AS product_name 
      FROM sale_items si 
      LEFT JOIN products p ON si.product_id = p.id 
      WHERE si.sale_id = ?
    `, [id]);

    const items = db.table_to_json(itemsRaw, {
      qty: 'number',
      unit_price: 'number',
      line_total: 'number'
    });

    res.render('vendaFitxa', {
      titol: `Detall de la Venda #${venda.id}`,
      venda: {
        id: venda.id,
        payment_method: venda.payment_method,
        total: parseFloat(venda.total).toFixed(2),
        client_name: venda.client_name || 'Client Anònim',
        client_email: venda.client_email || '',
        sale_date: venda.sale_date ? new Date(venda.sale_date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
      },
      items: items.map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price).toFixed(2),
        line_total: parseFloat(item.line_total).toFixed(2)
      }))
    });
  } catch (err) {
    console.error('Error en obrir fitxa de la venda:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

module.exports = router;