/**
 * @author David Corvoysier / Copyright Orange 2013
 */
(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'binary',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            float r = color.r;\
            float g = color.g;\
            float b = color.b;\
            \
            if (all(equal(color.rgb,vec3(0.,0.,0.)))){\
                gl_FragColor = color;\
            } else {\
                gl_FragColor = vec4(1.0,1.0,1.0,color.a);\
            }\
        }\
        ',
        // Uniforms callback
        null
    );
    
})(glimp);
