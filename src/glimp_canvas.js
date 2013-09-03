/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 */
(function(global) {

    var _canvas;
    
    var Canvas = function(canvas) {
        canvas = (canvas && typeof canvas === 'object') ? canvas : document.createElement("canvas");
        var _width = canvas.width;
        var _height = canvas.height;
        var _gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!_gl) {
            throw 'This browser does not support WebGL';
        }
        var _fb = _gl.createFramebuffer();
        return {
            /**
             * 
             * This class contains the references to the common objects
             * used internally by the library.
             * 
             * 
             * Using a single WebGL context and a single framebuffer
             * object throughout the library is the key to obtain good 
             * performances.
             * 
             * @class Canvas
             * 
             */
            /**
             * @property width 
             * @type integer 
             */
            width : _width,
            /**
             * @property height 
             * @type integer 
             */
            height: _height,
            /**
             * The glimp internal WebGL context
             * @property gl
             * @type WebGLContext
             */
            gl: _gl,
            /**
             * A Frame buffer used to perform intermediate rendering
             * @property fb
             * @type WebGLFramebuffer
             */
            fb: _fb,
        };
    };

    /**
     * @class global
     * 
     */
    /**
     * Returns the internal glimp canvas reference. 
     * 
     * 
     * This method shouldn't be called in anything but code extending
     * the library
     * 
     * @method canvas
     * 
     */
    global.canvas = function() {
        _canvas = _canvas || new Canvas();
        return _canvas;
    };
    /**
     * Sets the glimp internal canvas to the WebGL canvas passed as a
     * parameter. Use this method to set the canvas to render to.
     * 
     * @method setCanvas
     * @param {CanvasElement} canvas
     * 
     */
    global.setCanvas = function(canvas) {
        _canvas = new Canvas(canvas);
    };

})(glimp);

