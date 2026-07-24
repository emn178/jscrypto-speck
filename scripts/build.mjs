import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { rollup } from 'rollup';
import ts from 'typescript';

const year = '2026';
const owner = 'Chen, Yi-Cyuan';
const globalName = 'jscryptoSpeck';
const displayName = 'jscrypto-speck';
const packageJsonPath = 'package.json';
const entryPoint = 'src/index.ts';
const distDir = 'dist';
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

await buildEntry({
  external: [corePackageName, 'js-speck'],
  outputs: [
    {
      file: `${distDir}/index.mjs`,
      format: 'esm',
    },
    {
      file: `${distDir}/index.cjs`,
      format: 'cjs',
      exports: 'named',
    },
  ],
});

await buildEntry({
  external: [],
  outputs: [
    {
      file: `${distDir}/${displayName}.iife.js`,
      format: 'iife',
      name: globalName,
    },
    {
      file: `${distDir}/${displayName}.iife.min.js`,
      format: 'iife',
      name: globalName,
      minify: true,
    },
    {
      file: `${distDir}/${displayName}.umd.js`,
      format: 'umd',
      name: globalName,
    },
    {
      file: `${distDir}/${displayName}.umd.min.js`,
      format: 'umd',
      name: globalName,
      minify: true,
    },
  ],
});

/**
 * @param {{
 *   external: string[],
 *   globals?: Record<string, string>,
 *   outputs: Array<{
 *     file: string,
 *     format: 'esm' | 'cjs' | 'iife' | 'umd',
 *     name?: string,
 *     exports?: 'named',
 *     minify?: boolean,
 *   }>,
 * }} options
 */
async function buildEntry(options) {
  const bundle = await rollup({
    input: entryPoint,
    external: options.external,
    plugins: [
      transpileTypeScript(),
      nodeResolve(),
      commonjs(),
    ],
  });

  try {
    for (const output of options.outputs) {
      const plugins = output.minify
        ? [
            terser({
              format: {
                comments: /^!/,
              },
            }),
          ]
        : [];

      await bundle.write({
        banner: licenseBanner,
        file: output.file,
        format: output.format,
        name: output.name,
        exports: output.exports,
        globals: options.globals,
        sourcemap: true,
        plugins,
      });
    }
  } finally {
    await bundle.close();
  }
}

function transpileTypeScript() {
  return {
    name: 'transpile-typescript',
    transform(code, id) {
      if (!id.endsWith('.ts')) {
        return null;
      }

      const result = ts.transpileModule(code, {
        fileName: id,
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          sourceMap: true,
          inlineSources: true,
        },
      });

      return {
        code: result.outputText,
        map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
      };
    },
  };
}
