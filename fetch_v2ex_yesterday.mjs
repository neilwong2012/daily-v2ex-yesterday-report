import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { analyzeTopicsWithDeepSeek } from './lib/deepseek-analysis.mjs';
import { renderValueReport } from './lib/report-renderer.mjs';

const base = process.env.V2EX_BASE_URL || 'https://www.v2ex.com';
const apiBase = process.env.V2EX_API_BASE_URL || `${base}/api/v2`;
const token = process.env.V2EX_TOKEN;
const apiMaxRetries = readNonNegativeInteger('V2EX_API_MAX_RETRIES', 3);
const apiRetryBaseMs = readNonNegativeInteger('V2EX_API_RETRY_BASE_MS', 500);
const apiRetryMaxMs = readNonNegativeInteger('V2EX_API_RETRY_MAX_MS', 5000);
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
const repliesFile = new URL(`./v2ex_yesterday_data/replies_${targetDate}.json`, import.meta.url);

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

function readNonNegativeInteger(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
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

function isTransientApiError(error) {
  return error instanceof ApiError && (
    error.status === 408 ||
    error.status === 425 ||
    error.status === 429 ||
    (error.status >= 500 && error.status <= 599)
  );
}

function isRetryableRequestError(error) {
  return isNetworkError(error) || isTransientApiError(error);
}

function isSkippableTopicError(error) {
  return error instanceof ApiError && (error.status === 404 || isTransientApiError(error));
}

function isRateLimitError(error) {
  return error instanceof ApiError && (error.status === 403 || error.status === 429 || /Rate Limit Exceeded/i.test(error.message));
}

if (!token) {
  console.error('Missing V2EX_TOKEN');
  process.exit(1);
}

const EXCLUDED_NODE_TITLES = new Set(['二手交易', '推广']);
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

async function getJsonOnce(endpoint) {
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
  if (!res.ok || json?.success === false) {
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

async function getJson(endpoint) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await getJsonOnce(endpoint);
    } catch (error) {
      if (!isRetryableRequestError(error) || attempt >= apiMaxRetries) throw error;
      const delayMs = Math.min(apiRetryMaxMs, apiRetryBaseMs * (2 ** attempt));
      console.error(
        `Transient V2EX API error for ${endpoint}; retry ${attempt + 1}/${apiMaxRetries} in ${delayMs}ms: ${describeError(error)}`,
      );
      await sleep(delayMs);
    }
  }
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
    if (isNetworkError(error) || isRateLimitError(error) || !isSkippableTopicError(error)) throw error;
  }
  for (let offset = 1; offset <= 8; offset += 1) {
    for (const candidateId of [id - offset, id + offset]) {
      if (candidateId < 1) continue;
      try {
        return await getCachedTopic(candidateId);
      } catch (error) {
        if (isNetworkError(error) || isRateLimitError(error) || !isSkippableTopicError(error)) throw error;
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

function makeReport(payload) {
  return renderValueReport({ ...payload, timezone });
}

async function collectTopicIdCandidates() {
  const found = new Map();
  const scanned = [];
  const scanErrors = [];
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
        if (!isSkippableTopicError(error)) throw error;
        gaps += 1;
        consecutiveGaps += 1;
        if (error.status !== 404) {
          const scanError = { id, status: error.status, error: describeError(error) };
          scanErrors.push(scanError);
          console.error(`Skipping topic ${id} after retries were exhausted: ${scanError.error}`);
        }
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
        if (!isSkippableTopicError(error)) throw error;
        gaps += 1;
        consecutiveGaps += 1;
        if (error.status !== 404) {
          const scanError = { id, status: error.status, error: describeError(error) };
          scanErrors.push(scanError);
          console.error(`Skipping topic ${id} after retries were exhausted: ${scanError.error}`);
        }
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
    scanErrors,
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
    deepseek_key_present: Boolean(process.env.DEEPSEEK_API_KEY),
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
    '状态：数据抓取或 DeepSeek 分析失败，未生成有效分析报告。',
    '',
    '## 阻塞原因',
    '',
    `- V2EX_TOKEN：${payload.token_present ? '已检测到' : '未检测到'}`,
    `- DEEPSEEK_API_KEY：${payload.deepseek_key_present ? '已检测到' : '未检测到'}`,
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
    const allReplyBag = await collectReplies(allCreatedTopics);
    await fs.writeFile(repliesFile, JSON.stringify(scrubSecrets({
      targetDate,
      generatedAt: formatShanghaiDateTime(),
      topics: allReplyBag,
    }), null, 2));
    const includedIds = new Set(includedTopics.map((topic) => topic.id));
    const analysisReplyBag = allReplyBag.filter((item) => includedIds.has(item.topic.id));
    const deepseekEnabled = process.env.V2EX_SKIP_AI !== '1';
    const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    const analysisResults = deepseekEnabled
      ? await analyzeTopicsWithDeepSeek(analysisReplyBag, {
          model: deepseekModel,
          onProgress: ({ completed, total, succeeded, failed }) => {
            if (completed % 10 === 0 || completed === total) {
              console.error(`DeepSeek analysis ${completed}/${total}: success=${succeeded}, failed=${failed}`);
            }
          },
        })
      : [];
    const successfulAnalyses = analysisResults.filter((item) => item.status === 'success');
    const failedAnalyses = analysisResults.filter((item) => item.status === 'failed');
    const minimumSuccessRatio = Number(process.env.DEEPSEEK_MIN_SUCCESS_RATIO || 0.8);
    if (deepseekEnabled && successfulAnalyses.length / Math.max(analysisReplyBag.length, 1) < minimumSuccessRatio) {
      throw new Error(`DeepSeek analysis success ratio ${successfulAnalyses.length}/${analysisReplyBag.length} is below ${minimumSuccessRatio}`);
    }
    const topicById = new Map(includedTopics.map((topic) => [topic.id, topic]));
    const valuableAnalyses = successfulAnalyses
      .filter((item) => item.keep && topicById.has(item.topic_id))
      .map((item) => ({ ...item, topic: topicById.get(item.topic_id) }))
      .sort((a, b) => b.value_score - a.value_score);
    const downloadedReplyCount = allReplyBag.reduce((total, item) => total + item.replies.length, 0);
    const replyFetchErrors = allReplyBag.filter((item) => item.error).length;
    const analysisStats = {
      requested: analysisReplyBag.length,
      success: successfulAnalyses.length,
      failed: failedAnalyses.length,
      kept: valuableAnalyses.length,
    };
    const nodeSummary = summarizeNodes(includedTopics);
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
      scanErrors: idScan.scanErrors,
      latestId: idScan.latestId,
      localMaxId: idScan.localMaxId,
      scannedPages: 0,
      scannedCandidates: idScan.candidates.length,
      counts: {
        allCreated: allCreatedTopics.length,
        excluded: excludedTopics.length,
        included: includedTopics.length,
        replies: downloadedReplyCount,
        analysisSuccess: analysisStats.success,
        analysisFailed: analysisStats.failed,
        valuable: valuableAnalyses.length,
      },
      recentCandidates: [],
      idScanCandidates: idScan.candidates,
      allCreatedTopics,
      excludedTopics,
      includedTopics,
      replyFetchErrors,
      replyArchiveFile: `v2ex_yesterday_data/replies_${targetDate}.json`,
      deepseek: {
        enabled: deepseekEnabled,
        model: deepseekModel,
        stats: analysisStats,
        analyses: analysisResults,
      },
      nodeSummary,
    };

    const report = makeReport({
      generatedAt,
      targetDate,
      scannedIds: idScan.scannedIds,
      scannedTopicCount: idScan.scannedTopicCount,
      scanGaps: idScan.gaps,
      scanErrors: idScan.scanErrors,
      allCreatedTopics,
      excludedTopics,
      includedTopics,
      valuableAnalyses,
      analysisStats,
      deepseekModel,
      downloadedReplyCount,
      replyFetchErrors,
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
