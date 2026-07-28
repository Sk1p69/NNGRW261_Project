const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getDatabasePath } = require('../db_setup/setup');

function connect() {
    return new sqlite3.Database(getDatabasePath());
}

// Get competition settings
async function getCompetitionSettings() {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.get("SELECT * FROM CompetitionSettings WHERE settings_id = 1", [], (err, row) => {
            db.close();
            if (err) return reject(err);
            resolve(row);
        });
    });
}

// Get all competition settings
async function getAllCompetitionSettings() {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.all("SELECT * FROM CompetitionSettings ORDER BY settings_id DESC", [], (err, rows) => {
            db.close();
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

// Delete competition settings
async function deleteCompetitionSettings(settingId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        // Don't allow deletion of the active settings (settings_id = 1)
        db.run("DELETE FROM CompetitionSettings WHERE settings_id = ? AND settings_id != 1", [settingId], function(err) {
            db.close();
            if (err) return reject(err);
            resolve({ success: true, changes: this.changes });
        });
    });
}

// Update competition settings
async function updateCompetitionSettings(settings) {
    return new Promise((resolve, reject) => {
        const db = connect();
        const sql = `UPDATE CompetitionSettings SET 
            required_assessors = ?, 
            required_teams = ?, 
            total_time_minutes = ?, 
            time_per_team = ?, 
            max_teams = ?,
            teams_to_eliminate = ?
            WHERE settings_id = 1`;
            
        const {
            required_assessors,
            required_teams, 
            total_time_minutes, 
            time_per_team, 
            max_teams,
            teams_to_eliminate 
        } = settings;
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Update competition settings
            db.run(
                `UPDATE CompetitionSettings 
                 SET required_assessors = ?, 
                     required_teams = ?,
                     total_time_minutes = ?,
                     time_per_team = ?,
                     max_teams = ?,
                     teams_to_eliminate = ?
                 WHERE settings_id = 1`,
                [required_assessors, required_teams, total_time_minutes, time_per_team, max_teams, teams_to_eliminate]
            );

            // Mark teams as eliminated based on academic marks
            if (max_teams > 0) {
                db.run(
                    `UPDATE Span 
                     SET is_eliminated = 1 
                     WHERE span_id NOT IN (
                         SELECT span_id FROM Span 
                         WHERE academic_mark IS NOT NULL
                         ORDER BY academic_mark DESC 
                         LIMIT ?
                     )`,
                    [max_teams],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            db.close();
                            return reject(err);
                        }
                        
                        db.run('COMMIT');
                        db.close();
                        resolve();
                    }
                );
            } else {
                db.run('COMMIT');
                db.close();
                resolve();
            }
        });
    });
}

// Assign assessors to groups for a round
async function assignAssessorsToGroups(roundId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // First get all available assessors
            db.all("SELECT beoordelaar_id FROM Beoordelaar", [], (err, assessors) => {
                if (err) {
                    db.run('ROLLBACK');
                    db.close();
                    return reject(err);
                }

                // Split assessors into two groups
                const halfLength = Math.ceil(assessors.length / 2);
                const groupA = assessors.slice(0, halfLength);
                const groupB = assessors.slice(halfLength);

                // Insert group assignments
                const stmt = db.prepare(
                    `INSERT INTO AssessorGroups (assessor_id, group_name, rondte_id) 
                     VALUES (?, ?, ?)`
                );

                // Assign Group A
                groupA.forEach(assessor => {
                    stmt.run(assessor.beoordelaar_id, 'A', roundId);
                });

                // Assign Group B
                groupB.forEach(assessor => {
                    stmt.run(assessor.beoordelaar_id, 'B', roundId);
                });

                stmt.finalize(err => {
                    if (err) {
                        db.run('ROLLBACK');
                        db.close();
                        return reject(err);
                    }

                    db.run('COMMIT');
                    db.close();
                    resolve();
                });
            });
        });
    });
}

// Get assessor groups for a round
async function getAssessorGroups(roundId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        
        db.all(
            `SELECT ag.*, b.naam 
             FROM AssessorGroups ag
             JOIN Beoordelaar b ON ag.assessor_id = b.beoordelaar_id
             WHERE ag.rondte_id = ?
             ORDER BY ag.group_name, b.naam`,
            [roundId],
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

// Update team academic marks
async function updateTeamAcademicMark(teamId, mark) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.run(
            "UPDATE Span SET academic_mark = ? WHERE span_id = ?",
            [mark, teamId],
            function (err) {
                db.close();
                if (err) return reject(err);
                resolve({ span_id: teamId, academic_mark: mark });
            }
        );
    });
}

