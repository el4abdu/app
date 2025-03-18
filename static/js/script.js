// DOM Elements
const form = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const uploadMsg = document.getElementById('upload-msg');
const dropZone = document.getElementById('drop-zone');
const uploadBtn = document.getElementById('upload-btn');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const resultContainer = document.getElementById('result-container');
const errorContainer = document.getElementById('error-container');
const errorMsg = document.getElementById('error-msg');
const downloadBtn = document.getElementById('download-btn');
const conversionToggle = document.getElementById('conversion-toggle');
const wav2mp3Label = document.getElementById('wav2mp3-label');
const mp32wavLabel = document.getElementById('mp32wav-label');

// Track current conversion mode
let currentMode = 'wav2mp3';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Audio Converter Pro initialized');
    checkFFmpegStatus();
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Toggle conversion mode
    conversionToggle.addEventListener('change', toggleConversionMode);
    
    // File selection
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            handleFileSelect();
        }
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (fileInput.files.length > 0) {
            uploadFile(fileInput.files[0]);
        } else {
            showError('Please select a file first.');
        }
    });
}

// Check if FFmpeg is available on the server
function checkFFmpegStatus() {
    fetch('/ffmpeg-status')
        .then(response => response.json())
        .then(data => {
            if (!data.ffmpeg_available) {
                showError('FFmpeg is not installed or not configured properly. Audio conversion may not work correctly.');
            }
        })
        .catch(error => {
            console.error('Error checking FFmpeg status:', error);
        });
}

// Toggle between WAV to MP3 and MP3 to WAV conversion
function toggleConversionMode() {
    if (conversionToggle.checked) {
        currentMode = 'mp32wav';
        fileInput.accept = '.mp3';
        uploadMsg.textContent = 'Drop your MP3 file here or click to browse';
        wav2mp3Label.classList.remove('active');
        mp32wavLabel.classList.add('active');
    } else {
        currentMode = 'wav2mp3';
        fileInput.accept = '.wav';
        uploadMsg.textContent = 'Drop your WAV file here or click to browse';
        mp32wavLabel.classList.remove('active');
        wav2mp3Label.classList.add('active');
    }
}

// Handle file selection
function handleFileSelect() {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const extension = file.name.split('.').pop().toLowerCase();
        
        // Validate file extension based on conversion mode
        let isValid = false;
        if (currentMode === 'wav2mp3' && extension === 'wav') {
            isValid = true;
        } else if (currentMode === 'mp32wav' && extension === 'mp3') {
            isValid = true;
        }
        
        if (!isValid) {
            if (currentMode === 'wav2mp3') {
                showError('Please select a WAV file for WAV to MP3 conversion.');
            } else {
                showError('Please select an MP3 file for MP3 to WAV conversion.');
            }
            fileInput.value = '';
            return;
        }
        
        uploadMsg.textContent = `File selected: ${file.name}`;
        uploadBtn.disabled = false;
        hideError();
    }
}

// Upload file
function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversion_type', currentMode);
    
    // Reset UI
    resultContainer.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    uploadBtn.disabled = true;
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressBar.style.width = percentComplete + '%';
        }
    });
    
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    showSuccess(response);
                } else {
                    showError(response.error || 'An error occurred during conversion.');
                }
            } catch (e) {
                showError('An unexpected error occurred. Please try again.');
            }
        } else {
            try {
                const response = JSON.parse(xhr.responseText);
                showError(response.error || `Server error: ${xhr.status}`);
            } catch (e) {
                showError(`Server error: ${xhr.status}`);
            }
        }
        
        progressContainer.classList.add('hidden');
        uploadBtn.disabled = false;
    });
    
    xhr.addEventListener('error', () => {
        showError('Network error. Please check your connection and try again.');
        progressContainer.classList.add('hidden');
        uploadBtn.disabled = false;
    });
    
    xhr.open('POST', '/convert');
    xhr.send(formData);
}

// Show success message and download link
function showSuccess(response) {
    const downloadLink = document.getElementById('download-link');
    downloadLink.href = response.download_url;
    downloadLink.download = response.converted_filename;
    
    // Update the converted filename display
    let outputFormat = currentMode === 'wav2mp3' ? 'MP3' : 'WAV';
    document.getElementById('converted-filename').textContent = response.converted_filename;
    
    resultContainer.classList.remove('hidden');
    fileInput.value = '';
    uploadMsg.textContent = currentMode === 'wav2mp3' ? 
        'Drop your WAV file here or click to browse' : 
        'Drop your MP3 file here or click to browse';
}

// Show error message
function showError(message) {
    errorMsg.textContent = message;
    errorContainer.classList.remove('hidden');
}

// Hide error message
function hideError() {
    errorContainer.classList.add('hidden');
} 