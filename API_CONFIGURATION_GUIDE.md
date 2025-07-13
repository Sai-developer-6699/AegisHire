# API Configuration Guide

This guide explains how to configure API endpoints in your project to avoid hardcoded URLs.

## 🎯 **Problem Solved**

Previously, your project had hardcoded API endpoints like:
```javascript
fetch('http://127.0.0.1:8000/api/login/')
```

Now you can configure endpoints dynamically:
```javascript
fetch(`${apiConfig.getURL('api/login/')}`)
```

## 📁 **Files Created/Modified**

### **New Files:**
- `config.js` - Centralized API configuration
- `backend/context_processors.py` - Django context processor
- `update_api_endpoints.py` - Script to update existing files
- `recruitment/management/commands/update_api_config.py` - Django management command

### **Modified Files:**
- `backend/settings.py` - Added context processor
- `login.js` - Updated to use configurable endpoints
- All HTML files - Updated API calls (8 files updated)

## 🔧 **How to Configure API Endpoints**

### **Method 1: Using Django Management Command**

```bash
# Show current configuration
python manage.py update_api_config --show

# Change port to 8001
python manage.py update_api_config --port 8001

# Change host to localhost
python manage.py update_api_config --host localhost

# Change protocol to https
python manage.py update_api_config --protocol https

# Change multiple settings at once
python manage.py update_api_config --host company-server.com --port 443 --protocol https
```

### **Method 2: Edit .env File Directly**

```env
# API Configuration
API_PROTOCOL=http
API_HOST=127.0.0.1
API_PORT=8000
API_BASE_URL=http://127.0.0.1:8000
```

### **Method 3: Using JavaScript (Runtime)**

```javascript
// Update configuration at runtime
apiConfig.updateConfig({
    host: 'localhost',
    port: '8001',
    protocol: 'http'
});

// Reset to defaults
apiConfig.resetToDefaults();

// Get current configuration
console.log(apiConfig.getConfig());
```

## 📝 **How to Use in Your Code**

### **Before (Hardcoded):**
```javascript
const response = await fetch('http://127.0.0.1:8000/api/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
```

### **After (Configurable):**
```javascript
const response = await fetch(`${apiConfig.getURL('api/login/')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
```

### **Using the Helper Function:**
```javascript
// Simple API call
const data = await apiCall('api/login/', {
    method: 'POST',
    body: JSON.stringify(loginData)
});

// GET request
const users = await apiCall('api/get-users/');

// With custom headers
const response = await apiCall('api/upload/', {
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data'
    },
    body: formData
});
```

## 🌍 **Environment-Specific Configurations**

### **Port Usage Clarification:**
- **Backend (Django API)**: Port 8000 (default) or 8001 (team)
- **Frontend (HTML/CSS/JS)**: Port 5501 (static files)

### **Local Development:**
```env
API_PROTOCOL=http
API_HOST=127.0.0.1
API_PORT=8000
```

### **Team Development:**
```env
API_PROTOCOL=http
API_HOST=localhost
API_PORT=8001
```

### **Production:**
```env
API_PROTOCOL=https
API_HOST=api.yourcompany.com
API_PORT=443
```

### **Company Server:**
```env
API_PROTOCOL=https
API_HOST=company-server.com
API_PORT=8443
```

## 🔄 **Switching Between Environments**

### **Quick Switch Commands:**
```bash
# Switch to local development
python manage.py update_api_config --host 127.0.0.1 --port 8000

# Switch to team development
python manage.py update_api_config --host localhost --port 8001

# Switch to production
python manage.py update_api_config --host api.yourcompany.com --port 443 --protocol https
```

## 📋 **HTML File Setup**

Make sure your HTML files include the config.js script:

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Other scripts -->
    <script src="config.js"></script>
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

## 🛠️ **Adding New API Calls**

### **Template for New API Calls:**
```javascript
// GET request
async function getUsers() {
    try {
        const users = await apiCall('api/get-users/');
        return users;
    } catch (error) {
        console.error('Failed to get users:', error);
        throw error;
    }
}

// POST request
async function createUser(userData) {
    try {
        const newUser = await apiCall('api/create-user/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return newUser;
    } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
    }
}

// PUT request
async function updateUser(userId, userData) {
    try {
        const updatedUser = await apiCall(`api/update-user/${userId}/`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        return updatedUser;
    } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
    }
}

