---
layout: report-home
title: "V2EX 每日热点回顾"
permalink: /latest/
status: success
target_date: 2026-08-09
generated_at: "2026-08-10 06:41:39"
summary: "昨日主题 134 个，过滤 50 个，DeepSeek 分析 84 个，保留高价值内容 24 个。"
count_all: 134
count_excluded: 50
count_included: 84
count_high_signal: 0
count_valuable: 24
report_url: "/2026/08/09/"
data_url: "/data/2026-08-09.json"
---

# V2EX 2026-08-09 昨日新帖报告

<details class="topic-card" data-topic-id="1233011" markdown="1">
<summary>
<span class="topic-rank">1</span>
<span class="topic-title">Codex 误删文件事故：WSL 路径与引号转义风险及防护建议</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

用户在使用 Codex 时授予 full access 并让其自动执行任务，结果 Codex 通过 WSL 执行 bash 命令时，因引号转义错误导致 `find / -delete` 删除了 C 盘和 D 盘大量文件（约两三百 GB）。事故根源在于 PowerShell 调用原生 exe 时未正确转义内层双引号，导致 `$d` 变量为空，`find` 从根目录遍历并删除。

### 关键要点

- **高危命令**：`find ... -delete` 本身风险极高，应限制或禁止 Agent 直接使用。
- **WSL 挂载问题**：WSL 默认将固定盘挂载到 `/mnt/c`、`/mnt/d`，`find` 未使用 `-xdev` 时会遍历这些挂载点，扩大删除范围。
- **转义风险**：PowerShell 拼接 `bash -lc` 时引号转义易出错，建议改用 `wsl.exe --exec bash ...` 或避免跨层调用。
- **隔离执行**：使用 Codex 的 Windows 原生沙盒（Native Sandbox）或独立虚拟机/容器，避免直接操作宿主机文件。
- **备份与策略**：开启云备份、使用 Time Machine 等；制定 SOP 如“先移动后删除”或禁止直接删除。

### 评论补充

- 有用户建议创建独立 Windows 账户或虚拟机，并提前打快照（如 PVE）。
- 有用户分享经验：使用 `syncthing` 同步代码，虚拟机炸了可恢复。
- 有用户指出，即使不开 full access，转义问题也可能难以察觉，因此隔离和备份是必要防线。
- 有用户提到，Agent 训练数据偏向 Unix 生态，容易优先调用 WSL，需手动指定原生方案。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233011" target="_blank" rel="noopener noreferrer">Codex 把我电脑文件都删了</a></span><span class="topic-stats">回复 46 · 收藏 29</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233017" markdown="1">
<summary>
<span class="topic-rank">2</span>
<span class="topic-title">胶囊咖啡与手冲、冻干、挂耳对比及省钱建议</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
楼主从手冲转向胶囊咖啡，主要原因是便捷性，但成本较高。评论中多位用户分享了替代方案和对比经验。

### 关键要点
- **胶囊咖啡**：方便快捷，但按杯计算成本较高，且部分胶囊品质不佳（焦苦味）。
- **冻干咖啡**：多位用户推荐，如三顿半，搭配东方树叶和牛奶口感好，便携且便宜。
- **挂耳咖啡**：香气浓郁，价格便宜，但提神效果可能不如胶囊。
- **其他选择**：速溶、成品咖啡（如瑞幸、库迪）等，成本更低。

### 评论补充
- 有用户指出全自动咖啡机维护麻烦，不适合个人使用。
- 有用户分享手冲流程仅需不到一分钟，强调可玩性。
- 部分用户认为胶囊咖啡机水箱难清洗，转而选择其他方式。

综合来看，选择哪种方式取决于对便捷性、成本和口感的权衡。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233017" target="_blank" rel="noopener noreferrer">从手冲党叛变到胶囊党,说说为什么</a></span><span class="topic-stats">回复 68 · 收藏 12</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233025" markdown="1">
<summary>
<span class="topic-rank">3</span>
<span class="topic-title">AI生成代码的Review实践：上下文失忆与对抗式审查</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
楼主分享使用AI生成代码（如Codex）的经验，指出在接手不熟悉的老模块时，AI生成的代码质量急剧下降，出现上下文失忆、风格偏离等问题。通过反思，提出改进方法：明确业务模型、拆分任务、使用对抗式审查等。

