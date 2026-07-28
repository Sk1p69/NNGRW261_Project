// express_agterend/kriteria/kriteria.js
const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

function connect() {
  return new sqlite3.Database(getDatabasePath());
}

// Kry al die kriteria
function getAllKriteria() {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.all('SELECT * FROM Kriteria', [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Kry kriteria per id
function getKriteriaById(id) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.get('SELECT * FROM Kriteria WHERE kriteria_id = ?', [id], (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Skep nuwe kriteria en return die ingesette ry
function createKriteria({ beskrywing, default_totaal, merk_gids, max_punte = 10, gewig = 1.0 }) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.run(
      'INSERT INTO Kriteria (beskrywing, default_totaal, merk_gids, max_punte, gewig) VALUES (?, ?, ?, ?, ?)',
      [beskrywing, default_totaal, merk_gids, max_punte, gewig],
      function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        db.get('SELECT * FROM Kriteria WHERE kriteria_id = ?', [this.lastID], (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        });
      }
    );
  });
}

// Update kriteria en return die ge-updated ry (of null as nie gevind)
function updateKriteria(id, { beskrywing, default_totaal, merk_gids }) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.run(
      'UPDATE Kriteria SET beskrywing = ?, default_totaal = ?, merk_gids = ? WHERE kriteria_id = ?',
      [beskrywing, default_totaal, merk_gids, id],
      function (err) {
        if (err) {
          db.close();
          return reject(err);
        }
        if (this.changes === 0) {
          db.close();
          return resolve(null);
        }
        db.get('SELECT * FROM Kriteria WHERE kriteria_id = ?', [id], (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        });
      }
    );
  });
}

// Verwyder kriteria (return true as verwyder, false as nie gevind)
function deleteKriteria(id) {
  return new Promise((resolve, reject) => {
    const db = connect();
    db.run('DELETE FROM Kriteria WHERE kriteria_id = ?', [id], function (err) {
      db.close();
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

module.exports = {
  getAllKriteria,
  getKriteriaById,
  createKriteria,
  updateKriteria,
  deleteKriteria
};
