/**
 *
 * glimp - A webGl IMage Processing Library
 * version: 0.0.1
 * @author David Corvoysier/Copyright Orange 2013
 *
 */

(function(){

"use strict";

var glimp = (function() {
   return {
       version: "0.0.1"
   };
})();

(function(global) {
        
    var BGSubtractor = function (mask,update) {
        
        var _bgmodel;
        
        this.process = function (frameIn,fgmask) {
            _bgmodel = _bgmodel || global.frame(frameIn.width,frameIn.height,true);
            // Convert arguments to an array
            var args = Array.prototype.slice.call(arguments);
            // Only keep extra parameters
            args.splice(0,2);
            // Calculate foreground mask
            mask.apply(this,[frameIn,fgmask,_bgmodel].concat(args));
            // Update background model
            update.apply(this,[frameIn,_bgmodel].concat(args));
        };
    };
    
    var _bgfgs = [];
    
    global.bgfg = function (type) {
        type = type || 'basic';
        var _bgfg = _bgfgs[type];
        if (!_bgfg) {
            throw new Error('Unknown background-subtractor type');
        }
        return new BGSubtractor(_bgfgs[type].mask,_bgfgs[type].update);
    };
    
    global.addBGsubtractor = function (name, mask, update) {
        _bgfgs[name] = {
            mask: mask,
            update: update
        };
    };

})(glimp);

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


(function(lib) {
    "use strict";

    if (typeof module === "undefined" || typeof module.exports === "undefined") {
        // in a browser, attach library to the global context
        window.glimp = lib;
    } else {
        // in commonjs, or when AMD, attach library to exports
        module.exports = lib;
    }
})(glimp);

(function(global) {
    
    var defaultVertexSource = '\
    attribute vec2 vertex;\
    attribute vec2 _texCoord;\
    varying vec2 texCoord;\
    void main() {\
        texCoord = _texCoord;\
        gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);\
    }';

    var defaultFragmentSource = '\
    uniform sampler2D texture;\
    varying vec2 texCoord;\
    void main() {\
        gl_FragColor = texture2D(texture, texCoord);\
    }';
    
    function compileSource(gl,type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw 'compile error: ' + gl.getShaderInfoLog(shader);
        }
        return shader;
    }

    // An array to store our filters
    var _filters = [];
    
    /**
     * 
     * This class represents a filtering operation. 
     * 
     * 
     * It exposes a single method to apply a specific transformation to 
     * an input frame and render the result into an output frame or the 
     * main canvas. 
     * 
     * @class Filter
     * 
     * @constructor
     * @param canvas {Canvas} the main Canvas
     * @param vertexSource {string|null} the Vertex Shader source for that 
     * filter. The vertex shader defines the geometry of the rendered
     * frame. If set to null, the filter will use an orthographic projection.
     * @param fragmentSource {string|null} the Vertex Shader source for that 
     * filter. The fragment shader defines the pixel operations applied
     * on the rendered frame. If set to null, the filter will perform a 
     * carbon copy.
     * @param callback {function} A callback function that can be used 
     * to set uniforms before the rendering occurs
     * 
     */
    var Filter = function (canvas, vertexSource, fragmentSource, callback) {
        // Store WebGL context
        var gl = canvas.gl;
        // Create the filter program
        var _program = gl.createProgram();
        vertexSource = vertexSource || defaultVertexSource;
        fragmentSource = fragmentSource || defaultFragmentSource;
        fragmentSource = 'precision highp float;' + fragmentSource; // annoying requirement is annoying
        gl.attachShader(_program, compileSource(gl,gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(_program, compileSource(gl,gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(_program);
        if (!gl.getProgramParameter(_program, gl.LINK_STATUS)) {
            throw 'link error: ' + gl.getProgramInfoLog(_program);
        }
        // Create buffer coordinates
        var _vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 1 ]), gl.STATIC_DRAW);
        var _texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 1 ]), gl.STATIC_DRAW);
        var _invCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _invCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0, 1, 0, 0, 1, 1, 1, 0 ]), gl.STATIC_DRAW);
                
        return {
            /**
             * 
             * Apply the Filter to an input Frame and store the result
             * in an output Frame or the main canvas
             * 
             * @method run
             * 
             * @param frameIn {Frame} the input frame
             * @param {Frame} [frameOut] the output frame. If omitted,
             * outputs to the main canvas
             * 
             */
            run : function (frameIn,frameOut) {
                // Bind the framebuffer
                if(frameOut){
                    gl.bindFramebuffer(gl.FRAMEBUFFER, canvas.fb);
                } else {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                }
                
                // Set the frameIn texture as input
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, frameIn.texture);

                // Set coordinates
                var vertexAttribute = gl.getAttribLocation(_program, 'vertex');
                gl.enableVertexAttribArray(vertexAttribute);
                var texCoordAttribute = gl.getAttribLocation(_program, '_texCoord');
                gl.enableVertexAttribArray(texCoordAttribute);
                gl.useProgram(_program);
                gl.bindBuffer(gl.ARRAY_BUFFER, _vertexBuffer);
                gl.vertexAttribPointer(vertexAttribute, 2, gl.FLOAT, false, 0, 0);
                if(frameOut)
                    gl.bindBuffer(gl.ARRAY_BUFFER, _texCoordBuffer);
                else
                    gl.bindBuffer(gl.ARRAY_BUFFER, _invCoordBuffer);
                gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);
                
                // Use the first texture
                var texLoc = gl.getUniformLocation(_program, 'texture');
                gl.uniform1i(texLoc, 0);
                
                // This callback allows the filter to be specialized
                if(callback) {
                    // Get the extra parameters we may have received
                    var args = Array.prototype.slice.call(arguments);
                    // Add gl & program parameters at the beginning
                    args.splice(0, 0, gl, _program);
                    // Call our callback
                    callback.apply (this, args);
                }

                if(frameOut && frameOut.texture) {
                    gl.viewport(0, 0, frameOut.width, frameOut.height);
                    // Set the frameOut texture as output
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameOut.texture, 0);
                    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                        throw new Error('incomplete framebuffer');
                    }
                } else {
                    gl.viewport(0, 0, canvas.width, canvas.height);
                }
                
                // Draw
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                
            }
        };
    };

    /**
     * @class global
     * 
     */
    /**
     * @method createFilter
     * 
     * @param vertexSource {string|null} the Vertex Shader source for that 
     * filter. The vertex shader defines the geometry of the rendered
     * frame. If set to null, the filter will use an orthographic projection.
     * @param fragmentSource {string|null} the Vertex Shader source for that 
     * filter. The fragment shader defines the pixel operations applied
     * on the rendered frame. If set to null, the filter will perform a 
     * carbon copy.
     * @param callback {function} A callback function that can be used 
     * to set uniforms before the rendering occurs
     * 
     * @return the new Filter object
     * 
     */
    global.createFilter = function (vertexSource, fragmentSource, callback) {
        return new Filter(global.canvas(), vertexSource, fragmentSource, callback);
    };

    /**
     * 
     * Extends the glimp namespace with a new filter function
     * 
     * 
     * Example usage:
     *     
     *    glimp.addFilter(foo);
     *     
     *    ... 
     *    
     *    glimp.foo(frameIn, frameOut);
     *  
     * 
     * @method addFilter
     * @param name {string} the name of the new Filter
     * @param vertexSource {string|null} the Vertex Shader source for that 
     * filter. The vertex shader defines the geometry of the rendered
     * frame. If set to null, the filter will use an orthographic projection.
     * @param fragmentSource {string|null} the Vertex Shader source for that 
     * filter. The fragment shader defines the pixel operations applied
     * on the rendered frame. If set to null, the filter will perform a 
     * carbon copy.
     * @param callback {function} A callback function that can be used 
     * to set uniforms before the rendering occurs
     * 
     */
    global.addFilter = function (name, vertexSource, fragmentSource, callback) {
        global[name] = function () {
            _filters[name] = _filters[name] || global.createFilter(vertexSource, fragmentSource, callback);
            var args = Array.prototype.slice.call(arguments);
            _filters[name].run.apply (this, args);
        };
    };
    
    /**
     * Our default filter, a simple carbon-copy
     * 
     * @method copy
     * 
     * @param frameIn {Frame} the input frame
     * @param {Frame} [frameOut] the output frame. If omitted,
     * outputs to the main canvas
     *
     */
    global.addFilter('copy');

})(glimp);

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