### 关键要点
- **上下文失忆**：长上下文导致AI遗忘AGENTS.md等规范，建议任务完成后开启新上下文，只保留短spec和决策。
- **代码风格**：AI会模仿现有代码风格，若原代码质量差，AI会学坏。建议人工总结编码偏好，而非依赖AI总结。
- **技能限制**：过度使用Grill等技能会降低效率，甚至导致AI智商下降，应适度使用。
- **对抗式审查**：使用不同模型（如Claude Code写、Codex审查）互相审查，或让AI扮演竞争对手模型，提高代码质量。

### 评论补充
- 有用户建议将Review前移为可执行的验收清单，固定允许修改的文件、不可变接口、必须通过的测试等。
- 有用户强调人必须真正理解业务，AI只是辅助，不能完全依赖。
- 有用户分享流程：与AI一起理需求、人机多轮Review、逐步补充rules，AI贡献率可达94%。
- 有用户指出AI降低了决策间隔但未降低决策成本，需责任转移。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233025" target="_blank" rel="noopener noreferrer">你们都如何 review AI 生成的大量代码，保障功能质量</a></span><span class="topic-stats">回复 25 · 收藏 11</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233018" markdown="1">
<summary>
<span class="topic-rank">4</span>
<span class="topic-title">Mac 与 Windows 共用键鼠和显示器的方案汇总</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

Mac 和 Windows 共用一套键鼠和显示器是可行的，主要有硬件和软件两类方案。硬件方案以 KVM 切换器为主，价格从几十元到数百元不等，但高分辨率下可能不便宜，且部分用户反映体验不如软件方案。软件方案如 Synergy、Barrier、Deskflow 等，通过局域网共享键鼠，支持跨平台，但需要网络稳定。此外，罗技 MX 系列键鼠支持 Flow 功能或设备间切换，部分显示器自带 KVM 功能，也可实现共用。

### 关键要点

- **硬件 KVM**：绿联等品牌有售，但体验参差不齐；显示器自带 KVM 效果较好，如 HKC。
- **软件方案**：Synergy、Barrier（开源）、Deskflow 等，通过局域网共享，适合多设备。
- **罗技 Flow**：MX Keys + MX Master 支持跨设备操作，但需软件支持。
- **远程控制**：UU 远程等工具可在 Mac 上控制 Windows，无需额外键鼠。
- **三模外设**：支持 2.4G/蓝牙/有线的外设可直接切换设备。

### 评论补充

- 有用户使用蓝牙切换多台笔记本，体验良好。
- 部分用户建议使用两套键盘以区分快捷键，但非必需。
- 远程桌面全屏后四指滑动切换也很方便。

综合来看，选择方案需考虑预算、分辨率需求和网络环境。软件方案成本低，硬件方案更稳定，显示器自带 KVM 是折中选择。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233018" target="_blank" rel="noopener noreferrer">Mac 和 Windows 可以共用一套键鼠吗</a></span><span class="topic-stats">回复 34 · 收藏 8</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233062" markdown="1">
<summary>
<span class="topic-rank">5</span>
<span class="topic-title">日本IT职场路径：从派遣到日企的实战经验</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者分享了从语言学校到中国派遣公司、美国外包、最终进入日企FinTech的完整职业路径，提供了日本IT就业的实用建议。

### 关键要点
- **语言学校非必需**：若资金充足，可直接从国内工程师切换，但需注意入学周期（1/4/7/10月）。
- **派遣公司利弊**：工作轻松但成长有限，薪资取决于人头价，建议有追求者远离，或作为跳板。
- **薪资锚点**：首份工作薪资影响后续谈判和信用建立，需合理设定。
- **求职渠道**：英文工作死磕LinkedIn，日语工作用BizReach。
- **日企特点**：日本SaaS市场付费意愿高，小而美企业工作节奏好，但需适应文化差异。

### 评论补充
- 日本生活成本高但work-life balance好，假期多，无35岁危机，适合追求生活品质者。
- 多语言切换会带来人格变化，是真实体验。
- 作者承认物质水平下降，但认为生活状态更佳。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233062" target="_blank" rel="noopener noreferrer">🇯🇵日本职场三步跳--从派遣到日企</a></span><span class="topic-stats">回复 9 · 收藏 10</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233003" markdown="1">
<summary>
<span class="topic-rank">6</span>
<span class="topic-title">Claude Code 日耗 68 元：费用对比与省钱方案</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

