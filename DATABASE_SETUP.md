# Multi-Database Setup Guide

This project supports both local and company database configurations, allowing different team members to work with different databases.

## 🗄️ Database Configuration

### Current Setup
- **Local Database**: For development and testing
- **Company Database**: For production and team collaboration

## 📋 Setup Instructions

### 1. Environment Configuration

The project uses a `.env` file to configure database connections. Copy the `.env.example` file and configure it:

```bash
# Copy the example file
cp .env.example .env
```

### 2. Database Types

#### For Local Development (You)
```env
DB_TYPE=local
LOCAL_DB_NAME=recruitment
LOCAL_DB_USER=root
LOCAL_DB_PASSWORD=Mysql@2004
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=3306
```

#### For Company Database (Your Teammates)
```env
DB_TYPE=company
COMPANY_DB_NAME=company_recruitment
COMPANY_DB_USER=company_user
COMPANY_DB_PASSWORD=company_password
COMPANY_DB_HOST=company-server.com
COMPANY_DB_PORT=3306
```

## 🔄 Switching Between Databases

### Using Management Command
```bash
# Switch to local database
python manage.py switch_db local

# Switch to company database
python manage.py switch_db company
```

### Manual Switch
Edit the `.env` file and change `DB_TYPE=local` to `DB_TYPE=company` or vice versa.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Your Database
- **For Local**: Update `LOCAL_*` variables in `.env`
- **For Company**: Update `COMPANY_*` variables in `.env`

### 3. Run Migrations
```bash
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

### 5. Start Development Server
```bash
python manage.py runserver
```

## 🔧 Database Utilities

### Test Database Connection
```python
from backend.db_utils import test_database_connection

success, message = test_database_connection()
print(message)
```

### Get Current Database Info
```python
from backend.db_utils import get_current_db_info

db_info = get_current_db_info()
print(f"Connected to {db_info['type']} database: {db_info['name']}")
```

## 📁 Project Structure

```
Tool/
├── .env                          # Environment variables
├── backend/
│   ├── settings.py              # Database configuration
│   ├── routers.py               # Database routing
│   └── db_utils.py              # Database utilities
├── recruitment/
│   └── management/
│       └── commands/
│           └── switch_db.py     # Database switching command
└── DATABASE_SETUP.md            # This file
```

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong passwords for production databases
- Regularly rotate database credentials
- Use SSL connections for remote databases

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if database server is running
   - Verify host and port settings
   - Ensure firewall allows connections

2. **Authentication Failed**
   - Verify username and password
   - Check user permissions
   - Ensure database exists

3. **Migration Errors**
   - Run `python manage.py makemigrations` first
   - Check for conflicting migrations
   - Verify database schema

### Getting Help

If you encounter issues:
1. Check the Django logs
2. Test database connection manually
3. Verify environment variables
4. Contact the team lead

## 📞 Support

For database-related issues, contact your team lead or database administrator. 