import { RouterProvider } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { router } from './routes.tsx';
import i18n from './i18n/config';
import { LocalizationProvider } from './contexts/LocalizationContext';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LocalizationProvider>
        <RouterProvider router={router} />
      </LocalizationProvider>
    </I18nextProvider>
  );
}