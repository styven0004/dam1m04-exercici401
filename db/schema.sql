-- =============================================
-- MiniERP Botiga de Videojocs - Schema MySQL
-- =============================================

CREATE DATABASE IF NOT EXISTS minierp_botiga
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE minierp_botiga;

-- -----------------------------------
-- Productes
-- -----------------------------------
CREATE TABLE IF NOT EXISTS products (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150)   NOT NULL,
  category   VARCHAR(80)    NOT NULL,
  price      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  stock      INT            NOT NULL DEFAULT 0,
  active     TINYINT(1)     NOT NULL DEFAULT 1,
  created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_price CHECK (price >= 0),
  CONSTRAINT chk_stock CHECK (stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------
-- Clients
-- -----------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150)  NOT NULL,
  email      VARCHAR(200)  NOT NULL UNIQUE,
  phone      VARCHAR(20)   NOT NULL DEFAULT '',
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------
-- Vendes
-- -----------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id    INT UNSIGNED NOT NULL,
  sale_date      DATE         NOT NULL,
  payment_method VARCHAR(50)  NOT NULL DEFAULT 'Targeta',
  total          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------
-- Línies de venda
-- -----------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id     INT UNSIGNED   NOT NULL,
  product_id  INT UNSIGNED   NOT NULL,
  qty         INT            NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2)  NOT NULL,
  line_total  DECIMAL(10,2)  NOT NULL,
  CONSTRAINT fk_item_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_item_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_qty CHECK (qty > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índexs útils
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active    ON products(active);
CREATE INDEX idx_products_stock     ON products(stock);
CREATE INDEX idx_sales_date         ON sales(sale_date);
CREATE INDEX idx_sales_customer     ON sales(customer_id);
CREATE INDEX idx_items_sale         ON sale_items(sale_id);
CREATE INDEX idx_items_product      ON sale_items(product_id);
