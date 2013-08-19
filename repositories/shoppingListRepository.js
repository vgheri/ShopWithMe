/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 10/05/13
 * Time: 12.12
 * To change this template use File | Settings | File Templates.
 */

var ShoppingList = require('../models/ShoppingList');
var AccountRepository = require('../repositories/accountRepository');
var logger = require('../utils/logger');
var Q = require('q');

function ShoppingListRepository() {
	this.findById = findShoppingListById;
	this.find = findByCriteria;
	this.createShoppingList = createShoppingList;
	this.findTemplatesListsForUser = findTemplatesListsForUser;
	this.updateShoppingList = updateShoppingList;
	this.deleteShoppingList = deleteShoppingList;
	this.addItemToShoppingList = addItem;
	this.updateShoppingListItem = updateItem;
	this.deleteShoppingListItem = deleteItem;
	this.crossoutShoppingListItem = crossoutItem;
}

function findShoppingListById(id) {
	var deferred = Q.defer();
	ShoppingList.findOne({ _id: id }, function(err, template) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			if (template && template.isActive) {
				deferred.resolve(template);
			}
			else {
				deferred.resolve(null);
			}
		}
	});
	return deferred.promise;
}

function findByCriteria(criteria) {
	var deferred = Q.defer();
	ShoppingList.find(criteria, function(err, lists) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(lists);
		}
	});
	return deferred.promise;
}

function createShoppingList(creatorId, title, opts) {
	var deferred = Q.defer();
	var shoppingList = new ShoppingList({
		createdBy: creatorId,
		title: title,
		isShared: opts.isShared,
		invitees: opts.invitees,
		shoppingItems: opts.shoppingItems
	});
	var accountRepository = new AccountRepository();
	accountRepository.findById(creatorId)
	.then(
		function(profile) {
			if (profile) {
				shoppingList.save(function(err, savedShoppingList) {
					if (err) {
						deferred.reject(new Error(err));
					}
					else {
						var id = savedShoppingList._id;
						return accountRepository.addShoppingListToUser(profile, id)
						.then(function(profile) {
							deferred.resolve(savedShoppingList);
						});
					}
				});
			}
			else {
				deferred.resolve(null);
			}
		});
	return deferred.promise;
}

function findTemplatesListsForUser(userId) {
	var deferred = Q.defer();
	// userId must be the creator
	// the list must be marked as a template
	// The list must be active
	var query = { createdBy: userId, isTemplate: true, isActive: true };
	ShoppingList.find(query, function(err, templates) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(templates);
		}
	});
	return deferred.promise;
}

function updateShoppingList(id, parameters) {
	var deferred = Q.defer();

	// Check for unknown parameters
	for (var key in parameters) {
		if (key !== 'isTemplate' && key !== 'title' && key !== 'isShared' && key !== 'invitees') {
			// Unexpected parameters, raise error
			var err = {
				message: 'Unexpected parameter: ' + key,
				isBadRequest: true
			};
			deferred.reject(err);
		}
	}

	var query = {
		_id: id
	};
	var options = {
		'new': true
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

	ShoppingList.findOneAndUpdate(query, update, options, function(err, shoppingList) {
		if (err) {
			deferred.reject(err);
		}
		else {
			deferred.resolve(shoppingList);
		}
	});
	return deferred.promise;
}

//make it invoke the AccountRepository method that removes the list id from the collection of shopping lists of the user
//and mark the deleted shopping list as active = false
function deleteShoppingList(account, shoppingList) {
	var deferred = Q.defer();
	// 1) Mark the list as active = false
	shoppingList.isActive = false;
	shoppingList.lastUpdate = Date.now();
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			// 2) Remove the id of the list from the collection of shopping lists of the user
			account.shoppingLists.pull(savedShoppingList._id);
			account.save(function(err, savedAccount) {
				if (err) {
					deferred.reject(new Error(err));
				}
				else {
					deferred.resolve(savedShoppingList);
				}
			});
		}
	});
	return deferred.promise;
}

function addItem(shoppingList, name, quantity, comment) {
	var deferred = Q.defer();
	var item = {
		name: name,
		quantity: quantity,
		comment: comment,
		isInTheCart: false
	};
	shoppingList.shoppingItems.push(item);
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(savedShoppingList);
		}
	});
	return deferred.promise;
}

function updateItem(shoppingList, item, name, quantity, comment) {
	var deferred = Q.defer();
	item.name = name;
	item.quantity = quantity;
	item.comment = comment;
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(savedShoppingList);
		}
	});
	return deferred.promise;
}

function deleteItem(shoppingList, itemId) {
	var deferred = Q.defer();
	shoppingList.shoppingItems.id(itemId).remove(); // remove the item
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(savedShoppingList);
		}
	});
	return deferred.promise;
}

function crossoutItem(shoppingList, itemId) {
	var deferred = Q.defer();
	var item = shoppingList.shoppingItems.id(itemId);
	item.isInTheCart = true;
	shoppingList.save(function(err, savedShoppingList) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(savedShoppingList);
		}
	});
	return deferred.promise;
}

module.exports = ShoppingListRepository;
