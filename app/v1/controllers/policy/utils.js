const app = require('../../app');

//given an existing hash, an array of homogenous objects and a function that transforms those objects into
//an array of ordered properties, convert all the objects into one nested accumulated hash in
//order to change how the data is constructed
function hashify (hash, array, transformFunc) {
    for (let i = 0; i < array.length; i++) {
        //get the order of values to nest into each other
        const order = transformFunc(array[i]);
        let nestedHash = hash; //the current nested level of the hash
        for (let j = 0; j < order.length; j++) {
            if (!nestedHash[order[j]]) {
                //non-existing properties get added with values of objects, or null if it's the last element to add
                if (j < order.length - 1) {
                    nestedHash[order[j]] = {};
                }
                else {
                    nestedHash[order[j]] = null;
                }
            }
            nestedHash = nestedHash[order[j]];
        }
    }
    return hash;
}

//given a SQL command, sets up a function to execute the query and pass back the results
function setupSqlCommand (sqlString) {
    return function (next) {
        app.locals.db.sqlCommand(sqlString, function (err, res) {
            next(err, res.rows);
        });     
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
	setupSqlCommand: setupSqlCommand,
	filterArrayByStatus: filterArrayByStatus
}