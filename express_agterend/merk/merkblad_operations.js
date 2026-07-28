const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

// Default kriteria for a new merkblad
const DEFAULT_KRITERIA = [
    { beskrywing: 'Tegniese vaardigheid', default_totaal: 10, max_punte: 10, gewig: 1.0, merk_gids: 'Evalueer tegniese kompleksiteit en implementasie' },
    { beskrywing: 'Innovasie en kreatiwiteit', default_totaal: 10, max_punte: 10, gewig: 1.0, merk_gids: 'Beoordeel oorspronklikheid en kreatiewe oplossings' },
    { beskrywing: 'Uitvoerbaarheid', default_totaal: 10, max_punte: 10, gewig: 1.0, merk_gids: 'Assesseer praktiese implementeerbaarheid' },
    { beskrywing: 'Span samewerking', default_totaal: 10, max_punte: 10, gewig: 1.0, merk_gids: 'Evalueer spanwerk en rolle verdeling' }
];

// Get or create merkblad for a round
async function ensureMerkbladExists(rondte_id) {
    const db = new sqlite3.Database(getDatabasePath());
    
    try {
        // Start a transaction
        await runQuery(db, 'BEGIN TRANSACTION');

        // Check if round has kriteria assigned
        const existingKriteria = await getQuery(db, 
            'SELECT COUNT(*) as count FROM RondteMerkblad WHERE rondte_id = ?', 
            [rondte_id]
        );

        if (existingKriteria.count === 0) {
            // Create merkblad with default kriteria
            for (const k of DEFAULT_KRITERIA) {
                // First get or create the kriteria and get its ID
                const existingKriteria = await getQuery(db,
                    'SELECT kriteria_id FROM Kriteria WHERE beskrywing = ?',
                    [k.beskrywing]
                );

                let kriteria_id;
                if (existingKriteria) {
                    kriteria_id = existingKriteria.kriteria_id;
                    // Update existing kriteria
                    await runQuery(db,
                        'UPDATE Kriteria SET default_totaal = ?, max_punte = ?, gewig = ?, merk_gids = ? WHERE kriteria_id = ?',
                        [k.default_totaal, k.max_punte, k.gewig, k.merk_gids, kriteria_id]
                    );
                } else {
                    // Insert new kriteria
                    const result = await runQuery(db,
                        'INSERT INTO Kriteria (beskrywing, default_totaal, max_punte, gewig, merk_gids) VALUES (?, ?, ?, ?, ?)',
                        [k.beskrywing, k.default_totaal, k.max_punte, k.gewig, k.merk_gids]
                    );
                    kriteria_id = result.lastID;
                }
                
                // Then create RondteMerkblad entry
                await runQuery(db,
                    'INSERT INTO RondteMerkblad (rondte_id, kriteria_id, max_punte) VALUES (?, ?, ?)',
                    [rondte_id, kriteria_id, k.max_punte]
                );
            }
        }

        // Commit transaction
        await runQuery(db, 'COMMIT');

        // Return the merkblad
        return await getMerkbladForRound(rondte_id, db);

    } catch (error) {
        // Rollback on error
        await runQuery(db, 'ROLLBACK');
        console.error('Error in ensureMerkbladExists:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Get merkblad for a specific round
async function getMerkbladForRound(rondte_id, existingDb = null) {
    const db = existingDb || new sqlite3.Database(getDatabasePath());
    
    try {
        const rows = await allQuery(db, `
            SELECT 
                rm.rondte_id,
                k.kriteria_id,
                k.beskrywing,
                k.merk_gids,
                rm.max_punte,
                k.gewig
            FROM RondteMerkblad rm
            INNER JOIN Kriteria k ON rm.kriteria_id = k.kriteria_id
            WHERE rm.rondte_id = ?
            ORDER BY k.kriteria_id
        `, [rondte_id]);

        if (rows.length === 0) {
            // If no merkblad found, create one with default kriteria
            return await ensureMerkbladExists(rondte_id);
        }

        // Format the result
        const merkblad = {
            rondte_id: rows[0].rondte_id,
            kriteria: rows.map(row => ({
                kriteria_id: row.kriteria_id,
                beskrywing: row.beskrywing,
                max_punte: row.max_punte,
                gewig: row.gewig,
                merk_gids: row.merk_gids
            }))
        };

        return merkblad;

    } catch (error) {
        console.error('Error in getMerkbladForRound:', error);
        throw error;
    } finally {
        if (!existingDb) db.close();
    }
}

// Helper function to run a query that doesn't return results but may return lastID
function runQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                console.error('Error in runQuery:', err);
                reject(err);
            } else {
                resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });
            }
        });
    });
}

// Helper function to get a single row
function getQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Helper function to get multiple rows
function allQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = {
    getMerkbladForRound,
    ensureMerkbladExists
};