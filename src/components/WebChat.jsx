import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Copy,
  FileText,
  Gift,
  Image as ImageIcon,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  Paperclip,
  Send,
  Share2,
  Square,
  Trash2,
  UserRound,
  Video,
  WalletCards,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getAffCode, getSiteModels, getTokenSupportedModels, Q } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/SiteContext';
import { trackEvent, trackEventOnce } from '../utils/analytics';
import {
  filterAvailableModels,
  filterAvailableModelsByCategory,
  modelSupportsImageUpload,
  toChatCompletionMessage,
} from '../utils/chatModels';
import { readChatResponse } from '../utils/chatResponse';
import { hasNoBalance, rememberPendingChatTopup } from '../utils/pendingChat';

const DB_NAME = 'api-route-web-chat';
const STORE_NAME = 'conversations';
const DEFAULT_MODEL = 'moonshotai/kimi-k3';
const MAX_IMAGE_SIZE_MB = 3;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MODEL_CATEGORIES = ['chat', 'image', 'video'];
let databasePromise;

const findDefaultChatModel = (models) => models.find((model) => (
  model.name === DEFAULT_MODEL || String(model.name).split('/').pop() === 'kimi-k3'
))?.name || '';

function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return databasePromise;
}

async function listConversations(userId) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME)
      .index('userId')
      .getAll(String(userId));
    request.onsuccess = () => resolve(
      (request.result || []).sort((a, b) => b.updatedAt - a.updatedAt),
    );
    request.onerror = () => reject(request.error);
  });
}

