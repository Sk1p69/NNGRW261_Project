const express = require('express');
const router = express.Router();
const { 
    assignTeamToGroup, 
    assignBeoordelaarToGroup,
    getTeamsInGroup,
    getBeoordelaarsInGroup,
    autoAssignTeams
} = require('./group_management');
// Assign a team to a group
router.post('/teams/:spanId/group', async (req, res) => {
    try {
        const { spanId } = req.params;
        const { group } = req.body;

        if (!group || !['A', 'B'].includes(group)) {
            return res.status(400).json({ error: 'Invalid group. Must be A or B' });
        }

        await assignTeamToGroup(spanId, group);
        res.json({ message: `Team successfully assigned to Group ${group}` });
    } catch (err) {
        console.error('Error assigning team to group:', err);
        res.status(500).json({ error: err.message });
    }
});

// Assign a beoordelaar to a group
router.post('/beoordelaars/:beoordelaarId/group', async (req, res) => {
    try {
        const { beoordelaarId } = req.params;
        const { group } = req.body;

        if (!group || !['A', 'B'].includes(group)) {
            return res.status(400).json({ error: 'Invalid group. Must be A or B' });
        }

        await assignBeoordelaarToGroup(beoordelaarId, group);
        res.json({ message: `Beoordelaar successfully assigned to Group ${group}` });
    } catch (err) {
        console.error('Error assigning beoordelaar to group:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get teams in a group
router.get('/groups/:group/teams', async (req, res) => {
    try {
        const { group } = req.params;
        
        if (!['A', 'B'].includes(group)) {
            return res.status(400).json({ error: 'Invalid group. Must be A or B' });
        }

        const teams = await getTeamsInGroup(group);
        res.json(teams);
    } catch (err) {
        console.error('Error getting teams in group:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get beoordelaars in a group
router.get('/groups/:group/beoordelaars', async (req, res) => {
    try {
        const { group } = req.params;
        
        if (!['A', 'B'].includes(group)) {
            return res.status(400).json({ error: 'Invalid group. Must be A or B' });
        }

        const beoordelaars = await getBeoordelaarsInGroup(group);
        res.json(beoordelaars);
    } catch (err) {
        console.error('Error getting beoordelaars in group:', err);
        res.status(500).json({ error: err.message });
    }
});

// Auto-assign teams to groups
router.post('/groups/auto-assign', async (req, res) => {
    try {
        const result = await autoAssignTeams();
        res.json(result);
    } catch (err) {
        console.error('Error in auto-assign:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;