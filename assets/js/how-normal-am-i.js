/**
 * How Normal Am I - Main JavaScript
 * 
 * This file contains the main functionality for the How Normal Am I WordPress plugin,
 * including webcam access, face detection, and various facial analysis features.
 * 
 * Face-api.js is used for face detection and analysis.
 */

(function($) {
    'use strict';

    // Global variables
    let video;
    let canvas;
    let displaySize;
    let isModelLoaded = false;
    let detectionInterval;
    let userAge;
    let mouseInteractions = 0;
    let predictedAges = [];
    let beautyScores = [];
    let bmiScores = [];
    let currentStep = 0;
    let faceDetector;
    let screens = [];
    let termsChecked = false;
    let dataShared = false;
    let lastDetections = []; // Store last successful face detections
    let previewIntervals = []; // Store preview interval IDs for cleanup
    let analysisResults = {
        beautyScore: 0,
        age: 0,
        gender: '',
        genderProbability: 0,
        bmi: 0,
        lifeExpectancy: 0,
        emotion: '',
        emotionProbability: 0
    };

    // Track mouse movements as interactions
    $(document).on('mousemove click', function() {
        mouseInteractions++;
    });

    /**
     * Initialize the application when document is ready
     */
    $(document).ready(function() {
        // Check if the browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("Browser doesn't support getUserMedia");
            $('#hnai-video-status').text('Browser not supported');
        }
        
        // Get screen elements
        screens = [
            $('#hnai-intro-screen'),
            $('#hnai-camera-screen'),
            $('#hnai-age-input-screen'),
            $('#hnai-progress-screen')
        ];

        // Add analysis screens based on enabled options
        if ($('#hnai-beauty-screen').length) {
            screens.push($('#hnai-beauty-screen'));
        }
        if ($('#hnai-bmi-screen').length) {
            screens.push($('#hnai-bmi-screen'));
        }
        if ($('#hnai-age-screen').length) {
            screens.push($('#hnai-age-screen'));
        }
        if ($('#hnai-gender-screen').length) {
            screens.push($('#hnai-gender-screen'));
        }
        
        screens.push($('#hnai-faceprint-screen'));
        
        if ($('#hnai-emotion-screen').length) {
            screens.push($('#hnai-emotion-screen'));
        }
        if ($('#hnai-life-screen').length) {
            screens.push($('#hnai-life-screen'));
        }
        if ($('#hnai-data-screen').length) {
            screens.push($('#hnai-data-screen'));
        }
        
        screens.push($('#hnai-results-screen'));
        
        // Create mini preview elements
        createMiniPreview();

        // Set up event listeners
        setupEventListeners();

        // Show intro screen
        showScreen(0);
        
        // Check for mobile devices and handle resize events
        $(window).on('resize', function() {
            if (currentStep >= 4 && currentStep < screens.length - 1) {
                checkMobileAndEnableMiniPreview();
            }
        });
    });

    /**
     * Set up event listeners for user interactions
     */
    function setupEventListeners() {
        // Terms checkbox
        $('#hnai-terms-checkbox').on('change', function() {
            termsChecked = $(this).is(':checked');
            $('#hnai-start-btn').prop('disabled', !termsChecked);
            
            if (termsChecked) {
                $('#hnai-terms-read-you').text('Yes');
            } else {
                $('#hnai-terms-read-you').text('No');
            }
        });

        // Start button
        $('#hnai-start-btn').on('click', function() {
            if (termsChecked) {
                startExperience();
            }
        });

        // Age selection
        $('.hnai-age-option').on('click', function() {
            $('.hnai-age-option').removeClass('selected');
            $(this).addClass('selected');
            userAge = parseInt($(this).data('age'));
            $('#hnai-age-shared-you').text('Yes');
            
            // Enable the continue button once an age is selected
            $('#hnai-continue-age-btn').prop('disabled', false);
        });

        // Continue with selected age button
        $('#hnai-continue-age-btn').on('click', function() {
            if (userAge) {
                // First show the progress screen
                showScreen(3);
                
                // Show loading message
                $('#hnai-progress-message').html('Preparing your AI analysis...<br>This will only take a moment.');
                
                // Then show the first analysis screen after a delay
                setTimeout(function() {
                    showScreen(4); // Show first analysis screen
                    
                    // Display helpful guidance message if it exists
                    if ($('#hnai-analysis-guidance').length) {
                        $('#hnai-analysis-guidance').removeClass('hnai-hidden');
                    }
                }, 2000);
            }
        });

        // Skip/Continue without age button
        $('#hnai-skip-age-btn').on('click', function() {
            userAge = null;
            $('#hnai-age-shared-you').text('No');
            
            // First show the progress screen
            showScreen(3);
            
            // Show loading message
            $('#hnai-progress-message').html('Preparing your AI analysis...<br>This will only take a moment.');
            
            // Then show the first analysis screen after a delay
            setTimeout(function() {
                showScreen(4); // Show first analysis screen
                
                // Display helpful guidance message if it exists
                if ($('#hnai-analysis-guidance').length) {
                    $('#hnai-analysis-guidance').removeClass('hnai-hidden');
                }
            }, 2000);
        });

        // Continue buttons
        $('.hnai-continue-btn').on('click', function() {
            // Go to next screen
            nextScreen();
        });

        // Data sharing buttons
        $('#hnai-share-yes').on('click', function() {
            dataShared = true;
            $('#hnai-shared-data-you').text('Yes');
            nextScreen();
        });

        $('#hnai-share-no').on('click', function() {
            dataShared = false;
            $('#hnai-shared-data-you').text('No');
            nextScreen();
        });

        // Share buttons
        $('#hnai-share-twitter').on('click', function(e) {
            e.preventDefault();
            const score = $('#hnai-normality-score').text();
            const text = 'I am ' + score + ' normal according to AI! #hownormalami';
            const url = window.location.href;
            window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), '_blank');
        });

        $('#hnai-share-facebook').on('click', function(e) {
            e.preventDefault();
            const url = window.location.href;
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank');
        });

        // Restart button
        $('#hnai-restart-btn').on('click', function() {
            restartExperience();
        });
    }

    /**
     * Show a specific screen and hide all others
     * 
     * @param {number} index - Index of the screen to show
     */
    function showScreen(index) {
        currentStep = index;
        
        // Clean up any previous preview intervals
        if (previewIntervals.length > 0) {
            console.log(`Cleaning up ${previewIntervals.length} preview intervals`);
            previewIntervals.forEach(interval => clearInterval(interval));
            previewIntervals = [];
        }
        
        // Hide all screens
        screens.forEach(function(screen) {
            screen.addClass('hnai-hidden');
        });
        
        // Show the current screen
        screens[index].removeClass('hnai-hidden');
        
        // Update steps indicator for current screen
        const progressStep = getProgressStep(index);
        console.log(`Showing screen ${index}, progress step: ${progressStep}`);
        updateProgressIndicator(progressStep);
        
        // Update analysis counter if this is an analysis screen
        if (index >= 4 && index < screens.length - 1) {
            updateAnalysisCounter(index - 3, screens.length - 4);
            
            // Setup camera preview if this is an analysis screen with a preview
            setupCameraPreview(index);
            
            // Check if mini preview should be enabled for mobile
            checkMobileAndEnableMiniPreview();
        } else {
            // Hide mini preview on non-analysis screens
            const miniPreview = $('#hnai-mini-preview');
            if (miniPreview.hasClass('active')) {
                toggleMiniPreview();
            }
        }
        
        // Special handling for specific screens
        if (index === 1) { // Camera screen
            console.log("Showing camera screen");
            
            // Make sure video reference is cleared before initializing
            if (video && video.srcObject) {
                // Stop any existing streams
                try {
                    const tracks = video.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                } catch (e) {
                    console.error("Error stopping tracks:", e);
                }
            }
            
            // Ensure debug UI is visible
            $('#hnai-debug-info').show();
            
            // Start camera with delay to ensure DOM is ready
            setTimeout(function() {
                startCamera();
            }, 100);
        } else if (index === screens.length - 1) { // Results screen
            calculateFinalScore();
        }
        
        // Handle faceprint screen specifically
        const faceprint_index = screens.findIndex(screen => screen.attr('id') === 'hnai-faceprint-screen');
        if (index === faceprint_index && lastDetections && lastDetections.length > 0) {
            console.log("Drawing face fingerprint...");
            try {
                drawFacePrint(lastDetections[0]);
            } catch (e) {
                console.error("Error drawing face fingerprint:", e);
            }
        }
    }

    /**
     * Setup camera preview for analysis screens
     * 
     * @param {number} screenIndex - Index of the current screen
     */
    function setupCameraPreview(screenIndex) {
        if (!video || !video.srcObject) return;
        
        let previewVideo, previewCanvas;
        
        // Determine which preview elements to use based on screen
        switch(screenIndex) {
            case 4: // Beauty screen
                previewVideo = document.getElementById('hnai-preview-video');
                previewCanvas = document.getElementById('hnai-preview-canvas');
                break;
            case 5: // BMI screen
                previewVideo = document.getElementById('hnai-preview-video-bmi');
                previewCanvas = document.getElementById('hnai-preview-canvas-bmi');
                break;
            case 6: // Age screen
                previewVideo = document.getElementById('hnai-preview-video-age');
                previewCanvas = document.getElementById('hnai-preview-canvas-age');
                break;
            default:
                return; // No preview for this screen
        }
        
        if (!previewVideo || !previewCanvas) return;
        
        console.log(`Setting up camera preview for screen ${screenIndex}`);
        
        try {
            // Clone the main video stream to the preview
            previewVideo.srcObject = video.srcObject;
            previewVideo.play().catch(e => console.error("Error playing preview video:", e));
            
            // Set up canvas for preview
            const previewCtx = previewCanvas.getContext('2d');
            
            // Set display size for preview elements
            const previewSize = { 
                width: previewVideo.clientWidth, 
                height: previewVideo.clientHeight 
            };
            
            // Match canvas dimensions
            previewCanvas.width = previewSize.width;
            previewCanvas.height = previewSize.height;
            
            // Set up interval to redraw face detection on the preview
            const previewInterval = setInterval(function() {
                if (!previewVideo || previewVideo.paused || !isModelLoaded) return;
                
                // Clear canvas
                previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                
                // If we have detections, draw them on the preview
                if (lastDetections && lastDetections.length > 0) {
                    try {
                        // Scale detections to fit preview size
                        const scaleFactor = previewSize.width / displaySize.width;
                        const scaledDetections = lastDetections.map(detection => {
                            // Add null check for detection and detection.box
                            if (!detection || !detection.box) {
                                console.log("Invalid detection object:", detection);
                                return null;
                            }
                            
                            return {
                                ...detection,
                                box: {
                                    x: detection.box.x * scaleFactor,
                                    y: detection.box.y * scaleFactor,
                                    width: detection.box.width * scaleFactor,
                                    height: detection.box.height * scaleFactor
                                }
                            };
                        }).filter(Boolean); // Filter out null values
                        
                        // Draw detection box
                        previewCtx.strokeStyle = '#1a73e8';
                        previewCtx.lineWidth = 2;
                        scaledDetections.forEach(detection => {
                            previewCtx.strokeRect(
                                detection.box.x, 
                                detection.box.y, 
                                detection.box.width, 
                                detection.box.height
                            );
                        });
                    } catch (e) {
                        console.error("Error drawing detections:", e);
                    }
                }
            }, 100);
            
            // Store interval ID to clear it when changing screens
            previewIntervals.push(previewInterval);
        } catch (e) {
            console.error("Error setting up preview:", e);
        }
    }

    /**
     * Move to the next screen
     */
    function nextScreen() {
        if (currentStep < screens.length - 1) {
            const nextScreenIndex = currentStep + 1;
            showScreen(nextScreenIndex);
            
            // 在showScreen后更新步骤指示器，确保UI元素已经显示
            const progressStep = getProgressStep(nextScreenIndex);
            console.log(`Moving to next screen: ${nextScreenIndex}, progress step: ${progressStep}`);
            updateProgressIndicator(progressStep);
        }
    }

    /**
     * Start the experience
     */
    function startExperience() {
        showScreen(1); // Show camera screen
    }

    /**
     * Restart the experience
     */
    function restartExperience() {
        console.log("Restarting experience...");
        
        // Stop any running detection interval
        if (detectionInterval) {
            clearInterval(detectionInterval);
            detectionInterval = null;
        }
        
        // Clean up any preview intervals
        if (previewIntervals && previewIntervals.length > 0) {
            console.log(`Cleaning up ${previewIntervals.length} preview intervals`);
            previewIntervals.forEach(interval => clearInterval(interval));
            previewIntervals = [];
        }
        
        // Stop video stream if active
        if (video && video.srcObject) {
            try {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
                console.log("Stopped all video tracks");
            } catch (e) {
                console.error("Error stopping video tracks:", e);
            }
        }
        
        // Reset variables
        userAge = null;
        mouseInteractions = 0;
        predictedAges = [];
        beautyScores = [];
        bmiScores = [];
        dataShared = false;
        lastDetections = [];
        termsChecked = false;
        analysisResults = {
            beautyScore: 0,
            age: 0,
            gender: '',
            genderProbability: 0,
            bmi: 0,
            lifeExpectancy: 0,
            emotion: '',
            emotionProbability: 0
        };
        
        // Reset UI elements
        $('.hnai-age-option').removeClass('selected');
        $('#hnai-terms-checkbox').prop('checked', false);
        $('#hnai-start-btn').prop('disabled', true);
        $('#hnai-terms-read-you').text('No');
        $('#hnai-age-shared-you').text('-');
        $('#hnai-beauty-you').text('...');
        $('#hnai-age-you').text('...');
        $('#hnai-gender-you').text('...');
        $('#hnai-bmi-you').text('...');
        $('#hnai-life-you').text('...');
        $('#hnai-expression-you').text('...');
        $('#hnai-interactions-you').text('...');
        $('#hnai-shared-data-you').text('...');
        
        // Hide mini preview if it's active
        const miniPreview = $('#hnai-mini-preview');
        if (miniPreview.length && miniPreview.hasClass('active')) {
            toggleMiniPreview();
        }
        
        // Reset faceMask canvas if it exists
        if ($('#hnai-faceprint-canvas').length) {
            const ctx = document.getElementById('hnai-faceprint-canvas').getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, $('#hnai-faceprint-canvas').width(), $('#hnai-faceprint-canvas').height());
            }
        }
        
        // Show camera screen directly instead of intro screen
        showScreen(1);
        
        // Re-initialize camera after a short delay
        setTimeout(function() {
            startCamera();
        }, 500);
    }

    /**
     * Start the camera and load models
     */
    async function startCamera() {
        video = document.getElementById('hnai-video');
        canvas = document.getElementById('hnai-canvas');
        
        console.log("Starting camera initialization...");
        
        // First ensure video element is visible and properly styled
        video.style.display = 'block';
        video.style.visibility = 'visible';
        video.style.opacity = '1';
        video.style.minHeight = '480px';
        video.style.backgroundColor = '#333'; // Darker background to better see when video is loading
        
        // Ensure canvas doesn't block video
        canvas.style.zIndex = '1';
        
        try {
            console.log("Requesting camera access...");
            // Access user's webcam
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            console.log("Camera access granted!");
            
            // Set the srcObject to the stream directly
            video.srcObject = stream;
            
            // Force video to play immediately
            try {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        console.log("Video playback started successfully");
                    }).catch(e => {
                        console.error("Error during video playback:", e);
                        // Try playing again with user interaction
                        $('.hnai-camera-container').append(
                            '<button id="hnai-retry-video" class="hnai-btn" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;">Click to start camera</button>'
                        );
                        $('#hnai-retry-video').on('click', function() {
                            video.play();
                            $(this).remove();
                        });
                    });
                }
            } catch (playError) {
                console.error("Error starting video playback:", playError);
            }
            
            // Debug video element properties
            console.log("Video properties:", {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                offsetWidth: video.offsetWidth,
                offsetHeight: video.offsetHeight,
                clientWidth: video.clientWidth,
                clientHeight: video.clientHeight,
                style: video.getAttribute('style')
            });
            
            // Add event listeners to debug video state
            video.addEventListener('playing', function() {
                console.log("Video is now playing - event triggered");
                $('#hnai-video-status').text('Playing');
                updateDebugInfo();
            });
            
            video.addEventListener('loadedmetadata', function() {
                console.log("Video metadata loaded - dimensions:", video.videoWidth, "x", video.videoHeight);
                $('#hnai-video-status').text('Metadata loaded');
                updateDebugInfo();
                
                // Set canvas dimensions to match video
                displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
                canvas.width = displaySize.width;
                canvas.height = displaySize.height;
                try {
                    faceapi.matchDimensions(canvas, displaySize);
                    console.log("Canvas dimensions matched to video");
                } catch (e) {
                    console.error("Error matching dimensions:", e);
                }
                
                // Load models
                loadModels();
            });
            
            video.addEventListener('error', function(e) {
                console.error("Video error:", video.error, e);
                $('#hnai-video-status').text('Error: ' + (video.error ? video.error.message : 'Unknown'));
                $('.hnai-loading-models').addClass('hnai-hidden');
                $('.hnai-camera-error').removeClass('hnai-hidden');
            });
            
            video.addEventListener('pause', function() {
                console.log("Video paused");
                $('#hnai-video-status').text('Paused');
                updateDebugInfo();
            });
            
            // Update debug info periodically
            setInterval(updateDebugInfo, 1000);
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            $('.hnai-loading-models').addClass('hnai-hidden');
            $('.hnai-camera-error').removeClass('hnai-hidden');
        }
    }

    /**
     * Load face-api.js models
     */
    async function loadModels() {
        try {
            const modelsUrl = hnaiData.modelsUrl;
            
            // Set up face detector
            faceDetector = new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.5
            });
            
            // Update loading message
            $('#hnai-loading-message').text('Preparing to load facial analysis models...');
            updateLoadingProgress(5);
            
            // Define models to load with descriptive names
            const models = [
                { net: faceapi.nets.tinyFaceDetector, name: 'Face Detection', progress: 20 },
                { net: faceapi.nets.faceLandmark68Net, name: 'Facial Landmarks', progress: 40 },
                { net: faceapi.nets.faceRecognitionNet, name: 'Face Recognition', progress: 60 },
                { net: faceapi.nets.faceExpressionNet, name: 'Expression Analysis', progress: 80 },
                { net: faceapi.nets.ageGenderNet, name: 'Age & Gender Detection', progress: 95 }
            ];
            
            // Load models sequentially to show progress
            for (let i = 0; i < models.length; i++) {
                const model = models[i];
                $('#hnai-loading-message').text(`Loading ${model.name} model...`);
                updateLoadingProgress(model.progress);
                
                // Add a small delay for better user experience (showing progress)
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Load the model
                await model.net.loadFromUri(modelsUrl);
            }
            
            // Final update
            $('#hnai-loading-message').text('All models loaded successfully!');
            updateLoadingProgress(100);
            
            console.log('All models loaded successfully');
            isModelLoaded = true;
            
            // Wait a moment to show the 100% completion
            setTimeout(function() {
                // Hide loading message
                $('.hnai-loading-models').addClass('hnai-hidden');
                
                // Start age input screen
                showScreen(2);
                
                // Start face detection in the background
                startFaceDetection();
            }, 800); // Short delay to show completion
            
        } catch (error) {
            console.error('Error loading models:', error);
            $('#hnai-loading-message').text('Error loading models: ' + error.message);
            updateLoadingProgress(0);
            
            // Show an error message and a retry button
            $('.hnai-loading-models').html(`
                <div class="hnai-loader"></div>
                <h3>Error Loading Models</h3>
                <p>There was a problem loading the AI models.</p>
                <p class="hnai-loading-help-text">${error.message}</p>
                <button id="hnai-retry-loading" class="hnai-btn" style="margin-top:15px;">Retry</button>
            `);
            
            // Bind retry button
            $('#hnai-retry-loading').on('click', function() {
                $('.hnai-loading-models').html(`
                    <div class="hnai-loader"></div>
                    <h3>Loading AI Models...</h3>
                    <p id="hnai-loading-message">Please wait while we initialize the face detection models...</p>
                    <div class="hnai-loading-progress-container">
                        <div class="hnai-loading-progress-bar">
                            <div id="hnai-loading-progress" style="width: 0%"></div>
                        </div>
                        <div id="hnai-loading-percentage">0%</div>
                    </div>
                    <p class="hnai-loading-help-text">This may take a few moments depending on your connection speed.</p>
                `);
                
                // Try loading models again
                loadModels();
            });
        }
    }
    
    /**
     * Update the loading progress indicator
     * 
     * @param {number} percentage - Progress percentage (0-100)
     */
    function updateLoadingProgress(percentage) {
        // Ensure percentage is within 0-100 range
        percentage = Math.min(100, Math.max(0, percentage));
        
        // Update progress bar and text
        $('#hnai-loading-progress').css('width', percentage + '%');
        $('#hnai-loading-percentage').text(percentage + '%');
    }

    /**
     * Start face detection process
     */
    function startFaceDetection() {
        if (!isModelLoaded) return;
        
        detectionInterval = setInterval(async function() {
            // Skip detection if video is paused or ended
            if (video.paused || video.ended) return;
            
            // Detect faces with all features
            const detections = await faceapi.detectAllFaces(video, faceDetector)
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender();
            
            // Clear canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Resize detections to match display size
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            
            // Store detections for preview usage
            if (resizedDetections.length > 0) {
                lastDetections = resizedDetections;
            }
            
            // Process detection results if a face is found
            if (resizedDetections.length > 0) {
                const detection = resizedDetections[0]; // Use the first face
                
                // Update age prediction
                predictedAges.push(detection.age);
                if (predictedAges.length > 30) {
                    predictedAges.shift();
                }
                const avgAge = predictedAges.reduce((total, age) => total + age, 0) / predictedAges.length;
                analysisResults.age = Math.round(avgAge);
                
                // Update gender prediction
                analysisResults.gender = detection.gender;
                analysisResults.genderProbability = detection.genderProbability;
                
                // Calculate beauty score (simple approach based on facial symmetry)
                const beautyScore = calculateBeautyScore(detection);
                beautyScores.push(beautyScore);
                if (beautyScores.length > 10) {
                    beautyScores.shift();
                }
                analysisResults.beautyScore = (beautyScores.reduce((total, score) => total + score, 0) / beautyScores.length).toFixed(1);
                
                // Calculate BMI (simple estimation)
                const bmi = estimateBMI(detection);
                bmiScores.push(bmi);
                if (bmiScores.length > 10) {
                    bmiScores.shift();
                }
                analysisResults.bmi = (bmiScores.reduce((total, score) => total + score, 0) / bmiScores.length).toFixed(1);
                
                // Get dominant emotion
                const expressions = detection.expressions;
                const dominantExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
                analysisResults.emotion = dominantExpression;
                analysisResults.emotionProbability = expressions[dominantExpression];
                
                // Calculate life expectancy
                analysisResults.lifeExpectancy = calculateLifeExpectancy(analysisResults.age, analysisResults.bmi, analysisResults.gender);
                
                // Update UI if on the appropriate screen
                updateAnalysisUI();
                
                // Draw face detection rectangle
                faceapi.draw.drawDetections(canvas, resizedDetections);
                
                // Draw face landmarks
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            }
        }, 100);
    }

    /**
     * Calculate beauty score based on facial symmetry and proportions
     * 
     * This is a simplified approach and not scientifically validated
     * 
     * @param {Object} detection - Face detection result
     * @return {number} - Beauty score from 0 to 10
     */
    function calculateBeautyScore(detection) {
        // Using a simplified approach based on facial symmetry
        // This is not scientifically validated and only for demonstration purposes
        
        const landmarks = detection.landmarks;
        const positions = landmarks.positions;
        
        // Calculate symmetry score
        const leftEye = getLandmarkPosition(positions, 36, 41);
        const rightEye = getLandmarkPosition(positions, 42, 47);
        const nose = getLandmarkPosition(positions, 30, 30);
        const mouth = getLandmarkPosition(positions, 48, 54);
        
        // Check vertical symmetry
        const faceMidpoint = positions[27].x; // Nose bridge top
        const eyesSymmetry = Math.abs((faceMidpoint - leftEye.x) - (rightEye.x - faceMidpoint)) / faceMidpoint;
        const noseSymmetry = Math.abs(nose.x - faceMidpoint) / faceMidpoint;
        const mouthSymmetry = Math.abs(mouth.x - faceMidpoint) / faceMidpoint;
        
        // Calculate golden ratio-based proportions
        const eyeDistance = rightEye.x - leftEye.x;
        const eyeToNoseRatio = Math.abs((nose.y - leftEye.y) / eyeDistance - 0.618);
        const noseToMouthRatio = Math.abs((mouth.y - nose.y) / eyeDistance - 0.382);
        
        // Combine all factors
        const symmetryScore = 10 - (eyesSymmetry * 20 + noseSymmetry * 10 + mouthSymmetry * 15);
        const proportionScore = 10 - (eyeToNoseRatio * 10 + noseToMouthRatio * 10);
        
        // Calculate final score
        let score = (symmetryScore * 0.7 + proportionScore * 0.3);
        
        // Ensure score is within 0-10 range
        score = Math.max(0, Math.min(10, score));
        
        return score;
    }

    /**
     * Get average position of landmarks by index range
     * 
     * @param {Array} positions - Array of landmarks positions
     * @param {number} startIndex - Start index
     * @param {number} endIndex - End index
     * @return {Object} - Average position {x, y}
     */
    function getLandmarkPosition(positions, startIndex, endIndex) {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        
        for (let i = startIndex; i <= endIndex; i++) {
            sumX += positions[i].x;
            sumY += positions[i].y;
            count++;
        }
        
        return {
            x: sumX / count,
            y: sumY / count
        };
    }

    /**
     * Estimate BMI based on facial features
     * 
     * This is a simplified approach and not scientifically validated
     * 
     * @param {Object} detection - Face detection result
     * @return {number} - Estimated BMI
     */
    function estimateBMI(detection) {
        // This is a simplified approach and not scientifically validated
        // Real BMI estimation would require a trained model on facial features
        
        const landmarks = detection.landmarks;
        const positions = landmarks.positions;
        
        // Calculate facial roundness
        const faceWidth = Math.abs(positions[16].x - positions[0].x);
        const faceHeight = Math.abs(positions[8].y - positions[27].y);
        const aspectRatio = faceWidth / faceHeight;
        
        // Calculate cheek fullness
        const leftCheek = positions[2];
        const rightCheek = positions[14];
        const nose = positions[30];
        
        const leftCheekDist = Math.sqrt(Math.pow(leftCheek.x - nose.x, 2) + Math.pow(leftCheek.y - nose.y, 2));
        const rightCheekDist = Math.sqrt(Math.pow(rightCheek.x - nose.x, 2) + Math.pow(rightCheek.y - nose.y, 2));
        const cheekFullness = (leftCheekDist + rightCheekDist) / (2 * faceHeight);
        
        // Combine factors to estimate BMI (centered around average BMI of 24.7)
        let bmi = 24.7;
        
        // Adjust based on facial roundness
        if (aspectRatio > 0.85) {
            bmi += (aspectRatio - 0.85) * 20;
        } else {
            bmi -= (0.85 - aspectRatio) * 15;
        }
        
        // Adjust based on cheek fullness
        if (cheekFullness > 0.5) {
            bmi += (cheekFullness - 0.5) * 10;
        } else {
            bmi -= (0.5 - cheekFullness) * 8;
        }
        
        // Ensure BMI is within reasonable range
        bmi = Math.max(16, Math.min(40, bmi));
        
        return bmi;
    }

    /**
     * Calculate life expectancy based on age, BMI, and gender
     * 
     * This is a simplified approach and not scientifically validated
     * 
     * @param {number} age - Age in years
     * @param {number} bmi - BMI value
     * @param {string} gender - Gender ('male' or 'female')
     * @return {number} - Estimated years left to live
     */
    function calculateLifeExpectancy(age, bmi, gender) {
        // Base life expectancy (simplified)
        const baseLifeExpectancy = gender === 'male' ? 76 : 81;
        
        // Calculate years already lived
        const yearsLived = age;
        
        // Adjust for BMI (simplified approach)
        let bmiAdjustment = 0;
        
        if (bmi < 18.5) {
            // Underweight
            bmiAdjustment = -3;
        } else if (bmi < 25) {
            // Normal weight
            bmiAdjustment = 2;
        } else if (bmi < 30) {
            // Overweight
            bmiAdjustment = -1;
        } else {
            // Obese
            bmiAdjustment = -5;
        }
        
        // Calculate remaining years
        const yearsRemaining = Math.max(0, baseLifeExpectancy + bmiAdjustment - yearsLived);
        
        return Math.round(yearsRemaining);
    }

    /**
     * Update UI with analysis results
     */
    function updateAnalysisUI() {
        // Update progress table
        $('#hnai-beauty-you').text(analysisResults.beautyScore);
        $('#hnai-age-you').text(analysisResults.age);
        $('#hnai-gender-you').text(analysisResults.gender);
        $('#hnai-bmi-you').text(analysisResults.bmi);
        $('#hnai-life-you').text(analysisResults.lifeExpectancy + ' years');
        $('#hnai-expression-you').text(analysisResults.emotion);
        $('#hnai-interactions-you').text(mouseInteractions);
        
        // Update individual analysis screens
        $('#hnai-beauty-score').text(analysisResults.beautyScore);
        $('#hnai-beauty-comparison').text('You are more attractive than ' + Math.round(analysisResults.beautyScore * 10) + '% of the population.');
        
        $('#hnai-bmi-value').text(analysisResults.bmi);
        
        $('#hnai-age-value').text(analysisResults.age);
        if (userAge) {
            const ageDiff = Math.abs(userAge - analysisResults.age);
            if (ageDiff > 5) {
                $('#hnai-age-lie').text('Hmm, that\'s quite different from what you told me!');
                $('#hnai-age-lie-you').text('Yes');
            } else {
                $('#hnai-age-lie').text('You didn\'t lie about your age.');
                $('#hnai-age-lie-you').text('No');
            }
        }
        
        $('#hnai-gender-text').text('The algorithm is ' + Math.round(analysisResults.genderProbability * 100) + '% sure that you\'re ' + analysisResults.gender + '.');
        
        // Enhanced emotion display
        const emotionText = analysisResults.emotion.charAt(0).toUpperCase() + analysisResults.emotion.slice(1);
        $('#hnai-emotion-value').text(emotionText);
        
        // Add emotion description based on detected emotion
        let emotionDescription = '';
        switch(analysisResults.emotion) {
            case 'neutral':
                emotionDescription = 'You appear calm and composed. Your face shows little emotional expression.';
                break;
            case 'happy':
                emotionDescription = 'You appear cheerful. The AI detects happiness in your facial expression.';
                break;
            case 'sad':
                emotionDescription = 'You appear melancholic. Your expression suggests sadness.';
                break;
            case 'angry':
                emotionDescription = 'You appear upset. Your expression suggests anger or frustration.';
                break;
            case 'fearful':
                emotionDescription = 'You appear concerned. Your expression suggests worry or fear.';
                break;
            case 'surprised':
                emotionDescription = 'You appear astonished. Your expression shows surprise.';
                break;
            case 'disgusted':
                emotionDescription = 'You appear repulsed. Your expression suggests disgust.';
                break;
            default:
                emotionDescription = 'Your expression is showing ' + emotionText.toLowerCase() + '.';
        }
        
        // Add confidence information
        const confidence = Math.round(analysisResults.emotionProbability * 100);
        emotionDescription += ` (${confidence}% confidence)`;
        
        // Update the description element (add this element in the HTML if it doesn't exist)
        if ($('#hnai-emotion-description').length) {
            $('#hnai-emotion-description').text(emotionDescription);
        } else {
            $('#hnai-emotion-value').after('<p id="hnai-emotion-description" class="hnai-result-description">' + emotionDescription + '</p>');
        }
        
        $('#hnai-life-value').text('You have ' + analysisResults.lifeExpectancy + ' years left to live.');
    }

    /**
     * Calculate final normality score
     */
    function calculateFinalScore() {
        // Base score components
        const components = [];
        
        // Add beauty score component (0-100)
        const beautyPercentile = analysisResults.beautyScore * 10;
        const beautyNormality = 100 - Math.abs(beautyPercentile - 50);
        components.push(Math.max(0, beautyNormality));
        
        // Add BMI component (0-100)
        const idealBmi = 22;
        const bmiNormality = 100 - (Math.abs(analysisResults.bmi - idealBmi) * 5);
        components.push(Math.max(0, bmiNormality));
        
        // Add gender component (0-100)
        const genderNormality = analysisResults.genderProbability * 100;
        components.push(Math.max(0, genderNormality));
        
        // Add emotion component (0-100)
        let emotionNormality = 0;
        if (analysisResults.emotion === 'neutral') {
            emotionNormality = 90;
        } else if (analysisResults.emotion === 'happy') {
            emotionNormality = 70;
        } else {
            emotionNormality = 30;
        }
        components.push(emotionNormality);
        
        // Add interaction component (0-100)
        const interactionNormality = Math.min(100, 100 - Math.abs(mouseInteractions - 20) * 2);
        components.push(Math.max(0, interactionNormality));
        
        // Add life expectancy component (0-100)
        const idealLifeExpectancy = 40;
        const lifeNormality = 100 - (Math.abs(analysisResults.lifeExpectancy - idealLifeExpectancy) * 2);
        components.push(Math.max(0, lifeNormality));
        
        // Calculate average normality (ensure it's between 0 and 100)
        const totalNormality = components.reduce((sum, value) => sum + value, 0) / components.length;
        const finalScore = Math.max(0, Math.min(100, Math.round(totalNormality)));
        
        // Update UI with final score
        $('#hnai-normality-score').text(finalScore + '%');
        
        // Stop detection interval
        clearInterval(detectionInterval);
    }

    /**
     * Draw face print on canvas
     * 
     * @param {Object} detection - Face detection result
     */
    function drawFacePrint(detection) {
        const canvas = document.getElementById('hnai-faceprint-canvas');
        if (!canvas) {
            console.error("Faceprint canvas not found");
            return;
        }
        
        // Make sure canvas is displayed
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        
        // Set dimensions if not already set
        if (canvas.width === 0 || canvas.height === 0) {
            canvas.width = 400;
            canvas.height = 300;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Could not get canvas context");
            return;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!detection || !detection.landmarks || !detection.landmarks.positions) {
            console.error("Invalid detection object or missing landmarks");
            // Draw a message on the canvas
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No face detected. Please center your face in the camera.', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Draw face landmarks
        const landmarks = detection.landmarks.positions;
        
        // Scale landmarks to fit the canvas
        const xValues = landmarks.map(p => p.x);
        const yValues = landmarks.map(p => p.y);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        
        const width = maxX - minX;
        const height = maxY - minY;
        const padding = Math.min(canvas.width, canvas.height) * 0.1;
        
        const scaleX = (canvas.width - padding * 2) / width;
        const scaleY = (canvas.height - padding * 2) / height;
        const scale = Math.min(scaleX, scaleY);
        
        const offsetX = (canvas.width - width * scale) / 2;
        const offsetY = (canvas.height - height * scale) / 2;
        
        const transformPoint = point => ({
            x: (point.x - minX) * scale + offsetX,
            y: (point.y - minY) * scale + offsetY
        });
        
        const scaledLandmarks = landmarks.map(transformPoint);
        
        // Draw dots for each landmark
        ctx.fillStyle = '#1a73e8';
        scaledLandmarks.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Connect landmarks with lines
        ctx.strokeStyle = '#1a73e8';
        ctx.lineWidth = 1;
        
        // Draw face contour
        ctx.beginPath();
        for (let i = 0; i <= 16; i++) {
            const point = scaledLandmarks[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
        
        // Draw eyebrows
        ctx.beginPath();
        for (let i = 17; i <= 21; i++) {
            const point = scaledLandmarks[i];
            if (i === 17) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
        
        ctx.beginPath();
        for (let i = 22; i <= 26; i++) {
            const point = scaledLandmarks[i];
            if (i === 22) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
        
        // Draw nose
        ctx.beginPath();
        for (let i = 27; i <= 35; i++) {
            const point = scaledLandmarks[i];
            if (i === 27 || i === 31) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
            if (i === 30) {
                ctx.stroke();
                ctx.beginPath();
            }
        }
        ctx.stroke();
        
        // Draw eyes
        ctx.beginPath();
        for (let i = 36; i <= 41; i++) {
            const point = scaledLandmarks[i];
            if (i === 36) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        for (let i = 42; i <= 47; i++) {
            const point = scaledLandmarks[i];
            if (i === 42) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Draw mouth
        ctx.beginPath();
        for (let i = 48; i <= 59; i++) {
            const point = scaledLandmarks[i];
            if (i === 48) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        for (let i = 60; i <= 67; i++) {
            const point = scaledLandmarks[i];
            if (i === 60) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    /**
     * Update debug info periodically
     */
    function updateDebugInfo() {
        if (!video) return;
        
        $('#hnai-video-dimensions').text(
            (video.videoWidth || 0) + 'x' + (video.videoHeight || 0) + 
            ' (' + (video.clientWidth || 0) + 'x' + (video.clientHeight || 0) + ')'
        );
        
        // Add more detailed info for troubleshooting
        const debugInfo = $('#hnai-debug-info');
        
        // Check if stream is active
        let streamActive = false;
        if (video && video.srcObject && video.srcObject.active) {
            streamActive = true;
        }
        
        // Safely check if video is paused
        let isPlaying = false;
        if (video && typeof video.paused !== 'undefined') {
            isPlaying = !video.paused;
        }
        
        // Build debug message
        const debugMsg = [
            'Ready: ' + (isModelLoaded ? 'Yes' : 'No'),
            'Stream: ' + (streamActive ? 'Active' : 'Inactive'),
            'Playing: ' + (isPlaying ? 'Yes' : 'No')
        ].join('<br>');
        
        // Add or update the detailed debug info
        if (debugInfo.find('.debug-details').length) {
            debugInfo.find('.debug-details').html(debugMsg);
        } else {
            debugInfo.append('<div class="debug-details">' + debugMsg + '</div>');
        }
    }

    // Initialize the manual start button after document is ready
    $(document).ready(function() {
        // Create a direct "Click to Start" button for browsers that need user interaction
        const startButton = $('<button id="hnai-manual-start" class="hnai-btn" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;">Click to Start Camera</button>');
        $('.hnai-camera-container').append(startButton);
        
        // Bind click event handler using delegated event handling
        $(document).on('click', '#hnai-manual-start', function() {
            console.log("Manual start button clicked");
            
            // Show loading message
            $('#hnai-video-status').text('Starting camera...');
            $('#hnai-loading-message').text('Initializing camera...');
            updateLoadingProgress(10);
            
            // Add a loading class to the button
            $(this).addClass('hnai-btn-loading').text('Starting Camera...').prop('disabled', true);
            
            // Add a timeout for slow loading
            const loadingTimeout = setTimeout(function() {
                // If loading is taking too long, show a helpful message
                $('#hnai-loading-message').html(`
                    Loading is taking longer than expected.<br>
                    This is normal for the first run as models need to be downloaded.
                `);
                $('.hnai-loading-help-text').html(`
                    <strong>Please be patient.</strong> The facial analysis models are large and need time to load.
                    If loading fails, try refreshing the page or using a different browser.
                `);
            }, 10000); // 10 seconds
            
            // Check if video element exists
            if (!video) {
                console.error("Video element not initialized yet");
                $('#hnai-video-status').text('Video not initialized');
                clearTimeout(loadingTimeout);
                $(this).removeClass('hnai-btn-loading').text('Click to Start Camera').prop('disabled', false);
                return;
            }
            
            // Try to play the video directly
            try {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(function() {
                        console.log("Manual video start successful");
                        $('#hnai-video-status').text('Manual start successful');
                        $('#hnai-manual-start').remove();
                        clearTimeout(loadingTimeout);
                    }).catch(function(err) {
                        console.error("Manual video start failed:", err);
                        $('#hnai-video-status').text('Manual start failed');
                        clearTimeout(loadingTimeout);
                        
                        // Re-enable the button for retry
                        $('#hnai-manual-start').removeClass('hnai-btn-loading').text('Retry Camera Start').prop('disabled', false);
                        
                        // If video still fails to play, recreate the video element
                        tryRecreateVideo();
                    });
                }
            } catch (err) {
                console.error("Error during manual start:", err);
                $('#hnai-video-status').text('Error during manual start');
                clearTimeout(loadingTimeout);
                
                // Re-enable the button for retry
                $('#hnai-manual-start').removeClass('hnai-btn-loading').text('Retry Camera Start').prop('disabled', false);
                
                tryRecreateVideo();
            }
        });
    });
    
    // Add a timeout to check if video is displaying correctly - with safety checks
    setTimeout(function() {
        // Make sure video exists before checking properties
        if (!video) {
            console.warn("Video element not defined yet");
            $('#hnai-video-status').text('Video not defined');
            return;
        }
        
        // Safely check if video is working
        const isVideoPaused = typeof video.paused !== 'undefined' ? video.paused : true;
        const hasNoVideoData = typeof video.videoWidth !== 'undefined' ? (video.videoWidth === 0) : true;
        
        if (isVideoPaused || hasNoVideoData) {
            console.warn("Video not playing correctly after timeout");
            $('#hnai-video-status').text('Not playing after timeout');
            // Show manual start button prominently
            $('#hnai-manual-start').css({
                'background-color': '#f00',
                'color': '#fff',
                'font-weight': 'bold',
                'padding': '15px 30px',
                'font-size': '18px'
            });
        } else {
            console.log("Video appears to be playing correctly");
            // Remove manual start button if video is playing
            $('#hnai-manual-start').remove();
        }
    }, 3000);

    /**
     * Try to recreate the video element as a last resort
     */
    function tryRecreateVideo() {
        console.log("Attempting to recreate video element");
        $('#hnai-video-status').text('Recreating video element');
        
        // Safety check for video element
        if (!video) {
            console.error("Cannot recreate video element - original video is undefined");
            $('#hnai-video-status').text('Video element undefined');
            
            // Try to find and use the existing video element instead
            const existingVideo = document.getElementById('hnai-video');
            if (existingVideo) {
                console.log("Found existing video element in DOM");
                video = existingVideo;
            } else {
                // Create a new video element from scratch
                console.log("Creating brand new video element");
                const newVideo = document.createElement('video');
                newVideo.id = 'hnai-video';
                newVideo.setAttribute('playsinline', '');
                newVideo.setAttribute('autoplay', '');
                newVideo.setAttribute('muted', '');
                newVideo.style.display = 'block';
                newVideo.style.minHeight = '480px';
                newVideo.style.zIndex = '2';
                newVideo.style.position = 'relative';
                newVideo.style.width = '100%';
                newVideo.style.height = 'auto';
                newVideo.style.backgroundColor = '#000';
                
                // Find camera container and append
                $('.hnai-camera-container').prepend(newVideo);
                video = newVideo;
            }
        } else {
            // Create a new video element
            const oldVideo = video;
            
            // Create replacement video element
            const newVideo = document.createElement('video');
            newVideo.id = 'hnai-video';
            newVideo.setAttribute('playsinline', '');
            newVideo.setAttribute('autoplay', '');
            newVideo.setAttribute('muted', '');
            newVideo.style.display = 'block';
            newVideo.style.minHeight = '480px';
            newVideo.style.zIndex = '2';
            newVideo.style.position = 'relative';
            newVideo.style.width = '100%';
            newVideo.style.height = 'auto';
            newVideo.style.backgroundColor = '#000';
            
            // Replace old video with new one
            $(oldVideo).replaceWith(newVideo);
            
            // Update reference
            video = newVideo;
        }
        
        // Try to get camera stream again
        navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: 'user'
            }
        }).then(function(stream) {
            console.log("Got stream after recreation");
            $('#hnai-video-status').text('Got stream after recreation');
            
            // Apply stream to new video
            video.srcObject = stream;
            
            // Try to play
            video.play().then(function() {
                console.log("Recreated video playing successfully");
                $('#hnai-video-status').text('Recreated video playing');
                
                // Set up event listeners
                video.addEventListener('loadedmetadata', function() {
                    console.log("Recreated video metadata loaded");
                    displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
                    
                    // Safely check if canvas is defined
                    if (canvas) {
                        try {
                            faceapi.matchDimensions(canvas, displaySize);
                            loadModels();
                        } catch (e) {
                            console.error("Error setting up canvas after recreation:", e);
                        }
                    } else {
                        console.error("Canvas element is undefined during recreation");
                    }
                });
                
            }).catch(function(err) {
                console.error("Failed to play recreated video:", err);
                $('#hnai-video-status').text('Failed to play recreated video');
                
                // Show error message
                $('.hnai-loading-models').addClass('hnai-hidden');
                $('.hnai-camera-error').removeClass('hnai-hidden');
            });
            
        }).catch(function(err) {
            console.error("Failed to get stream for recreated video:", err);
            $('#hnai-video-status').text('Failed to get stream for recreation');
            
            // Show error message
            $('.hnai-loading-models').addClass('hnai-hidden');
            $('.hnai-camera-error').removeClass('hnai-hidden');
        });
    }

    /**
     * Update the progress step indicator
     * 
     * @param {number} step - Current step number (1-3)
     */
    function updateProgressIndicator(step) {
        console.log("Updating progress indicator to step: " + step);
        
        // Ensure step is between 1 and 3
        step = Math.max(1, Math.min(3, step));
        
        // Remove all active and completed classes
        $('.hnai-step').removeClass('hnai-step-active hnai-step-completed');
        
        // Mark current step as active
        $('.hnai-step').eq(step - 1).addClass('hnai-step-active');
        
        // Mark previous steps as completed
        for (let i = 0; i < step - 1; i++) {
            $('.hnai-step').eq(i).addClass('hnai-step-completed');
        }
        
        // Debug output of current steps
        console.log("Current step elements:", $('.hnai-step').length);
        $('.hnai-step').each(function(index) {
            console.log("Step " + (index + 1) + " classes: " + $(this).attr('class'));
        });
    }
    
    /**
     * Get the progress step number based on the screen index
     * 
     * @param {number} screenIndex - Current screen index
     * @return {number} - Current progress step (1-3)
     */
    function getProgressStep(screenIndex) {
        // Map screen indexes to progress steps
        if (screenIndex <= 2) return 1;       // Intro, camera, age input = step 1
        if (screenIndex === 3) return 2;      // Progress screen = step 2
        if (screenIndex >= 4 && screenIndex < screens.length - 1) return 3; // Analysis screens = step 3
        return 3;                             // Default to step 3 for results screen
    }

    /**
     * Update the analysis counter shown on analysis screens
     * 
     * @param {number} current - Current analysis number
     * @param {number} total - Total number of analyses
     */
    function updateAnalysisCounter(current, total) {
        $('.hnai-current-analysis').text(current);
        $('.hnai-total-analyses').text(total);
    }

    /**
     * Create mini floating camera preview element
     */
    function createMiniPreview() {
        // Only create it once
        if ($('#hnai-mini-preview').length) return;
        
        const miniPreview = $(`
            <div class="hnai-mini-preview" id="hnai-mini-preview">
                <div class="hnai-mini-preview-header" id="hnai-mini-preview-header">
                    <div class="hnai-mini-preview-title">摄像头预览</div>
                    <button class="hnai-mini-preview-toggle" id="hnai-mini-preview-close">×</button>
                </div>
                <div class="hnai-mini-preview-container">
                    <video id="hnai-mini-preview-video" playsinline autoplay muted></video>
                    <canvas id="hnai-mini-preview-canvas"></canvas>
                </div>
            </div>
        `);
        
        // Create toggle button
        const toggleButton = $(`
            <button class="hnai-preview-toggle-btn" id="hnai-preview-toggle-btn">
                <i>👁️</i>
            </button>
        `);
        
        // Append elements to body
        $('body').append(miniPreview);
        $('body').append(toggleButton);
        
        // Add event listeners
        $('#hnai-preview-toggle-btn').on('click', toggleMiniPreview);
        $('#hnai-mini-preview-close').on('click', toggleMiniPreview);
        
        // Implement dragging functionality
        const header = document.getElementById('hnai-mini-preview-header');
        const preview = document.getElementById('hnai-mini-preview');
        
        if (header && preview) {
            let isDragging = false;
            let offsetX, offsetY;
            
            header.addEventListener('mousedown', startDrag);
            header.addEventListener('touchstart', startDrag, { passive: false });
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false });
            
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
            
            function startDrag(e) {
                isDragging = true;
                
                if (e.type === 'touchstart') {
                    offsetX = e.touches[0].clientX - preview.getBoundingClientRect().left;
                    offsetY = e.touches[0].clientY - preview.getBoundingClientRect().top;
                    e.preventDefault();
                } else {
                    offsetX = e.clientX - preview.getBoundingClientRect().left;
                    offsetY = e.clientY - preview.getBoundingClientRect().top;
                }
            }
            
            function drag(e) {
                if (!isDragging) return;
                
                let clientX, clientY;
                
                if (e.type === 'touchmove') {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                    e.preventDefault();
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                
                // Calculate new position
                let left = clientX - offsetX;
                let top = clientY - offsetY;
                
                // Constrain to window
                const maxX = window.innerWidth - preview.offsetWidth;
                const maxY = window.innerHeight - preview.offsetHeight;
                
                left = Math.max(0, Math.min(left, maxX));
                top = Math.max(0, Math.min(top, maxY));
                
                // Apply new position
                preview.style.left = left + 'px';
                preview.style.top = top + 'px';
                preview.style.right = 'auto';
                preview.style.bottom = 'auto';
            }
            
            function stopDrag() {
                isDragging = false;
            }
        }
    }
    
    /**
     * Toggle mini preview visibility
     */
    function toggleMiniPreview() {
        const miniPreview = $('#hnai-mini-preview');
        
        if (miniPreview.hasClass('active')) {
            miniPreview.removeClass('active');
            // Show original preview if it exists
            $('.hnai-camera-preview').show();
        } else {
            miniPreview.addClass('active');
            setupMiniPreview();
            // Hide original preview if it exists
            if (isMobileDevice()) {
                $('.hnai-camera-preview').hide();
            }
        }
    }
    
    /**
     * Setup mini preview with video stream
     */
    function setupMiniPreview() {
        if (!video || !video.srcObject) return;
        
        const miniVideo = document.getElementById('hnai-mini-preview-video');
        const miniCanvas = document.getElementById('hnai-mini-preview-canvas');
        
        if (!miniVideo || !miniCanvas) return;
        
        // Clone the main video stream to the mini preview
        miniVideo.srcObject = video.srcObject;
        miniVideo.play().catch(e => console.error("Error playing mini preview video:", e));
        
        // Set up canvas for mini preview
        const miniCtx = miniCanvas.getContext('2d');
        
        // Match canvas dimensions to video
        miniCanvas.width = miniVideo.clientWidth;
        miniCanvas.height = miniVideo.clientHeight;
        
        // Set up interval to redraw face detection on the mini preview
        const miniInterval = setInterval(function() {
            if (!miniVideo || miniVideo.paused || !isModelLoaded) return;
            
            // Clear canvas
            miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
            
            // If we have detections, draw them on the mini preview
            if (lastDetections && lastDetections.length > 0) {
                try {
                    // Scale detections to fit mini preview size
                    const scaleFactor = miniVideo.clientWidth / displaySize.width;
                    const scaledDetections = lastDetections.map(detection => {
                        if (!detection || !detection.box) return null;
                        
                        return {
                            ...detection,
                            box: {
                                x: detection.box.x * scaleFactor,
                                y: detection.box.y * scaleFactor,
                                width: detection.box.width * scaleFactor,
                                height: detection.box.height * scaleFactor
                            }
                        };
                    }).filter(Boolean);
                    
                    // Draw detection box
                    miniCtx.strokeStyle = '#1a73e8';
                    miniCtx.lineWidth = 2;
                    scaledDetections.forEach(detection => {
                        miniCtx.strokeRect(
                            detection.box.x,
                            detection.box.y,
                            detection.box.width,
                            detection.box.height
                        );
                    });
                } catch (e) {
                    console.error("Error drawing detections on mini preview:", e);
                }
            }
        }, 100);
        
        // Store interval ID to clear it when closing mini preview
        previewIntervals.push(miniInterval);
    }
    
    /**
     * Check if user is on a mobile device
     * @returns {boolean} True if mobile device
     */
    function isMobileDevice() {
        return (window.innerWidth <= 768) || 
               (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
    
    /**
     * Auto-enable mini preview for mobile devices
     */
    function checkMobileAndEnableMiniPreview() {
        if (isMobileDevice()) {
            // Only enable on analysis screens
            if (currentStep >= 4 && currentStep < screens.length - 1) {
                if (!$('#hnai-mini-preview').hasClass('active')) {
                    toggleMiniPreview();
                }
            }
        }
    }

})(jQuery);