# Change Log

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
