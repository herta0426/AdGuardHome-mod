# 维护手册

这份文档讲**日常怎么操作**：改完怎么验、怎么发版、在线更新怎么维护、上游怎么同步、出问题怎么查。

- 仓库现状与来龙去脉：[HANDOVER.md](HANDOVER.md)
- 最早那份配置整理任务单（已完成）：[TASKS.md](TASKS.md)

## 0. 一分钟现状

| 项目 | 现状 |
| --- | --- |
| 平台 | 只支持 `linux/amd64` 与 `linux/arm64`；**发版只发 arm64**，amd64 只出现在 CI 产物里（本地测试用） |
| 版本号 | `vYYYY-MM-DD`，可选后缀（`-beta`、`-beta-1`、`-rc.1`）；带后缀即预发布 |
| 发版方式 | 推 tag 到主仓库 → GitHub Actions 自动构建、开 Release、改写 `version.json` |
| 在线更新 | 程序读仓库根目录的 `version.json`，不再连官方更新源 |
| 已删除功能 | 安全搜索、已阻止的服务、加密设置（只删界面）、**DHCP（UI 与后端一起删）** |
| 有意保留 | TLS 接口、safebrowsing、家长控制、`internal/configmigrate` 迁移链、查询日志与统计里的占位编号 |
| 配置模板 | `doc/AdGuardHome.yaml.example`（由程序生成，仅供对照） |

## 1. 环境与硬规矩

- **本地只测试，不编译**：不要在本机 `go build` / `make build-release`。需要二进制就在 Actions 里构建，产物从 `AdGuardHome-linux` artifact 下载。
- Windows 上 `go build ./...` 必然失败（别的平台文件已删），测试一律在 WSL `archlinux` 里跑：

  ```sh
  wsl -d archlinux -- bash -lc 'cd /mnt/c/Users/juana/Documents/ChatGPT/Adguardhome && \
    export GOPROXY=https://goproxy.cn,direct CGO_ENABLED=0 && go test ./...'
  ```

- 不要动本机正在跑的官方实例（Windows 服务 `AdGuardHome`，占用 3000/53）。
- 推送走 fork：`mod` = `herta0426/AdguardHome-Mod`；PR 提到主仓库 `liuzq` = `liuzq2002/AdguardHome-Mod`。
- `github.com` 的 https 偶尔被重置，重试即可；`api.github.com` 一般正常，所以 `gh` 命令不受影响。
- 在 PowerShell 里写复杂命令别用裸 `>`，它会被当成写文件、静默生成垃圾文件（踩过一次）。复杂脚本先 base64 落到 WSL 再执行。

## 2. 改一次东西的标准流程

1. 对齐远端、切分支：

   ```powershell
   git fetch liuzq
   git checkout -b codex/<改动名> liuzq/main
   ```

2. 改代码或文档。

3. 本地验证（提交前必须全绿）：

   ```sh
   gofmt -l internal/                                  # 必须无输出
   go vet ./...
   go test ./...
   go mod tidy && git diff --exit-code go.mod go.sum    # 动过依赖才需要
   ```

   改了前端再加：`make js-deps js-lint js-typecheck js-test`（本地不跑 `js-build`）。

4. 提交并推 fork：`git push mod codex/<改动名>`

5. 让 CI 跑。**PR 不会自动触发 CI**，要手动 dispatch：

   ```powershell
   gh workflow run build-linux.yml --repo herta0426/AdguardHome-Mod --ref codex/<改动名>
   gh run watch <run-id> --repo herta0426/AdguardHome-Mod --exit-status
   ```

6. 开 PR、等结果、合并：

   ```powershell
   gh pr create --repo liuzq2002/AdguardHome-Mod --base main --head herta0426:codex/<改动名>
   gh pr merge <编号> --repo liuzq2002/AdguardHome-Mod --merge
   ```

7. 需要发版就继续看第 3 节。

## 3. 发版

### 3.1 打 tag

```powershell
git fetch liuzq
git tag <版本> liuzq/main     # 在已合并的 main 上打
git push liuzq <版本>
```

版本号规则（`scripts/make/version.sh`）：

| tag | 效果 |
| --- | --- |
| `v2026-09-25` | 正式版，标记为「最新版本」 |
| `v2026-09-25-beta-1` | 预发布，不抢占「最新版本」 |
| `v2026-09-25-rc.1` | 同上 |
| 其它形式 | 不认，退回用最后一次提交的日期当版本号 |

正则：`^v[0-9]{4}-[0-9]{2}-[0-9]{2}(-[0-9A-Za-z][0-9A-Za-z.-]*)?$`。`v2026-09-24` 是附注 tag，之后想统一成附注就加 `-a -m "..."`。

### 3.2 工作流按顺序做什么

`.github/workflows/build-linux.yml`：

1. 算版本号，并判断是否预发布；
2. 构建前端，再构建两个架构的二进制；
3. `Pack the release archives`：生成 `dist/*.tar.gz` 与 `checksums.txt`；
4. `Check the example configuration`：用刚构建的二进制校验 `doc/AdGuardHome.yaml.example`；
5. `Upload the build artifacts`：上传 `AdGuardHome-linux` 产物（两个架构，保留 14 天，本地测试用）；
6. `Keep the released checksums in sync`：把 `checksums.txt` 过滤成只剩 arm64 一行；
7. `Update the version announcement file`：改写仓库根目录的 `version.json` 并提交回默认分支；
8. `Publish the release`：发 Release，只附 arm64 包与 `checksums.txt`；预发布自动标记。

第 6～8 步只在打 tag 时执行，普通分支/手动运行不会碰。

### 3.3 发完检查

