# @jscrypto/speck
[![CI](https://github.com/emn178/jscrypto-speck/actions/workflows/ci.yml/badge.svg)](https://github.com/emn178/jscrypto-speck/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/emn178/jscrypto-speck/badge.svg?branch=main)](https://coveralls.io/r/emn178/jscrypto-speck?branch=main)
[![NPM](https://nodei.co/npm/@jscrypto/speck.png?style=flat&data=n,v,d&color=brightgreen)](https://www.npmjs.com/package/@jscrypto/speck)

SPECK block cipher components for [`@jscrypto/core`](https://www.npmjs.com/package/@jscrypto/core).

This package is an adapter. It depends on [`js-speck`](https://www.npmjs.com/package/js-speck) for the SPECK algorithm and registers each SPECK variant as a fixed-size `@jscrypto` block cipher component.

SPECK is a niche/legacy/lightweight block cipher family. Do not treat it as a default recommendation for new encryption designs.

The raw SPECK component has no mode, padding, IV, KDF, salt, or authentication by itself. If a protocol specifically requires modes or paddings, compose them from [`@jscrypto/classic`](https://www.npmjs.com/package/@jscrypto/classic). Modes can be composed only when their structural requirements are met; for example, GCM requires a 128-bit block cipher, so only SPECK128 variants are structurally compatible.

## Install

```sh
npm install @jscrypto/speck
```

Optional modes and paddings:

```sh
npm install @jscrypto/classic
```

## Quick Start

```ts
import { registry } from '@jscrypto/classic';
import { speckPreset } from '@jscrypto/speck';

registry.use(speckPreset);

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

Browser builds are split by package. Load `@jscrypto/core` and `@jscrypto/classic` when you need a registry with modes or paddings, then register the SPECK preset from `@jscrypto/speck`.

```html
<script src="jscrypto-core.iife.min.js"></script>
<script src="jscrypto-classic.iife.min.js"></script>
<script src="jscrypto-speck.iife.min.js"></script>
<script>
  jscryptoClassic.registry.use(jscryptoSpeck.speckPreset);
</script>
```

Package export paths:

- `@jscrypto/speck/browser`
- `@jscrypto/speck/umd`

UMD/AMD builds expose SPECK components and do not re-export `@jscrypto/core`. Load `@jscrypto/core` or `@jscrypto/classic` separately when you need a registry.

CommonJS users can require the regular UMD `.js` builds because this package uses explicit `.mjs` and `.cjs` entry files instead of package-level `"type": "module"`.

## License

MIT
