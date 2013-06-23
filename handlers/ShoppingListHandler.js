/***
 * Author: Valerio Gheri
 * Date: 25/03/2013
 * This class contains all the methods to handle /api/lists related requests
 */

var ShoppingList = require('../models/ShoppingList');
var Account = require('../models/Account');
var winston = require('winston');
var ShoppingListRepository = require('../repositories/shoppingListRepository');
var AccountRepository = require('../repositories/accountRepository');
var logger = require('../utils/logger');
var security = require('../securityPolicy');
var Q = require('q');

var ShoppingListHandler = function() {
	this.createShoppingList = handleCreateShoppingListRequest;	
	this.getShoppingLists = handleGetShoppingListsRequest;
	this.getShoppingList = handleGetShoppingListRequest;
	this.updateShoppingList = handleUpdateShoppingListRequest;
	this.deleteShoppingList = handleDeleteShoppingListRequest;
};

/// Create an empty shopping list or a list based on a template if the splat parameter templateId is passed
/// On success should return status code 201 to notify the client the account creation has been successful
/// On error should return status code 500 and the error message
/// /api/profiles/:userId/lists/[:templateId]
function handleCreateShoppingListRequest(req, res) {
	var createdBy = req.params.userId || null;
	var opts = {};
	var title;
	var shoppingListRepository = new ShoppingListRepository();
	if (req.params.templateId) {
		// It means we want to create a list from a template
		// Find the template list by id
		shoppingListRepository.findById(req.params.templateId)
		.then(
			function(template) {
				if (template) {
					// Ok template found. Am I authorised to use this template?
					// How can I see if I'm authorised? I can read the template createdBy filed and if it matches the userId
					// splat parameter, then I'm authorised
					if (template.createdBy != createdBy) {
						logger.log('info', 'User Id ' + createdBy + ' tried to create a new list using template id ' +
							req.params.templateId + ' but user was not authorised to use it. Request from address ' +
							req.connection.remoteAddress);
						res.json(401);
					}
					title = template.title;
					opts = {
						isShared: template.isShared,
						invitees: template.invitees,
						shoppingItems: template.shoppingItems
					};
					shoppingListRepository.createShoppingList(createdBy, title, opts)
						.then(function(shoppingList) {
							if (shoppingList) {
								logger.log('info', 'User Id ' + createdBy + ' has just created a ' +
									'new shopping list from template with id ' + req.params.id + ' . Request from address ' +
									req.connection.remoteAddress + '.');
								res.json(201, shoppingList);
							}
							else {
								// No user could be found. Return 404
								logger.log('info', 'User id ' + createdBy + ' could not be found.' +
									' Remote address: ' + req.connection.remoteAddress);
								res.json(404, {
									error: "User not found"
								});
							}
						});
				}
				else {
					// No template could be found. Return 404
					logger.log('info', 'User id ' + createdBy + ' tried to create a new ' +
						'shopping list from template with id ' + req.params.id + ' but no such id could be found.' +
						' Remote address: ' + req.connection.remoteAddress);
					res.json(404, {
						error: "Template not found"
					});
				}
			})
			.fail(function (err) {
				logger.log('error', 'An error has occurred while processing a request to create a ' +
					'shopping list from ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
				res.json(400, {
					error: err.message
				});
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
		shoppingListRepository.createShoppingList(createdBy, title, opts)
		.then(
				function (shoppingList) {
					if (shoppingList) {
						logger.log('info', 'User Id ' + createdBy + ' has just created a ' +
							'new empty shopping list. Request from address ' + req.connection.remoteAddress + '.');
						res.json(201, shoppingList);
					}
					else {
						// No user could be found. Return 404
						logger.log('info', 'User id ' + createdBy + ' could not be found.' +
							' Remote address: ' + req.connection.remoteAddress);
						res.json(404, {
							error: "User not found"
						});
					}
				}
			)
			.fail(function (err) {
				logger.log('error', 'An error has occurred while processing a request to create a ' +
					'shopping list from ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
				res.json(400, {
					error: err.message
				});
			});
	}	
}

/// Retrieve the list of shopping lists (not templates) saved, created by the user, or shared with him.
/// If isTemplate is true, then retrieves the list of templates created by this user
/// Url: /api/profiles/:userId/lists
/// Query parameters: isTemplate (1/0)
function handleGetShoppingListsRequest(req, res) {
	var userId = req.params.userId || null;
	var query = req.query;
	// If we have a query, it means we want to retrieve templates
	if (query && query.isTemplate) {
		handleGetTemplateListsForUserRequest(req, res, userId);
	}
	else {
		handleGetListsForUserRequest(req, res, userId);
	}
}

/// Retrieve a shopping list (also a template) for a certain user
/// Url: /api/profiles/:userId/lists/:shoppingListId
/// TODO: Check if the user has this shopping list id in the shoppingLists array
function handleGetShoppingListRequest(req, res) {
	var userId = req.params.userId || null;
	var shoppingListId = req.params.shoppingListId || null;
	var accountRepository = new AccountRepository();
	var shoppingListRepository = new ShoppingListRepository();
	if (userId && shoppingListId) {
		Q.all([accountRepository.findById(userId), shoppingListRepository.findById(shoppingListId)])
			.then(function(promises){
				var account = promises[0];
				var shoppingList = promises[1];
				if (account && shoppingList) {
					// 3) Ask the security if the user can retrieve the list
					if (security.userCanFetchShoppingList(account, shoppingList)) {
						logger.log('info', 'User ' + userId + ' retrieved shopping list ' + shoppingListId + '. ' +
							'Request from address ' + req.connection.remoteAddress + '.');
						res.json(200, shoppingList);
					}
					else {
						logger.log('info', 'Could not retrieve shopping list ' + shoppingListId +
							', user ' + userId + ' is not authorised. Request from address ' + req.connection.remoteAddress + '.');
						res.json(401, {
							error: "User is not authorised"
						});
					}
				}
				else {
					// return 404
					logger.log('info', 'Could not retrieve shopping list ' + shoppingListId +
						' for user ' + userId + '. User and/or shopping list non existent . Request from address ' + req.connection.remoteAddress + '.');
					res.json(404, {
						error: "User and/or shopping list non existent"
					});
				}
				return;
			})
			.fail(function(err) {
				res.json(500, {
					error: err.message
				});
				logger.log('error', 'An error has occurred while processing a request ' +
					' to retrieve shopping list with id ' + shoppingListId + ' for user ' + userId + ' from ' +
					req.connection.remoteAddress + '. Stack trace: ' + err.stack);
			});
	}
	else {
		// 400 BAD REQUEST
		logger.log('info', 'Bad request from ' +
			req.connection.remoteAddress + '.');
		res.json(400);
	}
}

/// Update a shopping list only if the user is authorised (is the creator of this list and the list is not deleted
/// Url: /api/profiles/:userId/lists/:shoppingListId
function handleUpdateShoppingListRequest(req, res) {
	// Retrieve the shopping list id from the request
	var id = req.params.shoppingListId || null;
	var userId = req.params.userId || null;
	var parameters = req.body || null;
	var accountRepository = new AccountRepository();
	var shoppingListRepository = new ShoppingListRepository();
	if (userId && id) {
		// 1) Retrieve the account
		// 2) Retrieve the shopping list
		Q.all([accountRepository.findById(userId), shoppingListRepository.findById(id)])
			.then(function(promises){
				var account = promises[0];
				var shoppingList = promises[1];
				if (account && shoppingList) {
					// 3) Ask the security if the user can update the list
					if (security.userCanUpdateOrDeleteShoppingList(account, shoppingList)) {
						// 4) If yes, update it
						shoppingListRepository.updateShoppingList(id, parameters)
							.then(function(shoppingList) {
								logger.log('info', 'Shopping list ' + id + ' has been updated.' +
									'Request from address ' + req.connection.remoteAddress + '.');
								res.json(200, shoppingList);
							}, function(err) {
								if (err.isBadRequest) {
									logger.log('info', 'Bad request from ' +
										req.connection.remoteAddress + '. Message: ' + err.message);
									res.json(400, {
										error: err.message
									});
								}
								else {
									logger.log('error', 'An error has occurred while processing a request ' +
										' to update shopping list with id ' + id + ' from ' +
										req.connection.remoteAddress + '. Stack trace: ' + err.stack);
									res.json(500, {
										error: err.message
									});
								}
							});
					} // 5) Else return Unauthorised
					else {
						logger.log('info', 'Could not update shopping list ' + id +
							', user ' + userId + ' is not authorised. Request from address ' + req.connection.remoteAddress + '.');
						res.json(401, {
							error: "User is not authorised"
						});
					}
				}
				else {
					// return 404
					logger.log('info', 'Could not update shopping list ' + id +
						' for user ' + userId + '. User and/or shopping list non existent . Request from address ' + req.connection.remoteAddress + '.');
					res.json(404, {
						error: "User and/or shopping list non existent"
					});
				}
			})
			.fail(function(err) {
				if (err.isBadRequest) {
					logger.log('info', 'Bad request from ' +
						req.connection.remoteAddress + '. Message: ' + err.message);
					res.json(400, {
						error: err.message
					});
				}
				else {
					logger.log('error', 'An error has occurred while processing a request ' +
						' to update shopping list with id ' + id + ' from ' +
						req.connection.remoteAddress + '. Stack trace: ' + err.stack);
					res.json(500, {
						error: err.message
					});
				}
			});
	}
	else {
		// return bad request
		logger.log('info', 'Bad request from ' +
			req.connection.remoteAddress + '. Missing user id or shopping list id.');
		res.json(400, {
			error: 'Missing user id or shopping list id'
		});
	}
}

/// TODO: Check if the user has this shopping list id in the shoppingLists array and if the user is the creator of this list.
/// If yes, then remove the id from the list using the accountRepository
function handleDeleteShoppingListRequest(req, res) {
	var listId = req.params.id || null;
	var shoppingListRepository = new ShoppingListRepository();
	shoppingListRepository.deleteShoppingList(listId)
	.then(function(shoppingList) {
			if (shoppingList) {
				logger.log('info', 'Shopping list ' + listId + ' has been deleted.' +
					'Request from address ' + req.connection.remoteAddress + '.');
				// No need to return anything. We just deleted the list
				res.json(204, null);
			}
			else {
				logger.log('info', 'Could not delete shopping list ' + listId + ', no ' +
					'such id exists. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, {
					error: "No shopping list found matching " + listId
				});
			}
		},
	function (err) {
		logger.log('error', 'An error has occurred while deleting shopping list ' + listId +
			' from ' + req.connection.remoteAddress +
			'. Stack trace: ' + err.stack);
		res.json(500, {
			error: err.message
		});
	});
}

// Returns 404 both for a not existing user and for an empty result set
function handleGetTemplateListsForUserRequest(req, res, userId) {
	var shoppingListRepository = new ShoppingListRepository();
	shoppingListRepository.findTemplatesListsForUser(userId)
	.then(
		function(templates) {
			if (templates && templates.length > 0) {
				logger.log('info', 'Successfully retrieved templates for user ' + userId +
					'. Request from address ' + req.connection.remoteAddress + '.');
				res.json(200, templates);
			}
			else {
				logger.log('info', 'No template list for user ' + userId +
					'. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, templates);
			}
		},
		function(err) {
			logger.log('error', 'An error has occurred while processing a request to ' +
				'retrieve template lists for user ' + userId + ' from ' + req.connection.remoteAddress +
				'. Stack trace: ' + err.stack);
			res.json(500, {
				error: err.message
			});
		}
	);
}

// Returns 404 for a not existing user and for an empty result set
function handleGetListsForUserRequest(req, res, userId) {
	var accountRepository = new AccountRepository();
	var shoppingListRepository = new ShoppingListRepository();
	accountRepository.findById(userId)
	.then(function(account) {
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
				return shoppingListRepository.find(query);
			}
		})
	.then(function(lists) {
			if (lists && lists.length > 0) {
				logger.log('info', 'Successfully retrieved shopping lists for user ' + userId +
					'. Request from address ' + req.connection.remoteAddress + '.');
				res.send(200, lists);
			}
			else {
				logger.log('info', 'No shopping list for user ' + userId +
					'. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, null);
			}
		})
	.fail(function(err) { //catches all errors
			logger.log('error', 'An error has occurred while processing a request to ' +
				'retrieve shopping lists for user ' + userId + ' from ' + req.connection.remoteAddress +
				'. Stack trace: ' + err.stack);
			res.json(500, {
				error: err.message
			});
		});
}

module.exports = ShoppingListHandler;
