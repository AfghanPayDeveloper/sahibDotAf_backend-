

import Wholesaler from '../models/Wholesaler.js'; 

console.log('Starting test...');

if (Wholesaler) {
    console.log('Wholesaler model imported successfully!', Wholesaler);
} else {
    console.error('Failed to import Wholesaler model');
}


const testWholesaler = new Wholesaler({
    userId: '60b6c1f2f1d4d55a9c7aaf40', 
    business: 'Test Business',
    address: '123 Test St',
    city: 'Test City',
    zip: '12345',
});

console.log('Test Wholesaler:', testWholesaler);
