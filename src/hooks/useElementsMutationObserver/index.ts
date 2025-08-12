import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'
import { useEffect, useRef } from 'react'

export interface UseElementsMutationObserverPostElementBaseOptions<E extends Element = Element> {
  onMount?: (element: E) => void
  onUpdate?: (element: E) => void
  onUnmount?: (element: E) => void
}

export interface UseElementsMutationObserverBaseOptions<
  E extends Element = Element,
> extends UseElementsMutationObserverPostElementBaseOptions<E> {
}

/** Listen for element mutations under document.documentElement */
export function useElementsMutationObserver<E extends Element = Element>(selectors: string, options: UseElementsMutationObserverBaseOptions<E>, observeOptions?: MutationObserverInit) {
  const optionsRef = useRef(options)

  useEffect(() => {
    const disposer = createElementMutationObserver({
      element: document.documentElement,
      observeOptions,
      onMount: () => {
        document.querySelectorAll<E>(selectors).forEach((element) => {
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
            if (item instanceof Element && item.matches(selectors)) {
              optionsRef.current?.onMount?.(item as E)
            }
          })

          record.removedNodes.forEach((item) => {
            if (item instanceof Element && item.matches(selectors)) {
              optionsRef.current?.onUnmount?.(item as E)
            }
          })

          const onUpdate = optionsRef.current?.onUpdate

          if (!onUpdate) {
            return
          }

          if (record.type === 'attributes') {
            if (record.target instanceof Element) {
              const target = record.target.closest(selectors)
              if (target) {
                onUpdate(target as E)
              }
            } else {
              const target = record.target.parentElement?.closest(selectors)
              if (target) {
                onUpdate(target as E)
              }
            }
          }

          if (record.type === 'characterData') {
            const target = record.target.parentElement?.closest(selectors)
            if (target) {
              onUpdate(target as E)
            }
          }
        })
      },
    })

    return () => {
      disposer?.()
    }
  }, [selectors, observeOptions])
}
