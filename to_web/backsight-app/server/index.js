
const express = require('express'); // For handling HTTP requests
const cors = require('cors'); // For enabling CORS
const { open } = require('sqlite'); // For working with SQLite databases
const sqlite3 = require('sqlite3'); // SQLite3 driver
const path = require('path');

const app = express();
app.use(cors()); 
app.use(express.json());

let db;

// person_id: foreign key to people table, can be null if we don't have a match
// duration: how long the person was detected in seconds
// max_level: the highest alert level reached during the event 
// timestamp: when the event was logged


async function startServer() {
    db = await open({
        filename: path.join(__dirname, 'database.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS security_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            person_id INTEGER,
            duration INTEGER,
            max_level TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("Database and Table Ready!");

    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error("Failed to start server:", err);
});


app.post('/api/log-event', async (req, res) => {
    const { personId, duration, maxLevel } = req.body;
    try {
        // Check if there's an existing event for this person in the last minute to prevent duplicates
        const existingEvent = await db.get(
            'SELECT id FROM security_events WHERE person_id = ? AND timestamp > datetime("now", "-1 minute") ORDER BY timestamp DESC LIMIT 1',
            [personId]
        );

        // update the existing event if found, otherwise insert a new one. 
        if (existingEvent) { 
            await db.run(
            'UPDATE security_events SET duration = ?, max_level = ? WHERE id = ?',
            [duration, maxLevel, existingEvent.id]
        );
        console.log(`Updated Person ${personId} to ${maxLevel} (Original start time kept)`);
        } else {
            await db.run(
                'INSERT INTO security_events (person_id, duration, max_level) VALUES (?, ?, ?)',
                [personId, duration, maxLevel]
            );
            console.log(`New event created for Person ${personId}`);
        }

        res.status(200).send({ message: "Event Logged/Updated" });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).send({ error: "DB Error" });
    }
});