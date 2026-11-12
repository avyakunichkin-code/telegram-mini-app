import { useAuth } from '../context/AuthContext';
import { AppBootstrapScreen } from './mqx/layout/AppBootstrapScreen';

/** Полноэкранный bootstrap: холодный старт API или восстановление сессии. */
export function AppBootstrapGate({ children }) {
  const { loading, bootPhase } = useAuth();

  if (loading && bootPhase) {
    return <AppBootstrapScreen mode={bootPhase} />;
  }

  return children;
}
