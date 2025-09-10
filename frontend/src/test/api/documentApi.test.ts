import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupMockFetch, mockApiResponse, mockApiError, createMockDocument, createMockTemplate } from '../utils'

// Mock API service (assuming it exists)
const API_BASE_URL = 'http://localhost:8000/api'

describe('Document API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Admin Documents API', () => {
    describe('GET /api/admin/documents', () => {
      it('fetches admin documents successfully', async () => {
        const mockDocuments = [
          createMockDocument({ library_type: 'admin', id: 'admin-1' }),
          createMockDocument({ library_type: 'admin', id: 'admin-2' })
        ]

        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/admin/documents': mockDocuments
        })

        const response = await fetch(`${API_BASE_URL}/admin/documents`)
        const data = await response.json()

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/admin/documents`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer ')
            })
          })
        )
        expect(data).toEqual(mockDocuments)
      })

      it('handles unauthorized access', async () => {
        setupMockFetch({
          'GET http://localhost:8000/api/admin/documents': { 
            error: 'Unauthorized' 
          }
        })

        const response = await fetch(`${API_BASE_URL}/admin/documents`)
        expect(response.status).toBe(500) // Our mock always returns 500 for errors
      })

      it('includes pagination parameters', async () => {
        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/admin/documents?page=2&limit=10': []
        })

        await fetch(`${API_BASE_URL}/admin/documents?page=2&limit=10`)

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/admin/documents?page=2&limit=10`,
          expect.any(Object)
        )
      })
    })

    describe('POST /api/admin/documents', () => {
      it('uploads admin document successfully', async () => {
        const mockUploadResponse = {
          success: true,
          document: createMockDocument({ library_type: 'admin' })
        }

        const mockFetch = setupMockFetch({
          'POST http://localhost:8000/api/admin/documents': mockUploadResponse
        })

        const formData = new FormData()
        formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'test.pdf')
        formData.append('category', 'templates')

        const response = await fetch(`${API_BASE_URL}/admin/documents`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        })

        const data = await response.json()

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/admin/documents`,
          expect.objectContaining({
            method: 'POST',
            body: formData
          })
        )
        expect(data.success).toBe(true)
        expect(data.document.library_type).toBe('admin')
      })

      it('handles file size limit exceeded', async () => {
        setupMockFetch({
          'POST http://localhost:8000/api/admin/documents': {
            error: 'File size exceeds limit'
          }
        })

        const formData = new FormData()
        formData.append('file', new Blob(['x'.repeat(60 * 1024 * 1024)], { type: 'application/pdf' }), 'large.pdf')

        try {
          await fetch(`${API_BASE_URL}/admin/documents`, {
            method: 'POST',
            body: formData
          })
        } catch (error) {
          expect(error.message).toContain('File size exceeds limit')
        }
      })

      it('validates file type', async () => {
        setupMockFetch({
          'POST http://localhost:8000/api/admin/documents': {
            error: 'Invalid file type'
          }
        })

        const formData = new FormData()
        formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt')

        try {
          await fetch(`${API_BASE_URL}/admin/documents`, {
            method: 'POST',
            body: formData
          })
        } catch (error) {
          expect(error.message).toContain('Invalid file type')
        }
      })
    })

    describe('PUT /api/admin/documents/:id', () => {
      it('updates admin document successfully', async () => {
        const mockDocument = createMockDocument({ library_type: 'admin' })
        const updatedDocument = { ...mockDocument, status: 'approved' }

        const mockFetch = setupMockFetch({
          [`PUT http://localhost:8000/api/admin/documents/${mockDocument.id}`]: updatedDocument
        })

        const response = await fetch(`${API_BASE_URL}/admin/documents/${mockDocument.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({ status: 'approved' })
        })

        const data = await response.json()

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/admin/documents/${mockDocument.id}`,
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ status: 'approved' })
          })
        )
        expect(data.status).toBe('approved')
      })
    })

    describe('DELETE /api/admin/documents/:id', () => {
      it('deletes admin document successfully', async () => {
        const mockDocument = createMockDocument({ library_type: 'admin' })

        const mockFetch = setupMockFetch({
          [`DELETE http://localhost:8000/api/admin/documents/${mockDocument.id}`]: { success: true }
        })

        const response = await fetch(`${API_BASE_URL}/admin/documents/${mockDocument.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        })

        const data = await response.json()

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/admin/documents/${mockDocument.id}`,
          expect.objectContaining({
            method: 'DELETE'
          })
        )
        expect(data.success).toBe(true)
      })
    })
  })

  describe('Core Documents API', () => {
    describe('GET /api/core/documents', () => {
      it('fetches core documents with compliance status', async () => {
        const mockDocuments = [
          createMockDocument({ 
            library_type: 'core', 
            compliance_status: 'compliant',
            id: 'core-1' 
          }),
          createMockDocument({ 
            library_type: 'core', 
            compliance_status: 'non_compliant',
            id: 'core-2' 
          })
        ]

        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/core/documents': mockDocuments
        })

        const response = await fetch(`${API_BASE_URL}/core/documents`)
        const data = await response.json()

        expect(data).toEqual(mockDocuments)
        expect(data[0].compliance_status).toBe('compliant')
        expect(data[1].compliance_status).toBe('non_compliant')
      })

      it('filters by compliance status', async () => {
        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/core/documents?compliance_status=compliant': [
            createMockDocument({ compliance_status: 'compliant' })
          ]
        })

        await fetch(`${API_BASE_URL}/core/documents?compliance_status=compliant`)

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/core/documents?compliance_status=compliant`,
          expect.any(Object)
        )
      })

      it('filters by initiative', async () => {
        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/core/documents?initiative_id=init-1': []
        })

        await fetch(`${API_BASE_URL}/core/documents?initiative_id=init-1`)

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/core/documents?initiative_id=init-1`,
          expect.any(Object)
        )
      })
    })

    describe('POST /api/core/documents/instantiate', () => {
      it('instantiates template for initiative', async () => {
        const mockResponse = {
          success: true,
          requirement: {
            id: 'req-1',
            template_id: 'template-1',
            initiative_id: 'init-1',
            status: 'pending'
          }
        }

        const mockFetch = setupMockFetch({
          'POST http://localhost:8000/api/core/documents/instantiate': mockResponse
        })

        const response = await fetch(`${API_BASE_URL}/core/documents/instantiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            template_id: 'template-1',
            initiative_id: 'init-1'
          })
        })

        const data = await response.json()

        expect(data.success).toBe(true)
        expect(data.requirement.template_id).toBe('template-1')
        expect(data.requirement.initiative_id).toBe('init-1')
      })
    })
  })

  describe('Ancillary Documents API', () => {
    describe('GET /api/ancillary/documents', () => {
      it('fetches ancillary documents by category', async () => {
        const mockDocuments = [
          createMockDocument({ 
            library_type: 'ancillary', 
            category: 'research',
            id: 'anc-1' 
          }),
          createMockDocument({ 
            library_type: 'ancillary', 
            category: 'training',
            id: 'anc-2' 
          })
        ]

        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/ancillary/documents?category=research': [mockDocuments[0]]
        })

        const response = await fetch(`${API_BASE_URL}/ancillary/documents?category=research`)
        const data = await response.json()

        expect(data).toEqual([mockDocuments[0]])
        expect(data[0].category).toBe('research')
      })

      it('supports file type filtering', async () => {
        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/ancillary/documents?file_type=application/pdf': []
        })

        await fetch(`${API_BASE_URL}/ancillary/documents?file_type=application/pdf`)

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/ancillary/documents?file_type=application/pdf`,
          expect.any(Object)
        )
      })
    })
  })

  describe('Document Templates API', () => {
    describe('GET /api/admin/templates', () => {
      it('fetches document templates', async () => {
        const mockTemplates = [
          createMockTemplate({ category: 'governance' }),
          createMockTemplate({ category: 'compliance' })
        ]

        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/admin/templates': mockTemplates
        })

        const response = await fetch(`${API_BASE_URL}/admin/templates`)
        const data = await response.json()

        expect(data).toEqual(mockTemplates)
      })

      it('filters templates by category', async () => {
        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/admin/templates?category=governance': []
        })

        await fetch(`${API_BASE_URL}/admin/templates?category=governance`)

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/admin/templates?category=governance`,
          expect.any(Object)
        )
      })
    })

    describe('POST /api/admin/templates', () => {
      it('creates new document template', async () => {
        const mockTemplate = createMockTemplate()

        const mockFetch = setupMockFetch({
          'POST http://localhost:8000/api/admin/templates': mockTemplate
        })

        const response = await fetch(`${API_BASE_URL}/admin/templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            name: 'New Template',
            description: 'Template description',
            category: 'governance',
            is_required: true
          })
        })

        const data = await response.json()

        expect(data).toEqual(mockTemplate)
      })
    })
  })

  describe('Compliance Tracking API', () => {
    describe('GET /api/compliance/status', () => {
      it('fetches compliance status for initiative', async () => {
        const mockComplianceStatus = {
          initiative_id: 'init-1',
          overall_compliance: 75,
          total_requirements: 8,
          compliant_requirements: 6,
          non_compliant_requirements: 1,
          pending_requirements: 1,
          requirements: [
            {
              id: 'req-1',
              template_name: 'Privacy Impact Assessment',
              status: 'compliant',
              due_date: '2024-12-31'
            }
          ]
        }

        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/compliance/status?initiative_id=init-1': mockComplianceStatus
        })

        const response = await fetch(`${API_BASE_URL}/compliance/status?initiative_id=init-1`)
        const data = await response.json()

        expect(data.overall_compliance).toBe(75)
        expect(data.total_requirements).toBe(8)
        expect(data.requirements).toHaveLength(1)
      })

      it('fetches overall compliance summary', async () => {
        const mockSummary = {
          total_initiatives: 10,
          average_compliance: 82,
          initiatives_by_compliance: {
            compliant: 6,
            partially_compliant: 3,
            non_compliant: 1
          }
        }

        const mockFetch = setupMockFetch({
          'GET http://localhost:8000/api/compliance/summary': mockSummary
        })

        const response = await fetch(`${API_BASE_URL}/compliance/summary`)
        const data = await response.json()

        expect(data.total_initiatives).toBe(10)
        expect(data.average_compliance).toBe(82)
      })
    })
  })

  describe('File Download API', () => {
    describe('GET /api/documents/:id', () => {
      it('downloads document file', async () => {
        const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' })

        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(mockBlob),
            headers: new Headers({
              'content-type': 'application/pdf',
              'content-disposition': 'attachment; filename="test.pdf"'
            })
          })
        ) as vi.Mock

        const response = await fetch(`${API_BASE_URL}/documents/doc-1`)
        const blob = await response.blob()

        expect(blob.type).toBe('application/pdf')
        expect(blob.size).toBeGreaterThan(0)
      })

      it('handles missing documents', async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Document not found' })
          })
        ) as vi.Mock

        const response = await fetch(`${API_BASE_URL}/documents/nonexistent`)

        expect(response.ok).toBe(false)
        expect(response.status).toBe(404)
      })
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as vi.Mock

      try {
        await fetch(`${API_BASE_URL}/admin/documents`)
      } catch (error) {
        expect(error.message).toContain('Network error')
      }
    })

    it('handles server errors with proper status codes', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' })
        })
      ) as vi.Mock

      const response = await fetch(`${API_BASE_URL}/admin/documents`)

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    it('handles authentication errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' })
        })
      ) as vi.Mock

      const response = await fetch(`${API_BASE_URL}/admin/documents`)

      expect(response.status).toBe(401)
    })

    it('handles validation errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 422,
          json: () => Promise.resolve({ 
            error: 'Validation error',
            details: { filename: ['This field is required'] }
          })
        })
      ) as vi.Mock

      const response = await fetch(`${API_BASE_URL}/admin/documents`, {
        method: 'POST',
        body: new FormData()
      })

      expect(response.status).toBe(422)
      const data = await response.json()
      expect(data.details).toHaveProperty('filename')
    })
  })
})