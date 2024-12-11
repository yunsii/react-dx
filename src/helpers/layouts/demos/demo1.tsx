import React, { useRef, useState } from 'react'

import { withLayouts } from '..'
import { useAllPageProps, usePageProps } from '../hooks'

export interface PageProps {
  defaultPage: number
}

const InternalPage: React.FC<PageProps> = (props) => {
  const { defaultPage = 0 } = props

  const [count, setCount] = useState(defaultPage)

  return (
    <div className='bg-gray-500 p-2'>
      <div>
        defaultPage:
        {defaultPage}
      </div>
      <div>
        Init by defaultPage:
        {' '}
        {count}
        <button
          type='button'
          className='bg-orange-500 rounded px-1 ml-1'
          onClick={() => {
            setCount(count + 1)
          }}
        >
          +1
        </button>
      </div>
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

const InternalLayout2: React.FC<React.PropsWithChildren<{ testProp?: string }>> = (props) => {
  const { children } = props
  const renderCountRef = useRef(0)
  renderCountRef.current += 1
  const allPageProps = useAllPageProps()
  // eslint-disable-next-line no-console
  console.log('InternalLayout2 allPageProps:', allPageProps)
  const pageProps = usePageProps<PageProps>()
  // eslint-disable-next-line no-console
  console.log('InternalLayout2 pageProps:', pageProps)
  const internalPageProps = usePageProps<PageProps>(InternalPage)
  // eslint-disable-next-line no-console
  console.log('InternalLayout2 internalPageProps:', internalPageProps)

  return (
    <div className='bg-sky-500 p-2'>
      <div>Layout2 Start</div>
      <div>
        renderCount:
        {renderCountRef.current}
      </div>
      {children}
      <div>Layout2 End</div>
    </div>
  )
}

const Layout2 = withLayouts(InternalLayout2, [
  (props) => {
    const { children } = props

    const pageProps = usePageProps()
    // eslint-disable-next-line no-console
    console.log('withLayouts InternalLayout2 pageProps:', pageProps)

    return (
      <div className='bg-teal-500 p-2'>
        <div>
          Layout2'Layout Start
        </div>
        {children}
        <div>
          Layout2'Layout Start
        </div>
      </div>
    )
  },
])

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
      <Layout2 testProp='test'>
        <div>
          <button
            type='button'
            className='bg-orange-500 rounded px-1'
            onClick={() => {
              setCount(count + 1)
            }}
          >
            count(+1):
            {' '}
            {count}
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
        type='button'
        className='bg-orange-500 rounded px-1'
        onClick={() => {
          setDefaultPage(defaultPage + 1)
        }}
      >
        defaultPage(+1):
        {' '}
        {defaultPage}
      </button>
      <Page defaultPage={defaultPage} />
    </div>
  )
}
