import API from '../../api/axios';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';

export default function StaticPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const { data } = await API.get(`/pages/${slug}`);
        setPage(data.page || data);
      } catch (err) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <section className="min-h-screen bg-ivory px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="mb-6 h-10 w-2/3 rounded-lg bg-charcoal/5" />
          <div className="mb-4 h-4 w-full rounded bg-charcoal/5" />
          <div className="mb-4 h-4 w-5/6 rounded bg-charcoal/5" />
          <div className="mb-4 h-4 w-4/6 rounded bg-charcoal/5" />
          <div className="mb-8 h-4 w-full rounded bg-charcoal/5" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-charcoal/5" />
            <div className="h-4 w-full rounded bg-charcoal/5" />
            <div className="h-4 w-3/4 rounded bg-charcoal/5" />
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !page) {
    return (
      <section className="min-h-screen bg-ivory px-4 py-20 sm:px-6 lg:px-8">
        <SEO
          title="Page Not Found"
          description="The requested Softy page could not be found."
          noIndex
        />
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span className="mb-6 font-display text-8xl font-bold text-charcoal/10">
            404
          </span>
          <h1 className="mb-3 font-display text-3xl font-bold text-charcoal">
            Page Not Found
          </h1>
          <p className="mb-8 text-charcoal/50">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            to="/"
            className="rounded-md bg-oxblood px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-oxblood-dark"
          >
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  const pageDescription = (page.metaDescription || page.description || page.content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155) || `${page.title} information from Softy.`;

  return (
    <section className="min-h-screen bg-ivory px-4 py-12 sm:px-6 lg:px-8">
      <SEO
        title={page.metaTitle || page.title}
        description={pageDescription}
      />
      <article className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-charcoal/40">
          <Link to="/" className="transition-colors hover:text-oxblood">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-charcoal/70">{page.title}</span>
        </nav>

        {/* Title */}
        <h1 className="mb-2 font-display text-3xl font-bold text-charcoal sm:text-4xl">
          {page.title}
        </h1>

        {/* Delivery Timeframe Banner */}
        {slug === 'shipping-delivery' && (
          <div className="my-6 px-5 py-4 bg-oxblood/5 border border-oxblood/15 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-oxblood/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-oxblood-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-oxblood-dark">Standard delivery timeframe: 15–20 days</p>
              <p className="text-xs text-charcoal/50 mt-0.5">Delivery times may vary based on location and product availability.</p>
            </div>
          </div>
        )}

        {/* Meta */}
        {page.updatedAt && (
          <p className="mb-8 text-sm text-charcoal/40">
            Last updated:{' '}
            {new Date(page.updatedAt).toLocaleDateString('en-BD', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}

        {/* Divider */}
        <div className="mb-8 h-px bg-line" />

        {/* Content */}
        <div
          className="prose prose-charcoal max-w-none
            prose-headings:font-display prose-headings:text-charcoal
            prose-p:text-charcoal/70 prose-p:leading-relaxed
            prose-a:text-oxblood prose-a:no-underline hover:prose-a:underline
            prose-strong:text-charcoal
            prose-img:rounded-xl
            prose-table:w-full prose-th:text-left prose-th:text-sm prose-th:font-semibold
            prose-td:text-sm prose-td:text-charcoal/70
            [&>*]:mb-4"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />

        {/* Bottom Divider */}
        <div className="mt-12 h-px bg-line" />

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-oxblood transition-colors hover:text-oxblood-dark"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </article>
    </section>
  );
}
