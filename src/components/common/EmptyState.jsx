import { Link } from 'react-router-dom';

export default function EmptyState({ icon, title, description, actionLabel, actionLink, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon ? (
        <div className="text-charcoal/20 mb-4">{icon}</div>
      ) : (
        <svg className="w-16 h-16 text-charcoal/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}
      <h3 className="text-lg font-semibold text-charcoal mb-2">{title || 'Nothing here yet'}</h3>
      {description && <p className="text-sm text-charcoal/50 max-w-md mb-6">{description}</p>}
      {actionLabel && actionLink && (
        <Link to={actionLink} className="bg-oxblood text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-oxblood-dark transition-colors rounded">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionLink && (
        <button onClick={onAction} className="bg-oxblood text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-oxblood-dark transition-colors rounded">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
