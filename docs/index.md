---
layout: report-home
title: "V2EX 每日热点回顾"
date: 2026-08-16 08:30:00 +0800
categories: [v2ex, daily-report]
status: success
target_date: 2026-08-16
generated_at: "2026-08-17 06:32:06"
summary: "昨日主题 125 个，过滤 45 个，DeepSeek 分析 80 个，保留高价值内容 20 个。"
count_all: 125
count_excluded: 45
count_included: 80
count_high_signal: 0
count_valuable: 20
report_url: "/2026/08/16/"
data_url: "/data/2026-08-16.json"
---

# V2EX 2026-08-16 昨日新帖报告

<details class="topic-card" data-topic-id="1234711" markdown="1">
<summary>
<span class="topic-rank">1</span>
<span class="topic-title">Vibe Coding 网站上线即遭攻击：日志分析与防护措施</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者用 Vibe Coding 快速开发了社区评分网站“锐评”（rping.cc），上线后开放游客评分和评论，结果几十分钟内遭恶意刷票和评论攻击，被迫关站。攻击者使用两个相邻 IP 高频请求，制造约 20 万次 Firewall Actions，刷了近 3000 次差评，之后换 IP 注册账号刷 128 条乱码评论。作者通过日志分析发现攻击路径与 V2EX 帖子传播时间吻合，但无法确定具体来源。

### 关键要点
- **攻击特征**：进入网站 23 秒后开始试接口，10 分钟后高频请求，单分钟峰值近 2000 次，Vercel DDoS Challenge 拦截 16.4 万次，仍有 5 万多次放行。
- **防护措施**：屏蔽 IP、开启 Attack Mode、全站限流、关闭游客权限、清理异常数据、开启邮箱验证。
- **经验教训**：生产级网站不能只靠 Vibe Coding，需提前考虑防护；游客权限和免邮箱验证会降低攻击成本。

### 评论补充
- 有用户建议接入 Cloudflare Turnstile 或套 CF 防护。
- 有用户分享类似经历：非盈利小站也遭攻击，建议在入口加防火墙，按 IP 或 User-Agent 频率限制，最好在 Nginx 层 ban。
- 部分评论质疑攻击动机，认为可能是得罪人，但作者否认。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234711" target="_blank" rel="noopener noreferrer">一个 Vibe Coding 网站是怎么在上线几十分钟内被打爆的</a></span><span class="topic-stats">回复 66 · 收藏 16</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234766" markdown="1">
<summary>
<span class="topic-rank">2</span>
<span class="topic-title">d3d9-webgpu proxy 实现跑跑卡丁车网页版</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者开发了 d3d9 到 WebGPU 的代理，使跑跑卡丁车能在浏览器中运行，并提供了在线试玩链接。该方案基于 GitHub 的 v86 项目，在浏览器中模拟虚拟机运行 Windows XP，再运行游戏，理论上可支持任意游戏。

### 关键要点
- 在线试玩：https://retrogaming.dpdns.org/game.html?id=kartrider&v8ft=1
- 技术原理：浏览器内虚拟机（v86）运行 XP，再运行游戏，通过 WebGPU 支持图形。
- 兼容性：支持 WebGPU 的浏览器均可运行，macOS 可用 CrossOver 运行怀旧单机客户端。
- 作者还移植了冒险岛：https://retrogaming.dpdns.org/game.html?id=maplestory

### 评论补充
- 有用户反馈卡顿和无声问题，可能与网络或浏览器性能有关。
- 作者表示项目纯属个人爱好，不盈利。
- 有用户询问怀旧单机客户端，作者提供了网盘链接（需用 CrossOver 运行）。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234766" target="_blank" rel="noopener noreferrer">跑跑卡丁车网页版</a></span><span class="topic-stats">回复 25 · 收藏 12</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234792" markdown="1">
<summary>
<span class="topic-rank">3</span>
<span class="topic-title">软考高级架构师备考经验：选择题刷题、案例靠运气、论文备模板</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
软考高级架构师（高架）备考经验分享，重点在于选择题、案例题和论文的应对策略。

### 关键要点
- **选择题**：刷题库补充基础知识，模拟题能高分过现场基本没问题。
- **案例题**：做历年真题，但运气成分大，可能涉及行业细分知识。
- **论文**：提前准备万能案例和模板，时间紧张，2000字需写到最后几分钟。
- **背诵重点**：软件架构理论章节有约30分是“语文默写题”，需花一周背诵；JAVA EE和Redis八股文是送分题。
- **避坑**：有用户提醒不要看希赛，其押题重点常被避开。

