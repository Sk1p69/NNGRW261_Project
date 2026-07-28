const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

function connect() {
  return new sqlite3.Database(getDatabasePath());
}

// ==================== SPAN FUNKSIES ====================

async function addTestTeams() {
  return new Promise((resolve, reject) => {
    const db = connect();
    
    const testTeams = [
      { naam: 'Span Alpha', mark: 85, bio: 'Alpha span se biografie', beskrywing: 'Alpha projek beskrywing' },
      { naam: 'Span Beta', mark: 78, bio: 'Beta span se biografie', beskrywing: 'Beta projek beskrywing' },
      { naam: 'Span Gamma', mark: 92, bio: 'Gamma span se biografie', beskrywing: 'Gamma projek beskrywing' },
      { naam: 'Span Delta', mark: 65, bio: 'Delta span se biografie', beskrywing: 'Delta projek beskrywing' },
      { naam: 'Span Epsilon', mark: 88, bio: 'Epsilon span se biografie', beskrywing: 'Epsilon projek beskrywing' },
      { naam: 'Span Zeta', mark: 73, bio: 'Zeta span se biografie', beskrywing: 'Zeta projek beskrywing' },
      { naam: 'Span Eta', mark: 95, bio: 'Eta span se biografie', beskrywing: 'Eta projek beskrywing' },
      { naam: 'Span Theta', mark: 82, bio: 'Theta span se biografie', beskrywing: 'Theta projek beskrywing' },
      { naam: 'Span Iota', mark: 77, bio: 'Iota span se biografie', beskrywing: 'Iota projek beskrywing' },
      { naam: 'Span Kappa', mark: 89, bio: 'Kappa span se biografie', beskrywing: 'Kappa projek beskrywing' },
      { naam: 'Span Lambda', mark: 91, bio: 'Lambda span se biografie', beskrywing: 'Lambda projek beskrywing' },
      { naam: 'Span Mu', mark: 84, bio: 'Mu span se biografie', beskrywing: 'Mu projek beskrywing' },
      { naam: 'Span Nu', mark: 76, bio: 'Nu span se biografie', beskrywing: 'Nu projek beskrywing' },
      { naam: 'Span Xi', mark: 93, bio: 'Xi span se biografie', beskrywing: 'Xi projek beskrywing' }
    ];

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const stmt = db.prepare('INSERT INTO span (naam, academic_mark, span_bio, projek_beskrywing) VALUES (?, ?, ?, ?)');
      
      testTeams.forEach(team => {
        stmt.run([team.naam, team.mark, team.bio, team.beskrywing]);
      });

      stmt.finalize();
      
      db.run('COMMIT', err => {
        if (err) {
          db.run('ROLLBACK');
          db.close();
          reject(err);
        } else {
          db.close();
          resolve({ message: '14 spanne bygevoeg', success: true });
        }
      });
    });
  });
}

async function addTestTeamsToDatabase() {
  try {
    await addTestTeams();
    return { success: true, message: '14 test teams added successfully' };
  } catch (error) {
    throw error;
  }
}

async function getAllTeams() {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.all("SELECT * FROM Span", [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function getTeamById(id) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.get("SELECT * FROM Span WHERE span_id = ?", [id], (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function createTeam(data) {
  return new Promise((resolve, reject) => {
    const db = connect();
    const { naam, projek_beskrywing, span_bio, logo, academic_mark } = data;
    db.run(
      "INSERT INTO Span (naam, projek_beskrywing, span_bio, logo, academic_mark) VALUES (?, ?, ?, ?, ?)",
      [naam, projek_beskrywing || null, span_bio || null, logo || null, academic_mark || null],
      function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        db.get("SELECT * FROM Span WHERE span_id = ?", [this.lastID], (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        });
      }
    );
  });
}

async function updateTeam(id, data) {
  return new Promise((resolve, reject) => {
    if (!data || !data.naam) {
      return reject(new Error('Naam is required'));
    }

    const db = connect();
    const { naam, projek_beskrywing, span_bio, logo, academic_mark } = data;
    console.log('Updating team in database:', { id, data }); // Debug log
    
    db.run(
      "UPDATE Span SET naam = ?, projek_beskrywing = ?, span_bio = ?, logo = ?, academic_mark = ? WHERE span_id = ?",
      [naam, projek_beskrywing || null, span_bio || null, logo || null, academic_mark !== undefined ? academic_mark : null, id],
      function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        if (this.changes === 0) {
          db.close();
          return resolve(null);
        }
        db.get("SELECT * FROM Span WHERE span_id = ?", [id], (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        });
      }
    );
  });
}

async function deleteTeam(id) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.run("DELETE FROM Span WHERE span_id = ?", [id], function (err) {
      db.close();
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

async function updateTeamAcademicMark(id, academicMark) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.run(
      "UPDATE Span SET academic_mark = ? WHERE span_id = ?",
      [academicMark || null, id],
      function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        if (this.changes === 0) {
          db.close();
          return resolve(null);
        }
        db.get("SELECT * FROM Span WHERE span_id = ?", [id], (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        });
      }
    );
  });
}

// ==================== LID FUNKSIES ====================

async function getMembersByTeamId(teamId) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.all("SELECT * FROM Lid WHERE span_id = ?", [teamId], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function getMemberById(teamId, memberId) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.get(
      "SELECT * FROM Lid WHERE span_id = ? AND lid_id = ?",
      [teamId, memberId],
      (err, row) => {
        db.close();
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

async function createMember(teamId, data) {
  return new Promise((resolve, reject) => {
    const db = connect();
    const { naam, bio, foto } = data;
    db.run(
      "INSERT INTO Lid (span_id, naam, bio, foto) VALUES (?, ?, ?, ?)",
      [teamId, naam, bio || null, foto || null],
      function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        db.get("SELECT * FROM Lid WHERE lid_id = ?", [this.lastID], (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        });
      }
    );
  });
}

async function updateMember(teamId, memberId, data) {
  return new Promise((resolve, reject) => {
    const db = connect();
    const { naam, bio, foto } = data;
    db.run(
      "UPDATE Lid SET naam = ?, bio = ?, foto = ? WHERE span_id = ? AND lid_id = ?",
      [naam, bio || null, foto || null, teamId, memberId],
      function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        if (this.changes === 0) {
          db.close();
          return resolve(null);
        }
        db.get("SELECT * FROM Lid WHERE span_id = ? AND lid_id = ?", [teamId, memberId], (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        });
      }
    );
  });
}

async function deleteMember(teamId, memberId) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.run("DELETE FROM Lid WHERE span_id = ? AND lid_id = ?", [teamId, memberId], function (err) {
      db.close();
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

// ==================== EXPORT ====================

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  updateTeamAcademicMark,
  getMembersByTeamId,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  addTestTeamsToDatabase
};
