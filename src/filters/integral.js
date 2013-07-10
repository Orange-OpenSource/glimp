/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Inspired by:
 * 
 * Fast Summed-AreaTable Generation and its Applications
 * 
 * Justin Hensley, Thorsten Scheuermann, Greg Coombe, Montek Singh
 * and Anselmo Lastra
 * 
 * http://www.shaderwrangler.com/publications/sat/SAT_EG2005.pdf
 * 
 */
(function(global) {
    
    var _initShader,_haddShader,_vaddShader;
    
    global.integral = function(frameIn,frameOut,n) {
        n = n || 2;
        var hpass = Math.ceil(Math.log(frameIn.width)/Math.log(n));
        var vpass = Math.ceil(Math.log(frameIn.height)/Math.log(n));
        var _frames = [global.frame(),global.frame()];
        var _commonShaderStr = '\
            float packColor(vec4 color) {\
                vec4 bitShift = vec4(256.,256.*256.,256.*256.*256.,256.*256.*256.*256.);\
                return dot(color, bitShift);\
            }\
            \
            vec4 unpackColor(float f) {\
                vec4 color;\
                color.a = floor(f / 256.0 / 256.0 / 256.0);\
                color.b = floor((f - color.a * 256.0 * 256.0 * 256.0) / 256.0 / 256.0);\
                color.g = floor((f - color.a * 256.0 * 256.0 * 256.0 - color.b * 256.0 * 256.0) / 256.0);\
                color.r = floor(f - color.a * 256.0 * 256.0 * 256.0 - color.b * 256.0 * 256.0 - color.g * 256.0);\
                return color / 256.0;\
            }\
            float offset(float length,float pass) {\
                return 1.0/length*exp2(pass);\
            }';
        _initShader = _initShader || global.createFilter(
            // Vertex Shader (null uses default)
            null,
            // Fragment Shader (null uses default)
            _commonShaderStr +         
            '\
            uniform sampler2D texture;\
            varying vec2 texCoord;\
            void main() {\
                vec4 color = texture2D(texture, texCoord);\
                float s = (color.r * .212671 + color.g * .715160 + color.b * .072169)*255.;\
                gl_FragColor = unpackColor(s);\
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
                float offset = offset(width,pass);\
                if(texCoord.x <= offset) {\
                    gl_FragColor = pixA;\
                } else {\
                    vec4 pixB = texture2D(texture, texCoord + offset * vec2(-1.,0.));\
                    float s = packColor(pixA) + packColor(pixB);\
                    gl_FragColor = unpackColor(s);\
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
                float offset = offset(height,pass);\
                if(texCoord.y <= offset) {\
                    gl_FragColor = pixA;\
                } else {\
                    vec4 pixB = texture2D(texture, texCoord + offset * vec2(0.,-1.));\
                    float s = packColor(pixA) + packColor(pixB);\
                    gl_FragColor = unpackColor(s);\
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
        for(var i=0;i<vpass-1;i++){
            _vaddShader.run(_frames[(i+hpass)%2],_frames[(i+hpass+1)%2],i);
        }
        _vaddShader.run(_frames[(hpass+vpass-1)%2],frameOut,vpass-1);
    }
    
})(glimp);