### 评论补充
- 有用户分享具体经验：上半年论文差5分，因概念写偏；选择题有10分左右考火箭工程架构，属于特殊从业群体“开小灶”题。
- 论文模板可借助AI准备，现场凭感觉发挥。
- 多位用户表示也想报考，期待更多经验。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234792" target="_blank" rel="noopener noreferrer">下半年软考开始报名了，准备报高架，求分享备考经验</a></span><span class="topic-stats">回复 8 · 收藏 13</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234734" markdown="1">
<summary>
<span class="topic-rank">4</span>
<span class="topic-title">Codex 与 DeepSeek 切换的多种方案与工具推荐</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

主题讨论如何在 Codex 和 DeepSeek 之间无缝切换，评论提供了多种工具和方法。

### 关键要点

- **直接切换模型**：DeepSeek 官方支持 OpenAI responses API，可通过 cliproxyapi 将 DeepSeek 别名设为 gpt-5.2，在 Codex 中直接切换模型继续使用。
- **工具推荐**：cc-switch 可切换 Codex 模型；pi-coding-agent 适合固定 agent；herdr、codex-router、orca 等工具也被提及。
- **工作流建议**：让 Codex 写文档喂给 DeepSeek；使用 DSH 编写插件，结合 Sol 计划书和 Flash 执行；或使用 FreeBuddy 转接会话。

### 评论补充

- 有用户提到使用便宜供应商（如 nube.sh）可降低成本，但需注意官方账号与第三方 API 的会话不通用。
- 部分回复推荐了个人项目（如 LaunchX），但功能有限。
- 有观点认为模型能力差异不大，关键在于使用方法。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234734" target="_blank" rel="noopener noreferrer">如何无缝丝滑切换使用 Codex 和 DeepSeek</a></span><span class="topic-stats">回复 21 · 收藏 10</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234753" markdown="1">
<summary>
<span class="topic-rank">5</span>
<span class="topic-title">OCR提取扫描件内容：工具与精度提升方案</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
用户寻求将复印件和扫描件内容通过OCR提取的方案，并希望提高精度。主帖提到主流AI（如DS、Gemini）效果不理想，评论中提供了多种工具和方法。

### 关键要点
- **AI模型**：Mistral有专门的OCR模型（评论推荐），Gemini网页版在识别复印件和扫描件上表现优于DS4付费版。
- **工具推荐**：企业微信长按图片提取文字功能（需注册，可自编企业名）、QQ截图自带OCR、方正OCR软件（曾免费）、Azure Documentation Intelligence、飞桨PaddlePaddle（提供OCR库）。
- **精度建议**：对于高要求或复杂文件，人工处理仍是可靠选择；手机自带OCR（如vivo）在手写文件识别上可能优于QQ/微信。

### 评论补充
- 有评论指出，若AI均不理想，可考虑人工OCR。
- 用户询问表格识别精度，但未获明确答复。
- 部分工具需付费或注册，使用前需确认。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234753" target="_blank" rel="noopener noreferrer">有什么办法把复印件和扫描件的内容提取出来吗？</a></span><span class="topic-stats">回复 42 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234716" markdown="1">
<summary>
<span class="topic-rank">6</span>
<span class="topic-title">Pi 用户是否应转向 DSH：优缺点与迁移建议</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

近期 DSH（DeepSeek Harness）热度上升，部分 Pi 用户考虑迁移。讨论显示 DSH 对 DeepSeek 模型有额外优化，且 DeepSeek Flash 价格低廉，但功能尚不完善。

### 关键要点

- **DSH 优势**：对 DeepSeek 模型有加成，适合使用 DeepSeek 的用户；价格便宜。
- **DSH 不足**：极简模式不支持网络搜索和上下文压缩，比 Pi 更简陋；专武未适配自家模型，接第三方模型有风险。
- **迁移建议**：生产项目建议等待数月，待正式版完善后再迁移；个人试用可快速上手。

### 评论补充