(function(global) {
    
    var _haarShaderStr = '\
        const int MAXITER = 1024;\
        uniform sampler2D texture;\
        uniform vec2 textureSize;\
        uniform int sn;\
        uniform float cwidth;\
        uniform float cheight;\
        uniform float scale;\
        uniform sampler2D classifier;\
        uniform vec2 classifierSize;\
        varying vec2 texCoord;\
        float sqsum(float x,float y,float w,float h,vec2 ratio){\
            vec4 a = texture2D(texture, texCoord + ratio * vec2(x,y) * scale);\
            vec4 b = texture2D(texture, texCoord + ratio * vec2(x+w,y) * scale);\
            vec4 c = texture2D(texture, texCoord + ratio * vec2(x,y+h) * scale);\
            vec4 d = texture2D(texture, texCoord + ratio * vec2(x+w,y+h) * scale);\
            return (a.g - b.g -c.g + d.g);\
        }\
        float sum(float x,float y,float w,float h,vec2 ratio){\
            vec4 a = texture2D(texture, texCoord + ratio * vec2(x,y) * scale);\
            vec4 b = texture2D(texture, texCoord + ratio * vec2(x+w,y) * scale);\
            vec4 c = texture2D(texture, texCoord + ratio * vec2(x,y+h) * scale);\
            vec4 d = texture2D(texture, texCoord + ratio * vec2(x+w,y+h) * scale);\
            return (a.r - b.r -c.r + d.r);\
        }\
        vec4 lookupValues(sampler2D arrayTex,vec2 texSize,float index){\
            float y = floor(index/texSize.x);\
            float x = index - y*texSize.x;\
            vec2 onePixel = 1./(texSize - vec2(1.,1.));\
            return texture2D(arrayTex, vec2(x,y)*onePixel);\
        }\
        vec4 getValues(float index, vec4 values) {\
            float rIndex = floor(index/4.);\
            float position = index - rIndex*4.;\
            if(position == 0.) {\
                return lookupValues(classifier, classifierSize, rIndex);\
            } else {\
                return values;\
            }\
        }\
        float getValue(float index, vec4 values) {\
            float rIndex = floor(index/4.);\
            float position = index - rIndex*4.;\
            if (position == 0.) {\
                return values[0];\
            } else if (position == 1.) {\
                return values[1];\
            } else if (position == 2.) {\
                return values[2];\
            } else {\
                return values[3];\
            }\
        }\
        void main() {\
            vec2 ratio = vec2(1.0, 1.0) / textureSize;\
            vec2 upperBounds = vec2(1.,1.) - vec2(cwidth,cheight)*scale*ratio;\
            if(any(greaterThan(texCoord,upperBounds))) {\
                gl_FragColor = vec4(0.,0.,0.,0.);\
            } else {\
                float n = 0.;\
                vec4 values = vec4 (0.,0.,0.,0.);\
                float stage_sum, tree_sum;\
                float inv_area = 1.0 / (scale * scale * cwidth * cheight);\
                float mean = sum(0.,0.,cwidth,cheight,ratio)*inv_area;\
                float variance = sqsum(0.,0.,cwidth,cheight,ratio)*inv_area - mean*mean;\
                float std = (variance > 0.) ? sqrt(variance) : 1.;\
                int tn, fn;\
                float x, y, w, h, weight;\
                float stage_thresh, threshold, left_val, right_val;\
                for (int i = 0; i < MAXITER; i++) {\
                    if(i == sn) break;\
                    stage_sum = 0.;\
                    values = getValues(n,values);\
                    tn = int(getValue(n++,values));\
                    for (int j = 0; j < MAXITER; j++) {\
                        if(j == tn) break;\
                        tree_sum = 0.;\
                        values = getValues(n,values);\
                        fn = int(getValue(n++,values));\
                        for (int k = 0; k < MAXITER ; k++) {\
                            if(k == fn) break;\
                            values = getValues(n,values);\
                            x = getValue(n++,values);\
                            values = getValues(n,values);\
                            y = getValue(n++,values);\
                            values = getValues(n,values);\
                            w = getValue(n++,values);\
                            values = getValues(n,values);\
                            h = getValue(n++,values);\
                            values = getValues(n,values);\
                            weight = getValue(n++,values);\
                            tree_sum += sum(x,y,w,h,ratio)*weight;\
                        }\
                        values = getValues(n,values);\
                        threshold = getValue(n++,values);\
                        values = getValues(n,values);\
                        left_val = getValue(n++,values);\
                        values = getValues(n,values);\
                        right_val = getValue(n++,values);\
                        stage_sum += (tree_sum * inv_area < threshold*std ) ? left_val : right_val;\
                    }\
                    values = getValues(n,values);\
                    stage_thresh = getValue(n++,values);\
                    if (stage_sum < stage_thresh) {\
                        gl_FragColor = vec4(0.,0.,0.,0.);\
                        break;\
                    } else {\
                        gl_FragColor = vec4(stage_sum-stage_thresh,0.,0.,1.);\
                    }\
                }\
            }\
        }';

    function _genClassifier(classifier) {

        var values = [];
                            
        var cwidth = classifier.size[0] | 0;
        var cheight = classifier.size[1] | 0;
        
        var stages = classifier.stages,
            sn = stages.length;
        for(var i = 0; i < sn; ++i) {
            var stage = stages[i],
                stage_thresh = stage.threshold,
                trees = stage.trees,
                tn = trees.length;
            values.push(tn);
            for(var j = 0; j < tn; ++j) {
                var tree = trees[j],
                    features = tree.features,
                    fn = features.length;
                values.push(fn);
                if(tree.tilted === 1) {
                    throw new Error('Tilted cascades are not supported');
                } else {
                    for(var k=0; k < fn; ++k) {
                        var feature = features[k];
                        for(var l=0; l < 5; ++l) {
                            values.push(feature[l]);
                        }
                    }
                }
                values.push(tree.threshold);
                values.push(tree.left_val);
                values.push(tree.right_val);
            }
            values.push(stage_thresh);
        }
        
        var width = Math.ceil(Math.pow(Math.ceil(values.length/4),0.5)),
            height = width;
        
        var buffer = new ArrayBuffer(width*height*4*Float32Array.BYTES_PER_ELEMENT);
        var view = new Float32Array(buffer);
        
        i = values.length;
        while(i--){
            view[i] = values[i];
        }
        
        var f = global.frame(view,width,height,true);
        
        return {
            valuesFrame : f,
            cwidth: cwidth,
            cheight: cheight,
            sn: sn
        };

    }
    
    global.haar = function (classifier) {
        var _classifier = _genClassifier(classifier);
        var _filter = global.createFilter(
            // Use default vertex shader
            null,
            // Generate fragment shader
            _haarShaderStr,
            // Uniforms callback
            function (gl, program, frameIn, frameOut, scale) {
                var textureSizeLocation = gl.getUniformLocation(program, "textureSize");
                gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
                // Set classifier parameters
                var wLocation = gl.getUniformLocation(program, "cwidth");
                gl.uniform1f(wLocation, _classifier.cwidth);
                var hLocation = gl.getUniformLocation(program, "cheight");
                gl.uniform1f(hLocation, _classifier.cheight);
                var snLocation = gl.getUniformLocation(program, "sn");
                gl.uniform1i(snLocation, _classifier.sn);
                // Set scale
                var sLocation = gl.getUniformLocation(program, "scale");
                gl.uniform1f(sLocation, scale);
                // Set our texture of classifiers values
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, _classifier.valuesFrame.texture);
                // Set classifier uniform to position 1
                var cLocation = gl.getUniformLocation(program, "classifier");
                gl.uniform1i(cLocation, 1);
                var classSizeLocation = gl.getUniformLocation(program, "classifierSize");
                gl.uniform2f(classSizeLocation, _classifier.valuesFrame.width, _classifier.valuesFrame.height);
            }
        );
        
        return {
            find : function (frameIn,frameOut,scale) {
                _filter.run(frameIn,frameOut,scale);
            }
        };
    };
    
})(glimp);

