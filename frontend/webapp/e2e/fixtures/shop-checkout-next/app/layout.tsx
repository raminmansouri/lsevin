import { NextIntlClientProvider } from "next-intl";

import messages from "../../../../messages/fa.json";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <NextIntlClientProvider locale="fa" messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
