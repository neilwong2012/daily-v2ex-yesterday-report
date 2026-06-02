# V2EX 2026-05-28 昨日新帖报告（阻塞）

抓取时间：2026-05-29 09:12:30（Asia/Shanghai）  
时间口径：2026-05-28 00:00:00 到次日 00:00:00（Asia/Shanghai）  
状态：API 抓取失败，未生成有效分析报告。

## 阻塞原因

- V2EX_TOKEN：已检测到
- 代理环境：http://127.0.0.1:10080
- 是否已尝试代理：是
- 直连失败：TypeError: fetch failed | cause=Error: getaddrinfo ENOTFOUND www.v2ex.com | code=ENOTFOUND | syscall=getaddrinfo
- 具体错误：TypeError: fetch failed | cause=Error: connect EPERM 127.0.0.1:10080 - Local (0.0.0.0:0) | code=EPERM | syscall=connect | address=127.0.0.1 | port=10080

## 需要修复

- 确认当前运行环境能解析并访问 `https://www.v2ex.com/api/v2/token`。
- 脚本会先直连，网络类错误会自动用检测到的代理重试一次；如果仍失败，检查 DNS、代理端口和 V2EX API 可达性。
- 修复网络后重新运行本自动化，脚本会按 V2EX API topic id 扫描，并继续过滤 `二手交易` 和 `推广`。

## 输出文件

- 失败 JSON：[v2ex_2026-05-28_failure.json](/Users/neil/Documents/Codex/2026-05-26/https-www-v2ex-com-help-api/v2ex_2026-05-28_failure.json)
- 阻塞报告：[v2ex_2026-05-28_report_blocked.md](/Users/neil/Documents/Codex/2026-05-26/https-www-v2ex-com-help-api/v2ex_2026-05-28_report_blocked.md)
