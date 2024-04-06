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
  /** 支持返回 disposer */
  onCreate?: (element: T) => void | (() => void)
  onMutate?: (element: T, mutations: MutationRecord[]) => void
  /** 挂载和更新时都会调用，支持返回 disposer */
  onEffect?: (
    element: T,
    mutations: MutationRecord[] | [],
  ) => void | (() => void)
  onUnmount?: () => void
}

export function createElementMutationObserver<T extends Element = Element>(
  options: CreateElementMutationObserverOptions<T>,
) {
  const { element, onCreate, onMutate, onEffect, onUnmount, observeOptions }
    = options

  if (!element.isConnected) {
    return
  }

  if ([onMutate, onUnmount, onEffect, onUnmount].every((item) => !item)) {
    return
  }

  const mountDisposer = onCreate?.(element)
  const effectDisposer = onEffect?.(element, [])

  const callback: MutationCallback = (mutations, observer) => {
    if (!element.isConnected) {
      onUnmount?.()
      effectDisposer?.()
      mountDisposer?.()
      observer.disconnect()
      return
    }

    onMutate?.(element, mutations)
    onEffect?.(element, mutations)
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
