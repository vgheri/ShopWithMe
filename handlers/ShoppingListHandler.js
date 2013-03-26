/***
 * Author: Valerio Gheri
 * Date: 25/03/2013
 * This class contains all the methods to handle /api/lists related requests
 */

var ShoppingList = require('../models/ShoppingList');
var Account = require('../models/Account');
var winston = require('winston');

var ShoppingListHandler = function() {
	this.createShoppingList = handleCreateShoppingListRequest;
	//this.createShoppingListFromTemplate = handleCreateShoppingListFromTemplateRequest;
	//this.getAccount = handleGetAccountRequest;
	this.updateShoppingList = handleUpdateShoppingListRequest;
	//this.deleteAccount = handleDeleteAccountRequest;     
};

// On success should return status code 201 to notify the client the account
// creation has been successful
// On error should return status code 400 and the error message
function handleCreateShoppingListRequest(req, res) {
	var createdBy = req.body.userId || null;
	var title = req.body.title || null;
	// createShoppingList handles creation of all lists, both empty ones
	// and pre-populated ones
	var opts = {
		isShared: false,
		invitees: [],
		shoppingItems: []
	};
	createShoppingList(createdBy, title, opts, function(err, shoppingList) {
		console.log("callback called");
		if (err) {
			winston.log('error', 'An error has occurred while processing a request to create a ' 
			+ 'shopping list from ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
			res.json(400, {
				error: err.message
			});
		}
		else {
			winston.log('info', 'User Id ' + createdBy + ' has just created a ' 
			+ 'new empty shopping list. Request from address ' + req.connection.remoteAddress + '.');
			res.json(201, shoppingList);
		}
	});
}

function handleUpdateShoppingListRequest(req, res) {
	// Retrieve the shopping list id from the request
	var id = req.params.id || null;
	var parameters = req.body || null;
	if (id) {
		updateShoppingList(id, parameters, function(err, shoppingList) {
			if (err) {
				winston.log('error', 'An error has occurred while processing a request ' +
				' to update shopping list with id ' + id + ' from ' +
				req.connection.remoteAddress + '. Stack trace: ' + err.stack);
				res.json(400, {
					error: err.message
				});
			}
			else {
				if (shoppingList) {
					winston.log('info', 'Shopping list ' + id + ' has been updated.' + 
					'Request from address ' + req.connection.remoteAddress + '.');
					res.json(200, shoppingList);
				}
				else {
					winston.log('info', 'Could not update shopping list ' + id + 
					', no such id exists. Request from address ' + req.connection.remoteAddress + '.');
					res.json(404, {
						error: "No shopping list found matching id " + id
					});
				}
			}
		});
	}
}

function createShoppingList(creatorId, title, opts, callback) {
	var shoppingList = new ShoppingList({
		createdBy: creatorId,
		title: title,
		isShared: opts.isShared,
		invitees: opts.invitees,
		shoppingItems: opts.shoppingItems
	});
	//shoppingList.save(callback);
	shoppingList.save(function(err, savedShoppingList) {		
		if (err) {
			return callback(err, null);
		}
		var query = {
			_id: creatorId
		};		
		Account.findOne(query, function(err, profile) {
			if (err) {
				return callback(err, null);
			}	
			// Let's add this new shopping list to the list contained in the profile
			profile.shoppingLists.addToSet(savedShoppingList._id);
			profile.save(function(err, profile) {
				return callback(err, savedShoppingList);
			});
		});
	});	
}

function updateShoppingList(id, parameters, callback) {	
	var query = {
		_id: id
	};
	var options = {
		new: true
	};
	var update = {};
	// Setup field to update
	if (parameters.isTemplate) {
		update.isTemplate = parameters.isTemplate;
	}
	if (parameters.title) {
		update.title = parameters.title;
	}
	if (parameters.isShared) {
		update.isShared = parameters.isShared;
	}
	if (parameters.invitees) {
		update.invitees = parameters.invitees;
	}
	
	update.lastUpdate = new Date();
	
	for (var key in parameters) {
		if (key !== 'isTemplate' && key && 'title' && key !== 'isShared' && key !== 'invitees') {
			// Unexpected parameters, raise error
			var err = new Error('Unexpected parameter: ' + key);
			return callback(err, null);
		}
	}
	
	ShoppingList.findOneAndUpdate(query, update, options, callback);
}

module.exports = ShoppingListHandler;
