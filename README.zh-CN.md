# AdGuard Home Mod（中文说明）

[English](README.md)

基于 [AdGuard Home] 的精简版：管理界面做了减法，并提供开箱可用的 Linux
构建产物。

> 这是**非官方 Mod**，与 AdGuard Software Ltd. 没有隶属关系，也不由官方提供
> 支持。本 Mod 的问题请在本仓库反馈；AdGuard Home 本身的问题请反馈到上游。

[AdGuard Home]: https://github.com/AdguardTeam/AdGuardHome

## 改动内容

管理界面比上游更精简：

- 常规设置：只保留日志配置与统计配置。
- DNS 设置：删除「访问设置」；「拦截模式」只保留默认选项。
- 删除「已阻止的服务」「设置指导」「DHCP」三个选项卡及其页面。
- 首页仪表盘：不再显示被拦截的恶意/钓鱼网站、被拦截的成人网站、强制安全
  搜索和客户端排行。
- 页脚：删除主页、隐私政策、问题反馈链接。

两套前端都已同步修改：经典版 `client/`（上游正式发布使用的界面）与新版
`client_v2/`。

除以上界面改动外，DNS 服务、过滤规则与列表、查询日志、客户端管理、加密和
REST API 都与上游保持一致。

## 预编译包

`.github/workflows/build-linux.yml` 会构建两组产物：

- `AdGuardHome_linux_amd64.tar.gz` — x86_64
- `AdGuardHome_linux_arm64.tar.gz` — arm64

以及记录 SHA-256 校验和的 `checksums.txt`。获取方式：在 Actions 页面手动运行
**Build Linux binaries** 并下载 `AdGuardHome-linux` 产物；或者推送 `v*` tag，
会自动创建附带这些文件的 Release。

## 从源码构建

需要 Go 1.26.8 或更高版本，以及 Node.js 24。

```sh
make js-deps          # 安装前端依赖；加 CLIENT_DIR=client_v2 构建新版界面
make js-build         # 把前端打包进 build/static
make go-build         # 生成 ./AdGuardHome 可执行文件
```

`make quick-build` 会依次完成前端与 Go 的构建。要本地生成发布包：

```sh
make build-release SIGN=0 OS=linux ARCH="amd64 arm64"
make pack-release SIGN=0
```

产物位于 `dist/`。

## 相关文档

- [上游 Wiki](https://github.com/AdguardTeam/AdGuardHome/wiki)
- [上游发行版](https://github.com/AdguardTeam/AdGuardHome/releases)
- [上游 API 文档](https://github.com/AdguardTeam/AdGuardHome/tree/master/openapi)

## 许可证

本项目按 GNU General Public License v3.0 分发，见 [LICENSE.txt](LICENSE.txt)。
它基于 AdGuard Home，© AdGuard Software Ltd.
