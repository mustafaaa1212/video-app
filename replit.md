# Video Screenshot Extractor

## Overview

This is a Flask-based web application that allows users to upload video files and extract screenshots at specified intervals. The application provides a simple, user-friendly interface for video processing and screenshot generation using OpenCV.

## System Architecture

The application follows a traditional Flask web application architecture with the following layers:

- **Presentation Layer**: HTML templates with Bootstrap styling and JavaScript for client-side interactions
- **Application Layer**: Flask web framework handling HTTP requests and business logic
- **Processing Layer**: OpenCV for video processing and screenshot extraction
- **File System**: Local file storage for uploads and generated screenshots

## Key Components

### Backend Components

1. **Flask Application (`app.py`)**
   - Main application logic
   - File upload handling
   - Video processing orchestration
   - Email notification system (partially implemented)
   - Error handling and logging

2. **Application Entry Point (`main.py`)**
   - Simple Flask application runner
   - Development server configuration

### Frontend Components

1. **HTML Template (`templates/index.html`)**
   - Bootstrap-based responsive UI
   - File upload form
   - Progress indicators
   - Flash message display

2. **CSS Styling (`static/style.css`)**
   - Custom Bootstrap theme with dark mode
   - Gradient backgrounds and modern styling
   - Form and button enhancements

3. **JavaScript (`static/script.js`)**
   - Client-side form validation
   - File size checking
   - Progress indication
   - User interface interactions

### Core Features

1. **Video Upload**
   - Supports multiple video formats (MP4, AVI, MOV, MKV, FLV, WMV)
   - 500MB file size limit
   - Secure filename handling

2. **Screenshot Extraction**
   - Configurable time intervals
   - OpenCV-based video processing
   - Batch screenshot generation

3. **File Management**
   - Organized upload and screenshot directories
   - Temporary file cleanup
   - ZIP archive creation for output

## Data Flow

1. User uploads video file through web interface
2. Flask validates file format and size
3. File is saved to uploads directory with secure filename
4. OpenCV processes video and extracts frames at specified intervals
5. Screenshots are saved to screenshots directory
6. Results are packaged and made available for download
7. Temporary files are cleaned up

## External Dependencies

### Python Packages
- **Flask**: Web framework for HTTP handling and templating
- **OpenCV (cv2)**: Computer vision library for video processing
- **Werkzeug**: WSGI utilities and secure filename handling
- **Gunicorn**: Production WSGI server
- **email-validator**: Email validation utilities
- **psycopg2-binary**: PostgreSQL adapter (available but not currently used)

### Frontend Libraries
- **Bootstrap**: UI framework for responsive design
- **Font Awesome**: Icon library for enhanced UI

### System Dependencies
- **libGL/libGLU**: OpenGL libraries for OpenCV
- **OpenSSL**: Cryptographic library
- **PostgreSQL**: Database system (available but not configured)

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Runtime Environment**: Python 3.11 with Nix package management
2. **Production Server**: Gunicorn WSGI server
3. **Deployment Target**: Autoscale deployment for handling variable load
4. **Port Configuration**: Application runs on port 5000
5. **Process Management**: Gunicorn with reload capability for development

### Deployment Configuration
- Uses Gunicorn with bind to 0.0.0.0:5000
- Autoscale deployment target for production
- Reuse-port option for better performance
- Reload capability for development iterations

## Changelog
- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.