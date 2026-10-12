import { useRouter } from "@/i18n/navigation";

export function useNavigate() {
  const router = useRouter();

  const navigate = (url: string | number, state: any = undefined) => {
    if (url == -1) {
      router.back();
    } else {
      if (typeof window !== "undefined" && !navigator.onLine) {
        const path = url.toString();
        const locale = location.pathname.split("/")[1] || "fa";
        const resolved = /^\/(?:en|fa|tr|es|ar|ku|de|fr|ru|tg|zh)(?:\/|$)/.test(
          path
        )
          ? path
          : "/" + locale + (path.startsWith("/") ? path : "/" + path);
        window.dispatchEvent(
          new CustomEvent("lsevin-offline-navigate", { detail: resolved })
        );
      } else router.push(url.toString());
    }
  };

  return navigate;
}
