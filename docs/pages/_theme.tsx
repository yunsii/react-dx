import './global.css'

import React from 'react'
import { createTheme, defaultSideNavs } from 'vite-pages-theme-doc'

import Component404 from './404'

const theme = createTheme({
  logo: <div style={{ fontSize: '20px' }}>react-dx</div>,
  topNavs: [
    {
      label: 'Helpers',
      path: '/helpers',
      activeIfMatch: '/helpers',
    },
    {
      label: 'Hooks',
      path: '/hooks',
      activeIfMatch: '/hooks',
    },
    {
      label: 'react-dx',
      href: 'https://github.com/yunsii/react-dx',
    },
  ],
  sideNavs: (ctx) => {
    return defaultSideNavs(ctx, {
      groupConfig: {
        components: {
          'demos': {
            label: 'Demos (dev only)',
            order: -1,
          },
          'general': {
            label: 'General',
            order: 1,
          },
          'data-display': {
            label: 'Data Display',
            order: 2,
          },
        },
      },
    })
  },
  Component404,
})

export default theme
