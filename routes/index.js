const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const avui = new Date().toISOString().split('T')[0];
    const mesInici = avui.substring(0, 7) + '-01';

    const [[{ vendesTotalsAvui }]] = await db.query(
      `SELECT COALESCE(SUM(total),0) AS vendesTotalsAvui FROM sales WHERE sale_date = ?`, [avui]);
    const [[{ vendesTotalsMes }]] = await db.query(
      `SELECT COALESCE(SUM(total),0) AS vendesTotalsMes FROM sales WHERE sale_date >= ?`, [mesInici]);
    const [[{ comandesAvui }]] = await db.query(
      `SELECT COUNT(*) AS comandesAvui FROM sales WHERE sale_date = ?`, [avui]);
    const [[{ comandesMes }]] = await db.query(
      `SELECT COUNT(*) AS comandesMes FROM sales WHERE sale_date >= ?`, [mesInici]);
    const [[{ stockBaix }]] = await db.query(
      `SELECT COUNT(*) AS stockBaix FROM products WHERE stock <= 5 AND active = 1`);

    const [ultimesVendes] = await db.query(
      `SELECT s.id, s.sale_date, s.total, c.name AS clientNom
       FROM sales s JOIN customers c ON s.customer_id = c.id
       ORDER BY s.sale_date DESC, s.id DESC LIMIT 5`);

    const [topProductes] = await db.query(
      `SELECT p.name, SUM(si.qty) AS totalVenuts
       FROM sale_items si JOIN products p ON si.product_id = p.id
       GROUP BY p.id, p.name ORDER BY totalVenuts DESC LIMIT 5`);

    const [productesBaix] = await db.query(
      `SELECT name, stock FROM products WHERE stock <= 5 AND active = 1 ORDER BY stock ASC LIMIT 10`);

    res.render('dashboard', {
      titol: 'Panell de control',
      vendesTotalsAvui: Number(vendesTotalsAvui).toFixed(2),
      vendesTotalsMes:  Number(vendesTotalsMes).toFixed(2),
      comandesAvui,
      comandesMes,
      stockBaix,
      ultimesVendes,
      topProductes,
      productesBaix
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error', missatge: err.message });
  }
});

module.exports = router;
