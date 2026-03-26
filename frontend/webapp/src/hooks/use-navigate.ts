import { useRouter } from "@/i18n/navigation";

export   function useNavigate() {
    const router=useRouter()

    const navigate = (url:string) => {
    router.push(url);
  };

  return navigate;

}
