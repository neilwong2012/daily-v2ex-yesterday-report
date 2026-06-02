# Daily V2EX Yesterday Report

This repository runs a daily V2EX API 2.0 report and publishes the generated Markdown report to GitHub Pages.

The report uses the Asia/Shanghai date boundary and always excludes `二手交易` and `推广` from analysis, trend counts, high-signal selection, and recommendations.

## Setup

1. Create a V2EX Personal Access Token.
2. Add it as a repository secret named `V2EX_TOKEN`.
3. Enable GitHub Pages for this repository with **Build and deployment: GitHub Actions**.
4. Keep the `Daily V2EX Yesterday Report` workflow enabled.

## Run Locally

```bash
V2EX_TOKEN=your-token npm run report
npm run publish:blog
```

Optional variables:

- `V2EX_DATE=YYYY-MM-DD`: generate a specific target date instead of yesterday.
- `V2EX_SCAN_LIMIT=1400`: fallback scan limit.
- `V2EX_SEARCH_WINDOW=6000`: date-bound binary-search window around the latest topic id.

## Outputs

For target date `YYYY-MM-DD`, the scripts generate:

- `v2ex_YYYY-MM-DD_raw.json`
- `v2ex_YYYY-MM-DD_report.md`
- `docs/_posts/YYYY-MM-DD-v2ex-yesterday-report.md`
- `docs/data/YYYY-MM-DD.json`

If the API is blocked, the report script writes:

- `v2ex_YYYY-MM-DD_failure.json`
- `v2ex_YYYY-MM-DD_report_blocked.md`

The publishing script can also publish the blocked report so the Pages site reflects the failed run.
