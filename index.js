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
app.use(express.static(path.join(__dirname, 'frontend')));

// 🎯 API: Tischnummer anhand des Namens
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

// 🔎 API: Namensvorschläge für Auto-Suggest
app.get('/api/suggest', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    if (!query || query.length < 1) {
        return res.json([]);
    }

    db.all(
        "SELECT name FROM guests WHERE LOWER(name) LIKE ? LIMIT 5",
        [`${query}%`],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Fehler bei der Namenssuche' });
            }
            res.json(rows.map(r => r.name));
        }
    );
});

// 📋 API: Alle Gäste abrufen (Admin)
app.get('/api/guests', (req, res) => {
    db.all("SELECT * FROM guests ORDER BY name ASC", (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Fehler beim Laden der Gäste' });
        }
        res.json(rows);
    });
});

// ➕ API: Gast hinzufügen (Admin)
app.post('/api/addGuest', (req, res) => {
    const { name, table_number } = req.body;
    db.run("INSERT INTO guests (name, table_number) VALUES (?, ?)", [name, table_number], err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Fehler beim Hinzufügen' });
        }
        res.sendStatus(200);
    });
});

// ✏️ API: Gast aktualisieren (Admin)
app.post('/api/updateGuest', (req, res) => {
    const { id, name, table_number } = req.body;
    db.run("UPDATE guests SET name = ?, table_number = ? WHERE id = ?", [name, table_number, id], err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Fehler beim Aktualisieren' });
        }
        res.sendStatus(200);
    });
});

// ❌ API: Gast löschen (Admin)
app.post('/api/deleteGuest', (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM guests WHERE id = ?", [id], err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Fehler beim Löschen' });
        }
        res.sendStatus(200);
    });
});

// 🌐 Route zur Startseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// 🚀 Server starten
app.listen(PORT, () => {
    console.log(`✅ Server läuft auf Port ${PORT}`);
});
