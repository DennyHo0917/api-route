# AI Gateway Token Transparency & Accounting Benchmark

[![Status](https://img.shields.io/badge/Audit-Passed%20(Zero--Injection)-brightgreen.svg)](https://www.api-route.com/blog/ai-proxy-token-transparency-benchmark)
[![Gateway](https://img.shields.io/badge/Gateway-global.api--route.com-emerald.svg)](https://global.api-route.com)

Empirical benchmark suite and technical audit comparing third-party AI proxy billing practices: **synthetic prompt caching and hidden system prompt injection vs. API Route's byte-for-byte zero-tampering standard**.

---

## 1. Executive Summary: The "Low-Price" Illusion in AI Proxies

Across the AI gateway and model proxy market, providers frequently advertise steep discounts (e.g., 50% to 80% below official list rates). However, comprehensive industry benchmarks reveal an open secret: **many seemingly cheap providers artificially inflate the bill by injecting massive hidden prompts and reporting synthetic cache statistics.**

When an upstream proxy silently injects unrequested system instructions or fabricates token usage metrics:
- A single request with 1,500 actual tokens can be reported—and billed—at **15,000 to 28,000 tokens**.
- Multi-turn dialogues compound exponentially, growing by **10,000+ tokens per turn** instead of the real context growth of ~1,400 tokens, reaching **4× to 5× real size by Turn 8**.
- What appeared to be a "low-multiplier" supplier actually costs **200% to 400% more in real dollars**, with costs escalating the longer a session continues.

API Route was engineered to establish the opposite standard: **Absolute Zero-Tampering Passthrough.**

| Metric / Dimension | Typical "Discount" AI Proxies | API Route Gateway (`global.api-route.com`) |
| :--- | :--- | :--- |
| **Prompt Injection** | Silently injects 5,000–20,000 hidden system tokens | **0 Tokens Injected** (Exact byte-for-byte passthrough) |
| **Initial Session Cache** | Reports 20,000+ fake cache reads on fresh sessions | **0 Fake Cache Reads** (Strictly obeys prefix trees) |
| **Cache Write Integrity** | Rigid mathematical formula (~18% fixed write ratio) | **Exact Prompt Delta** (Only writes newly added tokens) |
| **Multi-Turn Context Growth** | Explodes by 10K+ tokens/turn (4.2× inflation by Turn 8) | **Matches True Context** (~1.46K/turn exact growth) |
| **Tokenizer Parity (GPT/Claude)** | Systematic 1.30× markup or bloated token counts | **1.00× Parity** (Matches official tokenizer 100%) |
| **Verification Endpoint** | Blocked or returns HTTP 404 | **Active `/v1/messages/count_tokens` Support** |
| **Effective Total Cost** | **2×–4× more expensive** despite nominal low multiplier | **Predictable, honest, and mathematically accurate** |

---

## 2. Anatomy of the Proxy Billing Traps

Our empirical research into downstream aggregators and third-party relay providers identified three predominant techniques used to extract inflated token charges:

### Trap 1: The "Impossible Cache Read" on Turn 0
Prefix-based prompt caching (such as Anthropic Claude's ephemeral prompt caching) requires an **exact byte-for-byte prefix match**. If a request begins with a globally unique cryptographic UUID (e.g. `Session 8f9b...`), it is mathematically impossible for that prompt prefix to exist in any server cache.

- **Observed Behavior on Other Proxies:** On Turn 0 of a brand-new session with a random nonce, competitors report **21,800 to 22,372 `cache_read_input_tokens`**.
- **The Reality:** The cache reads are completely simulated. The proxy claims a "cache read" to look technically sophisticated while manipulating the billed token base.

### Trap 2: The Fixed-Ratio Synthetic Cache Formula
In legitimate prompt caching, newly appended text is recorded in `cache_creation_input_tokens`, while unchanged prior context is recorded in `cache_read_input_tokens`.

- **Observed Behavior on Other Proxies:** Regardless of whether the user added 50 tokens or 1,500 tokens, the reported `cache_creation_input_tokens` divided by total tokens yields an exact, invariant constant across every turn:
  $$\frac{\text{Cache Write}}{\text{Total Tokens}} \equiv 18.00\%$$
- **The Reality:** The proxy calculates fake cache values using a hardcoded script (approximately **18% write + 76% read + 6% base input**). This arbitrary formula systematically inflates total billed volume without reflecting actual prompt changes.

### Trap 3: Compounding Token Escalation
In multi-turn agentic or chat workflows, each turn adds a predictable delta of new context:

```
Expected Growth:   [Context: 13.2K] ──(+1.46K)──► [14.6K] ──(+1.46K)──► [16.1K] ──(+1.46K)──► [17.6K] ... Turn 8: [23.4K]
Inflated Growth:   [Reported: 28.7K] ──(+10.7K)──► [33.4K] ──(+10.7K)──► [44.1K] ──(+10.7K)──► [54.7K] ... Turn 8: [97.4K] (4.2x)
```

By compounding the token base at over **10,600 tokens per turn**, an application running an 8-turn conversation pays for **97,400 tokens instead of the true 23,404 tokens**—wiping out any nominal discount and making long-context tasks prohibitively expensive.

---

## 3. Quickstart: Running the Benchmark

The included test harness `usage_test.py` requires Python 3 with standard library only (zero external packages like `requests` or `urllib3` needed).

### Auditing API Route Gateway
```bash
BASE_URL="https://global.api-route.com" \
API_KEY="sk-your-key-here" \
python3 usage_test.py claude-sonnet-5-5 gpt-6-sol
```

### Auditing Any Third-Party Proxy
```bash
BASE_URL="https://competitor-proxy.com" \
API_KEY="sk-their-key-here" \
python3 usage_test.py claude-sonnet-5-5 gpt-6-sol
```

### Configuration Options
| Environment Variable | Description | Default |
| :--- | :--- | :--- |
| `BASE_URL` | Root endpoint of target gateway | `https://global.api-route.com` |
| `API_KEY` | Bearer token / API key | *(Required)* |
| `DIALOGS` | Number of independent conversation sessions | `2` |
| `TURNS` | Number of consecutive turns per session | `8` |
| `GAP` | Seconds between turns (within 5m cache TTL) | `30` |

---

## 4. Empirical Benchmark Data

### 4.1 Claude Opus 5.5 & Sonnet 5.5: Multi-Turn Audit

Identical prompt sequence executed against a typical "low-cost" proxy provider vs. API Route Production (`https://global.api-route.com`):

| Turn | Real Context Growth | Competitor Reported | Competitor Cache Read | Competitor Cache Write | API Route Reported | API Route Cache Read | API Route Cache Write |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Turn 0** | 13,177 tokens | **28,682** | **22,372 (Fake)** | 5,162 (18.0%) | **13,177 (Exact)** | **0 (Accurate)** | 13,173 |
| **Turn 1** | 14,638 tokens | **33,397** | 26,718 | 6,011 (18.0%) | **14,638 (Exact)** | 0 | 14,634 |
| **Turn 2** | 16,099 tokens | **44,060** | 35,249 | 7,931 (18.0%) | **16,099 (Exact)** | 14,634 | 1,461 |
| **Turn 3** | 17,560 tokens | **54,726** | 43,234 | 9,850 (18.0%) | **17,560 (Exact)** | 16,095 | 1,461 |
| **Turn 4** | 19,021 tokens | **65,393** | 52,315 | 11,770 (18.0%) | **19,021 (Exact)** | 17,556 | 1,461 |
| **Turn 5** | 20,482 tokens | **76,063** | 60,850 | 13,692 (18.0%) | **20,482 (Exact)** | 19,017 | 1,461 |
| **Turn 6** | 21,943 tokens | **86,730** | 65,914 | 15,612 (18.0%) | **21,943 (Exact)** | 20,478 | 1,461 |
| **Turn 7** | 23,404 tokens | **97,400** | 74,023 | 17,532 (18.0%) | **23,404 (Exact)** | 21,939 | 1,461 |

#### Observations
1. **Zero Fake Cache Reads on Turn 0:** In API Route, Turn 0 correctly returns `cache_read_input_tokens: 0`. The competitor returned `22,372`, creating billed tokens out of thin air.
2. **True Delta Tracking:** Each subsequent turn adds an extra note block of exactly $1,461$ tokens. On API Route, `cache_read` tracks the prior context and `cache_write` records exactly $1,461$ tokens. On the competitor, total tokens jump by over $10,660$ tokens each turn.
3. **Compound Cost Divergence:** By Turn 7, the competitor bills for **97,400 tokens** for a dialogue that contains only **23,404 tokens**. Even if the competitor offered a nominal "50% discount", you pay:
   $$\text{Competitor Bill} = 97,400 \times 0.50 = 48,700 \text{ billing units}$$
   $$\text{API Route Bill} = 23,404 \times 1.00 = 23,404 \text{ billing units}$$
   **The "discounted" provider is actually more than 2× as expensive in real money.**

---

### 4.2 OpenAI GPT Series: 1.00× Tokenizer Parity

Benchmarking `gpt-6-sol` and `gpt-5.6-terra` demonstrated that competitor proxies apply a systematic **1.30× markup** on input tokens:

| Model | Turn | Competitor Proxy | API Route Gateway | Official OpenAI Baseline | Variance on API Route |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `gpt-6-sol` | Turn 0 | 10,724 tokens | **8,258 tokens** | 8,260 tokens | **0.00%** |
| `gpt-6-sol` | Turn 7 | 20,248 tokens | **15,582 tokens** | 15,580 tokens | **0.00%** |
| `gpt-5.6-terra` | Turn 0 | 10,724 tokens | **8,258 tokens** | 8,260 tokens | **0.00%** |

API Route forwards GPT requests without tokenizer padding, prefix injection, or synthetic multipliers. Every billed token corresponds strictly to user-dispatched tokens.

---

## 5. Developer Checklist: How to Audit Your AI Proxy

If you are using any AI aggregator or proxy service, use this 4-step checklist:

1. **Check Turn 0 Cache Reads:** Send a brand-new prompt with a 32-character random UUID at the start of the system prompt. If the provider returns `cache_read_input_tokens > 0`, **the provider is fabricating cache metrics.**
2. **Check Cache Write Proportions:** Calculate $\frac{\text{cache\_creation\_input\_tokens}}{\text{total\_input\_tokens}}$ across consecutive turns. If this fraction remains constant (such as $18.00\%$) regardless of added text, **the provider is using a synthetic billing formula.**
3. **Verify Context Growth Against Tokenizer:** Count tokens in Turn $N$. If your added text is 1,000 tokens, but the provider's total reported input increases by 5,000–10,000 tokens, **the provider is injecting hidden prompts or compounding phantom context.**
4. **Query `/v1/messages/count_tokens`:** Send your payload to `/v1/messages/count_tokens`. An honest gateway will return the exact pre-flight token count:

```bash
curl -X POST https://global.api-route.com/v1/messages/count_tokens \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-5-5",
    "messages": [{"role": "user", "content": "Hello, world!"}]
  }'
```
Response:
```json
{
  "input_tokens": 10
}
```

If the endpoint returns HTTP 404 or fails to match your billed usage, the provider cannot be independently audited.

---

## 6. Official Resources

- **Website:** [https://www.api-route.com](https://www.api-route.com)
- **Live Pricing:** [https://www.api-route.com/pricing](https://www.api-route.com/pricing)
- **Technical Blog Article:** [AI Gateway Transparency: Token Inflation, Synthetic Caching, and Real API Costs](https://www.api-route.com/blog/ai-proxy-token-transparency-benchmark)
- **API Base URL:** `https://global.api-route.com`
