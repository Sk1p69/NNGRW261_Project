const bcrypt = require('bcryptjs');

async function generateHash() {
    console.log('Generating hashes...');
    
    const adminPass = 'admin123';
    const beoordelaarPass = 'beoordelaar123';
    
    console.log('Original passwords:');
    console.log('Admin:', adminPass);
    console.log('Beoordelaar:', beoordelaarPass);
    
    const adminHash = await bcrypt.hash(adminPass, 10);
    const beoordelaarHash = await bcrypt.hash(beoordelaarPass, 10);
    
    console.log('\nGenerated hashes:');
    console.log('Admin hash:', adminHash);
    console.log('Beoordelaar hash:', beoordelaarHash);
    
    // Test the hashes
    console.log('\nTesting hashes:');
    const adminValid = await bcrypt.compare(adminPass, adminHash);
    const beoordelaarValid = await bcrypt.compare(beoordelaarPass, beoordelaarHash);
    
    console.log('Admin password valid:', adminValid);
    console.log('Beoordelaar password valid:', beoordelaarValid);
}

generateHash();