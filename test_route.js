// Simple test to verify the new API endpoint exists
const axios = require('axios');

async function testRouteExistence() {
    console.log('Checking if the transaction detail API endpoint exists...');
    
    try {
        // Try to access the endpoint without authentication to see if the route exists
        // This will likely return a 401 (Unauthorized) if the route exists but we don't have admin rights
        const response = await axios.get('http://localhost:3000/api/transaction-detail/invalid-id');
        console.log('Unexpected success:', response.status, response.data);
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                console.log('✅ SUCCESS: Route exists! Received 401 Unauthorized (expected for admin-only route)');
                console.log('   This confirms the route /api/transaction-detail/:transactionId is properly set up');
            } else if (error.response.status === 404) {
                console.log('❌ ERROR: Route does not exist! Received 404 Not Found');
            } else {
                console.log(`⚠️  INFO: Route exists but returned status ${error.response.status}:`, error.response.data);
            }
        } else {
            console.log('❌ NETWORK ERROR:', error.message);
        }
    }
}

testRouteExistence();