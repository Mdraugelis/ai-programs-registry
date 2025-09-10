import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockDocument } from '../../../../test/utils'
import DocumentActionsMenu from '../DocumentActionsMenu'

describe('DocumentActionsMenu', () => {
  const mockDocument = createMockDocument({
    id: 'doc-1',
    filename: 'test-document.pdf',
    library_type: 'core',
    status: 'approved'
  })

  const mockHandlers = {
    onDownload: vi.fn(),
    onPreview: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onArchive: vi.fn(),
    onRestore: vi.fn()
  }

  const defaultProps = {
    document: mockDocument,
    ...mockHandlers,
    userRole: 'contributor' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders action menu button', () => {
      render(<DocumentActionsMenu {...defaultProps} />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      expect(menuButton).toBeInTheDocument()
    })

    it('shows menu items when clicked', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      expect(screen.getByText(/preview/i)).toBeInTheDocument()
      expect(screen.getByText(/download/i)).toBeInTheDocument()
    })
  })

  describe('Role-based Permissions', () => {
    describe('Admin Role', () => {
      it('shows all actions for admin users', async () => {
        const user = userEvent.setup()
        render(<DocumentActionsMenu {...defaultProps} userRole="admin" />)
        
        const menuButton = screen.getByLabelText(/document actions/i)
        await user.click(menuButton)
        
        expect(screen.getByText(/preview/i)).toBeInTheDocument()
        expect(screen.getByText(/download/i)).toBeInTheDocument()
        expect(screen.getByText(/edit/i)).toBeInTheDocument()
        expect(screen.getByText(/delete/i)).toBeInTheDocument()
        expect(screen.getByText(/archive/i)).toBeInTheDocument()
      })

      it('allows admin to edit admin documents', async () => {
        const user = userEvent.setup()
        const adminDocument = createMockDocument({ library_type: 'admin' })
        
        render(
          <DocumentActionsMenu 
            {...defaultProps} 
            document={adminDocument}
            userRole="admin" 
          />
        )
        
        const menuButton = screen.getByLabelText(/document actions/i)
        await user.click(menuButton)
        
        expect(screen.getByText(/edit/i)).toBeInTheDocument()
      })
    })

    describe('Reviewer Role', () => {
      it('shows edit actions for non-admin documents', async () => {
        const user = userEvent.setup()
        render(<DocumentActionsMenu {...defaultProps} userRole="reviewer" />)
        
        const menuButton = screen.getByLabelText(/document actions/i)
        await user.click(menuButton)
        
        expect(screen.getByText(/edit/i)).toBeInTheDocument()
        expect(screen.getByText(/delete/i)).toBeInTheDocument()
      })

      it('does not show edit actions for admin documents', async () => {
        const user = userEvent.setup()
        const adminDocument = createMockDocument({ library_type: 'admin' })
        
        render(
          <DocumentActionsMenu 
            {...defaultProps} 
            document={adminDocument}
            userRole="reviewer" 
          />
        )
        
        const menuButton = screen.getByLabelText(/document actions/i)
        await user.click(menuButton)
        
        expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/delete/i)).not.toBeInTheDocument()
      })
    })

    describe('Contributor Role', () => {
      it('shows edit actions only for ancillary documents', async () => {
        const user = userEvent.setup()
        const ancillaryDocument = createMockDocument({ library_type: 'ancillary' })
        
        render(
          <DocumentActionsMenu 
            {...defaultProps} 
            document={ancillaryDocument}
            userRole="contributor" 
          />
        )
        
        const menuButton = screen.getByLabelText(/document actions/i)
        await user.click(menuButton)
        
        expect(screen.getByText(/edit/i)).toBeInTheDocument()
      })

      it('does not show edit actions for core documents', async () => {
        const user = userEvent.setup()
        render(<DocumentActionsMenu {...defaultProps} userRole="contributor" />)
        
        const menuButton = screen.getByLabelText(/document actions/i)
        await user.click(menuButton)
        
        expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/delete/i)).not.toBeInTheDocument()
      })

      it('always shows preview and download for contributors', async () => {
        const user = userEvent.setup()
        render(<DocumentActionsMenu {...defaultProps} userRole="contributor" />)
        
        const menuButton = screen.getByLabelText(/document actions/i)
        await user.click(menuButton)
        
        expect(screen.getByText(/preview/i)).toBeInTheDocument()
        expect(screen.getByText(/download/i)).toBeInTheDocument()
      })
    })
  })

  describe('Action Handlers', () => {
    it('calls onPreview when preview is clicked', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const previewButton = screen.getByText(/preview/i)
      await user.click(previewButton)
      
      expect(mockHandlers.onPreview).toHaveBeenCalledWith(mockDocument)
    })

    it('calls onDownload when download is clicked', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const downloadButton = screen.getByText(/download/i)
      await user.click(downloadButton)
      
      expect(mockHandlers.onDownload).toHaveBeenCalledWith(mockDocument)
    })

    it('calls onEdit when edit is clicked', async () => {
      const user = userEvent.setup()
      const ancillaryDocument = createMockDocument({ library_type: 'ancillary' })
      
      render(
        <DocumentActionsMenu 
          {...defaultProps} 
          document={ancillaryDocument}
          userRole="contributor" 
        />
      )
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const editButton = screen.getByText(/edit/i)
      await user.click(editButton)
      
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(ancillaryDocument)
    })
  })

  describe('Delete Confirmation', () => {
    it('shows delete confirmation modal', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} userRole="admin" />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const deleteButton = screen.getByText(/delete/i)
      await user.click(deleteButton)
      
      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument()
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
    })

    it('calls onDelete when deletion is confirmed', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} userRole="admin" />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const deleteButton = screen.getByText(/delete/i)
      await user.click(deleteButton)
      
      const confirmButton = screen.getByText(/delete document/i)
      await user.click(confirmButton)
      
      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockDocument)
    })

    it('does not call onDelete when deletion is cancelled', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} userRole="admin" />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const deleteButton = screen.getByText(/delete/i)
      await user.click(deleteButton)
      
      const cancelButton = screen.getByText(/cancel/i)
      await user.click(cancelButton)
      
      expect(mockHandlers.onDelete).not.toHaveBeenCalled()
    })

    it('closes confirmation modal after cancelling', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} userRole="admin" />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const deleteButton = screen.getByText(/delete/i)
      await user.click(deleteButton)
      
      const cancelButton = screen.getByText(/cancel/i)
      await user.click(cancelButton)
      
      expect(screen.queryByText(/confirm deletion/i)).not.toBeInTheDocument()
    })
  })

  describe('Archive Confirmation', () => {
    it('shows archive confirmation modal', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} userRole="admin" />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const archiveButton = screen.getByText(/archive/i)
      await user.click(archiveButton)
      
      expect(screen.getByText(/confirm archive/i)).toBeInTheDocument()
      expect(screen.getByText(/are you sure you want to archive/i)).toBeInTheDocument()
    })

    it('calls onArchive when archiving is confirmed', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} userRole="admin" />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const archiveButton = screen.getByText(/archive/i)
      await user.click(archiveButton)
      
      const confirmButton = screen.getByText(/archive document/i)
      await user.click(confirmButton)
      
      expect(mockHandlers.onArchive).toHaveBeenCalledWith(mockDocument)
    })
  })

  describe('Restore Action', () => {
    it('shows restore option for archived documents', async () => {
      const user = userEvent.setup()
      const archivedDocument = createMockDocument({ status: 'archived' })
      
      render(
        <DocumentActionsMenu 
          {...defaultProps} 
          document={archivedDocument}
          userRole="admin" 
        />
      )
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      expect(screen.getByText(/restore/i)).toBeInTheDocument()
      expect(screen.queryByText(/archive/i)).not.toBeInTheDocument()
    })

    it('calls onRestore when restore is clicked', async () => {
      const user = userEvent.setup()
      const archivedDocument = createMockDocument({ status: 'archived' })
      
      render(
        <DocumentActionsMenu 
          {...defaultProps} 
          document={archivedDocument}
          userRole="admin" 
        />
      )
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const restoreButton = screen.getByText(/restore/i)
      await user.click(restoreButton)
      
      expect(mockHandlers.onRestore).toHaveBeenCalledWith(archivedDocument)
    })
  })

  describe('Version History', () => {
    it('shows version history option for admin users', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} userRole="admin" />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      expect(screen.getByText(/version history/i)).toBeInTheDocument()
    })

    it('does not show version history for contributors', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} userRole="contributor" />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      expect(screen.queryByText(/version history/i)).not.toBeInTheDocument()
    })
  })

  describe('Copy Link', () => {
    it('shows copy link option', async () => {
      const user = userEvent.setup()
      render(<DocumentActionsMenu {...defaultProps} />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      expect(screen.getByText(/copy link/i)).toBeInTheDocument()
    })

    it('copies document link to clipboard', async () => {
      const user = userEvent.setup()
      const mockWriteText = vi.fn()
      
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })
      
      render(<DocumentActionsMenu {...defaultProps} />)
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      const copyLinkButton = screen.getByText(/copy link/i)
      await user.click(copyLinkButton)
      
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/documents/doc-1')
      )
    })
  })

  describe('Document Status Indicators', () => {
    it('shows appropriate actions based on document status', async () => {
      const user = userEvent.setup()
      const pendingDocument = createMockDocument({ status: 'pending' })
      
      render(
        <DocumentActionsMenu 
          {...defaultProps} 
          document={pendingDocument}
          userRole="admin" 
        />
      )
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      // Should show review actions for pending documents
      expect(screen.getByText(/approve/i)).toBeInTheDocument()
      expect(screen.getByText(/reject/i)).toBeInTheDocument()
    })

    it('handles rejected documents correctly', async () => {
      const user = userEvent.setup()
      const rejectedDocument = createMockDocument({ status: 'rejected' })
      
      render(
        <DocumentActionsMenu 
          {...defaultProps} 
          document={rejectedDocument}
          userRole="admin" 
        />
      )
      
      const menuButton = screen.getByLabelText(/document actions/i)
      await user.click(menuButton)
      
      expect(screen.getByText(/resubmit/i)).toBeInTheDocument()
    })
  })
})