- 有用户已用 DSH 开发电子书阅读器，体验良好。
- 部分用户因主力模型多样（如 Gemini、GLM）而不迁移。
- 有用户转回 Pi，认为 DSH 目前不够成熟。
- Pi 用户可参考插件：pi-mcp-adapter、pi-rtk-optimizer、pi-permission-system 等。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234716" target="_blank" rel="noopener noreferrer">各位 Pi 选手转 dsh 了吗</a></span><span class="topic-stats">回复 31 · 收藏 4</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234736" markdown="1">
<summary>
<span class="topic-rank">7</span>
<span class="topic-title">新站GSC曝光195次0点击的排查过程与SEO建议</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者分享新站上线后GSC数据异常（195次曝光、0点击）的排查过程，指出这是新站正常现象，并给出具体分析方法和后续优化计划。

### 关键要点
- **数据解读**：平均排名8.5不代表稳定排名，GSC平均排名受地区、时间、个性化影响；曝光多但点击少可能因排名靠后（如核心词平均排名29.5）或搜索意图不匹配。
- **意图匹配**：导航型关键词（如"deepseek harness github"）用户更可能点击官方GitHub，内容型关键词（如tutorial、setup）更适合新站承接。
- **优化策略**：计划拆分单页为多个独立页面（如/quickstart、/plugins、/vs-claude-code），每个页面针对一个搜索意图；外链通过参与GitHub issue、PR等正常方式建设，避免批量目录。
- **判断标准**：新站有曝光说明Google已开始理解页面，建议先补内容、正常建设外链，两周后复查GSC；若一个月后曝光过千、排名进前十但点击仍少，再检查标题和描述。

### 评论补充
- 有用户反馈新站上线数周仍无自然点击，属常见现象。
- 评论建议利用生态官方清单（如awesome-deepseek-integration，38.8k stars）提交PR获取高质量外链，可复制性强。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234736" target="_blank" rel="noopener noreferrer">新站上线几天， GSC 有 195 次曝光但 0 点击，分享一下我的排查过程</a></span><span class="topic-stats">回复 5 · 收藏 5</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234749" markdown="1">
<summary>
<span class="topic-rank">8</span>
<span class="topic-title">iPhone 18 Pro 非国行购买渠道与风险分析</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
用户想购买非国行 iPhone 18 Pro 首发，但不愿亲自去香港。讨论集中在代购、平台购买和风险提示。

### 关键要点
- **代购渠道**：推荐找靠谱代购（如淘宝“绅士手机”）、苹果团等，但需注意溢价和等待时间。
- **平台风险**：京东海外购被指不靠谱，价格不透明、发货延迟、税率高（25% vs 10%），有用户投诉后退款。
- **港版限制**：有消息称港版可能全 eSIM 且无法绑定大陆运营商，但评论指出外版历来无法直接使用国行 eSIM，需谨慎。
- **其他方式**：线上抢香港首发 walk-in 取货、找海外朋友代购（如澳洲用户可帮买）。

### 评论补充
- 有用户分享京东海外购的糟糕经历，提醒避免。
- 部分用户认为今年芯片缺货可能导致长期缺货，建议等待。
- 本地贩子可写国内 eSIM 但价格昂贵（1000 起），且依赖内鬼，不现实。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234749" target="_blank" rel="noopener noreferrer">iPhone 18 Pro 想买首发 想买非国行版本 有什么渠道吗？</a></span><span class="topic-stats">回复 22 · 收藏 2</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234718" markdown="1">
<summary>
<span class="topic-rank">9</span>
<span class="topic-title">自用 Harness 环境：单 Go 二进制，支持多平台 VM 与 LLM 交互</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者分享了一个自用的 Harness 环境，部署为单个 Go 二进制文件，提供 Web 界面（端口 7777）和 SSH 界面（端口 2222）。Web 界面采用 Mac OS 9 Platinum 风格。该环境通过系统原生方式启动 VM：macOS 使用 Virtualization.framework，Linux 使用 Firecracker，Windows 使用 QEMU on WHPX。用户可以直接与 VM 中的 LLM 聊天，LLM 后端支持 Ollama 或 Codex 订阅登录。在 VM 中构建的 vibe apps 可通过 Cloudflare Tunnel 发布为 HTTPS 域名。每个节点有独立的 Workspace 文件夹，并支持多节点 Mesh 同步。环境内置 Notes 和 Todo 等常用应用，数据同样通过 Mesh 同步。作者还提供了一个示例应用：Ollama Cloud 性能监控（https://ocperf.v2core.com/），项目链接为 https://github.com/livid/exe。

