import React, { useEffect, useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { getAffCode } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginNotice() {
  const { t } = useTranslation();
  const { loginNoticeOpen, dismissLoginNotice } = useAuth();
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (!loginNoticeOpen) return undefined;
    let cancelled = false;
    setInviteLink('');
    getAffCode()
      .then((res) => {
        if (!cancelled && res.data.success && res.data.data) {
          setInviteLink(`${window.location.origin}/register?aff=${res.data.data}`);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loginNoticeOpen]);

  useEffect(() => {
    if (!loginNoticeOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismissLoginNotice();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dismissLoginNotice, loginNoticeOpen]);

  if (!loginNoticeOpen) return null;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success(t('topup.copied'));
    } catch {
      toast.error(t('loginNotice.copyFailed'));
    }
  };

  const shareToX = () => {
    const text = t('loginNotice.xPost', { link: inviteLink });
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-notice-title"
        className="glass w-full max-w-xl rounded-3xl p-6 shadow-2xl sm:p-8"
      >
        <h2 id="login-notice-title" className="text-2xl font-bold text-page">
          {t('loginNotice.title')}
        </h2>

        <div className="mt-5 space-y-3 text-base leading-8 text-page-secondary">
          <p>{t('loginNotice.thanks')}</p>
          <p>
            <Trans
              i18nKey="loginNotice.update"
              components={{
                aiChat: (
                  <Link
                    to="/chats"
                    onClick={dismissLoginNotice}
                    className="font-semibold text-page-link underline decoration-page-link/40 underline-offset-4 hover:decoration-page-link"
                  />
                ),
              }}
            />
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-page-divider bg-page-inset/60 p-4">
          <p className="text-lg font-semibold text-page">{t('loginNotice.inviteTitle')}</p>
          <label className="mt-3 block text-sm font-medium text-page-secondary">
            {t('loginNotice.inviteLink')}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              placeholder={t('loginNotice.loadingLink')}
              className="input min-w-0 flex-1 text-base"
            />
            <button
              type="button"
              onClick={copyInviteLink}
              disabled={!inviteLink}
              className="btn-secondary flex shrink-0 items-center gap-2 px-3 text-base"
            >
              <Copy size={16} />
              {t('topup.copy')}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={shareToX}
            disabled={!inviteLink}
            className="btn-secondary flex items-center justify-center gap-2 text-base"
          >
            <Share2 size={17} />
            {t('loginNotice.shareToX')}
          </button>
          <button type="button" onClick={dismissLoginNotice} className="btn-primary text-base" autoFocus>
            {t('loginNotice.confirm')}
          </button>
        </div>
      </section>
    </div>
  );
}
