const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/middleware');
const { calculateRoundResults, getRoundResults } = require('./round_results');

// Middleware to ensure user is authenticated and is an admin
router.use(authMiddleware(['admin']));

// Lock round and calculate results
router.post('/rounds/:roundId/lock', async (req, res) => {
    try {
        const { roundId } = req.params;
        const results = await calculateRoundResults(roundId);
        res.json(results);
    } catch (err) {
        console.error('Error locking round:', err);
        res.status(500).json({ error: 'Kon nie rondte sluit nie: ' + err.message });
    }
});

// Get round results
router.get('/rounds/:roundId/results', async (req, res) => {
    try {
        const { roundId } = req.params;
        const results = await getRoundResults(roundId);
        res.json(results);
    } catch (err) {
        console.error('Error getting round results:', err);
        res.status(500).json({ error: 'Kon nie rondte resultate kry nie: ' + err.message });
    }
});

module.exports = router;