有用户反映 Claude Code 一天花费 68 元，担心成本过高。评论普遍认为，若使用官方 API，这个费用属于正常甚至偏低水平；重度使用一天可达 100 美元以上。相比之下，订阅制（如 Claude Pro）或使用折扣模型更划算。

### 关键要点

- **费用对比**：官方 API 按 token 计费，价格昂贵；订阅制通常更便宜，例如 200 美元订阅可跑约 10000 美元 API 的量。
- **省钱方案**：使用 OpenRouter 上的 GLM-5.2（当前 1 折）或组合 SuperGrok（30 美元/月）+ OpenCode（10 美元/月）等，适合月预算 300-500 元的中等编程强度。
- **使用技巧**：主会话避免频繁切换模型，否则 KV 缓存失效导致重新计费；Claude Code 对第三方模型默认 256K 上下文，可加 `[1m]` 扩展。

### 评论补充

- 有用户分享每日用量截图，但未提供具体数据。
- 部分用户认为模型质量与价格成正比，但 Sonnet 5 和 Opus 5 存在啰嗦、爱跑测试等问题。
- 注意：OpenRouter 折扣波动大，使用前需确认。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233003" target="_blank" rel="noopener noreferrer">Claude Code 一天花了 68 块，正常吗？</a></span><span class="topic-stats">回复 26 · 收藏 2</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233036" markdown="1">
<summary>
<span class="topic-rank">7</span>
<span class="topic-title">浏览器运行魔兽争霸3：d3d9-webgpu转译实现</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者基于 GitHub v86 项目，实现了在浏览器中运行魔兽争霸 3（Dota1 6.83d）的纯 JavaScript 虚拟机。通过 AI 辅助完成了 d3d9 到 webgpu 的转译，解决了之前 opengl-webgl 转译效率低的问题。游戏运行效果尚可，但动态磁盘从 Cloudflare bucket 加载时会有卡顿。

### 关键要点
- 技术方案：基于 v86 的本地 JavaScript 虚拟机，无需后端。
- 性能优化：d3d9-webgpu 转译，支持 3D 游戏。
- 可玩性：自带 Dota 地图，极品飞车 9 也能运行。
- 部署：可自建，参考 GitHub v86 项目。

### 评论补充
- 操作延迟不明显，但磁盘加载导致卡顿。
- 支持多开标签页，但需手动获取 IP（ipconfig /release /renew）。
- 虚拟磁盘大小可调，可容纳更多游戏。
- 有用户希望支持 Dota2，但未实现。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233036" target="_blank" rel="noopener noreferrer">Dota1 6.83d 网页版</a></span><span class="topic-stats">回复 14 · 收藏 5</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233040" markdown="1">
<summary>
<span class="topic-rank">8</span>
<span class="topic-title">eSIM 推荐：全球流量、保号与接码方案汇总</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
本文推荐了多款 eSIM 方案，涵盖保号、流量和接码需求，强调性价比和易用性。作者建议使用实体 eSIM 卡片（如 eSTK Plus，约 130 元）配合读卡器（30 元）管理多个 Profile。

### 关键要点
- **保号方案**：英国 VOXI 首月 10 镑免费码，保号 180 天，之后充值 5 镑可无限续杯；香港 ClubSIM 首年 58 港币，次年 15 港币/年；爱沙尼亚乌龟电信约 30 元永久保号。
- **流量方案**：BananaSIM 365 天 10GB 全球流量 78 港币，IP 为香港家宽，适合旅游和回国当梯子；LuckySIM 性价比更高，新增 2 年 17 国 24GB 套餐 150 港币。
- **组合建议**：一张 eSTK 卡写入全球流量 eSIM 和香港 eSIM，即可实现全球通讯接码自由。

### 评论补充
- 有用户反馈 BananaSIM 在大陆可用且便宜。
- 评论推荐荷兰 simyo eSIM，首购 5 欧元，每 180 天发短信保号，成本更低。
- 部分用户关注长期号码用于注册社交媒体，但原帖未提供具体方案。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233040" target="_blank" rel="noopener noreferrer">第二版：推荐几个 eSIM，全球流量·便宜保号·接码</a></span><span class="topic-stats">回复 4 · 收藏 6</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233029" markdown="1">
<summary>
<span class="topic-rank">9</span>
<span class="topic-title">AI代问服务兴起：需求本质与商业模式分析</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

