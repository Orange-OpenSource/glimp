/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Filter allowing to mix the input frame with a reference frame
 * 
 * alpha: 0 to 1 (0 means no change, 1 a full replacement)
 * 
 */
(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'mix',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        uniform sampler2D reference;\
        uniform float alpha;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            vec4 rcolor = texture2D(reference, texCoord);\
            gl_FragColor = mix(color,rcolor,alpha);\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, reference, alpha) {
            // Bind reference texture at position 1
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, reference.texture);
            // Set reference uniform to position 1
            var refLocation = gl.getUniformLocation(program, "reference");
            gl.uniform1i(refLocation, 1);
            // Set alpha
            // Note: since the result is stored in a single byte per channel,
            // alpha value lower than 1/255 are equivalent to zero
            alpha = Math.min(1.0,alpha);
            var alphaLocation = gl.getUniformLocation(program, "alpha");
            gl.uniform1f(alphaLocation, alpha);
        }
    );
    
})(glimp);
