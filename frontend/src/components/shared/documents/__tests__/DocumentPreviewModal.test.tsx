import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockDocument } from '../../../../test/utils'
import DocumentPreviewModal from '../DocumentPreviewModal'

// Mock react-pdf components
vi.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess, onLoadError }: any) => {
    React.useEffect(() => {
      if (onLoadSuccess) {
        setTimeout(() => onLoadSuccess({ numPages: 3 }), 100)
      }
    }, [onLoadSuccess])
    
    return <div data-testid="pdf-document">{children}</div>
  },
  Page: ({ pageNumber }: any) => (
    <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>
  ),
  pdfjs: { 
    GlobalWorkerOptions: { workerSrc: '' },
    version: '3.11.174'
  },
}))

describe('DocumentPreviewModal', () => {
  const mockDocument = createMockDocument({
    id: 'doc-1',
    filename: 'test-document.pdf',
    file_type: 'application/pdf',
    file_size: 1024000,
    upload_date: '2024-01-01T12:00:00Z',
    uploaded_by: 'test-user',
    version: '1.0'
  })

  const defaultProps = {
    document: mockDocument,
    isOpen: true,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.document methods
    Object.defineProperty(window.document, 'createElement', {
      value: vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn(),
      })),
    })
    Object.defineProperty(window.document.body, 'appendChild', {
      value: vi.fn(),
    })
    Object.defineProperty(window.document.body, 'removeChild', {
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders modal when open', () => {
      render(<DocumentPreviewModal {...defaultProps} />)
      
      expect(screen.getByText('Document Preview')).toBeInTheDocument()
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
    })

    it('does not render modal when closed', () => {
      render(<DocumentPreviewModal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Document Preview')).not.toBeInTheDocument()
    })

    it('displays document metadata correctly', () => {
      render(<DocumentPreviewModal {...defaultProps} />)
      
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      expect(screen.getByText('PDF')).toBeInTheDocument()
      expect(screen.getByText('1.00 MB')).toBeInTheDocument()
      expect(screen.getByText('v1.0')).toBeInTheDocument()
      expect(screen.getByText('test-user')).toBeInTheDocument()
    })

    it('shows PDF document when file type is PDF', async () => {
      render(<DocumentPreviewModal {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('pdf-document')).toBeInTheDocument()
      })
    })

    it('shows image preview for image files', () => {
      const imageDocument = createMockDocument({
        filename: 'test-image.jpg',
        file_type: 'image/jpeg'
      })

      render(<DocumentPreviewModal {...defaultProps} document={imageDocument} />)
      
      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'test-image.jpg')
    })

    it('shows unsupported file message for other file types', () => {
      const textDocument = createMockDocument({
        filename: 'test.txt',
        file_type: 'text/plain'
      })

      render(<DocumentPreviewModal {...defaultProps} document={textDocument} />)
      
      expect(screen.getByText(/Preview not available for this file type/)).toBeInTheDocument()
    })
  })

  describe('PDF Navigation', () => {
    it('shows page navigation for multi-page PDFs', async () => {
      render(<DocumentPreviewModal {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      })
      
      expect(screen.getByLabelText(/Previous page/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Next page/)).toBeInTheDocument()
    })

    it('disables previous button on first page', async () => {
      render(<DocumentPreviewModal {...defaultProps} />)
      
      await waitFor(() => {
        const prevButton = screen.getByLabelText(/Previous page/)
        expect(prevButton).toBeDisabled()
      })
    })

    it('navigates to next page when next button is clicked', async () => {
      const user = userEvent.setup()
      render(<DocumentPreviewModal {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      })

      const nextButton = screen.getByLabelText(/Next page/)
      await user.click(nextButton)
      
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })

    it('disables next button on last page', async () => {
      const user = userEvent.setup()
      render(<DocumentPreviewModal {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      })

      // Navigate to last page
      const nextButton = screen.getByLabelText(/Next page/)
      await user.click(nextButton) // Page 2
      await user.click(nextButton) // Page 3
      
      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Actions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(<DocumentPreviewModal {...defaultProps} onClose={onClose} />)
      
      const closeButton = screen.getByLabelText(/Close/)
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('triggers download when download button is clicked', async () => {
      const user = userEvent.setup()
      const mockElement = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      const createElement = vi.fn(() => mockElement)
      const appendChild = vi.fn()
      const removeChild = vi.fn()

      Object.defineProperty(window.document, 'createElement', { value: createElement })
      Object.defineProperty(window.document.body, 'appendChild', { value: appendChild })
      Object.defineProperty(window.document.body, 'removeChild', { value: removeChild })
      
      render(<DocumentPreviewModal {...defaultProps} />)
      
      const downloadButton = screen.getByLabelText(/Download/)
      await user.click(downloadButton)
      
      expect(createElement).toHaveBeenCalledWith('a')
      expect(mockElement.href).toBe('/api/documents/doc-1')
      expect(mockElement.download).toBe('test-document.pdf')
      expect(mockElement.click).toHaveBeenCalledTimes(1)
      expect(appendChild).toHaveBeenCalledWith(mockElement)
      expect(removeChild).toHaveBeenCalledWith(mockElement)
    })

    it('opens document in new tab when external link is clicked', async () => {
      const user = userEvent.setup()
      const mockOpen = vi.fn()
      Object.defineProperty(window, 'open', { value: mockOpen })
      
      render(<DocumentPreviewModal {...defaultProps} />)
      
      const externalButton = screen.getByLabelText(/Open in new tab/)
      await user.click(externalButton)
      
      expect(mockOpen).toHaveBeenCalledWith('/api/documents/doc-1', '_blank')
    })
  })

  describe('Error Handling', () => {
    it('shows error message when PDF fails to load', async () => {
      // Mock PDF component to trigger error
      vi.mocked(require('react-pdf')).Document = ({ onLoadError }: any) => {
        React.useEffect(() => {
          if (onLoadError) {
            onLoadError(new Error('PDF load failed'))
          }
        }, [onLoadError])
        
        return <div data-testid="pdf-document">Error</div>
      }

      render(<DocumentPreviewModal {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load PDF document/)).toBeInTheDocument()
      })
    })
  })

  describe('File Size Formatting', () => {
    it('formats file sizes correctly', () => {
      const testCases = [
        { size: 1024, expected: '1.00 KB' },
        { size: 1048576, expected: '1.00 MB' },
        { size: 1073741824, expected: '1.00 GB' },
        { size: 500, expected: '500 B' }
      ]

      testCases.forEach(({ size, expected }) => {
        const document = createMockDocument({ file_size: size })
        render(<DocumentPreviewModal {...defaultProps} document={document} />)
        
        expect(screen.getByText(expected)).toBeInTheDocument()
      })
    })
  })

  describe('File Type Detection', () => {
    it('correctly identifies file types from extensions', () => {
      const testCases = [
        { filename: 'test.pdf', expected: 'PDF' },
        { filename: 'test.jpg', expected: 'JPG' },
        { filename: 'test.png', expected: 'PNG' },
        { filename: 'test.docx', expected: 'DOCX' },
        { filename: 'test', expected: '' }
      ]

      testCases.forEach(({ filename, expected }) => {
        const document = createMockDocument({ filename })
        render(<DocumentPreviewModal {...defaultProps} document={document} />)
        
        if (expected) {
          expect(screen.getByText(expected)).toBeInTheDocument()
        }
      })
    })
  })

  describe('Date Formatting', () => {
    it('formats upload date correctly', () => {
      const document = createMockDocument({
        upload_date: '2024-01-15T14:30:00Z'
      })

      render(<DocumentPreviewModal {...defaultProps} document={document} />)
      
      // Should display formatted date
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    })
  })
})