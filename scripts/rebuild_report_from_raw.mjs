import fs from 'node:fs/promises';

import { isAnalysisCandidate, MIN_CONTENT_SCORE, replyWeightForCount } from '../lib/deepseek-analysis.mjs';
import { renderValueReport } from '../lib/report-renderer.mjs';

const timezone = 'Asia/Shanghai';
const targetDate = process.env.V2EX_DATE;
if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate || '')) {
  throw new Error('V2EX_DATE must be provided as YYYY-MM-DD');
}

const threshold = Number(process.env.DEEPSEEK_VALUE_THRESHOLD || 70);
const rawUrl = new URL(`../v2ex_${targetDate}_raw.json`, import.meta.url);
const reportUrl = new URL(`../v2ex_${targetDate}_report.md`, import.meta.url);
const raw = JSON.parse(await fs.readFile(rawUrl, 'utf8'));
const topics = Array.isArray(raw.includedTopics) ? raw.includedTopics.filter(isAnalysisCandidate) : [];
const topicById = new Map(topics.map((topic) => [Number(topic.id), topic]));
const valuableAnalyses = (raw.deepseek?.analyses || [])
  .filter((item) => item.status === 'success' && item.keep)
  .filter((item) => topicById.has(Number(item.topic_id)))
  .map((item) => {
    const topic = topicById.get(Number(item.topic_id));
    const contentScore = Number(item.content_score ?? item.value_score ?? 0);
    const replyWeight = replyWeightForCount(topic.replies || 0);
    return {
      ...item,
      value_score: Math.max(0, contentScore + replyWeight),
      content_score: contentScore,
      reply_weight: replyWeight,
      topic,
    };
  })
  .filter((item) => item.content_score >= MIN_CONTENT_SCORE && item.value_score >= threshold);

const report = renderValueReport({
  generatedAt: raw.generatedAt,
  targetDate,
  scannedIds: raw.scannedIds,
  scannedTopicCount: raw.scannedTopicCount,
  scanGaps: raw.scanGaps,
  scanErrors: raw.scanErrors,
  allCreatedTopics: raw.allCreatedTopics,
  excludedTopics: raw.excludedTopics,
  includedTopics: topics,
  valuableAnalyses,
  analysisStats: raw.deepseek?.stats,
  deepseekModel: raw.deepseek?.model || 'deepseek-v4-flash',
  downloadedReplyCount: raw.counts?.replies || 0,
  replyFetchErrors: Number(raw.replyFetchErrors ?? raw.replyBag?.filter((item) => item.error).length ?? 0),
  timezone,
});

await fs.writeFile(reportUrl, report);
console.log(JSON.stringify({
  targetDate,
  threshold,
  valuable: valuableAnalyses.length,
  reportFile: reportUrl.pathname,
}, null, 2));
