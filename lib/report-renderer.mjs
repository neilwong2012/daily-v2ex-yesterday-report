const SCORE_LABELS = Object.freeze({
  information_density: '信息密度',
  actionability: '可执行性',
  evidence_quality: '证据质量',
  novelty: '新颖性',
  topic_consistency: '主题一致性',
  credibility: '可信度',
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

function escapeMarkdownText(value) {
  return String(value || '').replace(/([\\`*_[\]<>])/g, '\\$1');
}

function pushSection(lines, title, items) {
  if (items.length === 0) return;
  lines.push(`**${title}**`);
  lines.push('');
  for (const item of items) lines.push(`- ${item}`);
  lines.push('');
}

function scoreDetails(item) {
  const replyWeight = Number(item.reply_weight || 0);
  const replyWeightText = replyWeight > 0 ? `+${replyWeight}` : String(replyWeight);
  const base = Number.isFinite(Number(item.content_score))
    ? `内容基础分 ${Number(item.content_score)} · 回复权重 ${replyWeightText}`
    : '';
  if (!item.score_breakdown || typeof item.score_breakdown !== 'object') return base;
  const components = Object.entries(SCORE_LABELS)
    .map(([key, label]) => `${label} ${Number(item.score_breakdown[key] || 0)}`)
    .join(' · ');
  if (Number.isFinite(Number(item.content_score))) {
    return `${base} · ${components}`;
  }
  return components;
}

export function renderValueReport(payload) {
  const {
    generatedAt,
    targetDate,
    scannedIds,
    scannedTopicCount,
    scanGaps,
    scanErrors = [],
    allCreatedTopics = [],
    excludedTopics = [],
    includedTopics = [],
    valuableAnalyses = [],
    analysisStats = {},
    deepseekModel,
    downloadedReplyCount = 0,
    replyFetchErrors = 0,
    timezone = 'Asia/Shanghai',
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
    `从 ${includedTopics.length} 个候选主题中保留 ${ranked.length} 个，按综合价值评分排列；点击标题展开摘要、核心信息与评论结论。`,
    '',
  ];

  if (ranked.length === 0) {
    lines.push('- 本次没有通过价值阈值和结构校验的主题。', '');
  }

  ranked.forEach((item, index) => {
    const topic = item.topic;
    const coreInformation = list(item.core_information, item.key_takeaways);
    const actionableSteps = list(item.actionable_steps);
    const commentConsensus = list(item.comment_consensus);
    const commentDisagreements = list(item.comment_disagreements);
    const riskCaveats = list(item.risk_flags).filter((flag) => flag !== '无');
    const caveats = [...new Set([...list(item.caveats), ...riskCaveats])];
    const evidence = list(item.evidence_reply_ids);

    const originalTitle = String(topic.title || '未命名主题').trim();
    const optimizedTitle = String(item.optimized_title || originalTitle).trim();
    const nodeTitle = topic.node?.title || topic.nodeTitle || '未知节点';
    const meta = `${item.category} · ${nodeTitle} · ${topic.replies || 0} 回复${topic.stars ? ` · ${topic.stars} 收藏` : ''}`;

    lines.push('<details class="topic-card" markdown="1">');
    lines.push('<summary>');
    lines.push('<span class="topic-summary-main">');
    lines.push(`<span class="topic-heading"><span class="topic-rank">${index + 1}</span><span class="topic-title">${escapeHtml(optimizedTitle)}</span></span>`);
    lines.push(`<span class="topic-summary-meta"><strong>综合分 ${item.value_score}</strong><span>${escapeHtml(meta)}</span></span>`);
    lines.push('</span>');
    lines.push('<span class="topic-toggle" aria-hidden="true"></span>');
    lines.push('</summary>');
    lines.push('');
    if (optimizedTitle !== originalTitle) {
      lines.push(`**原标题：** [${escapeMarkdownText(originalTitle)}](${topic.url})`);
    } else {
      lines.push(`[查看 V2EX 原帖](${topic.url})`);
    }
    lines.push('');
    if (item.recommendation_reason) {
      lines.push(`**推荐理由：** ${item.recommendation_reason}`);
      lines.push('');
    }
    lines.push(item.summary);
    lines.push('');
    pushSection(lines, '核心信息', coreInformation);
    pushSection(lines, '可执行建议', actionableSteps);
    pushSection(lines, '评论共识', commentConsensus);
    pushSection(lines, '不同意见', commentDisagreements);
    pushSection(lines, '注意事项', caveats);

    const breakdown = scoreDetails(item);
    if (breakdown || evidence.length > 0 || item.input_truncated) {
      lines.push('<details class="analysis-evidence" markdown="1">');
      lines.push('<summary>评分详情与内容依据</summary>');
      lines.push('');
      if (breakdown) lines.push(`评分构成：${breakdown}`, '');
      if (evidence.length > 0) {
        const links = evidence.map((id) => `[#${id}](${topic.url}#reply${id})`).join('、');
        lines.push(`依据回复：${links}`, '');
      }
      if (item.input_truncated) {
        lines.push(`覆盖说明：回复内容过长，分析了 ${item.analyzed_reply_count}/${item.total_reply_count} 条回复。`, '');
      }
      lines.push('</details>');
      lines.push('');
    }
    lines.push('</details>');
    lines.push('');
  });

  lines.push('## 报告说明');
  lines.push('');
  lines.push(`- 抓取时间：${generatedAt}（${timezone}）`);
  lines.push(`- 时间范围：${targetDate} 00:00:00 到次日 00:00:00（${timezone}）`);
  lines.push(`- 内容处理：抓取标题、正文与回复，排除二手交易和推广后，由 ${deepseekModel} 对每个主题独立提取、评分和校验。`);
  lines.push(`- 筛选结果：昨日 ${allCreatedTopics.length} 个主题，过滤 ${excludedTopics.length} 个，分析 ${includedTopics.length} 个，下载 ${downloadedReplyCount} 条回复，保留 ${ranked.length} 个高价值主题。`);
  lines.push(`- 运行质量：扫描 ${scannedIds} 个 id，读取 ${scannedTopicCount} 个主题详情，${scanGaps} 个空洞或失败 id；重试耗尽后跳过的临时 API 错误：${scanErrors.length}；回复抓取失败 ${replyFetchErrors} 个，分析成功 / 失败 ${analysisStats.success || 0} / ${analysisStats.failed || 0}。`);
  return `${lines.join('\n').trim()}\n`;
}
