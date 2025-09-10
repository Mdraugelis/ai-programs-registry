import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockFile, createMockImageFile, createTestPDFBlob } from '../../../../test/utils'
import DocumentDropZone from '../DocumentDropZone'

// Mock Mantine Dropzone
const mockDropzone = vi.fn(({ children, onDrop, onReject, disabled }) => {
  return (
    <div 
      data-testid="dropzone"
      data-disabled={disabled}
      onClick={() => {
        if (!disabled) {
          // Simulate file selection
          const fileInput = document.createElement('input')
          fileInput.type = 'file'
          fileInput.multiple = true
          fileInput.click = vi.fn()
          
          // Create mock files for testing
          const files = [createMockFile('test1.pdf'), createMockFile('test2.pdf')]
          Object.defineProperty(fileInput, 'files', {
            value: files,
            writable: false,
          })
          
          if (onDrop) onDrop(files)
        }
      }}
    >
      {children}
    </div>
  )
})

vi.mock('@mantine/dropzone', () => ({
  Dropzone: mockDropzone
}))

describe('DocumentDropZone', () => {
  const mockOnDrop = vi.fn()
  const defaultProps = {
    onDrop: mockOnDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024,
    multiple: true,
    libraryType: 'core' as const,
    category: 'documents' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fetch for upload simulation
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as vi.Mock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders dropzone with correct content', () => {
      render(<DocumentDropZone {...defaultProps} />)
      
      expect(screen.getByTestId('dropzone')).toBeInTheDocument()
      expect(screen.getByText(/drag files here/i)).toBeInTheDocument()
      expect(screen.getByText(/click to select files/i)).toBeInTheDocument()
    })

    it('shows file type restrictions', () => {
      render(<DocumentDropZone {...defaultProps} />)
      
      expect(screen.getByText(/accepted files/i)).toBeInTheDocument()
      expect(screen.getByText(/pdf/i)).toBeInTheDocument()
    })

    it('shows file size limit', () => {
      render(<DocumentDropZone {...defaultProps} maxSize={10 * 1024 * 1024} />)
      
      expect(screen.getByText(/max size: 10\.00 mb/i)).toBeInTheDocument()
    })

    it('renders as disabled when disabled prop is true', () => {
      render(<DocumentDropZone {...defaultProps} disabled={true} />)
      
      const dropzone = screen.getByTestId('dropzone')
      expect(dropzone).toHaveAttribute('data-disabled', 'true')
    })

    it('renders custom children when provided', () => {
      render(
        <DocumentDropZone {...defaultProps}>
          <div data-testid="custom-content">Custom Upload Area</div>
        </DocumentDropZone>
      )
      
      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
      expect(screen.getByText('Custom Upload Area')).toBeInTheDocument()
    })
  })

  describe('File Upload', () => {
    it('handles file drop correctly', async () => {
      const user = userEvent.setup()
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      // Wait for upload to start
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      })
      
      expect(mockOnDrop).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'test1.pdf' }),
          expect.objectContaining({ name: 'test2.pdf' })
        ])
      )
    })

    it('shows upload progress for each file', async () => {
      const user = userEvent.setup()
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument()
        expect(screen.getByText('test2.pdf')).toBeInTheDocument()
      })
      
      // Should show progress bars
      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars).toHaveLength(2)
    })

    it('allows pausing and resuming uploads', async () => {
      const user = userEvent.setup()
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      })
      
      // Find and click pause button
      const pauseButtons = screen.getAllByLabelText(/pause upload/i)
      await user.click(pauseButtons[0])
      
      // Should show resume button
      expect(screen.getByLabelText(/resume upload/i)).toBeInTheDocument()
      
      // Click resume
      const resumeButton = screen.getByLabelText(/resume upload/i)
      await user.click(resumeButton)
      
      // Should show pause button again
      expect(screen.getByLabelText(/pause upload/i)).toBeInTheDocument()
    })

    it('allows canceling uploads', async () => {
      const user = userEvent.setup()
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      })
      
      // Find and click cancel button
      const cancelButtons = screen.getAllByLabelText(/cancel upload/i)
      await user.click(cancelButtons[0])
      
      // File should be removed from list
      await waitFor(() => {
        expect(screen.queryByText('test1.pdf')).not.toBeInTheDocument()
      })
      
      // Other file should still be there
      expect(screen.getByText('test2.pdf')).toBeInTheDocument()
    })

    it('shows success status when upload completes', async () => {
      const user = userEvent.setup()
      
      // Mock successful upload
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true,
            document: { id: 'doc-1', filename: 'test1.pdf' }
          }),
        })
      ) as vi.Mock
      
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      })
      
      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('shows error status when upload fails', async () => {
      const user = userEvent.setup()
      
      // Mock failed upload
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Upload failed'))
      ) as vi.Mock
      
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      })
      
      // Wait for upload to fail
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('File Validation', () => {
    it('shows rejected files when invalid files are dropped', () => {
      const mockReject = vi.fn()
      
      // Mock dropzone to trigger rejection
      mockDropzone.mockImplementationOnce(({ onReject }) => {
        React.useEffect(() => {
          if (onReject) {
            onReject([
              { file: createMockFile('invalid.txt', 'text/plain'), errors: [{ code: 'file-invalid-type' }] }
            ])
          }
        }, [])
        
        return <div data-testid="dropzone">Dropzone</div>
      })
      
      render(<DocumentDropZone {...defaultProps} />)
      
      expect(screen.getByText(/rejected files/i)).toBeInTheDocument()
      expect(screen.getByText('invalid.txt')).toBeInTheDocument()
    })

    it('respects single file mode when multiple is false', () => {
      render(<DocumentDropZone {...defaultProps} multiple={false} />)
      
      // Check that multiple prop is passed correctly to Dropzone
      expect(mockDropzone).toHaveBeenCalledWith(
        expect.objectContaining({ multiple: false }),
        expect.any(Object)
      )
    })

    it('validates file size correctly', () => {
      const smallMaxSize = 1024 // 1KB
      
      render(<DocumentDropZone {...defaultProps} maxSize={smallMaxSize} />)
      
      expect(mockDropzone).toHaveBeenCalledWith(
        expect.objectContaining({ maxSize: smallMaxSize }),
        expect.any(Object)
      )
    })
  })

  describe('Different Library Types', () => {
    it('handles admin library type', () => {
      render(<DocumentDropZone {...defaultProps} libraryType="admin" />)
      
      expect(screen.getByTestId('dropzone')).toBeInTheDocument()
    })

    it('handles core library type', () => {
      render(<DocumentDropZone {...defaultProps} libraryType="core" />)
      
      expect(screen.getByTestId('dropzone')).toBeInTheDocument()
    })

    it('handles ancillary library type', () => {
      render(<DocumentDropZone {...defaultProps} libraryType="ancillary" />)
      
      expect(screen.getByTestId('dropzone')).toBeInTheDocument()
    })
  })

  describe('File Type Categories', () => {
    it('accepts PDF files', async () => {
      const user = userEvent.setup()
      render(<DocumentDropZone {...defaultProps} accept={{ 'application/pdf': ['.pdf'] }} />)
      
      expect(screen.getByText(/pdf/i)).toBeInTheDocument()
    })

    it('accepts image files', async () => {
      const imageAccept = {
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg']
      }
      
      render(<DocumentDropZone {...defaultProps} accept={imageAccept} />)
      
      expect(screen.getByText(/png, jpg, jpeg/i)).toBeInTheDocument()
    })

    it('accepts multiple file types', async () => {
      const multiAccept = {
        'application/pdf': ['.pdf'],
        'image/png': ['.png'],
        'application/msword': ['.doc']
      }
      
      render(<DocumentDropZone {...defaultProps} accept={multiAccept} />)
      
      expect(screen.getByText(/pdf, png, doc/i)).toBeInTheDocument()
    })
  })

  describe('Upload Progress Tracking', () => {
    it('shows correct file size formatting in upload list', async () => {
      const user = userEvent.setup()
      
      // Mock file with specific size
      mockDropzone.mockImplementationOnce(({ onDrop }) => (
        <div 
          data-testid="dropzone"
          onClick={() => {
            const file = createMockFile('large-file.pdf')
            Object.defineProperty(file, 'size', { value: 2097152 }) // 2MB
            onDrop([file])
          }}
        >
          Dropzone
        </div>
      ))
      
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      await waitFor(() => {
        expect(screen.getByText('2.00 MB')).toBeInTheDocument()
      })
    })

    it('shows upload speed and time remaining', async () => {
      const user = userEvent.setup()
      
      // Mock slow upload to show progress
      let resolveUpload: (value: any) => void
      global.fetch = vi.fn(() => 
        new Promise(resolve => {
          resolveUpload = resolve
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true })
            })
          }, 2000)
        })
      ) as vi.Mock
      
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      })
      
      // Should show upload progress
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Cleanup', () => {
    it('clears completed uploads when clear button is clicked', async () => {
      const user = userEvent.setup()
      
      // Mock successful upload
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      ) as vi.Mock
      
      render(<DocumentDropZone {...defaultProps} />)
      
      const dropzone = screen.getByTestId('dropzone')
      await user.click(dropzone)
      
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      })
      
      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Should show clear completed button
      const clearButton = screen.getByText(/clear completed/i)
      await user.click(clearButton)
      
      // Completed uploads should be removed
      expect(screen.queryByText('test1.pdf')).not.toBeInTheDocument()
    })
  })
})