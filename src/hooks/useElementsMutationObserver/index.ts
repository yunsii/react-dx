import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'
import { useEffect, useRef } from 'react'

import type { CreateElementMutationObserverOptions } from '@/helpers/dom/mutation-observer'

export interface UseElementsMutationObserverPostElementBaseOptions<E extends Element = Element> extends Pick<CreateElementMutationObserverOptions<E>, 'observeOptions'> {
  onMount?: (element: E) => void
  onUpdate?: (element: E) => void
  onUnmount?: (element: E) => void
}

export interface UseElementsMutationObserverBaseOptions<
  E extends Element = Element,
> extends UseElementsMutationObserverPostElementBaseOptions<E> {
}

/** Listen for element mutations under document.documentElement */
export function useElementsMutationObserver(selectors: string, options: UseElementsMutationObserverBaseOptions) {
  const optionsRef = useRef(options)

  useEffect(() => {
    const disposer = createElementMutationObserver({
      element: document.documentElement,
      onMount: () => {
        document.querySelectorAll(selectors).forEach((element) => {
          optionsRef.current?.onMount?.(element)
        })
      },
      onUpdate: (
        element,
        // ref: https://zh.javascript.info/mutation-observer
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord#instance_properties
        mutations,
      ) => {
        mutations.forEach((record) => {
          record.addedNodes.forEach((item) => {
            if (item instanceof HTMLElement && item.matches(selectors)) {
              optionsRef.current?.onMount?.(item)
            }
          })

          record.removedNodes.forEach((item) => {
            if (item instanceof HTMLElement && item.matches(selectors)) {
              optionsRef.current?.onUnmount?.(item)
            }
          })

          const onUpdate = optionsRef.current?.onUpdate

          if (!onUpdate) {
            return
          }

          if (record.type === 'attributes') {
            if (record.target instanceof HTMLElement) {
              const target = record.target.closest(selectors)
              if (target) {
                onUpdate(target)
              }
            } else {
              const target = record.target.parentElement?.closest(selectors)
              if (target) {
                onUpdate(target)
              }
            }
          }

          if (record.type === 'characterData') {
            const target = record.target.parentElement?.closest(selectors)
            if (target) {
              onUpdate(target)
            }
          }
        })
      },
    })

    return () => {
      disposer?.()
    }
  }, [selectors])
}
