export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className={`${sizes[size] || sizes.md} border-2 border-oxblood border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-charcoal/50 tracking-wider">{text}</p>}
    </div>
  );
}

export function Skeleton({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-charcoal/5 rounded animate-pulse ${className}`} />
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-8 bg-charcoal/5 rounded flex-1 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
