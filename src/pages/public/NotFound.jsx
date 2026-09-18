import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <SEO
        title="Page Not Found"
        description="The requested Softy page could not be found."
        noIndex
      />
      <div className="text-center max-w-md">
        <div className="text-8xl font-serif text-oxblood/20 mb-4">404</div>
        <h1 className="text-2xl font-serif text-charcoal mb-3">Page Not Found</h1>
        <p className="text-sm text-charcoal/60 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="bg-oxblood text-white px-8 py-3.5 text-xs tracking-widest uppercase hover:bg-oxblood-dark transition-colors rounded inline-block">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
