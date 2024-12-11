import React, { useMemo } from 'react'

import { getDisplayName } from '../react-nodes'
import { AllPagePropsContext } from './context'
import { useAllPageProps } from './hooks'

import type { AllPagePropsValue } from './context'

export interface WithLayoutsOptions {
  /** page properties to hoist */
  propertiesHoist?: string[]
}

/**
 * Compose page with various layouts
 *
 * Example:
 *
 * `Page` and `[Layout1, Layout2]`
 *
 * result:
 *
 * ```
 * <Layout2>
 *   <Layout1>
 *     <Page />
 *   </Layout1>
 * </Layout2>
 * ```
 */
export function withLayouts<PageProps = Record<string, any>>(
  Page: React.ComponentType<PageProps>,
  Layouts: React.ComponentType<{
    children: React.ReactNode
  }>[],
  options: WithLayoutsOptions = {},
) {
  const { propertiesHoist = [] } = options
  const pageDisplayName = getDisplayName(Page)

  const WithLayoutsPage: React.FC<PageProps> = (pageProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const allPageProps = useAllPageProps()

    let children = <Page {...(pageProps as any)} />

    for (let index = 0; index < Layouts.length; index++) {
      const Layout = Layouts[index]

      if (!Layout.displayName) {
        Layout.displayName = `Layout${index + 1}_${pageDisplayName}`
      }

      children = <Layout>{children}</Layout>
    }

    const pagePropsValue = useMemo(() => {
      const state: AllPagePropsValue = new Map()
      allPageProps.forEach((value, key) => {
        state.set(key, value)
      })
      state.set(Page, pageProps as Record<string, any>)
      return state
    }, [allPageProps, pageProps])

    children = (
      <AllPagePropsContext.Provider value={pagePropsValue}>
        {children}
      </AllPagePropsContext.Provider>
    )

    return children
  }

  WithLayoutsPage.displayName = `WithLayouts(${pageDisplayName})`
  propertiesHoist.forEach((item) => {
    if (item in Page) {
      ;(WithLayoutsPage as any)[item] = (Page as any)[item]
    }
  })

  return WithLayoutsPage
}
