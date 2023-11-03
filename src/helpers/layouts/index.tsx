import React, { useContext } from 'react'

import { getDisplayName } from '../react-nodes'

const PagePropsContext = React.createContext<any>({})

export function usePageProps<PageProps = Record<string, any>>() {
  const context = useContext(PagePropsContext)
  return context as PageProps
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
) {
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

  return WithLayoutsPage
}
