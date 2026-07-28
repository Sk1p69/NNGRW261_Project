const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.resolve(__dirname, "../melktert.db"));

// Alle merkblaaie
function getAllMerkblads() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT m.merkblad_id, m.rondte_id, m.kriteria_id, k.beskrywing, k.default_totaal
      FROM Merkblad m
      LEFT JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
    `;
    db.all(query, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Kry merkblad detail per ID
function getMerkbladById(id) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT m.merkblad_id, m.rondte_id, m.kriteria_id, k.beskrywing, k.default_totaal
      FROM Merkblad m
      LEFT JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
      WHERE m.merkblad_id = ?
    `;
    db.all(query, [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Skep nuwe merkblad (een per rondte, met verskeie kriteria)
function createMerkblad(data) {
  return new Promise((resolve, reject) => {
    const { rondte_id, kriteria_ids } = data;

    if (!Array.isArray(kriteria_ids) || kriteria_ids.length === 0) {
      return reject(new Error("Geen kriteria voorsien nie"));
    }

    // check of rondte reeds merkblad het
    db.all("SELECT * FROM Merkblad WHERE rondte_id=?", [rondte_id], (err, rows) => {
      if (err) return reject(err);
      if (rows.length > 0) {
        return reject(new Error("Rondte het reeds 'n merkblad – gebruik update"));
      }

      const stmt = db.prepare(
        `INSERT INTO Merkblad (rondte_id, kriteria_id, totaal) VALUES (?, ?, 0)`
      );
      const inserted = [];

      kriteria_ids.forEach((kid) => {
        stmt.run([rondte_id, kid], function (err) {
          if (!err) {
            inserted.push({ merkblad_id: this.lastID, rondte_id, kriteria_id: kid });
          }
        });
      });

      stmt.finalize((err) => {
        if (err) return reject(err);
        resolve(inserted);
      });
    });
  });
}

// Wysig merkblad: vervang kriteria vir rondte
function updateMerkblad(rondte_id, data) {
  return new Promise((resolve, reject) => {
    const { kriteria_ids } = data;

    if (!Array.isArray(kriteria_ids) || kriteria_ids.length === 0) {
      return reject(new Error("Geen kriteria voorsien nie"));
    }

    db.run("DELETE FROM Merkblad WHERE rondte_id=?", [rondte_id], function (err) {
      if (err) return reject(err);

      const stmt = db.prepare(
        "INSERT INTO Merkblad (rondte_id, kriteria_id, totaal) VALUES (?, ?, 0)"
      );
      const inserted = [];

      kriteria_ids.forEach((kid) => {
        stmt.run([rondte_id, kid], function (err) {
          if (!err) {
            inserted.push({ merkblad_id: this.lastID, rondte_id, kriteria_id: kid });
          }
        });
      });

      stmt.finalize((err) => {
        if (err) return reject(err);
        resolve(inserted);
      });
    });
  });
}

// Verwyder spesifieke merkblad-ry (een kriteria in merkblad)
function deleteMerkblad(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM Merkblad WHERE merkblad_id=?`, [id], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

module.exports = {
  getAllMerkblads,
  getMerkbladById,
  createMerkblad,
  updateMerkblad,
  deleteMerkblad,
};
