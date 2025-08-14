export interface CreateElementMutationObserverOptions<
  T extends Element = Element,
> {
  element: T
  /**
   * 默认值：
   *
   * {
   *   subtree: true,
   *   childList: true,
   *   attributes: true,
   * }
   *
   * 传入的值做合并处理
   */
  observeOptions?: MutationObserverInit
  onMount?: (element: T) => void
  onUpdate?: (element: T, mutations: MutationRecord[]) => void
}

export function createElementMutationObserver<T extends Element = Element>(
  options: CreateElementMutationObserverOptions<T>,
) {
  const { element, onMount, onUpdate, observeOptions }
    = options

  if (!element.isConnected) {
    return
  }

  if (onMount) {
    onMount(element)
  }

  if (onUpdate) {
    const callback: MutationCallback = (mutations, observer) => {
      onUpdate(element, mutations)
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback)

    // Start observing the target node for configured mutations
    observer.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      ...observeOptions,
    })

    return () => {
      observer.disconnect()
    }
  }
}
