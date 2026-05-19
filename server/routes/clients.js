const express = require('express');
const router = express.Router();
const db = require('../utilsMySQL');

const PER_PAGINA = 10;
const VIP_THRESHOLD = 3; // >=3 compres = VIP

// Llistat clients
router.get('/', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 0;
    const cerca = req.query.cerca || '';
    const vip = req.query.vip === '1';
    const offset = pagina * PER_PAGINA;

    let conditions = [];
    let params = [];

    if (cerca) {
      conditions.push('(c.name LIKE ? OR c.email LIKE ?)');
      params.push(`%${cerca}%`, `%${cerca}%`);
    }

    const havingClause = vip ? `HAVING num_compres >= ${VIP_THRESHOLD}` : '';
    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const baseQuery = `
      SELECT c.*,
        COUNT(s.id) AS num_compres,
        COALESCE(SUM(s.total), 0) AS total_gastat
      FROM customers c
      LEFT JOIN sales s ON s.customer_id = c.id
      ${whereClause}
      GROUP BY c.id
      ${havingClause}
    `;

    const countRow = await db.queryOne(`SELECT COUNT(*) as total FROM (${baseQuery}) sub`, params);
    const total = countRow.total;
    const totalPagines = Math.ceil(total / PER_PAGINA);

    const clients = await db.query(`${baseQuery} ORDER BY c.id DESC LIMIT ? OFFSET ?`, [...params, PER_PAGINA, offset]);

    const clientsFormatats = clients.map(c => ({
      ...c,
      total_gastat: parseFloat(c.total_gastat || 0).toFixed(2),
      esVip: c.num_compres >= VIP_THRESHOLD
    }));

    const pagines = Array.from({ length: totalPagines }, (_, i) => ({ num: i, actual: i === pagina }));

    res.render('clients', {
      titol: 'Clients',
      clients: clientsFormatats,
      total,
      cerca,
      vip,
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

// Fitxa client
router.get('/clientFitxa', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.redirect('/clients');

    const client = await db.queryOne(`
      SELECT c.*,
        COUNT(s.id) AS num_compres,
        COALESCE(SUM(s.total), 0) AS total_gastat
      FROM customers c
      LEFT JOIN sales s ON s.customer_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    if (!client) return res.redirect('/clients');

    const historial = await db.query(`
      SELECT * FROM sales WHERE customer_id = ? ORDER BY sale_date DESC LIMIT 10
    `, [id]);

    const historialFormatat = historial.map(s => ({
      ...s,
      sale_date: new Date(s.sale_date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }));

    const totalGastat = parseFloat(client.total_gastat || 0);
    const ticketMig = client.num_compres > 0 ? (totalGastat / client.num_compres).toFixed(2) : '0.00';

    res.render('clientFitxa', {
      titol: client.name,
      client: {
        ...client,
        total_gastat: totalGastat.toFixed(2),
        ticket_mig: ticketMig,
        esVip: client.num_compres >= VIP_THRESHOLD,
        created_at: new Date(client.created_at).toLocaleDateString('ca-ES')
      },
      historial: historialFormatat
    });
  } catch (err) {
    console.error(err);
    res.redirect('/clients');
  }
});

// Formulari afegir
router.get('/clientAfegir', (req, res) => {
  res.render('clientForm', { titol: 'Nou Client' });
});

// Formulari editar
router.get('/clientEditar', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.redirect('/clients');
    const client = await db.queryOne('SELECT * FROM customers WHERE id = ?', [id]);
    if (!client) return res.redirect('/clients');
    res.render('clientForm', { titol: `Editar: ${client.name}`, client });
  } catch (err) {
    console.error(err);
    res.redirect('/clients');
  }
});

module.exports = router;
