//a library of functions useful for organizing and executing loops and callback-style functions 
const async = require('async');

//flattens nested callbacks when running async in multiple stages while still allowing data passing
function flow (tasks, style, callback) {
    //check the case where tasks is an object passed in (which will work if thrown into functions like async.parallel unchanged)
    //but the style object has a value for the pass property which requires iteration over tasks as if it is an array. error out
    //the map function is used for when eventLoop is true, which permits an object as an argument because order doesn't matter
    //when it comes to the pass property, order matters in how the arguments get appended. order cannot be assumed for an object
    const isAnObject = !Array.isArray(tasks) && tasks === Object(tasks);
    if (isAnObject && style.pass) {
        throw new Error("Cannot use tasks as an object if a pass style is specified");
    }
    return function () {
        const lastArg = arguments.length - 1;
        const next = arguments[lastArg]; //this is the callback function (it is always the last parameter)
        //parameter insertion behavior changes depending on the value of style.pass
        //one: pass in the parameters from the previous function to the first function
        //all: pass in the parameters from the previous function to all functions
        if (tasks.length > 0) {  //if tasks is an object, this will always be false, which is a good thing
            //this section is purely for when style.pass has a value and functions need parameters inserted
            let finalIndex = -1; //default: do not replace any functions
            if (style.pass === 'one') {
                finalIndex = 0;
            }
            else if (style.pass === 'all') {
                finalIndex = tasks.length - 1;
            }
            //take the tasks array and insert arguments passed in, if any, once this function is invoked
            for (let h = 0; h <= finalIndex; h++) {
                let newTask = tasks[h];
                for (let i = 0; i < lastArg; i++) {
                    newTask = newTask.bind(newTask, arguments[i]);
                }
                tasks[h] = newTask; //tasks with arguments inserted
            }
        }
        if (style.eventLoop) { //use eventuate so that the task gets thrown into the event loop
            tasks = map(tasks, function (task) { //using map allows tasks to be an object
                return eventuate(task);
            });
        }
        async[style.method](tasks, function (err, res) {
            if (!callback) {
                next(err, res); //if no callback is specified, use this default
            }
            else {
                callback(err, res, next);
            }
        });
    }
}

//a shortcut function that uses the function passed in to be applied to the collection using the error/response style 
//this also avoids the context-losing problem for deeply nested functions by passing in a context as the third argument
//meant for inserting into flow or async
function flowMap (collection, func, context) {
    return map(collection, function (value) {
        return function (next) {
            if (context) {
                func.call(context, value, next);
            }
            else {
                func(value, next);
            }
        }
    });
}

//collection is an array or an object to be iterated over
//funcArray will invoke its first element on every element of array.
//funcArray will invoke its second element on every element in a collection in the array, etc.
function loop (collection, funcArray, flowOpts) {
    if (!flowOpts) { 
        flowOpts = {}; 
    }
    if (!flowOpts.method) { //default to parallel if no options were given
        flowOpts.method = 'parallel'; 
    }
    if (!Array.isArray(funcArray)) { //funcArray can just be a single function, and loop will handle that case
        funcArray = [funcArray];  
    }    
    return {
        //breadth-first traversal. funcArray's elements will be invoked one at a time
        breadth: function (cb) {
            loopBreadth(collection, funcArray, flowOpts, cb);
        },
        //depth-first traversal. collection's elements will be processed one at a time
        depth: function (cb) {
            loopDepth(collection, funcArray, flowOpts, cb);
        }
    };
}

//recursively iterates through a collection, invoking funcArray's elements as if they were maps to the data
//elements are processed fully one at a time. the functions should pass data via returns and not callback-style
function loopDepth (data, funcArray, flowOpts, cb) {
    if (funcArray.length > 0) {
        const func = funcArray.shift(); //the new function to map over the collection
        const taskCollection = map(data, function (value, index, obj) { //iteration step
            return function (next) {
                const newValue = func(value, index, obj); //apply map
                loopDepth(newValue, funcArray.slice(), flowOpts, next); //apply the next function to newValue now
            }
        });
        flow(taskCollection, flowOpts)(cb); //begin execution
    }
    else {
        cb(null, data); //leaf found. do not transform the data
    }
}

//recursively iterates through a collection, invoking funcArray's elements as if they were maps to the data
//top-level elements are processed before going deeper into the object
function loopBreadth (data, funcArray, flowOpts, cb) {
    if (funcArray.length > 0) {
        const func = funcArray.shift(); //the new function to map over the collection
        const taskCollection = map(data, function (value, index, obj) { //iteration step
            return function (next) {
                const newValue = func(value, index, obj); //apply map
                next(null, newValue); //pass the value through to finish the map
            }
        });
        flow(taskCollection, flowOpts)(function (err, newData) { //begin execution
            //one "depth level" of the collection is done. proceed to the next one
            const taskCollectionNew = map(newData, function (value) {
                return function (next) {
                    loopBreadth(value, funcArray.slice(), flowOpts, next);
                }
            }); 
            flow(taskCollectionNew, flowOpts)(cb); //begin execution
        });
    }
    else {
        cb(null, data); //leaf found. do not transform the data
    }
}

//interally used function
//pass in an object or array, and this function will iterate over it appropriately
function map (data, cb) {
    if (Array.isArray(data)) { //array
        return data.map(cb);        
    }
    else if (data === Object(data)) { //object. make a new object reference for the return value
        //note: modifying properties in nested objects using the map will mutate the original object
        //Array.map has the same behavior. Don't mutate the values in the callback and do not return 
        //the same reference passed in if you want completely different references for all the elements
        const newObj = {};
        for (prop in data) {
            //do not iterate along the prototype chain
            if (data.hasOwnProperty(prop)) {
                const value = data[prop];
                newObj[prop] = cb(value, prop, data);
            }
        }  
        return newObj;      
    }
}

//converts a function into one that will get thrown into the event loop
function eventuate (func, context) {
    return setImmediate.bind(context, func);
}

module.exports = {
    flow: flow,
    loop: loop,
    async: async,
    map: flowMap,
    eventuate: eventuate,
};