### 关键要点
- 单 Go 二进制部署，跨平台支持（macOS、Linux、Windows）。
- 原生 VM 启动方式，性能较好。
- 集成 LLM 聊天，支持 Ollama 和 Codex。
- 通过 Cloudflare Tunnel 发布应用，简化部署。
- 多节点 Mesh 同步 Workspace 和数据。

### 评论补充
有评论指出，Harness 的核心在于验收（提高任务成功率），而不仅仅是 VM/Docker 等隔离手段。上下文压缩、grep 而非 RAG 等都是提高正确率的手段，但 VM/Docker 本身并不能直接提升正确率。这一观点对理解 Harness 的本质有参考价值。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234718" target="_blank" rel="noopener noreferrer">这是我写了自用的 Harness 环境，长这个样子</a></span><span class="topic-stats">回复 5 · 收藏 7</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234815" markdown="1">
<summary>
<span class="topic-rank">10</span>
<span class="topic-title">DSH 0.1.0-rc.6 服务器部署：nginx 反代、认证、PWA 与移动端适配</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
本文基于 DSH 0.1.0-rc.6 在 Ubuntu 22.04/24.04 上的实际部署经验，详细说明了如何将 DeepSeek Harness 的 Web 界面部署到服务器，并通过 nginx 反向代理实现手机、电脑远程访问。

### 关键要点
- **架构**：浏览器 → nginx（80/443）→ dsh web（127.0.0.1:3080），DSH 默认禁止 `--host 0.0.0.0`，必须通过反代暴露。
- **安装与认证**：需要 Node.js ^22.19.0 或 ＞=24.0.0，通过 `npm install -g @deepseek-ai/dsh` 安装；使用 `dsh-webui-auth` 插件实现登录认证，密码以 scrypt 哈希存储。
- **目录选择器**：远程访问必须固定为 `browse` 模式，通过 `--patch` 参数加载 `patch.yml`，否则 native 对话框会弹在服务器屏幕上。
- **pm2 守护**：配置 `pm2.json` 启动 `dsh --profile web --patch ... --trusted-host 你的域名`，`--trusted-host` 必须设置，否则 API 会被拒。
- **nginx 配置**：包含两个关键坑的解法：
  - 手机端 viewport 过窄：使用 `sub_filter` 将 `initial-scale` 改为 0.7，需先清空 `Accept-Encoding` 头。
  - PWA manifest 302：通过 `location = /manifest.webmanifest` 直接输出硬编码的 manifest 内容，并设置 `display: standalone`。

### 评论补充
无评论。

＞ 注意：nginx 完整配置需参考作者博客（https://php.js.cn/blog/deepseek-harness-on-cloud-vps/），文中未完整给出。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234815" target="_blank" rel="noopener noreferrer">把 DSH（DeepSeek Harness）部署到服务器：手机、电脑实时同步，云端开发</a></span><span class="topic-stats">回复 0 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234707" markdown="1">
<summary>
<span class="topic-rank">11</span>
<span class="topic-title">Manus Pro 年付会员被取消：运营主体迁移引发用户不满</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
用户反映 Manus Pro 年付会员未到期被取消，引发对商业道德和用户权益的讨论。据评论，Manus 近期从 Meta 拆分独立，进行运营主体迁移，导致订阅被取消、数据备份时间有限（如 7 天），部分账号被暂停。有用户称迁移后赠送了会员，订阅可能恢复，但官方未明确说明。

### 关键要点
- 年付用户被取消订阅，且未提前充分通知，引发信任危机。
- 迁移期间数据备份时间短（如 7 天），用户需及时备份。
- 类似问题也出现在其他 AI 产品（如 Copilot 限制高级模型），反映行业通病。

### 评论补充
- 有用户认为 Manus 功能不如 Codex 等竞品，价值有限。
- 部分用户猜测 Manus 将回国圈钱，提醒谨慎购买。
- 建议用户关注官方迁移公告，及时备份数据，并考虑维权。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234707" target="_blank" rel="noopener noreferrer">一年的 Manus Pro 还没有到期了，就给我取消了，毫无商业道德啊！</a></span><span class="topic-stats">回复 22 · 收藏 0</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234724" markdown="1">
<summary>
<span class="topic-rank">12</span>
<span class="topic-title">dsh+DeepSeek Pro 生成 macOS 前端页面实测：成本约0.2美元</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