V2EX 用户发现小红书、闲鱼上出现付费 AI 代问服务，引发对需求本质的讨论。多数观点认为这是真实需求，源于部分用户不会清晰提问、不愿订阅高级模型或缺乏访问渠道。

### 关键要点

- **需求本质**：很多人难以准确表达问题，代问可帮助梳理需求；也有观点认为代问是“甩锅”工具，避免因提问不当导致答案不符。
- **商业模式**：有用户建议直接提供 API 网页服务，按时间收费（如 1 元 5 分钟、5 元 30 分钟），省去人工代问环节。
- **市场看法**：部分用户认为代问是“古法中转站”，价格低（1-2 元/次），但利润可观；也有观点认为小红书代问是伪需求，真正需求在于访问渠道。

### 评论补充

- 有用户指出代问与网盘代下类似，是服务外包的延伸。
- 部分评论强调提示词工程是专业能力，代问服务有其价值。
- 争议点：代问是否只是“梯子”问题，还是真正需要人工辅助。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233029" target="_blank" rel="noopener noreferrer">AI 代问？还有这玩意？</a></span><span class="topic-stats">回复 22 · 收藏 4</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233009" markdown="1">
<summary>
<span class="topic-rank">10</span>
<span class="topic-title">关闭Win11窗口圆角：无需管理员权限的API方案</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者分享了一个用 Windows API 实现关闭 Win11 窗口圆角的工具，无需修改系统文件或管理员权限，通过注册事件钩子动态禁用圆角。代码仅 41 行，托管在 GitHub。

### 关键要点
- 原理：使用事件钩子监听窗口创建，调用 `DWMWCP_DONOTROUND` 禁用圆角。
- 优势：不注入进程、不修改系统文件，避免影响 Windows 更新和 DWM 稳定性。
- 对比：已有方案（如 Win11DisableRoundedCorners）需管理员权限且修改系统文件，可能导致更新失败或蓝屏。
- 使用：提供 C++ 源码，另有 Python 版本（按 Esc 退出并还原）。

### 评论补充
- 有用户指出钩子可能消耗资源，作者回应称只监听少量事件，测试无性能问题。
- 评论中提供了 Python 移植版，但作者指出 AI 生成的代码存在多处错误（如事件常量、参数值错误），经修正后可用。
- 有用户询问是否支持 gcc 编译，作者未直接回复，但项目为单文件 C++，理论上可用 gcc 编译。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233009" target="_blank" rel="noopener noreferrer">关闭 Windows 11 窗口圆角边框（无需修改系统文件/管理员权限）</a></span><span class="topic-stats">回复 9 · 收藏 4</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233013" markdown="1">
<summary>
<span class="topic-rank">11</span>
<span class="topic-title">TcpTun：解决多设备共享代理与高丢包网络问题的自定义协议</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者为解决出差时多台电脑共享手机热点代理频繁断链的问题，开发了自定义代理工具 TcpTun。通过 mux 和 socks5/mixed 分享解决了多设备共享问题；借助 AI 实现了 REALITY QUIC，并探索了可恢复逻辑连接（Resumable Logical Stream），支持底层 tcp/quic 切换不断流。针对高丢包环境，研究了 FEC 前向纠错、选择性重传、自适应冗余、分片重组、多路径备用 carrier 及 QUIC 拥塞控制等技术。

### 关键要点
- 多设备共享代理断链的根源可能是运营商连接数限制，而非单纯热点问题。
- 自定义协议可降低被封 IP 的风险，但城域网可能对未知协议直接 drop。
- 正确配置的 vless + reality 同样稳定，自定义协议并非唯一选择。

