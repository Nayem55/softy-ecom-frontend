import useInView from '../../hooks/useInView';

const ANIM_MAP = {
  'fade-up': 'anim-fade-in-up',
  'fade': 'anim-fade-in',
  'scale': 'anim-scale-in',
  'slide-left': 'anim-slide-left',
  'slide-right': 'anim-slide-right',
};

export default function AnimateOnScroll({
  children,
  animation = 'fade-up',
  stagger = false,
  delay = 0,
  className = '',
}) {
  const [ref, isVisible] = useInView({ threshold: 0.12 });
  const baseClass = ANIM_MAP[animation] || 'anim-fade-in-up';

  return (
    <div
      ref={ref}
      className={`${baseClass} ${isVisible ? 'visible' : ''} ${stagger ? 'stagger-children' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
