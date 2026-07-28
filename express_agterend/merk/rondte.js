const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');
const db = new sqlite3.Database(getDatabasePath());

// Get current active round
async function getCurrentActiveRound() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM Rondte WHERE is_active = 1', [], (err, row) => {
      if (err) {
        console.error('Error getting active round:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Get all non-eliminated teams
async function getNonEliminatedTeams() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Span WHERE is_eliminated = 0 ORDER BY span_id', [], (err, rows) => {
      if (err) {
        console.error('Error getting non-eliminated teams:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Get teams for a specific round
async function getTeamsForRound(rondteId) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT DISTINCT s.* 
      FROM Span s
      INNER JOIN RondteSpanBeoordelaar rsb ON s.span_id = rsb.span_id
      WHERE rsb.rondte_id = ?
      ORDER BY s.span_id
    `, [rondteId], (err, rows) => {
      if (err) {
        console.error('Error getting teams for round:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// --- Kry al die rondtes ---
async function getAllRondtes() {
  return new Promise((resolve, reject) => {
    console.log('Attempting to fetch all rounds from database');
    db.all(`
      SELECT r.*, 
        (SELECT COUNT(DISTINCT span_id) 
         FROM RondteSpanBeoordelaar 
         WHERE rondte_id = r.rondte_id) as aantal_spanne,
        (SELECT naam FROM Span WHERE span_id = r.winner_span_id) as wenner_naam
      FROM Rondte r
      ORDER BY r.created_at DESC
    `, [], (err, rows) => {
      if (err) {
        console.error('Database error when fetching rounds:', err);
        reject(err);
      } else {
        console.log(`Successfully fetched ${rows?.length || 0} rounds`);
        resolve(rows || []);
      }
    });
  });
}

// --- Skep 'n nuwe rondte ---
async function createRondte(data) {
  // First check if there's an active round
  const activeRound = await getCurrentActiveRound();
  if (activeRound && !activeRound.is_gesluit) {
    throw new Error('Daar is reeds \'n aktiewe rondte. Sluit eers die huidige rondte voordat \'n nuwe een geskep word.');
  }

  // Get non-eliminated teams
  const eligibleTeams = await getNonEliminatedTeams();
  if (eligibleTeams.length === 0) {
    throw new Error('Daar is geen spanne beskikbaar vir \'n nuwe rondte nie.');
  }

  return new Promise((resolve, reject) => {
    const { naam, max_spanne = Math.min(15, eligibleTeams.length) } = data;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      try {
        // Deactivate any previously active rounds
        db.run('UPDATE Rondte SET is_active = 0 WHERE is_active = 1');

        // Create new round
        db.run(
          `INSERT INTO Rondte (
            naam, 
            max_spanne, 
            is_active,
            is_gesluit,
            created_at
          ) VALUES (?, ?, 1, 0, CURRENT_TIMESTAMP)`,
          [naam, max_spanne],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            const rondteId = this.lastID;

            // Add eligible teams to the round
            const stmt = db.prepare(
              'INSERT INTO RondteSpanBeoordelaar (rondte_id, span_id, beoordelaar_id) VALUES (?, ?, NULL)'
            );

            let teamsAdded = 0;
            for (let i = 0; i < Math.min(max_spanne, eligibleTeams.length); i++) {
              stmt.run([rondteId, eligibleTeams[i].span_id], (err) => {
                if (err) {
                  console.error('Error adding team to round:', err);
                  stmt.finalize();
                  db.run('ROLLBACK');
                  return reject(err);
                }
                teamsAdded++;

                if (teamsAdded === Math.min(max_spanne, eligibleTeams.length)) {
                  stmt.finalize((err) => {
                    if (err) {
                      console.error('Error finalizing team additions:', err);
                      db.run('ROLLBACK');
                      return reject(err);
                    }

                    // Get the newly created round
                    db.get('SELECT * FROM Rondte WHERE rondte_id = ?', [rondteId], (err, round) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                      }

                      db.run('COMMIT');
                      resolve(round);
                    });
                  });
                }
              });
            }
          }
        );
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
}


// --- Update 'n rondte ---
async function updateRondte(id, data) {
  const round = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM Rondte WHERE rondte_id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!round) {
    throw new Error('Rondte nie gevind nie');
  }

  if (round.is_gesluit) {
    throw new Error('Kan nie \'n gesluite rondte opdateer nie');
  }

  return new Promise((resolve, reject) => {
    const { naam, max_spanne } = data;
    db.run(
      `UPDATE Rondte 
       SET naam = ?, max_spanne = ?
       WHERE rondte_id = ?`,
      [naam, max_spanne, id],
      function(err) {
        if (err) reject(err);
        else resolve({ rondte_id: id, ...data });
      }
    );
  });
}

// --- Lock a round and eliminate teams ---
async function sluitRondte(id, { winnaarSpanId, spanneToelaatVirVolgendeRondte }) {
  const round = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM Rondte WHERE rondte_id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!round) {
    throw new Error('Rondte nie gevind nie');
  }

  if (round.is_gesluit) {
    throw new Error('Rondte is reeds gesluit');
  }

  // No need to verify marking completion - we'll use whatever marks we have

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      try {
        // Mark round as locked and inactive
        db.run(
          `UPDATE Rondte 
           SET is_gesluit = 1, 
               is_active = 0,
               winner_span_id = ?
           WHERE rondte_id = ?`,
          [winnaarSpanId, id]
        );

        // Get current round's teams
        db.all(
          `SELECT DISTINCT s.span_id
           FROM Span s
           INNER JOIN RondteSpanBeoordelaar rsb ON s.span_id = rsb.span_id
           WHERE rsb.rondte_id = ?`,
          [id],
          (err, teams) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            // Mark teams as eliminated if not in spanneToelaatVirVolgendeRondte
            const stmt = db.prepare(
              'UPDATE Span SET is_eliminated = 1 WHERE span_id = ?'
            );

            teams.forEach(team => {
              if (!spanneToelaatVirVolgendeRondte.includes(team.span_id)) {
                stmt.run(team.span_id);
              }
            });

            stmt.finalize();
            db.run('COMMIT');
            resolve({ success: true, rondte_id: id });
          }
        );
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
}

// --- Delete a round ---
async function deleteRondte(id) {
  const round = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM Rondte WHERE rondte_id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!round) {
    throw new Error('Rondte nie gevind nie');
  }

  if (round.is_gesluit) {
    throw new Error('Kan nie \'n gesluite rondte verwyder nie');
  }

  return new Promise((resolve, reject) => {
    db.run('DELETE FROM Rondte WHERE rondte_id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(this.changes > 0);
    });
  });
}

module.exports = {
  getCurrentActiveRound,
  getAllRondtes,
  createRondte,
  updateRondte,
  sluitRondte,
  deleteRondte,
  getTeamsForRound,
  getNonEliminatedTeams
};
