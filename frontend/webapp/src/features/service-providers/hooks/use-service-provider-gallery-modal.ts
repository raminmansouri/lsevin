import { parseAsBoolean, parseAsInteger, useQueryStates } from "nuqs";

export const useServiceProviderGalleryModal = () => {
  const [state, setState] = useQueryStates({
    gallery: parseAsBoolean.withDefault(false),
    imageIndex: parseAsInteger.withDefault(0),
  });

  const open = (index: number = 0) =>
    setState({ gallery: true, imageIndex: index });
  const close = () => setState({ gallery: false, imageIndex: 0 });

  return {
    isOpen: state.gallery,
    imageIndex: state.imageIndex,
    open,
    close,
    setState,
  };
};
