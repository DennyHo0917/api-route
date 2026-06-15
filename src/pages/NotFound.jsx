import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-page-link">404</p>
      <h1 className="mt-4 text-3xl font-bold text-page sm:text-4xl">
        {t('notFound.title', 'Page not found')}
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-page-secondary sm:text-base">
        {t('notFound.description', 'The requested page does not exist or has been moved.')}
      </p>
      <Link to="/" className="btn-primary mt-7">
        {t('notFound.backHome', 'Back to home')}
      </Link>
    </main>
  );
}
