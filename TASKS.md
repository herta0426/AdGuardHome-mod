# 任务计划：配置（AdGuardHome.yaml）整理与清理

这份文件是一张可以直接交给新对话的任务单。**先读 [HANDOVER.md](HANDOVER.md)**（仓库现状、本地环境、发版流程、AI 协作边界），再按下面的顺序干活。

## 分支约定

- 本次工作全部在 `codex/config-yaml` 上做，**从最新的 `liuzq/main` 切出来**，不要直接改 `main`。
- 开工前先对齐远端（`liuzq/main` 可能已经有新提交，例如网页上直接改的 README）：

```powershell
cd C:\Users\juana\Documents\ChatGPT\Adguardhome
git fetch liuzq
git status --porcelain          # 必须干净；脏就先提交或还原
git checkout -b codex/config-yaml liuzq/main
```

- 收尾：推 fork → 开 PR → 合并，见 [HANDOVER.md](HANDOVER.md) 第 7 节。推送与发版都要先得到用户同意。

## 目标

1. 产出一份 **mod 版新配置模板**：删掉已删除功能与上游已弃用的键，只保留 Linux 上有效、且本 mod 保留的功能。
2. 清理代码里为已删功能留下的痕迹：迁移代码中写 `safe_search` / `blocked_services` / `use_global_blocked_services` 的部分。
3. 保证 **老配置升级路径不炸**：迁移链完整，`schema_version` 能顺利升到最新。

## 已核实的事实（直接采信，不必重查）

- 最新 schema 版本：`internal/configmigrate/configmigrate.go` 里 `LastSchemaVersion = 34`。
- 配置读取**不是**严格模式（`internal/home/config.go` 的 `yaml.Unmarshal`）。老配置里多余的键不会报错，会被忽略；一旦触发迁移，配置文件被重写，死键随之消失。
- `--check-config` 会完整跑一遍 read → migrate → write → validate 再退出（`internal/home/home.go` 调 `parseConfig`，选项定义在 `internal/home/options.go`）。所以它能用来验证模板、也能触发老配置迁移。**跑之前先备份 YAML**——上游曾有 `--check-config` 写坏配置的问题（issue #4067）。
- 代码里已经**没有**任何 `safe_search` / `safesearch` / `blocked_services` 的 YAML 字段（`rg 'yaml:"[^"]*(safe_search|safesearch|blocked_services)' internal` 无命中）。
- 这些字样只剩下两类：
  - 迁移代码：`internal/configmigrate/v4.go`、`v18.go`、`v19.go`、`v21.go`、`v22.go`、`v26.go`（逐个核对，有些只是把旧键搬个位置）；
  - 迁移测试数据：`internal/configmigrate/testdata/TestMigrateConfig_Migrate/v*/{input,output}.yml`（v1…v29+）。
  - 结论：**迁移函数不能整段删**（老配置靠它一版一版升上来），能删的只是「往配置里写已删功能键」的那几行。
- 占位常量：`internal/filtering/reason.go`、`internal/stats/unit.go` 里的编号**不能改数值**（老查询日志、老统计文件按编号对齐，改了会串号）。只能改注释或命名。
- 经典服务从来没有提交过示例 YAML；上游只有 `internal/next/AdGuardHome.example.yaml`（新服务用的，本仓库已删）。所以「模板」必须从**真跑起来的实例**生成。
- 现成的「旧配置」样本：Magisk 模块仓库 `liuzq2002/Adguard-Home-For-Magisk-Mod` 的 `Adguardhome/bin/AdGuardHome.yaml`，里面有 `safesearch_cache_size`、`blocked_services`、`use_global_blocked_services` 等死键，拿来测升级最真实。
- 环境：Go 1.26.8（Windows 侧 `C:\Users\juana\tools\go\bin\go.exe`，测试要在 WSL `archlinux` 里跑）、Node 24。Windows 上不能 `go build ./...`（只剩 Linux 平台文件）。

## T0 基线（10 分钟）

```powershell
cd C:\Users\juana\Documents\ChatGPT\Adguardhome
git status --porcelain          # 确认干净
git log -1 --oneline
```

```sh
wsl -d archlinux -- bash -lc 'cd /mnt/c/Users/juana/Documents/ChatGPT/Adguardhome && \
  export GOPROXY=https://goproxy.cn,direct CGO_ENABLED=0 && \
  go test ./internal/configmigrate/... ./internal/home/...'
```

验收：工作区干净、两个包的测试通过。把当前 HEAD 记下来，后面所有改动都基于它。

## T1 生成「当前真实配置模板」

