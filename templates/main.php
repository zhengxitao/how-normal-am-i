<?php
/**
 * Main template for the How Normal Am I plugin
 * 
 * This template is loaded when the [how_normal_am_i] shortcode is used.
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="hnai-container" id="hnai-container">
    <!-- Introduction screen -->
    <div class="hnai-screen" id="hnai-intro-screen">
        <div class="hnai-header">
            <h2><?php _e('How Normal Am I?', 'how-normal-am-i'); ?></h2>
            <p><?php _e('Experience how AI judges your face', 'how-normal-am-i'); ?></p>
        </div>
        <div class="hnai-content">
            <p><?php _e('Access to your camera is necessary, but no personal data is collected.', 'how-normal-am-i'); ?></p>
            <div class="hnai-terms">
                <input type="checkbox" id="hnai-terms-checkbox">
                <label for="hnai-terms-checkbox"><?php _e('I agree to the terms and conditions', 'how-normal-am-i'); ?></label>
                <div class="hnai-terms-content">
                    <h3><?php _e('Terms and conditions', 'how-normal-am-i'); ?></h3>
                    <div class="hnai-terms-text">
                        <?php echo wp_kses_post($options['terms_and_conditions']); ?>
                    </div>
                </div>
            </div>
            <button id="hnai-start-btn" class="hnai-btn" disabled><?php _e('Start the show ›', 'how-normal-am-i'); ?></button>
            <p class="hnai-mobile-note"><?php _e('On iPhone and iPad this experience only works in the Safari browser. Apple doesn\'t allow other browsers to access the camera.', 'how-normal-am-i'); ?></p>
        </div>
    </div>

    <!-- Camera access screen -->
    <div class="hnai-screen hnai-hidden" id="hnai-camera-screen">
        <div class="hnai-camera-container">
            <!-- Canvas should be below video in the DOM order -->
            <canvas id="hnai-canvas" style="position:absolute; top:0; left:0; z-index:1;"></canvas>
            <!-- Video on top so it's visible -->
            <video id="hnai-video" playsinline autoplay muted 
                   style="display:block; min-height:480px; z-index:2; position:relative; width:100%; height:auto; background-color:#000;"></video>
            
            <div class="hnai-loading-models">
                <div class="hnai-loader"></div>
                <h3><?php _e('Loading AI Models...', 'how-normal-am-i'); ?></h3>
                <p id="hnai-loading-message"><?php _e('Please wait while we initialize the face detection models...', 'how-normal-am-i'); ?></p>
                <div class="hnai-loading-progress-container">
                    <div class="hnai-loading-progress-bar">
                        <div id="hnai-loading-progress" style="width: 0%"></div>
                    </div>
                    <div id="hnai-loading-percentage">0%</div>
                </div>
                <p class="hnai-loading-help-text"><?php _e('This may take a few moments depending on your connection speed.', 'how-normal-am-i'); ?></p>
            </div>
            <div class="hnai-camera-error hnai-hidden">
                <h3><?php _e('Unable to access camera :(', 'how-normal-am-i'); ?></h3>
                <p><?php _e('It seems the page couldn\'t access your camera. You won\'t be able to experience the show, sorry.', 'how-normal-am-i'); ?></p>
                <p><?php _e('You could try using a different browser?', 'how-normal-am-i'); ?></p>
            </div>
            <!-- Debug information -->
            <div id="hnai-debug-info" style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.7); color:white; padding:5px; font-size:12px; z-index:1000;">
                <div>Status: <span id="hnai-video-status">Initializing...</span></div>
                <div>Dimensions: <span id="hnai-video-dimensions">0x0</span></div>
            </div>
        </div>
    </div>

    <!-- Age input screen -->
    <div class="hnai-screen hnai-hidden" id="hnai-age-input-screen">
        <div class="hnai-header">
            <h2><?php _e('May I ask how old you are?', 'how-normal-am-i'); ?></h2>
            <p class="hnai-screen-description"><?php _e('This helps our AI compare your predicted age with your actual age.', 'how-normal-am-i'); ?></p>
            <div class="hnai-steps-indicator">
                <span class="hnai-step hnai-step-active">1</span>
                <span class="hnai-step">2</span>
                <span class="hnai-step">3</span>
            </div>
        </div>
        <div class="hnai-content">
            <p class="hnai-instruction-text"><?php _e('Select your age from the options below:', 'how-normal-am-i'); ?></p>
            <div class="hnai-age-selector">
                <?php 
                for ($i = 10; $i <= 95; $i += 5) {
                    echo '<div class="hnai-age-option" data-age="' . $i . '">' . $i . '</div>';
                }
                ?>
            </div>
            <div class="hnai-button-container">
                <button id="hnai-continue-age-btn" class="hnai-btn" disabled><?php _e('Continue with Selected Age', 'how-normal-am-i'); ?></button>
                <button id="hnai-skip-age-btn" class="hnai-btn hnai-btn-secondary"><?php _e('Continue without Sharing Age', 'how-normal-am-i'); ?></button>
            </div>
            <p class="hnai-note"><?php _e('Your selection is only used for this analysis and is not stored.', 'how-normal-am-i'); ?></p>
        </div>
    </div>

    <!-- Progress screen -->
    <div class="hnai-screen hnai-hidden" id="hnai-progress-screen">
        <div class="hnai-header">
            <h2><?php _e('Your Analysis Progress', 'how-normal-am-i'); ?></h2>
            <p class="hnai-screen-description"><?php _e('Our AI is analyzing your features and collecting data for comparison.', 'how-normal-am-i'); ?></p>
            <div class="hnai-steps-indicator">
                <span class="hnai-step hnai-step-completed">1</span>
                <span class="hnai-step hnai-step-active">2</span>
                <span class="hnai-step">3</span>
            </div>
        </div>
        <div class="hnai-content">
            <div class="hnai-analyzing-message">
                <div class="hnai-loader"></div>
                <p><?php _e('Analyzing facial features...', 'how-normal-am-i'); ?></p>
            </div>
            <div class="hnai-progress-container">
                <h3><?php _e('Data Collection Summary', 'how-normal-am-i'); ?></h3>
                <div class="hnai-progress-table">
                    <div class="hnai-progress-header">
                        <div class="hnai-progress-column"><?php _e('Metric', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column"><?php _e('You', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column"><?php _e('Others', 'how-normal-am-i'); ?></div>
                    </div>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Read terms?', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-terms-read-you">-</div>
                        <div class="hnai-progress-column"><?php _e('No', 'how-normal-am-i'); ?></div>
                    </div>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Shared age?', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-age-shared-you">-</div>
                        <div class="hnai-progress-column"><?php _e('No', 'how-normal-am-i'); ?></div>
                    </div>
                    <?php if ($options['enable_beauty_score'] === 'yes'): ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Beauty', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-beauty-you">...</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <?php endif; ?>
                    <?php if ($options['enable_age_prediction'] === 'yes'): ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Age', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-age-you">...</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Lied about age?', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-age-lie-you">No</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <?php endif; ?>
                    <?php if ($options['enable_gender_recognition'] === 'yes'): ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Gender', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-gender-you">...</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <?php endif; ?>
                    <?php if ($options['enable_bmi_estimation'] === 'yes'): ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('BMI', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-bmi-you">...</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <?php endif; ?>
                    <?php if ($options['enable_life_expectancy'] === 'yes'): ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Life expectancy', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-life-you">...</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <?php endif; ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Came closer?', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-closer-you">No</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <?php if ($options['enable_emotion_detection'] === 'yes'): ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Expression', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-expression-you">...</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <?php endif; ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Interactions', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-interactions-you">...</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Curious', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-curious-you">Yes</div>
                        <div class="hnai-progress-column"><?php _e('No', 'how-normal-am-i'); ?></div>
                    </div>
                    <?php if ($options['enable_data_sharing'] === 'yes'): ?>
                    <div class="hnai-progress-row">
                        <div class="hnai-progress-column"><?php _e('Shared data?', 'how-normal-am-i'); ?></div>
                        <div class="hnai-progress-column" id="hnai-shared-data-you">...</div>
                        <div class="hnai-progress-column">...</div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <p class="hnai-note"><?php _e('We\'ll automatically continue to the analysis results when ready.', 'how-normal-am-i'); ?></p>
        </div>
    </div>

    <!-- Analysis screens - Each will be shown in sequence -->
    <?php if ($options['enable_beauty_score'] === 'yes'): ?>
    <div class="hnai-screen hnai-hidden" id="hnai-beauty-screen">
        <div class="hnai-header">
            <h2><?php _e('Your Beauty Score', 'how-normal-am-i'); ?></h2>
            <p class="hnai-screen-description"><?php _e('Our AI analyzes facial symmetry and proportions to calculate an attractiveness score.', 'how-normal-am-i'); ?></p>
            <div class="hnai-steps-indicator">
                <span class="hnai-step hnai-step-completed">1</span>
                <span class="hnai-step hnai-step-completed">2</span>
                <span class="hnai-step hnai-step-active">3</span>
            </div>
            <div class="hnai-analysis-counter">
                <span class="hnai-current-analysis">1</span>/<span class="hnai-total-analyses">5</span>
            </div>
        </div>
        <div class="hnai-content">
            <div class="hnai-analysis-layout">
                <!-- Camera preview section -->
                <div class="hnai-camera-preview">
                    <h3><?php _e('Live Camera', 'how-normal-am-i'); ?></h3>
                    <div class="hnai-camera-preview-container">
                        <video id="hnai-preview-video" playsinline autoplay muted></video>
                        <canvas id="hnai-preview-canvas"></canvas>
                    </div>
                    <p class="hnai-camera-tip"><?php _e('Move closer or adjust angle to see how it affects your score.', 'how-normal-am-i'); ?></p>
                </div>
                
                <!-- Analysis result section -->
                <div class="hnai-analysis-results">
                    <div class="hnai-beauty-score">
                        <div class="hnai-score-container">
                            <div class="hnai-score-label"><?php _e('Your Score (scale from 0 to 10)', 'how-normal-am-i'); ?></div>
                            <div class="hnai-score-value" id="hnai-beauty-score">...</div>
                        </div>
                        <div class="hnai-result-explanation">
                            <p><?php _e('This score is calculated based on the golden ratio, facial symmetry, and other mathematical proportions.', 'how-normal-am-i'); ?></p>
                        </div>
                        <div class="hnai-beauty-comparison" id="hnai-beauty-comparison">
                            <p><?php _e('You are more attractive than ...% of the population.', 'how-normal-am-i'); ?></p>
                        </div>
                        <div class="hnai-beauty-tip">
                            <p><strong><?php _e('Tip:', 'how-normal-am-i'); ?></strong> <?php _e('Try different lighting or expressions to see changes in your score.', 'how-normal-am-i'); ?></p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="hnai-button-container">
                <button class="hnai-btn hnai-continue-btn"><?php _e('Continue to Next Analysis', 'how-normal-am-i'); ?></button>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($options['enable_bmi_estimation'] === 'yes'): ?>
    <div class="hnai-screen hnai-hidden" id="hnai-bmi-screen">
        <div class="hnai-header">
            <h2><?php _e('BMI Analysis', 'how-normal-am-i'); ?></h2>
            <p class="hnai-screen-description"><?php _e('Our AI estimates your BMI based on facial features and proportions.', 'how-normal-am-i'); ?></p>
            <div class="hnai-steps-indicator">
                <span class="hnai-step hnai-step-completed">1</span>
                <span class="hnai-step hnai-step-completed">2</span>
                <span class="hnai-step hnai-step-active">3</span>
            </div>
            <div class="hnai-analysis-counter">
                <span class="hnai-current-analysis">2</span>/<span class="hnai-total-analyses">5</span>
            </div>
        </div>
        <div class="hnai-content">
            <div class="hnai-analysis-layout">
                <!-- Camera preview section -->
                <div class="hnai-camera-preview">
                    <h3><?php _e('Live Camera', 'how-normal-am-i'); ?></h3>
                    <div class="hnai-camera-preview-container">
                        <video id="hnai-preview-video-bmi" playsinline autoplay muted></video>
                        <canvas id="hnai-preview-canvas-bmi"></canvas>
                    </div>
                    <p class="hnai-camera-tip"><?php _e('Adjusting your pose can change the BMI estimation.', 'how-normal-am-i'); ?></p>
                </div>
                
                <!-- Analysis result section -->
                <div class="hnai-analysis-results">
                    <div class="hnai-bmi-result">
                        <div class="hnai-score-container">
                            <div class="hnai-score-label"><?php _e('Estimated BMI', 'how-normal-am-i'); ?></div>
                            <div class="hnai-score-value" id="hnai-bmi-value">...</div>
                        </div>
                        <div class="hnai-result-explanation">
                            <p><?php _e('BMI is estimated based on facial roundness, fullness, and other features that may correlate with body mass index.', 'how-normal-am-i'); ?></p>
                        </div>
                        <div class="hnai-bmi-comparison" id="hnai-bmi-comparison">
                            <p><?php _e('The average BMI worldwide is 24.7.', 'how-normal-am-i'); ?></p>
                        </div>
                        <div class="hnai-bmi-tip">
                            <p><strong><?php _e('Tip:', 'how-normal-am-i'); ?></strong> <?php _e('Try raising your eyebrows or tilting your head to see how it affects the estimate.', 'how-normal-am-i'); ?></p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="hnai-button-container">
                <button class="hnai-btn hnai-continue-btn"><?php _e('Continue to Next Analysis', 'how-normal-am-i'); ?></button>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($options['enable_age_prediction'] === 'yes'): ?>
    <div class="hnai-screen hnai-hidden" id="hnai-age-screen">
        <div class="hnai-header">
            <h2><?php _e('Age Prediction', 'how-normal-am-i'); ?></h2>
            <p class="hnai-screen-description"><?php _e('Our AI analyzes your facial features to estimate your age.', 'how-normal-am-i'); ?></p>
            <div class="hnai-steps-indicator">
                <span class="hnai-step hnai-step-completed">1</span>
                <span class="hnai-step hnai-step-completed">2</span>
                <span class="hnai-step hnai-step-active">3</span>
            </div>
            <div class="hnai-analysis-counter">
                <span class="hnai-current-analysis">3</span>/<span class="hnai-total-analyses">5</span>
            </div>
        </div>
        <div class="hnai-content">
            <div class="hnai-analysis-layout">
                <!-- Camera preview section -->
                <div class="hnai-camera-preview">
                    <h3><?php _e('Live Camera', 'how-normal-am-i'); ?></h3>
                    <div class="hnai-camera-preview-container">
                        <video id="hnai-preview-video-age" playsinline autoplay muted></video>
                        <canvas id="hnai-preview-canvas-age"></canvas>
                    </div>
                    <p class="hnai-camera-tip"><?php _e('Different expressions or angles can make you appear younger or older.', 'how-normal-am-i'); ?></p>
                </div>
                
                <!-- Analysis result section -->
                <div class="hnai-analysis-results">
                    <div class="hnai-age-result">
                        <div class="hnai-score-container">
                            <div class="hnai-score-label"><?php _e('AI Predicted Age', 'how-normal-am-i'); ?></div>
                            <div class="hnai-score-value" id="hnai-age-value">...</div>
                        </div>
                        <div class="hnai-result-explanation">
                            <p><?php _e('This prediction is based on facial markers like wrinkles, skin texture, and facial proportions that change with age.', 'how-normal-am-i'); ?></p>
                        </div>
                        <?php if (true): // Always show this section regardless of whether user shared age ?>
                        <div class="hnai-age-lie" id="hnai-age-lie">
                            <p><?php _e('You didn\'t lie about your age.', 'how-normal-am-i'); ?></p>
                        </div>
                        <?php endif; ?>
                        <div class="hnai-age-tip">
                            <p><strong><?php _e('Tip:', 'how-normal-am-i'); ?></strong> <?php _e('Try smiling or raising your eyebrows to see if it makes you look younger or older.', 'how-normal-am-i'); ?></p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="hnai-button-container">
                <button class="hnai-btn hnai-continue-btn"><?php _e('Continue to Next Analysis', 'how-normal-am-i'); ?></button>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($options['enable_gender_recognition'] === 'yes'): ?>
    <div class="hnai-screen hnai-hidden" id="hnai-gender-screen">
        <div class="hnai-header">
            <h2><?php _e('Gender', 'how-normal-am-i'); ?></h2>
        </div>
        <div class="hnai-content">
            <div class="hnai-gender-result">
                <p id="hnai-gender-text"><?php _e('The algorithm is ...% sure that you\'re ...', 'how-normal-am-i'); ?></p>
            </div>
            <button class="hnai-btn hnai-continue-btn"><?php _e('Continue', 'how-normal-am-i'); ?></button>
        </div>
    </div>
    <?php endif; ?>

    <!-- Face print screen -->
    <div class="hnai-screen hnai-hidden" id="hnai-faceprint-screen">
        <div class="hnai-header">
            <h2><?php _e('Your face print', 'how-normal-am-i'); ?></h2>
        </div>
        <div class="hnai-content">
            <div class="hnai-faceprint-container">
                <canvas id="hnai-faceprint-canvas"></canvas>
                <p><?php _e('This is a digital \'finger print\' of your face.', 'how-normal-am-i'); ?></p>
            </div>
            <button class="hnai-btn hnai-continue-btn"><?php _e('Continue', 'how-normal-am-i'); ?></button>
        </div>
    </div>

    <?php if ($options['enable_emotion_detection'] === 'yes'): ?>
    <div class="hnai-screen hnai-hidden" id="hnai-emotion-screen">
        <div class="hnai-header">
            <h2><?php _e('Interactions', 'how-normal-am-i'); ?></h2>
        </div>
        <div class="hnai-content">
            <div class="hnai-emotion-container">
                <div class="hnai-mouse-tracker">
                    <p><?php _e('You interacted with this page ... times.', 'how-normal-am-i'); ?></p>
                </div>
                <div class="hnai-emotion-result">
                    <p><?php _e('The dominant expression on your face is currently:', 'how-normal-am-i'); ?> <span id="hnai-emotion-value">...</span></p>
                </div>
            </div>
            <button class="hnai-btn hnai-continue-btn"><?php _e('Continue', 'how-normal-am-i'); ?></button>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($options['enable_life_expectancy'] === 'yes'): ?>
    <div class="hnai-screen hnai-hidden" id="hnai-life-screen">
        <div class="hnai-header">
            <h2><?php _e('Life expectancy', 'how-normal-am-i'); ?></h2>
        </div>
        <div class="hnai-content">
            <div class="hnai-life-result">
                <p id="hnai-life-value"><?php _e('You have ... years left to live.', 'how-normal-am-i'); ?></p>
            </div>
            <button class="hnai-btn hnai-continue-btn"><?php _e('Continue', 'how-normal-am-i'); ?></button>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($options['enable_data_sharing'] === 'yes'): ?>
    <!-- Data sharing screen -->
    <div class="hnai-screen hnai-hidden" id="hnai-data-screen">
        <div class="hnai-header">
            <h2><?php _e('Before your score is revealed...', 'how-normal-am-i'); ?></h2>
        </div>
        <div class="hnai-content">
            <p><?php _e('Will you allow the anonymous data in the list above to be used to calculate a new average? It will shift what this test considers to be \'normal\' in your direction.', 'how-normal-am-i'); ?></p>
            <div class="hnai-data-buttons">
                <button id="hnai-share-yes" class="hnai-btn"><?php _e('OK', 'how-normal-am-i'); ?></button>
                <button id="hnai-share-no" class="hnai-btn hnai-btn-secondary"><?php _e('No', 'how-normal-am-i'); ?></button>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Results screen -->
    <div class="hnai-screen hnai-hidden" id="hnai-results-screen">
        <div class="hnai-header">
            <h2><?php _e('Your Normality Score', 'how-normal-am-i'); ?></h2>
            <p class="hnai-screen-description"><?php _e('Based on all the AI analysis, here\'s how normal you are...', 'how-normal-am-i'); ?></p>
            <div class="hnai-steps-indicator">
                <span class="hnai-step hnai-step-completed">1</span>
                <span class="hnai-step hnai-step-completed">2</span>
                <span class="hnai-step hnai-step-completed">3</span>
            </div>
        </div>
        <div class="hnai-content">
            <div class="hnai-final-score-container">
                <div class="hnai-final-score">
                    <div id="hnai-normality-score">0%</div>
                    <div class="hnai-normality-label"><?php _e('Normal', 'how-normal-am-i'); ?></div>
                </div>
                <div class="hnai-score-explanation">
                    <p><?php _e('This score represents how closely your facial features, expressions, and characteristics align with the average values in our database.', 'how-normal-am-i'); ?></p>
                    <p><?php _e('Remember, being "normal" is just a statistical concept - the uniqueness of each person is what makes humans interesting!', 'how-normal-am-i'); ?></p>
                </div>
            </div>
            
            <div class="hnai-share-section">
                <h3><?php _e('Share Your Results', 'how-normal-am-i'); ?></h3>
                <p><?php _e('Let others know how normal (or not) you are according to AI!', 'how-normal-am-i'); ?></p>
                <div class="hnai-share-buttons">
                    <a href="#" class="hnai-share-btn hnai-share-twitter" id="hnai-share-twitter"><?php _e('Share on Twitter', 'how-normal-am-i'); ?></a>
                    <a href="#" class="hnai-share-btn hnai-share-facebook" id="hnai-share-facebook"><?php _e('Share on Facebook', 'how-normal-am-i'); ?></a>
                </div>
            </div>
            
            <div class="hnai-button-container">
                <button id="hnai-restart-btn" class="hnai-btn"><?php _e('Try Again', 'how-normal-am-i'); ?></button>
            </div>
            
            <p class="hnai-disclaimer"><?php _e('Disclaimer: This AI analysis is for entertainment purposes only and not scientifically validated.', 'how-normal-am-i'); ?></p>
        </div>
    </div>
</div> 