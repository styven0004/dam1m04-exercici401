require('dotenv').config();
const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Handlebars setup
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: (a, b) => a == b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    add: (a, b) => Number(a) + Number(b),
    subtract: (a, b) => Number(a) - Number(b),
    multiply: (a, b) => Number(a) * Number(b),
    formatDate: (d) => {
      if (!d) return '';
      const date = new Date(d);
      return date.toLocaleDateString('ca-ES');
    },
    formatPrice: (p) => {
      if (p == null) return '0,00 €';
      return Number(p).toFixed(2).replace('.', ',') + ' €';
    },
    stockClass: (stock) => {
      if (stock <= 0) return 'stock-critic';
      if (stock <= 5) return 'stock-baix';
      return 'stock-ok';
    },
    stockLabel: (stock) => {
      if (stock <= 0) return 'Crític';
      if (stock <= 5) return 'Baix';
      return 'Ok';
    },
    json: (obj) => JSON.stringify(obj),
    range: (start, end) => {
      const arr = [];
      for (let i = start; i <= end; i++) arr.push(i);
      return arr;
    },
    pagArray: (totalPages, currentPage) => {
      const arr = [];
      for (let i = 0; i < totalPages; i++) arr.push({ num: i, active: i === currentPage });
      return arr;
    },
    or: (a, b) => a || b,
    and: (a, b) => a && b,
    not: (a) => !a,
    ternary: (cond, a, b) => cond ? a : b,
    concat: (...args) => args.slice(0, -1).join(''),
    split: (str, sep) => (str || '').split(sep || ','),
    ifCond: function(v1, op, v2, options) {
      switch (op) {
        case '==': return v1 == v2 ? options.fn(this) : options.inverse(this);
        case '!=': return v1 != v2 ? options.fn(this) : options.inverse(this);
        case '>':  return v1 > v2  ? options.fn(this) : options.inverse(this);
        case '<':  return v1 < v2  ? options.fn(this) : options.inverse(this);
        case '>=': return v1 >= v2 ? options.fn(this) : options.inverse(this);
        case '<=': return v1 <= v2 ? options.fn(this) : options.inverse(this);
      }
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/', require('./routes/productes'));
app.use('/', require('./routes/clients'));
app.use('/', require('./routes/vendes'));
app.use('/', require('./routes/crud'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { titol: 'Pàgina no trobada', missatge: 'La pàgina que cerques no existeix.', layout: 'main' });
});

app.listen(PORT, () => {
  console.log(`MiniERP funcionant a http://localhost:${PORT}`);
});
