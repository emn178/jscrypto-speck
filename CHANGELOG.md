# Change Log

## v0.4.0 / 2026-08-04
### Changed
- adapt SPECK `BlockCipher` to `@jscrypto/core` v0.8.0 raw buffer API (`encrypt` / `decrypt` with caller-owned output, plus offset-based `encryptBlock` / `decryptBlock`).
- require `@jscrypto/core` `>=0.8.0 <1`.

## v0.3.0 / 2026-07-29
### Fixed
- brace-expansion audit issue

### Changed
- upgrade jscrypto/core dependencies version.
- README npm and cdn badge.

## v0.2.0 / 2026-07-24
### Changed
- simplify browser package exports to `./browser` and `./umd` only.
- remove standalone browser bundles so browser integrations share `@jscrypto/core` through `@jscrypto/core` or `@jscrypto/classic` instead of bundling another core copy.
- remove the `createRegistry` re-export; use `@jscrypto/core` or `@jscrypto/classic` for registry creation.
- document `speckPreset` as the single way to register every SPECK component into a registry.
- update CI so Node 24 builds and packs the npm artifact, while Node 18/20/22/24 test the packaged `dist`.

## v0.1.0 / 2026-07-23
### Added
- created `@jscrypto/speck` adapter package for SPECK block cipher variants.
- re-export `createRegistry` from `@jscrypto/core` so standalone browser builds actually include core and support registry setup.
