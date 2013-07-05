/**
 * @author David Corvoysier / Copyright Orange 2013
 */
(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'skin',
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
            if ((r<=45.0/255.0)||(g<=40.0/255.0)||(b<=20.0/255.0)\
                ||(r<=g)||(r<=b)\
                ||((r-min(g,b))<=15.0/255.0)\
                ||(abs(r-g)<=15.0/255.0)){\
                gl_FragColor = vec4(0.0,0.0,0.0,0.0);\
            } else {\
                gl_FragColor = color;\
            }\
        }\
        ',
        // Uniforms callback
        null
    );
    
})(glimp);
