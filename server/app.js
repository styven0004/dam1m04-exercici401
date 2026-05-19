const express = require('express');
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const MySQL = require('./utilsMySQL');

const app = express();
const port = process.env.PORT || 3000;

// Detectar si estem al Proxmox (si és pm2)
const isProxmox = !!process.env.PM2_HOME;

// Iniciar connexió MySQL amb la teva estructura de classes
const db = new MySQL();
if (!isProxmox) {
  db.init({
    host: 'localhost',
    port: 3306,
    user: 'appuser',
    password: '1234',
    database: 'gamestore' // Modifica el nom de la base de dades si és necessari
  });
} else {
  db.init({
    host: '127.0.0.1',
    port: 3306,
    user: 'super',
    password: '1234',
    database: 'gamestore'
  });
}

// Static files - ONLY ONCE
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Afegit ja que el teu primer script feia servir body-parser.json()

// Disable cache
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Registrar "Helpers .hbs" aquí
hbs.registerHelper('ifeq', (a, b) => a == b);
hbs.registerHelper('plusOne', (val) => parseInt(val) + 1);
hbs.registerHelper('any', () => new Date().getFullYear());

// Partials de Handlebars
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// ---- RUTES CRUD (Des de fitxers externs de la teva estructura) ----
const crudRouter = require('./routes/crud');
app.use('/', crudRouter);

const productesRouter = require('./routes/productes');
app.use('/productes', productesRouter);
app.use('/', productesRouter);

const clientsRouter = require('./routes/clients');
app.use('/clients', clientsRouter);
app.use('/', clientsRouter);

const vendesRouter = require('./routes/vendes');
app.use('/vendes', vendesRouter);
app.use('/', vendesRouter);

// ---- DASHBOARD (Ruta arrel adaptada) ----
app.get('/', async (req, res) => {
  try {
    const avui = new Date().toISOString().slice(0, 10);
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    // KPIs
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
    const ultVendes = ultVendesRaw.map(v => ({
      data: new Date(v.sale_date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      client: v.client,
      total: parseFloat(v.total).toFixed(2)
    }));

    // Top 5 productes
    const topProductes = await db.query(`
      SELECT p.id, p.name, p.stock, COALESCE(SUM(si.qty), 0) AS total_venuts
      FROM products p
      LEFT JOIN sale_items si ON si.product_id = p.id
      GROUP BY p.id, p.name, p.stock
      ORDER BY total_venuts DESC
      LIMIT 5
    `);

    res.render('index', {
      titol: 'Dashboard',
      vendesAvui: parseFloat(vendesAvuiRow.total).toFixed(2),
      numVendesAvui: vendesAvuiRow.num,
      vendesMes: parseFloat(vendesMesRow.total).toFixed(2),
      numVendesMes: vendesMesRow.num,
      productesBaixStock: stockBaixRow.num,
      ultVendes,
      topProductes,
      any: new Date().getFullYear()
    });

  } catch (err) {
    console.error('Error dashboard:', err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

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