# Scripts

## `hooks/`: Git hooks

Run `make init` from the project root to use them.

## `make/`: Build scripts

The scripts are driven by the `Makefile`, so prefer running the `make`
targets.  The main scripts are:

- `version.sh`: print the date-based version, for example `v2026-09-23`;
- `build-release.sh`: build the `linux/amd64` and `linux/arm64` binaries into
  `dist/`;
- `pack-release.sh`: pack `dist/` into archives and write `checksums.txt`;
- `go-deps.sh`, `go-build.sh`, `go-test.sh`, `go-bench.sh`, `go-fuzz.sh`,
  `go-lint.sh`, `go-upd-tools.sh`: backend dependencies, build, tests,
  benchmarks, fuzzing, linters, and the tools they need;
- `calc-checksums.sh`: the checksums used by `pack-release.sh`;
- `md-lint.sh`, `sh-lint.sh`, `txt-lint.sh`: markdown, shell, and text
  linters;
- `helper.sh`: shared helpers for the scripts above.

## `companiesdb/`, `vetted-filters/`

These updaters refresh the data files in `client/src/helpers/` from AdGuard's
registries:

```sh
sh ./scripts/companiesdb/download.sh
go run ./scripts/vetted-filters/main.go
```
