import fs from 'node:fs/promises';
import path from 'node:path';

const timezone = 'Asia/Shanghai';
const targetDate = process.env.V2EX_DATE || getShanghaiDateOffset(-1);
const rootDir = new URL('../', import.meta.url);
const docsDir = new URL('../docs/', import.meta.url);
const postsDir = new URL('../docs/_posts/', import.meta.url);
const dataDir = new URL('../docs/data/', import.meta.url);

const reportPath = new URL(`../v2ex_${targetDate}_report.md`, import.meta.url);
const blockedReportPath = new URL(`../v2ex_${targetDate}_report_blocked.md`, import.meta.url);
const rawPath = new URL(`../v2ex_${targetDate}_raw.json`, import.meta.url);
const failurePath = new URL(`../v2ex_${targetDate}_failure.json`, import.meta.url);
const postPath = new URL(`../docs/_posts/${targetDate}-v2ex-yesterday-report.md`, import.meta.url);
const dataPath = new URL(`../docs/data/${targetDate}.json`, import.meta.url);
const SECRET_PATTERNS = [
  /\bnpm_[A-Za-z0-9]{20,}\b/g,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
];

function getShanghaiDateOffset(offsetDays) {
  const now = new Date();
  const shifted = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(shifted);
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

async function exists(fileUrl) {
  try {
    await fs.access(fileUrl);
    return true;
  } catch {
    return false;
  }
}

function yamlEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

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

function relativizeWorkspaceLinks(markdown, dateText) {
  const rootPath = rootDir.pathname.replace(/\/$/, '');
  return markdown
    .replaceAll(`${rootPath}/v2ex_${dateText}_raw.json`, `{{ site.baseurl }}/data/${dateText}.json`)
    .replaceAll(`${rootPath}/v2ex_${dateText}_failure.json`, `{{ site.baseurl }}/data/${dateText}.json`)
    .replaceAll(`${rootPath}/v2ex_${dateText}_report.md`, `{{ page.url | relative_url }}`)
    .replaceAll(`${rootPath}/v2ex_${dateText}_report_blocked.md`, `{{ page.url | relative_url }}`)
    .replaceAll(rootPath, '{{ site.baseurl }}')
    .replaceAll(`{{ site.baseurl }}/v2ex_${dateText}_raw.json`, `{{ site.baseurl }}/data/${dateText}.json`)
    .replaceAll(`{{ site.baseurl }}/v2ex_${dateText}_failure.json`, `{{ site.baseurl }}/data/${dateText}.json`)
    .replaceAll(`{{ site.baseurl }}/v2ex_${dateText}_report.md`, `{{ page.url | relative_url }}`)
    .replaceAll(`{{ site.baseurl }}/v2ex_${dateText}_report_blocked.md`, `{{ page.url | relative_url }}`);
}

async function readJsonIfPresent(fileUrl) {
  if (!(await exists(fileUrl))) return null;
  return JSON.parse(await fs.readFile(fileUrl, 'utf8'));
}

function buildSummary(payload, status) {
  if (status === 'blocked') {
    return `API 抓取失败，已发布阻塞诊断。`;
  }
  const counts = payload?.counts || {};
  return `昨日主题 ${counts.allCreated ?? 0} 个，过滤 ${counts.excluded ?? 0} 个，纳入分析 ${counts.included ?? 0} 个，高信号 ${counts.highSignal ?? 0} 个。`;
}

async function main() {
  await fs.mkdir(postsDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });

  const hasReport = await exists(reportPath);
  const hasBlockedReport = await exists(blockedReportPath);
  if (!hasReport && !hasBlockedReport) {
    throw new Error(`No report found for ${targetDate}`);
  }

  const status = hasReport ? 'success' : 'blocked';
  const sourceReport = hasReport ? reportPath : blockedReportPath;
  const sourceData = hasReport ? rawPath : failurePath;
  const payload = scrubSecrets(await readJsonIfPresent(sourceData));
  const markdown = scrubSecrets(relativizeWorkspaceLinks(await fs.readFile(sourceReport, 'utf8'), targetDate));
  const summary = buildSummary(payload, status);

  const hasData = await exists(sourceData);
  if (hasData) {
    await fs.writeFile(dataPath, JSON.stringify(payload, null, 2));
  }

  const lines = [
    '---',
    `layout: post`,
    `title: "V2EX ${targetDate} 昨日新帖报告${status === 'blocked' ? '（阻塞）' : ''}"`,
    `date: ${targetDate} 08:30:00 +0800`,
    `categories: [v2ex, daily-report]`,
    `status: ${status}`,
    `target_date: ${targetDate}`,
    `summary: "${yamlEscape(summary)}"`,
    '---',
    '',
    `> 发布状态：${status === 'success' ? '成功' : '阻塞'}。生成时间：${formatShanghaiDateTime()}（${timezone}）。`,
    '',
    markdown,
    '',
  ];
  if (hasData) {
    lines.push(`数据文件：[/data/${targetDate}.json]({{ site.baseurl }}/data/${targetDate}.json)`);
    lines.push('');
  }

  const post = lines.join('\n');

  await fs.writeFile(postPath, post);
  await fs.writeFile(new URL('../docs/latest.md', import.meta.url), [
    '---',
    'layout: page',
    'title: 最新报告',
    'permalink: /latest/',
    '---',
    '',
    `最新报告：[V2EX ${targetDate} 昨日新帖报告]({{ site.baseurl }}{% post_url ${targetDate}-v2ex-yesterday-report %})`,
    '',
  ].join('\n'));

  console.log(JSON.stringify({
    targetDate,
    status,
    postFile: postPath.pathname,
    dataFile: (await exists(dataPath)) ? dataPath.pathname : null,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
