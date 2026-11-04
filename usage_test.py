#!/usr/bin/env python3
"""
AI Gateway Token Usage & Cache Fidelity Audit Harness
Open Source Tool by API Route (https://www.api-route.com)

Usage:
  BASE_URL=https://global.api-route.com API_KEY=sk-... python3 usage_test.py claude-sonnet-5-5 gpt-6-sol

Optional Environment Variables:
  DIALOGS=2    Number of independent conversation sessions (default: 2)
  TURNS=8      Number of consecutive turns per session (default: 8)
  GAP=30       Seconds between turns within ephemeral cache window (default: 30)
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get('BASE_URL', 'https://global.api-route.com').rstrip('/')
KEY = os.environ.get('API_KEY', '')
DIALOGS = int(os.environ.get('DIALOGS', 2))
TURNS = int(os.environ.get('TURNS', 8))
GAP = int(os.environ.get('GAP', 30))


def post(path, body):
    """Executes an authenticated JSON POST request."""
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'api-route-transparency-audit/1.0',
            'x-api-key': KEY,
            'Authorization': f'Bearer {KEY}',
            'anthropic-version': '2023-06-01',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, {'error': e.read().decode('utf-8', errors='replace')[:200]}


def claude_turn(model, system, msgs):
    """Executes a Claude turn, inspecting both /v1/messages and /v1/messages/count_tokens."""
    body = {
        'model': model,
        'max_tokens': 30,
        'system': [
            {'type': 'text', 'text': system, 'cache_control': {'type': 'ephemeral'}}
        ],
        'messages': msgs,
    }
    count_status, count = post(
        '/v1/messages/count_tokens',
        {k: body[k] for k in ('model', 'system', 'messages')},
    )
    status, d = post('/v1/messages', body)
    u = d.get('usage') or {}
    text = ''.join(b.get('text', '') for b in d.get('content', []) if isinstance(b, dict)) or '-'
    counted = count.get('input_tokens') if count_status == 200 else f'HTTP {count_status}'
    inp = u.get('input_tokens', 0)
    read = u.get('cache_read_input_tokens', 0)
    write = u.get('cache_creation_input_tokens', 0)
    out = u.get('output_tokens', 0)
    return status, counted, inp, read, write, out, text, d.get('error')


def gpt_turn(model, system, msgs, cache_key):
    """Executes a GPT turn on /v1/responses with prompt_cache_key."""
    body = {
        'model': model,
        'instructions': system,
        'input': msgs,
        'max_output_tokens': 40,
        'prompt_cache_key': cache_key,
    }
    status, d = post('/v1/responses', body)
    u = d.get('usage') or {}
    det = u.get('input_tokens_details') or {}
    read = det.get('cached_tokens', 0)
    write = det.get('cache_write_tokens', 0)
    raw_input = u.get('input_tokens', 0)
    inp = max(0, raw_input - read - write)
    out = u.get('output_tokens', 0)
    text = ''
    for item in d.get('output', []):
        if isinstance(item, dict):
            for c in item.get('content') or []:
                if isinstance(c, dict):
                    text += c.get('text', '')
    return status, None, inp, read, write, out, text or '-', d.get('error')


def run_audit(model):
    is_claude = model.startswith('claude')
    print(f"\n{'='*70}")
    print(f"AUDITING MODEL: {model} | Sessions: {DIALOGS} | Turns/Session: {TURNS} | Turn Gap: {GAP}s")
    print(f"{'='*70}")
    for dialog in range(DIALOGS):
        nonce = uuid.uuid4().hex
        system = f'Session {nonce}. ' + ' '.join(
            f'Rule {i}: service number {i} returns code {i * 7} and writes log to data{i}.'
            for i in range(1, 320)
        )
        msgs = []
        for turn in range(TURNS):
            if turn > 0:
                time.sleep(GAP)
            extra = ' '.join(
                f'Note {turn}.{j}: audit service {j + turn} and record status.'
                for j in range(60)
            )
            question = f'{extra} What is the code for service {turn + 3}? Output number only.'
            if is_claude:
                msgs.append({
                    'role': 'user',
                    'content': [{'type': 'text', 'text': question, 'cache_control': {'type': 'ephemeral'}}],
                })
                status, counted, inp, read, write, out, text, error = claude_turn(model, system, msgs)
                msgs[-1]['content'][0].pop('cache_control', None)
            else:
                msgs.append({'role': 'user', 'content': question})
                status, counted, inp, read, write, out, text, error = gpt_turn(
                    model, system, msgs, f'audit-{nonce}'
                )
            total = inp + read + write
            print(
                f"[{model}] S{dialog} T{turn} | HTTP {status} | "
                f"CountTokens: {str(counted):>10} | Input: {inp:5d} | "
                f"CacheRead: {read:5d} | CacheWrite: {write:5d} | Total: {total:6d} | Out: {out:3d}"
                + (f" | ERROR: {error}" if status != 200 else "")
            )
            if status == 200:
                msgs.append({'role': 'assistant', 'content': text})
            else:
                msgs.pop()


if __name__ == '__main__':
    if not KEY:
        print("ERROR: API_KEY environment variable is required.", file=sys.stderr)
        print("Example: API_KEY=sk-xxx python3 usage_test.py claude-sonnet-5-5", file=sys.stderr)
        sys.exit(1)
    models_to_test = sys.argv[1:] or ['claude-sonnet-5-5', 'gpt-6-sol']
    for m in models_to_test:
        run_audit(m)