// Get teams sorted by academic mark
async function getTeamsByAcademicMark() {
    return new Promise((resolve, reject) => {
        const db = connect();
        try {
            db.all(
                `SELECT * FROM Span 
                 ORDER BY 
                    CASE 
                        WHEN academic_mark IS NULL THEN 1 
                        ELSE 0 
                    END,
                    academic_mark DESC`,
                [],
                (err, rows) => {
                    if (err) {
                        console.error('Database error:', err);
                        db.close();
                        return reject(err);
                    }
                    console.log('Retrieved teams:', rows);
                    db.close();
                    resolve(rows || []);
                }
            );
        } catch (err) {
            console.error('Unexpected error:', err);
            db.close();
            reject(err);
        }
    });
}

module.exports = {
    getCompetitionSettings,
    getAllCompetitionSettings,
    deleteCompetitionSettings,
    updateCompetitionSettings,
    updateTeamAcademicMark,
    getTeamsByAcademicMark,
    eliminateTeams,
    assignTeamsToGroups,
    assignAssessorsToTeams,
    getAssessorAssignments,
    getActiveTeamsCount,
    getRounds,
    getRound,
    createRound,
    updateRound,
    deleteRound
};

// Eliminate bottom teams
async function eliminateTeams(count) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.run(
            `UPDATE Span 
             SET is_eliminated = 1 
             WHERE span_id IN (
                 SELECT span_id FROM Span 
                 ORDER BY academic_mark ASC 
                 LIMIT ?
             )`,
            [count],
            function (err) {
                db.close();
                if (err) return reject(err);
                resolve({ eliminated_count: this.changes });
            }
        );
    });
}

// Assign teams to groups A and B
async function assignTeamsToGroups() {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.all(
            `SELECT * FROM Span 
             WHERE is_eliminated = 0 
             ORDER BY academic_mark DESC`,
            [],
            (err, teams) => {
                if (err) {
                    db.close();
                    return reject(err);
                }

                // Split teams into two groups alternating by rank
                const updates = teams.map((team, index) => {
                    const group = index % 2 === 0 ? 'A' : 'B';
                    return new Promise((res, rej) => {
                        db.run(
                            "UPDATE Span SET presentation_group = ? WHERE span_id = ?",
                            [group, team.span_id],
                            (err) => err ? rej(err) : res()
                        );
                    });
                });

                Promise.all(updates)
                    .then(() => {
                        db.close();
                        resolve({ success: true, count: teams.length });
                    })
                    .catch(err => {
                        db.close();
                        reject(err);
                    });
            }
        );
    });
}

// Assign assessors to teams
async function assignAssessorsToTeams() {
    return new Promise((resolve, reject) => {
        const db = connect();
        
        // Get all active teams and assessors
        Promise.all([
            new Promise((res, rej) => {
                db.all(
                    "SELECT * FROM Span WHERE is_eliminated = 0 ORDER BY academic_mark DESC",
                    [],
                    (err, teams) => err ? rej(err) : res(teams)
                );
            }),
            new Promise((res, rej) => {
                db.all(
                    "SELECT * FROM User WHERE role = 'beoordelaar'",
                    [],
                    (err, assessors) => err ? rej(err) : res(assessors)
                );
            })
        ]).then(([teams, assessors]) => {
            // Split teams into top and bottom half
            const midPoint = Math.floor(teams.length / 2);
            const topTeams = teams.slice(0, midPoint);
            const bottomTeams = teams.slice(midPoint);

            // Calculate assignments per assessor
            const assignmentsPerAssessor = Math.ceil(teams.length / assessors.length);

            // Create assignments ensuring each assessor gets top and bottom teams
            const assignments = [];
            assessors.forEach((assessor, index) => {
                // Get an even distribution of teams for this assessor
                const startIdx = index * assignmentsPerAssessor % teams.length;
                for (let i = 0; i < assignmentsPerAssessor; i++) {
                    const teamIdx = (startIdx + i) % teams.length;
                    assignments.push([assessor.id, teams[teamIdx].span_id]);
                }
            });

            // Insert all assignments
            db.run("DELETE FROM AssessorTeamAssignments", [], (err) => {
                if (err) {
                    db.close();
                    return reject(err);
                }

                const stmt = db.prepare(
                    "INSERT INTO AssessorTeamAssignments (assessor_id, team_id) VALUES (?, ?)"
                );

                assignments.forEach(([assessorId, teamId]) => {
                    stmt.run([assessorId, teamId]);
                });

                stmt.finalize((err) => {
                    db.close();
                    if (err) return reject(err);
                    resolve({
                        success: true,
                        assignments: assignments.length,
                        teams: teams.length,
                        assessors: assessors.length
                    });
                });
            });
        }).catch(err => {
            db.close();
            reject(err);
        });
    });
}

