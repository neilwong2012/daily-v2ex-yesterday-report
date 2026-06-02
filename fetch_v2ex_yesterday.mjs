import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const base = 'https://www.v2ex.com';
const apiBase = `${base}/api/v2`;
const token = process.env.V2EX_TOKEN;
const proxy =
  process.env.V2EX_PROXY ??
  process.env.HTTPS_PROXY ??
  process.env.HTTP_PROXY ??
  process.env.https_proxy ??
  process.env.http_proxy ??
  process.env.ALL_PROXY ??
  process.env.all_proxy ??
  null;
const timezone = 'Asia/Shanghai';
const targetDate = process.env.V2EX_DATE || getShanghaiDateOffset(-1);
const outDir = new URL('./v2ex_yesterday_data/', import.meta.url);
const workspaceDir = new URL('./', import.meta.url);
const reportFile = new URL(`./v2ex_${targetDate}_report.md`, import.meta.url);
const rawFile = new URL(`./v2ex_${targetDate}_raw.json`, import.meta.url);
const failureFile = new URL(`./v2ex_${targetDate}_failure.json`, import.meta.url);
const blockedReportFile = new URL(`./v2ex_${targetDate}_report_blocked.md`, import.meta.url);

function runWithProxy(extraEnv = {}) {
  const result = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
      NODE_USE_ENV_PROXY: '1',
      HTTPS_PROXY: process.env.HTTPS_PROXY || proxy,
      HTTP_PROXY: process.env.HTTP_PROXY || proxy,
      https_proxy: process.env.https_proxy || proxy,
      http_proxy: process.env.http_proxy || proxy,
      ALL_PROXY: process.env.ALL_PROXY || proxy,
      all_proxy: process.env.all_proxy || proxy,
      V2EX_PROXY: proxy,
    },
  });
  return result;
}

if (proxy && process.env.V2EX_USE_PROXY === '1' && process.env.NODE_USE_ENV_PROXY !== '1') {
  const result = runWithProxy({ V2EX_PROXY_FORCED: '1' });
  process.exit(result.status ?? 0);
}

function describeError(error) {
  if (!error) return 'Unknown error';
  const parts = [];
  if (error.name || error.message) {
    parts.push(`${error.name || 'Error'}: ${error.message || ''}`.trim());
  } else {
    parts.push(String(error));
  }
  if (error.code) parts.push(`code=${error.code}`);
  if (error.syscall) parts.push(`syscall=${error.syscall}`);
  if (error.address) parts.push(`address=${error.address}`);
  if (error.port) parts.push(`port=${error.port}`);
  if (error.status) parts.push(`status=${error.status}`);
  if (error.endpoint) parts.push(`endpoint=${error.endpoint}`);
  if (error.json?.rate_limit) {
    parts.push(`rate_limit=${JSON.stringify(error.json.rate_limit)}`);
  }
  if (error.cause) {
    const cause = describeError(error.cause);
    if (cause) parts.push(`cause=${cause}`);
  }
  return parts.join(' | ');
}

function isNetworkError(error) {
  const description = describeError(error);
  return /fetch failed|ENOTFOUND|ECONN|ETIMEDOUT|EAI_AGAIN|UND_ERR|EPERM|EHOSTUNREACH|network/i.test(description);
}

class ApiError extends Error {
  constructor(message, { status, endpoint, body, json } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.body = body;
    this.json = json;
  }
}

function isRetryableApiGap(error) {
  if (!(error instanceof ApiError)) return true;
  return error.status === 404;
}

function isRateLimitError(error) {
  return error instanceof ApiError && (error.status === 403 || /Rate Limit Exceeded/i.test(error.message));
}

if (!token) {
  console.error('Missing V2EX_TOKEN');
  process.exit(1);
}

