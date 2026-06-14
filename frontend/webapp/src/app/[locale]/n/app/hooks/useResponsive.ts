import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export function useResponsive(): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: 'mobile',
        width: 0,
      };
    }

    const width = window.innerWidth;
    const isMobile = width < BREAKPOINTS.mobile;
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.tablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      width,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < BREAKPOINTS.mobile;
      const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
      const isDesktop = width >= BREAKPOINTS.tablet;

      setConfig({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        width,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return config;
}
