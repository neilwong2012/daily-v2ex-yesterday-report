import fs from 'node:fs/promises';
import path from 'node:path';

import {
  favoriteWeightForCount,
  isAnalysisCandidate,
  MIN_CONTENT_SCORE,
  replyWeightForCount,
} from '../lib/deepseek-analysis.mjs';

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

function reportUrl(dateText) {
  return `/${dateText.slice(0, 4)}/${dateText.slice(5, 7)}/${dateText.slice(8, 10)}/`;
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

function prioritizeReportContent(markdown) {
  const highlightHeading = '\n## DeepSeek V4 高价值精选\n';
  const originalHeading = '\n## 原始文件\n';
  const highlightIndex = markdown.indexOf(highlightHeading);
  if (highlightIndex < 0) return markdown;

  const intro = markdown.slice(0, highlightIndex).trim();
  const reportBody = markdown.slice(highlightIndex + highlightHeading.length).trim();
  const originalIndex = reportBody.indexOf(originalHeading);
  const mainContent = originalIndex < 0 ? reportBody : reportBody.slice(0, originalIndex).trim();
  const introLines = intro.split('\n');
  const title = introLines.shift() || '';
  const reportNotes = introLines.join('\n').trim()
    .replace(/^## 数据范围与计数$/m, '### 数据范围与计数')
    .replace(/ {2}\n/g, '\n\n');

  const sections = [
    title,
    '',
    '## 今日值得看',
    '',
    mainContent,
    '',
    '## 报告说明',
    '',
    reportNotes,
  ];
  return sections.join('\n').trim() + '\n';
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
  return `昨日主题 ${counts.allCreated ?? 0} 个，过滤 ${counts.excluded ?? 0} 个，DeepSeek 分析 ${counts.analysisSuccess ?? 0} 个，保留高价值内容 ${countValuable(payload)} 个。`;
}

function withEngagementWeight(item, topic) {
  if (item?.status !== 'success') return item;
  const threshold = Number(process.env.DEEPSEEK_VALUE_THRESHOLD || 70);
  const contentScore = Number(item.content_score ?? item.value_score ?? 0);
  const replyWeight = replyWeightForCount(topic?.replies || 0);
  const favoriteWeight = favoriteWeightForCount(topic?.stars || 0);
  const engagementWeight = replyWeight + favoriteWeight;
  const finalScore = Math.max(0, contentScore + engagementWeight);
  return {
    ...item,
    value_score: finalScore,
    content_score: contentScore,
    reply_weight: replyWeight,
    favorite_weight: favoriteWeight,
    engagement_weight: engagementWeight,
    keep: Boolean(item.keep) && contentScore >= MIN_CONTENT_SCORE && finalScore >= threshold,
  };
}

function countValuable(payload) {
  const analyses = payload?.deepseek?.analyses;
  if (Array.isArray(analyses)) {
    const threshold = Number(process.env.DEEPSEEK_VALUE_THRESHOLD || 70);
    const topicById = new Map((payload.includedTopics || []).map((topic) => [Number(topic.id), topic]));
    return analyses
      .map((item) => withEngagementWeight(item, topicById.get(Number(item.topic_id))))
      .filter((item) => isAnalysisCandidate(topicById.get(Number(item.topic_id))))
      .filter((item) => item.status === 'success' && item.keep && Number(item.value_score) >= threshold)
      .length;
  }
  return Number(payload?.counts?.valuable ?? payload?.counts?.highSignal ?? 0);
}

function buildPublicPayload(payload) {
  if (!payload?.counts) return payload;
  const topicById = new Map((payload.includedTopics || []).map((topic) => [Number(topic.id), topic]));
  const analyses = Array.isArray(payload.deepseek?.analyses)
    ? payload.deepseek.analyses.map((item) => withEngagementWeight(item, topicById.get(Number(item.topic_id))))
    : null;
  return {
    ...payload,
    counts: { ...payload.counts, valuable: countValuable(payload) },
    ...(analyses ? { deepseek: { ...payload.deepseek, analyses } } : {}),
  };
}

function pageFrontMatter({ layout, title, status, summary, targetDate, payload }) {
  const counts = payload?.counts || {};
  const generatedAt = payload?.generatedAt || formatShanghaiDateTime();
  return [
    '---',
    `layout: ${layout}`,
    `title: "${yamlEscape(title)}"`,
    `date: ${targetDate} 08:30:00 +0800`,
    `categories: [v2ex, daily-report]`,
    `status: ${status}`,
    `target_date: ${targetDate}`,
    `generated_at: "${yamlEscape(generatedAt)}"`,
    `summary: "${yamlEscape(summary)}"`,
    `count_all: ${Number(counts.allCreated || 0)}`,
    `count_excluded: ${Number(counts.excluded || 0)}`,
    `count_included: ${Number(counts.included || 0)}`,
    `count_high_signal: ${Number(counts.highSignal || 0)}`,
    `count_valuable: ${countValuable(payload)}`,
    `report_url: "${reportUrl(targetDate)}"`,
    `data_url: "/data/${targetDate}.json"`,
    '---',
  ].join('\n');
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
  const publicPayload = buildPublicPayload(payload);
  const markdown = scrubSecrets(prioritizeReportContent(
    relativizeWorkspaceLinks(await fs.readFile(sourceReport, 'utf8'), targetDate),
  ));
  const summary = buildSummary(payload, status);

  const hasData = await exists(sourceData);
  if (hasData) {
    await fs.writeFile(dataPath, JSON.stringify(publicPayload, null, 2));
  }

  const postTitle = `V2EX每日热点回顾 · ${targetDate}${status === 'blocked' ? '（阻塞）' : ''}`;
  const lines = [
    pageFrontMatter({ layout: 'report-post', title: postTitle, status, summary, targetDate, payload }),
    '',
  ];
  if (status === 'blocked') {
    lines.push(`> 发布状态：阻塞。生成时间：${formatShanghaiDateTime()}（${timezone}）。`, '');
  }
  lines.push(markdown, '');
  const post = `${lines.join('\n').trimEnd()}\n`;

  await fs.writeFile(postPath, post);
  await fs.writeFile(new URL('../docs/index.md', import.meta.url), `${[
    pageFrontMatter({ layout: 'report-home', title: 'V2EX每日热点回顾', status, summary, targetDate, payload }),
    '',
    markdown,
    '',
  ].join('\n').trimEnd()}\n`);
  await fs.writeFile(new URL('../docs/latest.md', import.meta.url), `${[
    '---',
    'layout: report-home',
    'title: "V2EX每日热点回顾"',
    'permalink: /latest/',
    `status: ${status}`,
    `target_date: ${targetDate}`,
    `generated_at: "${yamlEscape(payload?.generatedAt || formatShanghaiDateTime())}"`,
    `summary: "${yamlEscape(summary)}"`,
    `count_all: ${Number(payload?.counts?.allCreated || 0)}`,
    `count_excluded: ${Number(payload?.counts?.excluded || 0)}`,
    `count_included: ${Number(payload?.counts?.included || 0)}`,
    `count_high_signal: ${Number(payload?.counts?.highSignal || 0)}`,
    `count_valuable: ${countValuable(payload)}`,
    `report_url: "${reportUrl(targetDate)}"`,
    `data_url: "/data/${targetDate}.json"`,
    '---',
    '',
    markdown,
    '',
  ].join('\n').trimEnd()}\n`);

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
