import { useEffect, useRef } from 'react'
import { omit } from 'lodash-es'

import type { CreateElementMutationObserverOptions } from '@/helpers/dom/mutation-observer'

import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'

export interface UseElementsMutationObserverPostElementOptions<
  E extends Element = Element,
  PE extends Element = Element,
> extends Omit<
CreateElementMutationObserverOptions<E>,
'element'
> {
  postElement: (element: E) => PE
}

export interface UseElementsMutationObserverBaseOptions<
  E extends Element = Element,
> extends Omit<
CreateElementMutationObserverOptions<E>,
'element'
> {}

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

  useEffect(() => {
    const callback = () => {
      const targetElements = document.querySelectorAll(selectors)

      targetElements.forEach((element) => {
        const targetElement = 'postElement' in options ? options.postElement(element) : element

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
          ...omit(options, 'postElement'),
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