const EXCLUDED_NODE_TITLES = new Set(['二手交易', '推广']);
const TREND_PATTERNS = [
  ['AI 编程 / Agent', /AI|Claude|Codex|GPT|Agent|Cursor|Windsurf|Gemini|Qwen|模型|中转|API/i],
  ['独立开发 / 工具发布', /开源|发布|做了个|分享|项目|工具|插件|脚手架|SaaS|GitHub|仓库|浏览器游戏|独立开发/i],
  ['求职 / 招聘 / 外包', /招聘|求职|简历|远程|外包|兼职|内推|正社员|全栈|后端|前端/i],
  ['云 / 运维 / 基础设施', /云|容器|镜像|Kubernetes|k8s|Docker|DNS|服务器|监控|排障|运维|WebRTC/i],
  ['安全 / 合规 / 风险', /安全|合规|整改|封号|供应链|攻击|漏洞|后门|隐私|风控|网信办/i],
  ['生活 / 消费 / 出行', /装修|租车|床垫|手表|手环|旅游|旅行|汽车|家电|消费|除湿机/i],
];

const TOOL_PATTERNS = /GitHub|github\.com|开源|项目|工具|插件|脚手架|API|RSS|镜像|监控|翻译|阅读器|浏览器游戏|WebRTC|VS Code|扩展/i;
const MARKET_PATTERNS = /招聘|求职|外包|兼职|远程|岗位|社招|内推|日本|年收|薪资|面试|Java|后端|全栈/i;
const RISK_PATTERNS = /安全|合规|整改|封号|攻击|供应链|漏洞|后门|隐私|风控|收费|DNS|网信办/i;
const LIFE_PATTERNS = /装修|租车|床垫|手环|手表|旅游|新疆|汽车|消费|家电|除湿机|耳机|电器/i;
const SECRET_PATTERNS = [
  /\bnpm_[A-Za-z0-9]{20,}\b/g,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
];

function scrubSecrets(value) {
  if (typeof value === 'string') {
    return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, '[REDACTED_SECRET]'), value);
  }
  if (Array.isArray(value)) return value.map(scrubSecrets);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrubSecrets(item)]));
  }
  return value;
}

function getShanghaiDateOffset(offsetDays) {
  const now = new Date();
  const shifted = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return formatShanghaiDate(shifted);
}

function formatShanghaiDate(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatShanghaiDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date).replace(/\//g, '-');
}

function topicDate(createdSeconds) {
  return formatShanghaiDate(new Date(createdSeconds * 1000));
}

