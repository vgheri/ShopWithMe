/***
 * Author: Valerio Gheri
 * Date: 28/03/2013
 * Shopping list repository, contains functions to query and modify the  
 * shoppinglists collection
 */

var ShoppingList = require('../models/ShoppingList');
var accountRepository = require('../repositories/AccountRepository');

function findTemplatesForUser(userId, callback) {
	// userId must be the creator
	// the list must be marked as a template
	// The list must be active
	var query = { createdBy: userId, isTemplate: true, isActive: true };
	ShoppingList.find(query, function(err, templates) {
		callback(err, templates);
	});
}

function create(creatorId, title, opts, callback) {
	var shoppingList = new ShoppingList({
		createdBy: creatorId,
		title: title,
		isShared: opts.isShared,
		invitees: opts.invitees,
		shoppingItems: opts.shoppingItems
	});
	accountRepository.findById(creatorId, function(err, profile) {
		if (err) {
			callback(err, null);
		}
		else {
			if (profile) {
				shoppingList.save(function(err, savedShoppingList) {		
					if (err) {
						return callback(err, null);
					}
					// Let's add this new shopping list to the list contained in the profile
					profile.shoppingLists.addToSet(savedShoppingList._id);
					profile.save(function(err, profile) {
						return callback(err, savedShoppingList);
					});
				});
			}
			else {
				return callback(null, null); //means 404
			}
		}
	});
}

function update(id, parameters, callback) {	
	var query = {
		_id: id
	};
	var options = {
		new: true
	};
	var updateObj = {};
	// Setup field to update
	if (parameters.isTemplate) {
		updateObj.isTemplate = parameters.isTemplate;
	}
	if (parameters.title) {
		updateObj.title = parameters.title;
	}
	if (parameters.isShared) {
		updateObj.isShared = parameters.isShared;
	}
	if (parameters.invitees) {
		updateObj.invitees = parameters.invitees;
	}
	
	updateObj.lastUpdate = new Date();
	
	for (var key in parameters) {
		if (key !== 'isTemplate' && key !== 'title' && key !== 'isShared' && key !== 'invitees') {
			// Unexpected parameters, raise error
			var err = new Error('Unexpected parameter: ' + key);
			return callback(err, null);
		}
	}
	ShoppingList.findOneAndUpdate(query, updateObj, options, callback);
}

function remove(id, callback) {
	ShoppingList.findById(id, function(err, shoppingList) {
		if (err) {
			callback(err, null);
		}
		else {
			if (shoppingList) {
				shoppingList.remove(callback(null, shoppingList));
			}
			else {
				callback(null, null);
			}
		}
	});
}

exports.create = create;
exports.findTemplatesForUser = findTemplatesForUser;
exports.update = update;
exports.remove = remove;

