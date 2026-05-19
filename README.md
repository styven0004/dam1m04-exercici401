# DAM1M04-Exercici401 — GameStore MiniERP 🎮

Backoffice web per gestionar una botiga de videojocs. Desarrollat amb **Node.js + Express + Handlebars + MySQL**.

## Estructura del projecte

```
DAM1M04-Exercici401/
├── public/
│   ├── imatges/
│   └── estils.css          ← CSS global + sistema de temes
├── server/
│   ├── data/
│   │   ├── schema.sql      ← Estructura de la BD
│   │   └── seed.sql        ← Dades de prova (30+ registres)
│   ├── routes/
│   │   ├── productes.js
│   │   ├── clients.js
│   │   ├── vendes.js
│   │   └── crud.js         ← POST /create, /Update, /Delete
│   ├── views/
│   │   ├── layouts/
│   │   │   └── main.hbs
│   │   ├── partials/
│   │   │   ├── header.hbs
│   │   │   ├── menu.hbs
│   │   │   └── footer.hbs
│   │   ├── index.hbs       ← Dashboard
│   │   ├── productes.hbs
│   │   ├── producteForm.hbs
│   │   ├── clients.hbs
│   │   ├── clientFitxa.hbs
│   │   ├── clientForm.hbs
│   │   ├── vendes.hbs
│   │   ├── vendaFitxa.hbs
│   │   └── vendaAfegir.hbs
│   ├── app.js
│   └── utilsMySQL.js
├── package.json
└── README.md
```

## Instal·lació

### 1. Clonar el repositori
```bash
git clone https://github.com/TU_USUARI/DAM1M04-Exercici401.git
cd DAM1M04-Exercici401
```

### 2. Instal·lar dependències
```bash
npm install
```

### 3. Configurar la base de dades MySQL
```bash
mysql -u root -p < server/data/schema.sql
mysql -u root -p minierp_videojocs < server/data/seed.sql
```

### 4. Configurar connexió BD (opcional)
Per defecte: `localhost`, user `root`, sense contrasenya, BD `minierp_videojocs`.

Per canviar-ho, edita `server/utilsMySQL.js` o usa variables d'entorn:
```bash
DB_HOST=localhost DB_USER=root DB_PASSWORD=secret DB_NAME=minierp_videojocs npm start
```

### 5. Iniciar el servidor
```bash
npm start
# o en mode desenvolupament:
npm run dev
```

Obre el navegador a: **http://localhost:3000**

---

## Funcionalitats

### Dashboard (/)
- KPIs: vendes avui/mes, comandes, productes amb stock baix
- Toggle mode **compacte / complert**
- Llistats: últimes 5 vendes i top 5 productes
- Toggle **codi de colors** de stock (✅ ok / 🟡 baix / 🔴 crític)

### Productes (/productes)
- Llistat amb paginació (10/pàgina) → `/productes?pagina=2`
- Cercador per nom/categoria → `/productes?cerca=rpg`
- Toggle codi de colors stock
- CRUD complet (afegir / editar / eliminar)
- Validació JS del formulari

### Clients (/clients)
- Llistat paginat amb cerca (nom/email)
- Filtre clients VIP (≥3 compres)
- Fitxa client: dades + historial 10 compres + estadístiques
- CRUD complet amb validació JS

### Vendes (/vendes)
- Llistat paginat amb cerca per client
- Fitxa venda: línies de productes + totals
- Nova venda: selecció client + línies dinàmiques + càlcul automàtic
- Reducció de stock automàtica en crear venda

### Sistema de temes
- 3 temes: **☀️ Clar / 🌙 Nit suau / ⚡ Alt contrast**
- Desat a **localStorage**
- Afecta fons, cards, taules, botons i colors d'alerta

---

## Tecnologies

- **Backend**: Node.js, Express 4
- **Plantilles**: Handlebars (express-handlebars)
- **Base de dades**: MySQL 8 (mysql2)
- **Frontend**: CSS variables, Vanilla JS, Google Fonts (Rajdhani + Inter)
- **Estil**: Sistema de temes CSS, taules responsives, formularis validats

---

*DAM1M04-Exercici401 · Grup: [Nom1] & [Nom2]*
