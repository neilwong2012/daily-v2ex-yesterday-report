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
  assert.match(report, /主题 1 的旧版核心信息/);
  assert.doesNotMatch(report, /主要趋势|工具 \/ 项目|回复里的有效信息/);
  assert.doesNotMatch(report, /## 报告说明/);
});

test('renders comprehensive extraction and collapses scoring evidence', () => {
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

  assert.match(report, /推荐理由：/);
  assert.match(report, /<span class="topic-title">综合分析后的信息型标题<\/span>/);
  assert.match(report, /data-topic-id="123"/);
  assert.match(report, /topic-risk-verify">待核验/);
  assert.match(report, /topic-risk-disputed">有争议/);
  assert.match(report, /class="topic-read-state">已读/);
  assert.match(report, /原标题：.*综合分析主题/);
  assert.match(report, /评论共识/);
  assert.match(report, /不同意见/);
  assert.match(report, /<details class="analysis-evidence"/);
  assert.match(report, /信息密度 22/);
  assert.match(report, /内容基础分 88 · 回复权重 \+6/);
  assert.match(report, /#456/);
});
