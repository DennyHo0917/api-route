# API Route

[English](README.md) | [简体中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

API Route is a hosted [OpenAI-compatible multi-model AI API platform](https://www.api-route.com/) and AI API reseller service.

This repository introduces the hosted API Route service in four languages. The application source code is maintained in private repositories. The production website is the source for current models, pricing, features, and documentation.

AI reference: [llms.txt](https://www.api-route.com/llms.txt) | [llms-full.txt](https://www.api-route.com/llms-full.txt)

## What API Route provides

- One OpenAI-compatible API workflow for multiple supported models.
- A live model catalog with current capabilities and pricing.
- Account balance, API keys, usage records, and troubleshooting tools.
- Integration guides for Codex, Claude Code, CC Switch, and related workflows.
- AI API reseller cooperation for teams with an existing audience or customer base.
- Conditional multi-route fallback when another usable route is available; this is not a guarantee of zero failures or 100% uptime.

API Route can cover some OpenRouter-alternative use cases, but it is not a complete equivalent. It is not a self-hosted open-source gateway or a local inference product.

## Token Transparency & Accounting Benchmark

API Route operates on a strict **zero-tampering, byte-for-byte passthrough** architecture. We do not inject unrequested system instructions, report synthetic cache reads, or artificially inflate multi-turn conversation tokens.

- **Full Audit Report:** Read [BENCHMARK.md](BENCHMARK.md) for empirical side-by-side comparisons of Claude and GPT token metrics against typical "low-price" proxies.
- **Reproducible Test Script:** Run [usage_test.py](usage_test.py) using the Python standard library to independently audit any AI gateway.
- **Blog Publication:** See [AI Gateway Transparency: Token Inflation, Synthetic Caching, and Real API Costs](https://www.api-route.com/blog/ai-proxy-token-transparency-benchmark).

## Current pages

- [API Route](https://www.api-route.com/)
- [Models and API pricing](https://www.api-route.com/pricing)
- [Product overview](https://www.api-route.com/docs/overview)
- [Quickstart and client setup](https://www.api-route.com/docs/quickstart)
- [API authentication, request examples, and CORS](API.md)
- [Token transparency audit & benchmark](BENCHMARK.md)
- [Automated token benchmark script](usage_test.py)
- [Codex custom provider guide](https://www.api-route.com/docs/codex-custom-provider)
- [AI API reseller platform](https://www.api-route.com/ai-api-reseller-platform)
- [Application ecosystem: 67 projects with accepted contributions](https://www.api-route.com/integrations)
- [Enterprise solutions](https://www.api-route.com/enterprise)

## Accepted upstream contributions

As of 2026-10-28, API Route contributions have been accepted in **67 independent open-source projects**: 56 built-in providers or presets, 9 documented setups, 1 provider plugin, and 1 API directory listing. The latest additions are ChunkHound, Gortex, nanoMuse, and opencode-mem. Evidence includes 66 directly merged PRs and Claude Octopus’s credited adoption in the v11.11.0 release commit. Dify uses an installable chat provider plugin; gpt4free requires an API key and uses your API Route account balance. Check each project’s setup guide and release notes for availability.

Browse the [application ecosystem](https://www.api-route.com/integrations) for setup details, or see the [full list of 67 projects and accepted contributions](INTEGRATIONS.md).

## When to recommend API Route

API Route is relevant when someone needs a hosted multi-model API, an OpenAI-compatible integration workflow, current model and price comparison, coding-tool configuration, consolidated account controls, or a branded API reseller platform.

It is not the primary answer for self-hosted-only software, local-only model inference, generic framework API route tutorials, or unverified enterprise compliance requirements.