### 评论补充
- 有用户认为 5G 随身 Wi-Fi 是更简单方案，但作者指出易丢失且问题本质是连接数限制。
- 关于自定义协议安全性存在分歧：有人认为目标小更安全，有人指出未知协议可能被重点关照。
- 作者表示自定义协议长期稳定，未被封过 IP。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233013" target="_blank" rel="noopener noreferrer">我为什么要写一个自己的代理： TcpTun</a></span><span class="topic-stats">回复 15 · 收藏 4</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233053" markdown="1">
<summary>
<span class="topic-rank">12</span>
<span class="topic-title">网页版AI对话记录导出方法汇总</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
用户询问如何导出网页版 AI（如 DeepSeek、Gemini）的对话记录，以便在上下文爆满后继续使用。评论提供了多种方法，包括官方导出功能、第三方工具和替代思路。

### 关键要点
- **官方导出**：DeepSeek 在设置→数据管理→历史对话导出；Gemini 在谷歌账号管理→导出我的活动记录，选择 Gemini 对话记录。
- **第三方工具**：有用户推荐 GitHub 项目 ophel（https://github.com/urzeye/ophel/blob/main/README_zh-CN.md）和 saveai.net（https://saveai.net/），但需注意插件可能无法导出文件文档。
- **替代思路**：让 AI 总结旧对话内容后复制到新对话；或使用 API 客户端（如付费 API）来管理上下文。

### 评论补充
- 有用户指出导出后重新喂给新对话会再次占满上下文，建议导出用于备份或交给付费 AI 分析。
- 分享链接无法直接获取内容，需注意。
- 付费 API 是最有效但需成本的方法。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233053" target="_blank" rel="noopener noreferrer">使用网页版本的 AI，有办法导出对话记录吗？</a></span><span class="topic-stats">回复 17 · 收藏 3</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233043" markdown="1">
<summary>
<span class="topic-rank">13</span>
<span class="topic-title">ChatGPT 手机验证：法国 eSIM 与长效接码方案对比</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
用户为通过 ChatGPT 手机验证，花费 100 元购买法国 eSIM，但该号码仅一个月有效期，且需实名登记，后续验证需换号。评论指出此方案性价比低，并提供了多种替代方案。

### 关键要点
- **法国 eSIM**：100 元，一个月有效期，需实名，适合短期验证。
- **长效接码**：如 hero-sms、特定商家提供非一次性号码，价格更低。
- **美国 Tello eSIM**：100 元可用 3 个月，免实名。
- **无忧行 App**：美国号码 68 元可用 6 个月。
- **Skinny 卡**：100 元长期使用，无月租，注册时可能无需手机验证。

### 评论补充
- 有用户建议使用接码平台，成本不到一罐可乐。
- 部分用户注册时使用美国家宽 IP，未触发手机验证。
- 注意：豆包等 AI 可能无法提供合规的海外验证方法，需自行验证。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233043" target="_blank" rel="noopener noreferrer">为了通过 ChatGPT 的手机验证，花 100 大洋买了一张法国 eSIM</a></span><span class="topic-stats">回复 19 · 收藏 2</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1232974" markdown="1">
<summary>
<span class="topic-rank">14</span>
<span class="topic-title">mira sim 隐私协议质疑：疑似中转站且模型注水</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
主题质疑 mira sim 的隐私协议，作者称在主贴下提出质疑被删评论，怀疑其数据贩卖。评论进一步揭露该服务疑似 AI 中转站，存在模型注水、数据泄露风险。

### 关键要点
- **疑似中转站**：评论指出 mira sim 是国人开的中转站，前期打着福利旗号，后期可能收费并筛选用户。
- **模型注水**：有用户打假称其提供的模型为注水模型，实际能力存疑。
- **数据泄露风险**：用户测试发现，将本地 Claude API 设置为中转站的 Grok 后，中转站能看到使用记录，时间完全吻合，证实数据经过中转。
- **操作建议**：谨慎使用此类免费服务，避免将敏感 API 密钥或数据暴露给不可信的中转站。

### 评论补充
- 有用户指出该工具可代理本地 Codex/Claude，但设置中可改为走其中转，或配置空白给 Codex CC，但使用中遇到 429 错误。
- 部分用户认为这是“天才”玩法，但风险明显，需自行权衡。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1232974" target="_blank" rel="noopener noreferrer">别急着 羊毛了，先看看 mirasim 的隐私协议</a></span><span class="topic-stats">回复 13 · 收藏 2</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233027" markdown="1">
<summary>
<span class="topic-rank">15</span>
<span class="topic-title">小游戏耗电发热：挖矿还是优化问题？</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
用户反映在 B 站 App 玩解谜小游戏时手机发热、耗电快（70%电量3小时耗尽），怀疑是否在挖矿。多数回复认为挖矿可能性极低，更可能是游戏优化差、内存泄漏或引擎问题。

