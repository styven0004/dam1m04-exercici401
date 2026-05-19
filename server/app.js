const express = require('express');
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const MySQL = require('./utilsMySQL');

const app = express();
const port = process.env.PORT || 3000;

// Detectar si estem al Proxmox (si és pm2)
const isProxmox = !!process.env.PM2_HOME;

// Iniciar connexió MySQL amb el nom de la teva base de dades
const db = new MySQL();
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

// Static files & body parsers
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Disable cache
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Handlebars configuration
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// CONFIGURACIÓ DEL LAYOUT GLOBAL AUTOMÀTIC
app.set('view options', { layout: 'layouts/main' });

// Registrar Helpers indispensables per a les teves vistes
hbs.registerHelper('ifeq', (a, b) => a == b);
hbs.registerHelper('plusOne', (val) => parseInt(val) + 1);
hbs.registerHelper('any', () => new Date().getFullYear());

// Registrar Partials (Menús, capçaleres, etc.)
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// ---- DASHBOARD (Ruta arrel) ----
app.get('/', async (req, res) => {
  try {
    const anyActual = new Date().getFullYear();
    const avui = new Date().toISOString().slice(0, 10);
    const primerDiaMes = `2025-01-01`; 

    // KPIs - Mitjançant mètodes queryOne adaptats
    const vendesAvuiRow = await db.queryOne(
      `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS num FROM sales WHERE DATE(sale_date) = ?`,
      [avui]
    );
    const vendesMesRow = await db.queryOne(
      `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS num FROM sales WHERE sale_date >= ?`,
      [primerDiaMes]
    );
    const stockBaixRow = await db.queryOne(
      `SELECT COUNT(*) AS num FROM products WHERE stock <= 5 AND active = 1`
    );

    // Últimes 5 vendes
    const ultVendesRaw = await db.query(`
      SELECT s.id, s.total, s.sale_date, c.name AS client
      FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
      ORDER BY s.sale_date DESC LIMIT 5
    `);
    
    const ultVendes = Array.isArray(ultVendesRaw) ? ultVendesRaw.map(v => ({
      data: v.sale_date ? new Date(v.sale_date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '',
      client: v.client || 'Client Anònim',
      total: v.total ? parseFloat(v.total).toFixed(2) : '0.00'
    })) : [];

    // Top 5 productes més venuts
    const topProductesRaw = await db.query(`
      SELECT p.id, p.name, p.stock, COALESCE(SUM(si.qty), 0) AS total_venuts
      FROM products p
      LEFT JOIN sale_items si ON si.product_id = p.id
      GROUP BY p.id, p.name, p.stock
      ORDER BY total_venuts DESC
      LIMIT 5
    `);
    
    const topProductes = Array.isArray(topProductesRaw) ? topProductesRaw.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      total_venuts: p.total_venuts
    })) : [];

    res.render('index', {
      titol: 'Dashboard',
      vendesAvui: vendesAvuiRow && vendesAvuiRow.total ? parseFloat(vendesAvuiRow.total).toFixed(2) : '0.00',
      numVendesAvui: vendesAvuiRow ? vendesAvuiRow.num : 0,
      vendesMes: vendesMesRow && vendesMesRow.total ? parseFloat(vendesMesRow.total).toFixed(2) : '0.00',
      numVendesMes: vendesMesRow ? vendesMesRow.num : 0,
      productesBaixStock: stockBaixRow ? stockBaixRow.num : 0,
      ultVendes,
      topProductes,
      any: anyActual
    });

  } catch (err) {
    console.error('Error al dashboard:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// ---- RUTES DELS CONTROLADORS INTERNS ----

// Middleware per forçar que totes les sub-rutes heretin correctament el layout
app.use((req, res, next) => {
  res.locals.layout = 'layouts/main';
  next();
});

// 1. CONTROLADORS ESPECÍFICS (Rutes estàtiques prioritàries)
const productesRouter = require('./routes/productes');
app.use('/productes', productesRouter);
app.use('/', productesRouter); 

const clientsRouter = require('./routes/clients');
app.use('/clients', clientsRouter);
app.use('/', clientsRouter); 

const vendesRouter = require('./routes/vendes');
app.use('/vendes', vendesRouter);
app.use('/', vendesRouter); 

// 2. CONTROLADOR GENÈRIC CRUD (A baix de tot per evitar xocs de rutes dinàmiques)
const crudRouter = require('./routes/crud');
app.use('/', crudRouter);

// Start server
const httpServer = app.listen(port, () => {
  console.log(`http://localhost:${port}`);
  console.log(`http://localhost:${port}/productes`);
  console.log(`http://localhost:${port}/clients`);
  console.log(`http://localhost:${port}/vendes`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.end();
  httpServer.close();
  process.exit(0);
});