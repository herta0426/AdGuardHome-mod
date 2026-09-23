# AdGuard Home Mod

[简体中文](README.zh-CN.md)

A trimmed-down build of [AdGuard Home] with a simplified admin UI and
ready-to-use Linux builds.

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

Both frontends are updated: the classic one (`client/`, the UI the released
upstream builds ship) and the next-generation one (`client_v2/`).

Everything else — the DNS server, filtering rules and lists, the query log,
client management, encryption, and the REST API — is the same as upstream.

## Prebuilt archives

`.github/workflows/build-linux.yml` builds two sets of archives:

- `AdGuardHome_linux_amd64.tar.gz` — x86_64
- `AdGuardHome_linux_arm64.tar.gz` — arm64

plus the `checksums.txt` file with their SHA-256 hashes.  To get them, either
run the **Build Linux binaries** workflow from the Actions tab and download
the `AdGuardHome-linux` artifact, or push a `v*` tag to publish a release
with the same files attached.

## Build from source

Requirements: Go 1.26.8 or later and Node.js 24.

```sh
make js-deps          # npm ci; add CLIENT_DIR=client_v2 for the new UI
make js-build         # bundle the frontend into build/static
make go-build         # build the ./AdGuardHome binary
```

`make quick-build` runs the frontend and the Go build in one go.  To produce
the archives locally:

```sh
make build-release SIGN=0 OS=linux ARCH="amd64 arm64"
make pack-release SIGN=0
```

The result is written into `dist/`.

## Documentation

- [Upstream wiki](https://github.com/AdguardTeam/AdGuardHome/wiki)
- [Upstream releases](https://github.com/AdguardTeam/AdGuardHome/releases)
- [Upstream API description](https://github.com/AdguardTeam/AdGuardHome/tree/master/openapi)

## License

AdGuard Home Mod is distributed under the GNU General Public License v3.0, see
[LICENSE.txt](LICENSE.txt).  It is based on AdGuard Home, © AdGuard Software
Ltd.
