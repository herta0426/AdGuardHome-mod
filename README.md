# AdGuard Home Mod

[简体中文](README.zh-CN.md)

A trimmed-down, Linux-only build of [AdGuard Home] with a simplified admin
UI.  The DNS server, filtering, the query log, client management, encryption,
and the REST API are the same as upstream.

> This is an **unofficial mod**.  It is not affiliated with, endorsed by, or
> supported by AdGuard Software Ltd.  Report problems with the mod in this
> repository, and problems with AdGuard Home itself upstream.

[AdGuard Home]: https://github.com/AdguardTeam/AdGuardHome

## What is changed

The admin UI is smaller than upstream:

- General settings keep only the query log and the statistics configuration.
- DNS settings no longer have the access settings, and the blocking mode only
  offers the default option.
- The Blocked services, Setup guide, and DHCP tabs are removed along with
  their pages.
- The dashboard no longer shows blocked threats, blocked adult websites, safe
  search, and top clients.
- The footer no longer links to the homepage, the privacy policy, and the
  issue tracker.

The build is Linux-only:

- Only `linux/amd64` (x86_64) and `linux/arm64` are supported and built.
- The code and the build configuration for the other operating systems, the
  Snapcraft and Docker builds, the next-generation frontend, and the
  unfinished next API are removed.
- Update checks are disabled, because the AdGuard update server only serves
  the official builds.  Setting a custom update URL still works.

Versions are dates, for example `v2026-09-23`.  See `scripts/make/version.sh`.

## Download

The workflow `.github/workflows/build-linux.yml` produces:

- `AdGuardHome_linux_amd64.tar.gz` — x86_64
- `AdGuardHome_linux_arm64.tar.gz` — arm64
- `checksums.txt` — SHA-256 hashes of the archives

Run the workflow from the Actions tab and download the `AdGuardHome-linux`
artifact, or push a tag such as `v2026-09-23` to get a release with the same
files attached.

## Build from source

Requirements: Go 1.26.8 or later and Node.js 24.

```sh
make quick-build
```

The separate steps are:

```sh
make js-deps       # npm ci
make js-build      # bundle the frontend into build/static
make go-build      # build the ./AdGuardHome binary
```

To produce the release archives locally:

```sh
make build-release SIGN=0
make pack-release SIGN=0
```

The result is written into `dist/`.

## Keeping up with upstream

The mod tracks [AdGuard Home][AdGuard Home].  Add the upstream repository
once, and merge its changes into your own branch:

```sh
git remote add upstream https://github.com/AdguardTeam/AdGuardHome.git
git fetch upstream
git merge upstream/master
```

Most of the upstream changes merge cleanly.  The files below are changed on
purpose and are the usual source of conflicts:

| Path | What to keep |
| --- | --- |
| `client/src/components/App/` | the trimmed routes |
| `client/src/components/Dashboard/` | the trimmed cards and tables |
| `client/src/components/Header/Menu.tsx` | the trimmed navigation |
| `client/src/components/Settings/` | the trimmed general and DNS settings |
| `client/src/components/ui/Footer.tsx` | the trimmed footer |
| `.github/`, `Makefile`, `scripts/make/` | the Linux-only build and CI |
| `internal/home/home.go` | the disabled update check |

After merging, run `make quick-build`, then push.  The workflow lints, tests,
and builds both architectures.

## Documentation

- [Upstream wiki](https://github.com/AdguardTeam/AdGuardHome/wiki)
- [Upstream API description](https://github.com/AdguardTeam/AdGuardHome/tree/master/openapi)

## License

GNU General Public License v3.0, see [LICENSE.txt](LICENSE.txt).  Based on
AdGuard Home, © AdGuard Software Ltd.
