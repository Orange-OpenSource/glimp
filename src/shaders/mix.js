/**
 * @filter         Mix
 * @description    Mixes the image with a reference image of the same size.
 * @param amount   0 to 1 (0 for no effect, 1 for complete replacement)
 */
function mix(reference,amount) {
    gl.mix = gl.mix || new Shader(null, '\
        uniform sampler2D texture;\
        uniform sampler2D reference;\
        uniform float amount;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            vec4 rcolor = texture2D(reference, texCoord);\
            gl_FragColor = rcolor*amount + color*(1.0-amount);\
        }\
    ');

    // Use reference texture
    reference._.use(1);
    // Set texture uniform in shader
    gl.mix.textures({reference:1});
    
    simpleShader.call(this, gl.mix, {
        amount: clamp(0, amount, 1)
    });

    // Stop using reference texture
    reference._.unuse(1);

    return this;
}