用临时实例跑一次安装，让程序自己写出完整 YAML（这是唯一的权威来源）。

```sh
wsl -d archlinux -- bash -lc 'cd /mnt/c/Users/juana/Documents/ChatGPT/Adguardhome && \
  export GOPROXY=https://goproxy.cn,direct CGO_ENABLED=0 && go build -o /tmp/agh ./'

# 干净的临时工作目录 + 端口（别用 53/3000，本机有官方实例在跑）
mkdir -p /tmp/agh-tpl
/tmp/agh --no-check-update -w /tmp/agh-tpl -p 3053 >/tmp/agh-tpl.log 2>&1 &
sleep 3

curl -s http://127.0.0.1:3053/control/install/get_addresses
curl -s -X POST http://127.0.0.1:3053/control/install/configure \
  -H 'Content-Type: application/json' \
  -d '{"language":"zh-cn","username":"","password":"","web":{"ip":"127.0.0.1","port":3053},"dns":{"ip":"127.0.0.1","port":5353}}'

cat /tmp/agh-tpl/AdGuardHome.yaml
```

产出：把这份「上游等价模板」另存为 `doc/AdGuardHome.yaml.example.upstream`（只做对比基线，不进最终交付也行）。

验收：文件能被解析、`dns.port`/`http.port` 就是刚才设的值、`schema_version` 是 34。

## T2 产出 mod 版模板

以 T1 的输出为基础，逐节核对并删掉这些内容（每删一项都在 CHANGELOG 里记一句）：

| 键 | 处理 | 理由 |
| --- | --- | --- |
| `dns.safe_search` / `dns.safesearch_cache_size` | 删 | 安全搜索功能已从本 mod 删除 |
| `filtering.blocked_services` | 删 | 已阻止的服务功能已删除 |
| `clients[].safe_search`、`clients[].blocked_services`、`clients[].blocked_services_schedule`、`clients[].use_global_blocked_services` | 删 | 同上（注意：`/control/clients` 的**接口**暂时保留兼容，但配置文件里不需要这些键） |
| `dhcp` 段 | 保留，加注释 | 后端与 `/control/dhcp/*` 还在（第三方管理器要用），只是 Web 界面被删了 |
| `tls` 段 | 保留，加注释 | TLS/无加密 DNS 的接口与行为都在（只删了前端页面） |
| `filtering.safebrowsing_*`、`parental_*` | 保留 | 这两个功能没删 |
| 其它带 `Deprecated` 注释的键 | 逐个决定 | 在 `internal/home/config.go`、`internal/configmgr/**` 里搜 `Deprecated`，决定保留/删除/加注释 |

产物：`doc/AdGuardHome.yaml.example`（mod 版），每节一行中文注释说明「保留 / 删除 / 为什么」。

验收：

```sh
/tmp/agh --check-config -w /tmp/agh-tpl -c doc/AdGuardHome.yaml.example   # 参数名以 options.go 为准
rg -n "safe_search|safesearch|blocked_services|use_global_blocked_services" doc/
```

第一条要求退出码 0 且输出「configuration file is ok」；第二条只应命中说明性注释（或完全没有）。

## T3 老配置升级验证（必做）

1. 取 Magisk 模块里那份旧 `AdGuardHome.yaml`（含 `safesearch_cache_size`、`blocked_services`、`use_global_blocked_services`）。
2. 复制到干净目录，先备份，再让程序升级：

```sh
cp AdGuardHome.yaml /tmp/agh-up/AdGuardHome.yaml
cp -a /tmp/agh-up/AdGuardHome.yaml /tmp/agh-up/AdGuardHome.yaml.bak
/tmp/agh --check-config -w /tmp/agh-up
diff -u /tmp/agh-up/AdGuardHome.yaml.bak /tmp/agh-up/AdGuardHome.yaml | head -80
```

3. 起服务，确认 DNS 能解析、Web 能进、日志与统计页正常。

验收：`schema_version` 升到 34；死键消失；服务与界面无异常；`--check-config` 不报错。

## T4 迁移代码清理（需要先做决策）

**决策点（推荐 A）**

- **A 保守清理（推荐）**：迁移函数全部保留（版本链不能断），只把「往配置里写已删功能键」的代码删掉：
  - `internal/configmigrate/v18.go`：不再构造 `dns.safe_search`；
  - `internal/configmigrate/v19.go`：不再写 `safe_search`；
  - `internal/configmigrate/v26.go`：不再搬 `safe_search` / `safesearch_cache_size`；
  - `internal/configmigrate/v4.go`、`v21.go`、`v22.go`：核对 `use_global_blocked_services` / clients 相关搬移，能安全去掉的去掉；
  - 每改一个迁移，必须同步改 `internal/configmigrate/testdata/TestMigrateConfig_Migrate/vN/output.yml`。