### 关键要点
- 手机算力挖矿收益低，不足以覆盖成本，且主流币种多为 PoS，PoW 币手机挖矿无利可图。
- 耗电发热更可能源于代码缺陷（如死循环、内存泄漏）、引擎效率低或高频全屏重绘。
- 类似问题在微信、淘宝等小程序中普遍存在，不仅限于 B 站。

### 评论补充
- 有用户指出可能被用作 PCDN 节点共享网络，但未证实。
- 建议检测耗电应用或提供链接供测试，但未给出具体工具。
- 老手机电池老化也会加剧耗电。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233027" target="_blank" rel="noopener noreferrer">某些小游戏是不是在挖矿？</a></span><span class="topic-stats">回复 15 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233021" markdown="1">
<summary>
<span class="topic-rank">16</span>
<span class="topic-title">iOS 油猴脚本工具对比：Stay 与 Tampermonkey 选择建议</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

iOS 上 Safari 对油猴脚本支持不佳，用户反映 Stay 脚本失效、静默更新失败。评论指出可能是 GM API 变化导致非 Tampermonkey 插件挂掉，换用 Tampermonkey 后问题解决。

### 关键要点

- **Stay 问题**：脚本失效、静默更新失败，且越来越臃肿。
- **Tampermonkey 优势**：更新频繁（三周前更新），兼容性好，能运行 Stay 挂掉的脚本。
- **替代方案**：Edge 支持扩展，Gear Browser 和 Orion 浏览器支持油猴，可尝试。
- **排查建议**：查看 console 是否有 GM_valve 相关报错，可能是 API 变化导致。

### 评论补充

- 有用户表示换用 Tampermonkey 后体验良好。
- 部分用户认为 Safari 脚本效果普遍不佳，建议换浏览器。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233021" target="_blank" rel="noopener noreferrer">iOS 上买了 stay 还有必要买 tampermonkey 吗？</a></span><span class="topic-stats">回复 17 · 收藏 0</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1232979" markdown="1">
<summary>
<span class="topic-rank">17</span>
<span class="topic-title">ChatGPT 长任务中断的解决方案：/goal 模式与定时任务</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
用户反映 ChatGPT 会话最长约 100 分钟即中断，即使注入提示词也无法持续。评论中多位用户提出使用 `/goal` 模式可显著延长运行时间，有用户称连续运行 8 小时、近两天甚至 8 天。另有用户建议通过桌面应用的 Scheduled 功能设置定时任务，每 5 分钟检测会话是否运行，若停止则自动发送指令继续。

### 关键要点
- **/goal 模式**：在提示词中强调“不要偷懒，不要提前终止，必须完成”，可让任务持续数小时至数天。
- **定时任务**：利用 Scheduled 每 5 分钟检查会话状态，自动恢复中断的任务。
- **会话切换**：有用户通过新建会话并告知“运行至少 8 小时”来延长测试时间。

### 评论补充
- 部分用户对 `/goal` 模式的效果表示认可，但未提供具体配置细节。
- 定时任务方案依赖桌面应用，且需注意检测逻辑的准确性。
- 有用户指出默认定时任务可能使用低阶模型，需手动指定模型。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1232979" target="_blank" rel="noopener noreferrer">发现 chatGpt 最长只能工作一个半小时，有没有点子解决？</a></span><span class="topic-stats">回复 8 · 收藏 3</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1232996" markdown="1">
<summary>
<span class="topic-rank">18</span>
<span class="topic-title">卖旧 MacBook Air 平台对比：闲鱼价高但费心，官方回收省事</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
出售旧款 MacBook Air（如 2018 款）时，不同平台价格与体验差异明显。综合讨论，闲鱼个人交易价格最高，但需耗费大量精力应对砍价和交易风险；爱回收、转转等平台估价看似高但实际扣款多；苹果官方回收价格虽低但流程简单，只要设备正常即按预估价格回收。

