/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Adapted from glfx.js, Copyright (C) 2011 by Evan Wallace
 * 
 */
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
