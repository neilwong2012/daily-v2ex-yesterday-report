---
layout: report-post
title: "V2EX 2026-06-26 昨日新帖报告（阻塞）"
hero_title: "昨日 V2EX 关键内容"
date: 2026-06-26 08:30:00 +0800
categories: [v2ex, daily-report]
status: blocked
target_date: 2026-06-26
generated_at: "2026-06-27 07:50:26"
summary: "API 抓取失败，已发布阻塞诊断。"
count_all: 0
count_excluded: 0
count_included: 0
count_high_signal: 0
report_url: "/v2ex/daily-report/2026/06/26/v2ex-yesterday-report.html"
data_url: "/data/2026-06-26.json"
key_trends:
  []
top_topics:
  []
tool_topics:
  []
risk_topics:
  []
---

> 发布状态：阻塞。生成时间：2026-06-27 07:50:26（Asia/Shanghai）。

# V2EX 2026-06-26 昨日新帖报告（阻塞）

抓取时间：2026-06-27 07:50:25（Asia/Shanghai）  
时间口径：2026-06-26 00:00:00 到次日 00:00:00（Asia/Shanghai）  
状态：API 抓取失败，未生成有效分析报告。

## 阻塞原因

- V2EX_TOKEN：已检测到
- 代理环境：未检测到
- 是否已尝试代理：否
- 具体错误：ApiError: 522 topics/1223166: | status=522 | endpoint=topics/1223166

## 需要修复

- 确认当前运行环境能解析并访问 `https://www.v2ex.com/api/v2/token`。
- 脚本会先直连，网络类错误会自动用检测到的代理重试一次；如果仍失败，检查 DNS、代理端口和 V2EX API 可达性。
- 修复网络后重新运行本自动化，脚本会按 V2EX API topic id 扫描，并继续过滤 `二手交易` 和 `推广`。

## 输出文件

- 失败 JSON：[v2ex_2026-06-26_failure.json]({{ site.baseurl }}/data/2026-06-26.json)
- 阻塞报告：[v2ex_2026-06-26_report_blocked.md]({{ page.url | relative_url }})


数据文件：[/data/2026-06-26.json]({{ site.baseurl }}/data/2026-06-26.json)
