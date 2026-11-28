import { useState } from 'react';
import { safeImageUrl } from '../lib/pets';

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-10 h-10 text-xs',
  xl: 'w-20 h-20 text-xl',
};

export default function UserAvatar({
  src,
  initials = 'TF',
  name = 'User',
  size = 'md',
  roundedClass = 'rounded-xl',
  fallbackClassName = 'bg-[#D4AF37] text-[#5C0612]',
  className = '',
}) {
  const [failedSrc, setFailedSrc] = useState('');
  const safeSrc = safeImageUrl(src, '');
  const showImage = Boolean(safeSrc) && failedSrc !== safeSrc;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (showImage) {
    return (
      <img
        src={safeSrc}
        alt={`${name} profile`}
        onError={() => setFailedSrc(safeSrc)}
        className={`${sizeClass} ${roundedClass} object-cover shrink-0 select-none ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} ${roundedClass} ${fallbackClassName} font-bold flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
