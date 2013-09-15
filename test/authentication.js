/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 02/09/13
 * Time: 15.02
 * To change this template use File | Settings | File Templates.
 */

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var ShoppingList = require('../models/ShoppingList');
var SecurityAccessToken = require("../infrastructure/securityToken");
var config = require('../Config-debug');

describe('Authentication', function() {
	var url = 'http://localhost:3000';
	var userId = null;
	var validToken = 'CAACEdEose0cBAKOCZBkJ4BZCROxLHr1UVZBONqKLkwNDnw90IPkraOfmE6I8J8Pigh2EZAZCfiRUL5nduo159igYNELYpnyTvZCfgVPgtLGbVweQYUIJlVjZCpBHEbIUYyxk5dYZBAX811swQZARADZBIm7h5qXfqGwhbrsN5EVGEoekrC5dlKZCrqb9A2ejkIWLMEZD';
	var apiAccessToken = null;
	var invalidToken = 'CAACEdEose0cBAPejwR1CBgEJC0o9SdmgZAMw3fhbZBZAf4lGcqhVadA76oHibWUs7gvYzbOaWVs2oVuafemu7gISRiv6j7TPgRtMrOCJEUNKACsqmf82xGhvZBTOPDZAedO0aU8Gz5lO2ZCeG3mXEd0TBeniCyTeRbuXj3fMVoPj4prIKf0vI5CtPlrI3myL8ZD';
	this.timeout(7000);
	var loginDone = false;
	before(function(done) {
		if (mongoose.connection.readyState === 0) {
			mongoose.connect(config.db.mongodb);
		}
		done();
	});
	it('should login with facebook using a valid facebook user access token',
		function(done) {
			//setTimeout(done, 5000);
			var loginCredentials = {
				fbToken: validToken,
				appName: 'testFBMobile'
			};
			request(url)
				.post('/api/auth/facebook/mobile')
				.send(loginCredentials)
				.expect(200)
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					res.body.should.have.property('userId');
					userId = res.body.userId;
					res.body.should.have.property('username', 'valerio.gheri');
					res.body.should.have.property('firstName', 'Valerio');
					res.body.should.have.property('lastName', 'Gheri');
					res.body.should.have.property('apiAccessToken');
					res.body.apiAccessToken.should.not.equal(null);
					apiAccessToken = res.body.apiAccessToken;
					loginDone = true;
					done();
				});
		});
	it('should retrieve account with username valerio.gheri',
		function(done) {
			request(url)
				.get('/api/profiles/valerio.gheri')
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(200);
					res.body.should.have.property('_id');
					res.body.should.have.property('firstName', 'Valerio');
					res.body.creationDate.should.not.equal(null);
					done();
				});
		});
	it('should return error attempting to login with a non valid facebook user access token',
		function(done) {
			var loginCredentials = {
				fbToken: invalidToken,
				appName: 'testFBMobile'
			};
			request(url)
				.post('/api/auth/facebook/mobile')
				.send(loginCredentials)
				.expect(401)
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					done();
				});
		});
	it('should correctly logout a user and delete the corresponding security token from the db', function(done) {
		while(!loginDone) {
			// do nothing
		}
		var body = {
			apiAccessToken: apiAccessToken,
			userId: userId
		};
		request(url)
			.post('/api/auth/logout')
			.send(body)
			.expect(200)
			.end(function(err, res) {
				if (err) {
					throw err;
				}
				else {
					SecurityAccessToken.findSecurityToken(apiAccessToken)
						.then(function(retrievedToken) {
							should.equal(null, retrievedToken);
							done();
						})
						.fail(function(err) {
							throw new Error(err);
						});
				}
			});
	});
});

