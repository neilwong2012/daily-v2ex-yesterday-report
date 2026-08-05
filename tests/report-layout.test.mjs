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
  assert.match(layout, /<span>V2EX每日热点回顾<\/span>/);
  assert.match(layout, /<h1 class="kicker"><time datetime="\{\{ page\.target_date \}\}">\{\{ page\.target_date \| date: "%Y年%m月%d日" \}\}<\/time>热点内容<\/h1>/);
  assert.match(layout, /\.kicker\s*\{[^}]*color: var\(--ink\)[^}]*font-size: 46px[^}]*font-weight: 450/s);
  assert.doesNotMatch(layout, /kicker-date|kicker-label/);
  assert.match(layout, /\.topic-card > summary/);
  assert.match(layout, /\.topic-card > summary\s*\{[^}]*min-height: 62px[^}]*padding: 12px var\(--topic-inline\)/s);
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
  assert.match(layout, /\.topic-card > summary:hover::after/);
  assert.match(layout, /\.topic-card\[open\] > summary::after/);
  assert.match(layout, /linear-gradient\(currentColor, currentColor\) center \/ 12px 2px no-repeat/);
  assert.match(layout, /linear-gradient\(currentColor, currentColor\) center \/ 2px 12px no-repeat/);
  assert.match(layout, /background-size: 12px 2px, 2px 0/);
  assert.match(layout, /background-size 180ms cubic-bezier\(\.2, \.8, \.2, 1\)/);
  assert.match(layout, /transform: rotate\(180deg\)/);
  assert.doesNotMatch(layout, /border-right: 2px solid var\(--accent\)/);
  assert.doesNotMatch(layout, /border-bottom: 2px solid var\(--accent\)/);
  assert.match(layout, /--bg: #ffffff/);
  assert.match(layout, /--soft: #f7f7f7/);
  assert.match(layout, /--line: #e0e0e0/);
  assert.match(layout, /--line-strong: #111111/);
  assert.match(layout, /--accent: #e53935/);
  assert.match(layout, /--radius: \.55rem/);
  assert.match(layout, /--font-mono:/);
  assert.match(layout, /\.topic-card\s*\{[^}]*background: var\(--surface\)/s);
  assert.doesNotMatch(layout, /\.topic-card\s*\{[^}]*border:/s);
  assert.doesNotMatch(layout, /\.report-header\s*\{[^}]*border:/s);
  assert.doesNotMatch(layout, /\.date-sidebar\s*\{[^}]*border:/s);
  assert.doesNotMatch(layout, /\.topic-card\[open\] > summary\s*\{[^}]*background:/s);
  assert.doesNotMatch(layout, /\.topic-card > summary:hover\s*\{[^}]*background:/s);
  assert.doesNotMatch(layout, /box-shadow:/);
  assert.match(layout, /--topic-inline: 16px/);
  assert.match(layout, /--topic-rank-size: 26px/);
  assert.match(layout, /margin: 0 18px 20px calc\([\s\S]*var\(--topic-inline\) \+ \(var\(--topic-rank-size\) - var\(--topic-line-width\)\) \/ 2[\s\S]*\)/);
  assert.match(layout, /\.topic-article h3\s*\{[^}]*font: 700 18px\/1\.45 var\(--font-sans\)/s);
  assert.match(layout, /\.topic-article ul li::before/);
  assert.match(layout, /\.mobile-date-jump select\s*\{[^}]*min-height: 44px/s);
  assert.match(layout, /\.page-shell\s*\{[^}]*padding: 24px 0 56px/s);
  assert.match(layout, /\.topic-card > summary\s*\{[^}]*min-height: 58px[^}]*padding-top: 10px[^}]*padding-bottom: 10px/s);
  assert.match(layout, /@keyframes topic-content-reveal/);
  assert.match(layout, /prefers-reduced-motion: no-preference/);
  assert.match(layout, /\.topic-card\[open\] > \.topic-content/);
  assert.match(layout, /localStorage\.setItem\(readStorageKey/);
  assert.match(layout, /replace\('原标题：', '原链接：'\)/);
  assert.match(layout, /content\.append\(article, source\)/);
  assert.match(layout, /source\.querySelector\('\.topic-source-link'\)/);
  assert.match(layout, /\.topic-source\s*\{[^}]*display: flex[^}]*justify-content: space-between[^}]*border-top:/s);
  assert.match(layout, /\.topic-stats\s*\{[^}]*font: 500 11px\/1\.4 var\(--font-mono\)[^}]*white-space: nowrap/s);
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

test('site footer links the repository and carries a concise unofficial notice', async () => {
  const layout = await fs.readFile(new URL('../docs/_layouts/report-home.html', import.meta.url), 'utf8');
  assert.match(layout, /href="https:\/\/github\.com\/neilwong2012\/v2ex\.top"/);
  assert.match(layout, />GitHub · v2ex\.top<\/a>/);
  assert.match(layout, /<p>非官方 · 热点回顾仅供参考<\/p>/);
  assert.match(layout, /\.site-footer-inner\s*\{[^}]*display: flex[^}]*justify-content: space-between/s);
  assert.doesNotMatch(layout, /\.site-footer\s*\{[^}]*border:/s);
});