// Get assignments for an assessor
async function getAssessorAssignments(assessorId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.all(
            `SELECT s.* FROM Span s
             JOIN AssessorTeamAssignments a ON s.span_id = a.team_id
             WHERE a.assessor_id = ?`,
            [assessorId],
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

// Get active teams count (not eliminated)
async function getActiveTeamsCount() {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.get(
            "SELECT COUNT(*) as count FROM Span WHERE is_eliminated = 0",
            [],
            (err, row) => {
                db.close();
                if (err) return reject(err);
                resolve(row.count);
            }
        );
    });
}

// Create new round
async function createRound(maxSpanne) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.run(
            "INSERT INTO Rondte (max_spanne) VALUES (?)",
            [maxSpanne],
            function (err) {
                if (err) {
                    db.close();
                    return reject(err);
                }
                const rondteId = this.lastID;
                db.get(
                    "SELECT * FROM Rondte WHERE rondte_id = ?",
                    [rondteId],
                    (err, row) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(row);
                    }
                );
            }
        );
    });
}

// Get all rounds
async function getRounds() {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.all("SELECT * FROM Rondte ORDER BY created_at DESC", [], (err, rows) => {
            db.close();
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

// Get a specific round
async function getRound(rondteId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.get("SELECT * FROM Rondte WHERE rondte_id = ?", [rondteId], (err, row) => {
            db.close();
            if (err) return reject(err);
            if (!row) return reject(new Error('Rondte not found'));
            resolve(row);
        });
    });
}

// Update round
async function updateRound(roundId, maxTeams) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.run(
            "UPDATE Rounds SET max_teams = ? WHERE round_id = ?",
            [maxTeams, roundId],
            function(err) {
                if (err) {
                    db.close();
                    return reject(err);
                }
                if (this.changes === 0) {
                    db.close();
                    return reject(new Error('Round not found'));
                }
                db.get(
                    "SELECT * FROM Rounds WHERE round_id = ?",
                    [roundId],
                    (err, row) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(row);
                    }
                );
            }
        );
    });
}

// Delete round
async function deleteRound(roundId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        
        // First check if the round exists
        db.get("SELECT * FROM Rounds WHERE round_id = ?", [roundId], (err, row) => {
            if (err) {
                db.close();
                return reject(err);
            }
            if (!row) {
                db.close();
                return reject(new Error('Round not found'));
            }
            
            // Round exists, proceed with deletion
            db.run(
                "DELETE FROM Rounds WHERE round_id = ?",
                [roundId],
                function(err) {
                    db.close();
                    if (err) {
                        console.error('Error deleting round:', err);
                        return reject(err);
                    }
                    resolve({ success: true });
                }
            );
        });
    });
}

// Get a specific round
async function getRound(roundId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.get("SELECT * FROM Rounds WHERE round_id = ?", [roundId], (err, row) => {
            db.close();
            if (err) return reject(err);
            if (!row) return reject(new Error('Round not found'));
            resolve(row);
        });
    });
}

// Update round
async function updateRound(roundId, maxTeams) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.run(
            "UPDATE Rounds SET max_teams = ? WHERE round_id = ?",
            [maxTeams, roundId],
            function(err) {
                if (err) {
                    db.close();
                    return reject(err);
                }
                if (this.changes === 0) {
                    db.close();
                    return reject(new Error('Round not found'));
                }
                db.get(
                    "SELECT * FROM Rounds WHERE round_id = ?",
                    [roundId],
                    (err, row) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(row);
                    }
                );
            }
        );
    });
}

