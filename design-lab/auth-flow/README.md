# Design-lab: Auth flow (вход / регистрация)

**Статус:** **★ B · Монетка** внедрён в prod (`LoginForm`, `RegisterForm`).

| Документ | Назначение |
|----------|------------|
| [`../../docs/reference/brandbook/BRANDBOOK.md`](../../docs/reference/brandbook/BRANDBOOK.md) | Палитра, тон |
| [`../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) | Цикл lab → MQX → prod |

**Связь с prod:** `LoginForm.jsx`, `RegisterForm.jsx` (`/login`, `/register`).

## Запуск

```bash
cd design-lab/auth-flow
npx serve .
```

Переключатель **светлая / тёмная** в шапке. В варианте **C** — табы «Вход | Регистрация» кликабельны.

## Варианты

| ID | Направление | Идея | Плюсы | Риски |
|----|-------------|------|-------|-------|
| **A** | F · Premium MQX | Отдельные экраны: hero + glass-карта, приглушённый декор | Единство с дашбордом/капиталом; «взрослый» fintech | Менее игровой, похоже на типовую форму |
| **A-reg** | F · (регистрация) | Тот же skin, экран «Создать аккаунт» | Парность с A | — |
| **B** | M · Монетка | Отдельный вход: персонаж + пузырь-карточка | Связка с guided onboarding | Занимает высоту; мелкие экраны |
| **C** | L · Unified | Один экран, табы «Вход \| Регистрация» | Меньше переходов между route | Сложнее deep-link; плотная регистрация |

**Сравнение IA (отдельно от skin):**

- **A + A-reg** — два route, как сейчас в Router.
- **C** — один route с табом; `/login` и `/register` могут открывать тот же компонент с разным `?tab=`.

## Тестовые данные (одинаковые везде)

- Логин: `username` / пароль скрыт.
- Регистрация: `pytest_user`, `user@example.com`, пароль 6+ символов, имя опционально.

## Утверждение

Пример: «Утверждаем **A** для входа + **C** только для регистрации» или «**B** + раздельные route».

После утверждения → MQX `AuthCard` / `AuthShell` в `#/dev/mqx` → `LoginForm` / `RegisterForm`.

## Следующая тема

[`../new-game-mode/`](../new-game-mode/) (после выбора auth).
