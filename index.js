const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./guestData.db');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/api/getTable', (req, res) => {
    const name = req.body.name.trim().toLowerCase();

    db.get("SELECT table_number FROM guests WHERE LOWER(name) = ?", [name], (err, row) => {
        if (err) return res.status(500).json({ error: "Datenbankfehler" });
        if (!row) return res.status(404).json({ error: "Name nicht gefunden" });

        res.json({ table: row.table_number });
    });
});

// ✅ Diese Route ergänzt die Startseite
app.get('/', (req, res) => {
    res.send('Willkommen zur Hochzeitsseite!'); // oder res.redirect('/guest')
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
