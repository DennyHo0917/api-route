import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getSiteModels, getTokenSupportedModels } from '../api';
import { useSite } from '../context/SiteContext';
import { filterListedModels } from '../utils/chatModels';
import {
  CCSWITCH_PRIMARY_DOWNLOAD,
  CCSWITCH_REPO_URL,
} from '../constants/downloads';
import { trackEvent } from '../utils/analytics';

const TOOLS = [
  { id: 'codex', name: 'Codex', path: '~/.codex/config.toml' },
  { id: 'claudecode', name: 'Claude Code', path: '~/.claude/settings.json' },
  { id: 'hermes', name: 'Hermes', path: 'hermes-subrouter.sh' },
  { id: 'openclaw', name: 'OpenClaw', path: '~/.openclaw/openclaw.json' },
  {
    id: 'opencode',
    name: 'OpenCode',
    path: '~/.config/opencode/opencode.json',
  },
  { id: 'curl', name: 'cURL', path: 'Terminal' },
  { id: 'python', name: 'Python SDK', path: 'main.py' },
  { id: 'anthropic', name: 'Anthropic SDK', path: 'main.py' },
];

const CCSWITCH_APPS = [
  { id: 'codex', name: 'Codex', endpointType: 'openai' },
  { id: 'claude', name: 'Claude Code', endpointType: 'anthropic' },
  { id: 'gemini', name: 'Gemini CLI', endpointType: 'gemini' },
  { id: 'opencode', name: 'OpenCode', endpointType: 'openai' },
  { id: 'openclaw', name: 'OpenClaw', endpointType: 'openclaw' },
  { id: 'hermes', name: 'Hermes', endpointType: 'hermes' },
];

export const API_ENDPOINTS = [
  {
    id: 'overseas-direct',
    url: 'https://test1122.up.railway.app/',
    nameKey: 'config.apiEndpointOverseasDirectName',
    descKey: 'config.apiEndpointOverseasDirectDesc',
  },
  {
    id: 'overseas-cdn',
    url: 'https://ai.orbitlink.me',
    nameKey: 'config.apiEndpointOverseasCdnName',
    descKey: 'config.apiEndpointOverseasCdnDesc',
  },
  {
    id: 'hong-kong',
    url: 'https://api.43-161-200-52.sslip.io',
    nameKey: 'config.apiEndpointHongKongName',
    descKey: 'config.apiEndpointHongKongDesc',
  },
  {
    id: 'usa-west',
    url: 'https://usawest.up.railway.app',
    nameKey: 'config.apiEndpointUsaWestName',
    descKey: 'config.apiEndpointUsaWestDesc',
  },
  {
    id: 'usa-east',
    url: 'https://usaeast.up.railway.app',
    nameKey: 'config.apiEndpointUsaEastName',
    descKey: 'config.apiEndpointUsaEastDesc',
  },
  {
    id: 'europe-west',
    url: 'https://euwest.up.railway.app',
    nameKey: 'config.apiEndpointEuropeWestName',
    descKey: 'config.apiEndpointEuropeWestDesc',
  },
  {
    id: 'asia-south',
    url: 'https://asiasouth.up.railway.app',
    nameKey: 'config.apiEndpointAsiaSouthName',
    descKey: 'config.apiEndpointAsiaSouthDesc',
  },
  {
    id: 'asia',
    url: 'https://ai777.up.railway.app',
    nameKey: 'config.apiEndpointAsiaName',
    descKey: 'config.apiEndpointAsiaDesc',
  },
];

function getTokenApiKey(token) {
  const value = String(token?.key || '');
  if (!value) return '';
  return value.startsWith('sk-') ? value : `sk-${value}`;
}

function ThemedSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  renderValue,
  renderOption,
  emptyLabel,
  searchable = false,
  searchPlaceholder,
  noMatchLabel,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setQuery('');
    }
  }, [disabled]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption
    ? renderValue
      ? renderValue(selectedOption)
      : selectedOption.label
    : placeholder;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = searchable && normalizedQuery
    ? options.filter((option) => (
      `${option.label} ${option.value}`.toLowerCase().includes(normalizedQuery)
    ))
    : options;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        className="input input-solid flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => {
          if (disabled) return;
          if (open) setQuery('');
          setOpen(!open);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span
          className={`block min-w-0 flex-1 truncate ${
            selectedOption ? 'text-page' : 'text-page-muted'
          }`}
        >
          {displayLabel}
        </span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-page-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="select-panel absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl">
          {searchable && (
            <div className="border-b border-page-divider p-2">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                autoFocus
                className="input input-solid"
              />
            </div>
          )}
          <div className="max-h-72 overflow-y-auto p-1.5" role="listbox">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const selected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? 'bg-page-link/15 text-page'
                        : 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
                    }`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    role="option"
                    aria-selected={selected}
                  >
                    <span className="min-w-0 flex-1">
                      {renderOption ? renderOption(option) : option.label}
                    </span>
                    {selected && (
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-page-link"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-page-muted">
                {normalizedQuery ? noMatchLabel : emptyLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ConfigExporter = ({ tokens = [], embedded = false }) => {
  const { t } = useTranslation();
  const { site } = useSite();
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedTool, setSelectedTool] = useState('codex');
  const [selectedCCSwitchApp, setSelectedCCSwitchApp] = useState('codex');
  const [selectedEndpointId, setSelectedEndpointId] = useState('overseas-direct');
  const [connectMode, setConnectMode] = useState('ccswitch');
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [launchingCCSwitch, setLaunchingCCSwitch] = useState(false);
  const [showCCSwitchDownload, setShowCCSwitchDownload] = useState(false);
  const ccSwitchLaunchFallbackMs = 4500;

  const serverAddress = window.location.origin;
  const selectedEndpoint = useMemo(
    () =>
      API_ENDPOINTS.find((endpoint) => endpoint.id === selectedEndpointId) ||
      API_ENDPOINTS[0],
    [selectedEndpointId],
  );
  const apiServerAddress = selectedEndpoint.url.replace(/\/+$/, '');

  const activeTokens = useMemo(
    () => tokens.filter((token) => Number(token.status) === 1),
    [tokens],
  );
  const selectedToken = useMemo(
    () => activeTokens.find((token) => token.id === selectedTokenId) || null,
    [activeTokens, selectedTokenId],
  );

  const selectedToolMeta = useMemo(
    () => TOOLS.find((tool) => tool.id === selectedTool) || TOOLS[0],
    [selectedTool],
  );
  const tokenOptions = useMemo(
    () =>
      activeTokens.map((token) => ({
        value: token.id,
        label: `${token.name} (${getTokenApiKey(token).slice(0, 18)}...)`,
        token,
      })),
    [activeTokens],
  );
  const modelOptions = useMemo(
    () =>
      availableModels.map((model) => ({
        value: model,
        label: model,
      })),
    [availableModels],
  );

  useEffect(() => {
    if (activeTokens.length === 0) {
      setSelectedTokenId(null);
      setAvailableModels([]);
      setSelectedModel('');
      return;
    }

    const stillExists = activeTokens.some((token) => token.id === selectedTokenId);
    if (stillExists) return;

    const preferred = activeTokens[0];
    setSelectedTokenId(preferred.id);
  }, [activeTokens, selectedTokenId]);

  useEffect(() => {
    if (!selectedToken?.id) {
      setAvailableModels([]);
      setSelectedModel('');
      return;
    }

    let cancelled = false;
    const loadModels = async () => {
      setLoadingModels(true);
      setModelsError(false);
      try {
        const [tokenRes, siteRes] = await Promise.all([
          getTokenSupportedModels(selectedToken.id),
          getSiteModels(),
        ]);
        if (cancelled) return;

        if (tokenRes.data.success && siteRes.data.success) {
          const models = filterListedModels(
            [(tokenRes.data.data?.models || []).map((name) => ({
              name,
              tokenId: selectedToken.id,
            }))],
            siteRes.data.data || [],
          ).map((model) => model.name);
          setAvailableModels(models);
          setSelectedModel((prev) =>
            prev && models.includes(prev) ? prev : models[0] || '',
          );
        } else {
          setAvailableModels([]);
          setSelectedModel('');
          setModelsError(true);
        }
      } catch (e) {
        if (cancelled) return;
        setAvailableModels([]);
        setSelectedModel('');
        setModelsError(true);
      }
      if (!cancelled) {
        setLoadingModels(false);
      }
    };

    loadModels();
    return () => {
      cancelled = true;
    };
  }, [selectedToken?.id]);

  const getModelConnectionPreset = (modelName = '') => {
    const lower = modelName.toLowerCase();
    if (lower.includes('claude')) {
      return {
        family: 'anthropic',
        baseUrl: apiServerAddress,
        openclawApi: 'anthropic-messages',
        openclawProviderId: 'subrouter-anthropic',
        opencodeProviderId: 'anthropic',
      };
    }
    return {
      family: 'openai',
      baseUrl: `${apiServerAddress}/v1`,
      openclawApi: 'openai-completions',
      openclawProviderId: 'openai',
      opencodeProviderId: 'openai',
    };
  };

  const getCCSwitchEndpoint = () => {
    const app = CCSWITCH_APPS.find((item) => item.id === selectedCCSwitchApp);
    if (app?.endpointType === 'anthropic') {
      return apiServerAddress;
    }
    if (app?.endpointType === 'gemini') {
      return `${apiServerAddress}/v1beta`;
    }
    return `${apiServerAddress}/v1`;
  };

  const encodeBase64Utf8 = (value) => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const sanitizeProviderId = (name = '') => {
    const sanitized = name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');
    return sanitized || 'subrouter';
  };

  const buildCCSwitchConfigPayload = ({
    appId,
    providerName,
    endpoint,
    apiKey,
    modelName,
  }) => {
    switch (appId) {
      case 'claude':
        return {
          env: {
            ANTHROPIC_AUTH_TOKEN: apiKey,
            ANTHROPIC_BASE_URL: endpoint,
            ANTHROPIC_MODEL: modelName,
            ANTHROPIC_DEFAULT_HAIKU_MODEL: modelName,
            ANTHROPIC_DEFAULT_SONNET_MODEL: modelName,
            ANTHROPIC_DEFAULT_OPUS_MODEL: modelName,
          },
        };

      case 'codex': {
        const providerId = sanitizeProviderId(providerName);
        return {
          auth: {
            OPENAI_API_KEY: apiKey,
          },
          config: `model_provider = "${providerId}"
