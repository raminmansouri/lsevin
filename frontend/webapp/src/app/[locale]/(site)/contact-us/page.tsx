import { sitePageRoute } from "@/features/site-content/components/site-page-route";

// SSG for every locale. The build renders the bundled seed content; an editorial
// save (revalidateTag "global:site-content") or the hourly ISR pass swaps in the
// database copy. A failed regeneration keeps serving the last good page.
export const dynamic = "force-static";
export const revalidate = 3600;

const route = sitePageRoute("contact-us");
export const generateMetadata = route.generateMetadata;
export default route.Page;
