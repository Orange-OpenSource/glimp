/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Gaussian background Subtraction
 *
 * The bgmodel stores a quantity representing the pixel noise in the
 * alpha channel.
 * 
 * The noisier a pixel is, the bigger the color distance must be to
 * be classified as foreground. 
 * 
 */
(function(global) {
    
    var _gaussmask;
    var _gaussmix;
            
    global.addBGsubtractor (
        // Background Subtractor Name
        'gaussian',
        // Mask function
        function (frameIn,fgmask,bgmodel,alpha,threshold) {
            // Create the gaussmix filter 
            _gaussmask = _gaussmask || global.createFilter(
                // Vertex Shader (null uses default)
                null,
                // Fragment Shader (null uses default)        
                '\
                uniform sampler2D texture;\
                uniform sampler2D bgmodel;\
                uniform float ts;\
                varying vec2 texCoord;\
                void main() {\
                    vec4 color = texture2D(texture, texCoord);\
                    vec4 bgcolor = texture2D(bgmodel, texCoord);\
                    float d = distance(color.rbg,bgcolor.rgb)/3.;\
                    \
                    gl_FragColor = d>(ts+bgcolor.a) ? color: vec4(0.0,0.0,0.0,0.0);\
                    \
                }\
                ',
                // Uniforms callback
                function (gl, program, frameIn, fgmask, bgmodel, threshold) {
                    // Bind bgmodel texture at position 1
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, bgmodel.texture);
                    // Set bgmodel uniform to position 1
                    var bgLocation = gl.getUniformLocation(program, "bgmodel");
                    gl.uniform1i(bgLocation, 1);
                    // Set threshold
                    var tsLocation = gl.getUniformLocation(program, "ts");
                    gl.uniform1f(tsLocation, threshold);      
                }
            );
            _gaussmask.run(frameIn,fgmask,bgmodel,threshold);
        },
        // Update function
        function (frameIn,bgmodel,alpha,threshold) {
            // Create the gaussmix filter 
            _gaussmix = _gaussmix || global.createFilter(
                // Vertex Shader (null uses default)
                null,
                // Fragment Shader (null uses default)        
                '\
                uniform sampler2D texture;\
                uniform sampler2D bgmodel;\
                uniform float alpha;\
                varying vec2 texCoord;\
                void main() {\
                    vec4 color = texture2D(texture, texCoord);\
                    vec4 bgcolor = texture2D(bgmodel, texCoord);\
                    float d = distance(color.rbg,bgcolor.rgb)/3.;\
                    gl_FragColor = vec4(\
                        mix(bgcolor.rgb,color.rgb,alpha),\
                        mix(bgcolor.a,d,alpha));\
                }\
                ',
                // Uniforms callback
                function (gl, program, frameIn, frameOut, bgmodel, alpha) {
                    // Bind bgmodel texture at position 1
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, bgmodel.texture);
                    // Set reference uniform to position 1
                    var bgLocation = gl.getUniformLocation(program, "bgmodel");
                    gl.uniform1i(bgLocation, 1);
                    // Set mix ratio
                    // Note: since the result is stored in a single byte per channel,
                    // a ratio lower than 1/255 is equivalent to zero
                    alpha = Math.min(1.0,alpha);
                    var alphaLocation = gl.getUniformLocation(program, "alpha");
                    gl.uniform1f(alphaLocation, alpha);      
                }
            );
            _gaussmix.run(frameIn,bgmodel,bgmodel,alpha);
        }
    );        
        

})(glimp);
