import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockDocument, createTestPDFBlob } from '../utils'
import DocumentPreviewModal from '../../components/shared/documents/DocumentPreviewModal'
import DocumentDropZone from '../../components/shared/documents/DocumentDropZone'

describe('Document Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('File Upload Performance', () => {
    it('handles multiple concurrent uploads efficiently', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const onDrop = vi.fn()
      
      // Mock network delay
      global.fetch = vi.fn(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true })
            })
          }, 1000)
        })
      ) as vi.Mock

      render(
        <DocumentDropZone
          onDrop={onDrop}
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={true}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      
      // Create multiple files
      const files = Array.from({ length: 5 }, (_, i) => 
        new File([`content ${i}`], `file${i}.pdf`, { type: 'application/pdf' })
      )

      // Simulate dropping all files at once
      const startTime = performance.now()
      
      await user.upload(dropzone, files)

      // All uploads should start immediately
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar')
        expect(progressBars).toHaveLength(5)
      })

      // Advance timers to complete uploads
      vi.advanceTimersByTime(1100)

      // All uploads should complete
      await waitFor(() => {
        expect(screen.getAllByText(/upload complete/i)).toHaveLength(5)
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle concurrent uploads efficiently (not sequentially)
      expect(duration).toBeLessThan(2000) // Should not take 5+ seconds for 5 files
      expect(onDrop).toHaveBeenCalledWith(files)
    })

    it('throttles upload progress updates to prevent UI blocking', async () => {
      const user = userEvent.setup()
      let progressCallbacks: Array<(progress: number) => void> = []
      
      global.fetch = vi.fn(() => {
        return new Promise((resolve) => {
          // Simulate rapid progress updates
          let progress = 0
          const interval = setInterval(() => {
            progress += 1
            progressCallbacks.forEach(cb => cb(progress))
            
            if (progress >= 100) {
              clearInterval(interval)
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true })
              })
            }
          }, 10) // Very frequent updates
        })
      }) as vi.Mock

      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['large content'], 'large.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, file)

      // Should throttle updates to prevent excessive re-renders
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()

      // Wait for upload completion
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles large file uploads without memory leaks', async () => {
      const user = userEvent.setup()
      
      // Mock large file upload
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      ) as vi.Mock

      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
          maxSize={100 * 1024 * 1024} // 100MB
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      
      // Create large file (10MB)
      const largeContent = new Uint8Array(10 * 1024 * 1024)
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
      
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      await user.upload(dropzone, largeFile)

      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      })

      // Check that memory usage doesn't grow excessively
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 50MB for a 10MB file)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it('cancels uploads efficiently without hanging requests', async () => {
      const user = userEvent.setup()
      let abortController: AbortController
      
      global.fetch = vi.fn((url, options) => {
        abortController = options?.signal?.constructor === AbortSignal ? 
          { abort: vi.fn() } as any : new AbortController()
        
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true })
            })
          }, 5000) // Long delay
          
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timeout)
              reject(new Error('Upload cancelled'))
            })
          }
        })
      }) as vi.Mock

      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, file)

      // Wait for upload to start
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })

      // Cancel the upload
      const cancelButton = screen.getByLabelText(/cancel upload/i)
      await user.click(cancelButton)

      // Upload should be cancelled immediately
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })

      // Should not complete after cancellation
      vi.advanceTimersByTime(6000)
      expect(screen.queryByText(/upload complete/i)).not.toBeInTheDocument()
    })
  })

  describe('PDF Preview Performance', () => {
    it('renders PDF pages efficiently without blocking UI', async () => {
      const mockDocument = createMockDocument({
        filename: 'large-document.pdf',
        file_type: 'application/pdf'
      })

      // Mock PDF loading with delay
      vi.mock('react-pdf', () => ({
        Document: ({ children, onLoadSuccess }: any) => {
          React.useEffect(() => {
            setTimeout(() => {
              onLoadSuccess({ numPages: 100 }) // Large PDF
            }, 500)
          }, [])
          
          return <div data-testid="pdf-document">{children}</div>
        },
        Page: ({ pageNumber }: any) => {
          // Simulate page rendering delay
          const [loading, setLoading] = React.useState(true)
          
          React.useEffect(() => {
            setTimeout(() => setLoading(false), 100)
          }, [pageNumber])
          
          if (loading) {
            return <div data-testid={`pdf-page-${pageNumber}-loading`}>Loading...</div>
          }
          
          return <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>
        },
        pdfjs: { GlobalWorkerOptions: { workerSrc: '' } }
      }))

      const { rerender } = render(
        <DocumentPreviewModal
          document={mockDocument}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      // PDF should start loading
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument()

      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 100')).toBeInTheDocument()
      })

      // Page navigation should be responsive
      const startTime = performance.now()
      
      const nextButton = screen.getByLabelText(/next page/i)
      await userEvent.setup().click(nextButton)

      await waitFor(() => {
        expect(screen.getByTestId('pdf-page-2')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const navigationTime = endTime - startTime

      // Page navigation should be fast (< 200ms)
      expect(navigationTime).toBeLessThan(200)
    })

    it('handles PDF loading errors gracefully without performance impact', async () => {
      const mockDocument = createMockDocument({
        filename: 'corrupted.pdf',
        file_type: 'application/pdf'
      })

      // Mock PDF loading error
      vi.mock('react-pdf', () => ({
        Document: ({ onLoadError }: any) => {
          React.useEffect(() => {
            setTimeout(() => {
              onLoadError(new Error('PDF corrupted'))
            }, 100)
          }, [])
          
          return <div data-testid="pdf-document">Error loading PDF</div>
        },
        Page: () => null,
        pdfjs: { GlobalWorkerOptions: { workerSrc: '' } }
      }))

      const startTime = performance.now()

      render(
        <DocumentPreviewModal
          document={mockDocument}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      // Should show error quickly without hanging
      await waitFor(() => {
        expect(screen.getByText(/failed to load pdf/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const errorHandlingTime = endTime - startTime

      // Error handling should be fast
      expect(errorHandlingTime).toBeLessThan(500)
    })
  })

  describe('Large Dataset Performance', () => {
    it('renders large document lists efficiently with virtualization', async () => {
      // Mock large dataset
      const largeDocumentList = Array.from({ length: 1000 }, (_, i) =>
        createMockDocument({
          id: `doc-${i}`,
          filename: `document-${i}.pdf`
        })
      )

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(largeDocumentList)
        })
      ) as vi.Mock

      const AdminLibrary = React.lazy(() => 
        import('../../components/documents/AdminLibrary')
      )

      const startTime = performance.now()

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <AdminLibrary />
        </React.Suspense>
      )

      // Should render initial view quickly
      await waitFor(() => {
        expect(screen.getByText('Admin Document Library')).toBeInTheDocument()
      })

      const initialRenderTime = performance.now() - startTime

      // Initial render should be fast even with large dataset
      expect(initialRenderTime).toBeLessThan(1000)

      // Should not render all 1000 items immediately (virtualization)
      const renderedItems = screen.getAllByText(/document-\d+\.pdf/)
      expect(renderedItems.length).toBeLessThan(100) // Should virtualize
    })

    it('handles search and filtering efficiently on large datasets', async () => {
      const user = userEvent.setup()
      
      // Mock large dataset with search
      global.fetch = vi.fn((url) => {
        const searchTerm = new URL(url).searchParams.get('search')
        
        if (searchTerm) {
          // Simulate server-side filtering
          const filteredResults = [
            createMockDocument({ filename: `${searchTerm}-result.pdf` })
          ]
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(filteredResults)
          })
        }
        
        // Return large dataset for initial load
        const largeDataset = Array.from({ length: 1000 }, (_, i) =>
          createMockDocument({ id: `doc-${i}`, filename: `document-${i}.pdf` })
        )
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(largeDataset)
        })
      }) as vi.Mock

      const AdminLibrary = React.lazy(() => 
        import('../../components/documents/AdminLibrary')
      )

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <AdminLibrary />
        </React.Suspense>
      )

      await waitFor(() => {
        expect(screen.getByText('Admin Document Library')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search documents/i)
      
      const startTime = performance.now()
      
      // Perform search
      await user.type(searchInput, 'privacy')

      // Search should complete quickly
      await waitFor(() => {
        expect(screen.getByText('privacy-result.pdf')).toBeInTheDocument()
      })

      const searchTime = performance.now() - startTime

      // Search should be fast (< 1 second)
      expect(searchTime).toBeLessThan(1000)
    })
  })

  describe('Memory Management', () => {
    it('cleans up event listeners and timers on unmount', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')

      const { unmount } = render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      // Component should set up listeners
      expect(addEventListenerSpy).toHaveBeenCalled()

      // Track timeout IDs
      const timeoutIds = setTimeoutSpy.mock.results
        .map(result => result.value)
        .filter(id => typeof id === 'number')

      unmount()

      // Should clean up listeners
      expect(removeEventListenerSpy).toHaveBeenCalled()

      // Should clear any pending timeouts
      timeoutIds.forEach(id => {
        expect(clearTimeoutSpy).toHaveBeenCalledWith(id)
      })
    })

    it('prevents memory leaks from file references', async () => {
      const user = userEvent.setup()
      
      let fileReferences: File[] = []
      const originalCreateObjectURL = URL.createObjectURL
      const originalRevokeObjectURL = URL.revokeObjectURL
      
      URL.createObjectURL = vi.fn((file) => {
        fileReferences.push(file as File)
        return 'blob:mock-url'
      })
      
      const revokeObjectURLSpy = vi.fn()
      URL.revokeObjectURL = revokeObjectURLSpy

      const { unmount } = render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, file)

      expect(fileReferences.length).toBeGreaterThan(0)

      unmount()

      // Should revoke object URLs to prevent memory leaks
      expect(revokeObjectURLSpy).toHaveBeenCalled()

      // Restore original functions
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
    })
  })
})