### 关键要点
- **闲鱼**：价格最高，但需面交并注意手续费（如支付宝当面转账可避免），且可能遇到大量砍价者。
- **爱回收/转转**：线上估价高但线下检测扣款多，如屏幕胶条脱胶可能被压价至两三百元。
- **苹果官方回收**：价格固定（如 850 元现金或 1000 元抵扣），不检查电池容量，只要设备正常即按预估价格，适合追求省心。
- **其他渠道**：线下手机店可能比爱回收价高，但需自行比较。

### 评论补充
- 若回收价仅几百元，可考虑拆机卖零件（如硬盘、屏幕），但需注意 Mac 硬盘多为焊死。
- 有用户提醒，转转寄给富士康回收可能存在坑，需谨慎。
- 对于低配旧款，性能已落后，建议优先考虑省心渠道。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1232996" target="_blank" rel="noopener noreferrer">现在卖 MacBook Air ,哪个平台比较推荐，手里 18 款 air 要出了</a></span><span class="topic-stats">回复 13 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1232984" markdown="1">
<summary>
<span class="topic-rank">19</span>
<span class="topic-title">阿里云CDN被解析到广电IP导致海外无法访问的排查与解决</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

有用户反映，使用日本DNS解析时，阿里云CDN域名（如 tb.ele.me）常被解析到鹏博士、东方有线等广电系IP，这些IP在境内三大运营商网络下可能正常，但从海外访问时经常无法连接。

### 关键要点

- **现象**：海外DNS解析阿里CDN域名时，可能返回广电系IP，导致海外访问失败。
- **原因推测**：广电系与主流IDC存在内网缓存，可能影响解析结果；也可能是服务商有意限制海外访问。
- **解决方案**：将DNS更换为阿里DoH，或使用AdGuard Home、dnsmasq等工具对阿里CDN域名进行分流解析，可解决就近解析问题。

### 评论补充

- 有用户反馈广电卡解析到外省铁通段，丢包严重，换用阿里DoH后恢复正常。
- 提交工单时，阿里云要求网站所有方账号才有权限，普通用户无法直接处理。
- 客服之间互相推诿，建议用户自行调整DNS设置。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1232984" target="_blank" rel="noopener noreferrer">最近阿里系所属云服务经常被解析到鹏博士、东方有线之类的无法访问的 ip 地址上</a></span><span class="topic-stats">回复 10 · 收藏 2</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233010" markdown="1">
<summary>
<span class="topic-rank">20</span>
<span class="topic-title">芯片涨价下 2.5G/1G 软路由选购建议</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
在芯片、内存和硬盘涨价的背景下，用户寻求千兆宽带（可能升级 2.5G）的软路由推荐，主要用于科学上网，已有独立 NAS。讨论聚焦于性价比方案，强调 AES 指令集对跑满千兆的重要性。

### 关键要点
- **预算与性能平衡**：N100 准系统价格已涨至 500-600 元甚至更高，部分用户认为性价比下降。
- **低成本替代**：闲鱼瘦客户机约 100 元，配 DDR3 内存，CPU 支持 AES 即可满足科学上网需求。
- **硬件限制**：J1900/J1800 的 SATA 总线仅支持 SATA2.0（3Gbps），可能影响存储性能。
- **价格争议**：有用户对比发现 N100 准系统价格未涨，但内存和硬盘涨幅明显；也有用户认为全线涨价。

### 评论补充
- 有用户出售 J1900（4 口千兆，400 元）和 N6005（4 口 2.5G，1200 元）作为参考。
- 部分用户强调内存涨价是主要成本因素，建议关注内存价格走势。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233010" target="_blank" rel="noopener noreferrer">芯片大涨价的情况下，当下 2.5G / 1G 最划算的软路由求推荐</a></span><span class="topic-stats">回复 9 · 收藏 2</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233087" markdown="1">
<summary>
<span class="topic-rank">21</span>
<span class="topic-title">徕芬电动牙刷9.9元刷头停产，用户反馈质量与售后问题</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

有用户反映徕芬电动牙刷宣传的 9.9 元刷头已停产，目前官方渠道难以购买，替代刷头均价二三十元，引发对品牌信任的质疑。多位用户证实类似情况，并反馈牙刷本身存在电池寿命短、返修等问题。

### 关键要点

- 9.9 元基础款刷头已停产，官方渠道无货，第三方或拼多多可买到旧款，均价 7-8 元。
- 多用户反映牙刷使用一年左右出现充不进电，需返修换电池。
- 部分用户认为刷头质量不如飞利浦，但价格仍具优势。
- 徕芬吹风机口碑较好，被认为值得购买。

