const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

// PostgreSQL-Verbindung (Render → DATABASE_URL aus Environment)
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// 🌐 Route zur Startseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// 🎯 API: Tischnummer anhand des Namens
app.post('/api/getTable', async (req, res) => {
    const name = req.body.name.trim().toLowerCase();

    try {
        const result = await db.query(
            "SELECT table_number FROM guests WHERE LOWER(name) = $1",
            [name]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Name nicht gefunden" });
        }

        res.json({ table: result.rows[0].table_number });
    } catch (err) {
        console.error('Datenbankfehler:', err);
        res.status(500).json({ error: "Datenbankfehler" });
    }
});

// 🔎 API: Namensvorschläge für Auto-Suggest
app.get('/api/suggest', async (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    if (!query || query.length < 1) {
        return res.json([]);
    }

    try {
        const result = await db.query(
            "SELECT name FROM guests WHERE LOWER(name) LIKE $1 LIMIT 5",
            [`${query}%`]
        );
        res.json(result.rows.map(r => r.name));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fehler bei der Namenssuche' });
    }
});

// 📋 API: Alle Gäste abrufen (Admin)
app.get('/api/guests', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM guests ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fehler beim Laden der Gäste' });
    }
});

// ➕ API: Gast hinzufügen (Admin)
app.post('/api/addGuest', async (req, res) => {
    const { name, table_number } = req.body;
    try {
        await db.query(
            "INSERT INTO guests (name, table_number) VALUES ($1, $2)",
            [name, table_number]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fehler beim Hinzufügen' });
    }
});

// ✏️ API: Gast aktualisieren (Admin)
app.post('/api/updateGuest', async (req, res) => {
    const { id, name, table_number } = req.body;
    try {
        await db.query(
            "UPDATE guests SET name = $1, table_number = $2 WHERE id = $3",
            [name, table_number, id]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fehler beim Aktualisieren' });
    }
});

// ❌ API: Gast löschen (Admin)
app.post('/api/deleteGuest', async (req, res) => {
    const { id } = req.body;
    try {
        await db.query("DELETE FROM guests WHERE id = $1", [id]);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fehler beim Löschen' });
    }
});

// 🚀 Server starten
app.listen(PORT, () => {
    console.log(`✅ Server läuft auf Port ${PORT}`);
});
