# Client Access Guide

This guide explains how clients (end users) can view and access your recruitment website.

## 🌐 **Current Access Methods**

### **Architecture Overview:**
- **Backend (Django API)**: Handles data, authentication, business logic
- **Frontend (Static Files)**: HTML, CSS, JavaScript for user interface
- **Port Separation**: Backend on 8000, Frontend on 5501

### **1. Local Development (Current Setup)**

#### **For You (Developer):**
```bash
# Start Django server
python manage.py runserver

# Access via:
http://127.0.0.1:8000
http://localhost:8000
```

#### **For Your Teammates:**
```bash
# Start Django server on different port
python manage.py runserver 8001

# Access via:
http://127.0.0.1:8001
http://localhost:8001
```

### **2. Network Access (Same Network)**

#### **Allow External Access:**
```bash
# Start server to allow network access
python manage.py runserver 0.0.0.0:8000

# Clients on same network can access:
http://YOUR_IP_ADDRESS:8000
```

#### **Find Your IP Address:**
```bash
# Windows
ipconfig

# Look for IPv4 Address (usually 192.168.x.x)
```

### **3. Internet Access (Public)**

#### **Option A: Local Tunnel (Quick Setup)**
```bash
# Install ngrok
npm install -g ngrok

# Start Django server
python manage.py runserver 8000

# In another terminal, create tunnel
ngrok http 8000

# Share the ngrok URL with clients
# Example: https://abc123.ngrok.io
```

#### **Option B: Cloud Deployment**
- **Heroku**: Easy deployment
- **AWS**: Scalable solution
- **DigitalOcean**: Cost-effective
- **Vercel**: Frontend hosting

## 🔧 **Setup for Client Access**

### **Step 1: Update Django Settings**

Update your `backend/settings.py` to allow external access:

```python
# Update ALLOWED_HOSTS
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'your-ip-address',  # Your local IP
    '*',  # Allow all hosts (temporary for testing)
]

# Update CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5501",
    "http://127.0.0.1:5501",
    "http://your-ip-address:5501",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "http://your-ip-address:8001",
    "https://your-ngrok-url.ngrok.io",
]
```

### **Step 2: Configure API Endpoints**

Update API configuration for client access:

```bash
# For local network access
python manage.py update_api_config --host 0.0.0.0 --port 8000

# For ngrok access
python manage.py update_api_config --host your-ngrok-url.ngrok.io --port 443 --protocol https
```

## 📱 **Client Access Scenarios**

### **Scenario 1: Same Office Network**

1. **Start Django server:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Find your IP:**
   ```bash
   ipconfig
   # Look for: IPv4 Address. . . . . . . . . . . : 192.168.1.100
   ```

3. **Share with clients:**
   ```
   http://192.168.1.100:8000
   ```

### **Scenario 2: Remote Clients (Internet)**

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start Django server:**
   ```bash
   python manage.py runserver 8000
   ```

3. **Create tunnel:**
   ```bash
   ngrok http 8000
   ```

4. **Share ngrok URL:**
   ```
   https://abc123.ngrok.io
   ```

### **Scenario 3: Production Deployment**

1. **Deploy to cloud platform**
2. **Configure domain**
3. **Set up SSL certificate**
4. **Share production URL**

## 🚀 **Quick Start Commands**

### **For Local Network Access:**
```bash
# 1. Update settings
python manage.py update_api_config --host 0.0.0.0 --port 8000

# 2. Start server
python manage.py runserver 0.0.0.0:8000

# 3. Share your IP address with clients
```

### **For Internet Access (ngrok):**
```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Start Django server
python manage.py runserver 8000

# 3. Create tunnel (in new terminal)
ngrok http 8000

# 4. Update API config with ngrok URL
python manage.py update_api_config --host abc123.ngrok.io --port 443 --protocol https

# 5. Share ngrok URL with clients
```

## 🔒 **Security Considerations**

### **For Development:**
- Use `DEBUG = True` for debugging
- Allow all hosts temporarily
- Use HTTP for local development

### **For Production:**
- Set `DEBUG = False`
- Restrict `ALLOWED_HOSTS`
- Use HTTPS
- Configure proper CORS
- Set up authentication

## 📋 **Client Access Checklist**

- [ ] Django server running
- [ ] ALLOWED_HOSTS configured
- [ ] CORS settings updated
- [ ] API endpoints configured
- [ ] Network firewall allows connections
- [ ] Clients have correct URL
- [ ] Database accessible
- [ ] Static files served correctly

## 🌍 **Different Environments**

### **Development:**
```
URL: http://127.0.0.1:8000
API: http://127.0.0.1:8000/api/
```

### **Team Development:**
```
URL: http://localhost:5501
API: http://localhost:8001/api/
```

### **Local Network:**
```
URL: http://192.168.1.100:8000
API: http://192.168.1.100:8000/api/
```

### **Internet (ngrok):**
```
URL: https://abc123.ngrok.io
API: https://abc123.ngrok.io/api/
```

### **Production:**
```
URL: https://yourcompany.com
API: https://yourcompany.com/api/
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Connection Refused:**
   - Check if Django server is running
   - Verify port is correct
   - Check firewall settings

2. **CORS Errors:**
   - Update CORS_ALLOWED_ORIGINS
   - Check API configuration
   - Verify frontend URL

3. **API Calls Fail:**
   - Check API configuration
   - Verify endpoints are correct
   - Check network connectivity

4. **Static Files Not Loading:**
   - Configure STATIC_ROOT
   - Run `python manage.py collectstatic`
   - Check static file settings

## 📞 **Support**

For client access issues:
1. Check Django server logs
2. Verify network connectivity
3. Test API endpoints manually
4. Check browser console for errors
5. Verify configuration settings 