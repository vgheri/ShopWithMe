/***
 * Unit tests for routes handled by AccountHandler.js
 */
 
 var should = require('should'); 
 var assert = require('assert');
 var request = require('supertest'); 
 var server = require('../Server.js'); 
 var mongoose = require('mongoose');
 
 function makeid()
 {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
 }
 
 describe('Routing', function() {
 	describe('Account', function() { 		
		before(function(done) {
			mongoose.connect("mongodb://testUser:testpassword@ds045077.mongolab.com:45077/shopwithmetest");			
			//server.start();				
			done();
		}); 
		it('should return error trying to save duplicate username', function(done) {
			var profile = {
				username: 'vgheri',
				password: 'test',
				firstName: 'Valerio',
				lastName: 'Gheri'
			};
			request('https://project-livec93b91f71eb7.rhcloud.com')
				.post('/profiles')
				.send(profile)
				.end(function(err, res) {
					if (err) {
						throw err;
					}                    
					res.should.have.status(400);	 				
					done();
				});
		});
		it('should save a profile and return it', function(done) {
			var profile = {
				username: makeid(),
				password: 'test',
				firstName: 'Valerio',
				lastName: 'Gheri'
			};
			request('https://project-livec93b91f71eb7.rhcloud.com')
				.post('/profiles')
				.send(profile)
				.end(function(err, res) {
					if (err) {
						throw err;
					}                    
					res.should.have.status(201);
					res.body.should.have.property('_id');
					res.body.creationDate.should.not.equal(null);
					done();
				});
		});
		it('should return a 404 status code for username ciccio', function(done){
			request('https://project-livec93b91f71eb7.rhcloud.com')
				.get('/profiles/ciccio')
				.expect('Content-Type', /json/)	 			
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(404);	 				
					done();
				});
		});
	});
 });
 
 