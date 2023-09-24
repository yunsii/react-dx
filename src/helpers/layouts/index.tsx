import React from 'react'

import { getDisplayName } from '../react-nodes'

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
export function withLayouts<PageProps = object>(
  Page: React.ComponentType<PageProps>,
  Layouts: React.ComponentType<{
    children: React.ReactNode
    _pageProps: PageProps
  }>[],
) {
  const WithLayoutsPage: React.FC<PageProps> = (pageProps) => {
    let children = <Page {...(pageProps as any)} />

    for (let index = Layouts.length - 1; index >= 0; index--) {
      const Layout = Layouts[index]
      children = <Layout _pageProps={pageProps}>{children}</Layout>
    }

    return children
  }

  WithLayoutsPage.displayName = `WithLayout(${getDisplayName(Page)})`

  return WithLayoutsPage
}
