var fox = require("foxjs"),
    path = require("path");

var request = require('supertest');

// Configuration file.
var Config = require(path.resolve(__dirname, "../configs/config.js"));

//Contains predefined methods used to manage the server instance.
var server = {
    start: function(config, next) {
        // Perform any additional configuration of the server
        // before it starts loading routes and finishing up.

        fox.start(config, next);
    },

    stop: function(config, next) {

        // Perform any additional tasks before the server
        // is shutdown.  Make them quick you only have
        // 4 seconds for this entire method to finish.

        // Gracefully shutdown the server.
        fox.stop(next);
    }
};

// Handle messages sent to the server, such as start, stop, restart, etc.
fox.message.handler(server);

//Mocha stops the program before a connection is made if this wait is not performed
describe('Server Tests', function() {
    var user;
    var request = require('supertest');
    it ("start the server", function(done) {
        var User, UserRole, AccessToken;

        //Start the server
        server.start(new Config(), function(err, app, db, config, server, fox, io) {
            request(app).post('/install.json?access_token=IOlQ9V6Tg6RVL7DSJFL248723Bm3JjCF34FI0TJOVPvRzz').end(function(err, res) {
                //Retrieve all necessary models
                User = db.model('User');
                UserRole = db.model('UserRole');
                AccessToken = db.model('AccessToken');

                //Search for the test user if it exists and delete it
                User.findOne({email:'test@localhost.com'}, '', function(err, foundUser) {
                    if (!err && foundUser) {
                        deleteUser(foundUser, runTests);
                    }
                    else {
                        //If the user was not found, create a new user and start the tests
                        runTests();
                    }
                });
            });
            

            function runTests() {
                var role;
                //Find the superadmin role and apply it to the new user
                UserRole.findOne({queryName:'superadmin'}, '', function(err, foundRole){
                    if (err) {
                        throw err;
                    }
                    //Store the role that was found
                    role = foundRole;

                    //Create a new user to perform test with
                    user = new User({activated:true, firstName:'test', email:'test@localhost.com', roles:[role], password:'testpassword', securityQuestion:''});
                    //user.set('password', 'testpassword');

                    //Create an access token for the new user
                    user.createAccessToken({activated:true}, function(err, accessToken){
                        if (err) {
                            throw err;
                        }

                        //Save the new user to the database
                        user.save(function(err, newUser) {
                            if (err) {
                                throw err;
                            }
                            var token = accessToken.token;

                            //Start the tests
                            require("./app")(app, db, config, token, function() {
                                describe('Deletion tests', function() {
                                    it ('should delete the test user', function(done) {
                                        deleteUser(user, done);
                                    });
                                });
                            });
                            done();
                        });

                    });
                });
            }

            function deleteUser(user, next) {
                if (user) {
                    var tokenVal = user.token;

                    AccessToken.findOne({user:user},  '', function(err, access) {
                        //Remove the user from the database
                        user.remove();

                        if (!err && access) {
                            //Remove the access token from the database
                            access.remove();
                        }

                        if (next) {
                            next();
                        }
                    });
                }
                else if (next) {
                    next();
                }
            }
        });
    });
});
