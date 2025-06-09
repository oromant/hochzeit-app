const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./guestData.db');
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API-Endpunkt für die Namenssuche
app.post('/api/getTable', (req, res) => {
    const name = req.body.name.trim().toLowerCase();

    db.get("SELECT table_number FROM guests WHERE LOWER(name) = ?", [name], (err, row) => {
        if (err) {
            console.error('Datenbankfehler:', err);
            return res.status(500).json({ error: "Datenbankfehler" });
        }

        if (!row) {
            return res.status(404).json({ error: "Name nicht gefunden" });
        }

        res.json({ table: row.table_number });
    });
});

// Route zur Startseite (liefert index.html aus frontend-Ordner)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