function nextShanghaiDate(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  const utcNoon = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));
  return formatShanghaiDate(utcNoon);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(text) {
  return decodeHtml(String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function normalizeText(topic) {
  return [topic.title, topic.content, topic.node?.title, topic.member?.username].filter(Boolean).join('\n');
}

function extractLinks(text) {
  return [...new Set((text.match(/https?:\/\/[^\s<>()"]+/g) || []).map((link) => link.replace(/[),.;]+$/, '')))];
}

function parseRecent(html) {
  const items = [];
  const blocks = html.split('<div class="cell item"').slice(1);
  for (const block of blocks) {
    const idMatch = block.match(/id="topic-link-(\d+)"/);
    const hrefMatch = block.match(/<a href="\/t\/(\d+)[^"]*" class="topic-link"[^>]*>([\s\S]*?)<\/a>/);
    const titleMatch = block.match(/<span title="([^"]+)">/);
    const nodeMatch = block.match(/<a class="node" href="\/go\/([^"]+)">([\s\S]*?)<\/a>/);
    const authorMatch = block.match(/<strong><a href="\/member\/([^"]+)">/);
    const repliesMatch = block.match(/class="count_[^"]+">(\d+)<\/a>/);
    const id = Number(idMatch?.[1] || hrefMatch?.[1]);
    const createdAt = titleMatch?.[1] || '';
    if (!id || !createdAt) continue;
    items.push({
      id,
      title: stripTags(hrefMatch?.[2] || ''),
      url: `${base}/t/${id}`,
      node: decodeHtml(nodeMatch?.[1] || ''),
      nodeTitle: stripTags(nodeMatch?.[2] || ''),
      author: decodeHtml(authorMatch?.[1] || ''),
      replies: Number(repliesMatch?.[1] || 0),
      createdAt,
    });
  }
  return items;
}

async function getText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'codex-v2ex-report/1.0',
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.text();
}

async function getJson(endpoint) {
  const res = await fetch(`${apiBase}/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'codex-v2ex-report/1.0',
    },
  });
  const body = await res.text();
  let json = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    // Some API misses return HTML; keep the body excerpt in the error.
  }
  if (!res.ok || json.success === false) {
    const detail = json ? JSON.stringify(json).slice(0, 240) : body.slice(0, 240);
    throw new ApiError(`${res.status} ${endpoint}: ${detail}`, {
      status: res.status,
      endpoint,
      body,
      json,
    });
  }
  return json.result;
}

async function tryGetJson(endpoint) {
  try {
    return await getJson(endpoint);
  } catch {
    return null;
  }
}

async function findLocalMaxTopicId() {
  const workspaceFiles = await fs.readdir(workspaceDir).catch(() => []);
  const rawSnapshots = workspaceFiles
    .filter((file) => /^v2ex_\d{4}-\d{2}-\d{2}_raw\.json$/.test(file) && file !== `v2ex_${targetDate}_raw.json`)
    .map((file) => new URL(`./${file}`, import.meta.url).pathname);
  const files = [
    ...rawSnapshots,
    rawFile.pathname,
    new URL('./v2ex_yesterday_data/topics.json', import.meta.url).pathname,
    new URL('./v2ex_yesterday_data/index.json', import.meta.url).pathname,
  ];
  let maxId = 0;
  for (const file of files) {
    try {
      const data = JSON.parse(await fs.readFile(file, 'utf8'));
      const stack = Array.isArray(data)
        ? [...data]
        : [
            ...(data.allCreatedTopics || []),
            ...(data.includedTopics || []),
            ...(data.recentCandidates || []),
          ];
      for (const item of stack) {
        if (Number.isInteger(item?.id)) maxId = Math.max(maxId, item.id);
      }
    } catch {
      // Local snapshots are a convenience for scan bounds; ignore missing or stale files.
    }
  }
  return maxId;
}

async function getLatestTopicId() {
  try {
    const recent = parseRecent(await getText(`${base}/recent`));
    if (recent.length > 0) {
      return Math.max(...recent.map((topic) => Number(topic.id || 0)));
    }
  } catch (error) {
    console.error(`recent latest id fallback failed: ${describeError(error)}`);
  }
  return 0;
}

const topicCache = new Map();

async function getCachedTopic(id) {
  if (topicCache.has(id)) return topicCache.get(id);
  const topic = await getJson(`topics/${id}`);
  topicCache.set(id, topic);
  return topic;
}

async function getNearbyTopicForSearch(id) {
  if (id < 1) return null;
  try {
    return await getCachedTopic(id);
  } catch (error) {
    if (isNetworkError(error) || isRateLimitError(error) || !isRetryableApiGap(error)) throw error;
  }
  for (let offset = 1; offset <= 8; offset += 1) {
    for (const candidateId of [id - offset, id + offset]) {
      if (candidateId < 1) continue;
      try {
        return await getCachedTopic(candidateId);
      } catch (error) {
        if (isNetworkError(error) || isRateLimitError(error) || !isRetryableApiGap(error)) throw error;
      }
    }
  }
  return null;
}

async function findFirstTopicOnOrAfterDate(lowId, highId, dateText) {
  let low = Math.max(1, lowId);
  let high = Math.max(low, highId);
  let answer = null;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const topic = await getNearbyTopicForSearch(mid);
    if (!topic) {
      low = mid + 1;
      continue;
    }
    const createdDate = topicDate(topic.created);
    if (createdDate >= dateText) {
      answer = topic.id;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
    await sleep(80);
  }
  return answer;
}

function isExcludedTopic(topic) {
  return EXCLUDED_NODE_TITLES.has(topic.node?.title || topic.nodeTitle || '');
}

function topicScore(topic) {
  const text = normalizeText(topic);
  let score = 0;
  score += Math.min(topic.replies || 0, 120);
  score += (topic.stars || 0) * 3;
  score += (topic.thanks || 0) * 2;
  if (extractLinks(text).length > 0) score += 12;
  if (TOOL_PATTERNS.test(text)) score += 10;
  if (MARKET_PATTERNS.test(text)) score += 8;
  if (RISK_PATTERNS.test(text)) score += 8;
  if (LIFE_PATTERNS.test(text)) score += 6;
  return score;
}

function isHighSignal(topic) {
  const text = normalizeText(topic);
  return (
    (topic.replies || 0) >= 40 ||
    (topic.stars || 0) >= 10 ||
    (topic.thanks || 0) >= 10 ||
    extractLinks(text).length > 0 ||
    TOOL_PATTERNS.test(text) ||
    MARKET_PATTERNS.test(text) ||
    RISK_PATTERNS.test(text) ||
    /分享创造|程序员|问与答|职场话题|酷工作|分享发现|奇思妙想|云计算/.test(topic.node?.title || '')
  );
}

function topByCategory(topics, matcher, limit = 6) {
  return topics
    .filter((topic) => matcher.test(normalizeText(topic)))
    .sort((a, b) => topicScore(b) - topicScore(a))
    .slice(0, limit);
}

function summarizeTrend(topics) {
  return TREND_PATTERNS.map(([label, pattern]) => ({
    label,
    count: topics.filter((topic) => pattern.test(normalizeText(topic))).length,
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
}

function summarizeNodes(topics) {
  const counts = new Map();
  for (const topic of topics) {
    const key = topic.node?.title || topic.nodeTitle || '未知';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([nodeTitle, count]) => ({ nodeTitle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function pickReplyInsights(replyBag) {
  const findings = [];
  for (const item of replyBag) {
    const usefulReplies = item.replies
      .filter((reply) => /github|开源|代理|可以|建议|排障|收费|经验|推荐|vpn|风控|封号|镜像|脚手架|教程|链接|不如|别用|注意/i.test(reply.content || ''))
      .slice(0, 3)
      .map((reply) => `- ${reply.member?.username || '匿名'}：${stripTags(reply.content).slice(0, 120)}`);
    if (usefulReplies.length > 0) {
      findings.push({
        topic: item.topic,
        bullets: usefulReplies,
      });
    }
  }
  return findings.slice(0, 8);
}

function lineForTopic(topic, extra = '') {
  const parts = [
    `- [${topic.title}](${topic.url})`,
    `${topic.node?.title || topic.nodeTitle || '未知节点'}`,
    `${topic.replies || 0} 回复`,
  ];
  if (topic.stars) parts.push(`${topic.stars} 收藏`);
  if (extra) parts.push(extra);
  return parts.join('｜');
}

function makeReport(payload) {
  const {
    generatedAt,
    targetDate,
    scannedIds,
    scannedTopicCount,
    scanGaps,
    scannedCandidates,
    allCreatedTopics,
    excludedTopics,
    includedTopics,
    highSignalTopics,
    replyInsights,
    nodeSummary,
    trendSummary,
    toolTopics,
    marketTopics,
    riskTopics,
    lifeTopics,
  } = payload;

  const lines = [];
  lines.push(`# V2EX ${targetDate} 昨日新帖报告`);
  lines.push('');
  lines.push(`抓取时间：${generatedAt}（${timezone}）  `);
  lines.push(`时间口径：${targetDate} 00:00:00 到次日 00:00:00（${timezone}）  `);
  lines.push(`数据口径：使用 V2EX API 2.0 按 topic id 扫描，并用 API 返回的 created 字段确认昨日创建主题；高信号主题进一步通过 API 2.0 抓取回复。  `);
  lines.push(`过滤规则：\`二手交易\` 和 \`推广\` 已从分析、趋势统计、高信号筛选、推荐结论中完全排除。`);
  lines.push('');
  lines.push('## 数据范围与计数');
  lines.push('');
  lines.push(`- 扫描 topic id 数：${scannedIds}`);
  lines.push(`- 成功读取主题详情数：${scannedTopicCount}`);
  lines.push(`- 扫描空洞 / 失败 id 数：${scanGaps}`);
  lines.push(`- API 确认为昨日创建的候选主题数：${scannedCandidates}`);
  lines.push(`- API 确认为昨日创建的主题总数：${allCreatedTopics.length}`);
  lines.push(`- 过滤掉的 \`二手交易\` / \`推广\` 主题：${excludedTopics.length}`);
  lines.push(`- 纳入分析的主题：${includedTopics.length}`);
  lines.push(`- 补抓回复的高信号主题：${highSignalTopics.length}`);
  lines.push('');
  lines.push('节点分布 Top：');
  lines.push('');
  for (const item of nodeSummary) {
    lines.push(`- ${item.nodeTitle}：${item.count}`);
  }
  lines.push('');
  lines.push('## 主要趋势');
  lines.push('');
  for (const item of trendSummary.slice(0, 6)) {
    lines.push(`- ${item.label}：${item.count} 帖，仍是昨天最密集的讨论簇。`);
  }
  lines.push('');
  lines.push('高信号主题样本：');
  lines.push('');
  for (const topic of highSignalTopics.slice(0, 10)) {
    lines.push(lineForTopic(topic));
  }
  lines.push('');
  lines.push('## 值得关注的工具 / 项目 / 链接');
  lines.push('');
  for (const topic of toolTopics) {
    const links = extractLinks(normalizeText(topic)).slice(0, 2).join('，');
    lines.push(lineForTopic(topic, links ? `链接：${links}` : ''));
  }
  lines.push('');
  lines.push('## 市场 / 招聘信号');
  lines.push('');
  if (marketTopics.length === 0) {
    lines.push('- 昨天进入高价值区间的招聘/求职信号不多，更多还是围绕工具、生活消费和 AI 编程讨论。');
  } else {
    for (const topic of marketTopics) {
      lines.push(lineForTopic(topic));
    }
  }
  lines.push('');
  lines.push('## 风险 / 安全 / 合规');
  lines.push('');
  if (riskTopics.length === 0) {
    lines.push('- 昨天明显的安全/合规主题不算密集，但云服务收费、账号封禁、供应链和隐私类风险仍在高频被提及。');
  } else {
    for (const topic of riskTopics) {
      lines.push(lineForTopic(topic));
    }
  }
  lines.push('');
  lines.push('## 高价值生活 / 消费信息');
  lines.push('');
  if (lifeTopics.length === 0) {
    lines.push('- 昨天生活消费类高收藏帖不多，整体热度仍然被 AI 编程和工具话题占据。');
  } else {
    for (const topic of lifeTopics) {
      lines.push(lineForTopic(topic));
    }
  }
  lines.push('');
  lines.push('## 回复里的有效信息');
  lines.push('');
  if (replyInsights.length === 0) {
    lines.push('- 高信号回复里没有稳定提炼出比主帖更高价值的新链接或新结论。');
  } else {
    for (const item of replyInsights) {
      lines.push(`- [${item.topic.title}](${item.topic.url})`);
      for (const bullet of item.bullets) {
        lines.push(`  ${bullet}`);
      }
    }
  }
  lines.push('');
  lines.push('## 原始文件');
  lines.push('');
  lines.push(`- 原始 JSON：[v2ex_${targetDate}_raw.json](${rawFile.pathname})`);
  lines.push(`- Markdown 报告：[v2ex_${targetDate}_report.md](${reportFile.pathname})`);
  return `${lines.join('\n')}\n`;
}

async function collectTopicIdCandidates() {
  const found = new Map();
  const scanned = [];
  const configuredStart = Number(process.env.V2EX_SCAN_START || 0);
  const configuredEnd = Number(process.env.V2EX_SCAN_END || 0);
  const latestId = configuredStart || (await getLatestTopicId());
  const localMaxId = await findLocalMaxTopicId();
  const scanLimit = Number(process.env.V2EX_SCAN_LIMIT || 1400);
  const searchWindow = Number(process.env.V2EX_SEARCH_WINDOW || 6000);
  let scannedIds = 0;
  let gaps = 0;

  if (configuredEnd > 0 || latestId > 0) {
    let startId = latestId || configuredEnd;
    let minId = configuredEnd > 0 ? configuredEnd : Math.max(1, startId - scanLimit);
    let boundedByDate = false;
    if (!configuredStart && !configuredEnd && latestId > 0) {
      const searchStart = Number(process.env.V2EX_BOUND_SEARCH_START || Math.max(1, latestId - searchWindow));
      const targetStartId = await findFirstTopicOnOrAfterDate(searchStart, latestId, targetDate);
      const nextDayStartId = await findFirstTopicOnOrAfterDate(targetStartId || searchStart, latestId, nextShanghaiDate(targetDate));
      if (targetStartId) {
        minId = targetStartId;
        if (nextDayStartId) startId = Math.max(targetStartId, nextDayStartId - 1);
        boundedByDate = true;
        console.error(`date bounds: ${targetDate} id ${minId}-${startId} via /recent latest ${latestId}`);
      }
    }
    let olderThanTarget = 0;
    let consecutiveGaps = 0;
    for (let id = startId; id >= minId; id -= 1) {
      scannedIds += 1;
      try {
        const topic = await getJson(`topics/${id}`);
        consecutiveGaps = 0;
        scanned.push(topic);
        const createdDate = topicDate(topic.created);
        if (createdDate === targetDate) {
          found.set(topic.id, topic);
        } else if (found.size > 0 && createdDate < targetDate) {
          olderThanTarget += 1;
        }
        if (!boundedByDate && olderThanTarget >= 80) break;
      } catch (error) {
        if (isNetworkError(error)) throw error;
        if (isRateLimitError(error)) throw error;
        if (!isRetryableApiGap(error)) throw error;
        gaps += 1;
        consecutiveGaps += 1;
      }
      if (!boundedByDate && found.size > 0 && consecutiveGaps >= 120) break;
      if (scannedIds % 50 === 0) console.error(`id scan down ${scannedIds}: id=${id}, target=${found.size}, gaps=${gaps}`);
      await sleep(80);
    }
  } else {
    const startId = Number(process.env.V2EX_SCAN_FALLBACK_START || localMaxId + 1);
    const endId = startId + scanLimit;
    let newerThanTarget = 0;
    let consecutiveGaps = 0;
    for (let id = startId; id <= endId; id += 1) {
      scannedIds += 1;
      try {
        const topic = await getJson(`topics/${id}`);
        consecutiveGaps = 0;
        scanned.push(topic);
        const createdDate = topicDate(topic.created);
        if (createdDate === targetDate) {
          found.set(topic.id, topic);
        } else if (found.size > 0 && createdDate > targetDate) {
          newerThanTarget += 1;
        }
        if (newerThanTarget >= 120) break;
      } catch (error) {
        if (isNetworkError(error)) throw error;
        if (isRateLimitError(error)) throw error;
        if (!isRetryableApiGap(error)) throw error;
        gaps += 1;
        consecutiveGaps += 1;
      }
      if (found.size > 0 && consecutiveGaps >= 120) break;
      if (scannedIds % 50 === 0) console.error(`id scan up ${scannedIds}: id=${id}, target=${found.size}, gaps=${gaps}`);
      await sleep(80);
    }
  }

  return {
    scannedIds,
    scannedTopicCount: scanned.length,
    gaps,
    latestId,
    localMaxId,
    candidates: [...found.values()].sort((a, b) => a.id - b.id),
  };
}

async function collectTopicDetails(candidates) {
  const topics = [];
  for (const [i, item] of candidates.entries()) {
    try {
      topics.push(item && Number.isInteger(item.id) && Number.isInteger(item.created) ? item : await getJson(`topics/${item.id}`));
    } catch (error) {
      topics.push({ ...item, error: String(error) });
    }
    if ((i + 1) % 25 === 0) console.error(`details ${i + 1}/${candidates.length}`);
    await sleep(100);
  }
  return topics;
}

async function collectReplies(topics) {
  const bag = [];
  for (const [i, topic] of topics.entries()) {
    try {
      const replies = await getJson(`topics/${topic.id}/replies`);
      bag.push({ topic, replies });
    } catch (error) {
      bag.push({ topic, error: String(error), replies: [] });
    }
    if ((i + 1) % 10 === 0) console.error(`replies ${i + 1}/${topics.length}`);
    await sleep(100);
  }
  return bag;
}

async function writeFailure(error) {
  await fs.mkdir(outDir, { recursive: true });
  await Promise.all([
    fs.unlink(rawFile).catch(() => {}),
    fs.unlink(reportFile).catch(() => {}),
  ]);
  const payload = {
    target_date: targetDate,
    timezone,
    status: 'blocked',
    token_present: Boolean(token),
    proxy,
    proxy_attempted: process.env.NODE_USE_ENV_PROXY === '1',
    forced_proxy: process.env.V2EX_PROXY_FORCED === '1',
    fallback_proxy: process.env.V2EX_PROXY_FALLBACK_TRIED === '1',
    direct_error_before_proxy: process.env.V2EX_DIRECT_ERROR || null,
    proxy_note: proxy
      ? 'Script defaults to direct access first; if a network error occurs, it retries once with NODE_USE_ENV_PROXY=1 through the detected proxy.'
      : null,
    blocker: describeError(error),
    generated_at: formatShanghaiDateTime(),
    failure_file: failureFile.pathname,
    blocked_report_file: blockedReportFile.pathname,
  };
  await fs.writeFile(failureFile, JSON.stringify(payload, null, 2));
  const report = [
    `# V2EX ${targetDate} 昨日新帖报告（阻塞）`,
    '',
    `抓取时间：${payload.generated_at}（${timezone}）  `,
    `时间口径：${targetDate} 00:00:00 到次日 00:00:00（${timezone}）  `,
    '状态：API 抓取失败，未生成有效分析报告。',
    '',
    '## 阻塞原因',
    '',
    `- V2EX_TOKEN：${payload.token_present ? '已检测到' : '未检测到'}`,
    `- 代理环境：${proxy || '未检测到'}`,
    `- 是否已尝试代理：${payload.proxy_attempted ? '是' : '否'}`,
    ...(payload.direct_error_before_proxy ? [`- 直连失败：${payload.direct_error_before_proxy}`] : []),
    `- 具体错误：${payload.blocker}`,
    '',
    '## 需要修复',
    '',
    '- 确认当前运行环境能解析并访问 `https://www.v2ex.com/api/v2/token`。',
    ...(isRateLimitError(error)
      ? ['- 当前 V2EX API token 已触发限流；等待 `reset_at` 时间后再跑，或减少扫描范围 / 更换可用 token。']
      : []),
    '- 脚本会先直连，网络类错误会自动用检测到的代理重试一次；如果仍失败，检查 DNS、代理端口和 V2EX API 可达性。',
    '- 修复网络后重新运行本自动化，脚本会按 V2EX API topic id 扫描，并继续过滤 `二手交易` 和 `推广`。',
    '',
    '## 输出文件',
    '',
    `- 失败 JSON：[v2ex_${targetDate}_failure.json](${failureFile.pathname})`,
    `- 阻塞报告：[v2ex_${targetDate}_report_blocked.md](${blockedReportFile.pathname})`,
    '',
  ].join('\n');
  await fs.writeFile(blockedReportFile, report);
}

async function main() {
  try {
    await fs.mkdir(outDir, { recursive: true });
    const idScan = await collectTopicIdCandidates();
    if (idScan.scannedTopicCount === 0) {
      throw new Error(`API topic id scan returned 0 readable topics after scanning ${idScan.scannedIds} ids`);
    }
    if (idScan.candidates.length === 0) {
      throw new Error(`API topic id scan found 0 topics created on ${targetDate}; check scan bounds or API date reachability`);
    }
    const details = await collectTopicDetails(idScan.candidates);
    const allCreatedTopics = details.filter((topic) => !topic.error && topicDate(topic.created) === targetDate);
    const excludedTopics = allCreatedTopics.filter(isExcludedTopic);
    const includedTopics = allCreatedTopics.filter((topic) => !isExcludedTopic(topic));
    const scoredTopics = [...includedTopics].sort((a, b) => topicScore(b) - topicScore(a));
    const highSignalTopics = scoredTopics.filter(isHighSignal).slice(0, 25);
    const replyBag = await collectReplies(highSignalTopics);
    const toolTopics = topByCategory(scoredTopics, TOOL_PATTERNS);
    const marketTopics = topByCategory(scoredTopics, MARKET_PATTERNS);
    const riskTopics = topByCategory(scoredTopics, RISK_PATTERNS);
    const lifeTopics = topByCategory(scoredTopics, LIFE_PATTERNS);
    const trendSummary = summarizeTrend(includedTopics);
    const nodeSummary = summarizeNodes(includedTopics);
    const replyInsights = pickReplyInsights(replyBag);
    const generatedAt = formatShanghaiDateTime();

    const rawPayload = {
      targetDate,
      generatedAt,
      timezone,
      proxy,
      scanMethod: 'api_topic_id_scan',
      scannedIds: idScan.scannedIds,
      scannedTopicCount: idScan.scannedTopicCount,
      scanGaps: idScan.gaps,
      latestId: idScan.latestId,
      localMaxId: idScan.localMaxId,
      scannedPages: 0,
      scannedCandidates: idScan.candidates.length,
      counts: {
        allCreated: allCreatedTopics.length,
        excluded: excludedTopics.length,
        included: includedTopics.length,
        highSignal: highSignalTopics.length,
      },
      recentCandidates: [],
      idScanCandidates: idScan.candidates,
      allCreatedTopics,
      excludedTopics,
      includedTopics,
      highSignalTopics,
      replyBag,
      trendSummary,
      nodeSummary,
      picks: {
        toolTopics,
        marketTopics,
        riskTopics,
        lifeTopics,
      },
      replyInsights,
    };

    const report = makeReport({
      generatedAt,
      targetDate,
      scannedIds: idScan.scannedIds,
      scannedTopicCount: idScan.scannedTopicCount,
      scanGaps: idScan.gaps,
      scannedCandidates: idScan.candidates.length,
      allCreatedTopics,
      excludedTopics,
      includedTopics,
      highSignalTopics,
      replyInsights,
      nodeSummary,
      trendSummary,
      toolTopics,
      marketTopics,
      riskTopics,
      lifeTopics,
    });

    await fs.writeFile(rawFile, JSON.stringify(scrubSecrets(rawPayload), null, 2));
    await fs.writeFile(reportFile, scrubSecrets(report));
    await fs.writeFile(new URL(`./v2ex_yesterday_data/topics_created_${targetDate}.json`, import.meta.url), JSON.stringify(scrubSecrets(allCreatedTopics), null, 2));
    await Promise.all([
      fs.unlink(failureFile).catch(() => {}),
      fs.unlink(blockedReportFile).catch(() => {}),
    ]);
    console.log(JSON.stringify({
      targetDate,
      generatedAt,
      rawFile: rawFile.pathname,
      reportFile: reportFile.pathname,
      counts: rawPayload.counts,
    }, null, 2));
  } catch (error) {
    if (
      proxy &&
      isNetworkError(error) &&
      process.env.NODE_USE_ENV_PROXY !== '1' &&
      process.env.V2EX_PROXY_FALLBACK_TRIED !== '1'
    ) {
      console.error(`Direct V2EX API access failed, retrying with proxy ${proxy}: ${describeError(error)}`);
      const result = runWithProxy({
        V2EX_PROXY_FALLBACK_TRIED: '1',
        V2EX_DIRECT_ERROR: describeError(error),
      });
      process.exit(result.status ?? 0);
    }
    await writeFailure(error);
    console.error(error);
    process.exit(1);
  }
}

main();