(function(global) {

    global.addBGsubtractor (
        // Background Subtractor Name
        'average',
        // Mask function
        function (frameIn,fgmask,bgmodel,alpha,threshold) {
            // Use the generic colormask filter
            global.colormask(frameIn,fgmask,bgmodel,threshold);
        },
        // Update function
        function (frameIn,bgmodel,alpha,threshold) {
            // Use the generic mix function 
            global.mix(bgmodel,bgmodel,frameIn,alpha);
        }
    );

})(glimp);

(function(global) {

    global.addBGsubtractor (
        // Background Subtractor Name
        'basic',
        // Mask function
        function (frameIn,fgmask,bgmodel,threshold) {
            // Use the colormask filter
            global.colormask(frameIn,fgmask,bgmodel,threshold);
        },
        // Update function
        function (frameIn,bgmodel) {
            // Copy the current frame to the bgmodel 
            global.copy(frameIn,bgmodel);
        }
    );

})(glimp);

(function(global) {
    
    var _gaussmask;
    var _gaussmix;
            
    global.addBGsubtractor (
        // Background Subtractor Name
        'gaussian',
        // Mask function
        function (frameIn,fgmask,bgmodel,alpha,threshold) {
            // Create the gaussmix filter 
            _gaussmask = _gaussmask || global.createFilter(
                // Vertex Shader (null uses default)
                null,
                // Fragment Shader (null uses default)        
                '\
                uniform sampler2D texture;\
                uniform sampler2D bgmodel;\
                uniform float ts;\
                varying vec2 texCoord;\
                void main() {\
                    vec4 color = texture2D(texture, texCoord);\
                    vec4 bgcolor = texture2D(bgmodel, texCoord);\
                    float d = distance(color.rbg,bgcolor.rgb)/3.;\
                    \
                    gl_FragColor = d>(ts+bgcolor.a) ? color: vec4(0.0,0.0,0.0,0.0);\
                    \
                }\
                ',
                // Uniforms callback
                function (gl, program, frameIn, fgmask, bgmodel, threshold) {
                    // Bind bgmodel texture at position 1
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, bgmodel.texture);
                    // Set bgmodel uniform to position 1
                    var bgLocation = gl.getUniformLocation(program, "bgmodel");
                    gl.uniform1i(bgLocation, 1);
                    // Set threshold
                    var tsLocation = gl.getUniformLocation(program, "ts");
                    gl.uniform1f(tsLocation, threshold);
                }
            );
            _gaussmask.run(frameIn,fgmask,bgmodel,threshold);
        },
        // Update function
        function (frameIn,bgmodel,alpha,threshold) {
            // Create the gaussmix filter 
            _gaussmix = _gaussmix || global.createFilter(
                // Vertex Shader (null uses default)
                null,
                // Fragment Shader (null uses default)        
                '\
                uniform sampler2D texture;\
                uniform sampler2D bgmodel;\
                uniform float alpha;\
                varying vec2 texCoord;\
                void main() {\
                    vec4 color = texture2D(texture, texCoord);\
                    vec4 bgcolor = texture2D(bgmodel, texCoord);\
                    float d = distance(color.rbg,bgcolor.rgb)/3.;\
                    gl_FragColor = vec4(\
                        mix(bgcolor.rgb,color.rgb,alpha),\
                        mix(bgcolor.a,d,alpha));\
                }\
                ',
                // Uniforms callback
                function (gl, program, frameIn, frameOut, bgmodel, alpha) {
                    // Bind bgmodel texture at position 1
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, bgmodel.texture);
                    // Set reference uniform to position 1
                    var bgLocation = gl.getUniformLocation(program, "bgmodel");
                    gl.uniform1i(bgLocation, 1);
                    // Set mix ratio
                    // Note: since the result is stored in a single byte per channel,
                    // a ratio lower than 1/255 is equivalent to zero
                    alpha = Math.min(1.0,alpha);
                    var alphaLocation = gl.getUniformLocation(program, "alpha");
                    gl.uniform1f(alphaLocation, alpha);
                }
            );
            _gaussmix.run(frameIn,bgmodel,bgmodel,alpha);
        }
    );
        

})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'bborder',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
            const int MAXITER = 1024;\
            uniform sampler2D texture;\
            uniform vec2 u_textureSize;\
            varying vec2 texCoord;\
            void main() {\
            vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;\
            vec4 color = texture2D(texture, texCoord);\
            vec4 colorSum =\
                texture2D(texture, texCoord + onePixel * vec2(-1, -1))+\
                texture2D(texture, texCoord + onePixel * vec2( 0, -1))+\
                texture2D(texture, texCoord + onePixel * vec2( 1, -1))+\
                texture2D(texture, texCoord + onePixel * vec2(-1,  0))+\
                texture2D(texture, texCoord + onePixel * vec2( 1,  0))+\
                texture2D(texture, texCoord + onePixel * vec2(-1,  1))+\
                texture2D(texture, texCoord + onePixel * vec2( 0,  1))+\
                texture2D(texture, texCoord + onePixel * vec2( 1,  1));\
            \
            if(all(lessThan(colorSum.rgb,vec3(2.,2.,2.)))\
            || all(equal(colorSum.rgb,vec3(8.,8.,8.)))){\
                gl_FragColor = vec4(0.,0.,0.,color.a);\
            }else{\
                gl_FragColor = vec4(1.,1.,1.,color.a);\
            }\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut) {
            var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
            gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
        }
    );
    
})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'binary',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            float r = color.r;\
            float g = color.g;\
            float b = color.b;\
            \
            if (all(equal(color.rgb,vec3(0.,0.,0.)))){\
                gl_FragColor = color;\
            } else {\
                gl_FragColor = vec4(1.0,1.0,1.0,color.a);\
            }\
        }\
        ',
        // Uniforms callback
        null
    );
    
})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'colormask',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        uniform sampler2D reference;\
        uniform float ts;\
        uniform float kc;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            vec4 rcolor = texture2D(reference, texCoord);\
            float d = distance(color.rbg,rcolor.rgb)/3.;\
            \
            if (kc == 0.0) {\
                gl_FragColor = d>ts ? color: vec4(0.0,0.0,0.0,0.0);\
            } else {\
                gl_FragColor = d>ts ? vec4(0.0,0.0,0.0,0.0): color;\
            }\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, reference, threshold, keepClose) {
            // Bind reference texture at position 1
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, reference.texture);
            // Set reference uniform to position 1
            var refLocation = gl.getUniformLocation(program, "reference");
            gl.uniform1i(refLocation, 1);
            // Set threshold
            var tsLocation = gl.getUniformLocation(program, "ts");
            gl.uniform1f(tsLocation, threshold);
            // Set proximity inversion flag
            keepClose = keepClose || 0;
            var kfLocation = gl.getUniformLocation(program, "kc");
            gl.uniform1f(kfLocation, keepClose);
        }
    );
    
})(glimp);

