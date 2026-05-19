const express = require('express');
const router = express.Router();
const db = require('../utilsMySQL');

// ---- CREATE ----
router.post('/create', async (req, res) => {
  const { taula, ...data } = req.body;

  try {
    if (taula === 'productes') {
      const { name, category, price, stock, active } = data;
      await db.query(
        'INSERT INTO products (name, category, price, stock, active) VALUES (?, ?, ?, ?, ?)',
        [name, category, parseFloat(price), parseInt(stock), active === '1' ? 1 : 0]
      );
      return res.redirect('/productes');
    }

    if (taula === 'clients') {
      const { name, email, phone } = data;
      await db.query(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone]
      );
      return res.redirect('/clients');
    }

    if (taula === 'vendes') {
      const { customer_id, payment_method, sale_date, total, linies } = data;

      // Crear venda
      const result = await db.query(
        'INSERT INTO sales (customer_id, payment_method, sale_date, total) VALUES (?, ?, ?, ?)',
        [parseInt(customer_id), payment_method, sale_date || new Date(), parseFloat(total)]
      );
      const saleId = result.insertId;

      // Insertar línies i actualitzar stock
      if (linies) {
        const liniesArray = Object.values(linies);
        for (const linia of liniesArray) {
          const { product_id, unit_price, qty, line_total } = linia;
          if (!product_id) continue;

          await db.query(
            'INSERT INTO sale_items (sale_id, product_id, qty, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
            [saleId, parseInt(product_id), parseInt(qty), parseFloat(unit_price), parseFloat(line_total)]
          );

          // Reduir stock
          await db.query(
            'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
            [parseInt(qty), parseInt(product_id)]
          );
        }
      }

      return res.redirect('/vendes');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Error create:', err);
    res.status(500).send('Error al crear: ' + err.message);
  }
});

// ---- UPDATE ----
router.post('/Update', async (req, res) => {
  const { taula, id, ...data } = req.body;

  try {
    if (taula === 'productes') {
      const { name, category, price, stock, active } = data;
      await db.query(
        'UPDATE products SET name=?, category=?, price=?, stock=?, active=? WHERE id=?',
        [name, category, parseFloat(price), parseInt(stock), active === '1' ? 1 : 0, parseInt(id)]
      );
      return res.redirect('/productes');
    }

    if (taula === 'clients') {
      const { name, email, phone } = data;
      await db.query(
        'UPDATE customers SET name=?, email=?, phone=? WHERE id=?',
        [name, email, phone, parseInt(id)]
      );
      return res.redirect('/clients');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Error update:', err);
    res.status(500).send('Error al actualitzar: ' + err.message);
  }
});

// ---- DELETE ----
router.post('/Delete', async (req, res) => {
  const { taula, id } = req.body;

  try {
    if (taula === 'productes') {
      await db.query('DELETE FROM products WHERE id=?', [parseInt(id)]);
      return res.redirect('/productes');
    }

    if (taula === 'clients') {
      await db.query('DELETE FROM customers WHERE id=?', [parseInt(id)]);
      return res.redirect('/clients');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Error delete:', err);
    res.status(500).send('Error al eliminar: ' + err.message);
  }
});

module.exports = router;
