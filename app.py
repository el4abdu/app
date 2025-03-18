from flask import Flask, render_template, request, send_file, jsonify
import os
import logging
import subprocess
from werkzeug.utils import secure_filename
from pydub import AudioSegment
import uuid
import time
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Check for FFmpeg at startup
def check_ffmpeg():
    try:
        subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        logger.info("FFmpeg is installed and working")
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        logger.warning("FFmpeg is not installed or not in PATH")
        return False

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['DOWNLOAD_FOLDER'] = 'static/downloads'
app.config['ALLOWED_EXTENSIONS'] = {'wav', 'mp3'}
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload size

# Create directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['DOWNLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def cleanup_old_files():
    """Remove files older than 1 hour to prevent storage issues"""
    current_time = time.time()
    one_hour_ago = current_time - 3600
    
    # Clean uploads folder
    for filename in os.listdir(app.config['UPLOAD_FOLDER']):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.getmtime(filepath) < one_hour_ago:
            try:
                os.remove(filepath)
                logger.info(f"Removed old upload file: {filename}")
            except Exception as e:
                logger.error(f"Error removing upload file {filename}: {str(e)}")
    
    # Clean downloads folder
    for filename in os.listdir(app.config['DOWNLOAD_FOLDER']):
        filepath = os.path.join(app.config['DOWNLOAD_FOLDER'], filename)
        if os.path.getmtime(filepath) < one_hour_ago:
            try:
                os.remove(filepath)
                logger.info(f"Removed old download file: {filename}")
            except Exception as e:
                logger.error(f"Error removing download file {filename}: {str(e)}")

@app.route('/')
def index():
    """Render the main page"""
    # Clean up old files on each page visit
    cleanup_old_files()
    return render_template('index.html')

@app.route('/ffmpeg-status')
def ffmpeg_status():
    """Check if FFmpeg is available"""
    status = check_ffmpeg()
    return jsonify({"ffmpeg_available": status})

@app.route('/convert', methods=['POST'])
def convert_audio():
    """Handle the file upload and conversion"""
    if not check_ffmpeg():
        return jsonify({"error": "FFmpeg is not installed or not in PATH. Please contact the administrator."}), 500
    
    if 'file' not in request.files:
        logger.warning("No file part in the request")
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    conversion_type = request.form.get('conversion_type', 'wav2mp3')
    
    if file.filename == '':
        logger.warning("No file selected")
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            unique_id = str(uuid.uuid4())
            original_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_id}_{filename}")
            file.save(original_path)
            
            logger.info(f"File uploaded: {filename} (ID: {unique_id})")
            
            # Get the file extension
            file_ext = filename.rsplit('.', 1)[1].lower()
            
            if conversion_type == 'wav2mp3' and file_ext == 'wav':
                # Convert WAV to MP3
                sound = AudioSegment.from_wav(original_path)
                converted_filename = f"{os.path.splitext(filename)[0]}.mp3"
                converted_path = os.path.join(app.config['DOWNLOAD_FOLDER'], f"{unique_id}_{converted_filename}")
                sound.export(converted_path, format="mp3", bitrate="320k")
                
                logger.info(f"Conversion successful (WAV to MP3): {converted_filename} (ID: {unique_id})")
            elif conversion_type == 'mp32wav' and file_ext == 'mp3':
                # Convert MP3 to WAV
                sound = AudioSegment.from_mp3(original_path)
                converted_filename = f"{os.path.splitext(filename)[0]}.wav"
                converted_path = os.path.join(app.config['DOWNLOAD_FOLDER'], f"{unique_id}_{converted_filename}")
                sound.export(converted_path, format="wav")
                
                logger.info(f"Conversion successful (MP3 to WAV): {converted_filename} (ID: {unique_id})")
            else:
                # File type doesn't match conversion type
                raise ValueError(f"File type ({file_ext}) doesn't match conversion type ({conversion_type})")
            
            # Return success response with download URL
            return jsonify({
                "success": True,
                "message": "Conversion successful!",
                "download_url": f"/download/{unique_id}_{converted_filename}",
                "converted_filename": converted_filename
            })
        except Exception as e:
            logger.error(f"Error during conversion: {str(e)}")
            # Try to remove the uploaded file if it exists
            if 'original_path' in locals() and os.path.exists(original_path):
                try:
                    os.remove(original_path)
                except:
                    pass
            return jsonify({"error": str(e)}), 500
    
    logger.warning(f"Invalid file type: {file.filename}")
    return jsonify({"error": "File type not allowed. Please upload a WAV or MP3 file."}), 400

@app.route('/download/<filename>')
def download_file(filename):
    """Handle file downloads"""
    try:
        file_path = os.path.join(app.config['DOWNLOAD_FOLDER'], filename)
        
        if not os.path.exists(file_path):
            logger.error(f"Download file not found: {filename}")
            return jsonify({"error": "File not found"}), 404
            
        logger.info(f"File downloaded: {filename}")
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        logger.error(f"Error during download: {str(e)}")
        return jsonify({"error": "Error during download"}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file size too large error"""
    logger.warning("File too large")
    return jsonify({"error": "File too large. Maximum size is 50MB"}), 413

@app.errorhandler(500)
def internal_server_error(error):
    """Handle internal server errors"""
    logger.error(f"Server error: {str(error)}")
    return jsonify({"error": "Server error. Please try again later."}), 500

# Check for FFmpeg and cleanup at startup
check_ffmpeg()
cleanup_old_files()

if __name__ == '__main__':
    # In production, set debug to False and use a proper WSGI server
    debug_mode = os.environ.get('FLASK_DEBUG', 'True') == 'True'
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=debug_mode, host='0.0.0.0', port=port) 