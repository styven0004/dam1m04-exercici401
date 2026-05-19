const express = require('express');
const router = express.Router();
const db = require('../utilsMySQL');

const PER_PAGINA = 10;

// Llistat vendes
router.get('/', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 0;
    const cerca = req.query.cerca || '';
    const offset = pagina * PER_PAGINA;

    let whereClause = '';
    let params = [];

    if (cerca) {
      whereClause = 'WHERE c.name LIKE ?';
      params = [`%${cerca}%`];
    }

    const countRow = await db.queryOne(
      `SELECT COUNT(*) as total FROM sales s LEFT JOIN customers c ON c.id = s.customer_id ${whereClause}`,
      params
    );
    const total = countRow.total;
    const totalPagines = Math.ceil(total / PER_PAGINA);

    const vendes = await db.query(`
      SELECT s.*, c.name AS client_name
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      ${whereClause}
      ORDER BY s.sale_date DESC
      LIMIT ? OFFSET ?
    `, [...params, PER_PAGINA, offset]);

    const vendesFormatades = vendes.map(v => ({
      ...v,
      sale_date: new Date(v.sale_date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      total: parseFloat(v.total).toFixed(2)
    }));

    const pagines = Array.from({ length: totalPagines }, (_, i) => ({ num: i, actual: i === pagina }));

    res.render('vendes', {
      titol: 'Vendes',
      vendes: vendesFormatades,
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

// Fitxa venda
router.get('/vendaFitxa', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.redirect('/vendes');

    const venda = await db.queryOne(`
      SELECT s.*, c.name AS client_name
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      WHERE s.id = ?
    `, [id]);

    if (!venda) return res.redirect('/vendes');

    const linies = await db.query(`
      SELECT si.*, p.name AS product_name
      FROM sale_items si
      LEFT JOIN products p ON p.id = si.product_id
      WHERE si.sale_id = ?
    `, [id]);

    res.render('vendaFitxa', {
      titol: `Venda #${id}`,
      venda: {
        ...venda,
        sale_date: new Date(venda.sale_date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        total: parseFloat(venda.total).toFixed(2)
      },
      linies: linies.map(l => ({
        ...l,
        unit_price: parseFloat(l.unit_price).toFixed(2),
        line_total: parseFloat(l.line_total).toFixed(2)
      }))
    });
  } catch (err) {
    console.error(err);
    res.redirect('/vendes');
  }
});

// Formulari nova venda
router.get('/vendaAfegir', async (req, res) => {
  try {
    const clients = await db.query('SELECT id, name FROM customers ORDER BY name');
    const productes = await db.query('SELECT id, name, price, stock FROM products WHERE active = 1 AND stock > 0 ORDER BY name');

    const ara = new Date();
    const dataAvui = ara.toISOString().slice(0, 16);

    res.render('vendaAfegir', {
      titol: 'Nova Venda',
      clients,
      productesJSON: JSON.stringify(productes),
      dataAvui
    });
  } catch (err) {
    console.error(err);
    res.redirect('/vendes');
  }
});

module.exports = router;
