/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * RGB to HSV Converter
 * 
 * V = MAX(R,G,B)
 * S = (V - MIN(R,G,B))/V (or 0 if V == 0)
 * 
 * H = (G - B)/S modulo 6 if V = R
 *   = (B - R)/S + 2 modulo 6 if V = G
 *   = (R - G)/S + 4 modulo 6 if V = B
 * 
 */
(function(global) {

    // Register this filter
    global.addFilter(
        // Filter name
        'rgb2hsv',
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
            float v = max(max(r,g),b);\
            if (v == 0.) {\
                gl_FragColor = vec4(0.,0.,0.,color.a);\
            } else {\
                float delta = v - min(min(r,g),b);\
                float s = delta/v;\
                float h = 0.;\
                if (s > 0.) {\
                    if (r == v)\
                        h = (g - b)/delta;\
                    else if (g == v)\
                        h = 2. + (b - r)/delta;\
                    else\
                        h = 4. + (r - g)/delta;\
                    if (h < 0.)\
                        h += 6.;\
                }\
                gl_FragColor = vec4(h/6.,s,v,color.a);\
            }\
        }\
        ',
        // Uniforms callback
        null
    );
    
})(glimp);
