import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Custom render function that includes providers
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MantineProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </MantineProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export const createMockDocument = (overrides = {}) => ({
  id: 'doc-1',
  name: 'Test Document.pdf',
  file_type: 'application/pdf',
  file_size: 1024000,
  upload_date: '2024-01-01T00:00:00Z',
  status: 'approved',
  initiative_id: 'init-1',
  uploaded_by: 'test-user',
  file_path: '/uploads/test-document.pdf',
  version: '1.0',
  category: 'core',
  compliance_status: 'compliant',
  ...overrides,
})

export const createMockFile = (name = 'test.pdf', type = 'application/pdf') => {
  const file = new File(['test content'], name, { type })
  return file
}

export const createMockImageFile = (name = 'test.png') => {
  return new File(['test image'], name, { type: 'image/png' })
}

export const createMockTemplate = (overrides = {}) => ({
  id: 'template-1',
  name: 'Test Template',
  description: 'A test template',
  file_type: 'application/pdf',
  category: 'core',
  is_required: true,
  created_at: '2024-01-01T00:00:00Z',
  created_by: 'admin',
  ...overrides,
})

export const createMockRequirement = (overrides = {}) => ({
  id: 'req-1',
  template_id: 'template-1',
  initiative_id: 'init-1',
  status: 'pending',
  due_date: '2024-12-31',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

export const mockApiError = (message = 'API Error', status = 500) => {
  return Promise.reject(new Error(message))
}

// Setup mock fetch for specific endpoints
export const setupMockFetch = (responses: Record<string, any>) => {
  const mockFetch = vi.fn((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET'
    const key = `${method} ${url}`
    
    if (responses[key]) {
      return mockApiResponse(responses[key])
    }
    
    return mockApiError(`No mock response for ${key}`)
  })
  
  global.fetch = mockFetch
  return mockFetch
}

// Test file utilities
export const createTestPDFBlob = () => {
  const pdfHeader = '%PDF-1.4'
  const pdfContent = `
${pdfHeader}
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000108 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
170
%%EOF`
  
  return new Blob([pdfContent], { type: 'application/pdf' })
}

export const createTestImageBlob = () => {
  // Create a minimal PNG file
  const pngHeader = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82, // CRC
  ])
  
  return new Blob([pngHeader], { type: 'image/png' })
}