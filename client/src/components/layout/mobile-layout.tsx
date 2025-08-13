
import React from 'react';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  withSafeArea?: boolean;
}

export function MobileLayout({ 
  children, 
  className, 
  withPadding = true, 
  withSafeArea = true 
}: MobileLayoutProps) {
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();

  const containerClasses = cn(
    'w-full',
    {
      'px-3 py-3': withPadding && screenSize === 'mobile',
      'px-4 py-4': withPadding && screenSize === 'tablet',
      'px-6 py-6': withPadding && screenSize === 'desktop',
      'pt-16 sm:pt-4': withSafeArea && isMobile, // Espaço para o botão do menu mobile
    },
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}

interface MobileGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MobileGrid({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 4 },
  gap = 'md',
  className 
}: MobileGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6'
  };

  const gridClasses = cn(
    'grid',
    `grid-cols-${columns.mobile}`,
    `sm:grid-cols-${columns.tablet}`,
    `lg:grid-cols-${columns.desktop}`,
    gapClasses[gap],
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function MobileCard({ children, className, padding = 'md' }: MobileCardProps) {
  const paddingClasses = {
    sm: 'p-2 sm:p-3',
    md: 'p-3 sm:p-4 lg:p-6',
    lg: 'p-4 sm:p-6 lg:p-8'
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}
