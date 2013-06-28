/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Filter allowing to calculate the gaussian mixture of an input frame 
 * relative to a reference frame:
 * -the R,G,B components of the output will contain the mean color
 * components value,
 * - the alpha component decreases with the variance ('noisy' pixels
 * are given a low alpha value)
 * 
 * ratio: the mixture ratio (0 to 1)
 * 
 */
(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'gaussmix',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        uniform sampler2D reference;\
        uniform float ratio;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            vec4 rcolor = texture2D(reference, texCoord);\
            float dist2 = pow(color.r-rcolor.r,2.0);\
            dist2 += pow(color.g-rcolor.g,2.0);\
            dist2 += pow(color.b-rcolor.b,2.0);\
            float invsig2 = min(1.0,3.0/dist2);\
            gl_FragColor = vec4(\
                color.rgb*ratio + rcolor.rgb*(1.0-ratio),\
                invsig2*ratio + rcolor.a*(1.0-ratio));\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, reference, ratio) {
            // Bind reference texture at position 1
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, reference.texture);
            // Set reference uniform to position 1
            var refLocation = gl.getUniformLocation(program, "reference");
            gl.uniform1i(refLocation, 1);
            // Set mix ratio
            var ratioLocation = gl.getUniformLocation(program, "ratio");
            gl.uniform1f(ratioLocation, ratio);
        }
    );
    
})(glimp);
