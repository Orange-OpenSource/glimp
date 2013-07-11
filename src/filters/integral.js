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
    var _frames;
    
    global.integral = function(frameIn,frameOut,n) {
        n = n || 2;
        var hpass = Math.ceil(Math.log(frameIn.width)/Math.log(n));
        var vpass = Math.ceil(Math.log(frameIn.height)/Math.log(n));
        if (!_frames 
        || (_frames[0].width != frameIn.width)
        || (_frames[0].height != frameIn.height)){
            _frames = [
                global.frame(null,frameIn.width,frameIn.height,true),
                global.frame(null,frameIn.width,frameIn.height,true)
            ];
        }
        var _commonShaderStr = '\
            float offset(float length,float pass) {\
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
                float s = (color.r * .212671 + color.g * .715160 + color.b * .072169)*255.;\
                gl_FragColor = vec4(s,0.,0.,0.);\
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
                float offset = offset(height,pass);\
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
        for(var i=0;i<vpass;i++){
            _vaddShader.run(_frames[(i+hpass)%2],_frames[(i+hpass+1)%2],i);
        }
        global.pack(_frames[(hpass+vpass)%2],frameOut);
    }
    
})(glimp);
