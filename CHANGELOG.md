# 更新日志

本 mod 的主要改动记录在这里，上游项目的改动见 [AdGuard Home 更新日志][upstream]。

[upstream]: https://github.com/AdguardTeam/AdGuardHome/blob/master/CHANGELOG.md

## 未发布

### 新增

- `doc/AdGuardHome.yaml.example`：按本 mod 删减后的结构生成的配置参考模板，逐段说明哪些功能保留、哪些属于已删除功能。它只是参考，安装并不需要。

### 变更

- 配置迁移不再写入已删除功能的键：`internal/configmigrate` 的 v4、v18、v19、v21、v22、v26 不再生成或搬运 `use_global_blocked_services`、`safe_search`、`safesearch_cache_size`、`blocked_services`，而是把它们从老配置里删掉。迁移链路本身不变，老配置照旧能升到 schema 34。
- 同步更新迁移的测试数据与单测期望值，并修正 `internal/filtering/reason.go`、`internal/home/clients.go`、`internal/querylog/` 的 `gofmt` 对齐。
- 在线更新改用自己的更新源：新增仓库根目录的 `version.json`，`updater.DefaultVersionURL()` 指向它，发版工作流每次发版自动把它改成新版本号、发布页地址与 arm64 压缩包地址。arm64 构建默认检查更新（`--no-check-update` 可关，本地测试用的 amd64 不检查，因为不发这个包）；`--update` 也随之指向自己的版本，不会再把自己换成官方版。
- 版本号支持预发布后缀：`v2026-09-25-beta`、`v2026-09-25-rc.1` 这类 tag 会被原样用作版本号，并按 GitHub 预发布发布，不抢占「最新版本」。
- 发版只提供 arm64：Release 里放 `AdGuardHome_linux_arm64.tar.gz` 与配套的 `checksums.txt`；amd64 只上传到 Actions 产物 `AdGuardHome-linux`，供本地测试。

### 移除

- 「DHCP」功能整体删除，不再只是删界面：
  - 后端：`internal/dhcpd/**`（DHCPv4/v6 服务器、租约库、静态租约、RA，约 4200 行）、它依赖的 `internal/dhcpsvc/**`，以及 `internal/aghnet` 里只服务于 DHCP 的探测代码。
  - 接口：`/control/dhcp/status|interfaces|set_config|find_active_dhcp|add_static_lease|remove_static_lease|update_static_lease|reset|reset_leases` 九个接口，以及 `openapi/openapi.yaml`、`AGHTechDoc.md` 里对应的描述。
  - 配置：`dhcp` 配置段、`/control/status` 的 `dhcp_available`、`clients.runtime_sources.dhcp`。老配置里残留的这些键会被忽略，不影响启动。
  - 客户端与 DNS：不再按 DHCP 租约识别客户端（包括按 MAC 反查 IP），也不再从租约解析本地主机名与 PTR。
  - 依赖：`go.mod` 里删掉 `insomniacslk/dhcp`、`google/gopacket`、`gopacket/gopacket`、`go-ping/ping`、`mdlayher/ethernet`、`mdlayher/packet` 六个直接依赖。

## v2026-09-24

### 移除

- 「加密设置」选项卡及其功能：页面、路由、状态管理与 HTTP 调用。
- 查询日志筛选里的「已阻止的服务」「拦截的威胁」「被家长控制阻止」「安全搜索」。
- 首页的被拦截的恶意/钓鱼网站、被拦截的成人网站、强制安全搜索三个卡片，以及客户端排行。
- 「安全搜索」功能本身：前端代码、各搜索引擎规则文件、HTTP API。
- 「已阻止的服务」功能本身：服务清单、服务图标接口，以及客户端与统计里的相关字段。
- 查询日志「放行 / 拦截」按钮旁的「仅对此客户端拦截」「仅解除对此客户端的拦截」「不允许这个客户端」「添加为持久客户端」。
- 随上述功能一起失效的语言键。

### 变更

- 发布说明改为中文优先。
- 语言只保留 English、简体中文、繁體中文。

## v2026-09-23

本 mod 的首个版本。

### 变更

- 常规设置只保留日志配置与统计配置。
- DNS 设置删除「访问设置」，「拦截模式」只保留默认选项。
- 删除「已阻止的服务」「设置指导」「DHCP」选项卡及其页面，以及页面背后的前端代码。
- 首页不再显示被拦截的威胁、被拦截的成人网站、安全搜索与客户端排行。
- 页脚删除主页、隐私政策、问题反馈链接。
- 版本号改为日期格式，例如 `v2026-09-23`。
- 关闭在线更新检查，因为 AdGuard 的更新服务器只提供官方构建。

### 移除

- 除 Linux 以外其它操作系统的代码与构建配置。
- Snapcraft 与 Docker 构建及其脚本。
- 新版前端，以及未完成的 next API。