用户使用 dsh 结合 DeepSeek Pro 的极简模式，通过简单 prompt（`使用 html 实现一个 macos ui ，基本 app 都要有 并且能交互`）生成了 macOS 风格的前端页面，并分享了临时链接。实测效果获得多位网友认可，认为完成度较高，甚至超过部分商业项目。

### 关键要点

- **成本**：生成该页面消耗约 0.2 美元 token 费用。
- **方法**：无需插件，仅使用极简模式，prompt 简洁明确。
- **局限**：因缺乏多模态支持，图标（如废纸篓）生成效果不佳；整体风格更接近 Linux 的 macOS 主题，Dock 栏效果一般。

### 评论补充

- 有用户指出页面细节更像 Linux 桌面，而非真正的 macOS。
- 作者回应图标问题：让 AI 从网上找现成图标，但垃圾桶未匹配成功。
- 临时链接已过期，作者更新后部分用户仍无法打开，但多数人认为效果不错。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234724" target="_blank" rel="noopener noreferrer">dsh + deepseek pro 前端能力感觉还行了，让他生成一个 macos 的前端页面</a></span><span class="topic-stats">回复 14 · 收藏 2</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234699" markdown="1">
<summary>
<span class="topic-rank">13</span>
<span class="topic-title">AI开发中框架与模型的作用对比及实践建议</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

主题讨论在AI辅助开发中，第三方harness（工作流框架）与模型能力哪个更重要。作者采用“古法AI”流程：先让AI写框架、工具类，再补模块和测试，遇到问题让AI重做。他观察到新框架越来越复杂，但对模型要求反而更高，老模型很快被淘汰，因此质疑框架的实际价值。

### 关键要点

- **模型能力是基础**：多数评论认为模型比框架更重要，资本投入也偏向模型。
- **框架的作用是放大潜力**：好的harness能最大化模型能力，但无法弥补模型本身的不足。
- **框架复杂度随业务增长**：业务越来越复杂，框架也随之复杂，对模型理解能力要求更高。
- **实践建议**：构建自己的测试集，新工具出现时进行测试，可缓解焦虑。

### 评论补充

- 有评论区分“harness engineering”与项目代码框架，认为人类工程师定的结构仍优于AI自由发挥。
- 比喻“差生文具多”说明弱模型更需要工程约束。
- 建议关注模型训练环境与官方harness的关系，理解模型能力边界。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234699" target="_blank" rel="noopener noreferrer">AI 开发，框架的作用大还是模型的作用大</a></span><span class="topic-stats">回复 10 · 收藏 3</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234777" markdown="1">
<summary>
<span class="topic-rank">14</span>
<span class="topic-title">中文搜索对比：Bing、Google 与百度使用经验</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

主题讨论中文搜索场景下不同搜索引擎的优劣。发帖者指出，对于中文互联网热门词汇，Bing 的搜索结果优于 Google（测试 IP 为新加坡）。评论中多位用户分享了实际使用经验，普遍认为 Bing 在中文搜索上比百度干净，但存在广告和钓鱼风险。

### 关键要点

- **Bing**：国内搜索比百度强，无推荐词、卡片和热榜，本地收录适配较好；但海外版可能推送钓鱼网站，广告位较多。
- **Google**：默认足够，但中文内容可能不如 Bing 精准；可通过参数优化搜索体验。
- **百度**：广告多，多数用户已弃用。

### 评论补充

- 有用户推荐 DuckDuckGo 和 Kagi 作为替代。
- 有用户分享了带参数的 Google 搜索链接，可设置新标签页打开、地区为美国、关闭个性化搜索、使用传统模式，并可排除 CSDN、抖音等垃圾站点。

**结论**：中文搜索可优先考虑 Bing，Google 可通过参数优化，百度不推荐。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234777" target="_blank" rel="noopener noreferrer">中文圈子搜索还是得要 Bing</a></span><span class="topic-stats">回复 6 · 收藏 4</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234768" markdown="1">
<summary>
<span class="topic-rank">15</span>
<span class="topic-title">3500元内65寸电视推荐：TCL系列与选购要点</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

