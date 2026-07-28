const express = require('express');
const router = express.Router();
const { authenticate, generateToken } = require('./auth');

router.post('/login', async (req, res) => {
    try {
        if (!req.body) {
            console.log('No request body received');
            return res.status(400).json({ message: 'Geen versoek data ontvang nie' });
        }

        const { username, password } = req.body;
        console.log('Login attempt:', { username, password });
        
        if (!username || !password) {
            console.log('Missing username or password');
            return res.status(400).json({ message: 'Gebruikersnaam en wagwoord word vereis' });
        }

        const user = await authenticate(username, password);
        console.log('Authentication result:', user);
        if (!user) {
            return res.status(401).json({ 
                message: 'Ongeldige gebruikersnaam of wagwoord' 
            });
        }

        const token = generateToken(user);
        res.json({ 
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Iets het verkeerd gegaan' 
        });
    }
});

module.exports = router;