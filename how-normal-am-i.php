<?php
/**
 * Plugin Name: How Normal Am I
 * Plugin URI: https://hownormalami.net
 * Description: A WordPress plugin that uses face-api.js to analyze facial features and delivers an AI beauty analyzer and attractiveness test.
 * Version: 1.0.0
 * Author: Yi Tao
 * Author URI: https://hownormalami.net
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: how-normal-am-i
 * Domain Path: /languages
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HNAI_VERSION', '1.0.0');
define('HNAI_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HNAI_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HNAI_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main plugin class
 */
class How_Normal_Am_I {
    /**
     * Instance of this class
     */
    private static $instance;

    /**
     * Get plugin instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Register activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Initialize plugin
        add_action('plugins_loaded', array($this, 'init'));
        
        // Register shortcode
        add_shortcode('how_normal_am_i', array($this, 'shortcode_output'));
        
        // Register scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'register_scripts_styles'));
        
        // Admin settings
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu'));
            add_action('admin_init', array($this, 'register_settings'));
        }
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Create default options if they don't exist
        $default_options = array(
            'enable_beauty_score' => 'yes',
            'enable_age_prediction' => 'yes',
            'enable_gender_recognition' => 'yes',
            'enable_bmi_estimation' => 'yes',
            'enable_emotion_detection' => 'yes',
            'enable_life_expectancy' => 'yes',
            'enable_data_sharing' => 'yes',
            'terms_and_conditions' => 'This is an interactive experience that uses face detection algorithms. All processing happens in your browser - no images are uploaded or stored on our servers.',
        );
        
        add_option('hnai_options', $default_options);
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Cleanup if needed
    }

    /**
     * Plugin initialization
     */
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('how-normal-am-i', false, dirname(HNAI_PLUGIN_BASENAME) . '/languages');
    }

    /**
     * Register and enqueue scripts and styles
     */
    public function register_scripts_styles() {
        // Face-api.js library
        wp_register_script(
            'face-api-js',
            HNAI_PLUGIN_URL . 'assets/js/face-api.min.js',
            array(),
            HNAI_VERSION,
            true
        );
        
        // Plugin main script
        wp_register_script(
            'how-normal-am-i',
            HNAI_PLUGIN_URL . 'assets/js/how-normal-am-i.js',
            array('jquery', 'face-api-js'),
            HNAI_VERSION,
            true
        );
        
        // Plugin styles
        wp_register_style(
            'how-normal-am-i',
            HNAI_PLUGIN_URL . 'assets/css/how-normal-am-i.css',
            array(),
            HNAI_VERSION
        );
        
        // Localize script with plugin data
        wp_localize_script(
            'how-normal-am-i',
            'hnaiData',
            array(
                'modelsUrl' => HNAI_PLUGIN_URL . 'assets/models/',
                'options' => get_option('hnai_options'),
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('hnai_nonce'),
            )
        );
    }

    /**
     * Output shortcode content
     */
    public function shortcode_output($atts) {
        // Enqueue scripts and styles
        wp_enqueue_script('face-api-js');
        wp_enqueue_script('how-normal-am-i');
        wp_enqueue_style('how-normal-am-i');
        
        // Get plugin options
        $options = get_option('hnai_options');
        
        // Start output buffering
        ob_start();
        
        // Include the template file
        include HNAI_PLUGIN_DIR . 'templates/main.php';
        
        // Return the buffered content
        return ob_get_clean();
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('How Normal Am I Settings', 'how-normal-am-i'),
            __('How Normal Am I', 'how-normal-am-i'),
            'manage_options',
            'how-normal-am-i',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('hnai_options_group', 'hnai_options');
        
        add_settings_section(
            'hnai_settings_section',
            __('Feature Settings', 'how-normal-am-i'),
            array($this, 'render_settings_section'),
            'how-normal-am-i'
        );
        
        // Add settings fields
        add_settings_field(
            'enable_beauty_score',
            __('Enable Beauty Score', 'how-normal-am-i'),
            array($this, 'render_checkbox_field'),
            'how-normal-am-i',
            'hnai_settings_section',
            array('field' => 'enable_beauty_score', 'label' => __('Enable beauty score analysis', 'how-normal-am-i'))
        );
        
        add_settings_field(
            'enable_age_prediction',
            __('Enable Age Prediction', 'how-normal-am-i'),
            array($this, 'render_checkbox_field'),
            'how-normal-am-i',
            'hnai_settings_section',
            array('field' => 'enable_age_prediction', 'label' => __('Enable age prediction analysis', 'how-normal-am-i'))
        );
        
        add_settings_field(
            'enable_gender_recognition',
            __('Enable Gender Recognition', 'how-normal-am-i'),
            array($this, 'render_checkbox_field'),
            'how-normal-am-i',
            'hnai_settings_section',
            array('field' => 'enable_gender_recognition', 'label' => __('Enable gender recognition analysis', 'how-normal-am-i'))
        );
        
        add_settings_field(
            'enable_bmi_estimation',
            __('Enable BMI Estimation', 'how-normal-am-i'),
            array($this, 'render_checkbox_field'),
            'how-normal-am-i',
            'hnai_settings_section',
            array('field' => 'enable_bmi_estimation', 'label' => __('Enable BMI estimation analysis', 'how-normal-am-i'))
        );
        
        add_settings_field(
            'enable_emotion_detection',
            __('Enable Emotion Detection', 'how-normal-am-i'),
            array($this, 'render_checkbox_field'),
            'how-normal-am-i',
            'hnai_settings_section',
            array('field' => 'enable_emotion_detection', 'label' => __('Enable emotion detection analysis', 'how-normal-am-i'))
        );
        
        add_settings_field(
            'enable_life_expectancy',
            __('Enable Life Expectancy', 'how-normal-am-i'),
            array($this, 'render_checkbox_field'),
            'how-normal-am-i',
            'hnai_settings_section',
            array('field' => 'enable_life_expectancy', 'label' => __('Enable life expectancy calculation', 'how-normal-am-i'))
        );
        
        add_settings_field(
            'enable_data_sharing',
            __('Enable Data Sharing', 'how-normal-am-i'),
            array($this, 'render_checkbox_field'),
            'how-normal-am-i',
            'hnai_settings_section',
            array('field' => 'enable_data_sharing', 'label' => __('Allow users to share anonymized data', 'how-normal-am-i'))
        );
        
        add_settings_field(
            'terms_and_conditions',
            __('Terms and Conditions', 'how-normal-am-i'),
            array($this, 'render_textarea_field'),
            'how-normal-am-i',
            'hnai_settings_section',
            array('field' => 'terms_and_conditions', 'label' => __('Terms and conditions displayed to users', 'how-normal-am-i'))
        );
    }

    /**
     * Render settings section
     */
    public function render_settings_section() {
        echo '<p>' . __('Configure the features of the How Normal Am I plugin.', 'how-normal-am-i') . '</p>';
    }

    /**
     * Render checkbox field
     */
    public function render_checkbox_field($args) {
        $options = get_option('hnai_options');
        $field = $args['field'];
        $label = $args['label'];
        
        $checked = isset($options[$field]) && $options[$field] === 'yes' ? 'checked' : '';
        
        echo '<input type="checkbox" id="' . esc_attr($field) . '" name="hnai_options[' . esc_attr($field) . ']" value="yes" ' . $checked . ' />';
        echo '<label for="' . esc_attr($field) . '">' . esc_html($label) . '</label>';
    }

    /**
     * Render textarea field
     */
    public function render_textarea_field($args) {
        $options = get_option('hnai_options');
        $field = $args['field'];
        $label = $args['label'];
        
        $value = isset($options[$field]) ? $options[$field] : '';
        
        echo '<textarea id="' . esc_attr($field) . '" name="hnai_options[' . esc_attr($field) . ']" rows="5" cols="50">' . esc_textarea($value) . '</textarea>';
        echo '<p class="description">' . esc_html($label) . '</p>';
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('hnai_options_group');
                do_settings_sections('how-normal-am-i');
                submit_button();
                ?>
            </form>
            <div class="hnai-info">
                <h2><?php _e('Shortcode Usage', 'how-normal-am-i'); ?></h2>
                <p><?php _e('Use the following shortcode to add the How Normal Am I tool to any page or post:', 'how-normal-am-i'); ?></p>
                <code>[how_normal_am_i]</code>
            </div>
        </div>
        <?php
    }
}

// Initialize the plugin
How_Normal_Am_I::get_instance(); 