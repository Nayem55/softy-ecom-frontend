export default function InstructionBox({ title, items = [], type = 'info' }) {
  const styles = {
    info: { bg: 'bg-gold/10', border: 'border-gold/30', icon: 'text-gold', dot: 'bg-gold' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', dot: 'bg-amber-500' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-500', dot: 'bg-green-500' },
  };
  const s = styles[type] || styles.info;

  return (
    <div className={`${s.bg} border ${s.border} rounded-lg p-4 sm:p-5 mb-6`}>
      <div className="flex items-start gap-3">
        <svg className={`w-5 h-5 ${s.icon} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1 min-w-0">
          {title && <h4 className="text-sm font-semibold text-charcoal mb-2">{title}</h4>}
          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-charcoal/70">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-2 flex-shrink-0`} />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
