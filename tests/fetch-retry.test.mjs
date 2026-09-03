import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

function shanghaiEpoch(date, hour = 12) {
  return Math.floor(new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+08:00`).getTime() / 1000);
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function copyRuntime(tempDir) {
  await fs.mkdir(path.join(tempDir, 'lib'), { recursive: true });
  await Promise.all([
    fs.copyFile(new URL('../fetch_v2ex_yesterday.mjs', import.meta.url), path.join(tempDir, 'fetch_v2ex_yesterday.mjs')),
    fs.copyFile(new URL('../lib/deepseek-analysis.mjs', import.meta.url), path.join(tempDir, 'lib/deepseek-analysis.mjs')),
    fs.copyFile(new URL('../lib/report-renderer.mjs', import.meta.url), path.join(tempDir, 'lib/report-renderer.mjs')),
  ]);
}

test('retries a 522 response, records it, and continues the topic scan', async (t) => {
  const requests = new Map();
  const server = http.createServer(async (req, res) => {
    if (req.url === '/chat/completions') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const request = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const document = JSON.parse(request.messages[1].content);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({
          topic_id: document.topic.id,
          value_score: 82,
          score_breakdown: {
            information_density: 20,
            actionability: 20,
            evidence_quality: 15,
            novelty: 12,
            topic_consistency: 10,
            credibility: 5,
          },
          keep: true,
          title_content_consistent: true,
          has_reusable_information: true,
          category: '经验与教程',
          optimized_title: '经过验证的测试方法',
          article: '先验证输入，再执行后续步骤。这一方法已经过测试，可以复用。',
          recommendation_reason: '包含经过验证、可以复用的测试方法。',
          summary: '包含可以复用的测试经验。',
          core_information: ['先验证输入，再执行后续步骤。'],
          actionable_steps: ['先验证输入。'],
          comment_consensus: [],
          comment_disagreements: [],
          caveats: [],
          evidence_reply_ids: [],
          risk_flags: ['无'],
        }) } }],
      }));
      return;
    }

    if (req.url?.endsWith('/replies')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: true, result: [] }));
      return;
    }

    const id = Number(req.url?.split('/').at(-1));
    requests.set(id, (requests.get(id) || 0) + 1);

    if (id === 2) {
      res.writeHead(522);
      res.end();
      return;
    }

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      result: {
        id,
        title: '普通测试主题',
        content: '测试内容',
        content_rendered: '测试内容',
        url: `https://www.v2ex.com/t/${id}`,
        created: shanghaiEpoch('2026-08-03'),
        replies: 0,
        stars: 1,
        node: { title: '问与答' },
        member: { username: 'tester' },
      },
    }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'v2ex-retry-test-'));
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));
  await copyRuntime(tempDir);

  const { port } = server.address();
  const result = await run(process.execPath, ['fetch_v2ex_yesterday.mjs'], {
    cwd: tempDir,
    env: {
      ...process.env,
      V2EX_TOKEN: 'test-token',
      V2EX_DATE: '2026-08-03',
      V2EX_SCAN_START: '2',
      V2EX_SCAN_END: '1',
      V2EX_API_BASE_URL: `http://127.0.0.1:${port}/api/v2`,
      V2EX_API_MAX_RETRIES: '2',
      V2EX_API_RETRY_BASE_MS: '1',
      V2EX_API_RETRY_MAX_MS: '2',
      DEEPSEEK_API_KEY: 'test-only-key',
      DEEPSEEK_BASE_URL: `http://127.0.0.1:${port}`,
      DEEPSEEK_CONCURRENCY: '1',
      DEEPSEEK_MAX_RETRIES: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.equal(result.code, 0, result.stderr);
  assert.equal(requests.get(2), 3, 'initial request plus two retries');
  assert.equal(requests.get(1), 1);
  assert.match(result.stderr, /retry 1\/2/);
  assert.match(result.stderr, /Skipping topic 2 after retries were exhausted/);

  const raw = JSON.parse(await fs.readFile(path.join(tempDir, 'v2ex_2026-08-03_raw.json'), 'utf8'));
  assert.equal(raw.scannedTopicCount, 1);
  assert.equal(raw.scanErrors.length, 1);
  assert.equal(raw.counts.analysisSuccess, 1);
  assert.equal(raw.counts.valuable, 1);
  assert.deepEqual(raw.scanErrors[0], {
    id: 2,
    status: 522,
    error: 'ApiError: 522 topics/2: | status=522 | endpoint=topics/2',
  });
  const report = await fs.readFile(path.join(tempDir, 'v2ex_2026-08-03_report.md'), 'utf8');
  assert.doesNotMatch(report, /## 值得读的内容|按综合价值评分排列/);
  assert.match(report, /这一方法已经过测试，可以复用/);
  assert.match(report, /原链接：<a[^>]+target="_blank"[^>]*>普通测试主题<\/a>/);
  assert.doesNotMatch(report, /报告说明|重试耗尽后跳过的临时 API 错误/);
  const replyArchive = JSON.parse(await fs.readFile(path.join(tempDir, 'v2ex_yesterday_data/replies_2026-08-03.json'), 'utf8'));
  assert.equal(replyArchive.topics.length, 1);
});

test('downloads replies and calls DeepSeek only for the top 100 eligible topics', async (t) => {
  const replyRequests = [];
  const analysisRequests = [];
  const server = http.createServer(async (req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.url === '/chat/completions') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const request = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const document = JSON.parse(request.messages[1].content);
      analysisRequests.push(document.topic.id);
      res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        topic_id: document.topic.id,
        score_breakdown: {
          information_density: 20,
          actionability: 20,
          evidence_quality: 15,
          novelty: 12,
          topic_consistency: 10,
          credibility: 5,
        },
        keep: true,
        title_content_consistent: true,
        has_reusable_information: true,
        category: '经验与教程',
        optimized_title: `精选测试主题 ${document.topic.id}`,
        article: '先验证输入，再执行后续步骤。',
        evidence_reply_ids: [],
        risk_flags: ['无'],
      }) } }] }));
      return;
    }
    if (req.url?.endsWith('/replies')) {
      const id = Number(req.url.split('/').at(-2));
      replyRequests.push(id);
      res.end(JSON.stringify({ success: true, result: [] }));
      return;
    }
    const id = Number(req.url?.split('/').at(-1));
    res.end(JSON.stringify({ success: true, result: {
      id,
      title: `测试主题 ${id}`,
      content: '可复用的测试方法',
      url: `https://www.v2ex.com/t/${id}`,
      created: shanghaiEpoch('2026-08-03'),
      replies: id === 1 || id === 108 ? 0 : id >= 106 ? 10000 : id,
      stars: id === 1 ? 100 : 0,
      node: { title: id === 106 ? '二手交易' : id === 107 ? '推广' : '问与答' },
    } }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'v2ex-top100-test-'));
  t.after(() => fs.rm(tempDir, { recursive: true, force: true }));
  await copyRuntime(tempDir);
  const { port } = server.address();
  const result = await run(process.execPath, ['fetch_v2ex_yesterday.mjs'], {
    cwd: tempDir,
    env: {
      ...process.env,
      V2EX_TOKEN: 'test-token',
      V2EX_DATE: '2026-08-03',
      V2EX_SCAN_START: '108',
      V2EX_SCAN_END: '1',
      V2EX_API_BASE_URL: `http://127.0.0.1:${port}/api/v2`,
      V2EX_API_MAX_RETRIES: '0',
      V2EX_SKIP_AI: '0',
      DEEPSEEK_API_KEY: 'test-only-key',
      DEEPSEEK_BASE_URL: `http://127.0.0.1:${port}`,
      DEEPSEEK_CONCURRENCY: '1',
      DEEPSEEK_MAX_RETRIES: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.equal(result.code, 0, result.stderr);
  const expectedIds = [1, ...Array.from({ length: 99 }, (_, index) => 105 - index)];
  assert.deepEqual(replyRequests, expectedIds);
  assert.deepEqual(analysisRequests, expectedIds);
  const raw = JSON.parse(await fs.readFile(path.join(tempDir, 'v2ex_2026-08-03_raw.json'), 'utf8'));
  assert.equal(raw.counts.allCreated, 108);
  assert.equal(raw.counts.excludedByNode, 2);
  assert.equal(raw.counts.excludedNoEngagement, 1);
  assert.equal(raw.counts.excludedByLimit, 5);
  assert.equal(raw.counts.excluded, 8);
  assert.equal(raw.counts.included, 100);
  assert.equal(raw.counts.analysisSuccess, 100);
  assert.equal(raw.deepseek.stats.requested, 100);
  assert.deepEqual(raw.includedTopics.map((topic) => topic.id), expectedIds);
  const archive = JSON.parse(await fs.readFile(path.join(tempDir, 'v2ex_yesterday_data/replies_2026-08-03.json'), 'utf8'));
  assert.deepEqual(archive.topics.map((item) => item.topic.id), expectedIds);
  const report = await fs.readFile(path.join(tempDir, 'v2ex_2026-08-03_report.md'), 'utf8');
  assert.equal((report.match(/class="topic-card"/g) || []).length, 100);
  assert.doesNotMatch(report, /data-topic-id="(?:2|3|4|5|6|106|107|108)"/);
});

for (const gapStatus of [404, 522]) {
  test(`date-bound binary search skips a ${gapStatus} topic gap`, async (t) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/recent') {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end([
          '<div class="cell item">',
          '<span title="2026-08-04 12:00:00 +08:00"></span>',
          '<a href="/t/10" class="topic-link" id="topic-link-10">最新主题</a>',
          '</div>',
        ].join(''));
        return;
      }

      if (req.url?.endsWith('/replies')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ success: true, result: [] }));
        return;
      }

      const id = Number(req.url?.split('/').at(-1));
      if (id === 5) {
        res.writeHead(gapStatus);
        res.end();
        return;
      }

      const date = id < 4 ? '2026-08-02' : id < 8 ? '2026-08-03' : '2026-08-04';
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        result: {
          id,
          title: `边界测试主题 ${id}`,
          content: '测试内容',
          content_rendered: '测试内容',
          url: `https://www.v2ex.com/t/${id}`,
          created: shanghaiEpoch(date),
          replies: 0,
          stars: 0,
          node: { title: '问与答' },
          member: { username: 'tester' },
        },
      }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => server.close());

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `v2ex-boundary-${gapStatus}-`));
    t.after(() => fs.rm(tempDir, { recursive: true, force: true }));
    await copyRuntime(tempDir);

    const { port } = server.address();
    const result = await run(process.execPath, ['fetch_v2ex_yesterday.mjs'], {
      cwd: tempDir,
      env: {
        ...process.env,
        V2EX_TOKEN: 'test-token',
        V2EX_DATE: '2026-08-03',
        V2EX_BASE_URL: `http://127.0.0.1:${port}`,
        V2EX_API_BASE_URL: `http://127.0.0.1:${port}/api/v2`,
        V2EX_BOUND_SEARCH_START: '1',
        V2EX_API_MAX_RETRIES: '0',
        V2EX_API_RETRY_BASE_MS: '0',
        V2EX_API_RETRY_MAX_MS: '0',
        V2EX_USE_PROXY: '0',
        V2EX_SKIP_AI: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    assert.equal(result.code, 0, result.stderr);
    assert.doesNotMatch(result.stderr, /ReferenceError|isRetryableApiGap/);
    assert.match(result.stderr, /date bounds: 2026-08-03 id 4-7/);

    const raw = JSON.parse(await fs.readFile(path.join(tempDir, 'v2ex_2026-08-03_raw.json'), 'utf8'));
    assert.deepEqual(raw.allCreatedTopics.map((topic) => topic.id), [4, 6, 7]);
    assert.equal(raw.scanErrors.length, gapStatus === 522 ? 1 : 0);
  });
}
