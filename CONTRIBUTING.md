# Contributing

Thanks for taking the time to improve this mod.

## Before you start

- This repository is an **unofficial mod** of AdGuard Home.  Problems that
  come from upstream — filtering rules misfiring, the DNS core, the upstream
  API — belong to [AdguardTeam/AdGuardHome][upstream], not here.
- Bug reports are welcome.  Please tell us which build you use
  (`./AdGuardHome --version`), what you expected, and what happened.  Logs
  from the query log page help a lot.
- Keep pull requests focused.  If a change touches the UI, update both
  frontends (`client/` and `client_v2/`) so that they stay in sync.

[upstream]: https://github.com/AdguardTeam/AdGuardHome

## Checks before opening a pull request

The commands below run from the repository root:

```sh
make js-lint CLIENT_DIR=client
make js-typecheck CLIENT_DIR=client
make js-test CLIENT_DIR=client
make go-test
```

Add `CLIENT_DIR=client_v2` to check the next-generation UI instead.  The
**Build Linux binaries** workflow also runs on every push to `master`, so the
Actions tab shows whether the project still builds.

## 中文说明

- 本仓库是 AdGuard Home 的非官方 Mod。属于上游的问题（过滤规则误杀、DNS
  内核、上游 API）请到 [AdguardTeam/AdGuardHome][upstream] 反馈。
- 欢迎提 Issue 和 PR。请附上版本号（`./AdGuardHome --version`）、复现步骤，
  以及在查询日志里看到的相关记录。
- 改界面时请尽量同时修改 `client/` 与 `client_v2/` 两套前端。
- 提交 PR 前请运行上面列出的检查命令，并把 `CLIENT_DIR` 换成要检查的前端。
