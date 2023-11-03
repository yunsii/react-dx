import React, { useState } from 'react'

import { usePageProps, withLayouts } from '..'

export interface PageProps {
  defaultPage: number
}

const InternalPage: React.FC<PageProps> = (props) => {
  const { defaultPage = 0 } = props

  const [count, setCount] = useState(defaultPage)

  return (
    <div className='bg-gray-500 p-2'>
      Page: {count}
      <button
        className='bg-orange-500 rounded px-1 ml-1'
        onClick={() => {
          setCount(count + 1)
        }}
      >
        +1
      </button>
    </div>
  )
}

const Layout1: React.FC<React.PropsWithChildren> = (props) => {
  const { children } = props

  return (
    <div className='bg-cyan-500 text-white p-2'>
      <div>Layout1 Start</div>
      {children}
      <div>Layout1 End</div>
    </div>
  )
}

const Layout2: React.FC<React.PropsWithChildren> = (props) => {
  const { children } = props
  const pageProps = usePageProps<PageProps>()
  // eslint-disable-next-line no-console
  console.log('🚀 ~ file: demo1.tsx:44 ~ pageProps:', pageProps)

  return (
    <div className='bg-sky-500 p-2'>
      <div>Layout2 Start</div>
      {children}
      <div>Layout2 End</div>
    </div>
  )
}

const Layout3: React.FC<React.PropsWithChildren> = (props) => {
  const { children } = props

  return (
    <div className='bg-emerald-500 p-2'>
      <div>Layout3 Start</div>
      {children}
      <div>Layout3 End</div>
    </div>
  )
}

const Page = withLayouts(InternalPage, [
  Layout1,
  ({ children }: React.PropsWithChildren) => {
    const [count, setCount] = useState(0)

    return (
      <Layout2>
        <div>
          <button
            className='bg-orange-500 rounded px-1'
            onClick={() => {
              setCount(count + 1)
            }}
          >
            count: {count}
          </button>
        </div>
        {children}
      </Layout2>
    )
  },
  Layout3,
])

export default function Demo1() {
  const [defaultPage, setDefaultPage] = useState(10)

  return (
    <div>
      <h2>Nested Layouts</h2>
      <button
        className='bg-orange-500 rounded px-1'
        onClick={() => {
          setDefaultPage(defaultPage + 1)
        }}
      >
        defaultPage: {defaultPage}
      </button>
      <Page defaultPage={defaultPage} />
    </div>
  )
}
