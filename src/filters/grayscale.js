/**
 * @author David Corvoysier / Copyright Orange 2013
 */
(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'grayscale',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            float s =  color.r * .212671 + color.g * .715160 + color.b * .072169;\
            gl_FragColor = vec4(s, s, s, color.a);\
        }\
        ',
        // Uniforms callback
        null
    );
    
})(glimp);
