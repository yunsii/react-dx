/* eslint-disable no-console */
import React, { useState } from 'react'

import { useElementsMutationObserver } from '..'

export default function Demo1() {
  const [input, setInput] = useState('')
  const [newContainerCount, setNewContainerCount] = useState(0)

  useElementsMutationObserver('[data-testid="container"]', {
    observeOptions: {
      characterData: true,
    },
    onCreate(element) {
      console.log('🚀 ~ file: demo1.tsx:11 ~ onCreate ~ element:', element)
    },
    onMutate(element, mutations) {
      console.log('🚀 ~ file: demo1.tsx:15 ~ onMutate ~ element, mutations:', element, mutations)
    },
    onEffect(element, mutations) {
      console.log('🚀 ~ file: demo1.tsx:18 ~ onEffect ~ element, mutations:', element, mutations)
    },
  })

  return (
    <div>
      <button
        className='border'
        onClick={() => {
          setNewContainerCount(newContainerCount + 1)
        }}
      >
        New container
      </button>
      <div data-testid='container' className='flex flex-col'>
        <span>Container</span>
        <input
          value={input}
          className='border'
          onChange={(event) => {
            setInput(event.target.value)
          }}
        />
      </div>
      <div className='flex flex-wrap gap-2'>
        {Array.from({ length: newContainerCount }).map((_, index) => {
          return (
            <div key={index} data-testid='container' className='bg-cyan-200'>
              new container
              {index + 1}
              <div>
                {/* Un-controlled input can not trigger mutation observer */}
                <input className='border' />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
