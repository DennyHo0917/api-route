import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, ChevronDown, ChevronRight, ExternalLink, Gauge, Layers, WalletCards } from 'lucide-react';
import { getSiteModels } from '../api';
import { useCurrency } from '../context/SiteContext';
import { normalizeAppLanguage } from '../i18n/languageUtils';
import { getOfficialPrice } from '../utils/officialEquiv';

const MODEL_TYPE_OPTIONS = [
  { value: '', labelKey: 'pricing.allTypes' },
  { value: 'chat', labelKey: 'pricing.typeChat' },
  { value: 'completion', labelKey: 'pricing.typeCompletion' },
  { value: 'embedding', labelKey: 'pricing.typeEmbedding' },
  { value: 'image', labelKey: 'pricing.typeImage' },
  { value: 'audio', labelKey: 'pricing.typeAudio' },
  { value: 'video', labelKey: 'pricing.typeVideo' },
  { value: 'rerank', labelKey: 'pricing.typeRerank' },
];

const MODEL_TYPE_SET = new Set(MODEL_TYPE_OPTIONS.map((item) => item.value).filter(Boolean));
const PARAM_NAME_SET = new Set([
  'size',
  'resolution',
  'ratio',
  'width',
  'height',
  'seconds',
  'duration',
  'duration_seconds',
]);
const NUMBER_PATTERN = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?';
const PRICE_GUIDE_ICONS = [WalletCards, Calculator, Layers];

