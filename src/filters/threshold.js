/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Threshold filter: returns only pixels within bounds
 * 
 * from: the lower threshold (4 [0->1] channels array)
 * to: the upper threshold vector (4 [0->1] channels array)
 * 
 */
(function(global) {
    
    // Register this filter
    global.addFilter(
        // Filter name
        'threshold',
        // Vertex Shader (null uses default)
        null,
        // Fragment Shader (null uses default)        
        '\
        uniform sampler2D texture;\
        uniform vec4 from;\
        uniform vec4 to;\
        uniform int binary;\
        varying vec2 texCoord;\
        void main() {\
            vec4 color = texture2D(texture, texCoord);\
            \
            if (any(lessThan(color,from)) || any(greaterThan(color,to))) {\
                gl_FragColor = vec4(0.,0.,0.,0.);\
            } else {\
                if (binary == 1) {\
                    gl_FragColor = vec4(1.,1.,1.,1.);\
                } else {\
                    gl_FragColor = color;\
                }\
            }\
        }\
        ',
        // Uniforms callback
        function (gl, program, frameIn, frameOut, from, to, binary) {
            from = from || [0.,0.,0.,0.];
            to = to || [1.,1.,1.,1.];
            binary = binary || false;       
            var fLocation = gl.getUniformLocation(program, "from");
            gl.uniform4fv(fLocation, new Float32Array(from));
            var tLocation = gl.getUniformLocation(program, "to");
            gl.uniform4fv(tLocation, new Float32Array(to));
            var bLocation = gl.getUniformLocation(program, "binary");
            gl.uniform1i(bLocation, binary ? 1 : 0);
        }
    );
    
})(glimp);
