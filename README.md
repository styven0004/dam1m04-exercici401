# DAM1M04-Exercici401 — MiniERP GameStore

Backoffice web per gestionar una botiga de videojocs.  
Stack: **Node.js + Express + Handlebars + MySQL**

---

## Instal·lació

### 1. Clona el repositori
```bash
git clone https://github.com/USUARI/DAM1M04-Exercici401.git
cd DAM1M04-Exercici401
```

### 2. Instal·la les dependències
```bash
npm install
```

### 3. Configura la base de dades
Crea el fitxer `.env` a partir de l'exemple:
```bash
cp .env.example .env
```
Edita `.env` amb les teves credencials MySQL:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=la_teva_contrasenya
DB_NAME=minierp_botiga
DB_PORT=3306
PORT=3000
```

### 4. Crea la base de dades i el schema
```bash
mysql -u root -p < db/schema.sql
```

### 5. Emplena amb dades de prova
```bash
mysql -u root -p < db/seed.sql
```
> Inclou 30 productes, 28 clients i 30 vendes (amb les seves línies).

### 6. Arrenca el servidor
```bash
npm start
# o amb recàrrega automàtica:
npm run dev
```

Obre [http://localhost:3000](http://localhost:3000)

---

## Pàgines disponibles

| Ruta | Descripció |
|------|------------|
| `/` | Dashboard (KPI + Llistats) |
| `/productes` | Llistat de productes amb cerca i paginació |
| `/producteAfegir` | Formulari afegir producte |
| `/producteEditar?id=N` | Formulari editar/esborrar producte |
| `/clients` | Llistat de clients (filtre VIP inclòs) |
| `/clientAfegir` | Formulari afegir client |
| `/clientEditar?id=N` | Formulari editar/esborrar client |
| `/clientFitxa?id=N` | Fitxa completa del client |
| `/vendes` | Llistat de vendes amb cerca i paginació |
| `/vendaAfegir` | Formulari nova venda amb línies dinàmiques |
| `/vendaDetall?id=N` | Detall d'una venda |

---

## Característiques

- **Tres temes**: Clar, Nit suau, Alt contrast (desar a `localStorage`)
- **Toggle colors stock**: Verd (ok) / Taronja (baix ≤5) / Vermell (crític = 0)
- **Dashboard KPI**: Toggle mode compacte/complert
- **Paginació**: 10 registres per pàgina, combinable amb cerca
- **Validació JS**: Errors inline per camp, contorn vermell en error
- **Control de stock**: La creació de vendes descompta stock i bloqueja si n'hi ha poca
- **Clients VIP**: Filtre per clients que han gastat ≥ 150 €

---

## Estructura del projecte

```
DAM1M04-Exercici401/
├── app.js
├── .env.example
├── package.json
├── db/
│   ├── connection.js
│   ├── schema.sql
│   └── seed.sql
├── routes/
│   ├── index.js
│   ├── productes.js
│   ├── clients.js
│   ├── vendes.js
│   └── crud.js
├── views/
│   ├── layouts/main.hbs
│   ├── partials/
│   │   ├── header.hbs
│   │   ├── menu.hbs
│   │   ├── footer.hbs
│   │   └── paginacio.hbs
│   ├── dashboard.hbs
│   ├── productes.hbs, producteAfegir.hbs, producteEditar.hbs
│   ├── clients.hbs, clientAfegir.hbs, clientEditar.hbs, clientFitxa.hbs
│   ├── vendes.hbs, vendaAfegir.hbs, vendaDetall.hbs
│   └── error.hbs
└── public/
    ├── css/style.css
    └── js/main.js, validacio.js
```
