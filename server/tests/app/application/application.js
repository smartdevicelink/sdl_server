var request = require("supertest"),
     assert = require("assert");

var testAppDB = require("./application_data.js");

module.exports = function(app, db, config, token, next) {
    var access = '?access_token=' + token;

    var appDB;

    var Application = db.model('Application');

    //Check whether two Application objects are equal (only checking fields contained within test applications)
    function equalApplicationRecords(application1, application2) {
        return application1.key === application2.key && application1.name === application2.name && application1.description === application2.description && 
               application1.activated === application2.activated && application1.development === application2.development && 
               equalSdlCategories(application1.sdlCategory, application2.sdlCategory);
    }

    function equalSdlCategories(category1, category2) {
        return category1.index === category2.index && category1.name === category2.name && category1.queryName === category2.queryName;
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

    // //Convert an object array to an array of Application objects
    // function toApplicationArray(array) {
    //     var applicationArray;
    //     for (var index = 0; index < array.length; index++) {
    //         applicationArray[index] = new Application(array[index]);
    //     }

    //     return applicationArray;
    // }

    //Check whether the specified array contains the specified application
    function contains(array, searchElement) {
        //Determine whether the element currently being checked is in the specified database
        for (var index = 0; index < array.length; index++) {
            if (equalApplicationRecords(array[index], searchElement)) {
                return true;
            }
        }
        return false;
    }

    describe("Application Tests", function() {
        //Test POST Commands to the server for application records
        describe("POST Application Records", function() {
            it ("should return new entry", function(done) {
                //Post each record in the test database
                testAppDB.forEach(function(value, index) {
                    request(app).post('/applications.json' + access).send(value).expect(200).end(function(err, res) {   
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            //console.log('error: ' + resultObj.error);
                            throw err;
                        }
                        else {
                            assert.equal(resultObj.responseType, 'object');

                            //Compare the response to the record that was posted and fail if there are any differing fields
                            assert(equalApplicationRecords(resultObj.response, value));

                            if (index + 1 == testAppDB.length) {
                                done();
                            }
                        }
                    });
                });
            });

            //Include a random extra parameter
            it ("should ignore extra params", function(done) {
                request(app).post('/applications.json' + access).send({key:'extraparam', name:'Blah', description:'Blah', sdlCategory:{index:9, name:'Blah', queryName:'blah'}, 
                                development:false, activated:true, extraparam:'ThisShouldBeIgnored'}).expect(200).end(function(err, res) {
                    var resultObj = JSON.parse(res.text);
                    if (err) {
                        console.log('error: ' + resultObj.error);
                        done(err);
                    }
                    else {
                        var response = resultObj.response;
                        assert.equal(response.extraparam, undefined);
                        request(app).del('/applications/' + response._id + '.json' + access).end(done);
                    }
                });
            });

            //Perform a post request with a parameter with a bad type
            it ("should ignore bad parameters and use default", function(done) {
                request(app).post('/applications.json' + access).send({key:'badparams', name:'Blah', description:'Blah', 
                                sdlCategory:{index:9, name:'Blah', queryName:'blah'}, development:'Blah', 
                                activated:'Blah'}).expect(200).end(function(err, res) {
                    var resultObj = JSON.parse(res.text);
                    if (err) {
                        console.log('error: ' + resultObj.error);
                        done(err);
                    }
                    else {
                        var response = resultObj.response;

                        assert.equal(response.activated, true);
                        assert.equal(response.development, false);

                        request(app).del('/applications/' + response._id + '.json' + access).end(done);
                    }
                });
            });

            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).post('/applications.json').send(testAppDB[0]).expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Perform a post request with an existing key
            it ("should return 500 (duplicate key)", function(done) {
                request(app).post('/applications.json' + access).send({key:testAppDB[0].key, name:'Blah', 
                                 description:'Blah', sdlCategory:{index:9, name:'Blah', queryName:'blah'},
                                 development:'Blah', activated:'Blah'}).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });


        describe("GET Application Database", function() {
            //Retrieve the database and make sure that the posts added the test applications successfully
            it ("should return all entries previously added", function(done) {
                //Get all applications.
                request(app).get('/applications.json' + access).expect(200).end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    else {
                        var resultObj = JSON.parse(res.text);
                        assert(resultObj.responseType, 'array');

                        appDB = resultObj.response;
                        for (var index = 0; index < testAppDB.length; index++) {
                            //We should find a match in the returned database for each element in the test database
                            assert(contains(appDB, testAppDB[index]));
                        }
                        done();
                    }
                });
            });

            //Request the application data
            it ("should return 403 (no access)", function(done) {
                request(app).get('/applications.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("GET Individual Applications", function() {
            //Go through the database and attempt to retrieve each individual application
            it ("should return the appropriate application", function(done) {
                appDB.forEach(function(value, index) {
                    //Get a specific application.
                    request(app).get('/applications/' + value._id + '.json' + access).expect(200).end(function(err, res) {
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            console.log('error: ' + resultObj.error);
                            done(err);
                        }
                        else {
                            //Make sure that the reponse was an object
                            assert.equal(resultObj.responseType, 'object');

                            //Make sure the record received matches the one in the database
                            assert(equalApplicationRecords(resultObj.response, value));

                            if (index + 1 == appDB.length) {
                                done();
                            }
                        }
                    });
                });
            });
            
            //Attempt to retrieve an application without an access token
            it ("should return 403 (no access)", function(done) {
                request(app).get('/applications/' + appDB[0]._id + '.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to retrieve a nonexistent application
            it ("should return 404 (nonexistent application ID)", function(done) {
                request(app).get('/applications/53bc5099997c32c7122c27e8.json' + access).expect(404).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to retrieve an application with an invalid ID
            it ("should return 500 (invalid application ID)", function(done) {
                request(app).get('/applications/53bc50csae6c32c712c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });
        
        describe("UPDATE Application Records", function() {
            var update = {description:'this is an update'};

            //Go through the database and attempt to update each individual application
            it ("should return the appropriate update", function(done) {
                appDB.forEach(function(value, index) {
                    //Update a specific application.
                    request(app).post('/applications/' + value._id + '.json' + access).send(update).expect(200).end(function(err, res) {
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            console.log('error: ' + resultObj.error);
                            done(err);
                        }
                        else {
                            //Make sure that the reponse was an object
                            assert.equal(resultObj.responseType, 'object');

                            //Make sure the record received matches the one in the database
                            assert.equal(resultObj.response.description, 'this is an update');

                            var after = undefined;

                            if (index + 1 == appDB.length) {
                                after = done;
                            }

                            request(app).post('/applications/' + value._id + '.json' + access).send({description:value.description}).expect(200, after);  
                        }
                    });
                });
            });

            //Attempt to update an application without an access token
            it ("should return 403 (no access)", function(done) {
                request(app).post('/applications/' + appDB[0]._id + '.json').send(update).expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to update an application with a key which is already used
            it ("should return 500 (duplicate key)", function(done) {
                request(app).post('/applications/' + appDB[0]._id + '.json' + access).send({key:appDB[1].key}).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to update a nonexistent application
            it ("should return 404 (nonexistent application ID)", function(done) {
                request(app).post('/applications/53bc5099997c32c7122c27e8.json' + access).send(update).expect(404).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to update an application with an invalid ID
            it ("should return 500 (invalid application ID)", function(done) {
                request(app).post('/applications/53bc50csae6c32c712c27e8.json' + access).send(update).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("DELETE Application Records", function() {
            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).del('/applications/' + appDB[0]._id + '.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Delete all the records that were manually added previously
            it ("should return success", function(done) {
                //Count how many test applications that we find and delete
                var foundCount = 0;
                for (var applicationIndex = 0; applicationIndex < appDB.length; applicationIndex++) {
                    var application = appDB[applicationIndex];

                    //Delete only records that were in the test database
                    if (contains(testAppDB, application)) {
                        //Attempt to delete the application record
                        request(app).del('/applications/' + application._id + '.json' + access).expect(200).end(function(err, res) {
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
                                if (foundCount == testAppDB.length) {
                                    done();
                                }
                            }
                        });
                    }
                }

                //Wait for 1 second for all of the records to be found, fail is they are not found by that time
                setTimeout(function() {
                    if (foundCount < testAppDB.length) {
                        done(new Error("Not all test records were found"));
                    }
                }, 1000);
            });
            
            //Attempt to delete an application record that does not exist
            it ("should return 500 (nonexistent application ID)", function(done) {
                request(app).del('/applications/53bc500007c32c7122c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to perform a deletion using an invalid ID (incorrect length)
            it ("should return 500 (invalid application ID)", function(done) {
                request(app).del('/applications/53bc50c8a6c32g712c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        after(function() {
            next();
        });
    });
}