import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Mantine styles to prevent test errors
vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual('@mantine/core')
  return {
    ...actual,
    createStyles: () => () => ({}),
  }
})

// Mock PDF.js to prevent errors in tests
vi.mock('pdfjs-dist/build/pdf', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => Promise.resolve({
    numPages: 1,
    getPage: vi.fn(() => Promise.resolve({
      getViewport: vi.fn(() => ({ width: 100, height: 100 })),
      render: vi.fn(() => ({ promise: Promise.resolve() })),
    })),
  })),
}))

// Mock react-pdf
vi.mock('react-pdf', () => ({
  Document: ({ children }: any) => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'pdf-document' }, children)
  },
  Page: () => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'pdf-page' }, 'PDF Page')
  },
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}))

// Mock file system operations
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mocked-url'),
    revokeObjectURL: vi.fn(),
  },
})

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
})

// Mock file reader
Object.defineProperty(window, 'FileReader', {
  value: class {
    readAsDataURL = vi.fn()
    readAsArrayBuffer = vi.fn()
    result = 'data:image/png;base64,test'
    onload = vi.fn()
    onerror = vi.fn()
  },
})