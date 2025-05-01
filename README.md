# How Normal Am I - WordPress Plugin | AI Beauty Analyzer

A WordPress plugin that delivers an AI attractiveness test and face beauty analyzer. This "How Normal Am I" AI tool evaluates beauty score, age, gender, BMI, emotions, and expected lifespan through facial analysis. This interactive experience provides users with insights about how AI systems rate your face and assess facial characteristics.

## Description

The **HowNormalAmI** plugin (popular on Reddit as "how normal am i reddit") uses face-api.js library to perform client-side facial analysis without sending any images to external servers. All processing happens in the user's browser, making it a privacy-focused AI beauty rating experience.

Key features of this AI face test:

- **Face Detection**: Uses TinyFaceDetector for efficient real-time face detection
- **AI Beauty Score**: Analyzes facial symmetry and proportions with our AI beauty score camera
- **Age Prediction**: Estimates the user's age like popular "how normal am i ai" applications
- **Gender Recognition**: Identifies the user's gender with confidence score
- **BMI Estimation**: Estimates the user's BMI based on facial features
- **Emotion Detection**: Recognizes facial expressions (happy, sad, angry, etc.)
- **Life Expectancy**: Calculates estimated lifespan based on detected features
- **Data Sharing**: Optional anonymous data sharing to improve averages
- **Customizable**: Admin settings to enable/disable specific features

This AI face rater plugin uses a shortcode for easy embedding on any WordPress page or post.

## Installation

1. Download the plugin ZIP file from the [releases page](https://github.com/zhengxitao/how-normal-am-i/releases) or clone this repository
2. Upload the plugin files to the `/wp-content/plugins/how-normal-am-i` directory, or install the plugin through the WordPress plugins screen
3. Activate the plugin through the 'Plugins' screen in WordPress
4. Go to Settings > How Normal Am I to configure your AI beauty test options

## Usage

Use the shortcode `[how_normal_am_i]` to embed the AI attractiveness test on any page or post:

```
[how_normal_am_i]
```

### Requirements

- WordPress 5.0 or higher
- Modern browser with webcam support (Chrome, Firefox, Safari, Edge) for the beauty score AI functionality
- Note: On iOS devices, the "how attractive am i ai" camera access only works in Safari browser

## Privacy Notice

This AI beauty analyzer plugin:

- Does not send any images or facial data to external servers
- Processes all facial analysis in the browser
- Provides users with clear terms and conditions
- Gives users the option to share anonymous data to improve the AI rate my face averages

## Credits

- Face-api.js by Vincent Mühler: [justadudewhohacks/face-api.js](https://github.com/justadudewhohacks/face-api.js)
- Visit our official website: [hownormalami.net](https://hownormalami.net/github)

## License

This AI face beauty analyzer plugin is licensed under the GPL v2 or later.

## Disclaimer

The analysis provided by this AI attractiveness test is for entertainment purposes only and should not be considered scientifically accurate. The AI beauty rating, BMI estimation, and life expectancy calculations are based on simplified algorithms and should not be used for any medical or professional assessment. 