const PRICING_GUIDE_COPY = {
  zh: {
    cards: [
      {
        title: '怎么看价格',
        body: '文本模型通常按输入、输出、缓存读取和缓存创建计费；图片、音频、视频模型可能按次、按秒或按规格计费。',
      },
      {
        title: '怎么估算成本',
        body: '先估算平均输入 token、输出 token 和调用次数，再套入表格价格。正式消耗以调用日志和账户记录为准。',
      },
      {
        title: '怎么选择模型',
        body: '轻量聊天看单价和稳定性，代码与推理看能力，长文本看上下文和缓存价格，图片视频看规格与按次价格。',
      },
    ],
    explainTitle: '价格表包含什么',
    explain: [
      ['输入价格', '用户 prompt、上下文和工具输入消耗的价格。'],
      ['输出价格', '模型生成内容消耗的价格，通常和输入价格不同。'],
      ['缓存价格', '适合长上下文或重复前缀调用，用来降低重复读取成本。'],
      ['官方参考价', '用于对照公开官方价格，实际扣费以本站价格和调用日志为准。'],
    ],
    estimateTitle: '快速估算公式',
    estimateBody: '文本调用成本约等于输入量 × 输入单价 + 输出量 × 输出单价 + 缓存相关费用。图片、音频、视频或按次模型会按表格里的规格、秒数或固定调用价计算。',
    chooseTitle: '按场景筛选模型',
    choose: [
      '日常聊天、摘要、翻译：优先看低输入/输出价格和在线状态。',
      '代码、复杂推理、Agent：优先看模型能力、输出价格和稳定路线。',
      '长文档、知识库、重复提示词：重点比较缓存读取和缓存创建价格。',
      '图片、音频、视频：查看是否按次、按秒或分辨率规格计费。',
    ],
  },
  en: {
    cards: [
      {
        title: 'How to read prices',
        body: 'Text models usually charge for input, output, cache reads, and cache creation. Image, audio, and video models may use per-call, per-second, or spec-based pricing.',
      },
      {
        title: 'How to estimate cost',
        body: 'Estimate average input tokens, output tokens, and request volume, then apply the table rates. Actual usage is recorded in logs and account records.',
      },
      {
        title: 'How to choose models',
        body: 'For light chat, compare price and stability. For coding or reasoning, compare capability. For long context, compare cache rates.',
      },
    ],
    explainTitle: 'What the pricing table includes',
    explain: [
      ['Input price', 'Cost for prompts, context, and tool input sent to a model.'],
      ['Output price', 'Cost for generated text, which often differs from input pricing.'],
      ['Cache price', 'Useful for long context or repeated prefixes, helping reduce repeated context cost.'],
      ['Official reference', 'A comparison column for public official rates. Actual billing follows API-Route rates and usage logs.'],
    ],
    estimateTitle: 'Quick cost estimate',
    estimateBody: 'Text API cost is roughly input volume × input rate + output volume × output rate + cache-related cost. Image, audio, video, and per-call models follow the displayed spec, seconds, or fixed call price.',
    chooseTitle: 'Filter models by workload',
    choose: [
      'Chat, summaries, translation: start with low input/output rates and healthy status.',
      'Coding, reasoning, agents: compare capability, output cost, and stable routes.',
      'Long documents and repeated prompts: compare cache read and cache creation rates.',
      'Image, audio, video: check per-call, per-second, resolution, or spec-based pricing.',
    ],
  },
  ja: {
    cards: [
      {
        title: '料金の見方',
        body: 'テキストモデルは入力、出力、キャッシュ読み取り、キャッシュ作成で課金されることが多く、画像・音声・動画は回数、秒数、仕様単位になる場合があります。',
      },
      {
        title: '費用の見積もり方',
        body: '平均入力 token、出力 token、呼び出し回数を見積もり、表の料金に当てはめます。実際の消費は利用ログとアカウント記録で確認します。',
      },
      {
        title: 'モデルの選び方',
        body: '軽いチャットは単価と安定性、コードや推論は能力、長文ではコンテキストとキャッシュ料金を重視します。',
      },
    ],
    explainTitle: '料金表に含まれるもの',
    explain: [
      ['入力料金', 'プロンプト、コンテキスト、ツール入力にかかる料金です。'],
      ['出力料金', 'モデルが生成した内容にかかる料金で、入力料金と異なることがあります。'],
      ['キャッシュ料金', '長いコンテキストや繰り返しの前置きで、再利用コストを抑えるための料金です。'],
      ['公式参考価格', '公開されている公式価格との比較です。実際の課金は API-Route の料金と利用ログに従います。'],
    ],
    estimateTitle: '簡単な費用見積もり',
    estimateBody: 'テキスト API の費用は、おおよそ入力量 × 入力単価 + 出力量 × 出力単価 + キャッシュ関連費用です。画像、音声、動画、回数課金モデルは表の仕様、秒数、固定単価に従います。',
    chooseTitle: '用途別にモデルを選ぶ',
    choose: [
      'チャット、要約、翻訳: 低い入出力料金とオンライン状態を確認します。',
      'コード、推論、Agent: 能力、出力コスト、安定した経路を比較します。',
      '長文ドキュメント、繰り返しプロンプト: キャッシュ読み取りと作成料金を比較します。',
      '画像、音声、動画: 回数、秒数、解像度、仕様ごとの料金を確認します。',
    ],
  },
  ko: {
    cards: [
      {
        title: '요금표 읽는 법',
        body: '텍스트 모델은 보통 입력, 출력, 캐시 읽기, 캐시 생성 기준으로 과금되며 이미지, 오디오, 영상 모델은 호출, 초, 사양 기준일 수 있습니다.',
      },
      {
        title: '비용 예측 방법',
        body: '평균 입력 token, 출력 token, 호출 횟수를 추정한 뒤 표의 요금을 적용합니다. 실제 사용량은 로그와 계정 기록을 기준으로 확인합니다.',
      },
      {
        title: '모델 선택 방법',
        body: '가벼운 채팅은 단가와 안정성, 코딩과 추론은 성능, 긴 문서는 컨텍스트와 캐시 요금을 중심으로 비교하세요.',
      },
    ],
    explainTitle: '요금표에 포함된 항목',
    explain: [
      ['입력 요금', '프롬프트, 컨텍스트, 도구 입력에 적용되는 비용입니다.'],
      ['출력 요금', '모델이 생성한 내용에 적용되는 비용이며 입력 요금과 다를 수 있습니다.'],
      ['캐시 요금', '긴 컨텍스트나 반복 프롬프트에서 재사용 비용을 줄이는 데 쓰입니다.'],
      ['공식 참고가', '공개 공식 가격과 비교하기 위한 항목입니다. 실제 과금은 API-Route 요금과 사용 로그를 따릅니다.'],
    ],
    estimateTitle: '간단한 비용 계산',
    estimateBody: '텍스트 API 비용은 대략 입력량 × 입력 단가 + 출력량 × 출력 단가 + 캐시 관련 비용입니다. 이미지, 오디오, 영상, 호출당 과금 모델은 표의 사양, 초, 고정 호출가를 따릅니다.',
    chooseTitle: '작업에 맞게 모델 고르기',
    choose: [
      '채팅, 요약, 번역: 낮은 입출력 요금과 온라인 상태를 먼저 확인합니다.',
      '코딩, 추론, 에이전트: 성능, 출력 비용, 안정적인 경로를 비교합니다.',
      '긴 문서와 반복 프롬프트: 캐시 읽기와 캐시 생성 요금을 비교합니다.',
      '이미지, 오디오, 영상: 호출, 초, 해상도, 사양 기준 요금을 확인합니다.',
    ],
  },
};

