# @jscrypto/speck
[![CI](https://github.com/emn178/jscrypto-speck/actions/workflows/ci.yml/badge.svg)](https://github.com/emn178/jscrypto-speck/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/emn178/jscrypto-speck/badge.svg?branch=main)](https://coveralls.io/r/emn178/jscrypto-speck?branch=main)

SPECK block cipher components for [`@jscrypto/core`](https://www.npmjs.com/package/@jscrypto/core).

This package is an adapter. It depends on [`js-speck`](https://www.npmjs.com/package/js-speck) for the SPECK algorithm and registers each SPECK variant as a fixed-size `@jscrypto` block cipher component.

SPECK is a niche/legacy/lightweight block cipher family. Do not treat it as a default recommendation for new encryption designs.

The raw SPECK component has no mode, padding, IV, KDF, salt, or authentication by itself. If a protocol specifically requires modes or paddings, compose them from [`@jscrypto/classic`](https://www.npmjs.com/package/@jscrypto/classic). Modes can be composed only when their structural requirements are met; for example, GCM requires a 128-bit block cipher, so only SPECK128 variants are structurally compatible.

## Install

```sh
npm install @jscrypto/core @jscrypto/speck
```

Optional modes and paddings:

```sh
npm install @jscrypto/classic
```

## Quick Start

```ts
import { createRegistry } from '@jscrypto/core';
import { ecb, noPadding } from '@jscrypto/classic';
import { speck64_128 } from '@jscrypto/speck';

const registry = createRegistry()
  .use(speck64_128)
  .use(ecb)
  .use(noPadding);

const cipher = registry.createCipher({
  cipher: 'SPECK64/128',
  mode: 'ECB',
  padding: 'NoPadding',
  key,
});

const ciphertext = cipher.encrypt(plaintext);
```

Register every SPECK variant at once:

```ts
import { createRegistry } from '@jscrypto/core';
import { speckPreset } from '@jscrypto/speck';

const registry = createRegistry().use(speckPreset);
```

Or register every SPECK cipher into an existing registry:

```ts
import { createClassicRegistry } from '@jscrypto/classic';
import { registerSpeck } from '@jscrypto/speck';

const registry = registerSpeck(createClassicRegistry());

const cipher = registry.createCipher({
  cipher: 'SPECK64/128',
  mode: 'CBC',
  padding: 'Pkcs7',
  key,
  iv,
});
```

## Direct Helper

```ts
import { createSpeckCipher } from '@jscrypto/speck';

const cipher = createSpeckCipher('64-128', key);
const block = cipher.encryptBlock(plaintextBlock);
```

There is no default variant. Always pass an explicit helper name such as `64-128`.

## Variants

| Helper   | Registry name   | Block | Key  |
|----------|-----------------|-------|------|
| `32-64`  | `SPECK32/64`    | 4     | 8    |
| `48-72`  | `SPECK48/72`    | 6     | 9    |
| `48-96`  | `SPECK48/96`    | 6     | 12   |
| `64-96`  | `SPECK64/96`    | 8     | 12   |
| `64-128` | `SPECK64/128`   | 8     | 16   |
| `96-96`  | `SPECK96/96`    | 12    | 12   |
| `96-144` | `SPECK96/144`   | 12    | 18   |
| `128-128`| `SPECK128/128`  | 16    | 16   |
| `128-192`| `SPECK128/192`  | 16    | 24   |
| `128-256`| `SPECK128/256`  | 16    | 32   |

Key length alone is not enough to choose a variant. For example, 12-byte keys are shared by Speck48/96, Speck64/96, and Speck96/96.

## Browser

This package re-exports `createRegistry` from `@jscrypto/core`, so registry setup works from the speck global. Modes and paddings still come from `@jscrypto/classic` when you need them.

Default builds share `jscryptoCore` and expose `jscryptoSpeck`:

```html
<script src="jscrypto-core.iife.min.js"></script>
<script src="jscrypto-speck.iife.min.js"></script>
<script>
  const registry = jscryptoSpeck.createRegistry().use(jscryptoSpeck.speck64_128);
</script>
```

Standalone builds bundle `@jscrypto/core`, so `createRegistry` is available without a separate core script:

```html
<script src="jscrypto-speck.standalone.iife.min.js"></script>
<script>
  const registry = jscryptoSpeck.createRegistry().use(jscryptoSpeck.speck64_128);
</script>
```

Package export paths:

- `@jscrypto/speck/browser`
- `@jscrypto/speck/browser-standalone`
- `@jscrypto/speck/umd`
- `@jscrypto/speck/umd-standalone`

Default UMD/AMD builds declare an `@jscrypto/core` dependency. Map that module id to `@jscrypto/core`'s UMD build in your loader config. Standalone UMD only declares the standard AMD `exports` dependency and bundles core itself. Script-tag usage of the default IIFE/UMD still expects a global `jscryptoCore`.

CommonJS users can require the regular UMD `.js` builds because this package uses explicit `.mjs` and `.cjs` entry files instead of package-level `"type": "module"`.

## License

MIT
