/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Average background Subtraction
 * 
 * Parameters:
 * - alpha
 * - threshold
 *
 */
(function(global) {

    global.addBGsubtractor (
        // Background Subtractor Name
        'average',
        // Mask function
        function (frameIn,fgmask,bgmodel,alpha,threshold) {
            // Use the generic colormask filter
            global.colormask(frameIn,fgmask,bgmodel,threshold);
        },
        // Update function
        function (frameIn,bgmodel,alpha,threshold) {
            // Use the generic mix function 
            global.mix(frameIn,bgmodel,bgmodel,alpha);
        }
    );        

})(glimp);
