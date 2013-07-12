/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Haar cascade filter based on Viola/Jones algorithm improved by
 * Lienart
 * 
 * Takes an integral image and a classifier as input and outputs a
 * binary mask
 * 
 */
 
(function(global) {

    function generateShader(classifier) {

        var values = new Array();
        
        var shaderStr = '\
        const int MAXITER = 1024;\
        uniform sampler2D texture;\
        uniform vec2 textureSize;\
        uniform float scale;\
        uniform sampler2D classifier;\
        uniform vec2 classifierSize;\
        varying vec2 texCoord;\
        float sum(float x,float y,float width,float height,float weight,vec2 ratio){\
            float w = width * scale;\
            float h = height * scale;\
            vec4 a = texture2D(texture, texCoord + ratio * vec2(x,y));\
            vec4 b = texture2D(texture, texCoord + ratio * vec2(x+w,y));\
            vec4 c = texture2D(texture, texCoord + ratio * vec2(x,y+h));\
            vec4 d = texture2D(texture, texCoord + ratio * vec2(x+w,y+h));\
            return (a.r - b.r -c.r + d.r)*weight;\
        }\
        vec4 getValue(sampler2D tex,vec2 texSize,float index){\
            float y = index/texSize.x;\
            float x = index - y;\
            return texture2D(arrayTex, vec2(x,y)/texSize);\
        }\
        vec4 getValue(index) {\
            return getValue(classifier, classifierSize, index);\
        }\
        void main() {\
            vec2 ratio = vec2(1.0, 1.0) / textureSize;\
            int n = 0;\
            float stage_sum, tree_sum;\
            float inv_area = 1.0 / (scale * scale * getValue(n++) * getValue(n++));\
            int sn, tn, fn;\
            float stage_thresh, threshold, left_val, right_val;\
            sn = int(getValue(n++));\
            for (int i = 0; i < MAXITER; i++) {\
                if(i == sn) break;\
                stage_sum = 0.;\
                tn = int(getValue(n++));\
                for (int j = 0; j < MAXITER; j++) {\
                    if(j == tn) break;\
                    tree_sum = 0.;\
                    fn = int(getValue(n++));\
                    for (int k = 0; k < MAXITER ; k++) {\
                        if(k == fn) break;\
                        tree_sum += sum(getValue(n++),getValue(n++),getValue(n++),getValue(n++),getValue(n++),ratio);\
                    }\
                    threshold = getValue(n++);\
                    left_val = getValue(n++);\
                    right_val = getValue(n++);\
                    stage_sum += (tree_sum * inv_area < threshold ) ? left_val : right_val;\
                }\
                stage_thresh = getValue(n++);\
                if (stage_sum < stage_thresh) discard;\
            }\
            gl_FragColor = vec4(1.,1.,1.,1.);\
        }';
                            
        var cwidth = classifier.size[0] | 0;
        var cheight = classifier.size[1] | 0;    
        values.push(cwidth);
        values.push(cheight);
        
        var stages = classifier.stages,
            sn = stages.length;
        values.push(sn);
        for(i = 0; i < sn; ++i) {
            var stage = stages[i],
                stage_thresh = stage.threshold,
                trees = stage.trees,
                tn = trees.length;
            values.push(tn);
            for(j = 0; j < tn; ++j) {
                var tree = trees[j],
                    features = tree.features,
                    fn = features.length;
                values.push(fn);
                if(tree.tilted === 1) {
                    throw new Error('Tilted cascades are not supported');
                } else { 
                    for(k=0; k < fn; ++k) {
                        var feature = features[k];
                        for(l=0; l < 5; ++l) {
                            values.push(feature[l]);
                        }
                    }
                }
                values.push(tree.threshold);
                values.push(tree.left_val);
                values.push(tree.right_val);
            }
            values.push(stage_thresh);
        }

        shaderStr = 'uniform float values[' + values.length + '];' + shaderStr;
        
        return {
            shader : shaderStr,
            values : values
        };

    }
    
    global.haar = function (classifier) {
        _filter = global.createFilter(
            // Use default vertex shader
            null,
            // Generate fragment shader
            generateShader(classifier).shader,
            // Uniforms callback
            function (gl, program, frameIn, frameOut, scale, classTex) {
                var textureSizeLocation = gl.getUniformLocation(program, "textureSize");
                gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
                // Set scale
                var sLocation = gl.getUniformLocation(program, "scale");
                gl.uniform1f(sLocation, scale);
                // Set our texture of classifiers values
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, classTex.texture);
                // Set classifier uniform to position 1
                var cLocation = gl.getUniformLocation(program, "classifier");
                gl.uniform1i(cLocation, 1);
                var classSizeLocation = gl.getUniformLocation(program, "classifierSize");
                gl.uniform2f(classSizeLocation, classTex.width, classTex.height);
            }
        );
        
        return {
            generateShader : generateShader
        }
    }
    
})(glimp);