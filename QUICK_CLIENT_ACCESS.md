# 🚀 Quick Client Access Guide

## 📱 **Your Current Setup**

**Your IP Address:** `192.168.0.229`

**Port Configuration:**
- **Backend (Django API)**: Port 8000
- **Frontend (Static Files)**: Port 5501

## 🔧 **How Clients Can View Your Website**

### **Option 1: Same Network (Office/Home)**
```bash
# Start server for network access
python manage.py runserver 0.0.0.0:8000

# Clients access via:
http://192.168.0.229:8000
```

### **Option 2: Different Ports (For Team)**
```bash
# You use port 8000 (backend)
python manage.py runserver 8000

# Teammate uses port 8001 (backend)
python manage.py runserver 8001

# Frontend server on port 5501
python -m http.server 5501

# Clients access:
http://192.168.0.229:8000  (your backend)
http://192.168.0.229:8001  (teammate's backend)
http://192.168.0.229:5501  (frontend)
```

### **Option 3: Internet Access (ngrok)**
```bash
# Install ngrok
npm install -g ngrok

# Start Django server
python manage.py runserver 8000

# Create tunnel (in new terminal)
ngrok http 8000

# Share ngrok URL with clients
# Example: https://abc123.ngrok.io
```

## 🎯 **Quick Start Commands**

### **For Immediate Client Access:**
```bash
# 1. Update API config for network access
python manage.py update_api_config --host 0.0.0.0 --port 8000

# 2. Start server
python manage.py runserver 0.0.0.0:8000

# 3. Share this URL with clients:
http://192.168.0.229:8000
```

### **Using the Helper Script:**
```bash
python start_server.py
```

## 📋 **Client Access URLs**

| Environment | URL | Who Can Access |
|-------------|-----|----------------|
| **Local** | `http://127.0.0.1:8000` | Only you |
| **Network** | `http://192.168.0.229:8000` | Same network |
| **Team Dev** | `http://192.168.0.229:8001` | Same network |
| **Internet** | `https://abc123.ngrok.io` | Anyone |

## 🔒 **Security Notes**

- ✅ **Development**: Allow all hosts (current setup)
- ⚠️ **Production**: Restrict ALLOWED_HOSTS
- 🔒 **HTTPS**: Use for internet access
- 🛡️ **Firewall**: May need to allow port 8000

## 🚨 **Troubleshooting**

### **If clients can't connect:**
1. Check if server is running
2. Verify IP address is correct
3. Check Windows firewall
4. Try different port
5. Use ngrok for internet access

### **If API calls fail:**
1. Update API configuration
2. Check CORS settings
3. Verify endpoints are correct

## 📞 **Quick Help**

**Your current configuration:**
- IP: `192.168.0.229`
- Default port: `8000`
- API base: `http://192.168.0.229:8000`

**To share with clients:**
```
Website: http://192.168.0.229:8000
API: http://192.168.0.229:8000/api/
``` 