import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'
import { omit } from 'lodash-es'
import { useEffect, useRef } from 'react'

import type { CreateElementMutationObserverOptions } from '@/helpers/dom/mutation-observer'

export interface UseElementsMutationObserverPostElementOptions<
  E extends Element = Element,
  PE extends Element = Element,
> extends Omit<
    CreateElementMutationObserverOptions<E>,
    'element'
  > {
  postElement: (element: E) => PE
  /** 最外层监听器回调延迟执行间隔，默认 20ms */
  timeout?: number
}

export interface UseElementsMutationObserverBaseOptions<
  E extends Element = Element,
> extends Omit<
    CreateElementMutationObserverOptions<E>,
    'element'
  > {
  /** 最外层监听器回调延迟执行间隔，默认 20ms */
  timeout?: number
}

export function useElementsMutationObserver<
  E extends Element = Element,
  PE extends Element = Element,
>(
  selectors: string,
  options: UseElementsMutationObserverPostElementOptions<E, PE>,
): void
export function useElementsMutationObserver<E extends Element = Element>(
  selectors: string,
  options: UseElementsMutationObserverBaseOptions<E>,
): void
export function useElementsMutationObserver(selectors: string, options: UseElementsMutationObserverBaseOptions | UseElementsMutationObserverPostElementOptions) {
  const createdNodesRef = useRef<Node[]>([])
  const subDisposerRef = useRef<(() => void) | undefined>()
  const timerRef = useRef<number>()

  useEffect(() => {
    const callback = () => {
      timerRef.current = window.setTimeout(() => {
        const targetElements = document.querySelectorAll(selectors)

        targetElements.forEach((element) => {
          const targetElement = 'postElement' in options ? options.postElement(element) : element

          if (createdNodesRef.current.includes(targetElement)) {
            subDisposerRef.current = createElementMutationObserver({
              ...omit(options, 'postElement', 'onCreate'),
              element: targetElement,
            })
          } else {
            subDisposerRef.current = createElementMutationObserver({
              ...omit(options, 'postElement'),
              element: targetElement,
            })
          }

          createdNodesRef.current.push(targetElement)
          setTimeout(() => {
            createdNodesRef.current = createdNodesRef.current.filter(
              (item) => !!item.isConnected,
            )
          })
        })
      }, typeof options.timeout === 'undefined' ? 20 : options.timeout)
    }

    const disposer = createElementMutationObserver({
      element: document.documentElement,
      onEffect: callback,
    })

    return () => {
      disposer?.()
      subDisposerRef.current?.()
      createdNodesRef.current = []
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = undefined
      }
    }
  }, [selectors, options])
}
