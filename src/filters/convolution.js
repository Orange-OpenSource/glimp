/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Convolution filter extracted from HTML5 Rocks "WebGL fundamentals"
 * tutorial by Gregg Tavares
 * http://www.html5rocks.com/en/tutorials/webgl/webgl_fundamentals/
 * 
 */
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
            kernel = kernel || 'normal';
            var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
            gl.uniform1fv(kernelLocation, kernels[kernel]);
            var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
            gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
        }
    );
    
})(glimp);
