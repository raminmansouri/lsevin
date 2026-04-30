import { getFloatingWidgetBootstrapData } from "../server/repository";
import { SupportFloatingWidget } from "./support-floating-widget";

type Props = {
  customerUserId?: string;
  locale?: string;
  disabledOnCurrentRoute?: boolean;
};

export async function SupportFloatingWidgetServer({ customerUserId, locale, disabledOnCurrentRoute }: Props) {
  const bootstrap = await getFloatingWidgetBootstrapData({ customerUserId, locale });
  return <SupportFloatingWidget bootstrap={bootstrap} disabledOnCurrentRoute={disabledOnCurrentRoute} />;
}
