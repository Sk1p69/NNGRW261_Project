const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');
const db = new sqlite3.Database(getDatabasePath());

// Assign a team to a group
function assignTeamToGroup(span_id, group) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE Span SET presentation_group = ? WHERE span_id = ?',
            [group, span_id],
            (err) => {
                if (err) {
                    console.error('Error assigning team to group:', err);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Assign a beoordelaar to a group
function assignBeoordelaarToGroup(beoordelaar_id, group) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE Users SET assigned_group = ? WHERE id = ? AND role = "beoordelaar"',
            [group, beoordelaar_id],
            (err) => {
                if (err) {
                    console.error('Error assigning beoordelaar to group:', err);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Get all teams in a group
function getTeamsInGroup(group) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM Span WHERE presentation_group = ? AND is_eliminated = 0 ORDER BY span_id',
            [group],
            (err, rows) => {
                if (err) {
                    console.error('Error getting teams in group:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

// Get beoordelaars in a group
function getBeoordelaarsInGroup(group) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT id, username FROM Users WHERE assigned_group = ? AND role = "beoordelaar"',
            [group],
            (err, rows) => {
                if (err) {
                    console.error('Error getting beoordelaars in group:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

// Auto assign teams to groups alternately
async function autoAssignTeams() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Start transaction
            db.run('BEGIN TRANSACTION');

            // First, get all non-eliminated teams
            db.all(
                'SELECT span_id FROM Span WHERE is_eliminated = 0 ORDER BY span_id',
                [],
                async (err, teams) => {
                    if (err) {
                        console.error('Error getting teams:', err);
                        db.run('ROLLBACK');
                        return reject(err);
                    }

                    try {
                        // Assign teams alternately to groups A and B
                        for (let i = 0; i < teams.length; i++) {
                            const group = i % 2 === 0 ? 'A' : 'B';
                            await new Promise((res, rej) => {
                                db.run(
                                    'UPDATE Span SET presentation_group = ? WHERE span_id = ?',
                                    [group, teams[i].span_id],
                                    (err) => {
                                        if (err) rej(err);
                                        else res();
                                    }
                                );
                            });
                        }

                        // Commit transaction
                        db.run('COMMIT', (err) => {
                            if (err) {
                                console.error('Error committing transaction:', err);
                                db.run('ROLLBACK');
                                reject(err);
                            } else {
                                resolve({ 
                                    message: 'Teams auto-assigned successfully',
                                    totalTeams: teams.length,
                                    groupA: Math.ceil(teams.length / 2),
                                    groupB: Math.floor(teams.length / 2)
                                });
                            }
                        });
                    } catch (err) {
                        console.error('Error in auto-assign process:', err);
                        db.run('ROLLBACK');
                        reject(err);
                    }
                }
            );
        });
    });
}

module.exports = {
    assignTeamToGroup,
    assignBeoordelaarToGroup,
    getTeamsInGroup,
    getBeoordelaarsInGroup,
    autoAssignTeams
};