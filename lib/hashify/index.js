//provides a fast way to populate data in JSON from an array of SQL data
function hashify (obj, array, populateFunc) {
    //iterate through the array and pass each element to the populate function
    array.forEach(e => {
        const element = populateFunc(e);
        //each element has a location its data should reside in
        //create or find it, and let the caller decide how to modify the data there
        let currentLocation = obj;
        for (let i = 0; i < element.location.length; i++) {
            const propName = element.location[i];
            if (currentLocation[propName] === undefined) { //nothing there. create an empty object
                currentLocation[propName] = {};
            }
            if (i + 1 === element.location.length) { //this is the last index. insert data into currentLocation's prop
                //if data is a function, pass in the location for it to be populated
                //if data is not a function, then just set the location to the value in data
                if (typeof element.data === "function") {
                    element.data(currentLocation[propName]);
                }
                else {
                    currentLocation[propName] = element.data;
                }
            }
            else { //this is not the last index. keep drilling down into the object
                currentLocation = currentLocation[propName];
            }
        }
    });
    return obj;
}

module.exports = hashify;
