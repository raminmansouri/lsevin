import { useLocalization } from '../contexts/LocalizationContext';

/**
 * Hook for RTL-aware styling
 * Use this for dynamic RTL class names
 */
export function useRTL() {
  const { isRTL } = useLocalization();

  return {
    isRTL,
    // Icon spacing helpers
    iconStart: isRTL ? 'ml-2' : 'mr-2',
    iconEnd: isRTL ? 'mr-2' : 'ml-2',
    
    // Margin helpers
    ms: (size: string) => (isRTL ? `mr-${size}` : `ml-${size}`),
    me: (size: string) => (isRTL ? `ml-${size}` : `mr-${size}`),
    
    // Padding helpers
    ps: (size: string) => (isRTL ? `pr-${size}` : `pl-${size}`),
    pe: (size: string) => (isRTL ? `pl-${size}` : `pr-${size}`),
    
    // Position helpers
    start: isRTL ? 'right' : 'left',
    end: isRTL ? 'left' : 'right',
    
    // Flex direction
    flexRow: isRTL ? 'flex-row-reverse' : 'flex-row',
    
    // Text alignment
    textStart: isRTL ? 'text-right' : 'text-left',
    textEnd: isRTL ? 'text-left' : 'text-right',
    
    // Border radius
    roundedStart: isRTL ? 'rounded-r' : 'rounded-l',
    roundedEnd: isRTL ? 'rounded-l' : 'rounded-r',
    
    // Transform for icons that should flip
    flipIcon: isRTL ? 'scale-x-[-1]' : '',
  };
}
