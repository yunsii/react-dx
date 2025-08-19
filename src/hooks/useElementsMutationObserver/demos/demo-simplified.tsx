/**
 * @title Basic
 * @description 演示 useElementsMutationObserver 的基本用法
 */

import React, { useEffect, useRef, useState } from 'react'

import { useElementsMutationObserver } from '..'

/**
 * 演示新的简化实现方案
 */
export default function DemoSimplified() {
  const [logs, setLogs] = useState<string[]>([])
  const logsContainerRef = useRef<HTMLDivElement>(null)

  // 自动滚动到日志底部
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  // 监听 .test-container 元素的变化
  useElementsMutationObserver('.test-container', {
    onMount: (element) => {
      addLog(`Mounted: ${element.tagName} (id: ${element.id || 'no-id'})`)
    },
    onUpdate: (element) => {
      addLog(`Updated: ${element.tagName} (children: ${element.children.length})`)
    },
    onUnmount: (element) => {
      addLog(`Unmounted: ${element.tagName} (id: ${element.id || 'no-id'})`)
    },
  })

  const addChild = () => {
    const container = document.querySelector('.test-container')
    if (container) {
      const child = document.createElement('div')
      child.textContent = `Child ${Date.now()}`
      child.className = 'test-child'
      container.appendChild(child)
    }
  }

  const removeChild = () => {
    const container = document.querySelector('.test-container')
    const lastChild = container?.querySelector('.test-child:last-child')
    if (lastChild) {
      lastChild.remove()
    }
  }

  const addContainer = () => {
    const parent = document.querySelector('#test-parent')
    if (parent) {
      const container = document.createElement('div')
      container.className = 'test-container'
      container.id = `container-${Date.now()}`
      container.innerHTML = '<div class="test-child">New child</div>'
      parent.appendChild(container)
    }
  }

  const removeContainer = () => {
    const containers = document.querySelectorAll('.test-container')
    const lastContainer = containers[containers.length - 1]
    if (containers.length > 1 && lastContainer) {
      lastContainer.remove()
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>简化实现方案演示</h2>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type='button'
          onClick={addChild}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          添加子元素
        </button>
        <button
          type='button'
          onClick={removeChild}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          移除子元素
        </button>
        <button
          type='button'
          onClick={addContainer}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          添加容器
        </button>
        <button
          type='button'
          onClick={removeContainer}
          style={{
            padding: '8px 16px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          移除容器
        </button>
      </div>

      <div id='test-parent'>
        <div className='test-container' id='main-container' style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h3>主容器</h3>
          <div className='test-child'>初始子元素</div>
        </div>
      </div>

      <div
        ref={logsContainerRef}
        style={{ border: '1px solid #ddd', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}
      >
        <h3>事件日志:</h3>
        <div style={{ marginBottom: '10px' }}>
          {logs.length === 0
            ? (
                <p>暂无日志...</p>
              )
            : (
                logs.map((log) => (
                  <div key={log} style={{ fontSize: '12px', fontFamily: 'monospace', marginBottom: '2px' }}>
                    {log}
                  </div>
                ))
              )}
        </div>
        <button
          type='button'
          onClick={() => setLogs([])}
          style={{
            padding: '4px 8px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          清空日志
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fffbf0', border: '1px solid #f0c674' }}>
        <strong>新方案特点:</strong>
        <ul>
          <li>清晰的职责分离: document 观察器负责 onMount/onUnmount，元素观察器负责 onUpdate</li>
          <li>简化的状态管理: 只管理需要 onUnmount 的元素</li>
          <li>独立的元素观察: 每个匹配元素有自己的 onUpdate 观察器</li>
          <li>自动处理新增元素: 新增的匹配元素会自动触发 onMount</li>
        </ul>
      </div>
    </div>
  )
}
