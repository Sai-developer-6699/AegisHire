# 🚀 Smart Recruitment System

A comprehensive, role-based Recruitment Management System designed to streamline the hiring process from job creation to candidate finalization. This application features AI-powered resume evaluation, interview scheduling, and performance tracking for HRs, Managers, and Candidates.

> **Note:** This project includes a "SafeNet Cybersecurity Portal" theme in the frontend as a demonstration context.

## ✨ Key Features

- **👥 Role-Based Access Control**:
  - **Admin**: System management and user oversight.
  - **HR**: Resume filtering, shortlisting, interview scheduling, and candidate finalization.
  - **Manager**: Job creation, candidate performance review, and approval workflows.
  - **Candidate**: Job application, exam taking, and status tracking.

- **🤖 AI & Automation**:
  - AI-powered resume scoring and matching against job descriptions.
  - Automated exam scoring and performance analysis.

- **📅 Recruitment Pipeline**:
  - **Job Management**: Create and list job requirements.
  - **Resume Processing**: Upload, parse, and filter resumes.
  - **Interview Management**: Schedule and track interviews.
  - **Assessment**: Online exam module for candidates.

- **📊 Dashboards**: Dedicated dashboards for each user role to track progress and pending actions.

## 🛠️ Tech Stack

- **Backend**: Python 3, Django 5.2, Django REST Framework (DRF)
- **Database**: MySQL (supports multi-database configuration)
- **Frontend**: HTML5, Tailwind CSS, JavaScript (Vanilla/Simple)
- **Utilities**: `python-dotenv` for configuration, `asgiref` for async support.

## 🚀 Quick Start Guide

### Prerequisites

- Python 3.8+
- MySQL Server installed and running

### Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Set Up Virtual Environment (Recommended)**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment**
    Copy the example environment file and configure your database settings:
    ```bash
    cp .env.example .env
    ```
    *Update the `DB_TYPE`, `LOCAL_*`, and `COMPANY_*` variables in `.env` as needed.*

5.  **Initialize Database**
    ```bash
    python manage.py migrate
    python manage.py createsuperuser
    ```

### ▶️ Running the Application

You can easily start the server using the helper script:

```bash
python start_server.py
```

Follow the interactive prompts to choose your access type (Local, Network, or Custom Host).

Alternatively, run with Django directly:
```bash
python manage.py runserver
```

## 🗄️ Database Configuration

This project supports switching between **Local** and **Company** databases.

- **Switch to Local DB**: `python manage.py switch_db local`
- **Switch to Company DB**: `python manage.py switch_db company`

For detailed instructions, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

## 📂 Project Structure

```
.
├── backend/                # Django project settings and configuration
├── frontend/               # Static frontend files (HTML, CSS, JS)
│   ├── assets/             # CSS, JS, Images
│   ├── pages/              # HTML pages for different roles
│   └── index.html          # Landing page
├── recruitment/            # Main Django app
│   ├── migrations/         # Database migrations
│   ├── models.py           # Database models
│   ├── urls.py             # API routes
│   └── views.py            # Business logic
├── manage.py               # Django management script
├── start_server.py         # Helper script to start the server
└── requirements.txt        # Python dependencies
```

## 📚 Documentation

- [**Database Setup Guide**](DATABASE_SETUP.md): Detailed instructions for configuring local and company databases.
- [**Quick Client Access**](QUICK_CLIENT_ACCESS.md): Guide for accessing the server from other devices on the network.
- [**API Configuration**](API_CONFIGURATION_GUIDE.md): details on API endpoints and usage.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
*Built with Django & Tailwind CSS.*
