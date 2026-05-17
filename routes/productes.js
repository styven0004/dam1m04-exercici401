const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const PER_PAGINA = 10;

// Llistat
router.get('/productes', async (req, res) => {
  try {
    const pagina = Math.max(0, parseInt(req.query.pagina) || 0);
    const cerca = req.query.cerca || '';
    const offset = pagina * PER_PAGINA;

    let whereClause = '';
    let params = [];
    if (cerca) {
      whereClause = 'WHERE (name LIKE ? OR category LIKE ?)';
      params = [`%${cerca}%`, `%${cerca}%`];
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products ${whereClause}`, params);

    const [productes] = await db.query(
      `SELECT * FROM products ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, PER_PAGINA, offset]);

    const totalPagines = Math.ceil(total / PER_PAGINA);

    res.render('productes', {
      titol: 'Productes',
      productes,
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

// Afegir - formulari
router.get('/producteAfegir', (req, res) => {
  res.render('producteAfegir', { titol: 'Afegir producte' });
});

// Editar - formulari
router.get('/producteEditar', async (req, res) => {
  try {
    const id = parseInt(req.query.id);
    if (!id) return res.redirect('/productes');
    const [[producte]] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!producte) return res.redirect('/productes');
    res.render('producteEditar', { titol: 'Editar producte', producte });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error', missatge: err.message });
  }
});

module.exports = router;
