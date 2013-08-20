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

    function _genClassifier(classifier) {

        var values = new Array();
        
        var shaderStr = '\
        const int MAXITER = 1024;\
        uniform sampler2D texture;\
        uniform vec2 textureSize;\
        uniform float scale;\
        uniform sampler2D classifier;\
        uniform vec2 classifierSize;\
        varying vec2 texCoord;\
        float sqsum(float x,float y,float w,float h,vec2 ratio){\
            vec4 a = texture2D(texture, texCoord + ratio * vec2(x,y) * scale);\
            vec4 b = texture2D(texture, texCoord + ratio * vec2(x+w,y) * scale);\
            vec4 c = texture2D(texture, texCoord + ratio * vec2(x,y+h) * scale);\
            vec4 d = texture2D(texture, texCoord + ratio * vec2(x+w,y+h) * scale);\
            return (a.g - b.g -c.g + d.g);\
        }\
        float sum(float x,float y,float w,float h,vec2 ratio){\
            vec4 a = texture2D(texture, texCoord + ratio * vec2(x,y) * scale);\
            vec4 b = texture2D(texture, texCoord + ratio * vec2(x+w,y) * scale);\
            vec4 c = texture2D(texture, texCoord + ratio * vec2(x,y+h) * scale);\
            vec4 d = texture2D(texture, texCoord + ratio * vec2(x+w,y+h) * scale);\
            return (a.r - b.r -c.r + d.r);\
        }\
        vec4 getValue(sampler2D arrayTex,vec2 texSize,float index){\
            float y = floor(index/texSize.x);\
            float x = index - y*texSize.x;\
            vec2 onePixel = 1./(texSize - vec2(1.,1.));\
            return texture2D(arrayTex, vec2(x,y)*onePixel);\
        }\
        float getValue(float index) {\
            float rIndex = floor(index/4.);\
            float position = index - rIndex*4.;\
            vec4 value = getValue(classifier, classifierSize, rIndex);\
            if (position == 0.) {\
                return value[0];\
            } else if (position == 1.) {\
                return value[1];\
            } else if (position == 2.) {\
                return value[2];\
            } else if (position == 3.) {\
                return value[3];\
            }\
        }\
        void main() {\
            vec2 ratio = vec2(1.0, 1.0) / textureSize;\
            float n = 0.;\
            float width = getValue(n++);\
            float height = getValue(n++);\
            vec2 upperBounds = vec2(1.,1.) - vec2(width,height)*scale*ratio;\
            if(any(greaterThan(texCoord,upperBounds))) {\
                discard;\
            } else {\
                gl_FragColor = vec4(1.,1.,1.,1.);\
                float stage_sum, tree_sum;\
                float inv_area = 1.0 / (scale * scale * width * height);\
                float mean = sum(0.,0.,width,height,ratio)*inv_area;\
                float variance = sqsum(0.,0.,width,height,ratio)*inv_area - mean*mean;\
                float std = (variance > 0.) ? sqrt(variance) : 1.;\
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
                            tree_sum += sum(getValue(n++),getValue(n++),getValue(n++),getValue(n++),ratio)*getValue(n++);\
                        }\
                        threshold = getValue(n++);\
                        left_val = getValue(n++);\
                        right_val = getValue(n++);\
                        stage_sum += (tree_sum * inv_area < threshold*std ) ? left_val : right_val;\
                    }\
                    stage_thresh = getValue(n++);\
                    if (stage_sum < stage_thresh) discard;\
                }\
            }\
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
        
        var width = Math.ceil(Math.pow(Math.ceil(values.length/4),0.5)),
            height = width;
        
        var buffer = new ArrayBuffer(width*height*4*Float32Array.BYTES_PER_ELEMENT);
        var view = new Float32Array(buffer);
        
        var i=values.length;
        while(i--){
            view[i] = values[i];
        }
        
        var f = global.frame(view,width,height,true);
        
        return {
            shader : shaderStr,
            valuesFrame : f
        };

    }
    
    global.haar = function (classifier) {
        var _classifier = _genClassifier(classifier);
        _filter = global.createFilter(
            // Use default vertex shader
            null,
            // Generate fragment shader
            _classifier.shader,
            // Uniforms callback
            function (gl, program, frameIn, frameOut, scale) {
                var textureSizeLocation = gl.getUniformLocation(program, "textureSize");
                gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
                // Set scale
                var sLocation = gl.getUniformLocation(program, "scale");
                gl.uniform1f(sLocation, scale);
                // Set our texture of classifiers values
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, _classifier.valuesFrame.texture);
                // Set classifier uniform to position 1
                var cLocation = gl.getUniformLocation(program, "classifier");
                gl.uniform1i(cLocation, 1);
                var classSizeLocation = gl.getUniformLocation(program, "classifierSize");
                gl.uniform2f(classSizeLocation, _classifier.valuesFrame.width, _classifier.valuesFrame.height);
            }
        );
        
        return {
            find : function (frameIn,frameOut,scale) {
                _filter.run(frameIn,frameOut,scale);
            }
        }
    }
    
})(glimp);
