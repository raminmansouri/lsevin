import { useRouter } from "@/i18n/navigation";

export   function useNavigate() {
    const router=useRouter()

    const navigate = (url:string | number,state: any=undefined) => {
      if(url==-1){
        router.back();
      }else{
    router.push(url.toString());

      }
  };

  return navigate;

}