(function(global) {
    
    // Define several convolution kernels
    var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    gaussianBlur2: [
      1, 2, 1,
      2, 4, 2,
      1, 2, 1
    ],
    gaussianBlur3: [
      0, 1, 0,
      1, 1, 1,
      0, 1, 0
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    sharpness: [
       0,-1, 0,
      -1, 5,-1,
       0,-1, 0
    ],
    sharpen: [
       -1, -1, -1,
       -1, 16, -1,
       -1, -1, -1
    ],
    edgeDetect: [
       -0.125, -0.125, -0.125,
       -0.125,  1,     -0.125,
       -0.125, -0.125, -0.125
    ],
    edgeDetect2: [
       -1, -1, -1,
       -1,  8, -1,
       -1, -1, -1
    ],
    edgeDetect3: [
       -5, 0, 0,
        0, 0, 0,
        0, 0, 5
    ],
    edgeDetect4: [
       -1, -1, -1,
        0,  0,  0,
        1,  1,  1
    ],
    edgeDetect5: [
       -1, -1, -1,
        2,  2,  2,
       -1, -1, -1
    ],
    edgeDetect6: [
       -5, -5, -5,
       -5, 39, -5,
       -5, -5, -5
    ],
    sobelHorizontal: [
        1,  2,  1,
        0,  0,  0,
       -1, -2, -1
    ],
    sobelVertical: [
        1,  0, -1,
        2,  0, -2,
        1,  0, -1
    ],
    previtHorizontal: [
        1,  1,  1,
        0,  0,  0,
       -1, -1, -1
    ],
    previtVertical: [
        1,  0, -1,
        1,  0, -1,
        1,  0, -1
    ],
    boxBlur: [
        0.111, 0.111, 0.111,
        0.111, 0.111, 0.111,
        0.111, 0.111, 0.111
    ],
    triangleBlur: [
        0.0625, 0.125, 0.0625,
        0.125,  0.25,  0.125,
        0.0625, 0.125, 0.0625
    ],
    emboss: [
       -2, -1,  0,
       -1,  1,  1,
        0,  1,  2
    ]
    };

    // Register this filter
    global.addFilter(
        // Filter name
        'convol',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
            uniform sampler2D texture;\
            uniform float u_kernel[9];\
            uniform vec2 u_textureSize;\
            varying vec2 texCoord;\
            void main() {\
            vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;\
            vec4 colorSum =\
               texture2D(texture, texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +\
               texture2D(texture, texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +\
               texture2D(texture, texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +\
               texture2D(texture, texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +\
               texture2D(texture, texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +\
               texture2D(texture, texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +\
               texture2D(texture, texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +\
               texture2D(texture, texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +\
               texture2D(texture, texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;\
            float kernelWeight =\
               u_kernel[0] +\
               u_kernel[1] +\
               u_kernel[2] +\
               u_kernel[3] +\
               u_kernel[4] +\
               u_kernel[5] +\
               u_kernel[6] +\
               u_kernel[7] +\
               u_kernel[8] ;\
            \
            if (kernelWeight <= 0.0) {\
             kernelWeight = 1.0;\
            }\
            \
            gl_FragColor = vec4((colorSum / kernelWeight).rgb, 1);\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, kernel) {
            if(frameIn == frameOut){
                throw new Error('in-place convolution is not supported');
            }
            kernel = kernel || 'normal';
            var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
            gl.uniform1fv(kernelLocation, kernels[kernel]);
            var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
            gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
        }
    );
    
})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'dilate',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
            const int MAXITER = 1024;\
            uniform sampler2D texture;\
            uniform vec2 u_textureSize;\
            uniform int u_kernelSize;\
            varying vec2 texCoord;\
            void main() {\
            vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;\
            vec4 color = texture2D(texture, texCoord);\
            for (int i = 0; i < MAXITER; i++) {\
                if (i > 2*u_kernelSize)\
                    break;\
                for (int j = 0; j < MAXITER; j++) {\
                    if (j > 2*u_kernelSize)\
                        break;\
                    color = max(color, texture2D(texture, texCoord + onePixel * vec2(i-u_kernelSize, j-u_kernelSize)));\
                }\
            }\
            \
            gl_FragColor = color;\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, kernelSize) {
            kernelSize = kernelSize || 1;
            var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
            gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
            var kernelSizeLocation = gl.getUniformLocation(program, "u_kernelSize");
            gl.uniform1i(kernelSizeLocation, kernelSize);
        }
    );
    
})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'erode',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
            const int MAXITER = 1024;\
            uniform sampler2D texture;\
            uniform vec2 u_textureSize;\
            uniform int u_kernelSize;\
            varying vec2 texCoord;\
            void main() {\
            vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;\
            vec4 color = texture2D(texture, texCoord);\
            for (int i = 0; i < MAXITER; i++) {\
                if (i > 2*u_kernelSize)\
                    break;\
                for (int j = 0; j < MAXITER; j++) {\
                    if (j > 2*u_kernelSize)\
                        break;\
                    color = min(color, texture2D(texture, texCoord + onePixel * vec2(i-u_kernelSize, j-u_kernelSize)));\
                }\
            }\
            \
            gl_FragColor = color;\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, kernelSize) {
            kernelSize = kernelSize || 1;
            var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
            gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
            var kernelSizeLocation = gl.getUniformLocation(program, "u_kernelSize");
            gl.uniform1i(kernelSizeLocation, kernelSize);
        }
    );
    
})(glimp);

(function(global) {
        
    // Register this filter
    global.addFilter(
        // Filter name
        'expand',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
            const int MAXITER = 1024;\
            uniform sampler2D texture;\
            uniform vec2 u_textureSize;\
            uniform int scale;\
            uniform vec2 direction;\
            varying vec2 texCoord;\
            void main() {\
            vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;\
            vec4 color = texture2D(texture, texCoord);\
            for (int i = 1; i < MAXITER; i++) {\
                if ((i == scale) || color != vec4(0.,0.,0.,0.))\
                    break;\
                color = texture2D(texture, texCoord + onePixel * direction * float(i));\
            }\
            \
            gl_FragColor = color;\
        }\
        ',
        // Uniforms callback
        function(gl, program, frameIn, frameOut, scale, dx, dy){
            var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
            gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
            var sLocation = gl.getUniformLocation(program, "scale");
            gl.uniform1i(sLocation, scale);
            var dLocation = gl.getUniformLocation(program, "direction");
            gl.uniform2f(dLocation, dx, dy);
        }
    );
    
})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'grayscale',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            float s =  color.r * .212671 + color.g * .715160 + color.b * .072169;\
            gl_FragColor = vec4(s, s, s, color.a);\
        }\
        ',
        // Uniforms callback
        null
    );
    
})(glimp);

