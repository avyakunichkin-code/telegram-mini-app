import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MqxButton } from '../src/components/mqx/primitives/MqxButton.jsx';
import '../src/index.css';

const variants = ['hero-filled', 'hero-outline', 'primary', 'secondary', 'ghost', 'link', 'destructive'];

function Fixture() {
  const action = useRef(null);
  const [busy, setBusy] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [submits, setSubmits] = useState(0);
  return <main className="mqx-catalog">
    <h1>Контракт кнопок игры</h1>
    <form onSubmit={e => { e.preventDefault(); setSubmits(n => n + 1); }}>
      <MqxButton ref={action} busy={busy} disabled={false} onClick={() => setClicks(n => n + 1)}>Действие</MqxButton>
      <MqxButton type="submit">Отправить</MqxButton>
      <MqxButton onClick={() => setBusy(v => !v)}>Загрузка</MqxButton>
      <MqxButton onClick={() => action.current.focus()}>Фокус</MqxButton>
      <MqxButton disabled>Недоступно</MqxButton>
      <output aria-label="Нажатия">{clicks}</output>
      <output aria-label="Отправки">{submits}</output>
    </form>
    <section aria-label="Варианты">
      {variants.map(variant => <MqxButton key={variant} variant={variant}>{variant}</MqxButton>)}
    </section>
  </main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
