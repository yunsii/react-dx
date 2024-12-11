import { useContext } from 'react'

import { AllPagePropsContext } from './context'

export function useAllPageProps() {
  const context = useContext(AllPagePropsContext)
  return context
}

export function usePageProps<PageProps = Record<string, any>>(component?: React.ComponentType<PageProps>) {
  const allPageProps = useAllPageProps()
  if (component) {
    return allPageProps.get(component) as PageProps
  }
  // keys order: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps
  const mapKeys = allPageProps.keys().toArray()
  return allPageProps.get(mapKeys[mapKeys.length - 1]) as PageProps
}