async function saveConversation(conversation) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, 'readwrite')
      .objectStore(STORE_NAME)
      .put(conversation);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function removeConversation(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, 'readwrite')
      .objectStore(STORE_NAME)
      .delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function createId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getApiKey(token) {
  const key = String(token?.key || '');
  return key.startsWith('sk-') ? key : `sk-${key}`;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (
      typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('read failed'))
    );
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function WebChat({ tokens = [], onOpenLocalSetup, onTopUp }) {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { symbol, rate } = useCurrency();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [modelsByCategory, setModelsByCategory] = useState({ chat: [], image: [], video: [] });
  const [modelCategory, setModelCategory] = useState('chat');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [pendingModel, setPendingModel] = useState('');
  const [balancePromptOpen, setBalancePromptOpen] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [referralCardOpen, setReferralCardOpen] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const abortControllerRef = useRef(null);
  const preferredModelRef = useRef('');
  const referralPromptRequestedRef = useRef(false);
  const imageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const funnelViewTrackedRef = useRef(false);

  const enabledTokens = useMemo(
    () => tokens.filter((token) => token.status === 1 && token.key),
    [tokens],
  );
  const models = modelsByCategory[modelCategory] || [];
  const canUploadImage = modelCategory === 'chat' && modelSupportsImageUpload(selectedModel);
  const balanceValue = Math.max(0, Number(user?.quota || 0) / Q * rate);
  const balanceEmpty = hasNoBalance(user);
  const commissionPercent = Number((
    Number(user?.commission_rate ?? user?.default_commission_rate ?? 0.05) * 100
  ).toFixed(1));

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoadingHistory(true);
    listConversations(user.id)
      .then((items) => {
        if (cancelled) return;
        setConversations(items);
        const latestConversation = items[0] || null;
        setActiveConversation(latestConversation);
        setMessages(latestConversation?.messages || []);
        preferredModelRef.current = latestConversation?.model || '';
        setSelectedModel(latestConversation?.model || DEFAULT_MODEL);
        setInput(latestConversation?.pendingMessage?.input || '');
        setAttachment(latestConversation?.pendingMessage?.attachment || null);
      })
      .catch(() => toast.error(t('chat.storageError')))
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, t]);

  useEffect(() => {
    if (enabledTokens.length === 0) {
      setModelsByCategory({ chat: [], image: [], video: [] });
      setSelectedModel('');
      setModelCategory('chat');
      return;
    }

    let cancelled = false;
    setLoadingModels(true);
    Promise.all([
      getSiteModels(),
      ...enabledTokens.map(async (token) => {
        try {
          const response = await getTokenSupportedModels(token.id);
          return (response.data.data?.models || []).map((name) => ({
            name,
            tokenId: token.id,
          }));
        } catch {
          return [];
        }
      }),
    ]).then(([siteResponse, ...groups]) => {
      if (cancelled) return;
      const siteModels = siteResponse.data.data || [];
      const nextModelsByCategory = {
        chat: filterAvailableModels(groups, siteModels),
        image: filterAvailableModelsByCategory(groups, siteModels, 'image'),
        video: filterAvailableModelsByCategory(groups, siteModels, 'video'),
      };
      const preferredModel = preferredModelRef.current;
      const preferredCategory = MODEL_CATEGORIES.find((category) => (
        nextModelsByCategory[category].some((model) => model.name === preferredModel)
      ));
      const fallbackCategory = preferredCategory || (
        nextModelsByCategory.chat.length ? 'chat' : MODEL_CATEGORIES.find(
          (category) => nextModelsByCategory[category].length,
        ) || 'chat'
      );
      const fallbackModel = nextModelsByCategory[fallbackCategory].find(
        (model) => model.name === preferredModel,
      )?.name || findDefaultChatModel(nextModelsByCategory.chat)
        || nextModelsByCategory[fallbackCategory][0]?.name
        || '';
      setModelsByCategory(nextModelsByCategory);
      setModelCategory(fallbackCategory);
      setSelectedModel(fallbackModel);
    }).catch(() => {
      if (cancelled) return;
      setModelsByCategory({ chat: [], image: [], video: [] });
      setSelectedModel('');
    }).finally(() => {
      if (!cancelled) setLoadingModels(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabledTokens]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, generating, referralCardOpen]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  useEffect(() => {
    if (!user?.id || funnelViewTrackedRef.current) return;
    funnelViewTrackedRef.current = true;
    trackEvent('chat_funnel_view', {
      balance_status: balanceEmpty ? 'empty' : 'available',
    });
  }, [balanceEmpty, user?.id]);

  const openTopup = (placement) => {
    trackEvent('chat_topup_click', { placement });
    onTopUp();
  };

  const revealReferralCard = async () => {
    if (!user?.id || referralPromptRequestedRef.current) return;
    const storageKey = `api-route-referral-prompt-seen-${user.id}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
    } catch {
      // A blocked storage API should not prevent the referral prompt.
    }

    referralPromptRequestedRef.current = true;
    try {
      const res = await getAffCode();
      if (!res.data.success || !res.data.data) return;
      setReferralLink(`${window.location.origin}/register?aff=${res.data.data}`);
      setReferralCardOpen(true);
      trackEvent('referral_prompt_view', { source: 'first_chat_success' });
      try {
        window.localStorage.setItem(storageKey, '1');
      } catch {
        // The card remains usable for this session.
      }
    } catch {
      referralPromptRequestedRef.current = false;
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      trackEvent('referral_link_copy', { source: 'chat_success_card' });
      toast.success(t('topup.copied'));
    } catch {
      toast.error(t('referral.copyFailed'));
    }
  };

  const shareReferralLink = () => {
    const text = t('loginNotice.xPost', { link: referralLink });
    trackEvent('referral_share', { method: 'x', source: 'chat_success_card' });
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const persistConversation = async (conversation) => {
    await saveConversation(conversation);
    setActiveConversation(conversation);
    setConversations((current) => [
      conversation,
      ...current.filter((item) => item.id !== conversation.id),
    ]);
  };

  const startNewConversation = () => {
    if (generating) return;
    setMobileHistoryOpen(false);
    setActiveConversation(null);
    setMessages([]);
    setInput('');
    setAttachment(null);
    preferredModelRef.current = findDefaultChatModel(modelsByCategory.chat)
      || modelsByCategory.chat[0]?.name
      || '';
    setModelCategory('chat');
    setSelectedModel(
      preferredModelRef.current,
    );
  };

  const openConversation = (conversation) => {
    if (generating) return;
    setMobileHistoryOpen(false);
    setActiveConversation(conversation);
    setMessages(conversation.messages || []);
    setInput(conversation.pendingMessage?.input || '');
    setAttachment(conversation.pendingMessage?.attachment || null);
    const conversationCategory = MODEL_CATEGORIES.find((category) => (
      modelsByCategory[category].some((model) => model.name === conversation.model)
    ));
    if (conversationCategory) setModelCategory(conversationCategory);
    if (conversationCategory && modelsByCategory[conversationCategory].some(
      (model) => model.name === conversation.model,
    )) {
      preferredModelRef.current = conversation.model;
      setSelectedModel(conversation.model);
    }
  };

  const deleteConversation = async (conversation) => {
    if (generating) return;
    if (!window.confirm(t('chat.deleteConfirm'))) return;
    try {
      await removeConversation(conversation.id);
      const remaining = conversations.filter((item) => item.id !== conversation.id);
      setConversations(remaining);
      if (activeConversation?.id === conversation.id) {
        setActiveConversation(remaining[0] || null);
        setMessages(remaining[0]?.messages || []);
        setInput(remaining[0]?.pendingMessage?.input || '');
        setAttachment(remaining[0]?.pendingMessage?.attachment || null);
        if (remaining[0]?.model) setSelectedModel(remaining[0].model);
      }
    } catch {
      toast.error(t('chat.storageError'));
    }
  };

  const applyModelChange = (model) => {
    const nextCategory = MODEL_CATEGORIES.find((category) => (
      modelsByCategory[category].some((item) => item.name === model)
    )) || 'chat';
    trackEvent('chat_model_select', {
      category: nextCategory,
      model,
    });
    preferredModelRef.current = model;
    setModelCategory(nextCategory);
    setSelectedModel(model);
    if (attachment && (nextCategory !== 'chat' || !modelSupportsImageUpload(model))) {
      setAttachment(null);
      toast.error(t('chat.attachmentsUnsupported'));
    }
    if (activeConversation && activeConversation.model !== model) {
      setActiveConversation(null);
      setMessages([]);
    }
    setPendingModel('');
  };

  const changeModelCategory = (category) => {
    if (generating || category === modelCategory) return;
    const nextModel = modelsByCategory[category][0]?.name;
    if (!nextModel) return;
    if (activeConversation && activeConversation.model !== nextModel) {
      setPendingModel(nextModel);
      return;
    }
    applyModelChange(nextModel);
  };

  const changeModel = (event) => {
    const model = event.target.value;
    if (activeConversation && activeConversation.model !== model) {
      setPendingModel(model);
      return;
    }
    applyModelChange(model);
  };

  const selectImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!canUploadImage) {
      toast.error(t('chat.attachmentsUnsupported'));
      return;
    }
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      toast.error(t('chat.imageTypeUnsupported'));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t('chat.imageTooLarge', { size: MAX_IMAGE_SIZE_MB }));
      return;
    }
    try {
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: await readImage(file),
      });
    } catch {
      toast.error(t('chat.imageReadFailed'));
    }
  };

  const sendMessage = async () => {
    const content = input.trim() || (attachment ? t('chat.describeImagePrompt') : '');
    const modelOption = models.find((model) => model.name === selectedModel);
    const token = enabledTokens.find((item) => item.id === modelOption?.tokenId);
    if (!content || generating || !selectedModel || !token) return;
    if (attachment && !canUploadImage) {
      setAttachment(null);
      toast.error(t('chat.attachmentsUnsupported'));
      return;
    }

    const userMessage = {
      id: createId(),
      role: 'user',
      content,
      ...(attachment ? { attachment } : {}),
    };
    const assistantMessage = { id: createId(), role: 'assistant', content: '' };
    const requestMessages = [...messages, userMessage];
    const now = Date.now();
    const conversation = activeConversation || {
      id: createId(),
      userId: String(user.id),
      createdAt: now,
      title: content.replace(/\s+/g, ' ').slice(0, 32),
    };
    trackEventOnce(
      `ga_chat_first_message_attempt_${user.id}`,
      'chat_first_message_attempt',
      {
        balance_status: balanceEmpty ? 'empty' : 'available',
        model: selectedModel,
        has_image: Boolean(attachment),
      },
    );

    if (balanceEmpty) {
      try {
        await persistConversation({
          ...conversation,
          model: selectedModel,
          messages,
          pendingMessage: {
            input,
            ...(attachment ? { attachment } : {}),
          },
          updatedAt: now,
        });
        trackEvent('chat_balance_gate', { model: selectedModel });
        setBalancePromptOpen(true);
      } catch {
        toast.error(t('chat.storageError'));
      }
      return;
    }

    setInput('');
    setAttachment(null);
    setMessages([...requestMessages, assistantMessage]);
    setGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let assistantContent = '';

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getApiKey(token)}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: requestMessages.map((message) => (
            toChatCompletionMessage(message, canUploadImage)
          )),
          stream: true,
        }),
        signal: controller.signal,
      });

      await readChatResponse(response, (chunk) => {
        assistantContent += chunk;
        setMessages([
          ...requestMessages,
          { ...assistantMessage, content: assistantContent },
        ]);
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        trackEvent('chat_request_error', {
          category: modelCategory,
          has_image: Boolean(userMessage.attachment),
          model: selectedModel,
          reason: 'request_error',
        });
        toast.error(error.message || t('chat.requestFailed'));
      }
    } finally {
      const finalMessages = assistantContent
        ? [...requestMessages, { ...assistantMessage, content: assistantContent }]
        : requestMessages;
      setMessages(finalMessages);
      setGenerating(false);
      abortControllerRef.current = null;
      try {
        await persistConversation({
          ...conversation,
          model: selectedModel,
          messages: finalMessages,
          pendingMessage: null,
          updatedAt: Date.now(),
        });
        if (assistantContent) {
          trackEvent('chat_request_success', {
            category: modelCategory,
            has_image: Boolean(userMessage.attachment),
            model: selectedModel,
          });
          trackEventOnce(
            `ga_first_chat_success_${user.id}`,
            'first_chat_success',
            { model: selectedModel, has_image: Boolean(userMessage.attachment) },
          );
          refreshUser({ skipErrorHandler: true });
          revealReferralCard();
        }
      } catch {
        toast.error(t('chat.storageError'));
      }
    }
  };

  return (
    <>
      <div className="relative grid h-[calc(100dvh-72px)] overflow-hidden border-y border-page-divider bg-page-surface lg:grid-cols-[minmax(0,1fr)_280px]">
      {mobileHistoryOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/40 lg:hidden"
          onClick={() => setMobileHistoryOpen(false)}
          aria-label={t('topup.close')}
        />
      )}
      <aside className={`${mobileHistoryOpen ? 'fixed inset-y-0 right-0 z-[60] flex w-[85vw] max-w-80' : 'hidden'} flex-col border-l border-page-divider bg-page-surface p-3 shadow-2xl lg:order-2 lg:static lg:z-auto lg:flex lg:w-auto lg:max-w-none lg:bg-page-inset/35 lg:shadow-none`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startNewConversation}
            disabled={generating}
            className="btn-primary flex h-11 flex-1 items-center justify-center gap-2"
          >
            <MessageSquarePlus size={17} />
            {t('chat.newConversation')}
          </button>
          <button
            type="button"
            onClick={() => setMobileHistoryOpen(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-page-secondary hover:bg-page-surface-hover lg:hidden"
            aria-label={t('topup.close')}
          >
            <X size={19} />
          </button>
        </div>
        <p className="px-2 pb-2 pt-4 text-xs text-page-muted">{t('chat.localOnly')}</p>
        <div className="space-y-1 overflow-y-auto">
          {loadingHistory ? (
            <p className="px-2 py-4 text-sm text-page-muted">{t('chat.loadingHistory')}</p>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-4 text-sm text-page-muted">{t('chat.noConversations')}</p>
          ) : conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group flex items-center gap-1 rounded-xl ${
                activeConversation?.id === conversation.id
                  ? 'bg-page-surface text-page'
                  : 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
              }`}
            >
              <button
                type="button"
                onClick={() => openConversation(conversation)}
                className="min-w-0 flex-1 px-3 py-2.5 text-left"
              >
                <span className="block truncate text-sm font-medium">{conversation.title}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-page-muted">
                  <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                  {conversation.model && (
                    <span className="max-w-32 truncate rounded-md bg-page-surface px-1.5 py-0.5 text-[10px] text-page-secondary">
                      {conversation.model.split('/').pop()}
                    </span>
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteConversation(conversation)}
                disabled={generating}
                className="mr-2 rounded-lg p-1.5 text-page-muted opacity-0 transition hover:bg-red-500/10 hover:text-page-danger focus:opacity-100 group-hover:opacity-100"
                title={t('chat.deleteConversation')}
                aria-label={t('chat.deleteConversation')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col lg:order-1">
        <header className="flex items-end gap-2 border-b border-page-divider px-3 py-2.5 sm:px-5 sm:py-3">
          <button
            type="button"
            onClick={() => setMobileHistoryOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-page-secondary hover:bg-page-surface-hover lg:hidden"
            aria-label={t('chat.localOnly')}
          >
            <Menu size={20} />
          </button>
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
            <div className="flex shrink-0 rounded-xl border border-page-divider bg-page-inset/40 p-1" role="tablist" aria-label={t('chat.modelModes')}>
              {[
                ['chat', MessageSquare, 'chat.modeChat'],
                ['image', ImageIcon, 'chat.modeImage'],
                ['video', Video, 'chat.modeVideo'],
              ].map(([category, Icon, labelKey]) => {
                const active = modelCategory === category;
                const available = modelsByCategory[category].length > 0;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => changeModelCategory(category)}
                    disabled={generating || loadingModels || !available}
                    className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors sm:px-3 ${
                      active
                        ? 'bg-page-surface text-page shadow-sm'
                        : available
                          ? 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
                          : 'cursor-not-allowed text-page-muted opacity-60'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{t(labelKey)}</span>
                  </button>
                );
              })}
            </div>
            <label className="min-w-[180px] flex-1 sm:max-w-[320px]">
              <select
                value={selectedModel}
                onChange={changeModel}
                disabled={loadingModels || models.length === 0 || generating}
                className="h-10 w-full min-w-0 truncate rounded-xl border border-page-divider bg-page-surface px-3 text-sm font-semibold text-page focus:border-page-link focus:outline-none"
              >
                {models.length === 0 && (
                  <option value="">
                    {loadingModels ? t('config.loadingModels') : t('tokens.noSupportedModels')}
                  </option>
                )}
                {models.map((model) => (
                  <option key={model.name} value={model.name}>{model.name.split('/').pop()}</option>
                ))}
              </select>
            </label>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => openTopup('chat_header')}
                className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold tabular-nums transition-colors ${
                  balanceEmpty
                    ? 'border-red-500/25 bg-red-500/10 text-red-600 hover:bg-red-500/15'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15'
                }`}
                title={`${t('dashboard.balance')}: ${symbol}${balanceValue.toFixed(2)}`}
              >
                <WalletCards size={15} />
                <span>{t('dashboard.balance')} {symbol}{balanceValue.toFixed(2)}</span>
                {balanceEmpty && <span>{t('quickstart.topupBalance')}</span>}
              </button>
            </div>
            <Link
              to="/dashboard/logs"
              onClick={() => trackEvent('chat_logs_click')}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-page-divider bg-page-surface px-3 text-xs font-semibold text-page-secondary transition-colors hover:border-page-link/40 hover:text-page-link"
            >
              <FileText size={15} />
              <span>{t('chat.viewDetailedLogs')}</span>
            </Link>
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={startNewConversation}
              disabled={generating}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-page-secondary hover:bg-page-surface-hover lg:hidden"
              title={t('chat.newConversation')}
              aria-label={t('chat.newConversation')}
            >
              <MessageSquarePlus size={19} />
            </button>
          </div>
        </header>

        {enabledTokens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
            <Bot className="h-10 w-10 text-page-link" />
            <h2 className="mt-4 text-xl font-semibold text-page">{t('chat.noKey')}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-page-secondary">{t('chat.noKeyDesc')}</p>
            <button type="button" onClick={onOpenLocalSetup} className="btn-primary mt-5">
              {t('chat.openLocalSetup')}
            </button>
          </div>
        ) : (
          <>
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-0 flex-col items-center justify-center px-3 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-page-link/10 text-page-link">
                    <Bot size={24} />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-page sm:text-2xl">{t('chat.welcome')}</h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-page-secondary">{t('chat.welcomeDesc')}</p>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-page-link/10 text-page-link">
                          <Bot size={16} />
                        </span>
                      )}
                      <div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl text-sm leading-7 sm:max-w-[85%] sm:px-4 sm:py-3 ${
                        message.role === 'user'
                          ? 'bg-page-link px-4 py-2.5 text-white'
                          : 'px-1 py-2 text-page sm:border sm:border-page-divider sm:bg-page-surface'
                      }`}>
                        {message.attachment?.dataUrl && (
                          <img
                            src={message.attachment.dataUrl}
                            alt={message.attachment.name || t('chat.attachImage')}
                            className="mb-2 max-h-72 max-w-full rounded-xl object-contain"
                          />
                        )}
                        {message.content || (generating ? '…' : '')}
                      </div>
                      {message.role === 'user' && (
                        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-page-inset text-page-secondary sm:flex">
                          <UserRound size={16} />
                        </span>
                      )}
                    </div>
                  ))}
                  {referralCardOpen && referralLink && (
                    <div className="relative rounded-2xl border border-page-link/20 bg-page-link/5 p-4 sm:p-5">
                      <button
                        type="button"
                        onClick={() => setReferralCardOpen(false)}
                        className="absolute right-3 top-3 rounded-lg p-1.5 text-page-muted hover:bg-page-surface-hover hover:text-page"
                        aria-label={t('topup.close')}
                      >
                        <X size={15} />
                      </button>
                      <div className="flex gap-3 pr-8">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-page-link/10 text-page-link">
                          <Gift size={18} />
                        </span>
                        <div>
                          <h3 className="font-semibold text-page">{t('referral.cardTitle')}</h3>
                          <p className="mt-1 text-sm leading-6 text-page-secondary">
                            {t('referral.cardDesc', { rate: commissionPercent })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={copyReferralLink} className="btn-primary flex items-center justify-center gap-2 text-sm">
                          <Copy size={15} />
                          {t('referral.copyLink')}
                        </button>
                        <button type="button" onClick={shareReferralLink} className="btn-secondary flex items-center justify-center gap-2 text-sm">
                          <Share2 size={15} />
                          {t('loginNotice.shareToX')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-page-divider p-3 sm:p-5">
              {activeConversation?.pendingMessage && (
                <p className="mx-auto mb-3 max-w-3xl rounded-xl border border-page-link/20 bg-page-link/10 px-4 py-2.5 text-sm text-page-secondary">
                  {t('chat.pendingRestored')}
                </p>
              )}
              <div className="mx-auto max-w-3xl rounded-2xl border border-page-divider bg-page-surface p-2 focus-within:border-page-link/60">
                {attachment && (
                  <div className="mb-2 flex items-center gap-3 rounded-xl bg-page-inset p-2">
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-page">{attachment.name}</p>
                      <p className="text-[11px] text-page-muted">
                        {Math.max(1, Math.round(attachment.size / 1024))} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      disabled={generating}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-page-muted hover:bg-page-surface-hover hover:text-page"
                      title={t('chat.removeImage')}
                      aria-label={t('chat.removeImage')}
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={selectImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={generating || !selectedModel || !canUploadImage}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      canUploadImage
                        ? 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
                        : 'cursor-not-allowed bg-page-inset/60 text-page-muted opacity-50'
                    }`}
                    title={canUploadImage ? t('chat.attachImage') : t('chat.attachmentsUnsupported')}
                    aria-label={canUploadImage ? t('chat.attachImage') : t('chat.attachmentsUnsupported')}
                  >
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                    disabled={generating || !selectedModel}
                    placeholder={t('chat.placeholder')}
                    className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-page outline-none placeholder:text-page-muted"
                  />
                  <button
                    type="button"
                    onClick={generating ? () => abortControllerRef.current?.abort() : sendMessage}
                    disabled={!generating && ((!input.trim() && !attachment) || !selectedModel)}
                    className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center !p-0"
                    title={generating ? t('chat.stop') : t('chat.send')}
                    aria-label={generating ? t('chat.stop') : t('chat.send')}
                  >
                    {generating ? <Square size={15} /> : <Send size={17} />}
                  </button>
                </div>
              </div>
              {selectedModel && !canUploadImage && (
                <p className="mt-2 text-center text-xs text-page-muted">
                  {t('chat.attachmentsUnsupported')}
                </p>
              )}
              <p className="mt-2 hidden text-center text-[11px] text-page-muted sm:block">{t('chat.disclaimer')}</p>
            </div>
          </>
        )}
      </section>
      </div>
      {pendingModel && (
        <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="switch-model-title"
            className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl"
          >
            <h2 id="switch-model-title" className="text-xl font-bold text-page">
              {t('chat.switchModelTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-page-secondary">
              {t('chat.switchModelDesc', { model: pendingModel.split('/').pop() })}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPendingModel('')} className="btn-secondary" autoFocus>
                {t('tokens.cancel')}
              </button>
              <button type="button" onClick={() => applyModelChange(pendingModel)} className="btn-primary">
                {t('chat.switchModelConfirm')}
              </button>
            </div>
          </section>
        </div>
      )}
      {balancePromptOpen && (
        <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-balance-title"
            className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl"
          >
            <h2 id="chat-balance-title" className="text-xl font-bold text-page">
              {t('chat.balanceRequiredTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-page-secondary">
              {t('chat.balanceRequiredDesc')}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setBalancePromptOpen(false)} className="btn-secondary">
                {t('tokens.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  rememberPendingChatTopup(user?.id);
                  setBalancePromptOpen(false);
                  openTopup('balance_modal');
                }}
                className="btn-primary"
                autoFocus
              >
                {t('chat.topUpAndContinue')}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
