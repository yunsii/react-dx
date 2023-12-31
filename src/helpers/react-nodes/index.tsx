import React from 'react'

export const getDisplayName = (node: React.ComponentType<any>) => {
  return node.displayName || node.name || 'Component'
}

export function joinReactNodes(
  nodes: React.ReactNode[],
  separator: React.ReactNode,
) {
  return nodes
    .filter((item) => Boolean(item))
    .map((item, index) => {
      return (
        <React.Fragment
          key={
            React.isValidElement(item)
              ? item.key
              : ['string', 'number'].includes(typeof item)
              ? `${item}`
              : index
          }
        >
          {item}
          {index + 1 !== nodes.length && separator}
        </React.Fragment>
      )
    })
}
