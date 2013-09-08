/***
 * Unit tests for routes handled by AccountHandler.js
 */
 
 var should = require('should'); 
 var assert = require('assert');
 var request = require('supertest'); 
 //var server = require('../Server.js');
 var mongoose = require('mongoose');
 var winston = require('winston');
 var ShoppingList = require('../models/ShoppingList');
 var config = require('../Config-debug');

 
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
  url = 'http://localhost:3000';
	var testUsername = makeid();
	var testToDeleteUsername = makeid();
	var testUserId;
  // Cloud 9
  //url = 'https://project-livec93b91f71eb7.rhcloud.com';
  //url = 'http://shopwithme.vgheri.c9.io';
	before(function(done) {
			if (mongoose.connection.readyState === 0) {
				mongoose.connect(config.db.mongodb);
			}
			done();
	});
	describe('Account', function() {
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
				username: testUsername,
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
					testUserId = res.body._id;
					res.body.creationDate.should.not.equal(null);
					done();
				});
		});
		it('should save a profile with username ' + testToDeleteUsername  + ' and return it', function(done) {
			var profile = {
				username: testToDeleteUsername,
				password: 'testdelete',
				firstName: 'ToBe',
				lastName: 'Deleted'
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
		it('should return error trying to save duplicate username', function(done) {
			var profile = {
				username: testUsername,
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
			.get('/api/profiles/' + testUsername)
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
				.put('/api/profiles/' + testUsername)
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
		it('should correctly delete account ' + testToDeleteUsername, function(done){
			request(url)
				.del('/api/profiles/' + testToDeleteUsername)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(204);
					request(url)
						.get('/api/profiles/' + testToDeleteUsername)
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
	describe('Shopping List', function() {
		var userId;
		var shoppingListId;
		var templateId;
		var itemId;
		before(function(done) {
			//userId = new mongoose.Types.ObjectId('5149d6d382d09b6722000002');
			userId = testUserId;
			done();
		});
		it('should save a new empty shopping list', 
		function(done) {			
			var emptyShoppingList = {
				userId: userId,
				title: 'Test list'             
			};			
			request(url)
				.post('/api/profiles/' + userId + '/lists')
				.send(emptyShoppingList)
				.expect(201)
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					res.body.should.have.property('_id');
					shoppingListId = res.body._id;
					res.body.creationDate.should.not.equal(null);
					res.body.shoppingItems.should.have.length(0);
					done();
				});
		});
		it('should retrieve the just created list',
		function(done) {
			request(url)
				.get('/api/profiles/' + userId + '/lists/' + shoppingListId)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(200);
					res.body.should.have.property('_id');
					res.body.creationDate.should.not.equal(null);
					res.body.should.have.property('title', 'Test list');
					done();
				});
		});
		it('should have added the newly created list to the lists of the user ' + testUsername,
		function(done) {
			request(url)
				.get('/api/profiles/' + testUsername)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}					
					res.should.have.status(200);					
					res.body.shoppingLists.should.not.have.length(0);
					res.body.shoppingLists.should.includeEql(shoppingListId);
					done();
				});
		});
		it('should return 404 trying to retrieve a shopping list for a nonexistent user',
		function(done) {
			request(url)
				.get('/api/profiles/5149d6d382d09b6722232772/lists/' + shoppingListId)
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(404);
					done();
				});
		});
		it('should return 404 trying to retrieve a nonexistent shopping list for this user',
		function(done) {
			request(url)
				.get('/api/profiles/' + userId + '/lists/5149d6d382d09b6722232772')
				.expect('Content-Type', /json/)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(404);
					done();
				});
		});
		it('should return error saving a shopping list without a title', 
		function(done) {
			var emptyShoppingList = {
				userId: userId
			};			
			request(url)
				.post('/api/profiles/' + userId + '/lists')
				.send(emptyShoppingList)
				.expect(400)
				.end(function(err, res) {					
					if (err) {	
						return done(err);
					}					
					done();
				});
		});
		it('should update an existing shopping list, marking it as a template, shared, adding invitees and updating lastUpdate timestamp',
		function(done) {
			var modifiedShoppingList = {								
				isTemplate: true,
				isShared: true,
				invitees: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
			};			 
			request(url)
				.put('/api/profiles/' + userId + '/lists/' + shoppingListId)
				.send(modifiedShoppingList)
				.expect(200)
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					templateId = res.body._id;
					done();
				});
		});
		it('should return error trying to update an existing shopping list with an unknown parameter',
		function(done) {
			var modifiedShoppingList = {								
				nonsense: true
			};
			this.timeout(5000);
			request(url)
				.put('/api/profiles/' + userId + '/lists/' + shoppingListId)
				.send(modifiedShoppingList)
				.expect(400)
				.end(function(err, res) {
					if (err) {
						throw err;
					}					
					done();
				});
		});
		it('should return 404 trying to update a not existing shopping list', 
		function(done) {
			var modifiedShoppingList = {				
				title: 'Test list'
			};
			// 
			request(url)
				.put('/api/profiles/' + userId + '/lists/507f191e810c19729de860ea')
				.send(modifiedShoppingList)
				.expect(404)
				.end(function(err, res) {
					if (err) {
						throw err;
					}					
					done();
				});
		});
		it('should get all active templates for an existing user', 
		function(done) {			
			request(url)
				.get('/api/profiles/' + userId + '/lists?isTemplate=1')
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.body.should.not.have.length(0);					
					done();
				});
		});
		it('should return 404 when trying to retrieve templates for a nonexistent user',
		function(done) {			
			request(url)
				.get('/api/profiles/507f191e810c19729de860ea/lists?isTemplate=1')
				.expect('Content-Type', /json/)
				.expect(404)
				.end(function(err,res) {
					if (err) {
						throw err;
					}					
					done();
				});
		});
		it('should return 404 when trying to retrieve templates for an existing user who has no templates', 
		function(done) {			
			request(url)
				.get('/api/profiles/5149da06dea6ba6419000005/lists?isTemplate=1')
				.expect('Content-Type', /json/)
				.expect(404)
				.end(function(err,res) {
					if (err) {
						throw err;
					}					
					done();
				});
		});		
		it('should save a new shopping list using another given list as a template', 
		function(done) {
			request(url)
				.post('/api/profiles/' + userId + '/lists/' + templateId)
				.send({ userId: userId })
				.expect(201)
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					res.body.should.have.property('_id');
					res.body.should.have.property('title', 'Test list');
					res.body.creationDate.should.not.equal(null);
					res.body.shoppingItems.should.have.length(0);
					res.body.invitees.should.not.have.length(0);
					res.body.isTemplate.should.equal(false);
					res.body.isShared.should.equal(true);
					done();
				});
		});
		it('should return a list of all the shopping lists (not template) that the ' + 
			'user ' + testUsername + ' recently created or that have been shared with him',
		function(done) {
			request(url)
				.get('/api/profiles/' + userId + '/lists')
				.expect('Content-Type', /json/)
				.expect(200)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.body.should.not.have.length(0);
					res.body.forEach(function(list) {
						list.isTemplate.should.equal(false);
						list.createdBy.toString().should.equal(userId.toString());
					});
					done();
				});
		});
		it('should return 404 trying to get shopping lists for a nonexistent user',
		function(done) {
			request(url)
				.get('/api/profiles/507f191e810c19729de860ea/lists')
				.expect('Content-Type', /json/)
				.expect(404)
				.end(function(err,res) {
					if (err) {
						throw err;
					}					
					done();
				});
		});
		it('should return 404 trying to get shopping lists for an existing user who has no saved lists',
		function(done) {
			request(url)
				.get('/api/profiles/5149e05ef9566c132b000003/lists')
				.expect('Content-Type', /json/)
				.expect(404)
				.end(function(err,res) {
					if (err) {
						throw err;
					}					
					done();
				});
		});
		/* Tests for list items */
		it('should add a new item to the empty shopping list just created',
		function(done) {
			var listItem = {
				name: 'bread',
				quantity: '1kg',
				comment: 'Pane lariano'
			};
			request(url)
				.post('/api/profiles/' + userId + '/lists/' + shoppingListId + '/item/')
				.send(listItem)
				.expect('Content-Type', /json/)
				.expect(201)
				.end(function(err, res) {
					if (err) {
						throw err;
					}
					else {
						var shoppingList = res.body;
						//shoppingList.shoppingItems.length.should.not.be(0);
						shoppingList.shoppingItems[0].should.have.property('_id');
						itemId = shoppingList.shoppingItems[0]._id;
						shoppingList.shoppingItems[0].should.have.property('name', 'bread');
						shoppingList.shoppingItems[0].should.have.property('quantity', '1kg');
						shoppingList.shoppingItems[0].should.have.property('comment', 'Pane lariano');
						shoppingList.shoppingItems[0].should.have.property('isInTheCart', false);
						done();
					}
				});
		});
		it('should add a new item to a not empty shopping list',
			function(done) {
				var listItem = {
					name: 'cannoli siciliani',
					quantity: '6',
					comment: 'quelli buoni'
				};
				request(url)
					.post('/api/profiles/' + userId + '/lists/' + shoppingListId + '/item/')
					.send(listItem)
					.expect('Content-Type', /json/)
					.expect(201)
					.end(function(err, res) {
						if (err) {
							throw err;
						}
						else {
							var shoppingList = res.body;
							//shoppingList.shoppingItems.should.have.length(2);
							shoppingList.shoppingItems[1].should.have.property('_id');
							shoppingList.shoppingItems[1].should.have.property('name', 'cannoli siciliani');
							shoppingList.shoppingItems[1].should.have.property('quantity', '6');
							shoppingList.shoppingItems[1].should.have.property('comment', 'quelli buoni');
							shoppingList.shoppingItems[1].should.have.property('isInTheCart', false);
							done();
						}
					});
			});
		it('should return error trying to add a new item without a name to an existing shopping list',
			function(done) {
				var listItem = {
					quantity: '1kg'
				};
				request(url)
					.post('/api/profiles/' + userId + '/lists/' + shoppingListId + '/item/')
					.send(listItem)
					.expect('Content-Type', /json/)
					.expect(400)
					.end(function(err, res) {
						if (err) {
							throw err;
						}
						else {
							done();
						}
					});
			});
		it('should return error trying to add an item that is already in the shopping list',
			function(done) {
				var listItem = {
					name: 'bread',
					quantity: '0,5 kg',
					comment: 'well cooked'
				};
				request(url)
					.post('/api/profiles/' + userId + '/lists/' + shoppingListId + '/item/')
					.send(listItem)
					.expect('Content-Type', /json/)
					.expect(400)
					.end(function(err, res) {
						if (err) {
							throw err;
						}
						else {
							done();
						}
					});
			});
		it('should correctly update an existing item into an existing shopping list',
			function(done) {
				var listItem = {
					name: 'Pane',
					quantity: '0,5 kg',
					comment: 'Lariano quality'
				};
				request(url)
					.put('/api/profiles/' + userId + '/lists/' + shoppingListId + '/item/' + itemId)
					.send(listItem)
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(err, res) {
						if (err) {
							throw err;
						}
						else {
							var shoppingList = res.body;
							//shoppingList.shoppingItems.should.have.length(2);
							shoppingList.shoppingItems[0].should.have.property('_id');
							shoppingList.shoppingItems[0].should.have.property('name', 'Pane');
							shoppingList.shoppingItems[0].should.have.property('quantity', '0,5 kg');
							shoppingList.shoppingItems[0].should.have.property('comment', 'Lariano quality');
							shoppingList.shoppingItems[0].should.have.property('isInTheCart', false);
							done();
						}
					});
			});
		it('should correctly cross out an existing item of an existing shopping list',
			function(done) {
				request(url)
					.put('/api/profiles/' + userId + '/lists/' + shoppingListId + '/item/' + itemId + '/crossout')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(err, res) {
						if (err) {
							throw err;
						}
						else {
							var shoppingList = res.body;
							var itemInTheCart = 0;
							// Also no other item in the cart should have this property set to true
							for (var i = 0; i < shoppingList.shoppingItems.length; i++) {
								if (shoppingList.shoppingItems[i]._id !== itemId) {
									shoppingList.shoppingItems[i].should.have.property('isInTheCart', false);
								}
								else {
									shoppingList.shoppingItems[i].should.have.property('isInTheCart', true);
									itemInTheCart++;
								}
							}
							itemInTheCart.should.equal(1);
							done();
						}
					});
			});
		it('should correctly delete an existing item from an existing shopping list and return 204',
			function(done) {
				request(url)
					.del('/api/profiles/' + userId + '/lists/' + shoppingListId + '/item/' + itemId)
					.expect(204)
					.end(function(err, res) {
						if (err) {
							throw err;
						}
						else {
							done();
						}
					});
			});
		it('should return ERR CODE 404 trying to delete an unknown item from an existing shopping list',
			function(done) {
				request(url)
					.del('/api/profiles/' + userId + '/lists/' + shoppingListId + '/item/507f191e810c19729de860ea')
					.expect(404)
					.end(function(err, res) {
						if (err) {
							throw err;
						}
						else {
							done();
						}
					});
			});
		it('should return ERR CODE 404 trying to delete an item from an unknown shopping list',
			function(done) {
				request(url)
					.del('/api/profiles/' + userId + '/lists/507f191e810c19729de860ea/item/507f191e810c19729de860ea')
					.expect(404)
					.end(function(err, res) {
						if (err) {
							throw err;
						}
						else {
							done();
						}
					});
			});
		/* End of tests for list items */
		it('should return a 404 status code trying to delete an unknown shopping list',
		function(done){
			request(url)
				.del('/api/profiles/' + userId + '/lists/507f191e810c19729de860ea')
				.expect(404)
				.end(function(err,res) {
					if (err) {
						throw err;
					}					
					done();
				});
		});
		it('should correctly delete an existing shopping list and return 204',
		function(done){
			request(url)
				.del('/api/profiles/' + userId + '/lists/' + shoppingListId)
				.expect(204)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					done();
			});
		});
		it('should reply with 404 trying to retrieve the just deleted shopping list',
		function(done) {
			request(url)
				.get('/api/profiles/' + userId + '/lists/' + shoppingListId)
				.expect(404)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					done();
			});
		});
		it('should correctly delete account ' + testUsername, function(done){
			request(url)
				.del('/api/profiles/' + testUsername)
				.end(function(err,res) {
					if (err) {
						throw err;
					}
					res.should.have.status(204);
					request(url)
						.get('/api/profiles/' + testUsername)
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
 });
 
 