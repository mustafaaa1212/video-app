// Video Screenshot Extractor - Client-side JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const processingStatus = document.getElementById('processingStatus');
    const videoInput = document.getElementById('video');
    const intervalInput = document.getElementById('interval');

    // Form validation and submission
    uploadForm.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return false;
        }

        // Show processing status
        showProcessingStatus();
        
        // Disable form elements
        disableForm();
    });

    // File input change handler
    videoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            validateFileSize(file);
            displayFileInfo(file);
        }
    });

    // Interval input validation
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

        // Check if video file is selected
        if (!videoFile) {
            showAlert('Please select a video file', 'error');
            return false;
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'];
        const fileExtension = videoFile.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'];
        
        if (!allowedExtensions.includes(fileExtension)) {
            showAlert('Please select a valid video file (MP4, AVI, MOV, MKV, FLV, WMV)', 'error');
            return false;
        }

        // Validate file size (500MB = 500 * 1024 * 1024 bytes)
        const maxSize = 500 * 1024 * 1024;
        if (videoFile.size > maxSize) {
            showAlert('File size must be less than 500MB', 'error');
            return false;
        }

        // Validate interval
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
        const maxSize = 500 * 1024 * 1024; // 500MB
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
        
        // Remove any existing file info
        const existingInfo = document.getElementById('fileInfo');
        if (existingInfo) {
            existingInfo.remove();
        }

        // Create file info display
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

        // Insert after video input
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
        
        // Add smooth scroll to processing status
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
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert:not(#processingStatus .alert)');
        existingAlerts.forEach(alert => {
            if (!alert.closest('#processingStatus')) {
                alert.remove();
            }
        });

        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at the top of card body
        const cardBody = document.querySelector('.card-body');
        cardBody.insertBefore(alertDiv, cardBody.firstChild);

        // Auto-dismiss success alerts after 5 seconds
        if (type !== 'error') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
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

    // Estimate processing time
    function estimateProcessingTime() {
        const file = videoInput.files[0];
        const interval = parseFloat(intervalInput.value);
        
        if (file && interval) {
            // Rough estimation: 1MB per second of processing
            const estimatedSeconds = Math.ceil(file.size / (1024 * 1024));
            const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
            
            let timeText = '';
            if (estimatedMinutes > 1) {
                timeText = `approximately ${estimatedMinutes} minutes`;
            } else {
                timeText = `approximately ${estimatedSeconds} seconds`;
            }

            // Update processing status with estimate
            const processingContent = processingStatus.querySelector('.alert');
            if (processingContent) {
                processingContent.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm me-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <div>
                            <strong>Processing your video...</strong><br>
                            <small>Estimated time: ${timeText}</small>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Update estimation when inputs change
    videoInput.addEventListener('change', estimateProcessingTime);
    intervalInput.addEventListener('input', estimateProcessingTime);

    // Handle page refresh/unload during processing
    window.addEventListener('beforeunload', function(e) {
        if (submitBtn.disabled) {
            e.preventDefault();
            e.returnValue = 'Video processing is in progress. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
});