(function(global) {
    
    var _initShader,_haddShader,_vaddShader;
    var _frames;
    
    global.integral = function(frameIn,frameOut,n) {
        if (!frameOut || !frameOut.highres) {
            throw new Error('The output needs to be a high res texture');
        }
        n = n || 2;
        var hpass = Math.ceil(Math.log(frameIn.width)/Math.log(n));
        var vpass = Math.ceil(Math.log(frameIn.height)/Math.log(n));
        if (!_frames
        || (_frames[0].width != frameIn.width)
        || (_frames[0].height != frameIn.height)){
            _frames = [
                global.frame(frameIn.width,frameIn.height,true),
                global.frame(frameIn.width,frameIn.height,true)
            ];
        }
        var _commonShaderStr = '\
            float get_offset(float length,float pass) {\
                return 1.0/length*exp2(pass);\
            }';
        _initShader = _initShader || global.createFilter(
            // Vertex Shader (null uses default)
            null,
            // Fragment Shader (null uses default)     
            '\
            uniform sampler2D texture;\
            varying vec2 texCoord;\
            void main() {\
                vec4 color = texture2D(texture, texCoord);\
                float s = (color.r * 4899. + color.g * 9617. + color.b * 1868.)*255./16384.;\
                gl_FragColor = vec4(s,s*s,0.,0.);\
            }\
            ',
            // Uniforms callback
            null
        );
        _haddShader = _haddShader || global.createFilter(
            // Vertex Shader (null uses default)
            null,
            // Fragment Shader (null uses default)
            _commonShaderStr +
            '\
            uniform sampler2D texture;\
            uniform float width;\
            uniform float pass;\
            varying vec2 texCoord;\
            void main() {\
                vec4 pixA = texture2D(texture, texCoord);\
                float offset = get_offset(width,pass);\
                if(texCoord.x <= offset) {\
                    gl_FragColor = pixA;\
                } else {\
                    vec4 pixB = texture2D(texture, texCoord + offset * vec2(-1.,0.));\
                    gl_FragColor = pixA + pixB;\
                }\
            }\
            ',
            // Uniforms callback
            function (gl, program, frameIn, frameOut, pass) {
                var wLocation = gl.getUniformLocation(program, "width");
                gl.uniform1f(wLocation, frameIn.width);
                var pLocation = gl.getUniformLocation(program, "pass");
                gl.uniform1f(pLocation, pass);
            }
        );
        _vaddShader = _vaddShader || global.createFilter(
            // Vertex Shader (null uses default)
            null,
            // Fragment Shader (null uses default)
            _commonShaderStr +
            '\
            uniform sampler2D texture;\
            uniform float height;\
            uniform float pass;\
            varying vec2 texCoord;\
            void main() {\
                vec4 pixA = texture2D(texture, texCoord);\
                float offset = get_offset(height,pass);\
                if(texCoord.y <= offset) {\
                    gl_FragColor = pixA;\
                } else {\
                    vec4 pixB = texture2D(texture, texCoord + offset * vec2(0.,-1.));\
                    gl_FragColor = pixA + pixB;\
                }\
            }\
            ',
            // Uniforms callback
            function (gl, program, frameIn, frameOut, pass) {
                var hLocation = gl.getUniformLocation(program, "height");
                gl.uniform1f(hLocation, frameIn.height);
                var pLocation = gl.getUniformLocation(program, "pass");
                gl.uniform1f(pLocation, pass);
            }
        );
        _initShader.run(frameIn,_frames[0]);
        for(var i=0;i<hpass;i++){
            _haddShader.run(_frames[i%2],_frames[(i+1)%2],i);
        }
        for(i=0;i<vpass-1;i++){
            _vaddShader.run(_frames[(i+hpass)%2],_frames[(i+hpass+1)%2],i);
        }
        _vaddShader.run(_frames[(hpass+vpass-1)%2],frameOut,vpass-1);
    };
    
})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'mix',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        uniform sampler2D reference;\
        uniform float alpha;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            vec4 rcolor = texture2D(reference, texCoord);\
            gl_FragColor = mix(color,rcolor,alpha);\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, reference, alpha) {
            // Bind reference texture at position 1
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, reference.texture);
            // Set reference uniform to position 1
            var refLocation = gl.getUniformLocation(program, "reference");
            gl.uniform1i(refLocation, 1);
            // Set alpha
            // Note: since the result is stored in a single byte per channel,
            // alpha value lower than 1/255 are equivalent to zero
            alpha = Math.min(1.0,alpha);
            var alphaLocation = gl.getUniformLocation(program, "alpha");
            gl.uniform1f(alphaLocation, alpha);
        }
    );
    
})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'skin',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            float r = color.r;\
            float g = color.g;\
            float b = color.b;\
            \
            if ((r<=45.0/255.0)||(g<=40.0/255.0)||(b<=20.0/255.0)\
                ||(r<=g)||(r<=b)\
                ||((r-min(g,b))<=15.0/255.0)\
                ||(abs(r-g)<=15.0/255.0)){\
                gl_FragColor = vec4(0.0,0.0,0.0,0.0);\
            } else {\
                gl_FragColor = color;\
            }\
        }\
        ',
        // Uniforms callback
        null
    );
    
})(glimp);

