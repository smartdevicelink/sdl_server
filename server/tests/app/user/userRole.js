var request = require("supertest"),
     assert = require("assert");

var testUserRoleDB = require("./userRole_data.js");

module.exports = function(app, db, config, token, next) {
    var access = '?access_token=' + token;

    var userRoleDB;

    var UserRole = db.model('UserRole');

    //Check whether two UserRole objects are equal (only checking fields contained within test userRoles)
    function equalUserRoleRecords(userRole1, userRole2) {
        return userRole1.index === userRole2.index && userRole1.name === userRole2.name && userRole1.queryName === userRole2.queryName;
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

    // //Convert an object array to an array of UserRole objects
    // function toUserRoleArray(array) {
    //     var userRoleArray;
    //     for (var index = 0; index < array.length; index++) {
    //         userRoleArray[index] = new UserRole(array[index]);
    //     }

    //     return userRoleArray;
    // }

    //Check whether the specified array contains the specified userRole
    function contains(array, searchElement) {
        //Determine whether the element currently being checked is in the specified database
        for (var index = 0; index < array.length; index++) {
            if (equalUserRoleRecords(array[index], searchElement)) {
                return true;
            }
        }
        return false;
    }

    describe("User Role Tests", function() {
        //Test POST Commands to the server for userRole records
        describe("POST User Role Records", function() {
            it ("should return new entry", function(done) {
                //Post each record in the test database
                testUserRoleDB.forEach(function(value, index) {
                    request(app).post('/userroles.json' + access).send(value).expect(200).end(function(err, res) {   
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            //console.log('error: ' + resultObj.error);
                            throw err;
                        }
                        else {
                            assert.equal(resultObj.responseType, 'object');

                            //Compare the response to the record that was posted and fail if there are any differing fields
                            assert(equalUserRoleRecords(resultObj.response, value));

                            if (index + 1 == testUserRoleDB.length) {
                                done();
                            }
                        }
                    });
                });
            });

            //Include a random extra parameter
            it ("should ignore extra params", function(done) {
                request(app).post('/userroles.json' + access).send({index:55, name:'ExtraParam', queryName:'extraparam', 
                                                   extraparam:'ThisShouldBeIgnored'}).expect(200).end(function(err, res) {
                    var resultObj = JSON.parse(res.text);
                    if (err) {
                        console.log('error: ' + resultObj.error);
                        throw err;
                    }
                    else {
                        var response = resultObj.response;
                        assert.equal(response.extraparam, undefined);
                        request(app).del('/userRoles/' + response._id + '.json' + access).end(done);
                    }
                });
            });

            //Perform a post request with a parameter with a bad type
            it ("should return 500 (bad parameter)", function(done) {
                request(app).post('/userroles.json' + access).send({value:'Blah', name:'BadParam', 
                                    queryName:'badparam'}).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).post('/userroles.json').send(testUserRoleDB[0]).expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Perform a post request with an existing key
            it ("should return 500 (duplicate fields)", function(done) {
                request(app).post('/userroles.json' + access).send({index:33, name:testUserRoleDB[0].name, 
                                           queryName:'duplicatename'}).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, function() {
                        request(app).post('/userroles.json' + access).send({index:testUserRoleDB[0].value, name:'DuplicateValue', 
                                                                queryName:'duplicatevalue'}).expect(500).end(function(err, res) {
                            checkErrorResponse(err, res, function() {
                                request(app).post('/userroles.json' + access).send({index:99, name:'DuplicateQueryName', 
                                                                queryName:testUserRoleDB[0].queryName}).expect(500).end(function(err, res) {
                                    checkErrorResponse(err, res, done);
                                });
                            });
                        });
                    });
                });
            });
        });


        describe("GET User Role Database", function() {
            //Retrieve the database and make sure that the posts added the test userRoles successfully
            it ("should return all entries previously added", function(done) {
                //Get all userRoles.
                request(app).get('/userroles.json' + access).expect(200).end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    else {
                        var resultObj = JSON.parse(res.text);
                        assert(resultObj.responseType, 'array');

                        userRoleDB = resultObj.response;
                        for (var index = 0; index < testUserRoleDB.length; index++) {
                            //We should find a match in the returned database for each element in the test database
                            assert(contains(userRoleDB, testUserRoleDB[index]));
                        }
                        done();
                    }
                });
            });

            // //Request the userRole data
            // it ("should return 403 (no access)", function(done) {
            //     request(app).get('/userroles.json').expect(403).end(function(err, res) {
            //         checkErrorResponse(err, res, done);
            //     });
            // });
        });

        describe("GET Individual User Roles", function() {
            //Go through the database and attempt to retrieve each individual userRole
            it ("should return the appropriate userRole", function(done) {
                userRoleDB.forEach(function(value, index) {
                    //Get a specific userRole.
                    request(app).get('/userroles/' + value._id + '.json' + access).expect(200).end(function(err, res) {
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            console.log('error: ' + resultObj.error);
                            done(err);
                        }
                        else {
                            //Make sure that the reponse was an object
                            assert.equal(resultObj.responseType, 'object');

                            //Make sure the record received matches the one in the database
                            assert(equalUserRoleRecords(resultObj.response, value));

                            if (index + 1 == userRoleDB.length) {
                                done();
                            }
                        }
                    });
                });
            });
            
            // //Attempt to retrieve a userRole without an access token
            // it ("should return 403 (no access)", function(done) {
            //     request(app).get('/userroles/' + userRoleDB[0]._id + '.json').expect(403).end(function(err, res) {
            //         checkErrorResponse(err, res, done);
            //     });
            // });

            //Attempt to retrieve a nonexistent userRole
            it ("should return 404 (nonexistent userRole ID)", function(done) {
                request(app).get('/userroles/53bc5099997c32c7122c27e8.json' + access).expect(404).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to retrieve a userRole with an invalid ID
            it ("should return 500 (invalid userRole ID)", function(done) {
                request(app).get('/userroles/53bc50csae6c32c712c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("UPDATE User Role Records", function() {
            var update = {queryName:'updated'};

            //Go through the database and attempt to update each individual user role
            it ("should return the appropriate update", function(done) {
                updateTest(userRoleDB, userRoleDB[0], 0);

                function updateTest(array, value, index) {
                    //Get a specific application.
                    request(app).post('/userroles/' + value._id + '.json' + access).send(update).expect(200).end(function(err, res) {
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            console.log('error: ' + resultObj.error);
                            done(err);
                        }
                        else {
                            //Make sure that the reponse was an object
                            assert.equal(resultObj.responseType, 'object');

                            //Make sure the record received matches the one in the database
                            assert.equal(resultObj.response.queryName, update.queryName);

                            var after = function() {
                                updateTest(array, array[index + 1], index + 1);
                            };

                            if (index + 1 == userRoleDB.length) {
                                after = done;
                            }

                            request(app).post('/userroles/' + value._id + '.json' + access).send({queryName:value.queryName}).expect(200, after);  
                        }
                    });
                }
            });

            //Attempt to update an user role without an access token
            it ("should return 403 (no access)", function(done) {
                request(app).post('/userroles/' + userRoleDB[0]._id + '.json').send(update).expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to update an user role with a query name which is already in use
            it ("should return 500 (duplicate query name)", function(done) {
                request(app).post('/userroles/' + userRoleDB[0]._id + '.json' + access).send({queryName:userRoleDB[1].queryName}).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to update a nonexistent user role
            it ("should return 404 (nonexistent user role ID)", function(done) {
                request(app).post('/userroles/53bc5099997c32c7122c27e8.json' + access).send(update).expect(404).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to update an user role with an invalid ID
            it ("should return 500 (invalid user role ID)", function(done) {
                request(app).post('/userroles/53bc50csae6c32c712c27e8.json' + access).send(update).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("DELETE User Role Records", function() {
            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).del('/userroles/' + userRoleDB[0]._id + '.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Delete all the records that were manually added previously
            it ("should return success", function(done) {
                //Count how many test userRoles that we find and delete
                var foundCount = 0;
                for (var userRoleIndex = 0; userRoleIndex < userRoleDB.length; userRoleIndex++) {
                    var userRole = userRoleDB[userRoleIndex];

                    //Delete only records that were in the test database
                    if (contains(testUserRoleDB, userRole)) {
                        //Attempt to delete the userRole record
                        request(app).del('/userroles/' + userRole._id + '.json' + access).expect(200).end(function(err, res) {
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
                                if (foundCount == testUserRoleDB.length) {
                                    done();
                                }
                            }
                        });
                    }
                }

                //Wait for 1 second for all of the records to be found, fail is they are not found by that time
                setTimeout(function() {
                    if (foundCount < testUserRoleDB.length) {
                        done(new Error("Not all test records were found"));
                    }
                }, 1000);
            });
            
            //Attempt to delete a vehicle record that does not exist
            it ("should return 500 (nonexistent user role ID)", function(done) {
                request(app).del('/userroles/53bc500007c32c7122c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to perform a deletion using an invalid ID (incorrect length)
            it ("should return 500 (invalid user role ID)", function(done) {
                request(app).del('/userroles/53bc50c8a6c32g712c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        after(function() {
            next();
        });
    });
}