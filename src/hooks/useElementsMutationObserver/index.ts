import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'
import { useEffect, useMemo, useRef } from 'react'

export interface UseElementsMutationObserverOptions<E extends Element = Element> {
  onMount?: (element: E) => void
  onUpdate?: (element: E) => void
  onUnmount?: (element: E) => void
  /**
   * Optional root element to observe. Defaults to `document.documentElement`.
   * When provided, the hook will observe mutations under this element and
   * query for `selectors` within it.
   */
  rootElement?: Element | null
}

/**
 * Observe lifecycle events for elements that match a given selector.
 *
 * This hook installs MutationObservers under a root element (defaults to
 * `document.documentElement`) and invokes the provided callbacks when
 * matching elements are mounted, updated, or unmounted.
 *
 * Behavior summary:
 *  - Queries the root for existing matches and calls `onMount` for each.
 *  - Listens for DOM mutations and dispatches `onMount` / `onUpdate` / `onUnmount`.
 *  - Supports a custom root via `options.rootElement`.
 *
 * Implementation notes:
 *  - It uses an internal `useRef` guard to avoid repeated setup within the same
 *    component instance. This prevents duplicate initialization during one
 *    mount lifecycle but does not replace a centralized or reference-counted
 *    observer for cross-instance reuse (recommended for app-wide usage).
 */
export function useElementsMutationObserver<E extends Element = Element>(
  selectors: string,
  options: UseElementsMutationObserverOptions<E>,
  observeOptions?: MutationObserverInit,
) {
  const optionsRef = useRef(options)

  // 每次渲染时更新 optionsRef
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  // state manager: per-hook-instance storage used to track elements that
  // require onUnmount callbacks and to deduplicate onMount calls for this hook
  const stateManager = useMemo(() => {
    const unmountCallbackElements = new WeakSet<Element>()
    const mountedElementsForInstance = new WeakSet<Element>()

    return {
      markElementForUnmount(element: Element): void {
        unmountCallbackElements.add(element)
      },

      hasUnmountCallback(element: Element): boolean {
        return unmountCallbackElements.has(element)
      },

      removeUnmountCallback(element: Element): void {
        unmountCallbackElements.delete(element)
      },

      markElementMounted(element: Element): void {
        mountedElementsForInstance.add(element)
      },

      hasMounted(element: Element): boolean {
        return mountedElementsForInstance.has(element)
      },

      unmarkElementMounted(element: Element): void {
        mountedElementsForInstance.delete(element)
      },
    }
    // 仅在 selectors 变化时重置状态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectors])

  const memoedObserveOptions = useMemo(() => {
    return {
      subtree: true,
      childList: true,
      attributes: true,
      ...observeOptions,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(observeOptions)])

  // extract rootElement from options so it can be included as a dependency
  const rootElementFromOptions = options?.rootElement ?? null

  useEffect(() => {
    const disposers: Array<() => void> = []

    // 为元素创建 onUpdate 观察器的辅助函数
    const createUpdateObserverForElement = (element: E) => {
      if (optionsRef.current?.onUpdate) {
        const elementObserverDisposer = createElementMutationObserver({
          element,
          observeOptions: memoedObserveOptions,
          onUpdate: () => {
            const currentOptions = optionsRef.current
            if (currentOptions?.onUpdate) {
              currentOptions.onUpdate(element)
            }
          },
        })

        if (elementObserverDisposer) {
          disposers.push(elementObserverDisposer)
        }
      }
    }

    // process a single element: call onMount once, register unmount, and start update observer
    const processElement = (element: E) => {
      const currentOptions = optionsRef.current

      try {
        // call onMount only once per element (per hook instance)
        if (currentOptions?.onMount) {
          if (!stateManager.hasMounted(element)) {
            stateManager.markElementMounted(element)
            currentOptions.onMount(element)
          } else {
            // intentionally no-op when already mounted in this hook
          }
        }

        // register element for onUnmount callbacks
        if (currentOptions?.onUnmount) {
          stateManager.markElementForUnmount(element)
        }

        // create update observer for the element
        createUpdateObserverForElement(element)
      } catch (error) {
        console.error('Error processing element:', error, element)
      }
    }

    // 处理匹配元素集合的函数
    const processElements = (elements: E[]) => {
      elements.forEach(processElement)
    }

    // 处理元素卸载的函数
    const processUnmountElement = (element: Element) => {
      const currentOptions = optionsRef.current
      if (currentOptions?.onUnmount && stateManager.hasUnmountCallback(element)) {
        try {
          currentOptions.onUnmount(element as E)
          stateManager.removeUnmountCallback(element)
          // remove mount mark so future mounts trigger onMount again
          stateManager.unmarkElementMounted(element)
        } catch (error) {
          console.error('Error processing unmount element:', error, element)
        }
      }
    }

    // 处理移除节点的函数
    const processRemovedNode = (removedNode: Element) => {
      // 检查被移除的元素是否匹配 selectors
      if (removedNode.matches(selectors)) {
        processUnmountElement(removedNode)
      } else {
        // 检查被移除元素的子元素
        const matchedChildren = removedNode.querySelectorAll<E>(selectors)
        matchedChildren.forEach(processUnmountElement)
      }
    }

    // 1. root to observe (defaults to document.documentElement)
    const root = rootElementFromOptions ?? document.documentElement

    const documentObserverDisposer = createElementMutationObserver({
      element: root,
      observeOptions: memoedObserveOptions,
      onMount: () => {
        const elements = root.querySelectorAll<E>(selectors)
        processElements(Array.from(elements))
      },
      onUpdate: (_, mutations) => {
        const currentOptions = optionsRef.current

        // 处理新增节点，触发 onMount
        mutations.forEach((record) => {
          if (record.type === 'childList' && record.addedNodes.length > 0) {
            record.addedNodes.forEach((addedNode) => {
              if (addedNode instanceof Element) {
                const elementsToProcess: E[] = []

                if (addedNode.matches(selectors)) {
                  elementsToProcess.push(addedNode as E)
                }

                const matchedChildren = addedNode.querySelectorAll<E>(selectors)
                elementsToProcess.push(...Array.from(matchedChildren))

                processElements(elementsToProcess)
              }
            })
          }
        })

        // 处理移除节点，触发 onUnmount
        if (!currentOptions?.onUnmount) {
          return
        }

        mutations.forEach((record) => {
          if (record.type === 'childList' && record.removedNodes.length > 0) {
            record.removedNodes.forEach((removedNode) => {
              if (removedNode instanceof Element) {
                processRemovedNode(removedNode)
              }
            })
          }
        })
      },
    })

    if (documentObserverDisposer) {
      disposers.push(documentObserverDisposer)
    }

    return () => {
      disposers.forEach((dispose) => dispose())
    }
  }, [selectors, memoedObserveOptions, stateManager, rootElementFromOptions])
}
