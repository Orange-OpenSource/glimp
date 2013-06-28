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
    
    var Filter = function (canvas, vertexSource, fragmentSource, callback) {
        // Store WebGL context
        var gl = canvas.gl;
        var _callback = callback;
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
        // Create a framebuffer for this filter
        var _fb = gl.createFramebuffer();
                
        return {
            apply : function (frameIn,frameOut) {
                // Bind the framebuffer
                if(frameOut)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, _fb);
                
                // Set the frameIn texture as input
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, frameIn.asTexture());

                // Set coordinates
                var vertexAttribute = gl.getAttribLocation(_program, 'vertex');
                gl.enableVertexAttribArray(vertexAttribute);
                var texCoordAttribute = gl.getAttribLocation(_program, '_texCoord');
                gl.enableVertexAttribArray(texCoordAttribute);
                gl.useProgram(_program);
                gl.bindBuffer(gl.ARRAY_BUFFER, _vertexBuffer);
                gl.vertexAttribPointer(vertexAttribute, 2, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, _texCoordBuffer);
                gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);
                
                // Use the first texture
                var texLoc = gl.getUniformLocation(_program, 'texture');
                gl.uniform1i(texLoc, 0);
                
                // This callback allows the filter to be specialized
                if(_callback) {
                    // Get the extra parameters we may have received
                    var args = Array.prototype.slice.call(arguments);
                    // Add gl & program parameters at the beginning
                    args.splice(0, 0, gl, _program);
                    // Call our callback
                    _callback.apply (this, args);
                }

                if(frameOut && frameOut.asTexture) {
                    // Set the frameOut texture as output
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameOut.asTexture(), 0);
                    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                        throw new Error('incomplete framebuffer');
                    }
                }
                
                // Draw
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);                    
                
                // Flip results
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
        }
    };

    global.addFilter = function (name, vertexSource, fragmentSource, callback) {
        global[name] = function () {
            return new Filter(global.canvas(), vertexSource, fragmentSource, callback);
        };
    };
    
    // Register our default filter, a simple carbon-copy
    global.addFilter('copy');

})(glimp);
