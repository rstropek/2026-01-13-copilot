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

async function testConfigurationEndpoints() {
    console.log('=== Machine Configuration Test Scenario ===\n');

    try {
        // 1. List all machines
        console.log('1. Listing all available machines...');
        const machinesResponse = await axios.get(`${SERVER_URL}/configure/machines`);
        console.log('Machines:', JSON.stringify(machinesResponse.data, null, 2));
        console.log();

        // 2. Get settings for molder_1
        console.log('2. Getting settings definition for molder_1...');
        const settingsResponse = await axios.get(`${SERVER_URL}/configure/machines/molder_1/settings`);
        console.log('Settings for molder_1:');
        console.log(JSON.stringify(settingsResponse.data, null, 2));
        console.log();

        // 3. Apply INVALID settings (missing required field and value out of range)
        console.log('3. Applying INVALID settings to molder_1...');
        console.log('   - Missing required field "guardsClosedRequired"');
        console.log('   - Invalid value for "screwSpeed" (negative number)');
        try {
            await axios.post(`${SERVER_URL}/configure/machines/molder_1/settings`, {
                settings: [
                    {
                        identifier: "materialName",
                        value: "ABS"
                    },
                    {
                        identifier: "screwSpeed",
                        value: -50, // Invalid: negative value
                        uom: "rpm"
                    },
                    {
                        identifier: "barrelTemperature",
                        value: 250,
                        uom: "°C"
                    }
                    // Missing required field: guardsClosedRequired
                ]
            });
            console.log('   ✗ ERROR: Invalid settings were accepted (should have failed!)');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.log('   ✓ Validation failed as expected:');
                console.log('   ', JSON.stringify(error.response.data, null, 2));
            }
        }
        console.log();

        // 4. Apply VALID settings
        console.log('4. Applying VALID settings to molder_1...');
        const validSettings = {
            settings: [
                {
                    identifier: "materialName",
                    value: "ABS"
                },
                {
                    identifier: "guardsClosedRequired",
                    value: true
                },
                {
                    identifier: "barrelTemperature",
                    value: 250,
                    uom: "°C"
                },
                {
                    identifier: "moldTemperature",
                    value: 70,
                    uom: "°C"
                },
                {
                    identifier: "injectionPressure",
                    value: 1400,
                    uom: "bar"
                },
                {
                    identifier: "screwSpeed",
                    value: 100,
                    uom: "rpm"
                },
                {
                    identifier: "coolingTime",
                    value: 15,
                    uom: "s"
                }
            ]
        };
        console.log('   Settings to apply:', JSON.stringify(validSettings, null, 2));
        const applyResponse = await axios.post(`${SERVER_URL}/configure/machines/molder_1/settings`, validSettings);
        console.log('   ✓ Success:', applyResponse.data.message);
        console.log();

        // 5. Test with unit conversion (Fahrenheit instead of Celsius)
        console.log('5. Applying settings with unit conversion (°F to °C)...');
        const settingsWithConversion = {
            settings: [
                {
                    identifier: "materialName",
                    value: "PP"
                },
                {
                    identifier: "guardsClosedRequired",
                    value: true
                },
                {
                    identifier: "barrelTemperature",
                    value: 482, // 482°F = 250°C
                    uom: "°F"
                },
                {
                    identifier: "moldTemperature",
                    value: 158, // 158°F = 70°C
                    uom: "°F"
                },
                {
                    identifier: "injectionPressure",
                    value: 20305, // 20305 PSI ≈ 1400 bar
                    uom: "psi"
                },
                {
                    identifier: "screwSpeed",
                    value: 1.67, // 1.67 RPS ≈ 100 RPM
                    uom: "rps"
                },
                {
                    identifier: "coolingTime",
                    value: undefined // nullable field
                }
            ]
        };
        console.log('   Settings with unit conversion:', JSON.stringify(settingsWithConversion, null, 2));
        const conversionResponse = await axios.post(`${SERVER_URL}/configure/machines/molder_1/settings`, settingsWithConversion);
        console.log('   ✓ Success:', conversionResponse.data.message);
        console.log();

        console.log('=== All tests completed successfully! ===');

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('✗ Error calling API:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        } else {
            console.error('✗ Unexpected error:', error);
        }
    }
}

async function runAllTests() {
    console.log('=== Running Demo Tests ===\n');
    await testAddEndpoint();
    console.log('\n');
    
    await testConfigurationEndpoints();
}

runAllTests();
