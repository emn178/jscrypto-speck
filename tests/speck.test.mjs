import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import { createRegistry } from '@jscrypto/core';
import { cbc, ecb, noPadding, pkcs7 } from '@jscrypto/classic';
import {
  allSpeckComponents,
  createSpeckCipher,
  registerSpeck,
  speck64_128,
  speckPreset,
} from '../dist/index.mjs';

const require = createRequire(import.meta.url);

const vectors = [
  {
    variant: '32-64',
    name: 'SPECK32/64',
    key: '0001080910111819',
    plaintext: '4c697465',
    ciphertext: 'f24268a8',
  },
  {
    variant: '48-72',
    name: 'SPECK48/72',
    key: '00010208090a101112',
    plaintext: '72616c6c7920',
    ciphertext: 'dc5a38a549c0',
  },
  {
    variant: '48-96',
    name: 'SPECK48/96',
    key: '00010208090a10111218191a',
    plaintext: '74686973206d',
    ciphertext: '5d44b6105e73',
  },
  {
    variant: '64-96',
    name: 'SPECK64/96',
    key: '0001020308090a0b10111213',
    plaintext: '65616e7320466174',
    ciphertext: '6c947541ec52799f',
  },
  {
    variant: '64-128',
    name: 'SPECK64/128',
    key: '0001020308090a0b1011121318191a1b',
    plaintext: '2d4375747465723b',
    ciphertext: '8b024e4548a56f8c',
  },
  {
    variant: '96-96',
    name: 'SPECK96/96',
    key: '00010203040508090a0b0c0d',
    plaintext: '207468652070696c6c617220',
    ciphertext: '12e785d8e391fa7308a70147',
  },
  {
    variant: '96-144',
    name: 'SPECK96/144',
    key: '00010203040508090a0b0c0d101112131415',
    plaintext: '6f6620647573742074686174',
    ciphertext: 'bcba8e3d3642895817109732',
  },
  {
    variant: '128-128',
    name: 'SPECK128/128',
    key: '000102030405060708090a0b0c0d0e0f',
    plaintext: '206d616465206974206571756976616c',
    ciphertext: '180d575cdffe60786532787951985da6',
  },
  {
    variant: '128-192',
    name: 'SPECK128/192',
    key: '000102030405060708090a0b0c0d0e0f1011121314151617',
    plaintext: '656e7420746f20436869656620486172',
    ciphertext: '86183ce05d18bcf9665513133acfe41b',
  },
  {
    variant: '128-256',
    name: 'SPECK128/256',
    key: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    plaintext: '706f6f6e65722e20496e2074686f7365',
    ciphertext: '438f189c8db4ee4e3ef5c00504010941',
  },
];

function hex(value) {
  return Uint8Array.from(Buffer.from(value, 'hex'));
}

function toHex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

test('createSpeckCipher matches known vectors for every variant', () => {
  for (const vector of vectors) {
    const key = hex(vector.key);
    const plaintext = hex(vector.plaintext);
    const cipher = createSpeckCipher(vector.variant, key);
    const encrypted = cipher.encryptBlock(plaintext);
    const decrypted = cipher.decryptBlock(encrypted);

    assert.equal(cipher.blockSize, plaintext.length);
    assert.equal(toHex(encrypted), vector.ciphertext);
    assert.deepEqual(decrypted, plaintext);
  }
});

test('registry ECB + NoPadding reproduces raw SPECK64/128 block output', () => {
  const vector = vectors.find((item) => item.variant === '64-128');
  const key = hex(vector.key);
  const plaintext = hex(vector.plaintext);
  const registry = createRegistry().use(speck64_128).use(ecb).use(noPadding);
  const cipher = registry.createCipher({
    cipher: 'SPECK64/128',
    mode: 'ECB',
    padding: 'NoPadding',
    key,
  });

  assert.equal(toHex(cipher.encrypt(plaintext)), vector.ciphertext);
  assert.deepEqual(cipher.decrypt(hex(vector.ciphertext)), plaintext);
});

test('registry CBC + Pkcs7 encrypts and decrypts with SPECK64/128', () => {
  const key = hex('0001020308090a0b1011121318191a1b');
  const iv = hex('0001020304050607');
  const plaintext = hex('00112233445566778899aabb');
  const registry = createRegistry().use(speck64_128).use(cbc).use(pkcs7);
  const cipher = registry.createCipher({
    cipher: 'SPECK64/128',
    mode: 'CBC',
    padding: 'Pkcs7',
    key,
    iv,
  });

  const ciphertext = cipher.encrypt(plaintext);
  assert.equal(ciphertext.length % 8, 0);
  assert.deepEqual(cipher.decrypt(ciphertext), plaintext);
});

