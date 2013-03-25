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
 	var url;
  //url = 'http://localhost:3000';
  // Cloud 9
  url = 'https://project-livec93b91f71eb7.rhcloud.com';
	before(function(done) {
			mongoose.connect("mongodb://testUser:testpassword@ds045077.mongolab.com:45077/shopwithmetest");							
			done();
	});
	describe('Account', function() {
		it('should return error trying to save duplicate username', function(done) {
			var profile = {
				username: 'vgheri',
				password: 'test',
				firstName: 'Valerio',
				lastName: 'Gheri'
			};
			request(url)
				.post('/api/profiles')
				.send(profile)
				.end(function(err, res) {
					if (err) {
						throw err;
					}                    
					res.should.have.status(400);	 				
					done();
				});
		});
		it('should return error trying to save account without username', function(done) {
			var profile = {
				//username: null,
				password: 'test',
				firstName: 'Valerio',
				lastName: 'Gheri'
			};
			request(url)
				.post('/api/profiles')
				.send(profile)
				.expect(400)
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
				.post('/api/profiles')
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
				.get('/api/profiles/ciccio')
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
			.get('/api/profiles/vgheri')
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
				.put('/api/profiles/ciccio')
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
				.put('/api/profiles/vgheri')
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
				.del('/api/profiles/ciccio')
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
				.del('/api/profiles/0CEEp')				                
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(204);
				});
			request(url)
				.get('/api/profiles/0CEEp')
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
	describe('Shopping List', function() {
		var userId;
		before(function(done) {
			userId = new mongoose.Types.ObjectId();
			done();
		});
		it('should save a new empty shopping list, along with a title', 
		function(done) {
			var emptyShoppingList = {
				userId: userId,
				title: 'Test list'             
			};
			request(url)
				.post('/api/lists')
				.send(emptyShoppingList)
				.expect(201)
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					res.body.should.have.property('_id');
					res.body.creationDate.should.not.equal(null);
					res.body.shoppingItems.should.have.length(0);
					done();
				});
		});
		it('should return error saving a shopping list without a title', 
		function(done) {
			var emptyShoppingList = {
				userId: userId
			};			
			request(url)
				.post('/api/lists')
				.send(emptyShoppingList)
				.expect(400)
				.end(function(err, res) {					
					if (err) {	
						return done(err);
					}					
					done();
				});
		});
		it('should update an existing shopping list, marking it as a template', 
		function(done) {
			var modifiedShoppingList = {								
				isTemplate: true
			};
			// 
			request(url)
				.put('/api/lists/51505811d7aea01c70000004')
				.send(modifiedShoppingList)
				.expect(204)
				.end(function(err, res) {
					if (err) {
						throw err;
					}					
					done();
				});
		});
		it('should return error trying to update an existing shopping list with an unknown parameter', 
		function(done) {
			var modifiedShoppingList = {								
				nonsense: true
			};
			// 
			request(url)
				.put('/api/lists/51505811d7aea01c70000004')
				.send(modifiedShoppingList)
				.expect(400)
				.end(function(err, res) {
					if (err) {
						throw err;
					}					
					done();
				});
		}); /*
		it('should save a new shopping list using another given list as a template', 
		function(done) {
			var emptyShoppingList = {
				userId: userId,
				title: 'Test list'             
			};
			request(url)
				.post('/api/lists/')
				.send(emptyShoppingList)
				.expect(201)
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					res.body.should.have.property('_id');
					res.body.creationDate.should.not.equal(null);
					res.body.shoppingItems.should.have.length(0);
					done();
				});
		});*/
  });
 });
 
 