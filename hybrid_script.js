// Video Screenshot Extractor - Hybrid Version with Email + Download

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const processingStatus = document.getElementById('processingStatus');
    const videoInput = document.getElementById('video');
    const intervalInput = document.getElementById('interval');
    const alertContainer = document.getElementById('alertContainer');

    const API_ENDPOINT = '/api/upload';
    
    let currentProcessId = null;
    let statusCheckInterval = null;

    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return false;
        }

        showProcessingStatus();
        disableForm();
        uploadFile();
    });

    videoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            validateFileSize(file);
            displayFileInfo(file);
        }
    });

    intervalInput.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        if (value <= 0) {
            e.target.setCustomValidity('Interval must be greater than 0');
        } else if (value < 0.1) {
            e.target.setCustomValidity('Minimum interval is 0.1 seconds');
        } else {
            e.target.setCustomValidity('');
        }
    });

    function validateForm() {
        const videoFile = videoInput.files[0];
        const interval = parseFloat(intervalInput.value);

        if (!videoFile) {
            showAlert('Please select a video file', 'error');
            return false;
        }

        const fileExtension = videoFile.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'];
        
        if (!allowedExtensions.includes(fileExtension)) {
            showAlert('Please select a valid video file (MP4, AVI, MOV, MKV, FLV, WMV)', 'error');
            return false;
        }

        const maxSize = 500 * 1024 * 1024;
        if (videoFile.size > maxSize) {
            showAlert('File size must be less than 500MB', 'error');
            return false;
        }

        if (!interval || interval <= 0) {
            showAlert('Please enter a valid interval greater than 0', 'error');
            return false;
        }

        if (interval < 0.1) {
            showAlert('Minimum interval is 0.1 seconds', 'error');
            return false;
        }

        return true;
    }

    function validateFileSize(file) {
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            showAlert('File size exceeds 500MB limit', 'error');
            videoInput.value = '';
            return false;
        }
        return true;
    }

    function displayFileInfo(file) {
        const fileSize = formatFileSize(file.size);
        const fileName = file.name;
        
        const existingInfo = document.getElementById('fileInfo');
        if (existingInfo) {
            existingInfo.remove();
        }

        const fileInfo = document.createElement('div');
        fileInfo.id = 'fileInfo';
        fileInfo.className = 'alert alert-info mt-2';
        fileInfo.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-file-video me-2"></i>
                <div>
                    <strong>${fileName}</strong><br>
                    <small>Size: ${fileSize}</small>
                </div>
            </div>
        `;

        videoInput.parentNode.insertBefore(fileInfo, videoInput.nextSibling);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showProcessingStatus() {
        processingStatus.style.display = 'block';
        processingStatus.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
    }

    function disableForm() {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Processing...
        `;
        
        videoInput.disabled = true;
        intervalInput.disabled = true;
    }

    function enableForm() {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <i class="fas fa-upload me-2"></i>
            Extract Screenshots
        `;
        
        videoInput.disabled = false;
        intervalInput.disabled = false;
        processingStatus.style.display = 'none';
    }

    function showAlert(message, type) {
        alertContainer.innerHTML = '';

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        alertContainer.appendChild(alertDiv);

        if (type !== 'error') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 10000);
        }
    }

    function uploadFile() {
        const formData = new FormData();
        formData.append('video', videoInput.files[0]);
        formData.append('interval', intervalInput.value);

        fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentProcessId = data.process_id;
                showAlert('Video uploaded successfully! Processing screenshots and sending email...', 'success');
                startStatusCheck();
            } else {
                showAlert(data.message || 'An error occurred while processing your request.', 'error');
                enableForm();
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showAlert('Failed to upload video. Please check your connection and try again.', 'error');
            enableForm();
        });
    }

    function startStatusCheck() {
        if (!currentProcessId) return;
        
        statusCheckInterval = setInterval(() => {
            checkProcessingStatus();
        }, 2000);
    }

    function stopStatusCheck() {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
        }
    }

    function checkProcessingStatus() {
        if (!currentProcessId) return;

        fetch(`/api/status/${currentProcessId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'completed') {
                stopStatusCheck();
                enableForm();
                
                const downloadLink = `/download/${data.zip_file}`;
                const emailStatus = data.email_sent ? 
                    '<i class="fas fa-check-circle text-success me-1"></i>Email sent to mustafasadikot72@gmail.com' : 
                    '<i class="fas fa-exclamation-triangle text-warning me-1"></i>Email delivery failed';
                
                showAlert(`
                    <strong>Processing Complete!</strong><br>
                    Generated ${data.screenshot_count} screenshots from your video.<br><br>
                    ${emailStatus}<br><br>
                    <a href="${downloadLink}" class="btn btn-success btn-sm">
                        <i class="fas fa-download me-1"></i> Download ZIP File
                    </a>
                `, 'success');
                
            } else if (data.status === 'error') {
                stopStatusCheck();
                enableForm();
                showAlert(`Processing failed: ${data.message}`, 'error');
                
            } else {
                updateProcessingMessage();
            }
        })
        .catch(error => {
            console.error('Status check error:', error);
        });
    }

    function updateProcessingMessage() {
        const statusElement = processingStatus.querySelector('.alert');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div>
                        <strong>Processing your video...</strong><br>
                        <small>Extracting screenshots and preparing email delivery...</small>
                    </div>
                </div>
            `;
        }
    }

    // Drag and drop functionality
    const dropZone = videoInput.parentElement;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('border-primary');
    }

    function unhighlight() {
        dropZone.classList.remove('border-primary');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            videoInput.files = files;
            const changeEvent = new Event('change', { bubbles: true });
            videoInput.dispatchEvent(changeEvent);
        }
    }

    window.addEventListener('beforeunload', function(e) {
        if (submitBtn.disabled) {
            e.preventDefault();
            e.returnValue = 'Video processing is in progress. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    window.addEventListener('unload', function() {
        stopStatusCheck();
    });
});