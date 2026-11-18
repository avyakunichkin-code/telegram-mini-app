import { createElement, forwardRef } from 'react'

/** Native semantics only. Consumers own labels, variants and theme classes. */
export const ButtonBase = forwardRef(function ButtonBase(
  { busy = false, disabled = false, type = 'button', children, ...props },
  ref,
) {
  return createElement('button', {
    ...props,
    ref,
    type,
    disabled: Boolean(busy || disabled),
    'aria-busy': busy || props['aria-busy'],
  }, children)
})