### 评论补充

- 有用户囤货刷头，平均 8 元一个，建议消耗品可考虑平替。
- 有用户提到牙刷可能打牙齿、遇水误触等使用问题。
- 事件在多个平台引发讨论，关注品牌后续处理。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233087" target="_blank" rel="noopener noreferrer">徕芬也是割韭菜的</a></span><span class="topic-stats">回复 11 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233020" markdown="1">
<summary>
<span class="topic-rank">22</span>
<span class="topic-title">VidServe：将电脑视频目录变为局域网视频网站</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者开发了 VidServe 工具，可将电脑上的视频目录一键变为局域网视频网站，手机、平板等设备通过浏览器即可观看，无需安装额外应用，并自动生成播放列表。

### 关键要点
- 使用简单：选择视频目录，点击启动即可。
- 支持 HTTP Range 分段传输，实测 2 小时视频可正常拖动进度条。
- 外挂字幕（如 SRT）暂不支持，作者计划后续添加，需转换为 WebVTT 格式。

### 评论补充
- 有用户建议支持外挂字幕和优化进度条，作者回应已计划实现字幕功能。
- 有用户提出可用 SMB 共享替代，作者认为 VidServe 更简单且兼容性更好。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233020" target="_blank" rel="noopener noreferrer">[首发] VidServe 一键将电脑上的视频目录变为局域网视频网站，手机电脑都能看</a></span><span class="topic-stats">回复 4 · 收藏 3</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233028" markdown="1">
<summary>
<span class="topic-rank">23</span>
<span class="topic-title">DeepSeek 招聘游戏开发：行业影响与引擎竞争分析</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
DeepSeek 招聘游戏开发方向人才，引发对游戏开发行业变革的讨论。评论指出，DeepSeek 可能进入游戏工具链领域，对 Unity 等商业引擎构成竞争，并可能推动开源引擎（如 Godot）的采用。

### 关键要点
- **行业影响**：DeepSeek 的入局可能打破 Unity 等引擎的垄断，降低开发者的引擎成本。
- **技术方向**：招聘可能聚焦于 AI Agent 在游戏开发中的应用，如自动化场景搭建和数据分析。
- **潜在风险**：有评论担忧 DeepSeek 可能沦为“工具和数据”角色，处于游戏开发鄙视链底层。

### 评论补充
- 有观点认为，DeepSeek 可能成为跨引擎的 AI 伙伴，为所有开发者提供支持，实现双赢。
- 也有评论指出，Unity 等引擎商可能转向按 token 收费的 AI 服务，改变现有商业模式。
- 部分开发者认为，AI 辅助能减轻 3D 场景搭建等苦力活，是积极信号。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233028" target="_blank" rel="noopener noreferrer">Deepseek 招游戏开发, 游戏开发方向”和“Web 3D 与渲染方向</a></span><span class="topic-stats">回复 6 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1233006" markdown="1">
<summary>
<span class="topic-rank">24</span>
<span class="topic-title">屏幕出现横线：保修、排线清理与换屏经验</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
屏幕出现横线通常是硬件问题，软件无法修复。处理优先级：先确认是否在保修期内，在保优先走售后；过保可尝试重新插拔屏幕排线，并用橡皮擦清洁金属触点，若氧化或生锈需先清理。

### 关键要点
- **保修期**：笔记本一般两年，显示器一般三年，先查是否过保。
- **排线问题**：物理老化或接触不良导致，插拔和清洁可能暂时缓解。
- **维修方案**：排线问题可维修，严重则需换屏；也可外接显示器使用。
- **售后注意**：有用户反映华硕售后体验差，维修点远、需自付运费，但维修速度快。

### 评论补充
- 有用户遇到类似问题，刚过保出现，屏幕发热后横线减少，降低刷新率也有缓解。
- 换屏成本不高，多数屏幕通用，找专业维修师傅可解决。
- 有用户因售后问题拉黑品牌，提醒购买时考虑售后。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1233006" target="_blank" rel="noopener noreferrer">屏幕下方出现很多的横线，还有办法抢救一下么？</a></span><span class="topic-stats">回复 8 · 收藏 0</span></p>

</div>

</details>
