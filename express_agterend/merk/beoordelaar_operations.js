const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');
const db = new sqlite3.Database(getDatabasePath());

// Get teams for a round based on beoordelaar's assigned group
function getAssignedTeamsForBeoordelaar(rondte_id, beoordelaar_id) {
    return new Promise((resolve, reject) => {
        // First get the beoordelaar's assigned group
        db.get(
            'SELECT assigned_group FROM Users WHERE id = ? AND role = "beoordelaar"',
            [beoordelaar_id],
            (err, user) => {
                if (err) {
                    console.error('Error getting beoordelaar group:', err);
                    return reject(err);
                }

                // Always get Group A teams that aren't eliminated
                const query = `SELECT * FROM Span 
                     WHERE is_eliminated = 0 
                     AND presentation_group = 'A'
                     ORDER BY span_id`;

                const params = [];

                db.all(query, params, (err, rows) => {
                    if (err) {
                        console.error('Error getting teams:', err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                });
            }
        );
    });
}

// Get marks for a team by a beoordelaar in a round
function getMarks(rondte_id, span_id, beoordelaar_id) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                rm.kriteria_id,
                k.beskrywing,
                rm.max_punte,
                k.gewig,
                p.punt
            FROM RondteMerkblad rm
            INNER JOIN Kriteria k ON rm.kriteria_id = k.kriteria_id
            LEFT JOIN Punte p ON (
                p.rondte_id = rm.rondte_id 
                AND p.kriteria_id = rm.kriteria_id
                AND p.span_id = ?
                AND p.beoordelaar_id = ?
            )
            WHERE rm.rondte_id = ?
            ORDER BY rm.kriteria_id
        `, [span_id, beoordelaar_id, rondte_id], (err, rows) => {
            if (err) {
                console.error('Error getting marks:', err);
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

// Submit marks for a team
function submitMarks(data) {
    const { rondte_id, span_id, beoordelaar_id, punte } = data;
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Start transaction
            db.run('BEGIN TRANSACTION');
            
            // Delete existing marks first
            db.run(
                'DELETE FROM Punte WHERE rondte_id = ? AND span_id = ? AND beoordelaar_id = ?',
                [rondte_id, span_id, beoordelaar_id],
                (err) => {
                    if (err) {
                        console.error('Error deleting marks:', err);
                        db.run('ROLLBACK');
                        return reject(err);
                    }
                    
                    // Prepare insert statement
                    const stmt = db.prepare(`
                        INSERT INTO Punte (rondte_id, span_id, beoordelaar_id, kriteria_id, punt)
                        VALUES (?, ?, ?, ?, ?)
                    `);

                    try {
                        // Insert all new marks
                        Object.entries(punte).forEach(([kriteria_id, punt]) => {
                            stmt.run([rondte_id, span_id, beoordelaar_id, parseInt(kriteria_id), parseInt(punt)]);
                        });
                        
                        // Finalize and commit
                        stmt.finalize((err) => {
                            if (err) {
                                console.error('Error submitting marks:', err);
                                db.run('ROLLBACK');
                                reject(err);
                            } else {
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        console.error('Error committing transaction:', err);
                                        db.run('ROLLBACK');
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                });
                            }
                        });
                    } catch (err) {
                        console.error('Error inserting marks:', err);
                        db.run('ROLLBACK');
                        reject(err);
                    }
                }
            );
        });
    });
}

// Check if beoordelaar has already marked a team
function hasMarkedTeam(rondte_id, span_id, beoordelaar_id) {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT COUNT(*) as count
            FROM Punte
            WHERE rondte_id = ? 
            AND span_id = ? 
            AND beoordelaar_id = ?
        `, [rondte_id, span_id, beoordelaar_id], (err, row) => {
            if (err) {
                console.error('Error checking if team is marked:', err);
                reject(err);
            } else {
                resolve(row.count > 0);
            }
        });
    });
}

module.exports = {
    getAssignedTeamsForBeoordelaar,
    getMarks,
    submitMarks,
    hasMarkedTeam
};