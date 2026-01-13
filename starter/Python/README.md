# Configurizer - Python Implementation

This is a Python implementation of the Configurizer application, mirroring the TypeScript version.

## Structure

The project consists of three modules:

```
Python/
├── client/          # HTTP client application (httpx)
├── server/          # FastAPI server
└── shared/          # Shared logic and types
```

### Modules

#### 1. **shared** (`shared/`)
- **Purpose**: Shared logic and types used by client and server
- **Main file**: `shared/logic.py`
- **Exports**:
  - `add()` function
  - Base classes: `ConfigurableMachine`, `Setting`, `SettingValue`, `SettingError`
  - Enums: `SettingType`, `UnitOfMeasure`
  - Machine implementations: `InjectionMolder`

#### 2. **server** (`server/`)
- **Purpose**: FastAPI-based HTTP server
- **Main file**: `server/main.py`
- **Dependencies**:
  - `fastapi` - Web framework
  - `uvicorn` - ASGI server
  - `shared` - Local module dependency
- **Routes**:
  - `/demo/add` - Simple addition endpoint
  - `/configure/machines` - List available machines
  - `/configure/machines/{name}/settings` - Get machine settings
  - `/configure/machines/{name}/settings` - Apply machine settings (POST)

#### 3. **client** (`client/`)
- **Purpose**: HTTP client for communicating with the server
- **Main file**: `client/cli.py`
- **Dependencies**:
  - `httpx` - Async HTTP client

## Installation

The project is configured as a Python package. Install it in development mode:

```bash
cd Python
pip install -e .
```

This will install the package with all dependencies (fastapi, uvicorn, httpx) and make the CLI commands available.

## Usage

### Start the Server

```bash
server
```

The server will start on `http://localhost:3000`.

### Run the Client

In a separate terminal:

```bash
client
```

This will run all test scenarios against the server.

### Run Tests

```bash
cd Python
pytest
```

## API Endpoints

### Demo Endpoints

- **POST /demo/add** - Add two numbers
  - Request: `{"a": 5, "b": 7}`
  - Response: `{"result": 12}`

### Configuration Endpoints

- **GET /configure/machines** - List all available machines
- **GET /configure/machines/{name}/settings** - Get settings definition for a machine
- **POST /configure/machines/{name}/settings** - Apply settings to a machine

## Configuration Files

Machine configurations are stored in the `configurations/` directory:

- `machines.json` - Machine registry
- `molder_1.json` - Settings for molder_1
- `molder_2.json` - Settings for molder_2

## Technology Stack

- **Runtime**: Python 3.11+
- **Web Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **HTTP Client**: httpx
- **Test Framework**: pytest
- **Type Checking**: Type hints with dataclasses

## Features

The implementation includes:

1. **Type Safety**: Uses dataclasses and type hints throughout
2. **Settings Validation**: 
   - Required vs optional fields
   - Type validation (string, number, boolean)
   - Range validation for numeric values
   - Unit of measure conversion (temperature, pressure, speed, time)
3. **Machine Configuration**: 
   - Extensible machine type system
   - JSON-based configuration
   - File-based settings persistence
4. **Comprehensive Tests**: Unit tests for logic and configuration validation

## Differences from TypeScript Version

The Python implementation mirrors the TypeScript version with these adaptations:

1. **Language Features**:
   - Dataclasses instead of TypeScript interfaces
   - Enums using Python's `Enum` class
   - Type hints instead of TypeScript types
   
2. **Framework Choices**:
   - FastAPI instead of Express
   - httpx instead of axios
   - pytest instead of Jest

3. **Code Style**:
   - Snake_case for Python conventions
   - Property decorators for getters
   - Context managers for file operations
   - Async/await for HTTP client operations
