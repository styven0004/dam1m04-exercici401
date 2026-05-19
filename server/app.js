const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./utilsMySQL');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- HANDLEBARS ----
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    // Helper per comparar igualtat
    ifeq(a, b, options) {
      return a == b ? options.fn(this) : options.inverse(this);
    },
    // Helper per sumar 1 (per mostrar índex 1-based)
    plusOne(val) {
      return parseInt(val) + 1;
    },
    // Any actual per al footer
    any() {
      return new Date().getFullYear();
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ---- MIDDLEWARE ----
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---- RUTES CRUD (han d'anar abans de les altres) ----
const crudRouter = require('./routes/crud');
app.use('/', crudRouter);

// ---- RUTES PRODUCTES ----
const productesRouter = require('./routes/productes');
app.use('/productes', productesRouter);
app.use('/', productesRouter); // Per /producteAfegir i /producteEditar

// ---- RUTES CLIENTS ----
const clientsRouter = require('./routes/clients');
app.use('/clients', clientsRouter);
app.use('/', clientsRouter); // Per /clientAfegir, /clientEditar, /clientFitxa

// ---- RUTES VENDES ----
const vendesRouter = require('./routes/vendes');
app.use('/vendes', vendesRouter);
app.use('/', vendesRouter); // Per /vendaAfegir, /vendaFitxa

// ---- DASHBOARD ----
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

// ---- INICI ----
app.listen(PORT, () => {
  console.log(`🎮 GameStore ERP funcionant a http://localhost:${PORT}`);
});
