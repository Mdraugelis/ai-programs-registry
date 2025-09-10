import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockDocument, setupMockFetch } from '../utils'

// Import components for error testing
import DocumentPreviewModal from '../../components/shared/documents/DocumentPreviewModal'
import DocumentDropZone from '../../components/shared/documents/DocumentDropZone'
import DocumentActionsMenu from '../../components/shared/documents/DocumentActionsMenu'

describe('Document Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console errors during testing
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('File Upload Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock network failure
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error - Connection failed'))
      ) as vi.Mock

      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, file)

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument()
      })

      // Should provide retry option
      expect(screen.getByText(/retry/i)).toBeInTheDocument()
    })

    it('handles server errors with specific error codes', async () => {
      const user = userEvent.setup()
      
      const errorScenarios = [
        {
          status: 413,
          error: 'File size exceeds maximum limit of 50MB',
          expectedMessage: /file size exceeds/i
        },
        {
          status: 415,
          error: 'Unsupported file type. Only PDF, DOC, and image files are allowed',
          expectedMessage: /unsupported file type/i
        },
        {
          status: 422,
          error: 'Validation failed: filename contains invalid characters',
          expectedMessage: /validation failed/i
        },
        {
          status: 409,
          error: 'A document with this name already exists',
          expectedMessage: /document.*already exists/i
        },
        {
          status: 507,
          error: 'Insufficient storage space available',
          expectedMessage: /insufficient storage/i
        }
      ]

      for (const scenario of errorScenarios) {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: scenario.status,
            json: () => Promise.resolve({ error: scenario.error })
          })
        ) as vi.Mock

        const { unmount } = render(
          <DocumentDropZone
            onDrop={vi.fn()}
            accept={{ 'application/pdf': ['.pdf'] }}
          />
        )

        const dropzone = screen.getByTestId('dropzone')
        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
        
        await user.upload(dropzone, file)

        await waitFor(() => {
          expect(screen.getByText(scenario.expectedMessage)).toBeInTheDocument()
        })

        unmount()
      }
    })

    it('handles malformed server responses', async () => {
      const user = userEvent.setup()
      
      // Mock malformed JSON response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.reject(new Error('Invalid JSON'))
        })
      ) as vi.Mock

      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, file)

      // Should show generic error message for malformed responses
      await waitFor(() => {
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument()
      })
    })

    it('handles file reading errors', async () => {
      const user = userEvent.setup()
      
      // Mock FileReader error
      const originalFileReader = window.FileReader
      window.FileReader = vi.fn(() => ({
        readAsArrayBuffer: vi.fn(function() {
          setTimeout(() => {
            this.onerror(new Error('File read error'))
          }, 100)
        }),
        result: null,
        onload: null,
        onerror: null
      })) as any

      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, file)

      await waitFor(() => {
        expect(screen.getByText(/failed to read file/i)).toBeInTheDocument()
      })

      // Restore FileReader
      window.FileReader = originalFileReader
    })

    it('validates file types and shows appropriate errors', async () => {
      const user = userEvent.setup()
      
      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      
      // Try uploading invalid file types
      const invalidFiles = [
        new File(['virus'], 'malware.exe', { type: 'application/x-executable' }),
        new File(['script'], 'script.js', { type: 'application/javascript' }),
        new File(['video'], 'movie.mp4', { type: 'video/mp4' })
      ]

      for (const file of invalidFiles) {
        await user.upload(dropzone, file)
        
        await waitFor(() => {
          expect(screen.getByText(/rejected files/i)).toBeInTheDocument()
          expect(screen.getByText(file.name)).toBeInTheDocument()
        })
      }
    })

    it('handles upload timeout errors', async () => {
      const user = userEvent.setup()
      vi.useFakeTimers()
      
      // Mock timeout
      global.fetch = vi.fn(() =>
        new Promise((resolve) => {
          // Never resolve to simulate timeout
        })
      ) as vi.Mock

      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
          uploadTimeout={5000} // 5 second timeout
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, file)

      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(6000)

      await waitFor(() => {
        expect(screen.getByText(/upload timed out/i)).toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  describe('PDF Preview Error Handling', () => {
    it('handles PDF loading failures gracefully', async () => {
      const mockDocument = createMockDocument({
        filename: 'corrupted.pdf',
        file_type: 'application/pdf'
      })

      // Mock PDF loading error
      vi.mock('react-pdf', () => ({
        Document: ({ onLoadError }: any) => {
          React.useEffect(() => {
            onLoadError(new Error('Failed to load PDF'))
          }, [])
          return <div data-testid="pdf-document" />
        },
        Page: () => null,
        pdfjs: { GlobalWorkerOptions: { workerSrc: '' } }
      }))

      render(
        <DocumentPreviewModal
          document={mockDocument}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load pdf/i)).toBeInTheDocument()
        expect(screen.getByText(/corrupted or unsupported/i)).toBeInTheDocument()
      })

      // Should still show document metadata
      expect(screen.getByText('corrupted.pdf')).toBeInTheDocument()
    })

    it('handles missing PDF worker errors', async () => {
      const mockDocument = createMockDocument({
        filename: 'test.pdf',
        file_type: 'application/pdf'
      })

      // Mock worker loading error
      vi.mock('react-pdf', () => ({
        Document: ({ onLoadError }: any) => {
          React.useEffect(() => {
            onLoadError(new Error('Setting up fake worker failed'))
          }, [])
          return <div data-testid="pdf-document" />
        },
        Page: () => null,
        pdfjs: { GlobalWorkerOptions: { workerSrc: '' } }
      }))

      render(
        <DocumentPreviewModal
          document={mockDocument}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/pdf viewer initialization failed/i)).toBeInTheDocument()
      })
    })

    it('handles network errors when loading PDF content', async () => {
      const mockDocument = createMockDocument({
        filename: 'test.pdf',
        file_type: 'application/pdf'
      })

      // Mock network error for PDF content
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/documents/')) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }) as vi.Mock

      render(
        <DocumentPreviewModal
          document={mockDocument}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load document/i)).toBeInTheDocument()
      })

      // Should provide download alternative
      expect(screen.getByLabelText(/download/i)).toBeInTheDocument()
    })

    it('handles unsupported image formats gracefully', async () => {
      const mockDocument = createMockDocument({
        filename: 'test.webp',
        file_type: 'image/webp' // Potentially unsupported format
      })

      // Mock image loading error
      const originalImage = global.Image
      global.Image = vi.fn(() => ({
        onload: null,
        onerror: null,
        src: '',
        addEventListener: vi.fn((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('Image load failed')), 100)
          }
        })
      })) as any

      render(
        <DocumentPreviewModal
          document={mockDocument}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load image/i)).toBeInTheDocument()
      })

      global.Image = originalImage
    })
  })

  describe('Document Actions Error Handling', () => {
    it('handles delete operation failures', async () => {
      const user = userEvent.setup()
      const mockDocument = createMockDocument()
      const onDelete = vi.fn(() => 
        Promise.reject(new Error('Delete failed: Document is referenced by active initiatives'))
      )

      render(
        <DocumentActionsMenu
          document={mockDocument}
          onDelete={onDelete}
          userRole="admin"
        />
      )

      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)

      const deleteButton = screen.getByText(/delete/i)
      await user.click(deleteButton)

      const confirmButton = screen.getByText(/delete document/i)
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/delete failed/i)).toBeInTheDocument()
        expect(screen.getByText(/referenced by active initiatives/i)).toBeInTheDocument()
      })
    })

    it('handles download failures gracefully', async () => {
      const user = userEvent.setup()
      const mockDocument = createMockDocument()
      
      // Mock download failure
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Document file not found on server' })
        })
      ) as vi.Mock

      const onDownload = vi.fn(async () => {
        const response = await fetch(`/api/documents/${mockDocument.id}`)
        if (!response.ok) {
          throw new Error('Download failed')
        }
      })

      render(
        <DocumentActionsMenu
          document={mockDocument}
          onDownload={onDownload}
          userRole="contributor"
        />
      )

      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)

      const downloadButton = screen.getByText(/download/i)
      await user.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText(/download failed/i)).toBeInTheDocument()
      })
    })

    it('handles permission errors for restricted actions', async () => {
      const user = userEvent.setup()
      const mockDocument = createMockDocument({ library_type: 'admin' })
      
      // Mock permission error
      const onEdit = vi.fn(() => 
        Promise.reject(new Error('Forbidden: Insufficient permissions'))
      )

      render(
        <DocumentActionsMenu
          document={mockDocument}
          onEdit={onEdit}
          userRole="contributor" // Should not have edit access
        />
      )

      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)

      // Edit should not be visible for contributor on admin documents
      expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()
    })
  })

  describe('Validation Error Handling', () => {
    it('handles client-side validation errors', async () => {
      const user = userEvent.setup()
      
      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
          maxSize={1024} // Very small limit - 1KB
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      
      // Try to upload file larger than limit
      const largeFile = new File(['x'.repeat(2048)], 'large.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, largeFile)

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds limit/i)).toBeInTheDocument()
        expect(screen.getByText(/maximum allowed: 1\.00 kb/i)).toBeInTheDocument()
      })
    })

    it('handles filename validation errors', async () => {
      const user = userEvent.setup()
      
      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      
      // Try files with invalid characters
      const invalidFiles = [
        new File(['content'], 'file<script>.pdf', { type: 'application/pdf' }),
        new File(['content'], 'file|name.pdf', { type: 'application/pdf' }),
        new File(['content'], 'file*.pdf', { type: 'application/pdf' })
      ]

      for (const file of invalidFiles) {
        await user.upload(dropzone, file)
        
        await waitFor(() => {
          expect(screen.getByText(/invalid filename/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Recovery and Retry Mechanisms', () => {
    it('provides retry functionality for failed uploads', async () => {
      const user = userEvent.setup()
      let attemptCount = 0
      
      global.fetch = vi.fn(() => {
        attemptCount++
        if (attemptCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
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

      // Should show error and retry button
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByText(/retry/i)).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByText(/retry/i)
      await user.click(retryButton)

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      })

      expect(attemptCount).toBe(2)
    })

    it('implements exponential backoff for retries', async () => {
      const user = userEvent.setup()
      vi.useFakeTimers()
      
      let attemptCount = 0
      const attemptTimes: number[] = []
      
      global.fetch = vi.fn(() => {
        attemptCount++
        attemptTimes.push(Date.now())
        
        if (attemptCount <= 3) {
          return Promise.reject(new Error('Server temporarily unavailable'))
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      }) as vi.Mock

      render(
        <DocumentDropZone
          onDrop={vi.fn()}
          accept={{ 'application/pdf': ['.pdf'] }}
          retryAttempts={3}
          retryDelay={1000}
        />
      )

      const dropzone = screen.getByTestId('dropzone')
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(dropzone, file)

      // Fast-forward through retry delays
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(1000 * Math.pow(2, i)) // Exponential backoff
      }

      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      })

      expect(attemptCount).toBe(4) // Initial + 3 retries

      vi.useRealTimers()
    })

    it('shows progress for retry attempts', async () => {
      const user = userEvent.setup()
      let attemptCount = 0
      
      global.fetch = vi.fn(() => {
        attemptCount++
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Temporary failure'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
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

      // Should show retry counter
      await waitFor(() => {
        expect(screen.getByText(/retry attempt 1/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/retry attempt 2/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Boundary Integration', () => {
    it('handles component crashes gracefully', async () => {
      // Component that throws an error
      const CrashingComponent = () => {
        throw new Error('Component crashed')
      }

      // Error boundary wrapper
      class ErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean }
      > {
        constructor(props: any) {
          super(props)
          this.state = { hasError: false }
        }

        static getDerivedStateFromError(error: Error) {
          return { hasError: true }
        }

        render() {
          if (this.state.hasError) {
            return <div>Document component error - please refresh the page</div>
          }

          return this.props.children
        }
      }

      render(
        <ErrorBoundary>
          <CrashingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/document component error/i)).toBeInTheDocument()
    })
  })
})