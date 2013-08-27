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
    
    var _haarShaderStr = '\
        const int MAXITER = 1024;\
        uniform sampler2D texture;\
        uniform vec2 textureSize;\
        uniform int sn;\
        uniform float cwidth;\
        uniform float cheight;\
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
        vec4 lookupValues(sampler2D arrayTex,vec2 texSize,float index){\
            float y = floor(index/texSize.x);\
            float x = index - y*texSize.x;\
            vec2 onePixel = 1./(texSize - vec2(1.,1.));\
            return texture2D(arrayTex, vec2(x,y)*onePixel);\
        }\
        vec4 getValues(float index, vec4 values) {\
            float rIndex = floor(index/4.);\
            float position = index - rIndex*4.;\
            if(position == 0.) {\
                return lookupValues(classifier, classifierSize, rIndex);\
            } else {\
                return values;\
            }\
        }\
        float getValue(float index, vec4 values) {\
            float rIndex = floor(index/4.);\
            float position = index - rIndex*4.;\
            if (position == 0.) {\
                return values[0];\
            } else if (position == 1.) {\
                return values[1];\
            } else if (position == 2.) {\
                return values[2];\
            } else {\
                return values[3];\
            }\
        }\
        void main() {\
            vec2 ratio = vec2(1.0, 1.0) / textureSize;\
            vec2 upperBounds = vec2(1.,1.) - vec2(cwidth,cheight)*scale*ratio;\
            if(any(greaterThan(texCoord,upperBounds))) {\
                gl_FragColor = vec4(0.,0.,0.,0.);\
            } else {\
                float n = 0.;\
                vec4 values = vec4 (0.,0.,0.,0.);\
                float stage_sum, tree_sum;\
                float inv_area = 1.0 / (scale * scale * cwidth * cheight);\
                float mean = sum(0.,0.,cwidth,cheight,ratio)*inv_area;\
                float variance = sqsum(0.,0.,cwidth,cheight,ratio)*inv_area - mean*mean;\
                float std = (variance > 0.) ? sqrt(variance) : 1.;\
                int tn, fn;\
                float x, y, w, h, weight;\
                float stage_thresh, threshold, left_val, right_val;\
                for (int i = 0; i < MAXITER; i++) {\
                    if(i == sn) break;\
                    stage_sum = 0.;\
                    values = getValues(n,values);\
                    tn = int(getValue(n++,values));\
                    for (int j = 0; j < MAXITER; j++) {\
                        if(j == tn) break;\
                        tree_sum = 0.;\
                        values = getValues(n,values);\
                        fn = int(getValue(n++,values));\
                        for (int k = 0; k < MAXITER ; k++) {\
                            if(k == fn) break;\
                            values = getValues(n,values);\
                            x = getValue(n++,values);\
                            values = getValues(n,values);\
                            y = getValue(n++,values);\
                            values = getValues(n,values);\
                            w = getValue(n++,values);\
                            values = getValues(n,values);\
                            h = getValue(n++,values);\
                            values = getValues(n,values);\
                            weight = getValue(n++,values);\
                            tree_sum += sum(x,y,w,h,ratio)*weight;\
                        }\
                        values = getValues(n,values);\
                        threshold = getValue(n++,values);\
                        values = getValues(n,values);\
                        left_val = getValue(n++,values);\
                        values = getValues(n,values);\
                        right_val = getValue(n++,values);\
                        stage_sum += (tree_sum * inv_area < threshold*std ) ? left_val : right_val;\
                    }\
                    values = getValues(n,values);\
                    stage_thresh = getValue(n++,values);\
                    if (stage_sum < stage_thresh) {\
                        gl_FragColor = vec4(0.,0.,0.,0.);\
                        break;\
                    } else {\
                        gl_FragColor = vec4(stage_sum-stage_thresh,0.,0.,1.);\
                    }\
                }\
            }\
        }';

    function _genClassifier(classifier) {

        var values = [];
                            
        var cwidth = classifier.size[0] | 0;
        var cheight = classifier.size[1] | 0;
        
        var stages = classifier.stages,
            sn = stages.length;
        for(var i = 0; i < sn; ++i) {
            var stage = stages[i],
                stage_thresh = stage.threshold,
                trees = stage.trees,
                tn = trees.length;
            values.push(tn);
            for(var j = 0; j < tn; ++j) {
                var tree = trees[j],
                    features = tree.features,
                    fn = features.length;
                values.push(fn);
                if(tree.tilted === 1) {
                    throw new Error('Tilted cascades are not supported');
                } else {
                    for(var k=0; k < fn; ++k) {
                        var feature = features[k];
                        for(var l=0; l < 5; ++l) {
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
        
        i = values.length;
        while(i--){
            view[i] = values[i];
        }
        
        var f = global.frame(view,width,height,true);
        
        return {
            valuesFrame : f,
            cwidth: cwidth,
            cheight: cheight,
            sn: sn
        };

    }
    
    global.haar = function (classifier) {
        var _classifier = _genClassifier(classifier);
        var _filter = global.createFilter(
            // Use default vertex shader
            null,
            // Generate fragment shader
            _haarShaderStr,
            // Uniforms callback
            function (gl, program, frameIn, frameOut, scale) {
                var textureSizeLocation = gl.getUniformLocation(program, "textureSize");
                gl.uniform2f(textureSizeLocation, frameIn.width, frameIn.height);
                // Set classifier parameters
                var wLocation = gl.getUniformLocation(program, "cwidth");
                gl.uniform1f(wLocation, _classifier.cwidth);
                var hLocation = gl.getUniformLocation(program, "cheight");
                gl.uniform1f(hLocation, _classifier.cheight);
                var snLocation = gl.getUniformLocation(program, "sn");
                gl.uniform1i(snLocation, _classifier.sn);
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
        };
    };
    
})(glimp);
