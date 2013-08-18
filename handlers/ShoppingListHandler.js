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
	this.addShoppingItem = handleAddItemRequest;
	this.updateShoppingItem = handleUpdateItemRequest;
	this.deleteShoppingItem = handleDeleteItemRequest;
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

/// Deletes a shopping list only if the user is authorised
/// If yes, then remove the id from the list using the accountRepository
/// Url: /api/profiles/:userId/lists/:shoppingListId
function handleDeleteShoppingListRequest(req, res) {
	var userId = req.params.userId || null;
	var shoppingListId = req.params.shoppingListId || null;
	var accountRepository = new AccountRepository();
	var shoppingListRepository = new ShoppingListRepository();
	if (userId && shoppingListId) {
		// 1) Retrieve the account
		// 2) Retrieve the shopping list
		Q.all([accountRepository.findById(userId), shoppingListRepository.findById(shoppingListId)])
			.then(function(promises) {
				var account = promises[0];
				var shoppingList = promises[1];
				if (account && shoppingList) {
					// 3) Ask the security if the user can delete the list
					if (security.userCanUpdateOrDeleteShoppingList(account, shoppingList)) {
						shoppingListRepository.deleteShoppingList(account, shoppingList)
							.then(function(deletedList) {
								logger.log('info', 'Shopping list ' + shoppingListId + ' has been deleted by user ' + userId +
									'. Request from address ' + req.connection.remoteAddress + '.');
								// No need to return anything. We just deleted the list
								res.json(204, null);
							});
					}
					else {
						logger.log('info', 'Could not delete shopping list ' + shoppingListId +
							', user ' + userId + ' is not authorised. Request from address ' + req.connection.remoteAddress + '.');
						res.json(401, {
							error: "User is not authorised"
						});
					}
				}
				else {
					// return 404
					logger.log('info', 'Could not update shopping list ' + shoppingListId +
						' for user ' + userId + '. User and/or shopping list non existent . Request from address ' + req.connection.remoteAddress + '.');
					res.json(404, {
						error: "User and/or shopping list non existent"
					});
				}
			})
			.fail(function(err) {
				logger.log('error', 'An error has occurred while processing a request ' +
					' to delete shopping list with id ' + shoppingListId + ' for user ' + userId + ' from ' +
					req.connection.remoteAddress + '. Stack trace: ' + err.stack);
				res.json(500, {
					error: err.message
				});
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

/// Add a new shopping item to the desired list for the requesting user
/// Url: POST /api/profiles/:userId/lists/:shoppingListId/item/
function handleAddItemRequest(req, res) {
	var userId = req.params.userId || null;
	var shoppingListId = req.params.shoppingListId || null;
	var name = req.body.name || null;
	var quantity = req.body.quantity || null;
	var comment = req.body.comment || null;
	var accountRepository = new AccountRepository();
	var shoppingListRepository = new ShoppingListRepository();
	if (userId && shoppingListId) {
		// 1) Retrieve the account
		// 2) Retrieve the shopping list
		Q.all([accountRepository.findById(userId), shoppingListRepository.findById(shoppingListId)])
			.then(function(promises){
				var account = promises[0];
				var shoppingList = promises[1];
				if (account && shoppingList) {
					// 3) Ask the security if the user can add the item to the list
					if (security.userCanUpdateOrDeleteShoppingList(account, shoppingList)) {
						// 4) If yes, let's check if we can add the item
						if (shoppingList.canAddItem && shoppingList.canAddItem(name)) {
							shoppingListRepository.addItemToShoppingList(shoppingList, name, quantity, comment)
								.then(function(savedShoppingList) {
									logger.log('info', 'Item ' + name + ' has been added to shopping list ' + shoppingListId + ' by ' +
										'user id ' + userId + ' .Request from address ' + req.connection.remoteAddress + '.');
									res.json(201, savedShoppingList);
								}, function(err) {
									logger.log('error', 'An error has occurred while processing a request ' +
										' to update shopping list with id ' + shoppingListId + ' from ' +
										req.connection.remoteAddress + '. Stack trace: ' + err.stack);
									res.json(500, {
										error: err.message
									});
								});
						}
						else {
							//400 Bad request: same item added twice
							logger.log('info', 'Could not add item ' + name + ' to shopping list ' + shoppingListId +
								' for user ' + userId + '. Item already in the shopping list. Request from address ' + req.connection.remoteAddress + '.');
							res.json(400, {
								error: "Item already in the shopping list"
							});
						}
					}
					else { // Unauthorised
						logger.log('info', 'Could not add item to shopping list ' + shoppingListId +
							': user ' + userId + ' is not authorised. Request from address ' + req.connection.remoteAddress + '.');
						res.json(401, {
							error: "User is not authorised"
						});
					}
				}
				else {
					// return 404
					logger.log('info', 'Could not add item ' + name + ' to shopping list ' + shoppingListId +
						' for user ' + userId + '. User and/or shopping list non existent . Request from address ' + req.connection.remoteAddress + '.');
					res.json(404, {
						error: "User and/or shopping list non existent"
					});
				}
			});
	}
	else {
		logger.log('info', 'Bad request from ' +
			req.connection.remoteAddress + '. Message: UserId and shoppingListId are required.');
		res.json(400, {
			error: 'UserId and shoppingListId are required.'
		});
	}
}

/// Updates an existing shopping item into the desired list for the requesting user
/// Url: PUT /api/profiles/:userId/lists/:shoppingListId/item/:itemId
function handleUpdateItemRequest(req, res) {
	var userId = req.params.userId || null;
	var shoppingListId = req.params.shoppingListId || null;
	var itemId = req.params.itemId || null;
	var name = req.body.name || null;
	var quantity = req.body.quantity || null;
	var comment = req.body.comment || null;
	if (userId && shoppingListId && itemId) {
		var accountRepository = new AccountRepository();
		var shoppingListRepository = new ShoppingListRepository();
		// Verify if the user has the right to access to this shopping list
		// 1) Retrieve the account
		// 2) Retrieve the shopping list
		Q.all([accountRepository.findById(userId), shoppingListRepository.findById(shoppingListId)])
			.then(function(promises){
				var account = promises[0];
				var shoppingList = promises[1];
				if (account && shoppingList) {
					// 3) Ask the security if the user can update this list
					if (security.userCanUpdateOrDeleteShoppingList(account, shoppingList)) {
						// 4) If yes, let's check if we can add the item
						if (shoppingList.canAddItem && shoppingList.canAddItem(name)) {
							// retrieve the item  update it and save it
							var itemToUpdate = shoppingList.shoppingItems.id(itemId);
							if (itemToUpdate) {
								shoppingListRepository.updateShoppingListItem(shoppingList, itemToUpdate, name, quantity, comment)
									.then(function(savedShoppingList) {
										logger.log('info', 'Item ' + itemId + ' has been updated in shopping list ' + shoppingListId + ' by ' +
											'user id ' + userId + ' .Request from address ' + req.connection.remoteAddress + '.');
										res.json(201, savedShoppingList);
									}, function(err) {
										logger.log('error', 'An error has occurred while processing a request ' +
											' to update shopping list with id ' + shoppingListId + ' from ' +
											req.connection.remoteAddress + '. Stack trace: ' + err.stack);
										res.json(500, {
											error: err.message
										});
									});
							}
							else {
								// return 404
								logger.log('info', 'Could not update item ' + itemId + ' for shopping list ' + shoppingListId +
									' for user ' + userId + '. Item id non existent. Request from address ' + req.connection.remoteAddress + '.');
								res.json(404, {
									error: "Item non existent"
								});
							}
						}
						else {
							//400 Bad request: same item added twice
							logger.log('info', 'Could not update item ' + name + ' for shopping list ' + shoppingListId +
								' for user ' + userId + '. An item with the same name is already in the shopping list. Request from ' +
								'address ' + req.connection.remoteAddress + '.');
							res.json(400, {
								error: "Item already in the shopping list"
							});
						}
					}
					else {
						// Unauthorised
						logger.log('info', 'Could not update item ' + itemId + ' for shopping list ' + shoppingListId +
							': user ' + userId + ' is not authorised. Request from address ' + req.connection.remoteAddress + '.');
						res.json(401, {
							error: "User is not authorised"
						});
					}
				}
				else {
					// 404
					logger.log('info', 'Could not update item ' + itemId + ' for shopping list ' + shoppingListId +
						' for user ' + userId + '. User and/or shopping list non existent . Request from address ' + req.connection.remoteAddress + '.');
					res.json(404, {
						error: "User and/or shopping list non existent"
					});
				}
		});
	}
	else {
		// Bad request, userId, shoppingListId and ItemId are required
		logger.log('info', 'Bad request from ' +
			req.connection.remoteAddress + '. Message: user id, shopping list id and item id are required.');
		res.json(400, {
			error: 'UserId and shoppingListId are required.'
		});
	}
}

/// Deletes an existing shopping item from the desired list for the requesting user
/// Url: DELETE /api/profiles/:userId/lists/:shoppingListId/item/:itemId
function handleDeleteItemRequest(req, res) {
	var userId = req.params.userId || null;
	var shoppingListId = req.params.shoppingListId || null;
	var itemId = req.params.itemId || null;
	if (userId && shoppingListId && itemId) {
		var accountRepository = new AccountRepository();
		var shoppingListRepository = new ShoppingListRepository();
		// Verify if the user has the right to access to this shopping list
		// 1) Retrieve the account
		// 2) Retrieve the shopping list
		Q.all([accountRepository.findById(userId), shoppingListRepository.findById(shoppingListId)])
			.then(function(promises){
				var account = promises[0];
				var shoppingList = promises[1];
				if (account && shoppingList) {
					// 3) Ask the security if the user can update this list
					if (security.userCanUpdateOrDeleteShoppingList(account, shoppingList)) {
						// retrieve the item  update it and save it
						var itemToUpdate = shoppingList.shoppingItems.id(itemId);
						if (itemToUpdate) {
							shoppingListRepository.deleteShoppingListItem(shoppingList, itemId)
								.then(function(savedShoppingList) {
									logger.log('info', 'Item ' + itemId + ' has been delete from shopping list ' + shoppingListId + ' by ' +
										'user id ' + userId + ' .Request from address ' + req.connection.remoteAddress + '.');
									res.json(204, savedShoppingList);
								}, function(err) {
									logger.log('error', 'An error has occurred while processing a request ' +
										' to delete item id ' + itemId + ' from shopping list with id ' + shoppingListId + ' from ' +
										req.connection.remoteAddress + '. Stack trace: ' + err.stack);
									res.json(500, {
										error: err.message
									});
								});
						}
						else {
							// return 404
							logger.log('info', 'Could not delete item ' + itemId + ' for shopping list ' + shoppingListId +
								' for user ' + userId + '. Item id non existent. Request from address ' + req.connection.remoteAddress + '.');
							res.json(404, {
								error: "Item non existent"
							});
						}

					}
					else {
						// Unauthorised
						logger.log('info', 'Could not delete item ' + itemId + ' for shopping list ' + shoppingListId +
							': user ' + userId + ' is not authorised. Request from address ' + req.connection.remoteAddress + '.');
						res.json(401, {
							error: "User is not authorised"
						});
					}
				}
				else {
					// 404
					logger.log('info', 'Could not delete item ' + itemId + ' for shopping list ' + shoppingListId +
						' for user ' + userId + '. User and/or shopping list non existent . Request from address ' + req.connection.remoteAddress + '.');
					res.json(404, {
						error: "User and/or shopping list non existent"
					});
				}
			});
	}
	else {
		// Bad request, userId, shoppingListId and ItemId are required
		logger.log('info', 'Bad request from ' +
			req.connection.remoteAddress + '. Message: user id, shopping list id and item id are required.');
		res.json(400, {
			error: 'UserId, shopping list id and item id are required.'
		});
	}
}

module.exports = ShoppingListHandler;
