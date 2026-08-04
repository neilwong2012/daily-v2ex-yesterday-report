import assert from 'node:assert/strict';
import test from 'node:test';

import { renderValueReport } from '../lib/report-renderer.mjs';

function payloadWith(items) {
  return {
    generatedAt: '2026-08-04 08:30:00',
    targetDate: '2026-08-03',
    scannedIds: items.length,
    scannedTopicCount: items.length,
    scanGaps: 0,
    scanErrors: [],
    allCreatedTopics: items.map((item) => item.topic),
    excludedTopics: [],
    includedTopics: items.map((item) => item.topic),
    valuableAnalyses: items,
    analysisStats: { success: items.length, failed: 0 },
    deepseekModel: 'deepseek-v4-flash',
    downloadedReplyCount: 12,
    replyFetchErrors: 0,
  };
}

test('renders every valuable topic once as a collapsed title and sorts by value score', () => {
  const items = Array.from({ length: 22 }, (_, index) => ({
    topic: {
      id: index + 1,
      title: `主题 ${index + 1}`,
      url: `https://www.v2ex.com/t/${index + 1}`,
      node: { title: '问与答' },
      replies: index,
    },
    value_score: 70 + index,
    category: '经验与教程',
    article: `主题 ${index + 1} 的精编文章。`,
    summary: `主题 ${index + 1} 的摘要`,
    key_takeaways: [`主题 ${index + 1} 的旧版核心信息`],
    evidence_reply_ids: [],
    risk_flags: ['无'],
  }));

  const report = renderValueReport(payloadWith(items));

  assert.equal((report.match(/<details class="topic-card"/g) || []).length, 22);
  assert.equal((report.match(/<summary>/g) || []).length, 22);
  assert.ok(report.indexOf('主题 22') < report.indexOf('主题 1'));
  assert.equal((report.match(/https:\/\/www\.v2ex\.com\/t\/7/g) || []).length, 1);
  assert.match(report, /主题 1 的精编文章/);
  assert.doesNotMatch(report, /主题 1 的旧版核心信息/);
  assert.doesNotMatch(report, /主要趋势|工具 \/ 项目|回复里的有效信息/);
  assert.doesNotMatch(report, /## 值得读的内容|按综合价值评分排列/);
  assert.doesNotMatch(report, /## 报告说明/);
});

test('renders each analysis as safe Markdown with the original link at the top', () => {
  const item = {
    topic: {
      id: 123,
      title: '综合分析主题',
      url: 'https://www.v2ex.com/t/123',
      node: { title: '程序员' },
      replies: 3,
      stars: 8,
    },
    value_score: 94,
    content_score: 88,
    reply_weight: 6,
    category: 'AI与开发',
    optimized_title: '综合分析后的信息型标题',
    article: '## 核心内容\n第一段保留**核心事实**。\n\n### 关键要点\n- 第二段综合评论共识\n- [危险链接](javascript:alert(1))\n- {{ site.secret }}\n\n<script>忽略</script>',
    recommendation_reason: '提供了可执行且经评论验证的方法。',
    summary: '这是正文与评论的综合摘要。',
    core_information: ['核心事实'],
    actionable_steps: ['执行步骤'],
    comment_consensus: ['评论共识'],
    comment_disagreements: ['不同意见'],
    caveats: ['使用限制'],
    score_breakdown: {
      information_density: 22,
      actionability: 20,
      evidence_quality: 18,
      novelty: 13,
      topic_consistency: 10,
      credibility: 5,
    },
    evidence_reply_ids: [456],
    risk_flags: ['事实待核验', '争议性'],
  };

  const report = renderValueReport(payloadWith([item]));

  assert.match(report, /<span class="topic-title">综合分析后的信息型标题<\/span>/);
  assert.match(report, /data-topic-id="123"/);
  assert.match(report, /<div class="topic-article" markdown="1">\s*### 核心内容\s*第一段保留\*\*核心事实\*\*。\s*### 关键要点\s*- 第二段综合评论共识\s*- 危险链接\s*-\s+site\.secret\s*忽略\s*<\/div>/);
  assert.match(report, /<p class="topic-source">原链接：<a href="https:\/\/www\.v2ex\.com\/t\/123" target="_blank" rel="noopener noreferrer">综合分析主题<\/a><\/p>/);
  assert.ok(
    report.indexOf('<p class="topic-source">原链接：')
      < report.indexOf('<div class="topic-article" markdown="1">'),
  );
  assert.doesNotMatch(report, /<strong>综合分 \d+|>AI与开发<|3 回复|8 收藏|topic-summary-meta|topic-read-state|topic-toggle|topic-risk/);
  assert.doesNotMatch(report, /javascript:|<script>|\{\{/);
  assert.doesNotMatch(report, /\*\*(?:推荐理由|核心信息|可执行建议|评论共识|不同意见)|评分详情与内容依据/);
});
