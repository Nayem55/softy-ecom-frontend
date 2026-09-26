import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { optimizedImageUrl, optimizedImageSrcSet } from '../../utils/imageUrl';

export default function HeroSlider() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, moved: false });

  useEffect(() => {
    API.get('/banners').then(res => {
      const b = res.data.banners || [];
      if (b.length === 0) {
        setBanners([
          { title: 'Bridal Diaries', subtitle: 'The Wedding Edit', description: 'Bespoke bridal wear crafted to order  from mehndi to walima.', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1600&auto=format&fit=crop', linkText: 'Explore Bridal', link: '/shop?isBridal=true' },
          { title: 'Everyday Luxe', subtitle: 'Unstitched & Ready-to-Wear', description: 'Premium lawn, chiffon and cotton silk  made to move with you.', image: 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?q=80&w=1600&auto=format&fit=crop', linkText: 'Shop Women', link: '/shop' },
        ]);
      } else {
        setBanners(b);
      }
    }).catch(() => {
      setBanners([
        { title: 'Eid Collection 2026', subtitle: 'Draped in Heritage', description: 'Hand-embroidered lawn and silk, cut for the modern Bangladeshi woman.', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop', linkText: 'Shop The Edit', link: '/shop' },
        { title: 'Bridal Diaries', subtitle: 'The Wedding Edit', description: 'Bespoke bridal wear crafted to order.', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1600&auto=format&fit=crop', linkText: 'Explore Bridal', link: '/shop?isBridal=true' },
      ]);
    });
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index) => {
    if (!banners.length) return;
    setCurrent((index + banners.length) % banners.length);
  };

  const handleTouchStart = (event) => {
    if (banners.length <= 1) return;
    const touch = event.touches[0];
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, moved: false };
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (event) => {
    if (!isDragging || banners.length <= 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - dragRef.current.startX;
    const deltaY = touch.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 8) dragRef.current.moved = true;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const width = sliderRef.current?.offsetWidth || 0;
    const threshold = Math.max(50, width * 0.14);

    if (dragOffset <= -threshold) {
      goToSlide(current + 1);
    } else if (dragOffset >= threshold) {
      goToSlide(current - 1);
    }

    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0 || banners.length <= 1) return;
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startY: event.clientY, moved: false };
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (event) => {
    if (!isDragging || banners.length <= 1) return;
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 8) dragRef.current.moved = true;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragOffset(deltaX);
    }
  };

  const handleLinkClick = (event) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
    }
  };

  if (banners.length === 0) return <div className="h-[78vh] min-h-[460px] bg-blush animate-pulse" />;

  return (
    <section
      ref={sliderRef}
      className="relative h-[78vh] min-h-[460px] overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div
        className={`flex h-full ${isDragging ? '' : 'transition-transform duration-700 ease-out'}`}
        style={{ transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))` }}
      >
        {banners.map((b, i) => (
          <div key={i} className="relative flex h-full min-w-full items-center">
            <picture className="absolute inset-0 block">
              {b.mobileImage && <source media="(max-width: 767px)" srcSet={optimizedImageUrl(b.mobileImage, { width: 1000, quality: 'auto:good' })} />}
              <img src={optimizedImageUrl(b.image, { width: 2000, quality: 'auto:good' })} srcSet={optimizedImageSrcSet(b.image, [1000, 1600, 2000], { quality: 'auto:good' })} sizes="100vw" alt={b.title || 'Homepage banner'} className="h-full w-full object-cover object-center" />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-charcoal/10 to-transparent" />
            <div className="relative z-10 text-white max-w-lg px-8 sm:px-14">
              <span className="text-xs tracking-[0.28em] uppercase text-blush mb-4 block">{b.title}</span>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.08] mb-5">{b.subtitle}</h1>
              <p className="text-sm leading-relaxed mb-7 max-w-sm text-[#EFE7DD]">{b.description}</p>
              <Link
                to={b.link || '/shop'}
                onClick={handleLinkClick}
                className="inline-block border border-white text-white px-8 py-3.5 text-xs tracking-[0.16em] uppercase hover:bg-white hover:text-charcoal transition-all"
              >
                {b.linkText || 'Shop Now'}
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {banners.map((_, i) => (
          <button key={i} onClick={() => goToSlide(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-[22px]' : 'bg-white/50 w-2'}`} />
        ))}
      </div>
    </section>
  );
}
