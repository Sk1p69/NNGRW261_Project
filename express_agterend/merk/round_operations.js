const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');
const db = new sqlite3.Database(getDatabasePath());

// Get current active round
function getCurrentActiveRound() {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM Rondte WHERE is_active = 1', [], (err, row) => {
            if (err) {
                console.error('Error getting active rondte:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Create a new round
async function createRondte(data) {
    // First check if there's an active round
    const activeRound = await getCurrentActiveRound();
    if (activeRound) {
        throw new Error('Daar is reeds \'n aktiewe rondte. Sluit eers die huidige rondte voordat \'n nuwe een geskep word.');
    }

    return new Promise((resolve, reject) => {
        const { naam, kriteria_ids = [], max_teams = 15, min_time_per_team = 20 } = data;
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            try {
                // Insert new round
                db.run(
                    'INSERT INTO Rondte (naam, max_spanne, min_time_per_team, is_active, is_gesluit) VALUES (?, ?, ?, 1, 0)',
                    [naam, max_teams, min_time_per_team],
                    function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }

                        const rondte_id = this.lastID;

                        // Link criteria to round
                        const stmt = db.prepare('INSERT INTO RondteKriteria (rondte_id, kriteria_id) VALUES (?, ?)');
                        kriteria_ids.forEach(kriteria_id => {
                            stmt.run(rondte_id, kriteria_id);
                        });
                        stmt.finalize();

                        db.run('COMMIT', (err) => {
                            if (err) {
                                console.error('Error committing transaction:', err);
                                db.run('ROLLBACK');
                                reject(err);
                            } else {
                                resolve({ 
                                    rondte_id, 
                                    naam, 
                                    max_teams, 
                                    min_time_per_team,
                                    kriteria_ids 
                                });
                            }
                        });
                    }
                );
            } catch (err) {
                db.run('ROLLBACK');
                reject(err);
            }
        });
    });
}

// Lock a round and set it as inactive
async function sluitRondte(rondte_id) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE Rondte SET is_gesluit = 1, is_active = 0 WHERE rondte_id = ?',
            [rondte_id],
            function(err) {
                if (err) {
                    console.error('Error locking round:', err);
                    reject(err);
                } else {
                    resolve({ rondte_id, is_locked: true, is_active: false });
                }
            }
        );
    });
}

// Get all teams assigned to an assessor for the active round
function getAssignedTeamsForBeoordelaar(beoordelaar_id) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT s.*, r.rondte_id, r.naam as rondte_naam 
             FROM Span s
             INNER JOIN RondteSpanBeoordelaar rsb ON s.span_id = rsb.span_id
             INNER JOIN Rounds r ON rsb.rondte_id = r.rondte_id
             WHERE rsb.beoordelaar_id = ? AND r.is_active = 1`,
            [beoordelaar_id],
            (err, rows) => {
                if (err) {
                    console.error('Error getting assigned teams:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

// Submit or update marks for a team
async function submitMarks(data) {
    const { rondte_id, span_id, beoordelaar_id, punte } = data;

    // Check if round is locked
    const round = await new Promise((resolve, reject) => {
        db.get('SELECT is_gesluit FROM Rondte WHERE rondte_id = ?', [rondte_id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    if (round.is_gesluit) {
        throw new Error('Hierdie rondte is gesluit. Punte kan nie meer toegeken word nie.');
    }

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            try {
                // Delete existing marks first
                db.run('DELETE FROM Punte WHERE rondte_id = ? AND span_id = ? AND beoordelaar_id = ?',
                    [rondte_id, span_id, beoordelaar_id]);

                // Insert new marks
                const stmt = db.prepare(
                    'INSERT INTO Punte (rondte_id, span_id, beoordelaar_id, kriteria_id, punt) VALUES (?, ?, ?, ?, ?)'
                );

                Object.entries(punte).forEach(([kriteria_id, punt]) => {
                    stmt.run(rondte_id, span_id, beoordelaar_id, kriteria_id, punt);
                });

                stmt.finalize();

                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('Error committing marks:', err);
                        db.run('ROLLBACK');
                        reject(err);
                    } else {
                        resolve({ success: true });
                    }
                });
            } catch (err) {
                db.run('ROLLBACK');
                reject(err);
            }
        });
    });
}

// Get marks for a team in a round by an assessor
function getMarks(rondte_id, span_id, beoordelaar_id) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT p.*, k.beskrywing, k.max_punte
             FROM Punte p
             INNER JOIN Kriteria k ON p.kriteria_id = k.kriteria_id
             WHERE p.rondte_id = ? AND p.span_id = ? AND p.beoordelaar_id = ?`,
            [rondte_id, span_id, beoordelaar_id],
            (err, rows) => {
                if (err) {
                    console.error('Error getting marks:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

module.exports = {
    getCurrentActiveRound,
    createRondte,
    sluitRondte,
    getAssignedTeamsForBeoordelaar,
    submitMarks,
    getMarks
};