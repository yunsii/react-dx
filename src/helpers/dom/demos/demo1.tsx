/* eslint-disable no-console */
import React, { useEffect, useState } from 'react'

import { createElementMutationObserver } from '../mutation-observer'

export default function Demo1() {
  const [input, setInput] = useState('')

  useEffect(() => {
    const target = document.querySelector('[data-testid="remove-self"]')
    console.log('🚀 ~ Demo1 ~ target:', target)
    if (!target) {
      return
    }
    const disposer = createElementMutationObserver({
      element: target,
      observeOptions: {
        characterData: true,
      },
      onMount(element) {
        console.log('🚀 ~ file: demo1.tsx:11 ~ onMount ~ element:', element)
      },
      onUpdate(element) {
        console.log('🚀 ~ file: demo1.tsx:15 ~ onUpdate ~ element:', element)
      },
    })

    return () => {
      disposer?.()
    }
  }, [])

  return (
    <div>
      <div data-testid='remove-self'>
        <span>createElementMutationObserver directly</span>
        {/* Un-controlled input can not trigger mutation observer */}
        <input
          className='border'
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
          }}
        />
        <button
          type='button'
          onClick={() => {
            const target = document.querySelector('[data-testid="remove-self"]')
            target?.remove()
          }}
        >
          Remove Self
        </button>
      </div>
    </div>
  )
}
