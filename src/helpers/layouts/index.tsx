import React, { useContext } from 'react'

import { getDisplayName } from '../react-nodes'

import { PagePropsContext } from './context'

export function usePageProps<PageProps = Record<string, any>>() {
  const context = useContext(PagePropsContext)
  return context as PageProps
}

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

  const WithLayoutsPage: React.FC<PageProps> = (pageProps) => {
    let children = <Page {...(pageProps as any)} />

    for (let index = 0; index < Layouts.length; index++) {
      const Layout = Layouts[index]
      children = <Layout>{children}</Layout>
    }

    children = (
      <PagePropsContext.Provider value={pageProps}>
        {children}
      </PagePropsContext.Provider>
    )

    return children
  }

  WithLayoutsPage.displayName = `WithLayout(${getDisplayName(Page)})`
  propertiesHoist.forEach((item) => {
    if (item in Page) {
      ;(WithLayoutsPage as any)[item] = (Page as any)[item]
    }
  })

  return WithLayoutsPage
}
