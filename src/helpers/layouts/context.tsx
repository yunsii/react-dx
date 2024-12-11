import React from 'react'

export type AllPagePropsValue = Map<React.ComponentType<any>, Record<string, any>>

export const AllPagePropsContext = React.createContext<AllPagePropsValue>(new Map())
