import { Component } from 'react'
import './error-boundary.css'

/** Экран сбоя намеренно без общих компонентов: ошибка в них не должна ломать и его. */
export function ErrorScreen({ onReload }) {
  return (
    <main className="crash" role="alert">
      <h1>Что-то пошло не так</h1>
      <p>Страница не смогла показать этот экран. Обновите её и попробуйте ещё раз.</p>
      <button type="button" className="btn btn-primary" onClick={onReload}>Обновить страницу</button>
    </main>
  )
}

/** Сбой рендера показывает понятный экран вместо пустой страницы. Детали пишет в консоль сам React. */
export class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return <ErrorScreen onReload={() => window.location.reload()} />
    return this.props.children
  }
}
