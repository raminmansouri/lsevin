import { useMedia } from "react-use";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

export const useDevice = () => {
  const isMobile = useMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`, false);
  const isDesktop = useMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`, true);

  return { isMobile, isDesktop };
};

export default useDevice;
