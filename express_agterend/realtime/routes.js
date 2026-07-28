const express = require('express');
const router = express.Router();
const sseManager = require('./sse_manager');

// SSE connection endpoint
router.get('/stream', (req, res) => {
    sseManager.addClient(res);
});

module.exports = router;