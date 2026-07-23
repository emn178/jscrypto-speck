import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import * as esbuild from 'esbuild';

const year = '2026';
const owner = 'Chen, Yi-Cyuan';
const globalName = 'jscryptoSpeck';
const displayName = 'jscrypto-speck';
const packageJsonPath = 'package.json';
const entryPoint = 'src/index.ts';
const distDir = 'dist';
const coreGlobalName = 'jscryptoCore';
const corePackageName = '@jscrypto/core';

const version = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
const licenseBanner = `/*!
 * @jscrypto/speck v${version}
 * Copyright ${year} ${owner}
 * Released under the MIT license
 */`;

rmSync(distDir, { recursive: true, force: true });
rmSync('tsconfig.tsbuildinfo', { force: true });

execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-b'], {
  stdio: 'inherit',
  shell: false,
});

rmSync(`${distDir}/.tsbuildinfo`, { force: true });
rmSync('tsconfig.tsbuildinfo', { force: true });

const commonOptions = {
  entryPoints: [entryPoint],
  bundle: true,
  sourcemap: true,
  target: 'es2015',
  logLevel: 'info',
};

await esbuild.build({
  ...commonOptions,
  banner: {
    js: licenseBanner,
  },
  format: 'esm',
  external: [corePackageName, 'js-speck'],
  outfile: `${distDir}/index.mjs`,
});

await esbuild.build({
  ...commonOptions,
  banner: {
    js: licenseBanner,
  },
  format: 'cjs',
  platform: 'node',
  external: [corePackageName, 'js-speck'],
  outfile: `${distDir}/index.cjs`,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.iife.js`,
  minify: false,
  standalone: false,
  umd: false,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.iife.min.js`,
  minify: true,
  standalone: false,
  umd: false,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.umd.js`,
  minify: false,
  standalone: false,
  umd: true,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.umd.cjs`,
  minify: false,
  standalone: false,
  umd: true,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.umd.min.js`,
  minify: true,
  standalone: false,
  umd: true,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.standalone.iife.js`,
  minify: false,
  standalone: true,
  umd: false,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.standalone.iife.min.js`,
  minify: true,
  standalone: true,
  umd: false,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.standalone.umd.js`,
  minify: false,
  standalone: true,
  umd: true,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.standalone.umd.cjs`,
  minify: false,
  standalone: true,
  umd: true,
});

await buildBrowser({
  outfile: `${distDir}/${displayName}.standalone.umd.min.js`,
  minify: true,
  standalone: true,
  umd: true,
});

/**
 * @param {{ outfile: string, minify: boolean, standalone: boolean, umd: boolean }} options
 */
async function buildBrowser(options) {
  const external = options.standalone ? [] : [corePackageName];
  const plugins = options.standalone
    ? []
    : [createExternalGlobalsPlugin({ [corePackageName]: coreGlobalName })];

  await esbuild.build({
    ...commonOptions,
    format: 'iife',
    globalName,
    minify: options.minify,
    external,
    plugins,
    banner: {
      js: options.umd
        ? `${licenseBanner}\n${createUmdOpen(options.standalone)}`
        : licenseBanner,
    },
    footer: options.umd
      ? {
          js: createUmdClose(),
        }
      : undefined,
    outfile: options.outfile,
  });
}

/**
 * Wrap the generated IIFE inside a UMD factory so AMD/CJS can inject `@jscrypto/core`.
 * @param {boolean} standalone
 */
function createUmdOpen(standalone) {
  if (standalone) {
    return `;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.${globalName} = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {`;
  }

  return `;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['${coreGlobalName}'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('${corePackageName}'));
  } else {
    root.${globalName} = factory(root.${coreGlobalName});
  }
})(typeof self !== 'undefined' ? self : this, function (${coreGlobalName}) {`;
}

function createUmdClose() {
  return `return ${globalName};
});`;
}

/**
 * @param {Record<string, string>} globals
 */
function createExternalGlobalsPlugin(globals) {
  const names = Object.keys(globals).map(escapeRegExp).join('|');
  const filter = new RegExp(`^(?:${names})$`);

  return {
    name: 'external-globals',
    setup(build) {
      build.onResolve({ filter }, (args) => ({
        path: args.path,
        namespace: 'external-global',
      }));

      build.onLoad({ filter: /.*/, namespace: 'external-global' }, (args) => {
        const globalIdentifier = globals[args.path];
        return {
          contents: `module.exports = ${globalIdentifier};`,
          loader: 'js',
        };
      });
    },
  };
}

/**
 * @param {string} value
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
