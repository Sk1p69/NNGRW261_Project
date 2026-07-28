const bcrypt = require('bcryptjs');

async function testAuth() {
    const password = 'admin123';
    
    // Stoor die hash sodat ons dit kan gebruik in auth.js
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
    
    // Toets direk met dieselfde hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Direct comparison result:', isValid);
    
    // Toets met die hash wat tans in auth.js is
    const currentHash = '$2a$10$dVGvxatpDH8s3.NU12wOYuY6JN.PhEG4D0YN2GQb.KMO1uZZV8kJ6';
    const isValidWithCurrent = await bcrypt.compare(password, currentHash);
    console.log('Current hash comparison result:', isValidWithCurrent);
    
    // Druk die presiese karakters van die wagwoord
    console.log('Password characters:');
    for (let i = 0; i < password.length; i++) {
        console.log(`Character ${i}: ${password.charCodeAt(i)} ('${password[i]}')`);
    }
}

testAuth();