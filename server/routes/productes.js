const express = require('express');
const router = express.Router();
const db = require('../utilsMySQL');

const PER_PAGINA = 10;

// Llistat productes
router.get('/', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 0;
    const cerca = req.query.cerca || '';
    const offset = pagina * PER_PAGINA;

    let whereClause = '';
    let params = [];

    if (cerca) {
      whereClause = 'WHERE name LIKE ? OR category LIKE ?';
      params = [`%${cerca}%`, `%${cerca}%`];
    }

    const countRow = await db.queryOne(`SELECT COUNT(*) as total FROM products ${whereClause}`, params);
    const total = countRow.total;
    const totalPagines = Math.ceil(total / PER_PAGINA);

    const productes = await db.query(
      `SELECT * FROM products ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, PER_PAGINA, offset]
    );

    // Construir array de pàgines
    const pagines = Array.from({ length: totalPagines }, (_, i) => ({
      num: i,
      actual: i === pagina
    }));

    res.render('productes', {
      titol: 'Productes',
      productes,
      total,
      cerca,
      pagina,
      totalPagines: totalPagines > 1 ? totalPagines : null,
      pagines,
      paginaAnterior: pagina > 0 ? pagina - 1 : null,
      paginaSeguent: pagina < totalPagines - 1 ? pagina + 1 : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// Formulari afegir
router.get('/producteAfegir', async (req, res) => {
  const categories = ['Acció', 'Aventura', 'RPG', 'Shooter', 'Esports', 'Carreres', 'Lluita', 'Terror', 'Simulació', 'Sandbox', 'Plataformes', 'Roguelike', 'Estratègia', 'Party'];
  res.render('producteForm', { titol: 'Nou Producte', categories });
});

// Formulari editar
router.get('/producteEditar', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.redirect('/productes');
    const producte = await db.queryOne('SELECT * FROM products WHERE id = ?', [id]);
    if (!producte) return res.redirect('/productes');
    const categories = ['Acció', 'Aventura', 'RPG', 'Shooter', 'Esports', 'Carreres', 'Lluita', 'Terror', 'Simulació', 'Sandbox', 'Plataformes', 'Roguelike', 'Estratègia', 'Party'];
    res.render('producteForm', { titol: `Editar: ${producte.name}`, producte, categories });
  } catch (err) {
    console.error(err);
    res.redirect('/productes');
  }
});

module.exports = router;
