import os
import logging
import zipfile
import tempfile
import shutil
import subprocess
from datetime import datetime
import threading
from flask import Flask, request, jsonify, send_from_directory, send_file
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

# Store processing results
processing_results = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_screenshots_ffmpeg(video_path, interval_seconds, output_dir):
    """Extract screenshots from video using FFmpeg"""
    try:
        # Create output pattern
        output_pattern = os.path.join(output_dir, "screenshot_%04d.jpg")
        
        # FFmpeg command to extract frames at specified intervals
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vf', f'fps=1/{interval_seconds}',
            '-y',  # Overwrite existing files
            output_pattern
        ]
        
        # Execute FFmpeg command
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logging.error(f"FFmpeg error: {result.stderr}")
            raise Exception(f"FFmpeg failed with error: {result.stderr}")
        
        # Count generated screenshots
        screenshot_count = len([f for f in os.listdir(output_dir) if f.endswith('.jpg')])
        logging.info(f"Extracted {screenshot_count} screenshots using FFmpeg")
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

def process_video_task(video_path, interval, video_filename, process_id):
    """Background task to process video"""
    temp_dir = None
    try:
        logging.info(f"Starting video processing for: {video_filename}")
        
        # Create temporary directory for screenshots
        temp_dir = tempfile.mkdtemp(prefix='screenshots_')
        
        # Extract screenshots using FFmpeg
        screenshot_count = extract_screenshots_ffmpeg(video_path, interval, temp_dir)
        
        if screenshot_count == 0:
            logging.error("No screenshots were extracted")
            processing_results[process_id] = {'status': 'error', 'message': 'No screenshots extracted'}
            return
        
        # Create zip file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        zip_filename = f"screenshots_{os.path.splitext(video_filename)[0]}_{timestamp}.zip"
        zip_path = os.path.join(SCREENSHOT_FOLDER, zip_filename)
        create_zip(temp_dir, zip_path)
        
        # Store result for download
        processing_results[process_id] = {
            'status': 'completed',
            'zip_file': zip_filename,
            'screenshot_count': screenshot_count,
            'video_name': video_filename,
            'interval': interval
        }
        
        logging.info(f"Video processing completed successfully - {screenshot_count} screenshots")
            
    except Exception as e:
        logging.error(f"Error in video processing task: {str(e)}")
        processing_results[process_id] = {'status': 'error', 'message': str(e)}
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

@app.route('/test_script.js')
def test_script():
    return send_from_directory('.', 'test_script.js')

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
            unique_filename = f"{timestamp}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            
            # Generate unique process ID
            process_id = f"{timestamp}_{filename.split('.')[0]}"
            
            # Start background processing
            thread = threading.Thread(
                target=process_video_task, 
                args=(filepath, interval, file.filename, process_id)
            )
            thread.daemon = True
            thread.start()
            
            return jsonify({
                'success': True, 
                'message': 'Video uploaded successfully! Processing screenshots...',
                'process_id': process_id
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

@app.route('/api/status/<process_id>')
def check_status(process_id):
    if process_id in processing_results:
        return jsonify(processing_results[process_id])
    else:
        return jsonify({'status': 'processing'})

@app.route('/download/<filename>')
def download_file(filename):
    try:
        filepath = os.path.join(SCREENSHOT_FOLDER, filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        logging.error(f"Error downloading file: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({'success': False, 'message': 'File is too large. Maximum file size is 500MB.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)