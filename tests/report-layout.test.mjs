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
  assert.doesNotMatch(layout, /summary-panel|trend-list|topic-list|阅读全文/);
});

test('publisher exposes valuable topic count without duplicating report cards', async () => {
  const publisher = await fs.readFile(
    new URL('../scripts/publish_github_pages.mjs', import.meta.url),
    'utf8',
  );

  assert.match(publisher, /count_valuable:/);
  assert.doesNotMatch(publisher, /frontMatterInsights|top_topics:/);
});
