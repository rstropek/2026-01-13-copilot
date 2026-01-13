# Configurizer - TypeScript Monorepo

## Workspace structure

This project is a TypeScript monorepo using **npm workspaces**. It consists of three packages:

### Packages

```
packages/
├── client/          # HTTP client application
├── server/          # Express server
└── shared/          # Shared logic and types
```

#### 1. **shared** (`packages/shared/`)
- **Purpose**: Shared logic and types used by client and server
- **Main file**: `src/logic.ts`
- **Build output**: `dist/` (TypeScript-compiled code)
- **Exports**:
  - Types: `./dist/logic.d.ts`
  - Import: `./dist/logic.js`

#### 2. **server** (`packages/server/`)
- **Purpose**: Express-based HTTP server
- **Main file**: `src/app.ts`
- **Dependencies**:
  - `express` (^5.0.1)
  - `shared` (local workspace dependency)
- **Build output**: `dist/app.js`
- **Tests**:
  - Jest config: `packages/server/jest.config.js`
  - Example route tests: `src/middleware/demo.test.ts` (uses `supertest` and mocks `shared/add`)

#### 3. **client** (`packages/client/`)
- **Purpose**: HTTP client for communicating with the server
- **Main file**: `src/client.ts`
- **Dependencies**:
  - `axios` (^1.7.9)
- **Build output**: `dist/client.js`

## Important scripts

### Root-level scripts (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `npm run build` | `npm run build --workspaces --if-present` | Builds all workspace packages |
| `npm test` | `npm run test --workspaces --if-present` | Runs tests in all workspaces (where available) |
| `npm run start` | `npm run build && npm run -w packages/server start` | Builds all packages and starts the server |
| `npm run start:client` | `npm run build && npm run -w packages/client start` | Builds all packages and starts the client |

### Package-specific scripts

#### shared/
- `npm run build`: Compiles TypeScript to JavaScript
- `npm test`: Runs Jest tests

#### server/
- `npm run build`: Compiles TypeScript to JavaScript
- `npm start`: Runs the compiled server (`node dist/app.js`)
- `npm test`: Runs Jest tests (ESM)

#### client/
- `npm run build`: Compiles TypeScript to JavaScript
- `npm start`: Runs the compiled client (`node dist/client.js`)

## Development workflow

1. **Initial setup**:

```bash
npm install
```

2. **Build all packages**:

```bash
npm run build
```

3. **Run all tests**:

```bash
npm test
```

4. **Start the server**:

```bash
npm run start
```

5. **Run the client** (in a separate terminal):

```bash
npm run start:client
```

## Technology stack

- **Runtime**: Node.js
- **Language**: TypeScript (^5.9.3)
- **Module system**: ES Modules (`"type": "module"`)
- **Server framework**: Express (^5.0.1)
- **HTTP client**: Axios (^1.7.9)
- **Test framework**: Jest (ESM; server tests use `supertest` and ESM-safe module mocking)
- **Package manager**: npm with workspaces

## Coding Guidelines

- Always use curly braces for code blocks, even for single-line blocks (e.g. `if (condition) { ... }` instead of `if (condition) ...`).
- Never use `var`. Always use `let` or `const`.
- Never use `any`.
