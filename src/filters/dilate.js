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
            uniform sampler2D texture;\
            uniform vec2 u_textureSize;\
            varying vec2 texCoord;\
            void main() {\
            vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;\
            vec4 color = texture2D(texture, texCoord);\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2(-1, -1)));\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2( 0, -1)));\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2( 1, -1)));\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2(-1,  0)));\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2( 0,  0)));\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2( 1,  0)));\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2(-1,  1)));\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2( 0,  1)));\
            color = max(color, texture2D(texture, texCoord + onePixel * vec2( 1,  1)));\
            \
            gl_FragColor = color;\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut) {
            var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
            gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
        }
    );
    
})(glimp);
