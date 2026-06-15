import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './routes/router';

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
