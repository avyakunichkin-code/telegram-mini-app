import { useState } from 'react';
import { Button, Input, Cell, Section } from '@telegram-apps/telegram-ui';
import { useAuth } from '../context/AuthContext';

export function RegisterForm({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register({ username, password, full_name: fullName, email: email || undefined });
    } catch (err) {
      setError('Ошибка регистрации. Возможно, имя уже занято.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Section header="Регистрация">
        <Cell>
          <Input
            header="Имя пользователя *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Cell>
        <Cell>
          <Input
            header="Пароль *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Cell>
        <Cell>
          <Input
            header="Полное имя"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Cell>
        <Cell>
          <Input
            header="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Cell>
        {error && <Cell><div style={{ color: 'red' }}>{error}</div></Cell>}
        <Cell>
          <Button mode="filled" type="submit" stretched>Зарегистрироваться</Button>
        </Cell>
        <Cell>
          <Button mode="plain" onClick={onSwitchToLogin}>Уже есть аккаунт? Войти</Button>
        </Cell>
      </Section>
    </form>
  );
}