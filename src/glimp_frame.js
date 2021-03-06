/**
 * @author David Corvoysier / Copyright Orange 2013
 */
(function(global) {
    
    var createTexture = function (gl, width, height, type) {
        var texture = gl.createTexture();
        //set properties for the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);

        return texture;
    };

    /**
     * 
     * This class represents a frame, ie a bitmap to be rendered on 
     * screen. 
     * 
     * 
     * Frames are used as inputs and outputs of the glimp filters.
     * 
     * Frames provide methods to load data from HTML elements and to 
     * export raw pixels to Javascript byte arrays. 
     * 
     * 
     * The pixel data is stored internally as a four components vector 
     * of either Floats or Unsigned Int.
     *
     * @class Frame
     * 
     * @constructor
     * @param canvas {Canvas} the main Canvas
     * @param width {integer} 
     * @param height {integer}
     * @param type {GL_UNSIGNED_INT|GL_FLOAT} the storage format of the 
     * Frame pixels
     * 
     */
    var Frame = function (canvas, width, height, type) {
        var _gl = canvas.gl;
        var _fb = canvas.fb;
        var _texture = createTexture(_gl, width, height, type);
        
        return {
            /**
             * Load data from an image, canvas or video element
             * 
             * @method load
             * @param element {HTMLElement}
             * 
             */
            load : function (element) {
                _gl.bindTexture(_gl.TEXTURE_2D, _texture);
                if (element.buffer) {
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, width, height, 0, _gl.RGBA, type, element);
                } else {
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, type, element);
                }
            },
            /**
             * Copy raw pixels data to a Javascript byte array
             * 
             * 
             * The caller is responsible for allocating a byte array
             * large enough to contain the exported data.
             * 
             * 
             * Note: Although some WebGL implementations support 
             * importing Float pixel data, only Unsigned byte pixel data
             * can be exported.
             * 
             * 
             * Example usage:
             * 
             *     var buf = new Uint8Array(w*h*4);
             *     frame.copy(buf); 
             * 
             * @method copy
             * @param buffer {Uint8Array}
             * @param [x] {integer} the upper left corner x coordinate of 
             * the copied area. Set to 0 if omitted.
             * @param [y] {integer} the upper left corner y coordinate of 
             * the copied area. Set to 0 if omitted.
             * @param [w] {integer} the width of the copied area. Set to
             * the full frame width if omitted.
             * @param [h] {integer} the height of the copied area. Set
             * to the full frame height if omitted.
             * 
             */
            copy: function (buffer,x,y,w,h) {
                x = x || 0;
                y = y || 0;
                w = w || width;
                h = h || height;
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, _fb);
                _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, _texture, 0);
                if (_gl.checkFramebufferStatus(_gl.FRAMEBUFFER) !== _gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error('incomplete framebuffer');
                }
                _gl.viewport(0, 0, width, height);
                _gl.readPixels(x, y, w, h, _gl.RGBA, _gl.UNSIGNED_BYTE, buffer);
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
            },
            /**
             * The underlying WebGL texture
             * @property texture {WebGLTexture} 
             */
            texture: _texture,
            /**
             * @property width {number}
             */
            width: width,
            /**
             * @property height {number}
             */
            height: height,
            /**
             * True if it is a float texture
             * @property highres {boolean}
             */
            highres: type != _gl.UNSIGNED_BYTE
        };
    };
    /**
     * @class global
     */
    /**
     * Allocate a new glimp Frame
     * 
     * 
     * Four different creation modes are supported:
     * 
     * - without any parameters, a blank frame of dimensions matching 
     * those of the canvas is created,
     * - providing only width and height creates a blank frame,
     * - providing an HTMLElement creates a blank frame matching its
     * dimensions and fills it with the element data,
     * - providing a byte array and the frame width and height creates
     * a blank frame and fills it with the array contents
     * 
     * All creation modes will by default create an Unsigned byte
     * frame, but a flag can be specified to create a float frame.  
     * 
     * @method frame
     * 
     * @param [args] element | width + height | buffer + 
     * width + height 
     * @param [highres] {boolean} If true, creates a float texture
     * 
     * @return a Frame object 
     *
     */
    global.frame = function () {
        var canvas = global.canvas();
        var gl = canvas.gl;
        var w = canvas.width,
            h = canvas.height,
            highres = false,
            element = null;
        var args = [].slice.call(arguments);
        switch(args.length){
            case 0:
                break;
            case 1:
                if (typeof args[0] === 'boolean') {
                    highres = args[0];
                } else {
                    element = args[0];
                    w = element.width || element.videoWidth;
                    h = element.height || element.videoHeight;
                }
                break;
            case 2:
                if (typeof args[0] === 'number') {
                    w = args[0];
                    h = args[1];
                } else {
                    element = args[0];
                    w = element.width || element.videoWidth;
                    h = element.height || element.videoHeight;
                    highres = args[1];
                }
                break;
            case 3:
                if (typeof args[0] === 'number') {
                    w = args[0];
                    h = args[1];
                    highres = args[2];
                } else {
                    element = args[0];
                    w = args[1];
                    h = args[2];
                }
                break;
            case 4:
                element = args[0];
                w = args[1];
                h = args[2];
                highres = args[3];
                break;
            default:
                throw new Error('Too many parameters');
        }
        var type = gl.UNSIGNED_BYTE;
        if(highres) {
            if (gl.getExtension('OES_texture_float')) {
                type = gl.FLOAT;
            } else {
                throw new Error('High-resolution textures are not supported by your browser');
            }
        }
        var f = new Frame(canvas, w, h, type);
        if(element) {
            f.load(element);
        }
        return f;
    };

})(glimp);

