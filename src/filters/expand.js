/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Expand image points to one direction 
 * 
 */
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
