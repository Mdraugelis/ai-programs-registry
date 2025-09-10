import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, setupMockFetch, createMockDocument, createMockTemplate } from '../utils'

// Import the main document management components
import DocumentManager from '../../components/documents/DocumentManager'
import AdminLibrary from '../../components/documents/AdminLibrary'
import CoreDocuments from '../../components/documents/CoreDocuments'
import AncillaryDocuments from '../../components/documents/AncillaryDocuments'

describe('Document Management E2E Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup comprehensive mock responses for all document APIs
    setupMockFetch({
      'GET http://localhost:8000/api/admin/documents': [
        createMockDocument({ 
          id: 'admin-1', 
          library_type: 'admin', 
          filename: 'privacy-template.pdf',
          category: 'templates'
        }),
        createMockDocument({ 
          id: 'admin-2', 
          library_type: 'admin', 
          filename: 'governance-policy.pdf',
          category: 'policies'
        })
      ],
      'GET http://localhost:8000/api/core/documents': [
        createMockDocument({ 
          id: 'core-1', 
          library_type: 'core', 
          filename: 'initiative-pia.pdf',
          compliance_status: 'compliant'
        }),
        createMockDocument({ 
          id: 'core-2', 
          library_type: 'core', 
          filename: 'risk-assessment.pdf',
          compliance_status: 'pending'
        })
      ],
      'GET http://localhost:8000/api/ancillary/documents': [
        createMockDocument({ 
          id: 'anc-1', 
          library_type: 'ancillary', 
          filename: 'research-paper.pdf',
          category: 'research'
        }),
        createMockDocument({ 
          id: 'anc-2', 
          library_type: 'ancillary', 
          filename: 'training-material.pptx',
          category: 'training'
        })
      ],
      'GET http://localhost:8000/api/admin/templates': [
        createMockTemplate({ 
          id: 'template-1', 
          name: 'Privacy Impact Assessment',
          category: 'governance'
        }),
        createMockTemplate({ 
          id: 'template-2', 
          name: 'Risk Assessment Form',
          category: 'compliance'
        })
      ]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Document Upload Workflow', () => {
    it('uploads document to admin library successfully', async () => {
      const user = userEvent.setup()
      
      // Mock successful upload response
      setupMockFetch({
        ...setupMockFetch({}),
        'POST http://localhost:8000/api/admin/documents': {
          success: true,
          document: createMockDocument({ 
            id: 'new-admin-doc',
            library_type: 'admin',
            filename: 'new-policy.pdf'
          })
        }
      })

      render(<AdminLibrary />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Admin Document Library')).toBeInTheDocument()
      })

      // Find and interact with upload dropzone
      const dropzone = screen.getByTestId('document-dropzone')
      expect(dropzone).toBeInTheDocument()

      // Simulate file drop
      const file = new File(['test content'], 'new-policy.pdf', { type: 'application/pdf' })
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file]
        }
      })

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify document appears in list
      expect(screen.getByText('new-policy.pdf')).toBeInTheDocument()
    })

    it('handles upload validation errors gracefully', async () => {
      const user = userEvent.setup()
      
      render(<AdminLibrary />)

      const dropzone = screen.getByTestId('document-dropzone')
      
      // Try to upload invalid file type
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [invalidFile]
        }
      })

      // Should show rejection message
      await waitFor(() => {
        expect(screen.getByText(/rejected files/i)).toBeInTheDocument()
        expect(screen.getByText('test.txt')).toBeInTheDocument()
      })
    })

    it('shows upload progress for large files', async () => {
      const user = userEvent.setup()
      
      // Mock slow upload with progress updates
      let uploadProgress = 0
      global.fetch = vi.fn(() => 
        new Promise(resolve => {
          const interval = setInterval(() => {
            uploadProgress += 25
            if (uploadProgress >= 100) {
              clearInterval(interval)
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  document: createMockDocument()
                })
              })
            }
          }, 100)
        })
      ) as vi.Mock

      render(<AdminLibrary />)

      const dropzone = screen.getByTestId('document-dropzone')
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
      
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [largeFile]
        }
      })

      // Should show progress bar
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Document Preview and Download Workflow', () => {
    it('opens document preview modal', async () => {
      const user = userEvent.setup()
      
      render(<AdminLibrary />)

      // Wait for documents to load
      await waitFor(() => {
        expect(screen.getByText('privacy-template.pdf')).toBeInTheDocument()
      })

      // Find and click preview button
      const documentRow = screen.getByText('privacy-template.pdf').closest('tr')
      const previewButton = within(documentRow!).getByLabelText(/preview/i)
      
      await user.click(previewButton)

      // Should open preview modal
      await waitFor(() => {
        expect(screen.getByText('Document Preview')).toBeInTheDocument()
        expect(screen.getByTestId('pdf-document')).toBeInTheDocument()
      })
    })

    it('downloads document when download button is clicked', async () => {
      const user = userEvent.setup()
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn()
      }))
      Object.defineProperty(window.document, 'createElement', {
        value: mockCreateElement
      })

      render(<AdminLibrary />)

      await waitFor(() => {
        expect(screen.getByText('privacy-template.pdf')).toBeInTheDocument()
      })

      // Find and click download button
      const documentRow = screen.getByText('privacy-template.pdf').closest('tr')
      const downloadButton = within(documentRow!).getByLabelText(/download/i)
      
      await user.click(downloadButton)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })

    it('navigates PDF pages in preview', async () => {
      const user = userEvent.setup()
      
      render(<AdminLibrary />)

      await waitFor(() => {
        expect(screen.getByText('privacy-template.pdf')).toBeInTheDocument()
      })

      // Open preview
      const documentRow = screen.getByText('privacy-template.pdf').closest('tr')
      const previewButton = within(documentRow!).getByLabelText(/preview/i)
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText('Document Preview')).toBeInTheDocument()
      })

      // Navigate to next page
      const nextButton = screen.getByLabelText(/next page/i)
      await user.click(nextButton)

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })
  })

  describe('Template Instantiation Workflow', () => {
    it('creates requirement from template for initiative', async () => {
      const user = userEvent.setup()
      
      // Mock template instantiation
      setupMockFetch({
        'POST http://localhost:8000/api/core/documents/instantiate': {
          success: true,
          requirement: {
            id: 'req-new',
            template_id: 'template-1',
            initiative_id: 'init-1',
            status: 'pending'
          }
        }
      })

      render(<CoreDocuments initiativeId="init-1" />)

      await waitFor(() => {
        expect(screen.getByText('Core Documents')).toBeInTheDocument()
      })

      // Find template instantiation button
      const instantiateButton = screen.getByText(/add requirement/i)
      await user.click(instantiateButton)

      // Select template from dropdown
      const templateSelect = screen.getByLabelText(/select template/i)
      await user.click(templateSelect)
      await user.click(screen.getByText('Privacy Impact Assessment'))

      // Confirm instantiation
      const confirmButton = screen.getByText(/create requirement/i)
      await user.click(confirmButton)

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/requirement created successfully/i)).toBeInTheDocument()
      })
    })

    it('shows compliance status after template instantiation', async () => {
      const user = userEvent.setup()
      
      // Mock compliance status response
      setupMockFetch({
        'GET http://localhost:8000/api/compliance/status?initiative_id=init-1': {
          initiative_id: 'init-1',
          overall_compliance: 60,
          total_requirements: 5,
          compliant_requirements: 3,
          pending_requirements: 2
        }
      })

      render(<CoreDocuments initiativeId="init-1" />)

      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument()
        expect(screen.getByText('3 of 5 requirements compliant')).toBeInTheDocument()
      })
    })
  })

  describe('Document Actions and Role-based Access', () => {
    it('shows appropriate actions for admin users', async () => {
      const user = userEvent.setup()
      
      render(<AdminLibrary userRole="admin" />)

      await waitFor(() => {
        expect(screen.getByText('privacy-template.pdf')).toBeInTheDocument()
      })

      // Open actions menu
      const documentRow = screen.getByText('privacy-template.pdf').closest('tr')
      const actionsButton = within(documentRow!).getByLabelText(/document actions/i)
      await user.click(actionsButton)

      // Should show all admin actions
      expect(screen.getByText(/edit/i)).toBeInTheDocument()
      expect(screen.getByText(/delete/i)).toBeInTheDocument()
      expect(screen.getByText(/archive/i)).toBeInTheDocument()
    })

    it('restricts actions for contributor users', async () => {
      const user = userEvent.setup()
      
      render(<CoreDocuments userRole="contributor" />)

      await waitFor(() => {
        expect(screen.getByText('initiative-pia.pdf')).toBeInTheDocument()
      })

      // Open actions menu
      const documentRow = screen.getByText('initiative-pia.pdf').closest('tr')
      const actionsButton = within(documentRow!).getByLabelText(/document actions/i)
      await user.click(actionsButton)

      // Should not show edit/delete for core documents
      expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/delete/i)).not.toBeInTheDocument()
      
      // But should show view actions
      expect(screen.getByText(/preview/i)).toBeInTheDocument()
      expect(screen.getByText(/download/i)).toBeInTheDocument()
    })

    it('allows editing ancillary documents for contributors', async () => {
      const user = userEvent.setup()
      
      render(<AncillaryDocuments userRole="contributor" />)

      await waitFor(() => {
        expect(screen.getByText('research-paper.pdf')).toBeInTheDocument()
      })

      // Open actions menu
      const documentRow = screen.getByText('research-paper.pdf').closest('tr')
      const actionsButton = within(documentRow!).getByLabelText(/document actions/i)
      await user.click(actionsButton)

      // Should show edit action for ancillary documents
      expect(screen.getByText(/edit/i)).toBeInTheDocument()
    })
  })

  describe('Document Filtering and Search', () => {
    it('filters documents by category', async () => {
      const user = userEvent.setup()
      
      render(<AdminLibrary />)

      await waitFor(() => {
        expect(screen.getByText('privacy-template.pdf')).toBeInTheDocument()
        expect(screen.getByText('governance-policy.pdf')).toBeInTheDocument()
      })

      // Apply category filter
      const categoryFilter = screen.getByLabelText(/filter by category/i)
      await user.click(categoryFilter)
      await user.click(screen.getByText('Templates'))

      // Should show only template documents
      expect(screen.getByText('privacy-template.pdf')).toBeInTheDocument()
      expect(screen.queryByText('governance-policy.pdf')).not.toBeInTheDocument()
    })

    it('searches documents by filename', async () => {
      const user = userEvent.setup()
      
      render(<AdminLibrary />)

      await waitFor(() => {
        expect(screen.getByText('privacy-template.pdf')).toBeInTheDocument()
      })

      // Search for specific document
      const searchInput = screen.getByPlaceholderText(/search documents/i)
      await user.type(searchInput, 'privacy')

      // Should filter results
      expect(screen.getByText('privacy-template.pdf')).toBeInTheDocument()
      expect(screen.queryByText('governance-policy.pdf')).not.toBeInTheDocument()
    })

    it('filters by compliance status in core documents', async () => {
      const user = userEvent.setup()
      
      render(<CoreDocuments />)

      await waitFor(() => {
        expect(screen.getByText('initiative-pia.pdf')).toBeInTheDocument()
        expect(screen.getByText('risk-assessment.pdf')).toBeInTheDocument()
      })

      // Filter by compliance status
      const statusFilter = screen.getByLabelText(/filter by status/i)
      await user.click(statusFilter)
      await user.click(screen.getByText('Compliant'))

      // Should show only compliant documents
      expect(screen.getByText('initiative-pia.pdf')).toBeInTheDocument()
      expect(screen.queryByText('risk-assessment.pdf')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('handles API errors gracefully', async () => {
      // Mock API error
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as vi.Mock

      render(<AdminLibrary />)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load documents/i)).toBeInTheDocument()
      })

      // Should show retry button
      expect(screen.getByText(/retry/i)).toBeInTheDocument()
    })

    it('retries failed requests', async () => {
      const user = userEvent.setup()
      let callCount = 0
      
      global.fetch = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      }) as vi.Mock

      render(<AdminLibrary />)

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/failed to load documents/i)).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByText(/retry/i)
      await user.click(retryButton)

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.queryByText(/failed to load documents/i)).not.toBeInTheDocument()
      })

      expect(callCount).toBe(2)
    })

    it('handles upload failures with proper error messages', async () => {
      const user = userEvent.setup()
      
      // Mock upload failure
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 413,
          json: () => Promise.resolve({ error: 'File too large' })
        })
      ) as vi.Mock

      render(<AdminLibrary />)

      const dropzone = screen.getByTestId('document-dropzone')
      const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'huge.pdf', { type: 'application/pdf' })
      
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [largeFile]
        }
      })

      // Should show specific error message
      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument()
      })
    })
  })

  describe('Document Manager Integration', () => {
    it('switches between document libraries correctly', async () => {
      const user = userEvent.setup()
      
      render(<DocumentManager />)

      // Should start with admin library
      expect(screen.getByText('Admin Document Library')).toBeInTheDocument()

      // Switch to core documents
      const coreTab = screen.getByText('Core Documents')
      await user.click(coreTab)

      expect(screen.getByText('Core Documents')).toBeInTheDocument()
      expect(screen.queryByText('Admin Document Library')).not.toBeInTheDocument()

      // Switch to ancillary documents
      const ancillaryTab = screen.getByText('Ancillary Documents')
      await user.click(ancillaryTab)

      expect(screen.getByText('Ancillary Documents')).toBeInTheDocument()
    })

    it('maintains state between tab switches', async () => {
      const user = userEvent.setup()
      
      render(<DocumentManager />)

      // Apply filter in admin library
      const searchInput = screen.getByPlaceholderText(/search documents/i)
      await user.type(searchInput, 'privacy')

      // Switch to core documents and back
      const coreTab = screen.getByText('Core Documents')
      await user.click(coreTab)

      const adminTab = screen.getByText('Admin Library')
      await user.click(adminTab)

      // Search should be preserved
      expect(searchInput).toHaveValue('privacy')
    })
  })
})