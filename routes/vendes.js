const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const PER_PAGINA = 10;

// Llistat
router.get('/vendes', async (req, res) => {
  try {
    const pagina = Math.max(0, parseInt(req.query.pagina) || 0);
    const cerca = req.query.cerca || '';
    const offset = pagina * PER_PAGINA;

    let whereClause = '';
    let params = [];
    if (cerca) {
      whereClause = 'WHERE (c.name LIKE ? OR s.payment_method LIKE ?)';
      params = [`%${cerca}%`, `%${cerca}%`];
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM sales s JOIN customers c ON s.customer_id = c.id ${whereClause}`, params);

    const [vendes] = await db.query(
      `SELECT s.id, s.sale_date, s.total, s.payment_method, c.name AS clientNom, c.id AS clientId
       FROM sales s JOIN customers c ON s.customer_id = c.id
       ${whereClause}
       ORDER BY s.sale_date DESC, s.id DESC
       LIMIT ? OFFSET ?`,
      [...params, PER_PAGINA, offset]);

    const totalPagines = Math.ceil(total / PER_PAGINA);

    res.render('vendes', {
      titol: 'Vendes',
      vendes,
      cerca,
      pagina,
      totalPagines,
      hiHaPaginaAnterior: pagina > 0,
      hiHaPaginaSeguent: pagina < totalPagines - 1,
      paginaAnterior: pagina - 1,
      paginaSeguent: pagina + 1,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error', missatge: err.message });
  }
});

// Detall venda
router.get('/vendaDetall', async (req, res) => {
  try {
    const id = parseInt(req.query.id);
    if (!id) return res.redirect('/vendes');

    const [[venda]] = await db.query(
      `SELECT s.*, c.name AS clientNom, c.id AS clientId
       FROM sales s JOIN customers c ON s.customer_id = c.id
       WHERE s.id = ?`, [id]);

    if (!venda) return res.redirect('/vendes');

    const [linies] = await db.query(
      `SELECT si.*, p.name AS productNom, p.category
       FROM sale_items si JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`, [id]);

    res.render('vendaDetall', { titol: `Venda #${id}`, venda, linies });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error', missatge: err.message });
  }
});

// Afegir venda - formulari
router.get('/vendaAfegir', async (req, res) => {
  try {
    const [clients] = await db.query('SELECT id, name FROM customers ORDER BY name ASC');
    const [productes] = await db.query('SELECT id, name, price, stock FROM products WHERE active = 1 ORDER BY name ASC');
    res.render('vendaAfegir', { titol: 'Nova venda', clients, productes });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error', missatge: err.message });
  }
});

// POST nova venda
router.post('/vendaCreate', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { customer_id, sale_date, payment_method, product_ids, qtys, unit_prices } = req.body;

    const pids = Array.isArray(product_ids) ? product_ids : [product_ids];
    const qts  = Array.isArray(qtys)        ? qtys        : [qtys];
    const ups  = Array.isArray(unit_prices)  ? unit_prices  : [unit_prices];

    let totalVenda = 0;
    const linies = pids.map((pid, i) => {
      const qty = parseInt(qts[i]) || 1;
      const up  = parseFloat(ups[i]) || 0;
      const lt  = parseFloat((qty * up).toFixed(2));
      totalVenda += lt;
      return { pid: parseInt(pid), qty, up, lt };
    }).filter(l => l.pid > 0 && l.qty > 0);

    const [result] = await conn.query(
      `INSERT INTO sales (customer_id, sale_date, payment_method, total) VALUES (?,?,?,?)`,
      [customer_id, sale_date, payment_method, totalVenda.toFixed(2)]);

    const saleId = result.insertId;

    for (const l of linies) {
      const [[{ stock }]] = await conn.query('SELECT stock FROM products WHERE id = ?', [l.pid]);
      if (stock < l.qty) {
        await conn.rollback();
        conn.release();
        return res.redirect('/vendaAfegir?error=stock');
      }
      await conn.query(
        `INSERT INTO sale_items (sale_id, product_id, qty, unit_price, line_total) VALUES (?,?,?,?,?)`,
        [saleId, l.pid, l.qty, l.up, l.lt]);
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [l.qty, l.pid]);
    }

    await conn.commit();
    conn.release();
    res.redirect('/vendes');
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).render('error', { titol: 'Error', missatge: err.message });
  }
});

module.exports = router;
