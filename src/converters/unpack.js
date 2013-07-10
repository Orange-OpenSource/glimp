/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Unpacks a single float value encoded into all four channels of a low 
 * res RGBA texture  
 * 
 * Note: This is required to pass float buffers as input when reading 
 * from float textures is not supported
 * 
 */
(function(global) {
    
        global.addFilter(
        // Filter name
        'unpack',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)
        '\
        uniform sampler2D texture;\
        varying vec2 texCoord;\
        float unpack(vec4 color) {\
            vec4 bitShift = vec4(255.,255.*256.,255.*256.*256.,255.*256.*256.*256.);\
            return dot(color, bitShift);\
        }\
        void main() {\
            gl_FragColor = vec4(unpack(color),0.,0.,1.);\
        }\
        ',
        null
    );
    
})(glimp);