const PRICING_GUIDE_COPY_V2 = {
  zh: {
    cards: [
      {
        title: '先比较模型家族',
        body: 'GPT、Claude、Gemini 等文本模型先看输入/输出 token 单价；图片、音频、视频再看按次、按秒或分辨率规格。',
      },
      {
        title: '再估算真实消耗',
        body: '把平均输入 token、输出 token、调用次数和缓存命中拆开看，避免只看单价却低估长上下文或高频调用成本。',
      },
      {
        title: '最后匹配套餐',
        body: '价格表用于判断模型成本，套餐、余额和兑换码用于控制预算；实际扣费以账户日志和订单记录为准。',
      },
    ],
    compareTitle: '这个页面适合比较什么',
    compareItems: [
      'GPT、Claude、Gemini 等主流模型的输入/输出 token 成本',
      '长上下文、缓存读取和缓存创建对总成本的影响',
      '图片、音频、视频模型的按次、按秒或规格计费',
      '套餐、余额和兑换码适合哪种调用预算',
    ],
    explainTitle: '价格表关键字段',
    explain: [
      ['输入价格', '用户 prompt、上下文、工具输入和系统提示词消耗的价格。'],
      ['输出价格', '模型生成内容消耗的价格，通常和输入价格不同。'],
      ['缓存价格', '适合长上下文或重复前缀调用，用来降低重复读取成本。'],
      ['官方参考价', '用于对照公开官方价格，实际扣费以本站价格和调用日志为准。'],
    ],
    estimateTitle: '快速估算 token 成本',
    estimateBody: '文本 API 成本约等于输入量 x 输入单价 + 输出量 x 输出单价 + 缓存相关费用。图片、音频、视频或按次模型会按表格里的规格、秒数或固定调用价计算。',
    chooseTitle: '按用途筛选模型',
    choose: [
      '聊天、摘要、翻译：优先看低输入/输出价格、在线状态和响应稳定性。',
      '代码、推理、Agent：重点比较模型能力、输出价格、上下文长度和可用路线。',
      '长文档、知识库、重复提示词：重点看缓存读取、缓存创建和长上下文成本。',
      '图片、音频、视频：确认是按次、按秒、分辨率还是规格计费。',
    ],
  },
  en: {
    cards: [
      {
        title: 'Compare model families',
        body: 'For GPT, Claude, Gemini, and other text models, start with input/output token rates. For image, audio, and video models, check per-call, per-second, or resolution-based billing.',
      },
      {
        title: 'Estimate real usage',
        body: 'Break usage into average input tokens, output tokens, request volume, and cache hits so long-context or high-frequency calls are not underestimated.',
      },
      {
        title: 'Match cost to budget',
        body: 'Use the pricing table to judge model cost, then use plans, balance, and redeem codes to control spend. Actual billing follows account logs and order records.',
      },
    ],
    compareTitle: 'What this page helps you compare',
    compareItems: [
      'Input and output token costs for GPT, Claude, Gemini, and other leading models',
      'How long context, cache reads, and cache creation affect total cost',
      'Per-call, per-second, or spec-based pricing for image, audio, and video models',
      'Whether plans, balance, or redeem codes fit your usage budget',
    ],
    explainTitle: 'Key pricing fields',
    explain: [
      ['Input price', 'Cost for prompts, context, system messages, and tool input sent to a model.'],
      ['Output price', 'Cost for generated content, which often differs from input pricing.'],
      ['Cache price', 'Useful for long context or repeated prefixes, helping reduce repeated context cost.'],
      ['Official reference', 'A comparison column for public official rates. Actual billing follows API-Route rates and usage logs.'],
    ],
    estimateTitle: 'Quick token cost estimate',
    estimateBody: 'Text API cost is roughly input volume x input rate + output volume x output rate + cache-related cost. Image, audio, video, and per-call models follow the displayed spec, seconds, or fixed call price.',
    chooseTitle: 'Filter models by workload',
    choose: [
      'Chat, summaries, translation: start with low input/output rates, online status, and response stability.',
      'Coding, reasoning, agents: compare model capability, output cost, context length, and stable routes.',
      'Long documents, knowledge bases, repeated prompts: compare cache reads, cache creation, and long-context cost.',
      'Image, audio, video: check whether billing is per call, per second, resolution-based, or spec-based.',
    ],
  },
  ja: {
    cards: [
      {
        title: 'モデル系統を比較',
        body: 'GPT、Claude、Gemini などのテキストモデルは入力/出力トークン単価を確認し、画像・音声・動画は回数、秒数、解像度などの課金単位を見ます。',
      },
      {
        title: '実際の利用量を見積もる',
        body: '平均入力トークン、出力トークン、呼び出し回数、キャッシュ利用を分けて見ることで、長文処理や高頻度利用の費用を見落としにくくなります。',
      },
      {
        title: '予算に合う使い方を選ぶ',
        body: '料金表でモデルごとのコストを確認し、プラン、残高、引き換えコードで予算を管理します。実際の課金は利用ログと注文記録に基づきます。',
      },
    ],
    compareTitle: 'このページで比較できること',
    compareItems: [
      'GPT、Claude、Gemini など主要モデルの入力/出力トークンコスト',
      '長文コンテキスト、キャッシュ読み取り、キャッシュ作成が総コストに与える影響',
      '画像、音声、動画モデルの回数、秒数、仕様ごとの料金',
      'プラン、残高、引き換えコードのどれが利用予算に合うか',
    ],
    explainTitle: '料金表の主な項目',
    explain: [
      ['入力料金', 'プロンプト、コンテキスト、システムメッセージ、ツール入力にかかる料金です。'],
      ['出力料金', 'モデルが生成した内容にかかる料金で、入力料金と異なることがあります。'],
      ['キャッシュ料金', '長いコンテキストや繰り返しの前置きで、再利用コストを抑えるための料金です。'],
      ['公式参考価格', '公開されている公式価格との比較です。実際の課金は API-Route の料金と利用ログに従います。'],
    ],
    estimateTitle: 'トークン費用の簡単な見積もり',
    estimateBody: 'テキスト API の費用は、おおよそ入力量 x 入力単価 + 出力量 x 出力単価 + キャッシュ関連費用です。画像、音声、動画、回数課金モデルは表に表示された仕様、秒数、固定呼び出し料金に従います。',
    chooseTitle: '用途別にモデルを選ぶ',
    choose: [
      'チャット、要約、翻訳：入力/出力単価、オンライン状態、応答の安定性を確認します。',
      'コード、推論、Agent：モデル能力、出力コスト、コンテキスト長、安定した経路を比較します。',
      '長文ドキュメント、ナレッジベース、繰り返しプロンプト：キャッシュ読み取り、キャッシュ作成、長文コストを比較します。',
      '画像、音声、動画：回数、秒数、解像度、仕様のどれで課金されるかを確認します。',
    ],
  },
  ko: {
    cards: [
      {
        title: '모델 계열 먼저 비교',
        body: 'GPT, Claude, Gemini 같은 텍스트 모델은 입력/출력 토큰 단가를 먼저 보고, 이미지·오디오·영상 모델은 호출당, 초당, 해상도별 과금을 확인합니다.',
      },
      {
        title: '실제 사용량 계산',
        body: '평균 입력 토큰, 출력 토큰, 호출 횟수, 캐시 사용을 나누어 보면 긴 문맥 처리나 고빈도 호출 비용을 과소평가하지 않을 수 있습니다.',
      },
      {
        title: '예산에 맞게 선택',
        body: '가격표로 모델별 비용을 판단하고, 플랜·잔액·교환 코드로 지출을 관리합니다. 실제 과금은 계정 로그와 주문 기록을 기준으로 합니다.',
      },
    ],
    compareTitle: '이 페이지에서 비교할 수 있는 것',
    compareItems: [
      'GPT, Claude, Gemini 등 주요 모델의 입력/출력 토큰 비용',
      '긴 문맥, 캐시 읽기, 캐시 생성이 전체 비용에 미치는 영향',
      '이미지, 오디오, 영상 모델의 호출당, 초당, 사양별 요금',
      '플랜, 잔액, 교환 코드 중 어떤 방식이 예산에 맞는지',
    ],
    explainTitle: '가격표의 핵심 항목',
    explain: [
      ['입력 요금', '프롬프트, 문맥, 시스템 메시지, 도구 입력에 적용되는 요금입니다.'],
      ['출력 요금', '모델이 생성한 콘텐츠에 적용되는 요금이며 입력 요금과 다를 수 있습니다.'],
      ['캐시 요금', '긴 문맥이나 반복 프롬프트에서 재사용 비용을 낮추는 데 쓰입니다.'],
      ['공식 참고가', '공개된 공식 가격과 비교하기 위한 항목입니다. 실제 과금은 API-Route 요금과 사용 로그를 따릅니다.'],
    ],
    estimateTitle: '토큰 비용 빠르게 계산하기',
    estimateBody: '텍스트 API 비용은 대략 입력량 x 입력 단가 + 출력량 x 출력 단가 + 캐시 관련 비용입니다. 이미지, 오디오, 영상, 호출당 과금 모델은 표에 표시된 사양, 초 단위, 고정 호출 가격을 따릅니다.',
    chooseTitle: '작업에 맞게 모델 고르기',
    choose: [
      '채팅, 요약, 번역: 낮은 입력/출력 요금, 온라인 상태, 응답 안정성을 먼저 봅니다.',
      '코딩, 추론, Agent: 모델 성능, 출력 비용, 문맥 길이, 안정적인 경로를 비교합니다.',
      '긴 문서, 지식베이스, 반복 프롬프트: 캐시 읽기, 캐시 생성, 긴 문맥 비용을 비교합니다.',
      '이미지, 오디오, 영상: 호출당, 초당, 해상도별, 사양별 과금인지 확인합니다.',
    ],
  },
};

