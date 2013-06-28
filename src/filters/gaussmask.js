/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Apply a mask based on color distance between the input frame
 * and a gaussian mixture
 * 
 * threshold: the distance threshold (0 to 1)
 * keepClose: 0 (default) to keep far pixels, anything else to keep close pixels
 * 
 */
(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'gaussmask',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        uniform sampler2D reference;\
        uniform float ts;\
        uniform float kc;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            vec4 rcolor = texture2D(reference, texCoord);\
            float dist2 = pow(color.r-rcolor.r,2.0);\
            dist2 += pow(color.g-rcolor.g,2.0);\
            dist2 += pow(color.b-rcolor.b,2.0);\
            dist2 = dist2/3.0;\
            \
            if (kc == 0.0) {\
                gl_FragColor = dist2*rcolor.a > ts*ts ? color: vec4(0.0,0.0,0.0,0.0);\
            } else {\
                gl_FragColor = dist2*rcolor.a > ts*ts ? vec4(0.0,0.0,0.0,0.0): color;\
            }\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, reference, threshold, keepClose) {
            // Bind reference texture at position 1
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, reference.texture);
            // Set reference uniform to position 1
            var refLocation = gl.getUniformLocation(program, "reference");
            gl.uniform1i(refLocation, 1);
            // Set threshold
            var tsLocation = gl.getUniformLocation(program, "ts");
            gl.uniform1f(tsLocation, threshold);
            // Set proximity inversion flag
            keepClose = keepClose || 0;
            var kfLocation = gl.getUniformLocation(program, "kc");
            gl.uniform1f(kfLocation, keepClose);            
        }
    );
    
})(glimp);
