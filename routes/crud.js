const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const TAULES_PERMESES = ['products', 'customers'];

// CREATE
router.post('/create', async (req, res) => {
  try {
    const { taula, ...dades } = req.body;
    if (!TAULES_PERMESES.includes(taula)) return res.status(400).send('Taula no permesa');
    delete dades.id;

    if (taula === 'products') {
      dades.active = dades.active === 'on' || dades.active === '1' ? 1 : 0;
      dades.price = parseFloat(dades.price) || 0;
      dades.stock = parseInt(dades.stock) || 0;
    }

    const cols = Object.keys(dades).join(', ');
    const vals = Object.values(dades);
    const placeholders = vals.map(() => '?').join(', ');

    await db.query(`INSERT INTO ${taula} (${cols}) VALUES (${placeholders})`, vals);

    const redirigeix = taula === 'products' ? '/productes' : '/clients';
    res.redirect(redirigeix);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error en crear', missatge: err.message });
  }
});

// UPDATE
router.post('/update', async (req, res) => {
  try {
    const { taula, id, ...dades } = req.body;
    if (!TAULES_PERMESES.includes(taula)) return res.status(400).send('Taula no permesa');
    if (!id) return res.status(400).send('ID obligatori');

    if (taula === 'products') {
      dades.active = dades.active === 'on' || dades.active === '1' ? 1 : 0;
      dades.price = parseFloat(dades.price) || 0;
      dades.stock = parseInt(dades.stock) || 0;
    }

    const setClause = Object.keys(dades).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(dades), id];

    await db.query(`UPDATE ${taula} SET ${setClause} WHERE id = ?`, vals);

    const redirigeix = taula === 'products' ? '/productes' : '/clients';
    res.redirect(redirigeix);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error en actualitzar', missatge: err.message });
  }
});

// DELETE
router.post('/delete', async (req, res) => {
  try {
    const { taula, id } = req.body;
    if (!TAULES_PERMESES.includes(taula)) return res.status(400).send('Taula no permesa');
    if (!id) return res.status(400).send('ID obligatori');

    await db.query(`DELETE FROM ${taula} WHERE id = ?`, [id]);

    const redirigeix = taula === 'products' ? '/productes' : '/clients';
    res.redirect(redirigeix);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { titol: 'Error en esborrar', missatge: err.message });
  }
});

module.exports = router;
