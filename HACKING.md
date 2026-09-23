# Hacking on AdGuard Home Mod

## Requirements

- Go 1.26.8 or later;
- Node.js 24;
- a POSIX shell for the scripts in `scripts/make/`.

Only Linux is supported: the code for the other operating systems is not part
of this repository, and `make go-os-check` vets `linux/amd64` and
`linux/arm64` only.

## Build

```sh
make quick-build      # frontend, then backend
make js-build         # frontend only, the output goes to build/static
make go-build         # backend only, the output is ./AdGuardHome
```

The frontend is embedded into the binary, so build it before the backend when
you change it.

## Checks

```sh
make js-lint js-typecheck js-test
make go-os-check go-lint go-test
```

The `Lint and test` job of `.github/workflows/build-linux.yml` runs the same
checks, plus `go test ./...`.

## Releases

```sh
make build-release SIGN=0
make pack-release SIGN=0
```

After that, `dist/` contains the `linux/amd64` and `linux/arm64` archives and
their checksums.  Versions are dates, see `scripts/make/version.sh`; pushing a
tag such as `v2026-09-23` makes the workflow publish a release.
