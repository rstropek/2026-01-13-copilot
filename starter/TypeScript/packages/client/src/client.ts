import axios from 'axios';

const SERVER_URL = 'http://localhost:3000';

async function testAddEndpoint() {
    try {
        const a = 5;
        const b = 7;
        
        console.log(`Calling /demo/add with a=${a}, b=${b}`);
        
        const response = await axios.post(`${SERVER_URL}/demo/add`, {
            a,
            b
        });
        
        console.log(`Result: ${response.data.result}`);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error calling API:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

async function runAllTests() {
    console.log('=== Running Demo Tests ===\n');
    await testAddEndpoint();
    console.log('\n');
}

runAllTests();
