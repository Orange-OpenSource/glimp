/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Filter allowing to mix the input frame with a reference frame
 * 
 * amount: 0 to 1 (0 means no change, 1 for a full replacement)
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
        uniform float amount;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            vec4 rcolor = texture2D(reference, texCoord);\
            gl_FragColor = rcolor*amount + color*(1.0-amount);\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, reference, amount) {
            // Bind reference texture at position 1
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, reference.asTexture());
            // Set reference uniform to position 1
            var refLocation = gl.getUniformLocation(program, "reference");
            gl.uniform1i(refLocation, 1);
            // Set amount
            var amountLocation = gl.getUniformLocation(program, "amount");
            gl.uniform1f(amountLocation, amount);
        }
    );
    
})(glimp);
