//makes an array out of the object at the location of the property path
function arrayify (obj, propArray) {
    //drill down to the desired property
    let currentLocation = obj;
    for (let i = 0; i < propArray.length; i++) {
        const propName = propArray[i];
        if (i + 1 === propArray.length) { //this is the last index. convert the object here into an array
            const arr = [];
            for (let prop in currentLocation[propName]) {
                arr.push(currentLocation[propName][prop]);
            }
            return arr; //return the arrayified object
        }
        else { //this is not the last index. keep drilling down into the object
            currentLocation = currentLocation[propName];
        }
    }
}

module.exports = arrayify;