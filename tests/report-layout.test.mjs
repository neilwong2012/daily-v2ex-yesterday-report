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
  assert.match(layout, /count_valuable/);
  assert.match(layout, /\.topic-card > summary/);
  assert.match(layout, /\.topic-title/);
  assert.match(layout, /class="date-sidebar"/);
  assert.match(layout, /id="report-date-select"/);
  assert.match(layout, /\.topic-card\.is-read/);
  assert.match(layout, /\.topic-card\.is-read > summary:hover \.topic-title/);
  assert.match(layout, /\.topic-article/);
  assert.match(layout, /\.topic-article h3/);
  assert.match(layout, /\.topic-article pre/);
  assert.match(layout, /\.topic-source/);
  assert.match(layout, /--accent: #d92d20/);
  assert.match(layout, /\.topic-article::before/);
  assert.match(layout, /\.topic-article ul li::before/);
  assert.match(layout, /@keyframes topic-content-reveal/);
  assert.match(layout, /prefers-reduced-motion: no-preference/);
  assert.match(layout, /\.topic-card\[open\] > \.topic-article/);
  assert.match(layout, /localStorage\.setItem\(readStorageKey/);
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

test('site icon uses a white mark on hotspot red', async () => {
  const icon = await fs.readFile(new URL('../docs/assets/v2ex-hot-icon.svg', import.meta.url), 'utf8');
  assert.match(icon, /fill="#e53935"/);
  assert.match(icon, /fill="#fff"/);
  assert.doesNotMatch(icon, /#2563eb/);
});
