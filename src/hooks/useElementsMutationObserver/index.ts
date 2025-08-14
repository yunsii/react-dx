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
export function useElementsMutationObserver<E extends Element = Element>(selectors: string, options: UseElementsMutationObserverBaseOptions<E>, observeOptions?: MutationObserverInit) {
  const optionsRef = useRef(options)

  // 每个 hook 实例都有独立的状态管理，避免多个实例间的状态污染
  const stateManager = useMemo(() => {
    // 使用 WeakSet 管理元素状态，避免 DOM 污染
    // WeakSet 会在元素被垃圾回收时自动清理，无内存泄漏风险
    const mountedElements = new WeakSet<Element>()
    const unmountCallbackElements = new WeakSet<Element>()

    return {
      // 统一的元素状态管理函数
      markElementMounted(element: Element): void {
        mountedElements.add(element)
      },

      isElementMounted(element: Element): boolean {
        return mountedElements.has(element)
      },

      markElementForUnmount(element: Element): void {
        unmountCallbackElements.add(element)
      },

      hasUnmountCallback(element: Element): boolean {
        return unmountCallbackElements.has(element)
      },

      addElementState(element: Element, hasOnMount: boolean, hasOnUnmount: boolean): void {
        if (hasOnMount) {
          this.markElementMounted(element)
        }

        if (hasOnUnmount) {
          this.markElementForUnmount(element)
        }
      },

      processElements<E extends Element>(
        elements: NodeListOf<E> | E[],
        onMount?: (element: E) => void,
        hasOnUnmount?: boolean,
      ): void {
        elements.forEach((element) => {
          onMount?.(element)
          if (hasOnUnmount) {
            this.addElementState(element, true, hasOnUnmount)
          }
        })
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
    const disposer = createElementMutationObserver({
      element: document.documentElement,
      observeOptions: memoedObserveOptions,
      onMount: () => {
        if (optionsRef.current?.onMount) {
          const elements = document.querySelectorAll<E>(selectors)
          stateManager.processElements(elements, optionsRef.current.onMount, !!optionsRef.current?.onUnmount)
        } else if (optionsRef.current?.onUnmount) {
          // 只有 onUnmount 回调时，添加标记属性
          document.querySelectorAll<E>(selectors).forEach((element) => {
            stateManager.markElementForUnmount(element)
          })
        }
      },
      onUpdate: (
        element,
        // ref: https://zh.javascript.info/mutation-observer
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord#instance_properties
        mutations,
      ) => {
        // 缓存回调函数，避免重复访问
        const currentOptions = optionsRef.current
        const { onMount, onUnmount, onUpdate } = currentOptions || {}
        const hasOnMount = !!onMount
        const hasOnUnmount = !!onUnmount

        mutations.forEach((record) => {
          // 处理新增节点
          if (hasOnMount || hasOnUnmount) {
            record.addedNodes.forEach((item) => {
              if (item instanceof Element) {
                if (item.matches(selectors)) {
                  if (hasOnMount) {
                    onMount(item as E)
                  }
                  if (hasOnUnmount) {
                    stateManager.addElementState(item, true, true)
                  }
                  return
                }
                const matchedUnderItem = item.querySelectorAll<E>(selectors)
                if (matchedUnderItem.length > 0) {
                  stateManager.processElements(matchedUnderItem, hasOnMount ? onMount : undefined, hasOnUnmount)
                  return
                }
                const matchedUnderDocumentElement = document.querySelectorAll(selectors)
                matchedUnderDocumentElement.forEach((element) => {
                  if (stateManager.isElementMounted(element)) {
                    return
                  }
                  if (hasOnMount) {
                    onMount(element as E)
                  }
                  if (hasOnUnmount) {
                    stateManager.addElementState(element, true, true)
                  }
                })
              }
            })
          }

          // 处理移除节点
          if (hasOnUnmount) {
            record.removedNodes.forEach((item) => {
              if (item instanceof Element) {
                if (item.matches(selectors)) {
                  onUnmount(item as E)
                } else {
                  // 遍历所有子元素，检查是否在 unmountCallbackElements 中
                  const walker = document.createTreeWalker(
                    item,
                    NodeFilter.SHOW_ELEMENT,
                    {
                      acceptNode: (node) => {
                        return stateManager.hasUnmountCallback(node as Element)
                          ? NodeFilter.FILTER_ACCEPT
                          : NodeFilter.FILTER_SKIP
                      },
                    },
                  )

                  let currentNode = walker.nextNode()
                  while (currentNode) {
                    if (currentNode instanceof Element && (currentNode as Element).matches(selectors)) {
                      onUnmount(currentNode as E)
                    }
                    currentNode = walker.nextNode()
                  }
                }
              }
            })
          }

          // 处理属性和字符数据变化
          if (!onUpdate) {
            return
          }

          if (record.type === 'attributes') {
            // 由于使用 WeakSet 管理状态，不会产生属性变化，直接处理所有属性变化
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
  }, [selectors, memoedObserveOptions, stateManager])
}