function splitTopLevelMultiply(expr = '') {
  const parts = [];
  let start = 0;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < expr.length; i += 1) {
    const char = expr[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
    } else if (char === '*' && depth === 0) {
      parts.push(expr.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(expr.slice(start).trim());
  return parts.filter(Boolean);
}

function stripExprVersion(expr = '') {
  const match = String(expr).match(/^v\d+:([\s\S]*)$/);
  return match ? match[1] : String(expr || '');
}

function unwrapParens(expr = '') {
  let current = String(expr).trim();
  while (current.startsWith('(') && current.endsWith(')')) {
    let depth = 0;
    let valid = true;
    for (let i = 0; i < current.length; i += 1) {
      if (current[i] === '(') depth += 1;
      if (current[i] === ')') depth -= 1;
      if (depth === 0 && i < current.length - 1) {
        valid = false;
        break;
      }
    }
    if (!valid) break;
    current = current.slice(1, -1).trim();
  }
  return current;
}

function getTierBody(expr = '') {
  const body = stripExprVersion(expr).trim();
  const match = body.match(/^tier\("[^"]*",\s*([\s\S]+)\)$/);
  return match ? match[1] : '';
}

function deriveVideoPriceLabel(context, index) {
  const quoted = [...String(context).matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => value && !PARAM_NAME_SET.has(value));
  const preferred = quoted
    .slice()
    .reverse()
    .find((value) => /^\d{2,5}[x*]\d{2,5}$/i.test(value) || /^\d{3,4}p$/i.test(value));
  if (preferred) return preferred.replace('*', 'x');

  const sizeMatch = String(context).match(/param\("width"\)\s*==\s*(\d{2,5})\s*&&\s*param\("height"\)\s*==\s*(\d{2,5})/);
  if (sizeMatch) return `${sizeMatch[1]}x${sizeMatch[2]}`;

  return `tier_${index + 1}`;
}

function parseVideoPricing(expr = '') {
  const tierBody = getTierBody(expr);
  if (!tierBody) return [];
  const parts = splitTopLevelMultiply(tierBody);
  const millionIndex = parts.findIndex((part) => /^1000000(?:\.0+)?$/.test(part));
  if (millionIndex <= 0) return [];
  const priceExpr = unwrapParens(parts[millionIndex - 1]);
  if (!priceExpr) return [];

  const rows = [];
  const priceRe = new RegExp(`\\?\\s*(${NUMBER_PATTERN})\\s*:`, 'g');
  let match;
  while ((match = priceRe.exec(priceExpr)) !== null) {
    const price = Number(match[1]);
    if (!Number.isFinite(price) || price <= 0) continue;
    rows.push({
      label: deriveVideoPriceLabel(priceExpr.slice(Math.max(0, match.index - 260), match.index), rows.length),
      price,
    });
  }

  const fallbackMatch = priceExpr.match(new RegExp(`:\\s*(${NUMBER_PATTERN})\\s*\\)*$`));
  const fallback = fallbackMatch ? Number(fallbackMatch[1]) : Number(priceExpr);
  if (Number.isFinite(fallback) && fallback > 0) {
    const hasSame = rows.some((row) => Math.abs(row.price - fallback) < 1e-12);
    if (!hasSame || rows.length === 0) {
      rows.push({ label: rows.length === 0 ? 'video' : 'default', price: fallback });
    }
  }

  return rows;
}

function normalizeModelType(model) {
  const category = String(model?.category || '').trim().toLowerCase();
  if (MODEL_TYPE_SET.has(category)) return category;

  const endpoints = Array.isArray(model?.supported_endpoint_types)
    ? model.supported_endpoint_types
    : [];
  const billingType = String(model?.billing_type || model?.billing_mode || '').toLowerCase();
  const name = String(model?.model_name || model?.display_name || '').toLowerCase();

  if (endpoints.includes('openai-video') || parseVideoPricing(model?.billing_expr).length > 0 || /sora|seedance|kling|jimeng|veo|video/.test(name)) return 'video';
  if (endpoints.includes('image-generation') || /dall-e|imagen|flux|cogview|image/.test(name)) return 'image';
  if (endpoints.includes('embeddings') || /embed|embedding/.test(name)) return 'embedding';
  if (endpoints.includes('jina-rerank') || /rerank/.test(name)) return 'rerank';
  if (/whisper|tts|audio|speech|voxtral/.test(name)) return 'audio';
  if (billingType === 'completion' || /babbage|davinci|curie/.test(name)) return 'completion';
  return 'chat';
}

function isPerCallPrice(item) {
  return item?.is_per_call || item?.billing_type === 'per_call';
}

function isTieredExprPrice(item) {
  return item?.is_tiered_expr || item?.billing_type === 'tiered_expr' || item?.billing_mode === 'tiered_expr';
}

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const { symbol, rate, cnyRate } = useCurrency();
  const [models, setModels] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [vendor, setVendor] = useState('');
  const [modelType, setModelType] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedModels, setExpandedModels] = useState(() => new Set());
  const language = normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
  const guideCopy = PRICING_GUIDE_COPY_V2[language] || PRICING_GUIDE_COPY_V2.en;

  useEffect(() => {
    getSiteModels()
      .then((r) => {
        if (r.data.success) {
          setModels(r.data.data || []);
          setVendors(r.data.vendors || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const enabledModels = models.filter((m) => m.enabled !== false);

  // Collect vendor names that actually have models
  const availableVendors = useMemo(() => {
    const vendorNames = new Set(enabledModels.map((m) => m.vendor_name).filter(Boolean));
    return vendors.filter((v) => vendorNames.has(v.name));
  }, [enabledModels, vendors]);

  const filtered = useMemo(() => {
    let list = enabledModels;
    // Vendor filter
    if (vendor) {
      list = list.filter((m) => m.vendor_name === vendor);
    }
    // Model type filter
    if (modelType) {
      list = list.filter((m) => normalizeModelType(m) === modelType);
    }
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        (m.display_name || m.model_name || '').toLowerCase().includes(q) ||
        normalizeModelType(m).includes(q) ||
        (Array.isArray(m.channels) && m.channels.some((ch) =>
          (ch.provider_name || ch.provider_slug || '').toLowerCase().includes(q)
        ))
      );
    }
    list = [...list].sort((a, b) => {
      const aTiered = isTieredExprPrice(a);
      const bTiered = isTieredExprPrice(b);
      if (aTiered !== bTiered) return aTiered ? 1 : -1;
      if (!!a.is_per_call !== !!b.is_per_call) {
        return a.is_per_call ? 1 : -1;
      }
      if (a.is_per_call) {
        return (Number(a.fixed_price) || 0) - (Number(b.fixed_price) || 0);
      }
      return (Number(a.input_price) || 0) - (Number(b.input_price) || 0);
    });
    return list;
  }, [enabledModels, vendor, modelType, search]);

  const toggleModel = (key) => {
    setExpandedModels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const formatTokenPrice = (price) =>
    price != null ? `${symbol}${(Number(price) * 1000 * rate).toFixed(4)}` : '-';

  const formatCacheCreationPrice = (modelName, price, price1h) => {
    if (price == null) return '-';
    const supportsDualCacheWindow = (modelName || '').toLowerCase().includes('claude');
    if (supportsDualCacheWindow && price1h != null && Math.abs(Number(price1h) - Number(price)) > 1e-12) {
      return `${t('pricing.cacheCreation5m')} ${formatTokenPrice(price)} / ${t('pricing.cacheCreation1h')} ${formatTokenPrice(price1h)}`;
    }
    return formatTokenPrice(price);
  };

  const formatPerCallPrice = (price) =>
    price != null
      ? `${symbol}${(Number(price) * rate).toFixed(4)}/${t('pricing.perCallUnit')}`
      : '-';

  const formatVideoSecondPrice = (price, item = {}) => {
    const raw = Number(price);
    if (!Number.isFinite(raw)) return '-';
    const multiplier = Number(item.price_multiplier) > 0 ? Number(item.price_multiplier) : 1;
    const sourceCurrency = String(item.price_currency || 'USD').toUpperCase();
    let displayValue = raw * multiplier;
    if (sourceCurrency === 'CNY') {
      displayValue *= cnyRate;
    } else {
      displayValue *= rate;
    }
    return `${symbol}${displayValue.toFixed(4)}/s`;
  };

  const formatUsdPrice = (price) => {
    if (price == null) return '-';
    const value = Number(price);
    if (!Number.isFinite(value)) return '-';
    const decimals = value >= 1 ? 2 : value >= 0.01 ? 3 : 4;
    return `$${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '')}`;
  };

  const formatOfficialPrice = (official) => {
    if (!official) return '-';
    return `${formatUsdPrice(official.inputPerMtok)} / ${formatUsdPrice(official.outputPerMtok)}`;
  };

  const formatSavings = (model, official) => {
    if (!official || isPerCallPrice(model) || isTieredExprPrice(model)) return null;
    const siteInputPerMtok = Number(model.input_price) * 1000;
    if (!Number.isFinite(siteInputPerMtok) || siteInputPerMtok <= 0 || !official.inputPerMtok) return null;
    const savings = Math.round((siteInputPerMtok / official.inputPerMtok - 1) * 100);
    return savings < 0 ? `${savings}%` : null;
  };

  const getVideoRows = (item) =>
    parseVideoPricing(item?.billing_expr).map((row) => ({
      ...row,
      formatted: formatVideoSecondPrice(row.price, item),
    }));

  const renderPrimaryPrice = (item) => {
    if (isTieredExprPrice(item)) {
      const videoRows = getVideoRows(item);
      if (videoRows.length > 0) {
        return (
          <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
            {videoRows.map((row) => (
              <span key={`${row.label}-${row.price}`}>{row.label} {row.formatted}</span>
            ))}
          </div>
        );
      }
      return t('pricing.expressionPricing');
    }
    return isPerCallPrice(item) ? t('pricing.perCall') : formatTokenPrice(item.input_price);
  };

  const renderSecondaryPrice = (item, type, modelName) => {
    if (isTieredExprPrice(item)) return '-';
    if (isPerCallPrice(item)) {
      return type === 'output' ? formatPerCallPrice(item.fixed_price) : '-';
    }
    if (type === 'output') return formatTokenPrice(item.output_price);
    if (type === 'cache_read') return formatTokenPrice(item.cache_read_price);
    return formatCacheCreationPrice(modelName || item.model_name, item.cache_creation_price, item.cache_creation_price_1h);
  };

  const getChannelLabel = (channel, index) =>
    channel.provider_name || t('pricing.channelFallback', { number: channel.channel_index || index + 1 });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-heading font-bold text-page mb-3">{t('pricing.title')}</h1>
        <p className="text-page-secondary max-w-xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </div>

      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        {guideCopy.cards.map((card, index) => {
          const Icon = PRICE_GUIDE_ICONS[index] || WalletCards;
          return (
            <article key={card.title} className="rounded-xl border border-page-divider bg-page-surface p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-page-link">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-page">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-page-secondary">{card.body}</p>
            </article>
          );
        })}
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-page-divider bg-page-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-page-link" />
            <h2 className="text-lg font-semibold text-page">{guideCopy.estimateTitle}</h2>
          </div>
          <p className="text-sm leading-7 text-page-secondary">{guideCopy.estimateBody}</p>
        </div>

        <div className="rounded-xl border border-page-divider bg-page-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-page-link" />
            <h2 className="text-lg font-semibold text-page">{guideCopy.chooseTitle}</h2>
          </div>
          <ul className="space-y-2 text-sm leading-6 text-page-secondary">
            {guideCopy.choose.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-page-link" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Vendor Filter */}
      {availableVendors.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            onClick={() => setVendor('')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              !vendor
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'glass-sm text-page-secondary hover:text-page hover:bg-page-surface-hover'
            }`}
          >
            {t('pricing.allVendors')}
          </button>
          {availableVendors.map((v) => (
            <button
              key={v.id}
              onClick={() => setVendor(v.name)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                vendor === v.name
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'glass-sm text-page-secondary hover:text-page hover:bg-page-surface-hover'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {/* Model Type Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {MODEL_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value || 'all'}
            onClick={() => setModelType(option.value)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              modelType === option.value
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'glass-sm text-page-secondary hover:text-page hover:bg-page-surface-hover'
            }`}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-page-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input !pl-10"
            placeholder={t('pricing.searchPlaceholder')}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-page-secondary">
          {search || vendor || modelType ? t('pricing.noMatch') : t('pricing.noModels')}
        </div>
      ) : (
        <div className="glass-sm rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-page-divider">
                <th className="text-left px-5 py-3.5 font-medium text-page-secondary">{t('pricing.model')}</th>
                <th className="text-right px-5 py-3.5 font-medium text-page-secondary">{t('pricing.inputPrice')}</th>
                <th className="text-right px-5 py-3.5 font-medium text-page-secondary">{t('pricing.outputPrice')}</th>
                <th className="text-right px-5 py-3.5 font-medium text-page-secondary">{t('pricing.cacheReadPrice')}</th>
                <th className="text-right px-5 py-3.5 font-medium text-page-secondary">{t('pricing.cacheCreationPrice')}</th>
                <th className="text-right px-5 py-3.5 font-medium text-page-secondary whitespace-nowrap">{t('pricing.officialPrice')}</th>
                <th className="text-right px-5 py-3.5 font-medium text-page-secondary whitespace-nowrap">{t('pricing.savings')}</th>
                <th className="text-center px-5 py-3.5 font-medium text-page-secondary">{t('pricing.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const official = getOfficialPrice(m);
                const savings = formatSavings(m, official);
                const channels = Array.isArray(m.channels) ? m.channels : [];
                const modelKey = `${m.model_name || 'model'}-${m.id || i}`;
                const expanded = expandedModels.has(modelKey);
                const canExpand = channels.length > 0;

                return (
                  <React.Fragment key={modelKey}>
                    <tr className="border-b border-page-divider last:border-0 hover:bg-page-surface transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-[220px] items-center gap-2">
                          <button
                            type="button"
                            onClick={() => canExpand && toggleModel(modelKey)}
                            disabled={!canExpand}
                            className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-page-divider transition-colors ${
                              canExpand
                                ? 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
                                : 'cursor-default text-page-muted opacity-40'
                            }`}
                            aria-label={expanded ? t('pricing.collapseChannels') : t('pricing.expandChannels')}
                          >
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <div className="min-w-0">
                            <span className="block truncate font-mono text-page">{m.display_name || m.model_name}</span>
                            {canExpand && (
                              <span className="mt-1 inline-flex rounded-full bg-page-surface px-2 py-0.5 text-[11px] font-medium text-page-secondary">
                                {t('pricing.channelCount', { count: channels.length })}
                              </span>
                            )}
                            <span className="mt-1 inline-flex rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-600">
                              {t(`pricing.type.${normalizeModelType(m)}`)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-page-label">
                        {renderPrimaryPrice(m)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-page-label">
                        {renderSecondaryPrice(m, 'output')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-page-label">
                        {renderSecondaryPrice(m, 'cache_read')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-page-label whitespace-nowrap">
                        {renderSecondaryPrice(m, 'cache_creation')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-page-label whitespace-nowrap">
                        {formatOfficialPrice(official)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {savings ? (
                          <span className={`inline-flex justify-end rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${
                            savings.startsWith('-')
                              ? 'bg-green-500/10 text-page-success'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {savings}
                          </span>
                        ) : (
                          <span className="font-mono text-page-muted">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${
                          m.status === 'healthy'
                            ? 'bg-green-500/10 text-page-success border-green-500/20'
                            : 'bg-page-surface text-page-secondary border-page-divider'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'healthy' ? 'bg-green-500' : 'bg-neutral-500'}`} />
                          {m.status === 'healthy' ? t('pricing.online') : t('pricing.unknown')}
                        </span>
                      </td>
                    </tr>
                    {expanded && canExpand && (
                      <tr className="border-b border-page-divider bg-page-surface">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="overflow-hidden rounded-lg border border-page-divider bg-page-inset">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-page-divider text-page-secondary">
                                  <th className="px-4 py-2.5 text-left font-medium">{t('pricing.channel')}</th>
                                  <th className="px-4 py-2.5 text-right font-medium">{t('pricing.inputPriceShort')}</th>
                                  <th className="px-4 py-2.5 text-right font-medium">{t('pricing.outputPriceShort')}</th>
                                  <th className="px-4 py-2.5 text-right font-medium">{t('pricing.cacheReadShort')}</th>
                                  <th className="px-4 py-2.5 text-right font-medium">{t('pricing.cacheCreationShort')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {channels.map((channel, channelIndex) => {
                                  return (
                                    <tr key={`${modelKey}-channel-${channel.provider_slug || channelIndex}`} className="border-b border-page-divider last:border-0">
                                      <td className="px-4 py-3">
                                        <div className="flex min-w-[220px] items-center gap-2">
                                          {channel.provider_logo ? (
                                            <img
                                              src={channel.provider_logo}
                                              alt=""
                                              className="h-6 w-6 rounded-md object-cover"
                                              loading="lazy"
                                            />
                                          ) : (
                                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/10 text-[10px] font-semibold text-brand-600">
                                              {channel.channel_index || channelIndex + 1}
                                            </span>
                                          )}
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              {channel.provider_website ? (
                                                <a
                                                  href={channel.provider_website}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="truncate font-medium text-page hover:text-brand-500"
                                                >
                                                  {getChannelLabel(channel, channelIndex)}
                                                </a>
                                              ) : (
                                                <span className="truncate font-medium text-page">{getChannelLabel(channel, channelIndex)}</span>
                                              )}
                                              {channel.provider_website && <ExternalLink size={11} className="flex-shrink-0 text-page-muted" />}
                                            </div>
                                            {channel.provider_description && (
                                              <p className="mt-0.5 max-w-lg truncate text-[11px] text-page-muted">
                                                {channel.provider_description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-page-label">
                                        {renderPrimaryPrice(channel)}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-page-label">
                                        {renderSecondaryPrice(channel, 'output')}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-page-label">
                                        {renderSecondaryPrice(channel, 'cache_read')}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-page-label whitespace-nowrap">
                                        {renderSecondaryPrice(channel, 'cache_creation', m.model_name)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-page-link" />
            <h2 className="text-lg font-semibold text-page">{guideCopy.compareTitle}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {guideCopy.compareItems.map((item) => (
              <div key={item} className="rounded-xl border border-page-divider bg-page-inset p-4 text-sm leading-6 text-page-secondary">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-page-link" />
            <h2 className="text-lg font-semibold text-page">{guideCopy.explainTitle}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {guideCopy.explain.map(([title, body]) => (
              <div key={title} className="rounded-xl border border-page-divider bg-page-inset p-4">
                <h3 className="text-sm font-semibold text-page">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-page-secondary">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
