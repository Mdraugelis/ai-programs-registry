# GitHub Actions & Branch Protection Setup

This directory contains GitHub Actions workflows and branch protection configuration for the AI Programs Registry.

## 🔄 CI/CD Pipeline (`.github/workflows/ci.yml`)

### Triggers
- **Push** to `main` or `develop` branches
- **Pull Requests** targeting `main` branch

### Jobs

#### 1. **Test Job** (`test`)
- **Matrix Strategy**: Tests on Python 3.11 & 3.12
- **Steps**:
  - Code checkout
  - Python environment setup
  - Dependency caching and installation
  - Code linting with `flake8`
  - Type checking with `mypy`
  - Database initialization
  - Backend server startup
  - Integration test execution

#### 2. **Security Scan** (`security-scan`)
- **Dependency vulnerabilities**: Uses `safety` to check requirements.txt
- **Static security analysis**: Uses `bandit` to scan Python code
- **Artifact upload**: Security scan results saved for review

#### 3. **Build Validation** (`build-validation`)
- **Runs on**: Pull requests only
- **Project structure validation**: Ensures all required files exist
- **CLAUDE.md compliance**: Enforces 500-line limit on app.py
- **API validation**: Tests all required endpoints are accessible

#### 4. **Deployment Ready** (`deployment-ready`)
- **Runs on**: Main branch pushes only
- **Creates deployment artifacts**: Ready-to-deploy package
- **Artifact retention**: 30 days

## 🔒 Branch Protection Setup

### Manual Setup Required

Run the branch protection setup script to enable PR requirements:

```bash
# Make sure you have GitHub CLI installed and authenticated
gh auth login

# Run the setup script
./.github/setup-branch-protection.sh
```

### Protection Rules Applied

#### Required Status Checks
- ✅ `test (3.11)` - Integration tests on Python 3.11
- ✅ `test (3.12)` - Integration tests on Python 3.12  
- ✅ `security-scan` - Security vulnerability scanning
- ✅ `build-validation` - Project structure and API validation

#### Pull Request Requirements
- ✅ **Pull requests required** - No direct commits to main
- ✅ **1 approving review required** - Code review mandatory
- ✅ **Dismiss stale reviews** - New commits require fresh approval
- ✅ **Resolve conversations** - All PR comments must be addressed

#### Additional Protections
- 🚫 **Force pushes blocked** - Prevents history rewriting
- 🚫 **Branch deletion blocked** - Protects main branch
- 🔔 **Vulnerability alerts enabled** - Automatic dependency scanning
- 🤖 **Automated security fixes** - Dependabot security updates

## 🚀 Development Workflow

### Creating a Pull Request

```bash
# 1. Create feature branch
git checkout -b feature/my-new-feature

# 2. Make changes and commit
git add .
git commit -m "Add new feature"

# 3. Push branch
git push origin feature/my-new-feature

# 4. Create pull request
gh pr create --title "Add new feature" --body "Description of changes"
```

### Before Merging

Ensure all required checks pass:
- ✅ All CI tests pass (Python 3.11 & 3.12)
- ✅ Security scan completes
- ✅ Build validation passes
- ✅ At least 1 approving review
- ✅ All conversations resolved

## 📊 Status Checks Details

### Test Requirements
- **Flake8 linting**: Code style and syntax validation
- **MyPy type checking**: Static type analysis (warnings allowed)
- **Integration tests**: Full API and database testing
- **Health check**: Server startup validation

### Security Requirements
- **Safety scan**: No known vulnerabilities in dependencies
- **Bandit scan**: No security issues in Python code

### Build Requirements
- **File structure**: All required backend files present
- **CLAUDE.md compliance**: app.py under 500 lines
- **API accessibility**: All endpoints responding correctly

## 🛠️ Troubleshooting

### Common Issues

#### Failed Test Jobs
- Check flake8 output for code style issues
- Review integration test failures
- Ensure database initialization succeeded

#### Security Scan Failures
- Update vulnerable dependencies in requirements.txt
- Address bandit security warnings in code

#### Build Validation Failures
- Verify all required files are present
- Check app.py line count (must be ≤500 lines)
- Test API endpoints manually

### Local Testing

Run the same checks locally before pushing:

```bash
# Linting
flake8 backend/ --count --select=E9,F63,F7,F82 --show-source --statistics

# Type checking
mypy backend/ --ignore-missing-imports --no-strict-optional

# Integration tests
python test_integration.py

# Security scan
safety check -r requirements.txt
bandit -r backend/
```

## 📈 Monitoring & Maintenance

### GitHub Actions Dashboard
- Monitor workflow runs at: `https://github.com/YOUR_USERNAME/ai-programs-registry/actions`
- Review failed jobs and fix issues promptly
- Check security scan artifacts for vulnerabilities

### Branch Protection Review
- Periodically review protection rules effectiveness
- Adjust required status checks as project evolves
- Consider adding more specific security requirements

### Dependency Management
- Regularly update requirements.txt
- Monitor Dependabot alerts and security advisories
- Test dependency updates in feature branches first