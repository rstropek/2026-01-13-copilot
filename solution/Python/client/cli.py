"""Command-line client for testing the Configurizer API."""
import asyncio
import json
from typing import Any, Optional
import httpx


SERVER_URL = "http://localhost:3000"


async def test_add_endpoint():
    """Test the /demo/add endpoint."""
    try:
        a = 5
        b = 7
        
        print(f"Calling /demo/add with a={a}, b={b}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SERVER_URL}/demo/add",
                json={"a": a, "b": b}
            )
            response.raise_for_status()
            data = response.json()
            
            print(f"Result: {data['result']}")
    except httpx.HTTPError as e:
        print(f"Error calling API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response data: {e.response.text}")
    except Exception as e:
        print(f"Unexpected error: {e}")


async def test_configuration_endpoints():
    """Test the configuration endpoints."""
    print("=== Machine Configuration Test Scenario ===\n")
    
    try:
        async with httpx.AsyncClient() as client:
            # 1. List all machines
            print("1. Listing all available machines...")
            response = await client.get(f"{SERVER_URL}/configure/machines")
            response.raise_for_status()
            print(f"Machines: {json.dumps(response.json(), indent=2)}")
            print()
            
            # 2. Get settings for molder_1
            print("2. Getting settings definition for molder_1...")
            response = await client.get(f"{SERVER_URL}/configure/machines/molder_1/settings")
            response.raise_for_status()
            print("Settings for molder_1:")
            print(json.dumps(response.json(), indent=2))
            print()
            
            # 3. Apply INVALID settings
            print("3. Applying INVALID settings to molder_1...")
            print("   - Missing required field \"guardsClosedRequired\"")
            print("   - Invalid value for \"screwSpeed\" (negative number)")
            try:
                response = await client.post(
                    f"{SERVER_URL}/configure/machines/molder_1/settings",
                    json={
                        "settings": [
                            {
                                "identifier": "materialName",
                                "value": "ABS"
                            },
                            {
                                "identifier": "screwSpeed",
                                "value": -50,
                                "uom": "rpm"
                            },
                            {
                                "identifier": "barrelTemperature",
                                "value": 250,
                                "uom": "°C"
                            }
                        ]
                    }
                )
                response.raise_for_status()
                print("   ✗ ERROR: Invalid settings were accepted (should have failed!)")
            except httpx.HTTPStatusError as e:
                print("   ✓ Validation failed as expected:")
                print(f"   {json.dumps(e.response.json(), indent=2)}")
            print()
            
            # 4. Apply VALID settings
            print("4. Applying VALID settings to molder_1...")
            valid_settings = {
                "settings": [
                    {
                        "identifier": "materialName",
                        "value": "ABS"
                    },
                    {
                        "identifier": "guardsClosedRequired",
                        "value": True
                    },
                    {
                        "identifier": "barrelTemperature",
                        "value": 250,
                        "uom": "°C"
                    },
                    {
                        "identifier": "moldTemperature",
                        "value": 70,
                        "uom": "°C"
                    },
                    {
                        "identifier": "injectionPressure",
                        "value": 1400,
                        "uom": "bar"
                    },
                    {
                        "identifier": "screwSpeed",
                        "value": 100,
                        "uom": "rpm"
                    },
                    {
                        "identifier": "coolingTime",
                        "value": 15,
                        "uom": "s"
                    }
                ]
            }
            print(f"   Settings to apply: {json.dumps(valid_settings, indent=2)}")
            response = await client.post(
                f"{SERVER_URL}/configure/machines/molder_1/settings",
                json=valid_settings
            )
            response.raise_for_status()
            print(f"   ✓ Success: {response.json()['message']}")
            print()
            
            # 5. Test with unit conversion
            print("5. Applying settings with unit conversion (°F to °C)...")
            settings_with_conversion = {
                "settings": [
                    {
                        "identifier": "materialName",
                        "value": "PP"
                    },
                    {
                        "identifier": "guardsClosedRequired",
                        "value": True
                    },
                    {
                        "identifier": "barrelTemperature",
                        "value": 482,
                        "uom": "°F"
                    },
                    {
                        "identifier": "moldTemperature",
                        "value": 158,
                        "uom": "°F"
                    },
                    {
                        "identifier": "injectionPressure",
                        "value": 20305,
                        "uom": "psi"
                    },
                    {
                        "identifier": "screwSpeed",
                        "value": 1.67,
                        "uom": "rps"
                    },
                    {
                        "identifier": "coolingTime",
                        "value": None
                    }
                ]
            }
            print(f"   Settings with unit conversion: {json.dumps(settings_with_conversion, indent=2)}")
            response = await client.post(
                f"{SERVER_URL}/configure/machines/molder_1/settings",
                json=settings_with_conversion
            )
            response.raise_for_status()
            print(f"   ✓ Success: {response.json()['message']}")
            print()
            
            print("=== All tests completed successfully! ===")
            
    except httpx.HTTPError as e:
        print(f"✗ Error calling API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response data: {e.response.text}")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")


async def run_all_tests():
    """Run all tests."""
    print("=== Running Demo Tests ===\n")
    await test_add_endpoint()
    print("\n")
    
    await test_configuration_endpoints()


def main():
    """Main entry point for the client."""
    asyncio.run(run_all_tests())


if __name__ == "__main__":
    main()
