import os
import logging
import zipfile
import tempfile
import shutil
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
import threading
import cv2
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key_for_dev")

# Configuration
UPLOAD_FOLDER = 'uploads'
SCREENSHOT_FOLDER = 'screenshots'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'}
MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SCREENSHOT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_screenshots(video_path, interval_seconds, output_dir):
    """Extract screenshots from video at specified intervals"""
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception("Could not open video file")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            raise Exception("Could not determine video frame rate")
        
        frame_interval = int(fps * interval_seconds)
        frame_count = 0
        screenshot_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                screenshot_path = os.path.join(output_dir, f"screenshot_{screenshot_count:04d}.jpg")
                cv2.imwrite(screenshot_path, frame)
                screenshot_count += 1
            
            frame_count += 1
        
        cap.release()
        logging.info(f"Extracted {screenshot_count} screenshots")
        return screenshot_count
    
    except Exception as e:
        logging.error(f"Error extracting screenshots: {str(e)}")
        raise

def create_zip(source_dir, zip_path):
    """Create a zip file from directory contents"""
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)
        logging.info(f"Created zip file: {zip_path}")
    except Exception as e:
        logging.error(f"Error creating zip: {str(e)}")
        raise

def send_email(zip_path, recipient_email, video_filename, interval):
    """Send email with zip attachment"""
    try:
        # Email configuration - using Gmail SMTP
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = os.environ.get("SENDER_EMAIL", "")
        sender_password = os.environ.get("SENDER_PASSWORD", "")
        
        if not sender_email or not sender_password:
            logging.warning("Email credentials not found in environment variables")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = f"Video Screenshots - {video_filename}"
        
        body = f"""
Hello,

Your video screenshot extraction has been completed successfully!

Video: {video_filename}
Screenshot Interval: {interval} seconds
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Please find the screenshots attached as a zip file.

Best regards,
Video Screenshot Tool
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach zip file
        with open(zip_path, "rb") as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
        
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename= {os.path.basename(zip_path)}'
        )
        msg.attach(part)
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, recipient_email, text)
        server.quit()
        
        logging.info(f"Email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        logging.error(f"Error sending email: {str(e)}")
        return False

def process_video_task(video_path, interval, video_filename):
    """Background task to process video and send email"""
    temp_dir = None
    try:
        # Create temporary directory for screenshots
        temp_dir = tempfile.mkdtemp(prefix='screenshots_')
        
        # Extract screenshots
        screenshot_count = extract_screenshots(video_path, interval, temp_dir)
        
        if screenshot_count == 0:
            logging.error("No screenshots were extracted")
            return
        
        # Create zip file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        zip_filename = f"screenshots_{os.path.splitext(video_filename)[0]}_{timestamp}.zip"
        zip_path = os.path.join(SCREENSHOT_FOLDER, zip_filename)
        create_zip(temp_dir, zip_path)
        
        # Send email
        recipient_email = "mustafasadikot72@gmail.com"
        success = send_email(zip_path, recipient_email, video_filename, interval)
        
        if success:
            logging.info("Video processing completed successfully")
        else:
            logging.error("Video processing completed but email failed")
        
        # Clean up zip file after sending
        if os.path.exists(zip_path):
            os.remove(zip_path)
            
    except Exception as e:
        logging.error(f"Error in video processing task: {str(e)}")
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        # Clean up uploaded video file
        if os.path.exists(video_path):
            os.remove(video_path)

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def style():
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'video' not in request.files:
            return jsonify({'success': False, 'message': 'No video file selected'})
        
        file = request.files['video']
        interval = request.form.get('interval', type=float)
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No video file selected'})
        
        if not interval or interval <= 0:
            return jsonify({'success': False, 'message': 'Please enter a valid interval (greater than 0)'})
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Start background processing
            thread = threading.Thread(
                target=process_video_task, 
                args=(filepath, interval, file.filename)
            )
            thread.daemon = True
            thread.start()
            
            return jsonify({
                'success': True, 
                'message': 'Video uploaded successfully! Screenshots are being processed and will be emailed to you shortly.'
            })
        else:
            return jsonify({
                'success': False, 
                'message': 'Invalid file type. Please upload MP4, AVI, MOV, MKV, FLV, or WMV files only.'
            })
            
    except Exception as e:
        logging.error(f"Error in upload: {str(e)}")
        return jsonify({
            'success': False, 
            'message': 'An error occurred while processing your request. Please try again.'
        })

@app.errorhandler(413)
def too_large(e):
    return jsonify({'success': False, 'message': 'File is too large. Maximum file size is 500MB.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)