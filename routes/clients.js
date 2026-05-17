const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const PER_PAGINA = 10;
const LLINDAR_VIP = 150; // Total gastat per ser VIP

// Llistat
router.get('/clients', async (req, res) => {
  try {
    const pagina = Math.max(0, parseInt(req.query.pagina) || 0);
    const cerca = req.query.cerca || '';
    const soloVip = req.query.vip === '1';
    const offset = pagina * PER_PAGINA;

    let condicions = [];
    let params = [];

    if (cerca) {
      condicions.push('(c.name LIKE ? OR c.email LIKE ?)');
      params.push(`%${cerca}%`, `%${cerca}%`);
    }
    if (soloVip) {
      condicions.push(`(SELECT COALESCE(SUM(s.total),0) FROM sales s WHERE s.customer_id = c.id) >= ${LLINDAR_VIP}`);
    }

    const whereClause = condicions.length ? 'WHERE ' + condicions.join(' AND ') : '';

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM customers c ${whereClause}`, params);

    const [clients] = await db.query(
      `SELECT c.*,
         COUNT(s.id)                        AS numCompres,
         COALESCE(SUM(s.total), 0)          AS totalGastat,
         COALESCE(AVG(s.total), 0)          AS ticketMitja,
         COALESCE(SUM(s.total),0) >= ${LLINDAR_VIP} AS esVip
       FROM customers c
       LEFT JOIN sales s ON s.customer_id = c.id
       ${whereClause}
       GROUP BY c.id
       ORDER BY c.id DESC
       LIMIT ? OFFSET ?`,
      [...params, PER_PAGINA, offset]);

    const totalPagines = Math.ceil(total / PER_PAGINA);

    res.render('clients', {
      titol: 'Clients',
      clients,
      cerca,
      soloVip,
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

// Fitxa client
router.get('/clientFitxa', async (req, res) => {
  try {
    const id = parseInt(req.query.id);
    if (!id) return res.redirect('/clients');

    const [[client]] = await db.query(
      `SELECT c.*,
         COUNT(s.id)               AS numCompres,
         COALESCE(SUM(s.total),0)  AS totalGastat,
         COALESCE(AVG(s.total),0)  AS ticketMitja,
         COALESCE(SUM(s.total),0) >= ${LLINDAR_VIP} AS esVip
       FROM customers c
       LEFT JOIN sales s ON s.customer_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`, [id]);

    if (!client) return res.redirect('/clients');

    const [historial] = await db.query(
      `SELECT s.id, s.sale_date, s.total, s.payment_method
       FROM sales s WHERE s.customer_id = ?
       ORDER BY s.sale_date DESC LIMIT 10`, [id]);

    res.render('clientFitxa', { titol: `Fitxa: ${client.name}`, client, historial });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error', missatge: err.message });
  }
});

// Afegir - formulari
router.get('/clientAfegir', (req, res) => {
  res.render('clientAfegir', { titol: 'Afegir client' });
});

// Editar - formulari
router.get('/clientEditar', async (req, res) => {
  try {
    const id = parseInt(req.query.id);
    if (!id) return res.redirect('/clients');
    const [[client]] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (!client) return res.redirect('/clients');
    res.render('clientEditar', { titol: 'Editar client', client });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error', missatge: err.message });
  }
});

module.exports = router;
