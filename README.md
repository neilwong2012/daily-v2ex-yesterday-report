# Daily V2EX Yesterday Report

This repository downloads yesterday's V2EX topics and replies, uses DeepSeek V4 Flash to select high-value content, and publishes the generated Markdown report to GitHub Pages.

The report uses the Asia/Shanghai date boundary and always excludes `二手交易` and `推广` from analysis and recommendations. Each remaining topic is analyzed once using its title, body, and replies, then filtered and ranked by value score without duplicated keyword-based sections.

## Setup

1. Create a V2EX Personal Access Token.
2. Add it as a repository secret named `V2EX_TOKEN`.
3. Create a DeepSeek API key and add it as a repository secret named `DEEPSEEK_API_KEY`.
4. Enable GitHub Pages for this repository with **Build and deployment: GitHub Actions**.
5. Keep the `Daily V2EX Yesterday Report` workflow enabled.

## Run Locally

```bash
V2EX_TOKEN=your-token DEEPSEEK_API_KEY=your-key npm run report
npm run publish:blog
```

Optional variables:

- `V2EX_DATE=YYYY-MM-DD`: generate a specific target date instead of yesterday.
- `V2EX_SCAN_LIMIT=1400`: fallback scan limit.
- `V2EX_SEARCH_WINDOW=6000`: date-bound binary-search window around the latest topic id.
- `V2EX_API_MAX_RETRIES=3`: retries for network errors and transient HTTP responses (408, 425, 429, and 5xx).
- `V2EX_API_RETRY_BASE_MS=500`: initial retry delay; subsequent retries use exponential backoff.
- `V2EX_API_RETRY_MAX_MS=5000`: maximum delay between retries.
- `DEEPSEEK_MODEL=deepseek-v4-flash`: model used for per-topic analysis.
- `DEEPSEEK_CONCURRENCY=4`: number of concurrent topic analyses.
- `DEEPSEEK_VALUE_THRESHOLD=70`: minimum validated score required to keep a topic.
- `DEEPSEEK_MIN_SUCCESS_RATIO=0.8`: block publication when too many analyses fail.
- `DEEPSEEK_MAX_INPUT_CHARS=200000`: per-topic input limit; all replies are still archived locally.

After retries are exhausted, an isolated transient topic error is recorded in `scanErrors` and skipped so the rest of the daily report can finish. Authentication and rate-limit failures still block the run.

All topic and reply text is treated as untrusted data. DeepSeek receives one topic at a time without tools, and its JSON response is validated, length-limited, stripped of HTML, and checked against real topic and reply IDs before it can enter the report.

The final score is recomputed locally from six bounded components: information density (25), actionability (25), evidence quality (20), novelty (15), topic consistency (10), and credibility (5). Advertising, insufficient information, title/content mismatch, or the absence of reusable information is a hard rejection regardless of the model's requested keep flag.

To rebuild a report from an existing raw analysis without calling DeepSeek again:

```bash
V2EX_DATE=YYYY-MM-DD npm run rebuild:report
V2EX_DATE=YYYY-MM-DD npm run publish:blog
```

## Outputs

For target date `YYYY-MM-DD`, the scripts generate:

- `v2ex_YYYY-MM-DD_raw.json`
- `v2ex_YYYY-MM-DD_report.md`
- `v2ex_yesterday_data/replies_YYYY-MM-DD.json`
- `docs/_posts/YYYY-MM-DD-v2ex-yesterday-report.md`
- `docs/data/YYYY-MM-DD.json`

If the API is blocked, the report script writes:

- `v2ex_YYYY-MM-DD_failure.json`
- `v2ex_YYYY-MM-DD_report_blocked.md`

The publishing script can also publish the blocked report so the Pages site reflects the failed run.
