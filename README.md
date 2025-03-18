# Audio Converter Pro

An elegant web application for converting audio files between WAV and MP3 formats.

## Features

- Easy-to-use drag & drop interface
- Convert WAV files to MP3 format
- Convert MP3 files to WAV format
- Modern, responsive design
- Progress indication during conversion
- Secure file handling

## Requirements

- Python 3.7+
- FFmpeg (required for audio conversion)
- Flask and its dependencies

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/audio-converter-pro.git
cd audio-converter-pro
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Install FFmpeg

#### Windows:
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract the files to a folder (e.g., `C:\FFmpeg`)
3. Add the bin folder to your system PATH:
   - Right-click on 'This PC' or 'My Computer' and select 'Properties'
   - Click on 'Advanced system settings'
   - Click on 'Environment Variables'
   - Under 'System Variables', find and select 'Path', then click 'Edit'
   - Click 'New' and add the path to the FFmpeg bin folder (e.g., `C:\FFmpeg\bin`)
   - Click 'OK' on all dialog boxes

#### macOS:
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

### 4. Run the application

```bash
python app.py
```

The application will start and be available at http://127.0.0.1:5000/

## Deployment on Sevalla.com

1. **Create an account** on [Sevalla.com](https://sevalla.com)

2. **Compress your project files** into a ZIP archive
   - Include all project files except virtual environment folders

3. **Create a new application** on Sevalla.com Dashboard
   - Choose Python as the application type

4. **Upload your ZIP file**

5. **Configure the application**
   - Set the entry point to `app.py`
   - Make sure the following environment variables are set:
     ```
     FLASK_APP=app.py
     FLASK_DEBUG=False
     ```

6. **Ensure FFmpeg is installed**
   - You may need to add a `nixpacks.toml` file with the following content:
     ```toml
     [phases.setup]
     nixPkgs = ["ffmpeg", "python3", "python3-pip", "libavcodec-extra"]
     
     [start]
     cmd = "gunicorn app:app"
     ```

7. **Configure Procfile**
   - Make sure you have a Procfile with the following content:
     ```
     web: gunicorn app:app
     ```

8. **Add gunicorn to requirements.txt**
   - Ensure your requirements.txt includes:
     ```
     gunicorn==20.1.0
     ```

9. **Deploy and test your application**
   - After deployment, test both WAV-to-MP3 and MP3-to-WAV conversions

## Troubleshooting

### FFmpeg Issues

If you encounter errors related to FFmpeg:

1. Verify FFmpeg is properly installed by running `ffmpeg -version` in your terminal
2. Make sure the FFmpeg binary is in your system PATH
3. Check application logs for specific error messages

### File Upload Issues

If file uploads fail:

1. Check the maximum file size (currently set to 50MB)
2. Ensure the file is a valid WAV or MP3 file
3. Verify that the appropriate directories exist and are writable:
   - `static/uploads`
   - `static/downloads`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
 
