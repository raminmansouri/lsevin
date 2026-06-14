  import App from "./app/App2.tsx";
  import "./styles/index.css";
import { Suspense } from "react";
import { HomeServiceProvidersSkeleton } from "@/features/home/components/service-providers-section.tsx";
import { PageProps } from "@/types/next";

  
const HomePage = async ({ params, searchParams }: PageProps) => {
  return (
    <div className="container flex flex-col gap-8">
      
      <Suspense fallback={<HomeServiceProvidersSkeleton />}>
       <App />
      </Suspense>
    </div>
  );
};



export default HomePage;
