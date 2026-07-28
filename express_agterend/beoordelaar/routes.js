const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/middleware');
const {
    getCompetitionSettings,
    getAllCompetitionSettings,
    deleteCompetitionSettings,
    updateCompetitionSettings,
    assignAssessorsToGroups,
    getAssessorGroups,
    getTeamsByAcademicMark,
    eliminateTeams,
    createRoundMerkblad,
    getRoundMerkblad,
    updateRoundMerkblad
} = require('./competition');

const {
    getCurrentActiveRound,
    getAllRondtes,
    createRondte,
    updateRondte,
    sluitRondte,
    deleteRondte,
    getTeamsForRound,
    getNonEliminatedTeams
} = require('../merk/rondte');

// Eliminate teams
router.post('/teams/eliminate', async (req, res) => {
    try {
        await eliminateTeams(req.body.count);
        const teams = await getTeamsByAcademicMark();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all competition settings
router.get('/settings/all', async (req, res) => {
    try {
        const settings = await getAllCompetitionSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get active competition settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await getCompetitionSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete competition settings
router.delete('/settings/:id', async (req, res) => {
    try {
        await deleteCompetitionSettings(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update competition settings
router.put('/settings', async (req, res) => {
    try {
        await updateCompetitionSettings(req.body);
        const updatedSettings = await getCompetitionSettings();
        res.json(updatedSettings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign assessors to groups for a round
router.post('/rondte/:roundId/assign-assessors', async (req, res) => {
    try {
        await assignAssessorsToGroups(req.params.roundId);
        const groups = await getAssessorGroups(req.params.roundId);
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get assessor groups for a round
router.get('/rondte/:roundId/assessor-groups', async (req, res) => {
    try {
        const groups = await getAssessorGroups(req.params.roundId);
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all rounds
router.get('/rondte', async (req, res) => {
    try {
        const rounds = await getAllRondtes();
        res.json(rounds);
    } catch (err) {
        console.error('Error getting rounds:', err);
        res.status(500).json({ error: 'Could not fetch rounds' });
    }
});

// Get current active round
router.get('/rondte/active', async (req, res) => {
    try {
        const activeRound = await getCurrentActiveRound();
        if (!activeRound) {
            return res.json(null);
        }
        res.json(activeRound);
    } catch (err) {
        console.error('Error getting active round:', err);
        res.status(500).json({ error: 'Could not fetch active round' });
    }
});

// Get eligible teams for new round
router.get('/rondte/eligible-teams', async (req, res) => {
    try {
        const teams = await getNonEliminatedTeams();
        res.json(teams);
    } catch (err) {
        console.error('Error getting eligible teams:', err);
        res.status(500).json({ error: 'Could not fetch eligible teams' });
    }
});

// Create new round
router.post('/rondte', async (req, res) => {
    try {
        const newRound = await createRondte(req.body);
        res.status(201).json(newRound);
    } catch (err) {
        console.error('Error creating round:', err);
        res.status(500).json({ error: err.message || 'Could not create round' });
    }
});

// Update round
router.put('/rondte/:id', async (req, res) => {
    try {
        const updatedRound = await updateRondte(req.params.id, req.body);
        if (!updatedRound) {
            return res.status(404).json({ error: 'Round not found' });
        }
        res.json(updatedRound);
    } catch (err) {
        console.error('Error updating round:', err);
        res.status(500).json({ error: 'Could not update round' });
    }
});

// Delete round
router.delete('/rondte/:id', async (req, res) => {
    try {
        const deleted = await deleteRondte(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Round not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting round:', err);
        res.status(500).json({ error: 'Could not delete round' });
    }
});

// Close round
router.post('/rondte/:id/close', async (req, res) => {
    try {
        const closedRound = await sluitRondte(req.params.id, req.body);
        res.json(closedRound);
    } catch (err) {
        console.error('Error closing round:', err);
        res.status(500).json({ error: err.message || 'Could not close round' });
    }
});

// Close round
router.post('/rondte/:id/sluit', authMiddleware(['admin']), async (req, res) => {
    try {
        const { winnaarSpanId, spanneToelaatVirVolgendeRondte } = req.body;
        const closedRound = await sluitRondte(req.params.id, { winnaarSpanId, spanneToelaatVirVolgendeRondte });
        res.json(closedRound);
    } catch (err) {
        console.error('Error closing round:', err);
        res.status(500).json({ error: err.message || 'Could not close round' });
    }
});

// Create merkblad for round
router.post('/rondte/:roundId/merkblad', async (req, res) => {
    try {
        const { kriteriaSelections } = req.body;
        const roundId = req.params.roundId;
        const merkblad = await createRoundMerkblad(roundId, kriteriaSelections);
        res.json(merkblad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get merkblad for round
router.get('/rondte/:roundId/merkblad', async (req, res) => {
    try {
        const roundId = req.params.roundId;
        const merkblad = await getRoundMerkblad(roundId);
        res.json(merkblad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get teams for a round
router.get('/rondte/:roundId/teams', async (req, res) => {
    try {
        const roundId = req.params.roundId;
        const teams = await getTeamsForRound(roundId);
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update merkblad for round
router.put('/rondte/:roundId/merkblad', async (req, res) => {
    try {
        const { kriteriaSelections } = req.body;
        const roundId = req.params.roundId;
        const merkblad = await updateRoundMerkblad(roundId, kriteriaSelections);
        res.json(merkblad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get teams sorted by academic marks
router.get('/teams/academic', async (req, res) => {
    try {
        const teams = await getTeamsByAcademicMark();
        res.json(teams);
    } catch (err) {
        console.error('Error getting teams by academic mark:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;