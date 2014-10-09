var request = require("supertest"),
     assert = require("assert");

var testVehicleDB = require("./vehicle_data.js");

module.exports = function(app, db, config, token, next) {
    var access = '?access_token=' + token;

    var vehicleDB;

    //Check the response to a route which is expected to cause an error 
    function checkErrorResponse(err, res, next) {
        var resultObj = JSON.parse(res.text);
        if (err) {
            //console.log('error: ' + resultObj.error);
            next(err);
        }
        else {
            assert(resultObj.response != undefined && resultObj.errorType === 'string' && resultObj.error != undefined);
            next();
        }
    }

    //Check whether two Vehicle objects are equal (only checking fields contained within test vehicles)
    function equalVehicleRecords(vehicle1, vehicle2) {
        return vehicle1.vin === vehicle2.vin && vehicle1.make === vehicle2.make && vehicle1.model === vehicle2.model && vehicle1.year === vehicle2.year;
    }

    //Check whether the specified array contains the specified vehicle
    function contains(array, searchElement) {
        //Determine whether the element currently being checked is in the specified database
        for (var index = 0; index < array.length; index++) {
            if (equalVehicleRecords(array[index], searchElement)) {
                return true;
            }
        }
        return false;
    }

    //Run Vehicle Database Tests
    describe("Vehicle Tests", function() {
        //Test POST Commands to the server for vehicle records
        describe("POST Vehicle Records", function() {
            it ("should return new entry", function(done) {
                //Post each record in the test database
                testVehicleDB.forEach(function(value, index) {
                    request(app).post('/vehicles.json' + access).send(value).expect(200).end(function(err, res) {   
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            //console.log('error: ' + resultObj.error);
                            done(err);
                        }
                        else {
                            assert.equal(resultObj.responseType, 'object');

                            //Compare the response to the record that was posted and fail if there are any differing fields
                            assert(equalVehicleRecords(resultObj.response, value));

                            if (index + 1 == testVehicleDB.length) {
                                done();
                            }
                        }
                    });
                });
            });

            //Include a random extra parameter
            it ("should ignore extra params", function(done) {
                request(app).post('/vehicles.json' + access).send({vin:'ExtraParam', make:'Blah', model:'Blah', year:2003, extraparam:'ThisShouldBeIgnored'}).expect(200).end(function(err, res) {
                    var resultObj = JSON.parse(res.text);
                    if (err) {
                        //console.log('error: ' + resultObj.error);
                        done(err);
                    }
                    else {
                        assert.equal(resultObj.response.extraparam, undefined);
                        request(app).del('/vehicles/' + resultObj.response._id + '.json' + access).end(done);
                    }
                });
            });

            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).post('/vehicles.json').send(testVehicleDB[0]).expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Perform a post request with an existing vin 
            it ("should return 500 (duplicate vin)", function(done) {
                request(app).post('/vehicles.json' + access).send({vin:testVehicleDB[0].vin, make:'Blah', model:'Blah', year:1337}).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Perform a post request with a parameter with a bad type
            it ("should return 500 (bad parameter type)", function(done) {
                request(app).post('/vehicles.json' + access).send({vin:'BadParam', make:'Blah', model:'Blah', year:'Blah'}).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });
        
        //GET requests for the full vehicle database
        describe("GET Vehicle Database", function() {
            //Retrieve the database
            it ("should return all entries previously added", function(done) {
                request(app).get('/vehicles.json' + access).expect(200).end(function(err, res) {
                    var resultObj = JSON.parse(res.text);
                    if (err) {
                        console.log('error: ' + resultObj.error);
                        done(err);
                    }
                    else {
                        assert(resultObj.responseType, 'array');

                        vehicleDB = resultObj.response;
                        for (var index = 0; index < testVehicleDB.length; index++) {
                            //We should find a match in the returned database for each element in the test database
                            assert(contains(vehicleDB, testVehicleDB[index]));
                        }
                        done();
                    }
                });
            });

            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).get('/vehicles.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("GET Individual Vehicles", function() {
            it ("should return the appropriate vehicle",function(done) {
                vehicleDB.forEach(function(value, index) {
                    //Get a specific vehicle.
                    request(app).get('/vehicles/' + value._id + '.json' + access).expect(200).end(function(err, res) {
                        var resultObj = JSON.parse(res.text);
                        if (err) {
                            console.log('error: ' + resultObj.error);
                            done(err);
                        }
                        else {
                            //Make sure that the reponse was an object
                            assert.equal(resultObj.responseType, 'object');

                            //Make sure the record received matches the one in the database
                            assert(equalVehicleRecords(resultObj.response, value));

                            if (index + 1 == vehicleDB.length) {
                                done();
                            }
                        }
                    });
                });
            });

            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).get('/vehicles/' + vehicleDB[0]._id + '.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to retrieve a nonexistant vehicle record
            it ("should return 500 (nonexistent vehicle ID)", function(done) {
                request(app).get('/vehicles/53bc500007c32c7122c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Request a vehicle record with an invalid ID
            it ("should return 500 (invalid vehicle ID)", function(done) {
                request(app).get('/vehicles/53bc50c8a6c32g712c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        describe("DELETE Vehicle Records", function() {
            //Perform a valid request without an access key
            it ("should return 403 (no access)", function(done) {
                request(app).del('/vehicles/' + vehicleDB[0]._id + '.json').expect(403).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Delete all the records that were manually added previously
            it ("should return success", function(done) {
                //Count how many test vehicles that we find and delete
                var foundCount = 0;
                for (var vehicleIndex = 0; vehicleIndex < vehicleDB.length; vehicleIndex++) {
                    var vehicle = vehicleDB[vehicleIndex];

                    //Delete only records that were in the test database
                    if (contains(testVehicleDB, vehicle)) {
                        //Attempt to delete the vehicle record
                        request(app).del('/vehicles/' + vehicle._id + '.json' + access).expect(200).end(function(err, res) {
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
                                if (foundCount == testVehicleDB.length) {
                                    done();
                                }
                            }
                        });
                    }
                }
                setTimeout(function() {
                    if (foundCount < testVehicleDB.length) {
                        done(new Error("Not all test records were found"));
                    }
                }, 1000)
            });

            //Attempt to delete a vehicle record that does not exist
            it ("should return 500 (nonexistent vehicle ID)", function(done) {
                request(app).del('/vehicles/53bc500007c32c7122c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });

            //Attempt to perform a deletion using an invalid ID (incorrect length)
            it ("should return 500 (invalid vehicle ID)", function(done) {
                request(app).del('/vehicles/53bc50c8a6c32g712c27e8.json' + access).expect(500).end(function(err, res) {
                    checkErrorResponse(err, res, done);
                });
            });
        });

        after(function() {
            next();
        });
    });

};

