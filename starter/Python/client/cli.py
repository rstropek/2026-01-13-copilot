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

async def run_all_tests():
    """Run all tests."""
    print("=== Running Demo Tests ===\n")
    await test_add_endpoint()
    print("\n")
    

def main():
    """Main entry point for the client."""
    asyncio.run(run_all_tests())


if __name__ == "__main__":
    main()
