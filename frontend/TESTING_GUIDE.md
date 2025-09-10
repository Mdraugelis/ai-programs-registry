# Document Management System Testing Guide

This comprehensive testing guide covers all aspects of the document management system, including shared components, API integration, and end-to-end workflows.

## Quick Start

### Running Automated Tests

```bash
# Install dependencies
npm install

# Run all tests
npm run test:run

# Run tests with UI
npm run test:ui

# Run specific test suites
npm run test:components    # Shared component tests
npm run test:api          # API integration tests
npm run test:e2e          # End-to-end workflow tests
npm run test:performance  # Performance tests
npm run test:errors       # Error handling tests

# Run tests with coverage
npm run test:coverage
```

### Starting the Application

```bash
# Frontend (port 5174)
npm run dev

# Backend (port 8000 or 8001)
cd ../backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Test Coverage Overview

### 1. Shared Document Components

#### DocumentPreviewModal
- **Location**: `/src/components/shared/documents/DocumentPreviewModal.tsx`
- **Test File**: `/src/components/shared/documents/__tests__/DocumentPreviewModal.test.tsx`

**Test Coverage:**
- ✅ Modal rendering and visibility
- ✅ Document metadata display
- ✅ PDF preview functionality
- ✅ Image preview support
- ✅ Page navigation for PDFs
- ✅ Download functionality
- ✅ External link opening
- ✅ Error handling for corrupted files
- ✅ File size formatting
- ✅ Date formatting

#### DocumentDropZone
- **Location**: `/src/components/shared/documents/DocumentDropZone.tsx`
- **Test File**: `/src/components/shared/documents/__tests__/DocumentDropZone.test.tsx`

**Test Coverage:**
- ✅ Drag and drop functionality
- ✅ File upload progress tracking
- ✅ Multiple file handling
- ✅ Upload pause/resume/cancel
- ✅ File validation (type, size)
- ✅ Error handling and retry
- ✅ Different library types support
- ✅ Upload speed and progress display

#### DocumentActionsMenu
- **Location**: `/src/components/shared/documents/DocumentActionsMenu.tsx`
- **Test File**: `/src/components/shared/documents/__tests__/DocumentActionsMenu.test.tsx`

**Test Coverage:**
- ✅ Role-based permissions (admin, reviewer, contributor)
- ✅ Action handlers (preview, download, edit, delete)
- ✅ Confirmation modals
- ✅ Document status handling
- ✅ Library type restrictions
- ✅ Copy link functionality

### 2. API Integration Tests

#### Document API Endpoints
- **Test File**: `/src/test/api/documentApi.test.ts`

**Coverage:**
- ✅ Admin documents CRUD operations
- ✅ Core documents with compliance tracking
- ✅ Ancillary documents by category
- ✅ Template management
- ✅ File upload/download
- ✅ Error handling (network, validation, auth)
- ✅ Pagination and filtering

### 3. End-to-End Workflow Tests

#### Complete Document Workflows
- **Test File**: `/src/test/e2e/documentWorkflows.test.tsx`

**Coverage:**
- ✅ Full upload workflow (dropzone → progress → completion)
- ✅ Document preview and download workflow
- ✅ Template instantiation for initiatives
- ✅ Role-based access control
- ✅ Document filtering and search
- ✅ Error recovery and retry mechanisms
- ✅ Multi-library tab navigation

### 4. Performance Tests

#### Performance Benchmarks
- **Test File**: `/src/test/performance/documentPerformance.test.tsx`

**Coverage:**
- ✅ Concurrent upload handling
- ✅ Large file upload performance
- ✅ PDF rendering optimization
- ✅ Memory leak prevention
- ✅ Large dataset virtualization
- ✅ Search performance on large datasets

### 5. Error Handling Tests

#### Comprehensive Error Scenarios
- **Test File**: `/src/test/error-handling/documentErrors.test.tsx`

**Coverage:**
- ✅ Network failures and recovery
- ✅ Server error responses (4xx, 5xx)
- ✅ File validation errors
- ✅ PDF loading failures
- ✅ Upload timeouts
- ✅ Permission errors
- ✅ Malformed responses
- ✅ Component crash recovery

## Manual Testing Procedures

### Test Environment Setup

1. **Backend Running**: Ensure backend is running on `http://localhost:8000` or `http://localhost:8001`
2. **Frontend Running**: Ensure frontend is running on `http://localhost:5174`
3. **Test Data**: Use the test pages at `/test-documents` and `/test-simple`

### Critical User Journeys

#### Journey 1: Document Upload and Management
1. Navigate to Admin Library
2. Upload a PDF document (test with: small PDF, large PDF, invalid file type)
3. Verify upload progress is shown
4. Confirm document appears in the list
5. Test document actions (preview, download, edit, delete)
6. Verify role-based restrictions

#### Journey 2: PDF Preview Functionality
1. Upload a multi-page PDF document
2. Click preview action
3. Verify PDF loads correctly
4. Test page navigation (previous/next)
5. Test download from preview modal
6. Test external link opening
7. Close modal and verify proper cleanup

#### Journey 3: Three-Tier Document System
1. **Admin Library**: Upload template documents
2. **Core Documents**: Instantiate templates for initiatives
3. **Ancillary Documents**: Upload supporting materials
4. Verify proper categorization and permissions
5. Test compliance tracking updates

