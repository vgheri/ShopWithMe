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
		var url;
		before(function(done) {
			url = 'http://localhost:3000';
			// Cloud 9
			//url = 'https://project-livec93b91f71eb7.rhcloud.com';
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
			request(url)
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
			request(url)
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
		it('should return a 404 status code for an unknown account', function(done){
			request(url)
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
		it('should retrieve an existing account', function(done){
			request(url)
			.get('/profiles/vgheri')
			.expect('Content-Type', /json/)
			.end(function(err,res) {
				if (err) {
					throw err;
				}
				res.should.have.status(200);
									res.body.should.have.property('_id');
					res.body.creationDate.should.not.equal(null);
				done();
			});
		});
		it('should return a 404 status code trying to update an unknown account', function(done){
			var body = {
				firstName: 'Noone',
				lastName: 'Unknown'
			};
			request(url)
				.put('/profiles/ciccio')
				.send(body)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(404);
					done();
				});
		});
		it('should correctly update an existing account', function(done){
			var body = {
				firstName: 'JP',
				lastName: 'Bermond'
			};
			request(url)
				.put('/profiles/vgheri')
				.send(body)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(200);
                    res.body.should.have.property('_id');
                    res.body.firstName.should.equal('JP');
                    res.body.lastName.should.equal('Bermond');                    
                    res.body.creationDate.should.not.equal(null);
					done();
				});
		});
		it('should return a 404 status code trying to delete an unknown account', function(done){
			var body = {
				firstName: 'Noone',
				lastName: 'Unknown'
			};
			request(url)
				.del('/profiles/ciccio')
				.send(body)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(404);                     
					done();
				});
		});
		it('should correctly delete an existing account', function(done){
			request(url)
				.del('/profiles/0CEEp')				                
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(204);
				});
			request(url)
				.get('/profiles/0CEEp')
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(200);
					res.body.should.have.property('_id');
					res.body.isActive.should.equal(false);
					res.body.canLogin.should.equal(false);
					done();
				});
		});
	});
 });
 
 