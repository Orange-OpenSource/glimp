/**
 * @author David Corvoysier / Copyright Orange 2013
 * 
 * Basic background Subtraction
 * 
 * Compares the current frame with the previous one
 *
 */
(function(global) {

    global.addBGsubtractor (
        // Background Subtractor Name
        'basic',
        // Mask function
        function (frameIn,fgmask,bgmodel,threshold) {
            // Use the colormask filter
            global.colormask(frameIn,fgmask,bgmodel,threshold);
        },
        // Update function
        function (frameIn,bgmodel) {
            // Copy the current frame to the bgmodel 
            global.copy(frameIn,bgmodel);
        }
    );        

})(glimp);