// DELETE request
async function deleteUser(userId) {
    try {
        await apiCall(`api/delete-user/${userId}/`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
}
```

## 🔍 **Debugging**

### **Check Current Configuration:**
```javascript
console.log('Current API config:', apiConfig.getConfig());
console.log('Base URL:', apiConfig.getBaseURL());
console.log('Login URL:', apiConfig.getURL('api/login/'));
```

### **Test API Connection:**
```javascript
async function testConnection() {
    try {
        const response = await apiCall('api/health-check/');
        console.log('API connection successful:', response);
    } catch (error) {
        console.error('API connection failed:', error);
    }
}
```

## 🚀 **Benefits**

1. **No More Hardcoded URLs**: All endpoints are configurable
2. **Environment Flexibility**: Easy switching between dev/staging/prod
3. **Team Collaboration**: Different team members can use different ports
4. **Centralized Management**: All API configuration in one place
5. **Error Handling**: Built-in error handling and logging
6. **Type Safety**: Consistent API call patterns

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Verify config.js is included in your HTML
3. Confirm API configuration in .env file
4. Test API connection manually
5. Check Django server is running on the configured port

## 🔄 **Migration Checklist**

- [ ] Include `config.js` in all HTML files
- [ ] Update all API calls to use `apiConfig.getURL()`
- [ ] Test API calls in different environments
- [ ] Update team documentation
- [ ] Configure CI/CD for different environments 

## 🏗️ **Complete Project Reorganization Plan**

### **Step 1: Create Frontend Directory Structure**

Run these commands in your terminal:

```bash
# Create frontend directory structure
mkdir frontend
mkdir frontend/pages
mkdir frontend/assets
mkdir frontend/assets/css
mkdir frontend/assets/js
mkdir frontend/config

# Move HTML files to frontend/pages
move *.html frontend/pages/

# Move CSS files to frontend/assets/css
move *.css frontend/assets/css/

# Move JS files to frontend/assets/js
move *.js frontend/assets/js/

# Move config.js to frontend/config
move config.js frontend/config/
```

### **Step 2: Update File References**

After moving files, you'll need to update the paths in your HTML files. Here's what needs to be changed:

**In all HTML files, update:**
```html
<!-- Before -->
<link rel="stylesheet" href="styles.css">
<script src="config.js"></script>

<!-- After -->
<link rel="stylesheet" href="../assets/css/styles.css">
<script src="../config/config.js"></script>
```

### **Step 3: Create Frontend Server Configuration**

Create a `frontend/package.json` file:
```json
{
  "name": "recruitment-frontend",
  "version": "1.0.0",
  "description": "Frontend for recruitment system",
  "scripts": {
    "start": "npx serve -p 5501",
    "dev": "npx live-server --port=5501"
  },
  "devDependencies": {
    "serve": "^14.0.0",
    "live-server": "^1.2.2"
  }
}
```

### **Step 4: Final Project Structure**

Your project should look like this:
```
Tool/
├── frontend/
│   ├── pages/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── hr_resumeupload.html
│   │   └── ... (all other HTML files)
│   ├── assets/
│   │   ├── css/
│   │   │   ├── styles.css
│   │   │   └── dashboard.css
│   │   └── js/
│   │       ├── login.js
│   │       └── script.js
│   ├── config/
│   │   └── config.js
│   └── package.json
├── backend/
│   ├── settings.py
│   ├── urls.py
│   └── ... (Django files)
├── recruitment/
│   └── ... (Django app)
├── manage.py
├── requirements.txt
└── .env
```

### **Step 5: Update API Configuration**

Update your `.env` file to reflect the new structure:
```env
# Frontend Configuration
FRONTEND_PORT=5501
FRONTEND_HOST=localhost

# Backend Configuration
BACKEND_PORT=8000
BACKEND_HOST=localhost
API_BASE_URL=http://localhost:8000
```

### **Step 6: Create Frontend Server Script**

Create `frontend/start_server.py`:
```python
#!/usr/bin/env python3
"""
Frontend server for the recruitment system.
"""

import http.server
import socketserver
import os
import sys

def start_frontend_server(port=5501):
    """Start the frontend server."""
    
    # Change to frontend directory
    frontend_dir = os.path.join(os.path.dirname(__file__), 'pages')
    os.chdir(frontend_dir)
    
    # Create server
    handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🌐 Frontend server running on http://localhost:{port}")
        print(f" Serving files from: {frontend_dir}")
        print("Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Frontend server stopped.")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5501
    start_frontend_server(port)
```

### **Step 7: Update Client Access Guide**

After reorganization, clients will access:

**Frontend (UI):**
```
http://192.168.0.229:5501
```

**Backend (API):**
```
http://192.168.0.229:8000
```

### **Step 8: Start Both Servers**

**Terminal 1 (Backend):**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
python start_server.py 5501
```

### **Step 9: Update API Configuration for Network Access**

```bash
# Update API config for network access
python manage.py update_api_config --host 0.0.0.0 --port 8000
```

##  **Benefits of This Structure**

1. **Clear Separation**: Frontend and backend are clearly separated
2. **Better Organization**: Files are logically grouped
3. **Easier Deployment**: Can deploy frontend and backend separately
4. **Team Collaboration**: Frontend and backend teams can work independently
5. **Scalability**: Easy to add more frontend frameworks or backend services

## 📋 **Commands to Run**

Here are the exact commands you need to run:

```bash
# 1. Create frontend structure
mkdir frontend
mkdir frontend\pages
mkdir frontend\assets
mkdir frontend\assets\css
mkdir frontend\assets\js
mkdir frontend\config

# 2. Move files
move *.html frontend\pages\
move *.css frontend\assets\css\
move *.js frontend\assets\js\
move config.js frontend\config\

# 3. Start backend server
python manage.py runserver 0.0.0.0:8000

# 4. Start frontend server (in new terminal)
cd frontend
python -m http.server 5501
```

Would you like me to help you with any specific part of this reorganization? 

## 🎯 **Complete Client Access Setup**

### **Step 1: Get Your IP Address**
Run this command in your terminal:
```bash
ipconfig | findstr "IPv4"
```

You should see something like:
```
IPv4 Address. . . . . . . . . . . : 192.168.0.229
```

### **Step 2: Update Your .env File**
Add these lines to your `.env` file:
```env
# Client Access Configuration
API_HOST=192.168.0.229
API_BASE_URL=http://192.168.0.229:8000
FRONTEND_HOST=192.168.0.229
FRONTEND_URL=http://192.168.0.229:5501
```

### **Step 3: Update API Configuration**
```bash
# Update API config for network access
python manage.py update_api_config --host 192.168.0.229 --port 8000
```

### **Step 4: Start Backend Server**
```bash
# From the root directory (Tool/)
python manage.py runserver 0.0.0.0:8000
```

### **Step 5: Start Frontend Server**
```bash
# In a new terminal, from the frontend directory
cd frontend
python -m http.server 5501
```

### **Step 6: Share URLs with Clients**
```
Frontend (UI): http://192.168.0.229:5501
Backend (API): http://192.168.0.229:8000
```

## 📋 **Complete Commands to Run**

Here are the exact commands in order:

```bash
# 1. Get your IP (replace with your actual IP)
# ipconfig | findstr "IPv4"

# 2. Update API configuration (replace 192.168.0.229 with your IP)
python manage.py update_api_config --host 192.168.0.229 --port 8000

# 3. Start backend server (Terminal 1)
python manage.py runserver 0.0.0.0:8000

# 4. Start frontend server (Terminal 2)
cd frontend
python -m http.server 5501
```

## 🌐 **Client Access URLs**

After running the above commands, clients can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://192.168.0.229:5501` | User interface |
| **Backend API** | `http://192.168.0.229:8000` | API endpoints |
| **Admin Panel** | `http://192.168.0.229:8000/admin` | Django admin |

## 🔧 **Troubleshooting**

If clients can't connect:

1. **Check Windows Firewall:**
   - Allow Python through firewall
   - Allow ports 8000 and 5501

2. **Verify servers are running:**
   ```bash
   # Check if ports are in use
   netstat -an | findstr :8000
   netstat -an | findstr :5501
   ```

3. **Test locally first:**
   ```bash
   # Test backend
   curl http://localhost:8000
   
   # Test frontend
   curl http://localhost:5501
   ```

## 📱 **For Different Environments**

### **Development (Your machine):**
- Frontend: `http://localhost:5501`
- Backend: `http://localhost:8000`

### **Network (Same office/home):**
- Frontend: `http://192.168.0.229:5501`
- Backend: `http://192.168.0.229:8000`

### **Internet (ngrok):**
- Frontend: `https://abc123.ngrok.io` (port 5501)
- Backend: `https://def456.ngrok.io` (port 8000)

This setup gives you a proper client-server architecture where the frontend and backend are separate and can be accessed independently by clients! 