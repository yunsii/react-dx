import { createElementMutationObserver } from '@/helpers/dom/mutation-observer'
import { useEffect, useMemo, useRef } from 'react'

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
export function useElementsMutationObserver<E extends Element = Element>(
  selectors: string,
  options: UseElementsMutationObserverBaseOptions<E>,
  observeOptions?: MutationObserverInit,
) {
  const optionsRef = useRef(options)

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
      ...observeOptions,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(observeOptions)])

  useEffect(() => {
    const disposers: Array<() => void> = []

    // 1. 总是监听 document.documentElement 用于 onMount 和 onUnmount
    const documentObserverDisposer = createElementMutationObserver({
      element: document.documentElement,
      observeOptions: memoedObserveOptions,
      onMount: () => {
        const currentOptions = optionsRef.current
        const elements = document.querySelectorAll<E>(selectors)

        elements.forEach((element) => {
          // 触发 onMount 回调
          if (currentOptions?.onMount) {
            currentOptions.onMount(element)
          }

          // 如果有 onUnmount 回调，标记元素
          if (currentOptions?.onUnmount) {
            stateManager.markElementForUnmount(element)
          }
        })
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

                elementsToProcess.forEach((element) => {
                  // 触发 onMount 回调
                  if (currentOptions?.onMount) {
                    currentOptions.onMount(element)
                  }

                  // 如果有 onUnmount 回调，标记元素
                  if (currentOptions?.onUnmount) {
                    stateManager.markElementForUnmount(element)
                  }
                })
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
                // 检查被移除的元素是否匹配 selectors
                if (removedNode.matches(selectors) && stateManager.hasUnmountCallback(removedNode)) {
                  currentOptions.onUnmount!(removedNode as E)
                  stateManager.removeUnmountCallback(removedNode)
                } else {
                  // 检查被移除元素的子元素
                  const matchedChildren = removedNode.querySelectorAll<E>(selectors)
                  matchedChildren.forEach((child) => {
                    if (stateManager.hasUnmountCallback(child)) {
                      currentOptions.onUnmount!(child)
                      stateManager.removeUnmountCallback(child)
                    }
                  })
                }
              }
            })
          }
        })
      },
    })

    if (documentObserverDisposer) {
      disposers.push(documentObserverDisposer)
    }

    // 2. 如果有 onUpdate 回调，为每个匹配的元素创建独立的观察器
    if (optionsRef.current?.onUpdate) {
      const elements = document.querySelectorAll<E>(selectors)

      elements.forEach((element) => {
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
      })
    }

    return () => {
      disposers.forEach((dispose) => dispose())
    }
  }, [selectors, memoedObserveOptions, stateManager])
}
