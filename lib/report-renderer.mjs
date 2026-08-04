import { cleanArticleText } from './deepseek-analysis.mjs';

const RISK_BADGES = Object.freeze({
  '事实待核验': { label: '待核验', tone: 'verify' },
  '争议性': { label: '有争议', tone: 'disputed' },
  '信息不足': { label: '信息不足', tone: 'limited' },
});

function list(value, fallback = []) {
  if (Array.isArray(value) && value.length > 0) return value.filter(Boolean);
  return Array.isArray(fallback) ? fallback.filter(Boolean) : [];
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function articleMarkdown(item) {
  const article = String(item.article || '').trim();
  if (article) return cleanArticleText(article);

  const fallback = [
    item.summary,
    ...list(item.core_information, item.key_takeaways),
    ...list(item.actionable_steps),
    ...list(item.comment_consensus),
    ...list(item.comment_disagreements),
    ...list(item.caveats),
  ].map((paragraph) => String(paragraph || '').trim()).filter(Boolean);
  return cleanArticleText(fallback.length > 0 ? fallback.join('\n\n') : '暂无可展示的精编内容。');
}

export function renderValueReport(payload) {
  const {
    targetDate,
    includedTopics = [],
    valuableAnalyses = [],
  } = payload;

  const ranked = valuableAnalyses
    .filter((item) => item?.topic)
    .sort((a, b) => {
      if (b.value_score !== a.value_score) return b.value_score - a.value_score;
      const evidenceDelta = (b.evidence_reply_ids?.length || 0) - (a.evidence_reply_ids?.length || 0);
      if (evidenceDelta !== 0) return evidenceDelta;
      if ((b.topic.stars || 0) !== (a.topic.stars || 0)) return (b.topic.stars || 0) - (a.topic.stars || 0);
      return (b.topic.replies || 0) - (a.topic.replies || 0);
    });

  const lines = [
    `# V2EX ${targetDate} 昨日新帖报告`,
    '',
    '## 值得读的内容',
    '',
    '按综合价值评分排列，点击标题展开精编短文。',
    '',
  ];

  if (ranked.length === 0) {
    lines.push('- 本次没有通过价值阈值和结构校验的主题。', '');
  }

  ranked.forEach((item, index) => {
    const topic = item.topic;
    const riskCaveats = list(item.risk_flags).filter((flag) => flag !== '无');
    const riskBadges = riskCaveats
      .map((flag) => RISK_BADGES[flag])
      .filter(Boolean)
      .slice(0, 2);

    const originalTitle = String(topic.title || '未命名主题').trim();
    const optimizedTitle = String(item.optimized_title || originalTitle).trim();
    const meta = `${item.category} · ${topic.replies || 0} 回复${topic.stars ? ` · ${topic.stars} 收藏` : ''}`;
    const topicId = Number.isFinite(Number(topic.id)) ? String(Math.trunc(Number(topic.id))) : `rank-${index + 1}`;
    const riskBadgeHtml = riskBadges
      .map((badge) => `<span class="topic-risk topic-risk-${badge.tone}">${badge.label}</span>`)
      .join('');

    lines.push(`<details class="topic-card" data-topic-id="${escapeHtml(topicId)}" markdown="1">`);
    lines.push('<summary>');
    lines.push('<span class="topic-summary-main">');
    lines.push(`<span class="topic-heading"><span class="topic-rank">${index + 1}</span><span class="topic-title">${escapeHtml(optimizedTitle)}</span></span>`);
    lines.push(`<span class="topic-summary-meta"><strong>综合分 ${item.value_score}</strong><span>${escapeHtml(meta)}</span>${riskBadgeHtml}<span class="topic-read-state">已读</span></span>`);
    lines.push('</span>');
    lines.push('<span class="topic-toggle" aria-hidden="true"></span>');
    lines.push('</summary>');
    lines.push('');
    lines.push('<div class="topic-article" markdown="1">');
    lines.push('');
    lines.push(articleMarkdown(item));
    lines.push('');
    lines.push('</div>');
    lines.push('');
    lines.push(`<p class="topic-source">原标题：<a href="${escapeHtml(topic.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(originalTitle)}</a></p>`);
    lines.push('');
    lines.push('</details>');
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
}