- **B 激进删除（不建议）**：删掉早期迁移，只支持较新配置——老用户升级会直接失败或丢配置。

验收：`go test ./internal/configmigrate/...` 全绿；T3 的升级路径重跑一遍仍正常；`rg -l "safe_search|safesearch|blocked_services" internal/configmigrate -g '*.go'` 只剩下必须保留的注释（若选 A，理想结果是只剩说明性注释）。

## T5 占位常量（建议不动）

- `internal/filtering/reason.go`、`internal/stats/unit.go` 里的编号是给老查询日志/统计文件对齐用的，**不要改数值，也不要删**。
- 可以做的只有：把注释写清楚「这些编号对应已删除的功能，保留是为了兼容老数据」，并在 `CHANGELOG.md` 与 `HANDOVER.md` 的「有意保留」里各留一句。

## T6 文档与发版

1. `CHANGELOG.md` 加一条：新增 mod 版配置模板、清理了哪些迁移代码、哪些东西仍然保留。
2. `README.md` / `README.en.md`：如果新增 `doc/AdGuardHome.yaml.example`，在「下载与安装」附近加一句说明它是参考模板、不是安装必需。
3. `HANDOVER.md`：在目录地图里补上 `doc/AdGuardHome.yaml.example` 与「模板怎么再生成」的一条命令。
4. 发版按 HANDOVER 第 7 节走：分支 → PR → 合并 → tag（`vYYYY-MM-DD`）→ workflow 出 amd64/arm64 → 真机验证。**发版前先问用户。**

## 总验收清单

- [ ] `doc/AdGuardHome.yaml.example` 存在，且 `rg` 检查无死键（除说明性注释）
- [ ] `--check-config` 对模板返回成功
- [ ] 旧配置（Magisk 那份）能升到 schema 34，服务、DNS、日志、统计均正常
- [ ] `gofmt -l internal/` 无输出
- [ ] WSL 里 `go test ./...` 全绿（至少 `./internal/configmigrate/... ./internal/home/...`）
- [ ] `GOOS=linux GOARCH=amd64` 与 `GOARCH=arm64` 交叉编译通过
- [ ] 二进制体积有无变化都记录一笔
- [ ] CHANGELOG / README / HANDOVER 已同步
- [ ] 没有推送、没有发版（除非用户明确同意）

## 风险与坑

- 迁移链必须连续：`schema_version` 只能一版一版往上走，删中间任何一版都会让老配置升不上来。
- 改迁移必须同步 testdata，否则 `go test ./internal/configmigrate/...` 直接挂。
- `--check-config` 会写文件（迁移发生时），跑之前务必备份。
- 死键会被自动忽略并在写回时消失，所以不需要用户手工清配置；但如果用户可能**降级**回老版本，要提醒他先备份。
- 模板里不要写随机端口（Magisk 模块的 `service.sh` 会自己 sed 改端口），用默认值或清晰占位符。
- 不要把「我们的默认上游 DNS」「我们的拦截列表」之类会改变用户行为的设置写进模板。
- 本机有官方 AdGuard Home 在跑（3000/53），所有验证都要换端口、用临时目录，别碰它。

## 开场提示（复制这段到新对话即可）

```text
仓库：C:\Users\juana\Documents\ChatGPT\Adguardhome（只支持 linux/amd64 与 linux/arm64）
先读：HANDOVER.md（仓库现状、环境、发版流程、协作边界），再读 TASKS.md（本次任务单）。
分支：从最新的 liuzq/main 切出 codex/config-yaml，所有改动都在这个分支上，不要直接改 main。
本次目标：按 TASKS.md 的 T0–T6 干活——生成 mod 版 AdGuardHome.yaml 模板、清理配置层里已删功能的残留（迁移代码与死键）、保证老配置升级不炸，并同步文档。
约束：
1) 先给方案与影响面，再动手；每改完一批就跑对应验证命令并贴结果。
2) 测试用 WSL archlinux 跑（Windows 只能交叉编译）；改迁移必须同步更新 testdata。
3) 不要提交构建产物；不要动 C:\Program Files (x86)\AdGuardHomeForWindows 与本机 3000/53 上的官方实例。
4) 不要推送、不要打 tag、不要发版，等我明确同意。
5) 参考命令都在 TASKS.md 里，遇到与文档不符的地方先停下来告诉我。
```
