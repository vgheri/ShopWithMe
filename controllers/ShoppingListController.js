/***
 * Author: Valerio Gheri
 * Date: 25/03/2013
 * This class contains all the methods to handle /api/lists related requests
 */

var ShoppingList = require('../models/ShoppingList');
var Account = require('../models/Account');
var shopListRepository = require('../repositories/ShoppingListRepository');
var winston = require('winston');

var ShoppingListController = function() {
	this.createShoppingList = handleCreateShoppingListRequest;	
	this.getShoppingLists = handleGetShoppingListsRequest;
	this.updateShoppingList = handleUpdateShoppingListRequest;
	this.deleteShoppingList = handleDeleteShoppingListRequest;     
};

// On success should return status code 201 to notify the client the account
// creation has been successful
// On error should return status code 400 and the error message
function handleCreateShoppingListRequest(req, res) {
	var createdBy = req.body.userId || null;
	var opts = {};
	var title;
	if (req.params.id) {
		// It means we want to create a list from a template
		ShoppingList.findById({ _id: req.params.id }, function(err, template) { 
			if (err) {
				winston.log('error', 'An error has occurred while processing a request to create a ' 
				+ 'shopping list from ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
				res.json(400, {
					error: err.message
				});
			}
			else if (template) {
				title = template.title;
				opts = {					
					isShared: template.isShared,
					invitees: template.invitees,
					shoppingItems: template.shoppingItems
				};
				shopListRepository.create(createdBy, title, opts, function(err, shoppingList) {	
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
			else {
				// No template could be found. Return 404
				winston.log('info', 'User id ' + createdBy + ' tried to create a new ' +  
				'shopping list from template with id ' + req.params.id + ' but no such id could be found.' +   
				' Remote address: ' + req.connection.remoteAddress);
				res.json(404, {
					error: "Template not found"
				});
			}
		}); 
	} // We want to create an empty shopping list
	else {
		title = req.body.title || null;	
		// createShoppingList handles creation of all lists, both empty ones
		// and pre-populated ones
		opts = {
			isShared: false,
			invitees: [],
			shoppingItems: []
		};
		shopListRepository.create(createdBy, title, opts, function(err, shoppingList) {			
			if (err) {
				winston.log('error', 'An error has occurred while processing a request to create a ' 
				+ 'shopping list from ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
				res.json(400, {
					error: err.message
				});
			}
			else {
				if (shoppingList) {
					winston.log('info', 'User Id ' + createdBy + ' has just created a ' 
					+ 'new empty shopping list. Request from address ' + req.connection.remoteAddress + '.');
					res.json(201, shoppingList);
				}
				else {
					winston.log('info', 'Could not create a new empty shopping list for ' +
					'user ' + createdBy + ': no such user exists.' +
					' Remote address: ' + req.connection.remoteAddress);
					res.json(404, { error: "User not found" });
				}
			}
		});		
	}	
}

function handleGetShoppingListsRequest(req, res) {
	var userId = req.params.userId || null;
	var query = req.query;
	// If we have a query, it means we want to retrieve templates
	if (query && query.isTemplate) {		
		handleGetTemplateListsForUserRequest(req, res, userId);
	} // 
	else {
		handleGetListsForUserRequest(req, res, userId);
	}
}

function handleUpdateShoppingListRequest(req, res) {
	// Retrieve the shopping list id from the request
	var id = req.params.id || null;
	var parameters = req.body || null;
	if (id) {
		shopListRepository.update(id, parameters, function(err, shoppingList) {
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

function handleDeleteShoppingListRequest(req, res) {
	var listId = req.params.id || null;
	shopListRepository.remove(listId, function(err, shoppingList) {
		if (err) {
			winston.log('error', 'An error has occurred while deleting shopping list ' 
			+ listId + ' from ' + req.connection.remoteAddress + 
			'. Stack trace: ' + err.stack);
			res.json(500, {
				error: err.message
			});
		}
		else {
			console.log('Shopping list: ' + shoppingList);
			winston.info('log', 'In delete: ' + shoppingList);
			if (shoppingList) {
				winston.log('info', 'Shopping list ' + listId + ' has been deleted.' + 
				'Request from address ' + req.connection.remoteAddress + '.');
				// No need to return anything. We just deleted the list 
				res.json(204, null);
			}
			else {
				winston.log('info', 'Could not delete shopping list ' + listId + ', no ' 
				+ 'such id exists. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, {
					error: "No shopping list found matching " + listId
				});
			}
		}
	});
}

// Returns 404 both for a not existing user and for an empty result set
function handleGetTemplateListsForUserRequest(req, res, userId) {
	shopListRepository.findTemplatesForUser(userId, function(err, templates) {
		if (err) {
			winston.log('error', 'An error has occurred while processing a request to '
			+ 'retrieve template lists for user ' + userId + ' from ' + req.connection.remoteAddress + 
			'. Stack trace: ' + err.stack);
			res.json(500, {
				error: err.message
			});
		}
		else {			
			if (templates && templates.length > 0) {
				winston.log('info', 'Successfully retrieved templates for user ' + userId 
				+ '. Request from address ' + req.connection.remoteAddress + '.');
				res.json(200, templates);						
			}
			else {
				winston.log('info', 'No template list for user ' + userId 
				+ '. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, templates);	
			}
		}
	});
}

// Returns 404 for a not existing user and for an empty result set
function handleGetListsForUserRequest(req, res, userId) {
	// fetch the user		
	Account.findById(userId, function(err, account) {
		if (err) {
			winston.log('error', 'An error has occurred while processing a request to '
			+ 'retrieve shopping lists for user ' + userId + ' from ' + req.connection.remoteAddress + 
			'. Stack trace: ' + err.stack);
			res.json(500, {
				error: err.message
			});
		}
		else {
			if (account) {
				// get the list of shopping list IDs for the user
				var listIDs = account.shoppingLists;
				// then do a find on the shoppingLists collection to look for the IDs retrieved 
				// filtered by isActive = true and isTemplate = false
				var query = {
					"_id": { $in: listIDs },
					isActive: true,
					isTemplate: false
				};
				ShoppingList.find(query, function(err, lists) {
					if (err) {
						winston.log('error', 'An error has occurred while processing a request to '
						+ 'retrieve shopping lists for user ' + userId + ' from ' + req.connection.remoteAddress + 
						'. Stack trace: ' + err.stack);
						res.json(500, {
							error: err.message
						});
					}
					else {
						if (lists && lists.length > 0) {
							winston.log('info', 'Successfully retrieved shopping lists for user ' + userId 
							+ '. Request from address ' + req.connection.remoteAddress + '.');
							res.send(200, lists);
						}
						else {
							winston.log('info', 'No shopping list for user ' + userId 
							+ '. Request from address ' + req.connection.remoteAddress + '.');
							res.json(404, null);	
						}
					}
				});
			}
			else {				
				winston.log('info', 'No shopping list for user ' + userId 
				+ '. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, null);
			}
		}
	});
}

module.exports = ShoppingListController;
