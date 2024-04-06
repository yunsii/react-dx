import { useEffect, useRef } from 'react'

import type { CreateElementMutationObserverOptions } from '@/helpers/dom/mutation-observer'

import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'

export interface UseElementsMutationObserverPostElementOptions<
  E extends Element = Element,
  PE extends Element = Element,
> {
  postElement: (element: E) => PE
  createObserverOptions: Omit<
    CreateElementMutationObserverOptions<E>,
    'element'
  >
}

export interface UseElementsMutationObserverBaseOptions<
  E extends Element = Element,
> {
  createObserverOptions: Omit<
    CreateElementMutationObserverOptions<E>,
    'element'
  >
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
export function useElementsMutationObserver(selectors: string, options: any) {
  const {
    postElement,
    createObserverOptions,
  } = options

  const createdNodesRef = useRef<Node[]>([])

  useEffect(() => {
    const callback = () => {
      const targetElements = document.querySelectorAll(selectors)

      targetElements.forEach((element) => {
        const targetElement = postElement ? postElement(element) : element

        if (createdNodesRef.current.includes(targetElement)) {
          return
        }
        createdNodesRef.current.push(targetElement)
        setTimeout(() => {
          createdNodesRef.current = createdNodesRef.current.filter(
            (item) => !!item.isConnected,
          )
        })

        createElementMutationObserver({
          ...createObserverOptions,
          element: targetElement,
        })
      })
    }

    createElementMutationObserver({
      element: document.documentElement,
      onEffect: callback,
    })
  }, [])
}
