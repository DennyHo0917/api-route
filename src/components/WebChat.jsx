import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageSquarePlus, Send, Settings2, Square, Trash2, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getTokenSupportedModels } from '../api';
import { useAuth } from '../context/AuthContext';
import { readChatResponse } from '../utils/chatResponse';

const DB_NAME = 'api-route-web-chat';
const STORE_NAME = 'conversations';
let databasePromise;

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

export default function WebChat({ tokens = [], onOpenLocalSetup }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [input, setInput] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const enabledTokens = useMemo(
    () => tokens.filter((token) => token.status === 1 && token.key),
    [tokens],
  );

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoadingHistory(true);
    listConversations(user.id)
      .then((items) => {
        if (cancelled) return;
        setConversations(items);
        if (items[0]) {
          setActiveConversation(items[0]);
          setMessages(items[0].messages || []);
          setSelectedModel(items[0].model || '');
        }
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
      setModels([]);
      setSelectedModel('');
      return;
    }

    let cancelled = false;
    setLoadingModels(true);
    Promise.all(enabledTokens.map(async (token) => {
      try {
        const response = await getTokenSupportedModels(token.id);
        return (response.data.data?.models || []).map((name) => ({
          name,
          tokenId: token.id,
        }));
      } catch {
        return [];
      }
    })).then((groups) => {
      if (cancelled) return;
      const uniqueModels = [];
      const seen = new Set();
      groups.flat().forEach((model) => {
        if (!seen.has(model.name)) {
          seen.add(model.name);
          uniqueModels.push(model);
        }
      });
      setModels(uniqueModels);
      setSelectedModel((current) => (
        uniqueModels.some((model) => model.name === current)
          ? current
          : uniqueModels[0]?.name || ''
      ));
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
  }, [messages, generating]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

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
    setActiveConversation(null);
    setMessages([]);
    setInput('');
  };

  const openConversation = (conversation) => {
    if (generating) return;
    setActiveConversation(conversation);
    setMessages(conversation.messages || []);
    if (models.some((model) => model.name === conversation.model)) {
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
        if (remaining[0]?.model) setSelectedModel(remaining[0].model);
      }
    } catch {
      toast.error(t('chat.storageError'));
    }
  };

  const changeModel = async (event) => {
    const model = event.target.value;
    setSelectedModel(model);
    if (!activeConversation) return;
    try {
      await persistConversation({
        ...activeConversation,
        model,
        updatedAt: Date.now(),
      });
    } catch {
      toast.error(t('chat.storageError'));
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    const modelOption = models.find((model) => model.name === selectedModel);
    const token = enabledTokens.find((item) => item.id === modelOption?.tokenId);
    if (!content || generating || !selectedModel || !token) return;

    const userMessage = { id: createId(), role: 'user', content };
    const assistantMessage = { id: createId(), role: 'assistant', content: '' };
    const requestMessages = [...messages, userMessage];
    const now = Date.now();
    const conversation = activeConversation || {
      id: createId(),
      userId: String(user.id),
      createdAt: now,
      title: content.replace(/\s+/g, ' ').slice(0, 32),
    };

    setInput('');
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
          messages: requestMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
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
          updatedAt: Date.now(),
        });
      } catch {
        toast.error(t('chat.storageError'));
      }
    }
  };

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] overflow-hidden border-y border-page-divider bg-page-surface lg:h-[calc(100dvh-4rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex max-h-64 flex-col border-b border-page-divider bg-page-inset/35 p-3 lg:max-h-none lg:border-b-0 lg:border-r">
        <button
          type="button"
          onClick={startNewConversation}
          disabled={generating}
          className="btn-primary flex h-11 w-full items-center justify-center gap-2"
        >
          <MessageSquarePlus size={17} />
          {t('chat.newConversation')}
        </button>
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
                <span className="mt-0.5 block text-[11px] text-page-muted">
                  {new Date(conversation.updatedAt).toLocaleDateString()}
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

      <section className="flex min-h-[560px] min-w-0 flex-col lg:min-h-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-page-divider px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs text-page-muted">{t('chat.model')}</p>
            <select
              value={selectedModel}
              onChange={changeModel}
              disabled={loadingModels || models.length === 0 || generating}
              className="mt-1 max-w-[320px] rounded-xl border border-page-divider bg-page-surface px-3 py-2 text-sm font-semibold text-page focus:border-page-link focus:outline-none"
            >
              {models.length === 0 && (
                <option value="">
                  {loadingModels ? t('config.loadingModels') : t('tokens.noSupportedModels')}
                </option>
              )}
              {models.map((model) => (
                <option key={model.name} value={model.name}>{model.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-page-muted sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-page-success" />
              {t('chat.savedLocally')}
            </span>
            <button
              type="button"
              onClick={onOpenLocalSetup}
              disabled={generating}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings2 size={15} />
              {t('quickstart.localApps')}
            </button>
          </div>
        </header>

        {enabledTokens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <Bot className="h-10 w-10 text-page-link" />
            <h2 className="mt-4 text-xl font-semibold text-page">{t('chat.noKey')}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-page-secondary">{t('chat.noKeyDesc')}</p>
            <button type="button" onClick={onOpenLocalSetup} className="btn-primary mt-5">
              {t('chat.openLocalSetup')}
            </button>
          </div>
        ) : (
          <>
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-page-link/10 text-page-link">
                    <Bot size={24} />
                  </span>
                  <h2 className="mt-4 text-2xl font-semibold text-page">{t('chat.welcome')}</h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-page-secondary">{t('chat.welcomeDesc')}</p>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-page-link/10 text-page-link">
                          <Bot size={16} />
                        </span>
                      )}
                      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${
                        message.role === 'user'
                          ? 'bg-page-link text-white'
                          : 'border border-page-divider bg-page-surface text-page'
                      }`}>
                        {message.content || (generating ? '…' : '')}
                      </div>
                      {message.role === 'user' && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-page-inset text-page-secondary">
                          <UserRound size={16} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-page-divider p-4 sm:p-5">
              <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-page-divider bg-page-surface p-2 focus-within:border-page-link/60">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={2}
                  disabled={generating || !selectedModel}
                  placeholder={t('chat.placeholder')}
                  className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-page outline-none placeholder:text-page-muted"
                />
                <button
                  type="button"
                  onClick={generating ? () => abortControllerRef.current?.abort() : sendMessage}
                  disabled={!generating && (!input.trim() || !selectedModel)}
                  className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center !p-0"
                  title={generating ? t('chat.stop') : t('chat.send')}
                  aria-label={generating ? t('chat.stop') : t('chat.send')}
                >
                  {generating ? <Square size={15} /> : <Send size={17} />}
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-page-muted">{t('chat.disclaimer')}</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
