const app = require('../../app');
const check = require('check-types');

/*  CODE REVIEW:
    - avoid the use of synchronous functions. use async library
    - use callbacks instead of returns
*/

//given an existing hash, an array of homogenous objects, a function that transforms those objects into
//an array of ordered properties, and a value, convert all the objects into one nested accumulated hash in
//order to change how the data is constructed. all leaflets become the leaf value
function hashify (hash, array, transformFunc, leafValue) {
    for (let i = 0; i < array.length; i++) {
        //get the order of values to nest into each other
        const order = transformFunc(array[i]);
        let nestedHash = hash; //the current nested level of the hash
        for (let j = 0; j < order.length; j++) {
            if (!nestedHash[order[j]]) {
                //non-existing properties get added with values of objects, or leafValue if it's the last element to add
                if (j < order.length - 1) {
                    nestedHash[order[j]] = {};
                }
                else {
                    nestedHash[order[j]] = leafValue;
                }
            }
            nestedHash = nestedHash[order[j]];
        }
    }
    return hash;
}

//iterates over the array, using the callback to let the caller
//manage how to structure the object response using the template as a base.
//can be stacked on each other by calling flattenRecurse carefully in the callback
//the return of the callback can be one object or an array of objects
function flattenRecurse (arr, template, cb) {
    let results = [];
    for (let i = 0; i < arr.length; i++) {
        let templateClone = JSON.parse(JSON.stringify(template));
        const templates = cb(templateClone, arr[i]);
        if (check.array(templates)) {
            results = results.concat(templates);
        }
        else {
            results.push(templates);
        }
    }
    return results;
}

//given a hash whose properties to look up are also hashes, an array
//of properties, and a callback function that informs the caller when to replace a
//hash with an array, recursively finds all hashes that match the specificiations
//in the property array, and converts them to arrays
function arrayify (hash, propArray, cb) {
    //do not mutate propArray
    const propArrayCopy = propArray.concat();
    if (propArrayCopy.length > 0) { //nest deeper into the object
        const value = propArrayCopy.shift(); //remove first element
        if (value !== null) { //jump to the property name specified in the value
            arrayify(hash[value], propArrayCopy, function (array) {
                hash[value] = array;
            });
        }
        else { //iterate through the properties in this level
            for (let key in hash) {
                arrayify(hash[key], propArrayCopy, function (array) {
                    hash[value] = array;
                });
            }
        }
    }
    else { //hit final destination
        //convert the hash into an array and return the result
        //all property names are dropped in the process
        let converted = [];
        for (let key in hash) {
            converted.push(hash[key]);
        }
        if (typeof cb === 'function') { //pass the new array to a callback
            cb(converted);
        }
    }
}

//generic function that filters an array of SQL objects with ids attached to them depending on the mode specified
//uniqueProperties is an array of properties from each object in the array in non production mode for
//checking for uniqueness among other objects
function filterArrayByStatus (array, uniqueProperties, isProduction) {
    //PRODUCTION mode: Only elements with statuses of PRODUCTION are used
    //STAGING mode: All elements with unique property names whose ID values are the highest are used
    if (isProduction) {
        return array.filter(function (elem) {
            return elem.status === 'PRODUCTION';
        });
    }
    else {
        //sort the array by ID from highest to lowest. create a sort of set
        //where we make sure only the first elements found with unique property names are kept
        let set = {};
        return array.sort(function (a, b) {
            return b.id - a.id; //highest to lowest
        }).filter(function (elem) {
            //the algorithm for checking for uniqueness. iterate over uniqueProperties and use the set as a cache
            //all elements are considered for uniqueness, but only an evaluation needs to happen for the final one!
            const lastIndex = uniqueProperties.length - 1;
            let setLocation = set;

            for (let i = 0; i < lastIndex; i++) { //stop at the second last property in uniqueProperties
                const currentProp = uniqueProperties[i];
                if (setLocation[elem[currentProp]] === undefined) {
                    setLocation[elem[currentProp]] = {};
                }
                //set the new location to inside that property
                setLocation = setLocation[elem[currentProp]];
            }

            //final property evaluation
            const finalProp = uniqueProperties[lastIndex];
            if (setLocation[elem[finalProp]] === undefined) {
                setLocation[elem[finalProp]] = {};
                return true;
            }
            return false;
        });
    }
}


module.exports = {
    hashify: hashify,
	arrayify: arrayify,
    filterArrayByStatus: filterArrayByStatus,
    flattenRecurse: flattenRecurse
}