预算 3500 元内为老人选购 65 寸电视，多位用户推荐 TCL 系列，认为其画质和系统体验较好。具体型号包括 T6L、T6L U、T7M Pro 等，价格约 3000 元上下。有用户提醒避免购买雷鸟，但未说明具体原因，也有用户表示雷鸟性价比高，存在争议。

### 关键要点

- **TCL 推荐**：TCL 旗下有华星光电，面板优势明显；系统简单无广告，适合老人使用。
- **型号参考**：T6L 雾面屏，画质细腻；T6L U 接近 3000 元；T7M Pro 采用 SQD-Mini LED 技术，色彩更好，但价格较高（约 4899 元）。
- **选购建议**：关注背光分区数、低反光屏幕；音响功率不必过高，40W 足够。
- **尺寸选择**：预算允许可考虑 75 寸，更大尺寸体验更好。

### 评论补充

- 有用户提供参考网站 tvlabs.cn/buyit，可查询电视评测。
- 部分用户对雷鸟电视评价不一，建议谨慎选择。
- 国补后 65T6 价格约 2965 元，可作为参考。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234768" target="_blank" rel="noopener noreferrer">2026 年 8 月， 65 寸电视综合水平和性价比来看有推荐的吗？</a></span><span class="topic-stats">回复 14 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234773" markdown="1">
<summary>
<span class="topic-rank">16</span>
<span class="topic-title">RustDesk 支持 Wayland 无人值守远程访问，仅 nightly 版可用</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
RustDesk 现已支持 Wayland 下的无人值守远程访问，解决了 Linux 用户从 X11 迁移到 Wayland 的一大痛点。目前该功能仅存在于 nightly 版本中，具体为 `rustdesk-unattended-wayland-1.4.9-x86_64.deb`，适用于 Debian/Ubuntu 系系统。

### 关键要点
- 支持无人值守访问，被访问设备锁屏状态下也可连接。
- 已在 Debian sid + GNOME 50 上测试通过。
- 官方计划在稳定后支持 Fedora 和 Arch Linux，并纳入标准发行版。
- 有用户搭配 IPv6 直连日常使用，体验良好。

### 评论补充
- 有用户询问 Arch + Niri 是否可用，目前官方尚未支持。
- 下载链接指向 GitHub nightly 发布页，需注意版本更新。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234773" target="_blank" rel="noopener noreferrer">RustDesk 现已支持 Wayland 无人值守远程访问</a></span><span class="topic-stats">回复 5 · 收藏 0</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234747" markdown="1">
<summary>
<span class="topic-rank">17</span>
<span class="topic-title">联通宽带大流量上传被限速的应对与维权经验</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

用户反映常州联通宽带（1000M下行/50M上行，公网IP，桥接）在向百度网盘上传约200GB数据后被限速至5Mb，同时部分App（如抖音）加载异常。运营商客服称光猫端口不匹配，重启后公网IP从常州变为徐州，师傅上门拍照但未解封。

### 关键要点

- **限速现象**：上传大流量后，网盘上传被限速，但测速网站正常，疑似运营商对特定流量或应用进行限速。
- **应对方法**：
  - 使用`fakehttp`工具（但可能已失效）。
  - 租用副卡配合CPE设备进行上传。
  - 购买流量卡进行传输。
  - 耐心等待，限速可能自动解除。
- **维权经验**：
  - 有用户反馈，武汉地区师傅上门拍照、签保证书后可恢复。
  - 常州用户尝试工信部、通管局、12345投诉均无效，联通最终回复“只认可内部测速，外部上传不达标与联通无关”，建议起诉。
  - 有用户消费399元/月仍被限速，说明限速与消费水平无关。

### 评论补充

- 有用户表示南京联通上传1TB至夸克网盘未限速，但江苏地区可能整体存在限速风险。
- 三大运营商均可能对大量上传进行限制，需注意使用场景。
- 若遇限速，可尝试更换运营商或使用其他网络通道。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234747" target="_blank" rel="noopener noreferrer">联通宽带备份数据到百度网盘结果被限速</a></span><span class="topic-stats">回复 14 · 收藏 0</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234769" markdown="1">
<summary>
<span class="topic-rank">18</span>
<span class="topic-title">SuperGrok Heavy 体验与购买建议：额度、能力与赠品</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容