// Delete round
async function deleteRound(roundId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        
        // With ON DELETE CASCADE, we only need to delete the round
        db.run(
            "DELETE FROM Rounds WHERE round_id = ?",
            [roundId],
            function(err) {
                db.close();
                if (err) {
                    console.error('Error deleting round:', err);
                    return reject(err);
                }
                if (this.changes === 0) {
                    return reject(new Error('Round not found'));
                }
                resolve({ success: true });
            }
        );
    });
}

// Lock round
async function lockRound(roundId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.run(
            "UPDATE Rounds SET is_locked = 1 WHERE round_id = ?",
            [roundId],
            function (err) {
                db.close();
                if (err) return reject(err);
                resolve({ success: true, roundId });
            }
        );
    });
}

// Create merkblad for round
async function createRoundMerkblad(rondteId, kriteriaSelections) {
    return new Promise((resolve, reject) => {
        const db = connect();
        
        // Start a transaction
        db.run("BEGIN TRANSACTION");

        const stmt = db.prepare(
            "INSERT INTO RondteMerkblad (rondte_id, kriteria_id, max_punte, gewig) VALUES (?, ?, ?, ?)"
        );

        try {
            kriteriaSelections.forEach(({ kriteria_id, max_punte }) => {
                stmt.run(rondteId, kriteria_id, max_punte || 10, 1.0); // Default weight to 1.0
            });

            stmt.finalize();
            
            db.run("COMMIT", [], (err) => {
                if (err) {
                    console.error("Commit error:", err);
                    db.run("ROLLBACK");
                    db.close();
                    return reject(err);
                }

                // Get the created merkblad entries
                db.all(
                    `SELECT rm.*, k.beskrywing 
                     FROM RondteMerkblad rm
                     JOIN Kriteria k ON rm.kriteria_id = k.kriteria_id
                     WHERE rm.rondte_id = ?`,
                    [rondteId],
                    (err, rows) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(rows);
                    }
                );
            });
        } catch (err) {
            console.error("Transaction error:", err);
            db.run("ROLLBACK");
            db.close();
            reject(err);
        }
    });
}

// Get merkblad for round
async function getRoundMerkblad(rondteId) {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.all(
            `SELECT rm.*, k.beskrywing 
             FROM RondteMerkblad rm
             JOIN Kriteria k ON rm.kriteria_id = k.kriteria_id
             WHERE rm.rondte_id = ?`,
            [rondteId],
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

// Update merkblad for round
async function updateRoundMerkblad(roundId, kriteriaSelections) {
    return new Promise((resolve, reject) => {
        const db = connect();
        
        db.run("BEGIN TRANSACTION");

        try {
            // Delete existing entries
            db.run("DELETE FROM RoundMerkblad WHERE round_id = ?", [roundId]);

            // Insert new entries
            const stmt = db.prepare(
                "INSERT INTO RoundMerkblad (round_id, kriteria_id, max_points) VALUES (?, ?, ?)"
            );

            kriteriaSelections.forEach(({ kriteria_id, max_points }) => {
                stmt.run([roundId, kriteria_id, max_points]);
            });

            stmt.finalize();
            
            db.run("COMMIT", [], (err) => {
                if (err) {
                    console.error("Commit error:", err);
                    db.run("ROLLBACK");
                    db.close();
                    return reject(err);
                }

                // Get updated merkblad
                db.all(
                    `SELECT rm.*, k.beskrywing 
                     FROM RoundMerkblad rm
                     JOIN Kriteria k ON rm.kriteria_id = k.kriteria_id
                     WHERE rm.round_id = ?`,
                    [roundId],
                    (err, rows) => {
                        db.close();
                        if (err) return reject(err);
                        resolve(rows);
                    }
                );
            });
        } catch (err) {
            console.error("Transaction error:", err);
            db.run("ROLLBACK");
            db.close();
            reject(err);
        }
    });
}

module.exports = {
    getCompetitionSettings,
    getAllCompetitionSettings,
    deleteCompetitionSettings,
    updateCompetitionSettings,
    updateTeamAcademicMark,
    getTeamsByAcademicMark,
    eliminateTeams,
    assignTeamsToGroups,
    assignAssessorsToTeams,
    getAssessorAssignments,
    getActiveTeamsCount,
    createRound,
    getRound,
    getRounds,
    updateRound,
    deleteRound,
    lockRound,
    createRoundMerkblad,
    getRoundMerkblad,
    updateRoundMerkblad
};