```powershell
gh release view <版本> --repo liuzq2002/AdguardHome-Mod --json name,isPrerelease,assets
curl.exe -s https://raw.githubusercontent.com/liuzq2002/AdguardHome-Mod/main/version.json
```

- Release 里应只有 `AdGuardHome_linux_arm64.tar.gz` 与 `checksums.txt`；
- `version.json` 的 `version` 应等于刚发的 tag，`download_linux_arm64` 指向该 tag 的包；
- 想验包：`gh release download <版本> -D <目录>` 后 `sha256sum -c --ignore-missing checksums.txt`，再 `strings AdGuardHome | grep '^v2026'` 对版本号。

### 3.4 重发与撤回

- 同一个提交要重发：**换个后缀**（例如 `-beta.2`）最省事；也可以 `gh release delete <tag> --cleanup-tag --yes` 后重建同名 tag。
- 发错了：删掉 Release 与 tag 之后，**记得把 `version.json` 改回上一个版本**（或手动提交一次），否则面板还会提示一个已经不存在的版本。

## 4. 在线更新怎么维护

数据流：程序 → `https://raw.githubusercontent.com/liuzq2002/AdguardHome-Mod/main/version.json` → 解析 → 面板提示 → 用户点更新 → 下载 `download_linux_arm64` → 替换二进制并重启。

- 默认地址写在 `internal/updater/updater.go` 的 `DefaultVersionURL()`；
- 是否检查由 `internal/home/home.go` 的 `isUpdateEnabled()` 决定：`--no-check-update` 关闭；非 linux/arm64 关闭（本地测试的 amd64 不发包）；配置了自定义地址则强制开启；
- `version.json` 里**每个值都不能为空**，且必须有当前平台的键（arm64 对应 `download_linux_arm64`；缺键会让检查直接报错）；
- 换镜像（raw 被墙时）：在配置里设 `unsafe_use_custom_update_index_url: true`，并用环境变量 `ADGUARD_HOME_TEST_UPDATE_VERSION_URL` 指定新地址，例如 `https://ghfast.top/https://raw.githubusercontent.com/liuzq2002/AdguardHome-Mod/main/version.json` 或 `https://cdn.jsdelivr.net/gh/liuzq2002/AdguardHome-Mod@main/version.json`；
- 排查：
  - 面板不提示 → `version.json` 的 `version` 与当前版本字符串相同（这是正常的「已是最新」）；
  - 检查报错 → 多半是 raw 访问不了，或 JSON 少键/空值；
  - 更新后没生效 → 看 `AdGuardHome --version`、工作目录下的 `agh-backup/`，以及 Magisk 模块开机脚本是否又把二进制覆盖回去。

## 5. 配置相关

- 模板：`doc/AdGuardHome.yaml.example`。重新生成的步骤见 HANDOVER 第 5 节「重新生成配置模板」。
- 校验方式：把要检查的文件复制成某个目录下的 `AdGuardHome.yaml`，再 `AdGuardHome --check-config -w <目录>`。不要用 `-c` 指向工作目录之外的文件，那会走「首次启动」分支并真的把服务跑起来。
- 老配置升级：`--check-config` 会顺带跑迁移并写回文件，**跑之前先备份**。死键（`safe_search`、`blocked_services`、`dhcp` 等）会被忽略，并在迁移写回时消失。
- `schema_version` 目前是 34；`internal/configmigrate` 的迁移链一版都不能少，改迁移必须同步更新 `testdata`。

## 6. 同步上游

```sh
git fetch origin --tags           # origin = AdguardTeam/AdGuardHome
git checkout -b sync/upstream-<日期> main
git merge --no-commit --no-ff origin/master
```

合并后必查（细节见 HANDOVER 第 10 节）：

- 平台文件有没有复活：`rg --files internal | rg "_(windows|darwin|bsd)\.go$"`
- 被删功能有没有复活：`rg -n "safesearch|blocked_services|dhcp" internal client/src openapi`
- 更新源有没有被改回官方：`rg -n "static.adtidy.org" internal`
- 跑第 2 节的本地验证 + CI，最后按第 3 节发版。

## 7. 待办与已知坑

- `/releases/latest` 目前返回 404：至今所有 Release 都是预发布，等第一个正式版（纯日期 tag）出现才会正常。
- `CHANGELOG.md` 的「未发布」一节，在打正式版 tag 时改成版本号标题。
- amd64 不随发版提供是**有意**的；需要本地二进制去 Actions 下载 `AdGuardHome-linux` 产物。
- 发版工作流会往 main 提交一次 `Update version.json to ...`，看到这条自动提交不要惊讶。
- Magisk 模块每次开机会随机化 DNS 与 Web 端口并 `sed` 改配置，「连不上管理界面」时先查端口，不是代码坏了。
- 改前端后如果界面没变，先确认 CI 里 `Build the frontend` 成功，再看浏览器/WebView 是否缓存了旧的 `main.*.js`。

## 8. 给下一个接手的人（或 AI）的开场提示

```text
仓库：C:\Users\juana\Documents\ChatGPT\Adguardhome
先读：MAINTENANCE.md（日常维护与发版），再读 HANDOVER.md（现状与来龙去脉）。
约定：
1) 本地只测试不编译（go test / gofmt / js-lint 可以，go build 与 make build-release 不要在本机跑）；
2) 推送走 fork `mod`，PR 提到 liuzq/main，发版前先问用户；
3) 发版 = 在已合并的 main 上打 tag 并推 `liuzq`，工作流会自动构建、发 Release、改写 version.json；
4) 测试在 WSL：wsl -d archlinux -- bash -lc '... go test ./...'；
5) CI 要手动 dispatch：gh workflow run build-linux.yml --repo herta0426/AdguardHome-Mod --ref <分支>。
```