(function(global) {
    
    // Register this filter
    global.addFilter(
        // Filter name
        'threshold',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        uniform vec4 from;\
        uniform vec4 to;\
        uniform int binary;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            \
            if (any(lessThan(color,from)) || any(greaterThan(color,to))) {\
                gl_FragColor = vec4(0.,0.,0.,0.);\
            } else {\
                if (binary == 1) {\
                    gl_FragColor = vec4(1.,1.,1.,1.);\
                } else {\
                    gl_FragColor = color;\
                }\
            }\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, from, to, binary) {
            from = from || [0.0,0.0,0.0,0.0];
            to = to || [1.0,1.0,1.0,1.0];
            binary = binary || false;
            var fLocation = gl.getUniformLocation(program, "from");
            gl.uniform4fv(fLocation, new Float32Array(from));
            var tLocation = gl.getUniformLocation(program, "to");
            gl.uniform4fv(tLocation, new Float32Array(to));
            var bLocation = gl.getUniformLocation(program, "binary");
            gl.uniform1i(bLocation, binary ? 1 : 0);
        }
    );
    
})(glimp);

(function(global) {
    
        global.addFilter(
        // Filter name
        'pack',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)
        '\
        uniform sampler2D texture;\
        uniform int channel;\
        varying vec2 texCoord;\
        vec4 pack(float f) {\
            vec4 color;\
            color.a = floor(f / 256.0 / 256.0 / 256.0);\
            color.b = floor((f - color.a * 256.0 * 256.0 * 256.0) / 256.0 / 256.0);\
            color.g = floor((f - color.a * 256.0 * 256.0 * 256.0 - color.b * 256.0 * 256.0) / 256.0);\
            color.r = floor(f - color.a * 256.0 * 256.0 * 256.0 - color.b * 256.0 * 256.0 - color.g * 256.0);\
            return color / 255.0;\
        }\
        void main() {\
            vec4 pixel = texture2D(texture, texCoord);\
            if (channel == 0) {\
                gl_FragColor = pack(pixel[0]);\
            } else if (channel == 1) {\
                gl_FragColor = pack(pixel[1]);\
            } else if (channel == 2) {\
                gl_FragColor = pack(pixel[2]);\
            } else if (channel == 3) {\
                gl_FragColor = pack(pixel[3]);\
            }\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, channel) {
            channel = channel || 0;
            var cLocation = gl.getUniformLocation(program, "channel");
            gl.uniform1i(cLocation, channel);
        }
    );
    
})(glimp);

(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'rgb2hsv',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            float r = color.r;\
            float g = color.g;\
            float b = color.b;\
            float v = max(max(r,g),b);\
            if (v == 0.) {\
                gl_FragColor = vec4(0.,0.,0.,color.a);\
            } else {\
                float delta = v - min(min(r,g),b);\
                float s = delta/v;\
                float h = 0.;\
                if (s > 0.) {\
                    if (r == v)\
                        h = (g - b)/delta;\
                    else if (g == v)\
                        h = 2. + (b - r)/delta;\
                    else\
                        h = 4. + (r - g)/delta;\
                    if (h < 0.)\
                        h += 6.;\
                }\
                gl_FragColor = vec4(h/6.,s,v,color.a);\
            }\
        }\
        ',
        // Uniforms callback
        null
    );
    
})(glimp);

(function(global) {
    
        global.addFilter(
        // Filter name
        'unpack',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)
        '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        float unpack(vec4 color) {\
            vec4 bitShift = vec4(255.,255.*256.,255.*256.*256.,255.*256.*256.*256.);\
            return dot(color, bitShift);\
        }\
        void main() {\
            gl_FragColor = vec4(unpack(color),0.,0.,1.);\
        }\
        ',
        null
    );
    
})(glimp);

})();