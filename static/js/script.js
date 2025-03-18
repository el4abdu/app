// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileInput');
const selectButton = document.getElementById('select-button');
const fileInfo = document.getElementById('file-info');
const uploadForm = document.getElementById('upload-form');
const progressContainer = document.getElementById('progress-container');
const progressBarFill = document.querySelector('.progress-bar-fill');
const resultContainer = document.getElementById('result-container');
const convertedFilename = document.getElementById('converted-filename');
const downloadLink = document.getElementById('download-link');
const convertAnother = document.getElementById('convert-another');
const errorToast = document.getElementById('error-toast');
const errorMessage = document.getElementById('error-message');
const conversionToggle = document.getElementById('conversion-type-toggle');
const conversionTypeInput = document.getElementById('conversion-type');
const wav2mp3Label = document.getElementById('wav2mp3-label');
const mp32wavLabel = document.getElementById('mp32wav-label');
const uploadMessage = document.getElementById('upload-message');

// Current conversion mode
let currentMode = 'wav2mp3'; // Default is WAV to MP3

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Audio Converter Pro initialized');
    initializeApp();
});

// Initialization function
function initializeApp() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle selected files
    fileInput.addEventListener('change', handleFiles);
    
    // Open file selector when button is clicked
    selectButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle convert another button
    convertAnother.addEventListener('click', resetForm);
    
    // Add click event to the entire drop area for better UX
    dropArea.addEventListener('click', () => {
        if (!dropArea.classList.contains('hidden')) {
            selectButton.click();
        }
    });
    
    // Handle conversion toggle change
    conversionToggle.addEventListener('change', toggleConversionMode);
}

// Functions
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('highlight');
}

function unhighlight() {
    dropArea.classList.remove('highlight');
}

function toggleConversionMode() {
    if (conversionToggle.checked) {
        // MP3 to WAV mode
        currentMode = 'mp32wav';
        conversionTypeInput.value = 'mp32wav';
        fileInput.accept = '.mp3';
        uploadMessage.textContent = 'Drag & drop your MP3 file here or';
        wav2mp3Label.classList.remove('active');
        mp32wavLabel.classList.add('active');
    } else {
        // WAV to MP3 mode
        currentMode = 'wav2mp3';
        conversionTypeInput.value = 'wav2mp3';
        fileInput.accept = '.wav';
        uploadMessage.textContent = 'Drag & drop your WAV file here or';
        mp32wavLabel.classList.remove('active');
        wav2mp3Label.classList.add('active');
    }
    
    // Reset form when changing modes
    if (fileInfo.textContent) {
        resetForm();
    }
    
    console.log(`Conversion mode changed to: ${currentMode}`);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(e) {
    const files = e.target?.files || e;
    if (files.length) {
        const file = files[0];
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        // Check if file type matches current conversion mode
        let isValid = false;
        let errorMsg = '';
        
        if (currentMode === 'wav2mp3') {
            isValid = file.type === 'audio/wav' || fileExt === 'wav';
            errorMsg = 'Please select a WAV file for WAV to MP3 conversion.';
        } else {
            isValid = file.type === 'audio/mp3' || fileExt === 'mp3';
            errorMsg = 'Please select an MP3 file for MP3 to WAV conversion.';
        }
        
        if (!isValid) {
            showError(errorMsg);
            return;
        }
        
        // Display file info
        fileInfo.textContent = `File: ${file.name} (${formatFileSize(file.size)})`;
        fileInfo.style.display = 'inline-block';
        
        // Submit the file after a short delay for better UX
        setTimeout(() => {
            uploadFile(file);
        }, 500);
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversion_type', currentMode);
    
    // Show progress
    dropArea.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    
    // Simulate progress (for UX purposes)
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        progressBarFill.style.width = Math.min(progress, 90) + '%';
        if (progress >= 90) clearInterval(interval);
    }, 300);
    
    // Log for debugging
    console.log(`Uploading file: ${file.name} (${formatFileSize(file.size)})`);
    console.log(`Conversion type: ${currentMode}`);
    
    // Send AJAX request
    fetch('/convert', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'An error occurred during conversion');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Conversion successful:', data);
        clearInterval(interval);
        progressBarFill.style.width = '100%';
        
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            
            // Update download link and filename display
            if (data.converted_filename) {
                convertedFilename.textContent = data.converted_filename;
            } else {
                // Fallback if server doesn't return the filename
                const outputExtension = currentMode === 'wav2mp3' ? '.mp3' : '.wav';
                const inputExtension = currentMode === 'wav2mp3' ? '.wav' : '.mp3';
                convertedFilename.textContent = file.name.replace(inputExtension, outputExtension);
            }
            
            downloadLink.href = data.download_url;
            
            // Trigger confetti animation
            triggerConfetti();
        }, 800);
    })
    .catch(error => {
        console.error('Error during conversion:', error);
        clearInterval(interval);
        progressContainer.classList.add('hidden');
        dropArea.classList.remove('hidden');
        showError(error.message);
    });
}

function resetForm() {
    fileInput.value = '';
    fileInfo.textContent = '';
    fileInfo.style.display = 'none';
    resultContainer.classList.add('hidden');
    dropArea.classList.remove('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorToast.classList.remove('hidden');
    
    // Add animation
    errorToast.style.animation = 'fadeIn 0.3s ease-out forwards';
    
    setTimeout(() => {
        errorToast.style.animation = 'fadeOut 0.3s ease-in forwards';
        setTimeout(() => {
            errorToast.classList.add('hidden');
        }, 300);
    }, 5000);
}

function triggerConfetti() {
    // Use canvas-confetti library
    const myConfetti = confetti.create(document.createElement('canvas'), {
        resize: true,
        useWorker: true
    });
    
    document.body.appendChild(myConfetti.canvas);
    myConfetti.canvas.style.position = 'fixed';
    myConfetti.canvas.style.top = '0';
    myConfetti.canvas.style.left = '0';
    myConfetti.canvas.style.width = '100%';
    myConfetti.canvas.style.height = '100%';
    myConfetti.canvas.style.pointerEvents = 'none';
    myConfetti.canvas.style.zIndex = '100';
    
    // First burst
    myConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
    
    // Multiple smaller bursts for a more spectacular effect
    setTimeout(() => {
        myConfetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 }
        });
    }, 250);
    
    setTimeout(() => {
        myConfetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 }
        });
    }, 400);
    
    setTimeout(() => {
        document.body.removeChild(myConfetti.canvas);
    }, 4000);
}

// Add these animations to the CSS
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.innerHTML = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
    `;
    document.head.appendChild(style);
} 