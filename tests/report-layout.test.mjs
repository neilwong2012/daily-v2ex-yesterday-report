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
