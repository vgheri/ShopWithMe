/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 10/05/13
 * Time: 12.58
 * To change this template use File | Settings | File Templates.
 */

var Account = require('../models/Account');
var logger = require('../utils/logger.js');
var Q = require('q');

function AccountRepository() {
	this.findById = findAccountById;
	this.addShoppingListToUser = addShoppingListToUser;
}

function findAccountById(id) {
	var deferred = Q.defer();
	var query = {
		_id: id
	};
	Account.findOne(query, function(err, profile) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(profile);
		}
	});
	return deferred.promise;
}


function addShoppingListToUser(profile, listId) {
	var deferred = Q.defer();
	// Let's add this new shopping list to the list contained in the profile
	profile.shoppingLists.addToSet(listId);
	profile.save(function(err, profile) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(profile);
		}
	});
	return deferred.promise;
}

module.exports = AccountRepository;
