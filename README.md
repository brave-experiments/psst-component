# psst-component-test-typescript

A TypeScript project for experimenting with component-based architecture and bundling using Webpack. Each supported website gets its own privacy "user" and "policy" scripts, which are bundled independently for injection.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Project Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd psst-component-test-typescript
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

## Building the Project

To type-check and compile the TypeScript source files:

```bash
npm run build
```

This uses `tsc` with `tsconfig.json` and emits compiled output (plus declaration files) to `out/`. Only `src/` is compiled — tests are excluded from the build.

## Generating Bundles

To generate bundled JavaScript files using Webpack:

```bash
npm run bundle        # development build (alias for bundle:dev)
npm run bundle:dev    # development build — logging enabled
npm run bundle:prod   # production build — minified, logging stripped
```

The mode is passed to Webpack via `--mode` and controls both minification and the `__DEV__` flag used for logging (see [Logging](#logging)).

Bundling is driven by `webpack.config.js`, which **auto-discovers every website** under `src/` and emits one bundle per script:

```
out/scripts/<website>/<script>.js
```

For example, the `twitter` website produces:

```
out/scripts/twitter/user.js
out/scripts/twitter/policy.js
```

Every top-level `*.ts` file in a website folder becomes its own bundle entry. The shared `src/common/` folder is not a website and is only included where it is imported.

## Logging

The project ships a small development-only logger at `src/common/logger.ts`. Logging is **active in development builds and completely removed from production builds** — neither the `console` calls nor the messages passed to them end up in the production bundle.

This is driven by `__DEV__`, a compile-time constant injected by Webpack's `DefinePlugin`:

- `npm run bundle:dev` → `__DEV__` is `true`, logging runs.
- `npm run bundle:prod` → `__DEV__` is `false`; the minifier eliminates the dead branches, so nothing about logging ships.

### Usage

Import the logger and **always guard the call site with `if (__DEV__)`**:

```ts
import { logger } from "../common/logger";

if (__DEV__) logger.debug('applying task', task);
if (__DEV__) logger.error('Failed to save PsstData to localStorage:', error);
```

Available methods: `logger.log`, `logger.info`, `logger.warn`, `logger.error`, `logger.debug`. Messages are automatically prefixed with `[psst]`.

> Why the `if (__DEV__)` guard? Without it, the call survives in production as a no-op, but its *arguments* (message strings, any computed values) are still compiled in and evaluated at runtime. Wrapping the call lets the minifier delete the entire statement — arguments included.

`__DEV__` is declared as a global in `src/common/declarations.ts` (so TypeScript accepts it) and defined as `true` for the test suite in `vitest.config.ts`, so logging is active while tests run.

## Running Tests

Tests run with [Vitest](https://vitest.dev/) in a `jsdom` environment (configured in `vitest.config.ts`):

```bash
npm test
```

Test files live under `tests/` and are matched by `tests/**/*.test.ts`. They are excluded from `npm run build` and `npm run bundle`, so they never end up in `out/`.

## Scripts

- `npm run build` — Type-check and compile TypeScript (`src/` only) to `out/`
- `npm run bundle` — Bundle each website's scripts with Webpack to `out/scripts/<website>/` (development)
- `npm run bundle:dev` — Development bundle (logging enabled)
- `npm run bundle:prod` — Production bundle (minified, logging stripped)
- `npm test` — Run the Vitest test suite

## Project Structure

```
psst-component-test-typescript/
├── src/
│   ├── common/        # Shared base definitions/interfaces (not a website)
│   └── twitter/       # A concrete website implementation
│       ├── user.ts
│       └── policy.ts
├── tests/
│   └── twitter/       # Tests for each supported website
├── package.json
├── tsconfig.json      # Build config (compiles src/ only)
├── tsconfig.test.json # Type-checking config that also covers tests/
├── vitest.config.ts   # Test runner config (jsdom environment)
├── webpack.config.js  # Auto-discovers websites and bundles per script
└── ...
```

`common` contains the base definitions shared by every website implementation, such as the `UserScriptInterface` and `PolicyScriptBase` abstractions, plus shared utilities.

Each supported website lives in its own folder (e.g. `twitter`). A website provides:

- a **user** script implementing `UserScriptInterface` (extracts the user id and exposes the list of privacy tasks), and
- a **policy** script extending `PolicyScriptBase` (applies the privacy settings).

Each website manages its own privacy settings because they differ per site.

`tests` contains tests for each supported website, mirroring the `src/<website>/` layout.

## Adding a New Website

No build or bundle configuration changes are required:

1. Create a new folder under `src/`, e.g. `src/<website>/`.
2. Add the website's scripts (e.g. `user.ts` implementing `UserScriptInterface`, and `policy.ts` extending `PolicyScriptBase`).
3. (Optional) Add tests under `tests/<website>/`.

Running `npm run bundle` will automatically produce `out/scripts/<website>/` with one `*.js` file per script in the folder.

> Note: any non-website helper folders added under `src/` should be listed in `NON_WEBSITE_DIRS` in `webpack.config.js` so they are not treated as a bundle target (the shared `common` folder is already excluded).

## Notes

- Edit `webpack.config.js` to customize the bundling process.
- Edit `tsconfig.json` to change TypeScript compiler options.

## License

MIT
