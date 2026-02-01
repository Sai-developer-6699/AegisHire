# Login Routing System Documentation

## Overview
The login system uses role-based routing to direct users to appropriate dashboards based on their role ID returned from the backend.

## Role ID Mapping

| Role ID | Role Name | Dashboard | Description |
|---------|-----------|-----------|-------------|
| 1 | Admin | `dashboard.html` | System administrator with full access |
| 2 | Manager | `manager_dashboard.html` | Job creation and candidate management |
| 3 | HR | `hr_resumeupload.html` | Resume processing and candidate evaluation |
| 4 | Candidate | `candidate_dashboard.html` | Exam and assessment interface |

## Current Routing Logic

### File: `frontend/assets/js/login.js`

```javascript
// role-based redirect
switch (data.roleid) {
  case 1: 
    console.log('Redirecting Admin to dashboard');
    return window.location.href = 'pages/dashboard.html';
  case 2: 
    console.log('Redirecting Manager to manager dashboard');
    return window.location.href = 'pages/manager_dashboard.html';
  case 3: 
    console.log('Redirecting HR to resume upload');
    return window.location.href = 'pages/hr_resumeupload.html';
  case 4: 
    console.log('Redirecting Candidate to candidate dashboard');
    return window.location.href = 'pages/candidate_dashboard.html';
  default:
    console.error('Unknown role ID:', data.roleid);
    responseMessage.textContent = `Unknown role (ID: ${data.roleid}). Please contact support.`;
}
```

## Backend Role Validation

### Role ID Retrieval
The backend uses the `get_role_id()` function to map role names to IDs:

```python
def get_role_id(role_name, default_role_id=4):
    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT role_id 
            FROM rolemaster 
            WHERE LOWER(role) = LOWER(%s)
        """, [role_name])
        
        result = cursor.fetchone()
        if result:
            return result[0]
        else:
            return default_role_id
    except Exception as e:
        logger.error(f"Error fetching role ID for '{role_name}': {str(e)}")
        return default_role_id
```

### Role Names in Database
Based on the addinfo.html form, the role names are:
- `admin` → Role ID 1
- `Manager` → Role ID 2  
- `HR` → Role ID 3
- `Candidate` → Role ID 4

## Security Features

### 1. Session Validation
- All API calls include `credentials: 'include'` for session cookies
- Session data stored in Django session with `userid` and `roleid`

### 2. Role-Based Authorization
- Backend validates role permissions for each endpoint
- Frontend can validate roles using `validateUserRole(roleId)`

### 3. Error Handling
- Invalid role IDs show descriptive error messages
- Network errors are caught and displayed to user
- Console logging for debugging

## API Utilities for Role Management

### Session Check
```javascript
// Check if user has valid session
const hasSession = await checkSession();
if (!hasSession) {
    window.location.href = '/login.html';
}
```

### Role Validation
```javascript
// Check if user has specific role
const isManager = await validateUserRole(2);
if (!isManager) {
    showApiError('Access denied. Manager role required.');
    return;
}
```

### Get Current Role
```javascript
// Get current user's role ID
const currentRole = await getCurrentUserRole();
console.log('Current role:', currentRole);
```

## Dashboard Access Control

### Admin Dashboard (`dashboard.html`)
- **Access**: Role ID 1 (Admin)
- **Features**: User management, system administration
- **Validation**: `validateUserRole(1)`

### Manager Dashboard (`manager_dashboard.html`)
- **Access**: Role ID 2 (Manager)
- **Features**: Job creation, candidate shortlisting, performance tracking
- **Validation**: `validateUserRole(2)`

### HR Dashboard (`hr_resumeupload.html`)
- **Access**: Role ID 3 (HR)
- **Features**: Resume upload, candidate evaluation, interview scheduling
- **Validation**: `validateUserRole(3)`

### Candidate Dashboard (`candidate_dashboard.html`)
- **Access**: Role ID 4 (Candidate)
- **Features**: Exam interface, assessment completion
- **Validation**: `validateUserRole(4)`

## Error Scenarios

### 1. Invalid Role ID
```javascript
// Backend returns roleid: 5 (doesn't exist)
responseMessage.textContent = 'Unknown role (ID: 5). Please contact support.';
```

### 2. Missing Role ID
```javascript
// Backend returns no roleid
responseMessage.textContent = 'Invalid user role. Please contact support.';
```

### 3. Network Error
```javascript
// API call fails
responseMessage.textContent = 'Login failed: Network error';
```

### 4. Session Expired
```javascript
// Session validation fails
window.location.href = '/login.html';
```

## Testing Checklist

### ✅ **Login Flow**
- [ ] Admin login redirects to dashboard.html
- [ ] Manager login redirects to manager_dashboard.html
- [ ] HR login redirects to hr_resumeupload.html
- [ ] Candidate login redirects to candidate_dashboard.html
- [ ] Invalid credentials show error message
- [ ] Network errors are handled gracefully

### ✅ **Session Management**
- [ ] Session persists across page refreshes
- [ ] Logout clears session properly
- [ ] Expired sessions redirect to login
- [ ] Role validation works on protected pages

### ✅ **Error Handling**
- [ ] Unknown role IDs show descriptive errors
- [ ] Missing role IDs are handled
- [ ] Network errors don't crash the app
- [ ] Console logging helps with debugging

## Future Improvements

### 1. **Enhanced Role Validation**
```javascript
// Add role-specific permissions
const rolePermissions = {
    1: ['admin', 'user_management', 'system_config'],
    2: ['job_creation', 'candidate_management', 'performance_tracking'],
    3: ['resume_processing', 'candidate_evaluation', 'interview_scheduling'],
    4: ['exam_access', 'assessment_completion']
};
```

### 2. **Route Guards**
```javascript
// Protect pages based on role
async function protectPage(requiredRole) {
    const hasAccess = await validateUserRole(requiredRole);
    if (!hasAccess) {
        window.location.href = '/unauthorized.html';
    }
}
```

### 3. **Session Timeout**
```javascript
// Auto-logout after inactivity
setTimeout(async () => {
    const hasSession = await checkSession();
    if (!hasSession) {
        window.location.href = '/login.html';
    }
}, 30 * 60 * 1000); // 30 minutes
```

## Troubleshooting

### Common Issues

1. **Wrong Dashboard Access**
   - Check role ID mapping in database
   - Verify role names match exactly
   - Check session data in browser dev tools

2. **Login Loop**
   - Clear browser cookies and session storage
   - Check backend session configuration
   - Verify CORS settings

3. **Role Not Recognized**
   - Check rolemaster table in database
   - Verify role names are case-sensitive
   - Check backend role validation logic

### Debug Commands

```javascript
// Check current session
console.log(await checkSession());

// Get current role
console.log(await getCurrentUserRole());

// Validate specific role
console.log(await validateUserRole(2));
```

---

**Status**: ✅ **Routing system is properly implemented with role-based access control**
**Recommendation**: Use the new API utilities for consistent role validation across all pages 