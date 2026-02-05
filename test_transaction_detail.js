const axios = require('axios');

// Test script to verify the new transaction detail API endpoint
async function testTransactionDetailAPI() {
    try {
        console.log('Testing transaction detail API endpoint...');
        
        // This would require a valid admin token to work properly
        // For testing purposes, we'll just check if the route exists
        const response = await axios.get('http://localhost:3000/api/transaction-detail/60f1b2b3c9e2f3a1d8b4c5d6', {
            headers: {
                'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // This is just a placeholder
            }
        });
        
        console.log('API Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('API Error Response:', error.response.status, error.response.data);
        } else {
            console.log('Network Error:', error.message);
        }
    }
}

// Run the test
testTransactionDetailAPI();