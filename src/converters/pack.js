/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Packs a single float channel of an high res texture into all four
 * channels of a low res RGBA texture
 * 
 * Note: This converter is a workaround to overcome the fact that you
 * cannot read pixels from a float texture in WebGL (06/2013)
 * 
 */
(function(global) {
    
        global.addFilter(
        // Filter name
        'pack',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)
        '\
        uniform sampler2D texture;\
        uniform int channel;\
        varying vec2 texCoord;\
        vec4 pack(float f) {\
            vec4 color;\
            color.a = floor(f / 256.0 / 256.0 / 256.0);\
            color.b = floor((f - color.a * 256.0 * 256.0 * 256.0) / 256.0 / 256.0);\
            color.g = floor((f - color.a * 256.0 * 256.0 * 256.0 - color.b * 256.0 * 256.0) / 256.0);\
            color.r = floor(f - color.a * 256.0 * 256.0 * 256.0 - color.b * 256.0 * 256.0 - color.g * 256.0);\
            return color / 255.0;\
        }\
        void main() {\
            vec4 pixel = texture2D(texture, texCoord);\
            if (channel == 0) {\
                gl_FragColor = pack(pixel[0]);\
            } else if (channel == 1) {\
                gl_FragColor = pack(pixel[1]);\
            } else if (channel == 2) {\
                gl_FragColor = pack(pixel[2]);\
            } else if (channel == 3) {\
                gl_FragColor = pack(pixel[3]);\
            }\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, channel) {
            channel = channel || 0;
            var cLocation = gl.getUniformLocation(program, "channel");
            gl.uniform1i(cLocation, channel);     
        }
    );
    
})(glimp);