主题讨论 SuperGrok Heavy 是否值得购买，结合用户实际体验和赠品信息。多数用户认为其能力并非顶尖，但性价比尚可，适合作为补充工具。

### 关键要点

- **使用额度**：有用户每天高强度使用 10 小时，用量仅占 10%，7 天重置，实际使用约 70%，额度充足。
- **能力评价**：能力不是最顶级的，与 GPT Sol 相比智商有差距，严肃编程场景需谨慎。
- **赠品福利**：购买 Heavy 可免费获得 Cursor Ultra 订阅，且该福利已改为在 Heavy 有效期内持续有效，而非最初的一个月限制。
- **价格变化**：早期 99 美元购买的用户被认为赚到，现价 300 美元，性价比下降。

### 评论补充

- 有用户提到可通过 nodeseek 获取相关优惠信息。
- 部分用户认为有 Codex 且预算充足时可考虑，但不应作为唯一主力工具。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234769" target="_blank" rel="noopener noreferrer">SuperGrok Heavy 值得入手吗？ Codex 还有 2 天到期～ 想换 老铁们说说体验～</a></span><span class="topic-stats">回复 10 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234785" markdown="1">
<summary>
<span class="topic-rank">19</span>
<span class="topic-title">基于 Cloudflare Workers 的云端 Agent 实现与改造</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
该主题介绍了一个基于 Cloudflare Workers 的云端 Serverless Agent 项目（pi-on-cf），将 Pi 的 agent loop 运行在 serverless 环境中，并保持 Agent 状态。原作者为 Cloudflare 员工 Harshil Patel，作者 fork 后进行了多项改造，使其更实用。

### 关键要点
- **改造内容**：加入 Bash、Curl、Git 支持，重写 Git 实现，采用流式处理解决 128 MB 内存限制，使内存占用与仓库大小无关。
- **运行限制**：Cloudflare Free Plan 下，Agent 每天可连续运行约 25.2 小时，基本满足长期运行需求。
- **使用场景**：作者用于维护 Git 文档库，让 Agent 获取最新知识作为 AI 客服，实现知识与 Agent 分离。
- **技术细节**：fs 使用 memfs 模拟，默认未开启持久化，需自行添加。

### 评论补充
无评论。

该项目提供了可复用的实现思路和改造经验，适合对 Serverless Agent 感兴趣的开发者参考。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234785" target="_blank" rel="noopener noreferrer">pi-on-cf 又叫小 codex work</a></span><span class="topic-stats">回复 0 · 收藏 1</span></p>

</div>

</details>

<details class="topic-card" data-topic-id="1234746" markdown="1">
<summary>
<span class="topic-rank">20</span>
<span class="topic-title">TexLite：轻量级类 Overleaf 的 LaTeX 写作平台</span>
</summary>

<div class="topic-content" markdown="1">

<div class="topic-article" markdown="1">

### 核心内容
作者分享了一个自建的轻量级 LaTeX 写作平台 TexLite（GitHub: SWUFE-DB-Group/TexLite），定位为 Overleaf 的轻量替代品，适合自托管。

### 关键要点
- **轻量设计**：仅依赖 npm，利用宿主已安装的 TeX Live 或 MiKTeX，不打包完整 TeX 环境，因此比 Overleaf 社区版更轻。
- **功能现状**：目前不支持导出 docx（作者建议用 pandoc 转换，但格式不完美），也未集成 LLM 辅助写作，作者明确表示暂不引入。
- **部署方式**：目前无 Docker 镜像，需手动安装依赖；作者认为 Overleaf 官方镜像臃肿，故刻意保持轻量。

### 评论补充
- 有用户建议增加 LLM 协作功能，并指出可参考 OpenPrism（OpenDCAI/OpenPrism）的 AI 集成，但作者认为手动复制到 ChatGPT 更灵活。
- 有用户询问 Docker 支持，作者回应暂未提供，但解释了设计取舍。

**适用场景**：适合熟悉 LaTeX 且希望自托管、追求轻量部署的用户；若需要 AI 辅助或 docx 导出，当前版本可能不满足。

</div>

<p class="topic-source"><span class="topic-source-link">原链接：<a href="https://www.v2ex.com/t/1234746" target="_blank" rel="noopener noreferrer">一个类 overleaf 的 latex 写作平台</a></span><span class="topic-stats">回复 6 · 收藏 2</span></p>

</div>

</details>
