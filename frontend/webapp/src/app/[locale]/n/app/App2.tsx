import { RouterProvider } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { router } from './routes2.tsx';
import i18n from './i18n/config.ts';
import { LocalizationProvider } from './contexts/LocalizationContext.tsx';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LocalizationProvider>
        <RouterProvider router={router} />
      </LocalizationProvider>
    </I18nextProvider>
  );
}