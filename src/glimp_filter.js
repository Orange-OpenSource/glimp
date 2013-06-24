/**
 * @author David Corvoysier / Copyright Orange 2013
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
    
    var Filter = function (gl,vertexSource, fragmentSource) {
        // Store WebGL context
        var _gl = gl;
        // Create the filter program
        var _program = _gl.createProgram();
        vertexSource = vertexSource || defaultVertexSource;
        fragmentSource = fragmentSource || defaultFragmentSource;
        fragmentSource = 'precision highp float;' + fragmentSource; // annoying requirement is annoying
        _gl.attachShader(_program, compileSource(_gl,_gl.VERTEX_SHADER, vertexSource));
        _gl.attachShader(_program, compileSource(_gl,_gl.FRAGMENT_SHADER, fragmentSource));
        _gl.linkProgram(_program);
        if (!_gl.getProgramParameter(_program, _gl.LINK_STATUS)) {
            throw 'link error: ' + _gl.getProgramInfoLog(_program);
        }
        // Create buffer coordinates
        var _vertexBuffer = _gl.createBuffer();
        _gl.bindBuffer(_gl.ARRAY_BUFFER, _vertexBuffer);
        _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 1 ]), gl.STATIC_DRAW);
        var _texCoordBuffer = _gl.createBuffer();
        _gl.bindBuffer(_gl.ARRAY_BUFFER, _texCoordBuffer);
        _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array([ 0, 1, 0, 0, 1, 1, 1, 0 ]), gl.STATIC_DRAW);
        // Create a framebuffer for this filter
        var _fb = _gl.createFramebuffer();
                
        return {
            apply : function (frameIn,frameOut) {
                // Bind the framebuffer
                if(frameOut)
                    _gl.bindFramebuffer(_gl.FRAMEBUFFER, _fb);
                
                // Set the frameIn texture as input
                _gl.activeTexture(_gl.TEXTURE0);
                _gl.bindTexture(_gl.TEXTURE_2D, frameIn.asTexture());
                    
                // Set the frameOut texture as output
                if(frameOut)
                    _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, frameOut.asTexture(), 0);
                
                // Set coordinates
                var vertexAttribute = _gl.getAttribLocation(_program, 'vertex');
                _gl.enableVertexAttribArray(vertexAttribute);
                var texCoordAttribute = _gl.getAttribLocation(_program, '_texCoord');
                _gl.enableVertexAttribArray(texCoordAttribute);
                _gl.useProgram(_program);
                _gl.bindBuffer(_gl.ARRAY_BUFFER, _vertexBuffer);
                _gl.vertexAttribPointer(vertexAttribute, 2, gl.FLOAT, false, 0, 0);
                _gl.bindBuffer(gl.ARRAY_BUFFER, _texCoordBuffer);
                _gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);
                
                // Use the first texture
                var texLoc = _gl.getUniformLocation(_program, 'texture');
                _gl.uniform1i(texLoc, 0);
                
                // Draw
                _gl.drawArrays(_gl.TRIANGLE_STRIP, 0, 4);
                
                // Flip results
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
            }
        }
    };
    
    var copy = function () {
        var canvas = global.canvas();
        return new Filter(canvas.gl);
    };
    
    var skin = function () {
        var canvas = global.canvas();
        return new Filter(
            canvas.gl,
            null,
             '\
                uniform sampler2D texture;\
                varying vec2 texCoord;\
                void main() {\
                    vec4 color = texture2D(texture, texCoord);\
                    float r = color.r;\
                    float g = color.g;\
                    float b = color.b;\
                    \
                    if ((r>45.0/255.0)&&(g>40.0/255.0)&&(b>20.0/255.0)\
                        &&(r>g)&&(r>b)\
                        &&(r-min(g,b)>15.0/255.0)\
                        &&(abs(r-g)>15.0/255.0)){\
                        gl_FragColor = color;\
                    } else {\
                        gl_FragColor = vec4(0.0,0.0,0.0,color.a);\
                    }\
                }\
            '
            );        
    }
    
    global.copy = copy;
    global.skin = skin;

})(glimp);

