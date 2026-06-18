const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const SRC_DIR = path.resolve(__dirname, 'src');

// Folders under src/ that are NOT website implementations (shared code, etc.).
// Everything else under src/ is treated as a supported website.
const NON_WEBSITE_DIRS = new Set(['common']);

// Settings shared by every website's build. `mode` comes from the webpack CLI
// (`--mode production` / `--mode development`); it defaults to development.
function makeSharedConfig(mode) {
  const isProduction = mode === 'production';

  return {
    mode,
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            // Bundling only needs JS; declaration files belong to `npm run build`.
            options: {
              compilerOptions: {
                declaration: false,
                declarationMap: false,
              },
            },
          },
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    devtool: false,
    optimization: {
      // Minify in production so the dead `__DEV__` branches are stripped out.
      minimize: isProduction,
      // Keep each module inside its own function wrapper. Production mode would
      // otherwise enable scope hoisting (ModuleConcatenationPlugin), which lifts
      // every module's `const`/`class` (e.g. `noop`, `PolicyScriptBase`) into
      // the top-level scope. Because we emit with `iife: false`, those become
      // bare top-level lexical declarations in the injected script. The target
      // pages are SPAs (x.com) where Brave re-injects the same script into the
      // *same* realm across in-app navigations — a second injection then throws
      // `Identifier 'noop' has already been declared`. Disabling concatenation
      // keeps those declarations function-scoped (like the dev build), leaving
      // only a redeclarable `var __webpack_modules__` at the top level.
      concatenateModules: false,
    },
    plugins: [
      // Replace `__DEV__` with a literal `true`/`false` at build time. In
      // production it becomes `false`, and the minifier removes every guarded
      // logging branch — so no logging code ships.
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProduction),
      }),
    ],
  };
}

/** Discover website folders under src/ (each is a separate bundle target). */
function getWebsites() {
  return fs
    .readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NON_WEBSITE_DIRS.has(entry.name))
    .map((entry) => entry.name);
}

/**
 * Build the webpack `entry` map for a website: every top-level *.ts script
 * (e.g. user.ts, policy.ts) becomes its own entry, keyed by its base name.
 */
function getEntries(website) {
  const websiteDir = path.join(SRC_DIR, website);
  const entries = {};

  for (const file of fs.readdirSync(websiteDir)) {
    if (!file.endsWith('.ts') || file.endsWith('.d.ts')) continue;
    const name = path.basename(file, '.ts');
    // Webpack wants a relative, forward-slashed path.
    entries[name] = './' + path
      .relative(__dirname, path.join(websiteDir, file))
      .split(path.sep)
      .join('/');
  }

  return entries;
}

module.exports = (env, argv) => {
  const mode = argv && argv.mode ? argv.mode : 'development';
  const sharedConfig = makeSharedConfig(mode);

  return getWebsites()
    .map((website) => ({ website, entry: getEntries(website) }))
    // Skip any folder that has no scripts to bundle.
    .filter(({ entry }) => Object.keys(entry).length > 0)
    .map(({ website, entry }) => ({
      name: website,
      ...sharedConfig,
      entry,
      output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'out', 'scripts', `${website}`),
        // These scripts are injected and read by their *completion value* (the
        // value of the last evaluated expression). A trailing IIFE in the
        // source can't provide that: webpack wraps each entry in its own
        // function wrappers that don't propagate `return`. Instead, each entry
        // surfaces its result via `export default`, and we tell webpack to emit
        // that export as the final top-level expression statement:
        //
        //   window["psstResult"] = (function () { ...; return <default>; })();
        //
        // An assignment expression's completion value is the assigned value, so
        // the injector receives the script's result (and it's also reachable as
        // window.psstResult).
        iife: false,
        library: {
          name: 'psstResult',
          type: 'window',
          export: 'default',
        },
      },
    }));
};
