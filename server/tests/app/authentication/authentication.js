var request = require("supertest"),
	 assert = require("assert");

//Grab the test user database
var testUser = require("./user_data.js");

module.exports = function(app, db, config, token, next) {
	var access = '?access_token=' + token;

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

	function findRole(roleName, next) {
		request(app).get('/userroles.json' + access).end(function(err, res) {
			var response = JSON.parse(res.text).response;
			for (var index = 0; index < response.length; index++) {
				//console.log(response[index].name + '');
				if (response[index].name == roleName) {
					return next(undefined, response[index]);
				}
			}
			return next(new Error("Could not find " + roleName + " role."));
		})
	}

	var user;

	describe("Authentication Tests", function() {
		//before(function() {});
		describe("POST User", function() {
			it ("should post test user", function(done) {
				//Post each record in the test database
				findRole('superadmin', function(err, role) {
					if (err) {
						throw err;
					}
					else {
						request(app).post('/users.json' + access).send(testUser).expect(200).end(function(err, res) {
							if (err) {
								throw err;
							}
							else {
								user = (JSON.parse(res.text)).response._id;
								done();
							}
						});
					}
				});	
			});
		});

		describe("Login Tests", function() {
			it("should login to the test user", function(done) {
				request(app).post('/login.js').send({username:testUser.email, password:testUser.password}).expect(200).end(function(err, res) {
					var resultObj = JSON.parse(res.text);
					if (err) {
						console.log('error: ' + resultObj.error);
						throw err;
					}
					else {
						var resultObj = JSON.parse(res.text);

						assert.equal(resultObj.responseType, 'object');
						assert.equal(resultObj.response.email, testUser.email);

						done();
					}
				});
			});

			// //These tests will not work without cookie data being kept
			// it("should return success", function(done) {
			// 	request(app).get('/login/status.json').expect(200).end(function(err, res) {
			// 		var resultObj = JSON.parse(res.text);
			// 		if (err) {
			// 			console.log('error: ' + resultObj.error);
			// 			throw err;
			// 		}
			// 		else {
			// 			assert.equal(resultObj.responseType, 'object');
			// 			assert.equal(resultObj.response.success, true);

			// 			done();
			// 		}
			// 	});
			// });

			// it("should return the test user", function(done) {
			// 	request(app).get('/login/user.json').expect(200).end(function(err, res) {
			// 		var resultObj = JSON.parse(res.text);
			// 		if (err) {
			// 			console.log('error: ' + resultObj.error);
			// 			throw err;
			// 		}
			// 		else {
			// 			assert.equal(resultObj.responseType, 'object');
			// 			assert.equal(resultObj.response.success, true);

			// 			done();
			// 		}
			// 	});
			// });
			
			// it("should return 400 (already logged in)", function(done) {
			// 	request(app).post('/login.js').send({username:testUser.email, password:testUser.password}).expect(400).end(function(err, res) {
			// 		checkErrorResponse(err, res, done);
			// 	});
			// });

			// it("should log the test user out", function(done) {
			// 	request(app).post('/logout.js').expect(200).end(function(err, res) {
			// 		var resultObj = JSON.parse(res.text);
			// 		if (err) {
			// 			console.log('error: ' + resultObj.error);
			// 			throw err;
			// 		}
			// 		else {
			// 			assert.equal(resultObj.responseType, 'object');
			// 			assert(equalUserRecords(resultObj.response, testUser));

			// 			done();
			// 		}
			// 	});
			// });

			it("should return failure", function(done) {
				request(app).get('/login/status.json').expect(200).end(function(err, res) {
					var resultObj = JSON.parse(res.text);
					if (err) {
						console.log('error: ' + resultObj.error);
						throw err;
					}
					else {
						assert.equal(resultObj.responseType, 'object');
						assert.equal(resultObj.response.success, false);

						done();
					}
				});
			});

			it("should return an empty object", function(done) {
				request(app).get('/login/user.json').expect(200).end(function(err, res) {
					var resultObj = JSON.parse(res.text);
					if (err) {
						console.log('error: ' + resultObj.error);
						throw err;
					}
					else {
						assert.equal(resultObj.responseType, 'object');
						assert.equal(JSON.stringify(resultObj.response), '{}');

						done();
					}
				});
			});

			it("should return 400 (already logged out)", function(done) {
				request(app).post('/logout.js').send({username:testUser.email, password:testUser.password}).expect(400).end(function(err, res) {
					checkErrorResponse(err, res, done);
				});
			});

			it("should return 403 (incorrect password)", function(done) {
				request(app).post('/login.js' + access).send({username:testUser.email, password:'thisshouldntbealegitimatepassword'}).expect(403).end(function(err, res) {
					checkErrorResponse(err, res, done);
				});
			});
		});

		describe("DELETE User", function() {
			it ("should remove test user", function(done) {
				//Post each record in the test database
				request(app).del('/users/' + user + '.json' + access).expect(200).end(function(err, res) {
					if (err) {
						// var resultObj = JSON.parse(res.text);
						// console.log('error: ' + resultObj.error);
						throw err;
					}
					else {
						done();
					}
				});
			});
		});

		after(function() {
			next();
		});
	});
}