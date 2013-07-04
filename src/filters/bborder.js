/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Binary Border filter
 * 
 */
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