test('speckPreset registers every SPECK component', () => {
  const registry = createRegistry().use(speckPreset);
  assert.equal(allSpeckComponents.length, 10);
  for (const component of allSpeckComponents) {
    assert.equal(registry.has('cipher', component.name), true);
  }
});

test('registerSpeck registers every SPECK component into an existing registry', () => {
  const registry = createRegistry().use(cbc).use(pkcs7);
  const returned = registerSpeck(registry);

  assert.equal(returned, registry);
  assert.equal(registry.has('mode', 'CBC'), true);
  assert.equal(registry.has('padding', 'Pkcs7'), true);
  for (const component of allSpeckComponents) {
    assert.equal(registry.has('cipher', component.name), true);
  }
});

test('rejects missing, invalid, wrong key, and wrong block inputs', () => {
  const key = hex('0001020308090a0b1011121318191a1b');

  assert.throws(
    () => createSpeckCipher(/** @type {any} */ (undefined), key),
    /SPECK variant is required\./,
  );
  assert.throws(
    () => createSpeckCipher(/** @type {any} */ (null), key),
    /SPECK variant is required\./,
  );
  assert.throws(
    () => createSpeckCipher(/** @type {any} */ ('64/128'), key),
    /Unknown SPECK variant: 64\/128\./,
  );
  assert.throws(
    () => createSpeckCipher('64-128', hex('0001020308090a0b10111213')),
    /SPECK 64-128 key must be 128 bits\./,
  );

  const cipher = createSpeckCipher('64-128', key);
  assert.throws(
    () => cipher.encryptBlock(hex('2d437574746572')),
    /SPECK block must be 64 bits\./,
  );
  assert.throws(
    () => cipher.decryptBlock(hex('8b024e4548a56f8c00')),
    /SPECK block must be 64 bits\./,
  );
});

test('component create validates key length', () => {
  assert.throws(
    () => speck64_128.create(hex('0001020308090a0b10111213')),
    /SPECK 64-128 key must be 128 bits\./,
  );
});

test('CommonJS build can be required', () => {
  const speck = require('../dist/index.cjs');
  assert.equal(typeof speck.createSpeckCipher, 'function');
  assert.equal(typeof speck.registerSpeck, 'function');
  assert.equal(typeof speck.createRegistry, 'function');
  assert.equal(speck.speck64_128.name, 'SPECK64/128');
  assert.equal(speck.speckPreset.name, 'speck');
});

test('UMD CommonJS builds can be required', () => {
  for (const file of [
    '../dist/jscrypto-speck.umd.js',
    '../dist/jscrypto-speck.standalone.umd.js',
  ]) {
    const speck = require(file);
    assert.equal(typeof speck.createSpeckCipher, 'function');
    assert.equal(typeof speck.createRegistry, 'function');
    assert.equal(speck.speck64_128.name, 'SPECK64/128');
    assert.equal(
      speck.createRegistry().use(speck.speck64_128).has('cipher', 'SPECK64/128'),
      true,
    );
  }
});

test('default browser IIFE uses shared jscryptoCore for createRegistry', async () => {
  const context = {};
  vm.createContext(context);

  const coreCode = await readFile(
    new URL('../node_modules/@jscrypto/core/dist/jscrypto-core.iife.js', import.meta.url),
    'utf8',
  );
  vm.runInContext(coreCode, context);

  for (const file of [
    '../dist/jscrypto-speck.iife.js',
    '../dist/jscrypto-speck.iife.min.js',
  ]) {
    const code = await readFile(new URL(file, import.meta.url), 'utf8');
    vm.runInContext(code, context);
    assert.equal(typeof context.jscryptoSpeck.createSpeckCipher, 'function');
    assert.equal(context.jscryptoSpeck.createRegistry, context.jscryptoCore.createRegistry);
    assert.equal(
      context.jscryptoSpeck.createRegistry().use(context.jscryptoSpeck.speck64_128).has('cipher', 'SPECK64/128'),
      true,
    );
  }
});

