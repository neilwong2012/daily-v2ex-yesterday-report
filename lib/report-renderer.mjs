import { cleanArticleText } from './deepseek-analysis.mjs';

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
  ];

  if (ranked.length === 0) {
    lines.push('- 本次没有通过价值阈值和结构校验的主题。', '');
  }

  ranked.forEach((item, index) => {
    const topic = item.topic;
    const originalTitle = String(topic.title || '未命名主题').replace(/\s+/g, ' ').trim();
    const optimizedTitle = String(item.optimized_title || originalTitle).replace(/\s+/g, ' ').trim();
    const topicId = Number.isFinite(Number(topic.id)) ? String(Math.trunc(Number(topic.id))) : `rank-${index + 1}`;
    const replyCount = Math.max(0, Math.floor(Number(topic.replies) || 0));
    const favoriteCount = Math.max(0, Math.floor(Number(topic.stars) || 0));

    lines.push(`<details class="topic-card" data-topic-id="${escapeHtml(topicId)}" markdown="1">`);
    lines.push('<summary>');
    lines.push(`<span class="topic-rank">${index + 1}</span>`);
    lines.push(`<span class="topic-title">${escapeHtml(optimizedTitle)}</span>`);
    lines.push('</summary>');
    lines.push('');
    lines.push('<div class="topic-content" markdown="1">');
    lines.push('');
    lines.push('<div class="topic-article" markdown="1">');
    lines.push('');
    lines.push(articleMarkdown(item));
    lines.push('');
    lines.push('</div>');
    lines.push('');
    lines.push(`<p class="topic-source"><span class="topic-source-link">原链接：<a href="${escapeHtml(topic.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(originalTitle)}</a></span><span class="topic-stats">回复 ${replyCount} · 收藏 ${favoriteCount}</span></p>`);
    lines.push('');
    lines.push('</div>');
    lines.push('');
    lines.push('</details>');
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
}
