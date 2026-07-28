const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');
const { createDefaultMerkblad, getMerkbladForRound, ensureMerkbladTable } = require('./merkblad_operations');

// Get merkblad for a specific round
async function getRoundMerkblad(rondte_id) {
    console.log('Getting merkblad for round:', rondte_id); // Debug log
    
    try {
        // Ensure the merkblad table exists
        await ensureMerkbladTable();

        // Try to get existing merkblad
        const merkblad = await getMerkbladForRound(rondte_id);
        
        if (!merkblad || !merkblad.kriteria || merkblad.kriteria.length === 0) {
            console.log('No merkblad found, creating default'); // Debug log
            return await createDefaultMerkblad(rondte_id);
        }

        return merkblad;
    } catch (err) {
        console.error('Error in getRoundMerkblad:', err);
        throw new Error(`Failed to get or create merkblad: ${err.message}`);
    }
}

module.exports = {
    getRoundMerkblad
};