#### Journey 4: Error Handling
1. **Network Errors**: Disconnect network during upload
2. **File Size Errors**: Upload file > 50MB
3. **Invalid File Types**: Upload .exe or .js files
4. **Server Errors**: Test with backend down
5. Verify error messages are user-friendly
6. Test retry mechanisms work

### Performance Testing

#### Upload Performance
1. **Single Large File**: Upload 45MB PDF, measure time
2. **Multiple Files**: Upload 10 files simultaneously
3. **Concurrent Users**: Test with multiple browser tabs
4. **Memory Usage**: Monitor browser memory during uploads

#### Preview Performance
1. **Large PDF**: Test 100+ page document preview
2. **Page Navigation**: Measure page switching speed
3. **Multiple Previews**: Open several preview modals
4. **Memory Cleanup**: Verify no memory leaks after closing

### Browser Compatibility

Test the following browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)  
- ✅ Safari (latest)
- ✅ Edge (latest)

### Device Testing

- ✅ Desktop (1920x1080)
- ✅ Tablet (iPad dimensions)
- ✅ Mobile (responsive behavior)

## Test Data Requirements

### Sample Files for Testing

#### PDF Documents
- **Small PDF** (< 1MB): Basic single-page document
- **Medium PDF** (5-10MB): Multi-page document with images
- **Large PDF** (40-49MB): Near size limit document
- **Oversized PDF** (> 50MB): For size validation testing
- **Corrupted PDF**: Invalid PDF file for error testing

#### Image Files
- **PNG/JPG** (various sizes): For image preview testing
- **Unsupported formats** (WebP, TIFF): For validation testing

#### Invalid Files
- **Executable files** (.exe, .app): Security testing
- **Script files** (.js, .py): Type validation
- **Binary files** (.bin, .dat): Format validation

### User Roles for Testing

#### Admin User
- Full access to all libraries
- Can upload, edit, delete any document
- Can manage templates and requirements

#### Reviewer User  
- Access to core and ancillary libraries
- Can edit non-admin documents
- Can approve/reject submissions

#### Contributor User
- Read access to all libraries
- Can upload to ancillary library only
- Can edit own ancillary documents

## Expected Behavior

### Upload Success Criteria
- Progress bar shows during upload
- Success message displays on completion
- Document appears in appropriate library
- Metadata is correctly populated
- File is downloadable

### Preview Success Criteria
- Modal opens without delay
- PDF/image content displays correctly
- Navigation controls work smoothly
- Metadata is accurate
- Download/external links function

### Error Handling Success Criteria
- Clear, actionable error messages
- Retry mechanisms work
- No application crashes
- State recovery after errors
- Proper loading states

## Known Issues and Limitations

### Current Limitations
1. **PDF.js Worker**: May require specific worker configuration
2. **Large File Uploads**: Browser memory limitations for files > 100MB
3. **Concurrent Uploads**: Limited by browser connection limits
4. **PDF Preview**: Some complex PDFs may not render perfectly

### Browser-Specific Issues
1. **Safari**: File drag-and-drop may have limitations
2. **Firefox**: PDF worker loading may be slower
3. **Mobile Browsers**: Upload functionality may be limited

## Troubleshooting

### Common Issues

#### Tests Not Running
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### PDF Preview Not Working
- Check PDF.js worker configuration
- Verify PDF file is not corrupted
- Check browser console for errors

#### Upload Failures
- Verify backend is running
- Check file size limits
- Confirm file type is supported
- Check network connectivity

#### Permission Errors
- Verify user role is set correctly
- Check backend authentication
- Confirm library type permissions

### Debug Commands

```bash
# View detailed test output
npm run test -- --reporter=verbose

# Run specific test file
npm run test -- DocumentPreviewModal.test.tsx

# Debug mode with browser
npm run test:ui

# Check coverage
npm run test:coverage
```

## Continuous Integration

### Pre-commit Checks
```bash
# Lint code
npm run lint

# Run tests
npm run test:run

# Build application
npm run build
```

### CI Pipeline Recommendations
1. Run all test suites
2. Check code coverage (aim for > 80%)
3. Performance benchmarks
4. Cross-browser testing
5. Accessibility testing

## Security Testing

### File Upload Security
- ✅ File type validation
- ✅ File size limits
- ✅ Filename sanitization
- ✅ Virus scanning (recommend adding)
- ✅ Access control enforcement

### Data Security
- ✅ Authentication required
- ✅ Role-based permissions
- ✅ Secure file storage
- ✅ HTTPS enforcement
- ✅ Input validation

## Accessibility Testing

### WCAG Compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast ratios
- ✅ Focus management
- ✅ Alternative text for images

### Testing Tools
- NVDA/JAWS screen readers
- Lighthouse accessibility audit
- axe-core testing
- Keyboard-only navigation

## Performance Benchmarks

### Target Metrics
- **Upload start**: < 200ms
- **Preview load**: < 500ms
- **Page navigation**: < 100ms
- **Search results**: < 300ms
- **Memory usage**: < 100MB per session

### Monitoring
- Use browser DevTools Performance tab
- Monitor Core Web Vitals
- Track memory usage during extended sessions
- Measure API response times

---

## Support and Maintenance

For issues with tests or functionality:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Verify backend API is responding
4. Check file permissions and sizes
5. Test with different browsers

The test suite is designed to be comprehensive and maintainable. Regular updates should include:
- New test cases for new features
- Performance regression testing
- Security vulnerability testing
- Cross-browser compatibility updates