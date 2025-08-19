import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'
import { useEffect, useMemo, useRef } from 'react'

export interface UseElementsMutationObserverOptions<E extends Element = Element> {
  onMount?: (element: E) => void
  onUpdate?: (element: E) => void
  onUnmount?: (element: E) => void
}

/**
 * Listen for element mutations under document.documentElement
 *
 * @param selectors - CSS selector string to match elements
 * @param options - Callback options for element lifecycle events
 * @param observeOptions - MutationObserver configuration options
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

  // 状态管理器，只用于管理需要 onUnmount 的元素
  const stateManager = useMemo(() => {
    const unmountCallbackElements = new WeakSet<Element>()

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
    }
  }, [])

  const memoedObserveOptions = useMemo(() => {
    return {
      subtree: true,
      childList: true,
      attributes: true,
      ...observeOptions,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(observeOptions)])

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

    // 统一处理元素的函数
    const processElement = (element: E) => {
      const currentOptions = optionsRef.current

      try {
        // 触发 onMount 回调
        if (currentOptions?.onMount) {
          currentOptions.onMount(element)
        }

        // 如果有 onUnmount 回调，标记元素
        if (currentOptions?.onUnmount) {
          stateManager.markElementForUnmount(element)
        }

        // 为元素创建 onUpdate 观察器
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

    // 1. 总是监听 document.documentElement 用于 onMount 和 onUnmount
    const documentObserverDisposer = createElementMutationObserver({
      element: document.documentElement,
      observeOptions: memoedObserveOptions,
      onMount: () => {
        const elements = document.querySelectorAll<E>(selectors)
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
  }, [selectors, memoedObserveOptions, stateManager])
}
