const async = require('async');

function flow (tasks, style, callback) {
    return function () {
        const lastArg = arguments.length - 1;
        const next = arguments[lastArg]; //this is the callback function (it is always the last parameter)
        //parameter insertion behavior changes depending on the value of style.pass
        //one: pass in the parameters from the previous function to the first function
        //all: pass in the parameters from the previous function to all functions
        if (tasks.length > 0) {  
            let finalIndex = -1; //default: do not replace any functions
            if (style.pass === 'one') {
                //replace the first task with the created function with inserted arguments
                finalIndex = 0;
            }
            else if (style.pass === 'all') {
                //replace all tasks with functions with inserted arguments
                finalIndex = tasks.length - 1;
            }
            for (let h = 0; h <= finalIndex; h++) {
                let newTasks = tasks[h];
                for (let i = 0; i < lastArg; i++) {
                    newTasks = newTasks.bind(null, arguments[i]);
                }
                tasks[h] = newTasks;                     
            }
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

module.exports = flow;