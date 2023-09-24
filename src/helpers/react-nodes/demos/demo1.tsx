import React from 'react'

import { joinReactNodes } from '..'

export default function Demo1() {
  return (
    <div className='flex gap-1 justify-center items-center'>
      {joinReactNodes(
        Array.from({ length: 5 })
          .fill(null)
          .map((_, index) => {
            return <div key={index}>{index}</div>
          }),
        '|',
      )}
    </div>
  )
}
