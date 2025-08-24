import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'
import { useEffect, useMemo, useRef } from 'react'

export interface UseElementsMutationObserverOptions<E extends Element = Element> {
  // onMount may optionally return a disposer function which will be
  // invoked when the element is unmounted (or when the hook cleans up).
  // Keep the return type minimal: void or a function returning void.
  onMount?: (element: E) => void | (() => void)
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

    // We keep a Map for mount disposers so we can iterate and call them
    // during the hook-level cleanup. Using a Map keeps it simple and
    // explicit; entries are removed when their element unmounts.
    const mountDisposers = new Map<Element, () => void>()

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

      setMountDisposer(element: Element, disposer: () => void): void {
        mountDisposers.set(element, disposer)
      },

      getMountDisposer(element: Element): (() => void) | undefined {
        return mountDisposers.get(element)
      },

      hasMountDisposer(element: Element): boolean {
        return mountDisposers.has(element)
      },

      removeMountDisposer(element: Element): void {
        mountDisposers.delete(element)
      },

      // Return all disposers currently stored. Used during hook cleanup.
      getAllMountDisposers(): Array<() => void> {
        return Array.from(mountDisposers.values())
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

            const possibleDisposer = currentOptions.onMount(element)

            if (typeof possibleDisposer === 'function') {
              // store disposer for this element so it can be called on unmount
              stateManager.setMountDisposer(element, possibleDisposer)
            }
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
      // First run any disposer returned from onMount
      try {
        if (stateManager.hasMountDisposer(element)) {
          const mountDisposer = stateManager.getMountDisposer(element)

          if (mountDisposer) {
            try {
              mountDisposer()
            } catch (err) {
              console.error('Error calling mount disposer for element:', err, element)
            }
          }

          stateManager.removeMountDisposer(element)
        }
      } catch (err) {
        console.error('Error handling mount disposer for element:', err, element)
      }

      // Then call explicit onUnmount callback if provided and registered
      if (currentOptions?.onUnmount && stateManager.hasUnmountCallback(element)) {
        try {
          currentOptions.onUnmount(element as E)
        } catch (error) {
          console.error('Error processing unmount element:', error, element)
        } finally {
          stateManager.removeUnmountCallback(element)
          // remove mount mark so future mounts trigger onMount again
          stateManager.unmarkElementMounted(element)
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

      try {
        // call any remaining mount disposers that weren't called via
        // DOM removals. This ensures resources are cleaned when the hook
        // instance unmounts.
        const remainingDisposers = stateManager.getAllMountDisposers()
        remainingDisposers.forEach((d) => {
          try {
            d()
          } catch (err) {
            console.error('Error calling mount disposer during cleanup:', err)
          }
        })
      } catch (err) {
        console.error('Error while cleaning up mount disposers:', err)
      }
    }
  }, [selectors, memoedObserveOptions, stateManager, rootElementFromOptions])
}
