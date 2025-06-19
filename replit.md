# Video Screenshot Extractor

## Overview

This is a Flask-based web application that allows users to upload video files and extract screenshots at specified intervals. The application features a simple, flat file structure with HTML, CSS, and JavaScript at the root level, and uses FFmpeg for video processing with automatic email delivery to mustafasadikot72@gmail.com.

## System Architecture

The application follows a simplified flat architecture with no folder hierarchy:

- **Frontend**: Pure HTML/CSS/JavaScript files at root level with Bootstrap styling
- **Backend**: Flask server using FFmpeg for video processing
- **Email System**: SMTP integration for automatic delivery of screenshot zip files
- **File System**: Local file storage for uploads with automatic cleanup

## Key Components

### Backend Components

1. **Flask Application (`ffmpeg_server.py`)**
   - Main application logic with FFmpeg video processing
   - File upload handling with secure filename processing
   - Email system configured with Gmail SMTP
   - Background video processing with threading
   - Automatic file cleanup

2. **Application Entry Point (`main.py`)**
   - Simple Flask application runner importing ffmpeg_server

### Frontend Components

1. **HTML File (`index.html`)**
   - Bootstrap-based responsive UI at root level
   - Video file upload form with drag & drop
   - Progress indicators and alert system
   - Email delivery information display

2. **CSS Styling (`style.css`)**
   - Dark theme with gradient backgrounds
   - Modern styling with Bootstrap integration
   - Form and button enhancements

3. **JavaScript (`script.js`)**
   - Client-side form validation
   - File size and type checking
   - AJAX form submission to backend API
   - Drag & drop functionality

### Core Features

1. **Video Upload**
   - Supports multiple video formats (MP4, AVI, MOV, MKV, FLV, WMV)
   - 500MB file size limit
   - Secure filename handling with timestamps

2. **Screenshot Extraction**
   - FFmpeg-based video processing
   - Configurable time intervals
   - Batch screenshot generation in temporary directories

3. **Email Delivery**
   - Automatic email to mustafasadikot72@gmail.com
   - ZIP attachment with all screenshots
   - Configured SMTP with insanetrickster074@gmail.com sender

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