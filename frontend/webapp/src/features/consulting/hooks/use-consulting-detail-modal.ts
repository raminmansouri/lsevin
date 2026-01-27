import { parseAsString, useQueryState } from "nuqs";

export const useConsultingDetailModal = () => {
  const [consultingId, setConsultingId] = useQueryState(
    "consulting-details",
    parseAsString
  );

  const open = (id: string | null) => setConsultingId(id);
  const close = () => setConsultingId(null);

  return {
    consultingId,
    open,
    close,
    setConsultingId,
  };
};
