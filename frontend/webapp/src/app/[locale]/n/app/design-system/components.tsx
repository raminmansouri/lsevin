import React from 'react';
import { colors, radius, shadows, spacing } from './tokens';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  children, 
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-medium transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-[#083f30] text-white hover:bg-[#0a5a44] active:bg-[#062f24]',
    gold: 'bg-[#eacb7f] text-[#083f30] hover:bg-[#e0b654] active:bg-[#d6a129]',
    outline: 'border-2 border-[#083f30] text-[#083f30] hover:bg-[#083f30] hover:text-white',
    ghost: 'text-[#083f30] hover:bg-gray-100 active:bg-gray-200',
    disabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg h-9',
    md: 'px-6 py-3 text-base rounded-xl h-12',
    lg: 'px-8 py-4 text-lg rounded-xl h-14',
  };
  
  const isDisabled = disabled || isLoading || variant === 'disabled';
  const currentVariant = isDisabled ? 'disabled' : variant;
  
  return (
    <button
      className={`${baseStyles} ${variants[currentVariant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : children}
    </button>
  );
}

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  className = '',
  ...props 
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`w-full h-12 px-4 ${leftIcon ? 'pl-12' : ''} ${rightIcon ? 'pr-12' : ''} bg-gray-50 border ${
            error ? 'border-red-500' : 'border-gray-200'
          } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent transition ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// Card Component
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  className?: string;
  onClick?: () => void;
}

export function Card({ 
  children, 
  variant = 'default', 
  padding = '4', 
  className = '',
  onClick 
}: CardProps) {
  const variants = {
    default: 'bg-white rounded-2xl',
    elevated: 'bg-white rounded-2xl shadow-md',
    outlined: 'bg-white rounded-2xl border border-gray-200',
  };
  
  return (
    <div 
      className={`${variants[variant]} p-${padding} ${onClick ? 'cursor-pointer hover:shadow-lg transition' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'verified' | 'sponsored' | 'trending' | 'new' | 'default';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variants = {
    verified: 'bg-blue-100 text-blue-700',
    sponsored: 'bg-purple-100 text-purple-700',
    trending: 'bg-orange-100 text-orange-700',
    new: 'bg-green-100 text-green-700',
    default: 'bg-gray-100 text-gray-700',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// Chip Component (for filters)
interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

export function Chip({ children, selected = false, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
        selected 
          ? 'bg-[#083f30] text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

// Rating Component
interface RatingProps {
  rating: number;
  reviews?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Rating({ rating, reviews, size = 'md' }: RatingProps) {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  return (
    <div className={`flex items-center gap-1 ${sizes[size]}`}>
      <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
      <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
      {reviews && (
        <span className="text-gray-500">({reviews.toLocaleString()})</span>
      )}
    </div>
  );
}

// Skeleton Loader
interface SkeletonProps {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', circle = false, className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={{ width, height }}
    />
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 mb-4 text-gray-300">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Divider Component
export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-gray-200 ${className}`} />;
}
