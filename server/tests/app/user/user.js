var request = require("supertest"),
     assert = require("assert");

var testUserDB = require("./user_data.js");

module.exports = function(app, db, config, token, next) {
    var access = '?access_token=' + token;

    var userDB;

    var User = db.model('User');

    //Check whether two User objects are equal (only checking fields contained within test users)
    function equalUserRecords(user1, user2) {
        return user1.email === user2.email && user1.firstName === user2.firstName && user1.lastName === user2.lastName && user1.activated === user2.activated &&
               user1.securityQuestion === user2.securityQuestion && user1.failedLoginAttempts === user2.failedLoginAttempts;// && user1.passwordHash == user2.passwordHash;
    }

    //Check the response to a route which is expected to cause an error 
    function checkErrorResponse(err, res, next) {
        var resultObj = JSON.parse(res.text);
        if (err) {
            //console.log('error: ' + resultObj.error);
            next(err);
        }
        else {
            assert(resultObj.response != undefined && resultObj.errorType == 'string' && resultObj.error != undefined);
            next();
        }
    }

    //Convert an object array to an array of User objects
    function toUserArray(array) {
        var userArray;
        for (var index = 0; index < array.length; index++) {
            userArray[index] = new User(array[index]);
        }

        return userArray;
    }

    //Check whether the specified array contains the specified user
    function contains(array, searchElement) {
        //Determine whether the element currently being checked is in the specified database
        for (var index = 0; index < array.length; index++) {
            if (equalUserRecords(array[index], searchElement)) {
                return true;
            }
        }
        return false;
    }

    describe("User Tests", function() {
        //Test POST Commands to the server for user records
        describe("POST User Records", function() {
            it ("should return new entry", function(done) {
                //Post each record in the test database
                testUserDB.forEach(function(value, index) {
                    request(app).post('/users.json' + access).send(value).expect(200).end(function(err, res) {   
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            //console.log('error: ' + resultObj.error);
                            throw err;
                        }
                        else {
                            assert.equal(resultObj.responseType, 'object');

                            //Compare the response to the record that was posted and fail if there are any differing fields
                            assert(equalUserRecords(resultObj.response, value));

                            if (index + 1 == testUserDB.length) {
                                done();
                            }
                        }
                    });
                });
            });

            //Include a random extra parameter
            it ("should ignore extra params", function(done) {
                request(app).post('/users.json' + access).send({email:'extraparam@blah.blah', firstName:'Blah', lastName:'Blah', password:'Blah', 
                                                    activated:true, extraparam:'ThisShouldBeIgnored'}).expect(200).end(function(err, res) {
                    var resultObj = JSON.parse(res.text);
                    if (err) {
                        console.log('error: ' + resultObj.error);
                        done(err);
                    }
                    else {
                        var response = resultObj.response;
                        assert.equal(response.extraparam, undefined);
                        request(app).del('/users/' + response._id + '.json' + access).end(done);
                    }
                });
            });

            //Perform a post request with a parameter with a bad type
            it ("should ignore bad parameters and use default", function(done) {
                request(app).post('/users.json' + access).send({email:'badparams@blah.blah', firstName:'Blah', lastName:'Blah',
                                                                password:'Blah', activated:'Blah', failedLoginAttempts:'Blah', dateCreated:'Blah', 
                                                                lastLogin:'Blah', lastUpdated:'Blah'}).expect(200).end(function(err, res) {
                    var resultObj = JSON.parse(res.text);
                    if (err) {
                        console.log('error: ' + resultObj.error);
                        done(err);
                    }
                    else {
                        var response = resultObj.response;

                        assert.equal(response.activated, false);
                        assert.equal(response.failedLoginAttempts, 0);
                        //assert.lessThan(Date.parse(response.dateCreated).getTime() - Date.now.getTime(), 2000);
                        //assert.lessThan(Date.parse(response.lastUpdated).getTime() - Date.now.getTime(), 2000);
                        //assert.lessThan(Date.parse(response.lastLogin).getTime() - Date.now.getTime(), 2000);

                        request(app).del('/users/' + response._id + '.json' + access).end(done);
                    }
                });
            });

            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).post('/users.json').send(testUserDB[0]).expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Perform a post request with an existing email 
            it ("should return 500 (duplicate email)", function(done) {
                request(app).post('/users.json' + access).send({email:testUserDB[0].email, firstName:'Blah', lastName:'Blah', 
                                                                password:'Blah', activated:false}).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });


        describe("GET User Database", function() {
            //Retrieve the database and make sure that the posts added the test users successfully
            it ("should return all entries previously added", function(done) {
                //Get all users.
                request(app).get('/users.json' + access).expect(200).end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    else {
                        var resultObj = JSON.parse(res.text);
                        assert(resultObj.responseType, 'array');

                        userDB = resultObj.response;
                        for (var index = 0; index < testUserDB.length; index++) {
                            //We should find a match in the returned database for each element in the test database
                            assert(contains(userDB, testUserDB[index]));
                        }
                        done();
                    }
                });
            });

            //Request the user data
            it ("should return 403 (no access)", function(done) {
                request(app).get('/users.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("GET Individual Users", function() {
            //Go through the database and attempt to retrieve each individual user
            it ("should return the appropriate user", function(done) {
                userDB.forEach(function(value, index) {
                    //Get a specific user.
                    request(app).get('/users/' + value._id + '.json' + access).expect(200).end(function(err, res) {
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            console.log('error: ' + resultObj.error);
                            done(err);
                        }
                        else {
                            //Make sure that the reponse was an object
                            assert.equal(resultObj.responseType, 'object');

                            //Make sure the record received matches the one in the database
                            assert(equalUserRecords(resultObj.response, value));

                            if (index + 1 == userDB.length) {
                                done();
                            }
                        }
                    });
                });
            });
            
            //Attempt to retrieve a user without an access token
            it ("should return 403 (no access)", function(done) {
                request(app).get('/users/' + userDB[0]._id + '.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to retrieve a nonexistent user
            it ("should return 500 (nonexistent user ID)", function(done) {
                request(app).get('/users/53bc5099997c32c7122c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to retrieve a user with an invalid ID
            it ("should return 500 (invalid user ID)", function(done) {
                request(app).get('/users/53bc50csae6c32c712c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("POST Clear Logon Failures", function() {
            //Attempt to clear a user's failed login attempts without an access token
            it ("should return 403 (no access)", function(done) {
                request(app).post('/users/' + userDB[0]._id + '/clearFailedLoginAttempts.js').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to clear the failed login attempts of each user in the database
            it ("should return success", function(done) {
                userDB.forEach(function(value, index) {
                    request(app).post('/users/' + value._id + '/clearFailedLoginAttempts.js' + access).expect(200).end(function(err, res) {
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            done(err);
                        }
                        else {
                            //Make sure that the reponse was an object
                            assert.equal(resultObj.responseType, 'object');

                            //Make sure that the attempts were actually cleared
                            assert.equal(resultObj.response.failedLoginAttempts, 0);
                            if (index + 1 === userDB.length) {
                                done();
                            }
                        }
                    });
                });
            });

            //Attempt to clear the failed login attempts of a nonexistent user
            it ("should return 500 (nonexistent user ID)", function(done) {
                request(app).post('/users/53bc5099997c32c7122c27e8/clearFailedLoginAttempts.js' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to clear the failed login attempts of a invalid user
            it ("should return 500 (invalid user ID)", function(done) {
                request(app).post('/users/53bc50c8ae6c32c712c27e8/clearFailedLoginAttempts.js' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("DELETE User Records", function() {
            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).del('/users/' + userDB[0]._id + '.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Delete all the records that were manually added previously
            it ("should return success", function(done) {
                //Count how many test users that we find and delete
                var foundCount = 0;
                for (var userIndex = 0; userIndex < userDB.length; userIndex++) {
                    var user = userDB[userIndex];

                    //Delete only records that were in the test database
                    if (contains(testUserDB, user)) {
                        //Attempt to delete the user record
                        request(app).del('/users/' + user._id + '.json' + access).expect(200).end(function(err, res) {
                            var resultObj = JSON.parse(res.text);
                            if (err) {
                                console.log('error: ' + resultObj.error);
                                done(err);
                            }
                            else {
                                assert.equal(resultObj.responseType, 'object');

                                //Make sure that the deletion was successful
                                assert(resultObj.response.success);
                                
                                foundCount++;
                                if (foundCount == testUserDB.length) {
                                    done();
                                }
                            }
                        });
                    }
                }

                //Wait for 1 second for all of the records to be found, fail is they are not found by that time
                setTimeout(function() {
                    if (foundCount < testUserDB.length) {
                        done(new Error("Not all test records were found"));
                    }
                }, 1000);
            });
            
            //Attempt to delete a vehicle record that does not exist
            it ("should return 500 (nonexistent user ID)", function(done) {
                request(app).del('/users/53bc500007c32c7122c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to perform a deletion using an invalid ID (incorrect length)
            it ("should return 500 (invalid user ID)", function(done) {
                request(app).del('/users/53bc50c8a6c32g712c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        after(function() {
            next();
        });
    });
}