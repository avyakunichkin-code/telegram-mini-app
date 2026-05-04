import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';  // импортируем AppRoot
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';

import '@telegram-apps/telegram-ui/dist/styles.css';

function App() {
  return (
    <AppRoot>   {/* <-- обязательно */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              <div style={{ padding: '1rem' }}>
                <LoginForm onSwitchToRegister={() => window.location.href='/register'} />
              </div>
            } />
            <Route path="/register" element={
              <div style={{ padding: '1rem' }}>
                <RegisterForm onSwitchToLogin={() => window.location.href='/login'} />
              </div>
            } />
            <Route path="/" element={
              <AuthGuard>
                <div>Основное приложение (скоро)</div>
              </AuthGuard>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppRoot>
  );
}

export default App;