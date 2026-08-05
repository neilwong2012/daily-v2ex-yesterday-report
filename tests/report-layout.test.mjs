import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('historical report layout passes the post body to the page layout', async () => {
  const layout = await fs.readFile(
    new URL('../docs/_layouts/report-post.html', import.meta.url),
    'utf8',
  );

  assert.match(
    layout,
    /\{\{\s*content\s*\}\}/,
    'report-post must render {{ content }} or Jekyll drops every historical report body',
  );
});

test('report home keeps the page content-first', async () => {
  const layout = await fs.readFile(
    new URL('../docs/_layouts/report-home.html', import.meta.url),
    'utf8',
  );

  assert.match(layout, /<article class="report">\s*\{\{ content \}\}/);
  assert.match(layout, /<span>V2EX 每日热点<\/span>/);
  assert.match(layout, /<h1 class="kicker"><time datetime="\{\{ page\.target_date \}\}">\{\{ page\.target_date \| date: "%Y年%m月%d日" \}\}<\/time>热点内容<\/h1>/);
  assert.match(layout, /\.kicker\s*\{[^}]*color: var\(--ink\)[^}]*font-size: 28px[^}]*font-weight: 700/s);
  assert.doesNotMatch(layout, /kicker-date|kicker-label/);
  assert.match(layout, /\.topic-card > summary/);
  assert.match(layout, /\.topic-card > summary\s*\{[^}]*padding: 15px 0/s);
  assert.match(layout, /\.topic-title/);
  assert.match(layout, /class="date-sidebar"/);
  assert.match(layout, /<aside class="date-sidebar" aria-label="往期热点">/);
  assert.match(layout, /<h2>往期热点<\/h2>/);
  assert.match(layout, /<nav class="date-list" aria-label="日期列表">/);
  assert.match(layout, /id="report-date-select"/);
  assert.match(layout, /\.topic-card\.is-read/);
  assert.match(layout, /\.topic-card\.is-read > summary:hover \.topic-title/);
  assert.match(layout, /\.topic-article/);
  assert.match(layout, /\.topic-article h3/);
  assert.doesNotMatch(layout, /\.topic-article h3::before/);
  assert.match(layout, /\.topic-article pre/);
  assert.match(layout, /\.topic-source/);
  assert.match(layout, /\.topic-content::before/);
  assert.match(layout, /summary:has\(\.topic-title:hover\)::after/);
  assert.match(layout, /\.topic-card\[open\] > summary::after/);
  assert.match(layout, /--accent: #d92d20/);
  assert.match(layout, /\.topic-article ul li::before/);
  assert.match(layout, /\.mobile-date-jump select\s*\{[^}]*min-height: 44px/s);
  assert.match(layout, /\.page-shell\s*\{[^}]*padding: 36px 0 56px/s);
  assert.match(layout, /\.topic-card > summary\s*\{[^}]*min-height: 52px[^}]*padding: 13px 0/s);
  assert.match(layout, /@keyframes topic-content-reveal/);
  assert.match(layout, /prefers-reduced-motion: no-preference/);
  assert.match(layout, /\.topic-card\[open\] > \.topic-content/);
  assert.match(layout, /localStorage\.setItem\(readStorageKey/);
  assert.match(layout, /replace\('原标题：', '原链接：'\)/);
  assert.match(layout, /insertBefore\(source, article\)/);
  assert.match(layout, /content\.append\(source, followingArticle\)/);
  assert.match(layout, /document\.querySelectorAll\('\.topic-article a\[href\]'\)/);
  assert.match(layout, /link\.target = '_blank'/);
  assert.match(layout, /link\.rel = 'noopener noreferrer'/);
  assert.doesNotMatch(layout, /\.topic-(?:article|source)::before/);
  assert.equal((layout.match(/<label for="report-date-select">切换日期<\/label>/g) || []).length, 1);
  assert.doesNotMatch(layout, /昨日内容精选|class="metrics"|page\.hero_title/);
  assert.doesNotMatch(layout, /date-month|报告日期|选择报告日期|按日期查看报告/);
  assert.doesNotMatch(layout, /topic-summary-meta|topic-read-state|topic-toggle|topic-risk/);
  assert.doesNotMatch(layout, /class="archive"|href="#archive"/);
  assert.doesNotMatch(layout, /summary-panel|trend-list|topic-list|阅读全文/);
});

test('publisher exposes valuable topic count without duplicating report cards', async () => {
  const publisher = await fs.readFile(
    new URL('../scripts/publish_github_pages.mjs', import.meta.url),
    'utf8',
  );

  assert.match(publisher, /count_valuable:/);
  assert.match(publisher, /function reportUrl\(dateText\)/);
  assert.doesNotMatch(publisher, /\/v2ex\/daily-report\//);
  assert.doesNotMatch(publisher, /frontMatterInsights|top_topics:/);
});

test('report URLs use a date-only permalink', async () => {
  const config = await fs.readFile(new URL('../docs/_config.yml', import.meta.url), 'utf8');
  assert.match(config, /^permalink: \/:year\/:month\/:day\/$/m);
});

test('site icon uses a left-pointing white mark on hotspot red', async () => {
  const icon = await fs.readFile(new URL('../docs/assets/v2ex-hot-icon.svg', import.meta.url), 'utf8');
  assert.match(icon, /fill="#e53935"/);
  assert.match(icon, /fill="#fff"/);
  assert.doesNotMatch(icon, /transform="rotate\(/);
  assert.match(icon, /白色朝左箭头/);
  assert.doesNotMatch(icon, /#2563eb/);
});

test('site footer credits the developer without an official-site disclaimer', async () => {
  const layout = await fs.readFile(new URL('../docs/_layouts/report-home.html', import.meta.url), 'utf8');
  assert.match(layout, /Developed by/);
  assert.match(layout, /href="https:\/\/github\.com\/neilwong2012\/daily-v2ex-yesterday-report"/);
  assert.doesNotMatch(layout, /并非 V2EX 官方网站/);
});
