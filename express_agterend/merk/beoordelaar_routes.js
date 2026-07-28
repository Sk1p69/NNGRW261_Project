const express = require('express');
const router = express.Router();
const { getCurrentActiveRound } = require('./rondte');
const authMiddleware = require('../auth/middleware');
const { getAssignedTeamsForBeoordelaar, getMarks, submitMarks, hasMarkedTeam } = require('./beoordelaar_operations');
const { getMerkbladForRound, ensureMerkbladExists } = require('./merkblad_operations');

// Middleware to ensure user is authenticated and is a beoordelaar
router.use(authMiddleware(['beoordelaar']));

// Get available rounds for marking (only returns active round for beoordelaar)
router.get('/rounds/available', async (req, res) => {
    try {
        const activeRound = await getCurrentActiveRound();
        res.json(activeRound ? [activeRound] : []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get teams assigned to beoordelaar for a round
router.get('/rounds/:roundId/teams', async (req, res) => {
    try {
        const roundId = req.params.roundId;
        const beoordelaarId = req.user.id; // from auth middleware

        const teams = await getAssignedTeamsForBeoordelaar(roundId, beoordelaarId);
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get merkblad for a round
router.get('/rounds/:roundId/merkblad', async (req, res) => {
    try {
        const roundId = parseInt(req.params.roundId, 10);
        if (isNaN(roundId)) {
            return res.status(400).json({ error: 'Invalid round ID' });
        }
        console.log('Fetching merkblad for round:', roundId); // Debug log

        try {
            const merkblad = await getMerkbladForRound(roundId);
            console.log('Found/created merkblad:', merkblad); // Debug log
            res.json(merkblad);
        } catch (dbErr) {
            console.error('Database error:', dbErr);
            res.status(500).json({ 
                error: 'Databasis fout tydens die laai van die merkblad',
                details: dbErr.message 
            });
        }
    } catch (err) {
        console.error('Error in merkblad route:', err); // Debug log
        res.status(500).json({ 
            error: 'Onverwagte fout tydens die laai van die merkblad',
            details: err.message 
        });
    }
});

// Check if beoordelaar has marked a team
router.get('/rounds/:roundId/teams/:teamId/marked', async (req, res) => {
    try {
        const { roundId, teamId } = req.params;
        const beoordelaarId = req.user.id;

        const hasMarked = await hasMarkedTeam(roundId, teamId, beoordelaarId);
        res.json(hasMarked);
    } catch (err) {
        console.error('Error checking mark status:', err);
        res.status(500).json({ error: 'Kon nie merk status nagaan nie' });
    }
});

// Submit or update marks for a team
router.post('/rounds/:roundId/teams/:teamId/marks', async (req, res) => {
    try {
        const { roundId, teamId } = req.params;
        const beoordelaarId = req.user.id;
        const { marks } = req.body;

        await submitMarks({
            rondte_id: roundId,
            span_id: teamId,
            beoordelaar_id: beoordelaarId,
            punte: marks
        });

        res.json({ message: 'Punte suksesvol gestoor' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;