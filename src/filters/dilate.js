/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Erosion filter
 * 
 */
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
