const jwt = require('jsonwebtoken');

function authMiddleware(allowedRoles = []) {
    return (req, res, next) => {
        console.log('Auth headers:', req.headers);  // Debug logging
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.log('No auth header present');  // Debug logging
            return res.status(401).json({ message: 'Teken asseblief eers aan' });
        }

        try {
            const token = authHeader.split(' ')[1];
            console.log('Token received:', token ? 'present' : 'missing');  // Debug logging (don't log actual token)
            
            if (!token) {
                return res.status(401).json({ message: 'Ongeldige magtigingsformaat' });
            }

            const decoded = jwt.verify(token, 'jou-geheime-sleutel');
            console.log('Decoded token:', { role: decoded.role });  // Debug logging (limited info)
            
            req.user = decoded;

            if (allowedRoles.length === 0 || allowedRoles.includes(decoded.role)) {
                next();
            } else {
                console.log('Insufficient role. Required:', allowedRoles, 'Got:', decoded.role);  // Debug logging
                res.status(403).json({ message: 'Onvoldoende toestemming' });
            }
        } catch (err) {
            console.error('Token verification error:', err.message);  // Debug logging
            res.status(401).json({ message: 'Ongeldige magtiging. Teken asseblief weer aan.' });
        }
    };
}

module.exports = authMiddleware;