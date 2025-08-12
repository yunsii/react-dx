/* eslint-disable no-console */
import React, { useState } from 'react'

import { useElementsMutationObserver } from '..'

export default function Demo1() {
  const [input, setInput] = useState('')
  const [newContainerCount, setNewContainerCount] = useState(0)

  useElementsMutationObserver('[data-testid="container"]', {
    onMount(element) {
      console.log('🚀 ~ file: demo1.tsx:11 ~ onMount ~ element:', element)
    },
    onUpdate(element) {
      console.log('🚀 ~ file: demo1.tsx:15 ~ onUpdate ~ element:', element)
    },
    onUnmount(element) {
      console.log('🚀 ~ file: demo1.tsx:18 ~ onUnmount ~ element:', element)
    },
  }, {
    characterData: true,
  })

  return (
    <div>
      <button
        type='button'
        className='border'
        onClick={() => {
          setNewContainerCount(newContainerCount + 1)
        }}
      >
        New container
      </button>
      <button
        type='button'
        className='border'
        onClick={() => {
          setNewContainerCount(newContainerCount - 1)
        }}
      >
        Remove container
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
                <input className='border' />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
