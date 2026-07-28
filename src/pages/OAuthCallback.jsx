import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getAuthReturnTo } from '../utils/authReturn';

const SUPPORTED_OAUTH_PROVIDERS = new Set(['google', 'github', 'x']);

export default function OAuthCallback() {
  const { t } = useTranslation();
  const { provider = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { completeOAuth } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState('');
  const returnTo = getAuthReturnTo(location);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const normalizedProvider = provider.toLowerCase();
    if (!SUPPORTED_OAUTH_PROVIDERS.has(normalizedProvider)) {
      setError(t('login.oauthUnsupported'));
      return;
    }

    const params = Object.fromEntries(new URLSearchParams(location.search).entries());
    completeOAuth(normalizedProvider, params)
      .then((result) => {
        if (!result.success) {
          setError(result.message || t('login.oauthFailed'));
          return;
        }
        navigate(returnTo, { replace: true });
      })
      .catch((err) => {
        setError(err.response?.data?.message || t('login.oauthFailed'));
      });
  }, [completeOAuth, location.search, navigate, provider, returnTo, t]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
        {error ? (
          <>
            <h1 className="text-xl font-heading font-bold text-page">{t('login.oauthFailedTitle')}</h1>
            <p className="mt-3 text-sm text-page-secondary">{error}</p>
            <Link to="/login" className="btn-primary mt-6 inline-flex px-5 py-2.5">
              {t('login.backToLogin')}
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 rounded-full animate-spin border-2 border-page-divider border-t-current" />
            <h1 className="mt-5 text-xl font-heading font-bold text-page">{t('login.completingOAuth')}</h1>
            <p className="mt-2 text-sm text-page-secondary">{t('login.completingOAuthHint')}</p>
          </>
        )}
      </div>
    </div>
  );
}
