// index.js (hoof backend file, aangepas)
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db_setup/setup');

// Configure CORS
const corsOptions = {
    origin: ['http://localhost', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
const authRoutes = require('./auth/routes');
const authMiddleware = require('./auth/middleware');
const beoordelaarRoutes = require('./beoordelaar/routes');
const beoordelaarMerkRoutes = require('./merk/beoordelaar_routes');
const groupRoutes = require('./admin/group_routes');
const {
  getAllMerkblads, createMerkblad, updateMerkblad, deleteMerkblad } = require('./merk/merkblad');

const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('./db_setup/setup');
const db = new sqlite3.Database(getDatabasePath());

// Jou data-funksies (jy het dit in span/span.js & merk/kriteria.js)
const {
  getTeamById,
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getMembersByTeamId,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  addTestTeamsToDatabase
} = require('./span/span');

const {
  getAllKriteria,
  getKriteriaById,
  createKriteria,
  updateKriteria,
  deleteKriteria
} = require('./merk/kriteria');

const {
  getCurrentActiveRound,
  getNonEliminatedTeams,
  getTeamsForRound,
  getAllRondtes,
  createRondte,
  sluitRondte,
  updateRondte,
  deleteRondte
} = require('./merk/rondte');

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Mount routes
app.use('/auth', authRoutes);
app.use('/admin', groupRoutes);
app.use('/beoordelaar', beoordelaarRoutes);
app.use('/admin', require('./merk/round_admin_routes'));





// Error handler for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// Update academic mark for a team
app.put('/teams/:id/academic-mark', async (req, res) => {
  const { id } = req.params;
  const { mark } = req.body;
  
  if (mark < 0 || mark > 100) {
    return res.status(400).json({ error: 'Academic mark must be between 0 and 100' });
  }

  try {
    const db = new sqlite3.Database(getDatabasePath());
    await new Promise((resolve, reject) => {
      db.run('UPDATE Span SET academic_mark = ? WHERE span_id = ?', [mark, id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    const updatedTeam = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM Span WHERE span_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    db.close();
    if (!updatedTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(updatedTeam);
  } catch (err) {
    res.status(500).json({ error: 'Could not update academic mark' });
  }
});

// Add auth routes
app.use('/auth', authRoutes);

// Add beoordelaar marking routes
app.use('/beoordelaar', beoordelaarMerkRoutes);


// Import SSE routes and manager
const sseManager = require('./realtime/sse_manager');
const realtimeRoutes = require('./realtime/routes');

app.get('/', (req, res) => {
  res.json({ message: 'Welkom by die Melktert Express agterend' });
});

//
// TEAMS CRUD (ongewysig, jou bestaande handlers)
//
app.post('/teams/test', async (req, res) => {
  try {
    const result = await addTestTeamsToDatabase();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Could not add test teams', details: err.message });
  }
});

app.get('/teams', async (req, res) => {
  try {
    const teams = await getAllTeams();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie spanne laai nie', details: err.message });
  }
});

app.get('/teams/:id', async (req, res) => {
  const spanId = parseInt(req.params.id, 10);
  if (isNaN(spanId)) return res.status(400).json({ error: 'Ongeldige span ID' });
  try {
    const team = await getTeamById(spanId);
    if (!team) return res.status(404).json({ error: 'Span nie gevind nie' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie span inligting laai nie', details: err.message });
  }
});

app.post('/teams', async (req, res) => {
  try {
    const newTeam = await createTeam(req.body); // req.body bevat naam, projek_beskrywing, span_bio, logo
    res.status(201).json(newTeam);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie span skep nie', details: err.message });
  }
});

app.put('/teams/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Ongeldige span ID' });
  try {
    console.log('Updating team with data:', { id, body: req.body }); // Debug log
    const updated = await updateTeam(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Span nie gevind nie' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating team:', err); // Debug log
    res.status(500).json({ error: 'Kon nie span opdateer nie', details: err.message });
  }
});

app.delete('/teams/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Ongeldige span ID' });
  try {
    const deleted = await deleteTeam(id);
    if (!deleted) return res.status(404).json({ error: 'Span nie gevind nie' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie span verwyder nie', details: err.message });
  }
});

//
// MEMBERS CRUD
//
app.get('/teams/:id/members', async (req, res) => {
  const spanId = parseInt(req.params.id, 10);
  if (isNaN(spanId)) return res.status(400).json({ error: 'Ongeldige span ID' });
  try {
    const members = await getMembersByTeamId(spanId);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie span lede laai nie', details: err.message });
  }
});

app.get('/teams/:id/members/:lid', async (req, res) => {
  const spanId = parseInt(req.params.id, 10);
  const lidId = parseInt(req.params.lid, 10);
  if (isNaN(spanId) || isNaN(lidId)) return res.status(400).json({ error: 'Ongeldige ID' });
  try {
    const member = await getMemberById(spanId, lidId);
    if (!member) return res.status(404).json({ error: 'Lid nie gevind nie' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie lid laai nie', details: err.message });
  }
});

app.post('/teams/:id/members', async (req, res) => {
  const spanId = parseInt(req.params.id, 10);
  if (isNaN(spanId)) return res.status(400).json({ error: 'Ongeldige span ID' });
  try {
    const newMember = await createMember(spanId, req.body);
    res.status(201).json(newMember);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie lid skep nie', details: err.message });
  }
});

app.put('/teams/:id/members/:lid', async (req, res) => {
  const spanId = parseInt(req.params.id, 10);
  const lidId = parseInt(req.params.lid, 10);
  if (isNaN(spanId) || isNaN(lidId)) return res.status(400).json({ error: 'Ongeldige ID' });
  try {
    const updated = await updateMember(spanId, lidId, req.body);
    if (!updated) return res.status(404).json({ error: 'Lid nie gevind nie' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie lid opdateer nie', details: err.message });
  }
});

app.delete('/teams/:id/members/:lid', async (req, res) => {
  const spanId = parseInt(req.params.id, 10);
  const lidId = parseInt(req.params.lid, 10);
  if (isNaN(spanId) || isNaN(lidId)) return res.status(400).json({ error: 'Ongeldige ID' });
  try {
    const deleted = await deleteMember(spanId, lidId);
    if (!deleted) return res.status(404).json({ error: 'Lid nie gevind nie' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie lid verwyder nie', details: err.message });
  }
});

//
// KRITERIA CRUD
//
app.get('/kriteria', async (req, res) => {
  try {
    const result = await getAllKriteria();
    res.json(result);
  } catch (err) {
    console.error('GET /kriteria failed:', err);
    res.status(500).json({ error: 'Kon nie kriteria laai nie', details: err.message });
  }
});

app.get('/kriteria/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Ongeldige ID' });
  try {
    const result = await getKriteriaById(id);
    if (!result) return res.status(404).json({ error: 'Kriteria nie gevind nie' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie kriteria laai nie', details: err.message });
  }
});

app.post('/kriteria', async (req, res) => {
  try {
    const created = await createKriteria(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie kriteria skep nie', details: err.message });
  }
});

app.put('/kriteria/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Ongeldige ID' });
  try {
    const updated = await updateKriteria(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Kriteria nie gevind nie' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie kriteria opdateer nie', details: err.message });
  }
});

app.delete('/kriteria/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Ongeldige ID' });
  try {
    const deleted = await deleteKriteria(id);
    if (!deleted) return res.status(404).json({ error: 'Kriteria nie gevind nie' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie kriteria verwyder nie', details: err.message });
  }
});

// Mount realtime routes
app.use('/realtime', realtimeRoutes);

//
// MERKBLAD CRUD (gebruik jou bestaande functions)
//
app.get(['/merkblads', '/beoordelaar/merkblads'], authMiddleware(['admin', 'beoordelaar']), async (req, res) => {
  try {
    const rows = await getAllMerkblads();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie merkblads laai nie', details: err.message });
  }
});

// GET merkblad by ID (jou bestaande logic)
app.get('/merkblads/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Ongeldige merkblad ID' });
  }

  if (typeof db === 'undefined' || !db) {
    console.error('Database object "db" is nie beskikbaar nie. Kontroleer db_setup en hoe jy db export/import.');
    return res.status(500).json({ error: 'Databasis nie beskikbaar nie' });
  }

  const sql = `
    SELECT m.merkblad_id, m.rondte_id, m.kriteria_id, m.totaal,
           k.kriteria_id AS k_id, k.beskrywing, k.default_totaal
    FROM Merkblad m
    JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
    WHERE m.merkblad_id = ?
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('GET /merkblads/:id - DB error:', err);
      return res.status(500).json({ error: 'DB fout by laai van merkblad', details: err.message });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Merkblad nie gevind nie' });
    }

    const merkblad = {
      merkblad_id: rows[0].merkblad_id,
      rondte_id: rows[0].rondte_id,
      totaal: rows[0].totaal,
      kriteria: rows.map(r => ({
        kriteria_id: r.k_id,
        beskrywing: r.beskrywing,
        default_totaal: r.default_totaal
      }))
    };

    return res.json(merkblad);
  });
});

app.post('/merkblads', async (req, res) => {
  try {
    const created = await createMerkblad(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie merkblad skep nie', details: err.message });
  }
});

app.put('/merkblads/:id', async (req, res) => {
  // our updateMerkblad expects rondte_id as identifier in your earlier implementation;
  // keep accepting param but forward rondte id as needed.
  const idParam = parseInt(req.params.id, 10);
  try {
    const updated = await updateMerkblad(idParam, req.body);
    if (!updated) return res.status(404).json({ error: 'Merkblad nie gevind nie' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie merkblad opdateer nie', details: err.message });
  }
});

app.delete('/merkblads/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const deleted = await deleteMerkblad(id);
    if (!deleted) return res.status(404).json({ error: 'Merkblad nie gevind nie' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie merkblad verwyder nie', details: err.message });
  }
});

// Sluit 'n merkblad
app.post('/merkblads/:id/sluit', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Ongeldige merkblad ID" });

  db.run(
    `UPDATE Merkblad SET is_gesluit = 1 WHERE merkblad_id = ?`,
    [id],
    function (err) {
      if (err) {
        console.error("Kon nie merkblad sluit nie:", err);
        return res.status(500).json({ error: "DB fout" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Merkblad nie gevind nie" });
      }
      res.json({ ok: true, merkblad_id: id });
    }
  );
});



//
// RONDTES CRUD
//
// Allow both admin and beoordelaar to access rounds
app.get('/rondtes', authMiddleware(['admin', 'beoordelaar']), async (req, res) => {
  console.log('GET /rondtes request received');
  console.log('User:', req.user); // Log the authenticated user
  
  try {
    console.log('Fetching rounds...');
    const rows = await getAllRondtes();
    console.log('Rounds fetched successfully:', rows);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching rounds:', err);
    res.status(500).json({ 
      message: 'Kon nie rondtes laai nie', 
      details: err.message,
      stack: err.stack 
    });
  }
});

app.post('/rondtes', authMiddleware(['admin']), async (req, res) => {
  try {
    const { is_eerste, is_laaste, is_gesluit, max_spanne } = req.body;

    const rondteData = {
      is_eerste: is_eerste ? 1 : 0,
      is_laaste: is_laaste ? 1 : 0,
      is_gesluit: is_gesluit ? 1 : 0,
      max_spanne: Number.parseInt(max_spanne, 10) || 0
    };

    const created = await createRondte(rondteData);
    res.status(201).json(created);
  } catch (err) {
    console.error("❌ Rondte insert error:", err.message, err.stack);
    res.status(500).json({ error: 'Kon nie rondte skep nie', details: err.message });
  }
});



app.put('/rondtes/:id', authMiddleware(['admin']), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const updated = await updateRondte(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Rondte nie gevind nie' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Kon nie rondte opdateer nie', details: err.message });
  }
});

app.delete('/rondtes/:id', authMiddleware(['admin']), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const deleted = await deleteRondte(id);
    if (!deleted) return res.status(404).json({ error: 'Rondte nie gevind nie' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie rondte verwyder nie', details: err.message });
  }
});

//
// BEOORDELAAR Routes
//

//
// Competition Management Routes
//

// Get competition settings
app.get('/competition/settings', async (req, res) => {
    try {
        const settings = await competitionHandlers.getCompetitionSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update competition settings
app.put('/competition/settings', async (req, res) => {
    try {
        const settings = await competitionHandlers.updateCompetitionSettings(req.body);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update team academic mark
app.put('/competition/teams/:id/mark', async (req, res) => {
    try {
        const result = await competitionHandlers.updateTeamAcademicMark(
            parseInt(req.params.id, 10),
            parseFloat(req.body.mark)
        );
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get teams sorted by academic mark
app.get('/competition/teams/academic', async (req, res) => {
    try {
        const teams = await competitionHandlers.getTeamsByAcademicMark();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminate teams
app.post('/competition/teams/eliminate', async (req, res) => {
    try {
        const result = await competitionHandlers.eliminateTeams();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign teams to groups
app.post('/competition/teams/groups', async (req, res) => {
    try {
        const result = await competitionHandlers.assignTeamsToGroups();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign assessors to teams
app.post('/competition/assignments', async (req, res) => {
    try {
        const result = await competitionHandlers.assignAssessorsToTeams();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get assignments for an assessor
app.get('/competition/assignments/:id', async (req, res) => {
    try {
        const assignments = await competitionHandlers.getAssessorAssignments(parseInt(req.params.id, 10));
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//
// Beoordelaar Routes (Legacy)
//

// 1) Kry punte per rondte (toon alle spanne met default 0 indien geen punte nie)
app.get('/rondtes/:id/punte', authMiddleware(['admin', 'beoordelaar']), async (req, res) => {
  const rondteId = parseInt(req.params.id, 10);
  if (isNaN(rondteId)) return res.status(400).json({ error: 'Ongeldige rondte ID' });

  try {
    const sql = `
      SELECT t.span_id, t.naam, COALESCE(p.totaal, 0) as totaal
      FROM Span t
      LEFT JOIN (
        SELECT p.span_id, ROUND(AVG(p.punt), 2) as totaal
        FROM Punte_span_brug p
        JOIN Merkblad m ON p.merkblad_id = m.merkblad_id
        WHERE m.rondte_id = ?
        GROUP BY p.span_id
      ) p ON t.span_id = p.span_id
      ORDER BY totaal DESC
    `;

    db.all(sql, [rondteId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (err) {
    res.status(500).json({ error: 'Kon nie punte laai nie' });
  }
});


// 2) Sluit rondte (set is_gesluit = 1)
// ==================== RONDTE SLUIT ====================

// Use sluitRondte from the earlier import

// 2. Sluit rondte
app.post('/rondtes/:id/sluit', authMiddleware(['admin']), (req, res) => {
  const rondteId = parseInt(req.params.id, 10);
  if (isNaN(rondteId)) {
    return res.status(400).json({ error: "Ongeldige rondte ID" });
  }

  db.run(
    `UPDATE Rondte SET is_gesluit = 1 WHERE rondte_id = ?`,
    [rondteId],
    function (err) {
      if (err) {
        console.error("Kon nie rondte sluit nie:", err.message);
        return res.status(500).json({ error: "Kon nie rondte sluit nie" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Geen rondte gevind nie" });
      }
      res.json({ ok: true, rondteId });
    }
  );
});



// 3. Bereken wenner (hanteer ties ook)
app.get('/rondtes/:id/wenner', authMiddleware(['admin', 'beoordelaar']), async (req, res) => {
  const rondteId = parseInt(req.params.id, 10);
  try {
    const sql = `
      SELECT s.span_id, s.naam, SUM(p.punt) AS totaal
      FROM Punte_span_brug p
      JOIN Span s ON p.span_id = s.span_id
      JOIN Merkblad m ON p.merkblad_id = m.merkblad_id
      WHERE m.rondte_id = ?
      GROUP BY s.span_id
      ORDER BY totaal DESC
    `;

    db.all(sql, [rondteId], (err, rows) => {
      if (err) return res.status(500).json({ error: "Kon nie wenner bereken nie" });
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Geen punte beskikbaar vir hierdie rondte nie" });
      }

      const hoogstePunt = rows[0].totaal;
      const topSpanne = rows.filter(r => r.totaal === hoogstePunt);

      if (topSpanne.length === 1) {
        return res.json({
          type: "single",
          span: topSpanne[0]
        });
      } else {
        return res.json({
          type: "tie",
          spanne: topSpanne
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server fout", details: err.message });
  }
});

//
// MERK PUNTE endpoint (single, transaction-safe upsert per kriteria)
// Accepts POST body: { span_id, merkblad_id, punte: [{ kriteria_id, punt }, ...] }
//
// POST /merk/punte
app.post("/merk/punte", (req, res) => {
  const { merkblad_id, span_id, punt } = req.body;

  if (!merkblad_id || !span_id || punt == null) {
    return res.status(400).json({ error: "merkblad_id, span_id en punt is verpligtend" });
  }

  const query = `
    INSERT INTO Punte_span_brug (merkblad_id, span_id, punt)
    VALUES (?, ?, ?)
  `;

  db.run(query, [merkblad_id, span_id, punt], function (err) {
    if (err) {
      console.error("Fout met stoor van punt:", err.message);
      return res.status(500).json({ error: err.message });
    }

    const newEntry = { id: this.lastID, merkblad_id, span_id, punt };

    // Broadcast via SSE
    sseManager.emit('point_update', newEntry);

    res.status(201).json(newEntry);
  });
});

// GET /punte/span/:span_id
app.get("/punte/span/:span_id", (req, res) => {
  const spanId = parseInt(req.params.span_id, 10);

  db.all(
    `SELECT id, merkblad_id, span_id, punt FROM Punte_span_brug WHERE span_id = ?`,
    [spanId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// PUT /punte/:id
app.put("/punte/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { punt } = req.body;

  db.run(
    `UPDATE Punte_span_brug SET punt = ? WHERE id = ?`,
    [punt, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Entry nie gevind nie" });
      res.json({ id, punt });
    }
  );
});

// DELETE /punte/:id
app.delete("/punte/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);

  db.run(`DELETE FROM Punte_span_brug WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Entry nie gevind nie" });
    res.json({ ok: true, id });
  });
});

//
// START SERVER (initialize DB first)
//
initializeDatabase()
  .then((dbPath) => {
    console.log(`SQLite DB ready at ${dbPath}`);
    app.listen(port, () => {
      console.log(`Express API listening at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
