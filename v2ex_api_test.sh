#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://www.v2ex.com/api/v2"
ENDPOINT="${1:-token}"
PROXY_URL="${V2EX_PROXY:-${HTTPS_PROXY:-http://127.0.0.1:10080}}"

if [[ -z "${V2EX_TOKEN:-}" ]]; then
  echo "Missing V2EX_TOKEN."
  echo "Usage: V2EX_TOKEN='your-personal-access-token' $0 token"
  echo "Example endpoints: token, member, nodes/python, nodes/python/topics?p=1, topics/1"
  exit 1
fi

curl -sS \
  -x "${PROXY_URL}" \
  -H "Authorization: Bearer ${V2EX_TOKEN}" \
  -H "Accept: application/json" \
  "${BASE_URL}/${ENDPOINT}" |
  if command -v jq >/dev/null 2>&1; then
    jq .
  else
    cat
  fi