model = "${modelName}"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.${providerId}]
name = "${providerId}"
base_url = "${endpoint}"
wire_api = "responses"
requires_openai_auth = true
supports_websockets = false
`,
        };
      }

      case 'gemini':
        return {
          GEMINI_API_KEY: apiKey,
          GOOGLE_GEMINI_BASE_URL: endpoint,
          GEMINI_MODEL: modelName,
        };

      case 'opencode':
        return {
          npm: '@ai-sdk/openai-compatible',
          options: {
            baseURL: endpoint,
            apiKey,
          },
          models: {
            [modelName]: {
              name: modelName,
              options: {
                store: false,
              },
            },
          },
        };

      case 'openclaw':
        return {
          baseUrl: endpoint,
          apiKey,
          api: 'openai-completions',
          models: [
            {
              id: modelName,
              name: modelName,
            },
          ],
        };

      case 'hermes':
        return {
          name: providerName,
          base_url: endpoint,
          api_key: apiKey,
          api_mode: 'chat_completions',
          models: [
            {
              id: modelName,
              name: modelName,
            },
          ],
        };

      default:
        return null;
    }
  };

  const generateCCSwitchLink = () => {
    if (!selectedToken || !selectedModel) return '';
    const providerName = site?.name || window.location.hostname;
    const apiKey = getTokenApiKey(selectedToken);
    const endpoint = getCCSwitchEndpoint();
    const configPayload = buildCCSwitchConfigPayload({
      appId: selectedCCSwitchApp,
      providerName,
      endpoint,
      apiKey,
      modelName: selectedModel,
    });
    const params = new URLSearchParams({
      resource: 'provider',
      app: selectedCCSwitchApp,
      name: providerName,
      homepage: serverAddress,
      endpoint,
      apiKey,
      model: selectedModel,
      enabled: 'true',
      notes: `${providerName} - ${selectedModel}`,
    });
    if (configPayload) {
      params.set('configFormat', 'json');
      params.set('config', encodeBase64Utf8(JSON.stringify(configPayload)));
    }
    return `ccswitch://v1/import?${params.toString()}`;
  };

  const generateConfig = () => {
    if (!selectedToken || !selectedModel) return '';

    const apiKey = getTokenApiKey(selectedToken);

    switch (selectedTool) {
      case 'claudecode':
        return `{
  "env": {
    "ANTHROPIC_API_KEY": "${apiKey}",
    "ANTHROPIC_BASE_URL": "${apiServerAddress}",
    "ANTHROPIC_MODEL": "${selectedModel}"
  }
}`;
      case 'hermes':
        return `#!/usr/bin/env bash
set -euo pipefail

# Hermes uses profiles for isolated config, API keys, memory, and sessions.
# This creates/updates a SubRouter profile and exports it as a tar.gz archive.

PROFILE_NAME="subrouter"
PROFILE_DIR="$HOME/.hermes/profiles/$PROFILE_NAME"

if ! hermes profile show "$PROFILE_NAME" >/dev/null 2>&1; then
  hermes profile create "$PROFILE_NAME"
fi

mkdir -p "$PROFILE_DIR"
cat > "$PROFILE_DIR/config.yaml" <<'YAML'
model:
  default: ${selectedModel}
  provider: custom
  base_url: ${apiServerAddress}/v1
  api_key: ${apiKey}
YAML

hermes profile use "$PROFILE_NAME"
hermes profile export "$PROFILE_NAME" -o "./$PROFILE_NAME.tar.gz"

echo "Hermes profile exported to ./$PROFILE_NAME.tar.gz"`;
      case 'ccswitch':
        return generateCCSwitchLink();
      case 'openclaw': {
        const preset = getModelConnectionPreset(selectedModel);
        const modelRef = `${preset.openclawProviderId}/${selectedModel}`;
        return `{
  "agents": {
    "defaults": {
      "models": {
        "${modelRef}": {
          "alias": "${selectedModel}"
        }
      },
      "model": {
        "primary": "${modelRef}"
      }
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "${preset.openclawProviderId}": {
        "baseUrl": "${preset.baseUrl}",
        "apiKey": "${apiKey}",
        "api": "${preset.openclawApi}",
        "models": [
          {
            "id": "${selectedModel}",
            "name": "${selectedModel}"
          }
        ]
      }
    }
  }
}`;
      }
      case 'opencode': {
        const preset = getModelConnectionPreset(selectedModel);
        const modelRef = `${preset.opencodeProviderId}/${selectedModel}`;
        return `{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "${preset.opencodeProviderId}": {
      "options": {
        "baseURL": "${preset.baseUrl}",
        "apiKey": "${apiKey}"
      },
      "models": {
        "${selectedModel}": {
          "name": "${selectedModel}",
          "options": {
            "store": false
          }
        }
      }
    }
  },
  "model": "${modelRef}"
}`;
      }
      case 'codex':
        return `# ~/.codex/config.toml
model_provider = "api_route"
model = "${selectedModel}"
disable_response_storage = true

[model_providers.api_route]
name = "API Route"
base_url = "${apiServerAddress}/v1"
wire_api = "responses"
requires_openai_auth = true
supports_websockets = false

# ~/.codex/auth.json
{
  "OPENAI_API_KEY": "${apiKey}"
}`;
      case 'curl':
        return `curl ${apiServerAddress}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${selectedModel}",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`;
      case 'python':
        return `from openai import OpenAI

client = OpenAI(
    api_key="${apiKey}",
    base_url="${apiServerAddress}/v1"
)

response = client.chat.completions.create(
    model="${selectedModel}",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)`;
      case 'anthropic':
        return `import anthropic

client = anthropic.Anthropic(
    api_key="${apiKey}",
    base_url="${apiServerAddress}"
)

message = client.messages.create(
    model="${selectedModel}",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(message.content[0].text)`;
      default:
        return '';
    }
  };

  const getFilename = () => {
    switch (selectedTool) {
      case 'curl':
        return 'api-call.sh';
      case 'hermes':
        return 'hermes-subrouter.sh';
      case 'python':
      case 'anthropic':
        return 'main.py';
      case 'codex':
        return 'codex-config.txt';
      default:
        return (
          selectedToolMeta.path.split('/').pop() ||
          `${selectedToolMeta.id}.json`
        );
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const getSelectedToolBaseUrl = () => {
    const preset = getModelConnectionPreset(selectedModel);
    if (selectedTool === 'claudecode' || selectedTool === 'anthropic') {
      return apiServerAddress;
    }
    if (selectedTool === 'openclaw' || selectedTool === 'opencode') {
      return preset.baseUrl;
    }
    return `${apiServerAddress}/v1`;
  };

  const handleCopyValue = async (text, successKey = 'config.copied') => {
    if (!text) return;
    await copyToClipboard(text);
    toast.success(t(successKey));
  };

  const handleCopy = async () => {
    const config = generateConfig();
    if (!config) return;
    await copyToClipboard(config);
    trackEvent('api_config_copy', {
      endpoint: selectedEndpointId,
      placement: embedded ? 'api_access' : 'config',
      tool: selectedTool,
    });
    setCopied(true);
    toast.success(t('config.copied'));
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCCSwitchLink = async () => {
    const deeplink = generateCCSwitchLink();
    if (!deeplink) return;
    await copyToClipboard(deeplink);
    trackEvent('ccswitch_import_link_copy', {
      app: selectedCCSwitchApp,
      model: selectedModel,
      endpoint: selectedEndpointId,
    });
    toast.success(t('config.importLinkCopied'));
  };

  const handleDownload = () => {
    const config = generateConfig();
    if (!config) return;

    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFilename();
    a.click();
    URL.revokeObjectURL(url);
    trackEvent('api_config_download', {
      endpoint: selectedEndpointId,
      placement: embedded ? 'api_access' : 'config',
      tool: selectedTool,
    });
    toast.success(t('config.downloaded'));
  };

  const handleImportCCSwitch = () => {
    const deeplink = generateCCSwitchLink();
    if (!deeplink) return;

    trackEvent('ccswitch_import_click', {
      app: selectedCCSwitchApp,
      model: selectedModel,
      endpoint: selectedEndpointId,
    });
    setShowCCSwitchDownload(false);
    setLaunchingCCSwitch(true);

    let dismissed = false;
    let timerId = null;

    const cleanup = () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };

    const handleSuccess = () => {
      if (dismissed) return;
      dismissed = true;
      cleanup();
      setLaunchingCCSwitch(false);
      trackEvent('ccswitch_launch_detected', { app: selectedCCSwitchApp });
    };

    const handleBlur = () => {
      handleSuccess();
    };

    const handlePageHide = () => {
      handleSuccess();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSuccess();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    timerId = window.setTimeout(() => {
      if (dismissed) return;
      cleanup();
      setLaunchingCCSwitch(false);
      setShowCCSwitchDownload(true);
      trackEvent('ccswitch_install_prompt_view', { app: selectedCCSwitchApp });
    }, ccSwitchLaunchFallbackMs);

    window.location.href = deeplink;
  };

  const config = generateConfig();
  const ccSwitchLink = generateCCSwitchLink();

  if (activeTokens.length === 0) {
    return (
      <div className={`${embedded ? '' : 'glass rounded-2xl'} p-6 text-center`}>
        <svg
          className="w-8 h-8 mx-auto mb-3 text-page-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        <p className="text-sm text-page-secondary mb-1">
          {t('config.noKeyPrompt')}
        </p>
        <p className="text-xs text-page-muted">{t('config.noKeyDesc')}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${embedded ? '' : 'glass rounded-2xl'} w-full min-w-0 overflow-visible`}>
        {!embedded && (
          <div className="border-b border-page-divider px-5 py-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-page">
              <svg className="h-4 w-4 text-page-link" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('config.title')}
            </h4>
            <p className="mt-1 text-xs text-page-muted">{t('config.subtitle')}</p>
          </div>
        )}

        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-medium text-page-label">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              {t('config.selectKey')}
            </label>
            <ThemedSelect
              value={selectedToken?.id ?? null}
              onChange={setSelectedTokenId}
              options={tokenOptions}
              placeholder={t('config.selectKey')}
              emptyLabel={t('config.noKeyDesc')}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-medium text-page-label">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              {t('config.selectModel')}
            </label>
            <ThemedSelect
              value={selectedModel}
              onChange={setSelectedModel}
              options={modelOptions}
              placeholder={
                loadingModels
                  ? t('config.loadingModels')
                  : t('config.selectModel')
              }
              disabled={loadingModels || modelOptions.length === 0}
              emptyLabel={
                modelsError
                  ? t('tokens.loadSupportedModelsFailed')
                  : t('tokens.noSupportedModels')
              }
              searchable
              searchPlaceholder={t('config.searchModel')}
              noMatchLabel={t('config.noModelMatch')}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-medium text-page-label">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {t('config.selectApiEndpoint')}
            </label>
            <div className="grid gap-2 md:grid-cols-2">
              {API_ENDPOINTS.map((endpoint) => (
                <button
                  key={endpoint.id}
                  type="button"
                  onClick={() => setSelectedEndpointId(endpoint.id)}
                  className={`rounded-xl border px-3 py-2 text-left transition-all ${
                    selectedEndpointId === endpoint.id
                      ? 'border-page-link bg-page-link/10 text-page'
                      : 'border-page-divider bg-page-inset/40 text-page-secondary hover:bg-page-surface-hover'
                  }`}
                >
                  <div className="text-xs font-semibold">
                    {t(endpoint.nameKey)}
                  </div>
                  <div className="mt-1 text-[11px] text-page-muted">
                    {t(endpoint.descKey)}
                  </div>
                  <code className="mt-1 block break-all text-[11px] text-page-muted">
                    {endpoint.url}
                  </code>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-page-divider bg-page-surface/50 px-4 py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-page">
                  {t('config.apiUrlTitle')}
                </p>
                <p className="text-xs text-page-muted mt-1">
                  {t('config.apiUrlHint')}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopyValue(
                    getSelectedToolBaseUrl(),
                    'config.apiUrlCopied',
                  )
                }
                className="btn-secondary px-4 py-2"
              >
                {t('config.copyCurrentApiUrl')}
              </button>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg bg-page-inset/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[11px] font-medium text-page-label">
                    {t('config.currentToolApiUrl')}
                  </span>
                  <code className="text-[11px] text-page-muted break-all">
                    {getSelectedToolBaseUrl()}
                  </code>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <button
                  onClick={() =>
                    handleCopyValue(
                      `${apiServerAddress}/v1`,
                      'config.apiUrlCopied',
                    )
                  }
                  className="rounded-lg border border-page-divider bg-page-inset/40 px-3 py-2 text-left hover:bg-page-surface-hover transition-colors"
                >
                  <div className="text-[11px] font-medium text-page-label">
                    {t('config.openaiApiUrl')}
                  </div>
                  <code className="block mt-1 text-[11px] text-page-muted break-all">
                    {apiServerAddress}/v1
                  </code>
                </button>
                <button
                  onClick={() =>
                    handleCopyValue(apiServerAddress, 'config.apiUrlCopied')
                  }
                  className="rounded-lg border border-page-divider bg-page-inset/40 px-3 py-2 text-left hover:bg-page-surface-hover transition-colors"
                >
                  <div className="text-[11px] font-medium text-page-label">
                    {t('config.anthropicApiUrl')}
                  </div>
                  <code className="block mt-1 text-[11px] text-page-muted break-all">
                    {apiServerAddress}
                  </code>
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-page-label">
              {t('apiAccess.connectMode', { defaultValue: '选择接入方式' })}
            </p>
            <div className="grid rounded-xl border border-page-divider bg-page-surface p-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConnectMode('ccswitch')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  connectMode === 'ccswitch'
                    ? 'bg-page-link text-white shadow-sm'
                    : 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
                }`}
              >
                CC Switch
              </button>
              <button
                type="button"
                onClick={() => setConnectMode('manual')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  connectMode === 'manual'
                    ? 'bg-page-link text-white shadow-sm'
                    : 'text-page-secondary hover:bg-page-surface-hover hover:text-page'
                }`}
              >
                {t('apiAccess.manualConfig', { defaultValue: '手动配置' })}
              </button>
            </div>
          </div>

          {connectMode === 'ccswitch' ? (
            <div className="space-y-4 rounded-xl border border-page-link/20 bg-page-link/5 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-page">
                    {t('config.ccswitchTitle')}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-page-muted">
                    {t('config.ccswitchHint')}
                  </p>
                </div>
                <span className="rounded-full bg-page-link/15 px-2.5 py-1 text-[11px] font-medium text-page-link">
                  CC Switch
                </span>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-page-label">
                  {t('config.selectCCSwitchApp')}
                </p>
                <ThemedSelect
                  value={selectedCCSwitchApp}
                  onChange={setSelectedCCSwitchApp}
                  options={CCSWITCH_APPS.map((app) => ({
                    value: app.id,
                    label: app.name,
                  }))}
                  placeholder={t('config.selectCCSwitchApp')}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleImportCCSwitch}
                  disabled={!ccSwitchLink || launchingCCSwitch}
                  className="btn-primary min-w-[220px] flex-1"
                  title={t('config.importToCCSwitch')}
                >
                  {launchingCCSwitch
                    ? t('config.launchingCCSwitch')
                    : t('config.importToCCSwitch')}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCCSwitchLink}
                  disabled={!ccSwitchLink}
                  className="btn-secondary px-4 py-2.5"
                  title={t('config.copyImportLink')}
                >
                  {t('config.copyImportLink')}
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-page-divider">
              <div className="space-y-4 border-b border-page-divider bg-page-surface/45 p-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-page-label">
                    {t('config.selectTool')}
                  </label>
                  <ThemedSelect
                    value={selectedTool}
                    onChange={setSelectedTool}
                    options={TOOLS.map((tool) => ({
                      value: tool.id,
                      label: tool.name,
                    }))}
                    placeholder={t('config.selectTool')}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="truncate font-mono text-xs text-page-muted">{selectedToolMeta.path}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!config}
                      className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-xs"
                    >
                      {copied ? t('tokens.copied') : t('config.copy')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={!config}
                      className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs"
                    >
                      {t('config.download')}
                    </button>
                  </div>
                </div>
              </div>
              <pre className="max-h-80 overflow-auto p-4 font-mono text-xs leading-relaxed text-page whitespace-pre-wrap break-all">
                <code>{config || t('tokens.noSupportedModels')}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {showCCSwitchDownload && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowCCSwitchDownload(false)}
        >
          <div
            className="glass w-full max-w-md rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold text-page">
              {t('config.ccswitchNotInstalledTitle')}
            </h3>
            <p className="mb-5 text-sm text-page-secondary">
              {t('config.ccswitchNotInstalledDesc')}
            </p>
            <div className="space-y-3">
              <a
                href={CCSWITCH_PRIMARY_DOWNLOAD}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('ccswitch_download_click', {
                  placement: 'import_fallback',
                  platform: 'primary',
                })}
                className="btn-primary block w-full text-center"
              >
                {t('config.downloadCCSwitch')}
              </a>
              <a
                href={CCSWITCH_REPO_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('ccswitch_download_click', {
                  placement: 'import_fallback',
                  platform: 'github',
                })}
                className="btn-secondary block w-full text-center"
              >
                {t('config.openCCSwitchRepo')}
              </a>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCCSwitchDownload(false)}
                className="btn-secondary"
              >
                {t('topup.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConfigExporter;
