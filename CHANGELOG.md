# Changelog

All notable changes to this mod are documented here.  The changes of the
upstream project are in the [AdGuard Home changelog][upstream].

[upstream]: https://github.com/AdguardTeam/AdGuardHome/blob/master/CHANGELOG.md

## v2026-09-23

The first release of the mod.

### Changed

- General settings keep only the query log and the statistics configuration.
- DNS settings no longer have the access settings, and the blocking mode only
  offers the default option.
- The Blocked services, Setup guide, and DHCP tabs are removed along with
  their pages and the frontend code behind them.
- The dashboard no longer shows blocked threats, blocked adult websites, safe
  search, and top clients.
- The footer no longer links to the homepage, the privacy policy, and the
  issue tracker.
- Versions are now dates, for example `v2026-09-23`.
- Update checks are disabled, because the AdGuard update server only serves
  the official builds.

### Removed

- The code and the build configuration for the operating systems other than
  Linux.
- The Snapcraft and Docker builds, and the scripts behind them.
- The next-generation frontend, and the unfinished next API.
