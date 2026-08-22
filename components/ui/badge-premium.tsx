'use client';

interface BadgeProps {
  label: string;
  type?: 'default' | 'premium' | 'hot' | 'new' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Badge({
  label,
  type = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const typeClasses = {
    default: 'bg-[var(--surface)] text-[var(--muted)]',
    premium: 'badge-premium animate-pulse',
    hot: 'bg-gradient-to-r from-[var(--accent)] to-[var(--offer)] text-white font-semibold',
    new: 'bg-gradient-to-r from-[var(--accent2)] to-[var(--accent)] text-white font-semibold',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        badge
        inline-flex items-center gap-1
        rounded-full font-semibold
        border border-white/10
        transition-all duration-200
        ${typeClasses[type]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {type === 'premium' && '✨ '}
      {type === 'hot' && '🔥 '}
      {type === 'new' && '⭐ '}
      {type === 'success' && '✓ '}
      {label}
    </span>
  );
}
