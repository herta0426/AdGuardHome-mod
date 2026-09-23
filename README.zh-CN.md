# AdGuard Home Mod（中文说明）

[English](README.md)

基于 [AdGuard Home] 的精简版，只支持 Linux，管理界面也做了减法。DNS
服务、过滤规则、查询日志、客户端管理、加密和 REST API 与上游一致。

> 这是**非官方 Mod**，与 AdGuard Software Ltd. 没有隶属关系，也不由官方
> 提供支持。本 Mod 的问题请在本仓库反馈；AdGuard Home 本身的问题请反馈
> 到上游。

[AdGuard Home]: https://github.com/AdguardTeam/AdGuardHome

## 改动内容

界面比上游更精简：

- 常规设置：只保留日志配置与统计配置。
- DNS 设置：删除「访问设置」；「拦截模式」只保留默认选项。
- 删除「已阻止的服务」「设置指导」「DHCP」三个选项卡及其页面。
- 首页仪表盘：不再显示被拦截的恶意/钓鱼网站、被拦截的成人网站、强制
  安全搜索和客户端排行。
- 页脚：删除主页、隐私政策、问题反馈链接。

构建只保留 Linux：

- 只支持并构建 `linux/amd64`(x86_64) 与 `linux/arm64`。
- 删除了其它操作系统的代码与构建配置、Snapcraft 与 Docker 构建、新版
  前端，以及未完成的 next API。
- 关闭了在线更新检查（AdGuard 的更新服务器只提供官方构建）；如果自行
  配置了自定义更新地址，仍然可用。

版本号使用日期，例如 `v2026-09-23`，见 `scripts/make/version.sh`。

## 下载

工作流 `.github/workflows/build-linux.yml` 会产出：

- `AdGuardHome_linux_amd64.tar.gz` — x86_64
- `AdGuardHome_linux_arm64.tar.gz` — arm64
- `checksums.txt` — 以上压缩包的 SHA-256 校验和

在 Actions 页面手动运行并下载 `AdGuardHome-linux` 产物，或推送形如
`v2026-09-23` 的 tag，会自动创建附带这些文件的 Release。

## 从源码构建

需要 Go 1.26.8 或更高版本，以及 Node.js 24。

```sh
make quick-build
```

分开执行是：

```sh
make js-deps       # npm ci
make js-build      # 把前端打包进 build/static
make go-build      # 生成 ./AdGuardHome
```

本地生成发布包：

```sh
make build-release SIGN=0
make pack-release SIGN=0
```

产物位于 `dist/`。

## 如何同步上游

本仓库跟随 [AdGuard Home][AdGuard Home]。先添加上游仓库，然后把上游的
改动合并到自己的分支：

```sh
git remote add upstream https://github.com/AdguardTeam/AdGuardHome.git
git fetch upstream
git merge upstream/master
```

大部分上游改动可以干净合并，下面这些文件是本项目有意改过的，冲突通常
出在这里：

| 路径 | 需要保留的内容 |
| --- | --- |
| `client/src/components/App/` | 精简后的路由 |
| `client/src/components/Dashboard/` | 精简后的卡片与表格 |
| `client/src/components/Header/Menu.tsx` | 精简后的导航 |
| `client/src/components/Settings/` | 精简后的常规设置与 DNS 设置 |
| `client/src/components/ui/Footer.tsx` | 精简后的页脚 |
| `.github/`、`Makefile`、`scripts/make/` | 只保留 Linux 的构建与 CI |
| `internal/home/home.go` | 关闭的更新检查 |

合并完成后运行 `make quick-build` 再推送；CI 会跑 lint、测试并构建两个
架构。

## 相关文档

- [上游 Wiki](https://github.com/AdguardTeam/AdGuardHome/wiki)
- [上游 API 文档](https://github.com/AdguardTeam/AdGuardHome/tree/master/openapi)

## 许可证

GNU General Public License v3.0，见 [LICENSE.txt](LICENSE.txt)。本项目基于
AdGuard Home，© AdGuard Software Ltd.
