/**
 * @title Internal Changes
 * @description 演示内部变化触发 onUpdate 的完整方案
 */

import React, { useEffect, useRef, useState } from 'react'

import { useElementsMutationObserver } from '..'

/**
 * 演示内部变化触发 onUpdate 的完整方案
 * 展示动态添加的元素也能正确获得 onUpdate 观察器
 */
export default function DemoInternalChanges() {
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

  // 监听 .watch-container 元素的变化
  useElementsMutationObserver('.watch-container', {
    onMount: (element) => {
      addLog(`🟢 Mounted: ${element.tagName} (id: ${element.id || 'no-id'})`)
    },
    onUpdate: (element) => {
      addLog(`🔄 Updated: ${element.tagName} (id: ${element.id || 'no-id'}) - children: ${element.children.length}`)
    },
    onUnmount: (element) => {
      addLog(`🔴 Unmounted: ${element.tagName} (id: ${element.id || 'no-id'})`)
    },
  })

  // 操作函数
  const addChildToExisting = () => {
    const container = document.querySelector('.watch-container')
    if (container) {
      const child = document.createElement('div')
      child.textContent = `Child ${Date.now()}`
      child.className = 'child-item'
      child.style.cssText = 'padding: 4px 8px; margin: 2px 0; background: #e3f2fd; border-radius: 4px; font-size: 12px;'
      container.appendChild(child)
    }
  }

  const removeChildFromExisting = () => {
    const container = document.querySelector('.watch-container')
    const lastChild = container?.querySelector('.child-item:last-child')
    if (lastChild) {
      lastChild.remove()
    }
  }

  const addNewContainer = () => {
    const parent = document.querySelector('#containers-parent')
    if (parent) {
      const container = document.createElement('div')
      container.className = 'watch-container'
      container.id = `container-${Date.now()}`
      container.style.cssText = 'border: 2px solid #4caf50; padding: 12px; margin: 8px 0; background: #f1f8e9; border-radius: 6px;'

      container.innerHTML = `
        <h4 style="margin: 0 0 8px 0; color: #2e7d32; font-size: 14px;">新容器 (${container.id})</h4>
        <div class="child-item" style="padding: 4px 8px; margin: 2px 0; background: #c8e6c9; border-radius: 4px; font-size: 12px;">
          初始子元素
        </div>
      `
      parent.appendChild(container)
    }
  }

  const removeLastContainer = () => {
    const containers = document.querySelectorAll('.watch-container')
    const lastContainer = containers[containers.length - 1]
    if (containers.length > 1 && lastContainer) {
      lastContainer.remove()
    }
  }

  const modifyContainerAttribute = () => {
    const container = document.querySelector('.watch-container')
    if (container) {
      const currentTitle = container.getAttribute('data-title') || '0'
      const newTitle = (Number.parseInt(currentTitle) + 1).toString()
      container.setAttribute('data-title', newTitle)
    }
  }

  const addTextNode = () => {
    const container = document.querySelector('.watch-container')
    if (container) {
      const textNode = document.createTextNode(` [Text-${Date.now()}] `)
      container.appendChild(textNode)
    }
  }

  const addDeepNestedElement = () => {
    const container = document.querySelector('.watch-container')
    if (container) {
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'border: 1px dashed #999; padding: 8px; margin: 4px 0;'

      const nested = document.createElement('span')
      nested.textContent = `Nested ${Date.now()}`
      nested.style.cssText = 'background: #fff3e0; padding: 2px 4px; border-radius: 2px;'

      wrapper.appendChild(nested)
      container.appendChild(wrapper)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ color: '#1976d2', marginBottom: '16px' }}>内部变化触发 onUpdate 演示</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#424242' }}>操作按钮：</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button
            type='button'
            onClick={addChildToExisting}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            添加子元素
          </button>
          <button
            type='button'
            onClick={removeChildFromExisting}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            移除子元素
          </button>
          <button
            type='button'
            onClick={addDeepNestedElement}
            style={{
              padding: '6px 12px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            添加嵌套元素
          </button>
          <button
            type='button'
            onClick={addTextNode}
            style={{
              padding: '6px 12px',
              backgroundColor: '#607d8b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            添加文本节点
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type='button'
            onClick={addNewContainer}
            style={{
              padding: '6px 12px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            添加新容器
          </button>
          <button
            type='button'
            onClick={removeLastContainer}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            移除最后容器
          </button>
          <button
            type='button'
            onClick={modifyContainerAttribute}
            style={{
              padding: '6px 12px',
              backgroundColor: '#795548',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            修改容器属性
          </button>
        </div>
      </div>

      <div id='containers-parent'>
        <div
          className='watch-container'
          id='main-container'
          data-title='0'
          style={{
            border: '2px solid #1976d2',
            padding: '12px',
            margin: '8px 0',
            background: '#e3f2fd',
            borderRadius: '6px',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#0d47a1', fontSize: '14px' }}>
            主容器 (.watch-container)
          </h3>
          <p style={{ fontSize: '12px', color: '#424242', margin: '0 0 8px 0' }}>
            这个容器被监听，内部的任何 DOM 变化都会触发 onUpdate
          </p>
          <div
            className='child-item'
            style={{
              padding: '4px 8px',
              margin: '2px 0',
              background: '#bbdefb',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            初始子元素
          </div>
        </div>
      </div>

      <div
        ref={logsContainerRef}
        style={{
          border: '1px solid #ddd',
          padding: '12px',
          maxHeight: '250px',
          overflowY: 'auto',
          background: '#fafafa',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>事件日志:</h3>
        <div style={{ marginBottom: '10px' }}>
          {logs.length === 0
            ? (
                <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>暂无日志...</p>
              )
            : (
                logs.map((log) => (
                  <div
                    key={log}
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      marginBottom: '2px',
                      padding: '2px 4px',
                      backgroundColor: log.includes('🟢')
                        ? '#e8f5e8'
                        : log.includes('🔄')
                          ? '#fff3e0'
                          : log.includes('🔴')
                            ? '#ffeaea'
                            : 'transparent',
                      borderRadius: '2px',
                    }}
                  >
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
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          清空日志
        </button>
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#fff8e1',
          border: '1px solid #ffb74d',
          borderRadius: '4px',
        }}
      >
        <strong style={{ color: '#ef6c00' }}>测试重点:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li style={{ fontSize: '13px', marginBottom: '4px' }}>
            <strong>动态容器的 onUpdate:</strong>
            {' '}
            新添加的容器也能正确响应内部变化
          </li>
          <li style={{ fontSize: '13px', marginBottom: '4px' }}>
            <strong>各种变化类型:</strong>
            {' '}
            子元素增删、嵌套元素、文本节点、属性修改
          </li>
          <li style={{ fontSize: '13px', marginBottom: '4px' }}>
            <strong>生命周期完整性:</strong>
            {' '}
            onMount → onUpdate → onUnmount 的完整流程
          </li>
          <li style={{ fontSize: '13px' }}>
            <strong>观察器自动管理:</strong>
            {' '}
            每个容器都有独立的 onUpdate 观察器
          </li>
        </ul>
      </div>
    </div>
  )
}
