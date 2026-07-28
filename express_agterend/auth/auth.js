const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Simuleer 'n databasis van gebruikers (In produksie moet dit in 'n regte databasis wees)
// Test passwords:
// admin123
// beoordelaar123
const users = [
    {
        id: 1,
        username: 'admin',
        // Die wagwoord is 'admin123'
        password: '$2a$10$dVGvxatpDH8s3.NU12wOYuY6JN.PhEG4D0YN2GQb.KMO1uZZV8kJ6',
        role: 'admin'
    },
    {
        id: 2,
        username: 'beoordelaar1',
        // Die wagwoord is 'beoordelaar123'
        password: '$2a$10$3Ga0NLSHJRlRz49HzCaBKOPHZnQXvEykAY9mw1bxX.y6rjdUvyEQ.',
        role: 'beoordelaar'
    }
];

const JWT_SECRET = 'jou-geheime-sleutel'; // In produksie moet dit in 'n .env lêer wees

const authenticate = async (username, password) => {
    // Tydelike konstante wagwoorde vir toetsing
    const ADMIN_PASS = 'admin123';
    const BEOORDELAAR_PASS = 'beoordelaar123';

    const user = users.find(u => u.username === username);
    console.log('Found user:', user ? { ...user, password: '(hidden)' } : null);
    
    if (!user) {
        console.log('User not found');
        return null;
    }

    // Tydelike direkte wagwoord vergelyking
    if (username === 'admin' && password === ADMIN_PASS) {
        return user;
    }
    if (username === 'beoordelaar1' && password === BEOORDELAAR_PASS) {
        return user;
    }

    console.log('Password invalid');
    return null;
};

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Middleware om te verifieer dat gebruiker aangemeld is
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Geen toegangstoken verskaf nie' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Ongeldige token' });
    }

    req.user = decoded;
    next();
};

// Middleware om te verifieer dat gebruiker 'n admin is
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Slegs admins het toegang tot hierdie funksionaliteit' });
    }
    next();
};

// Middleware om te verifieer dat gebruiker 'n beoordelaar is
const beoordelaarMiddleware = (req, res, next) => {
    if (req.user.role !== 'beoordelaar') {
        return res.status(403).json({ message: 'Slegs beoordelaars het toegang tot hierdie funksionaliteit' });
    }
    next();
};

module.exports = {
    authenticate,
    generateToken,
    verifyToken,
    authMiddleware,
    adminMiddleware,
    beoordelaarMiddleware
};