test('standalone browser IIFE bundles createRegistry without jscryptoCore global', async () => {
  for (const file of [
    '../dist/jscrypto-speck.standalone.iife.js',
    '../dist/jscrypto-speck.standalone.iife.min.js',
  ]) {
    const context = {};
    vm.createContext(context);
    const code = await readFile(new URL(file, import.meta.url), 'utf8');
    vm.runInContext(code, context);

    assert.equal(context.jscryptoCore, undefined);
    assert.equal(typeof context.jscryptoSpeck.createRegistry, 'function');
    assert.equal(
      context.jscryptoSpeck.createRegistry().use(context.jscryptoSpeck.speck64_128).has('cipher', 'SPECK64/128'),
      true,
    );
  }
});

test('default UMD AMD path declares and receives jscryptoCore', async () => {
  const pending = [];
  const amdModules = new Map();
  const context = {
    define(deps, factory) {
      pending.push({ deps, factory });
    },
  };
  context.define.amd = true;
  vm.createContext(context);

  function loadAmd(moduleId, code) {
    pending.length = 0;
    vm.runInContext(code, context);
    assert.equal(pending.length, 1);
    const { deps, factory } = pending[0];
    const exports = {};
    const args = [...deps].map((dep) => {
      if (dep === 'exports') {
        return exports;
      }
      assert.ok(amdModules.has(dep), `missing AMD dependency: ${dep}`);
      return amdModules.get(dep);
    });
    const returned = factory(...args);
    const exported = returned || exports;
    amdModules.set(moduleId, exported);
    return { deps: [...deps], exported };
  }

  const coreCode = await readFile(
    new URL('../node_modules/@jscrypto/core/dist/jscrypto-core.umd.js', import.meta.url),
    'utf8',
  );
  loadAmd('@jscrypto/core', coreCode);
  // Core's legacy UMD still creates a global while registering with AMD.
  // Clear it so speck must receive core through the AMD factory argument.
  delete context.jscryptoCore;

  for (const file of [
    '../dist/jscrypto-speck.umd.js',
    '../dist/jscrypto-speck.umd.min.js',
  ]) {
    const code = await readFile(new URL(file, import.meta.url), 'utf8');
    const { deps, exported } = loadAmd('jscryptoSpeck', code);
    assert.deepEqual(deps, ['exports', '@jscrypto/core']);
    assert.equal(typeof exported.createSpeckCipher, 'function');
    assert.equal(exported.createRegistry, amdModules.get('@jscrypto/core').createRegistry);
    assert.equal(
      exported.createRegistry().use(exported.speck64_128).has('cipher', 'SPECK64/128'),
      true,
    );
    assert.equal(context.jscryptoCore, undefined);
  }
});

test('standalone UMD AMD path has no core dependency', async () => {
  const pending = [];
  const context = {
    define(deps, factory) {
      pending.push({ deps, factory });
    },
  };
  context.define.amd = true;
  vm.createContext(context);

  for (const file of [
    '../dist/jscrypto-speck.standalone.umd.js',
    '../dist/jscrypto-speck.standalone.umd.min.js',
  ]) {
    pending.length = 0;
    const code = await readFile(new URL(file, import.meta.url), 'utf8');
    vm.runInContext(code, context);
    assert.equal(pending.length, 1);
    assert.deepEqual([...pending[0].deps], ['exports']);
    const exported = {};
    const returned = pending[0].factory(exported);
    assert.equal(returned, undefined);
    assert.equal(typeof exported.createSpeckCipher, 'function');
    assert.equal(typeof exported.createRegistry, 'function');
    assert.equal(
      exported.createRegistry().use(exported.speck64_128).has('cipher', 'SPECK64/128'),
      true,
    );
  }
});

test('generated declarations export the public API', async () => {
  const dts = await readFile(new URL('../dist/index.d.ts', import.meta.url), 'utf8');
  assert.match(dts, /export type SpeckVariantName =/);
  assert.match(dts, /export declare const speck64_128:/);
  assert.match(dts, /export declare const speckPreset:/);
  assert.match(dts, /export declare const allSpeckComponents:/);
  assert.match(dts, /export declare function createSpeckCipher/);
  assert.match(dts, /export \{ createRegistry \}/);
});

test('standalone browser bundle is larger than the shared-core default', async () => {
  const defaultSize = (await readFile(new URL('../dist/jscrypto-speck.iife.min.js', import.meta.url))).byteLength;
  const standaloneSize = (await readFile(new URL('../dist/jscrypto-speck.standalone.iife.min.js', import.meta.url))).byteLength;
  assert.ok(standaloneSize > defaultSize);
});
