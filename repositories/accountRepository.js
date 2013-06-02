/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 10/05/13
 * Time: 12.58
 * To change this template use File | Settings | File Templates.
 */

var Account = require('../models/Account');
var logger = require('../utils/logger');
var Q = require('q');

function AccountRepository() {
	this.findById = findAccountById;
	this.addShoppingListToUser = addShoppingListToUser;
	this.removeShoppingListFromUser = removeShoppingListFromUser;
	this.createAccount = createAccount;
	this.findAccountByUsername = findAccountByUsername;
	this.updateAccount = updateAccount;
	this.disableAccount = disableAccount;
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

function removeShoppingListFromUser(profile, listId) {
	var deferred = Q.defer();
	if (profile.shoppingLists && profile.shoppingLists.length > 0) {
		if (profile.shoppingLists.indexOf(listId) > -1) {
			profile.shoppingLists.pull(listId);
			profile.save(function(err, profile) {
				if (err) {
					deferred.reject(new Error(err));
				}
				else {
					deferred.resolve(profile);
				}
			});
		}
		else {
			deferred.reject(new Error('No such id'));
		}
	}
	else {
		deferred.reject(new Error('Shopping list is empty for this user'));
	}
	return deferred.promise;
}

function createAccount(username, password, firstName, lastName) {
	var deferred = Q.defer();
	var account = new Account({
		username: username,
		password: password,
		firstName: firstName,
		lastName: lastName
	});

	account.save(function(err, account) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(account);
		}
	});
	return deferred.promise;
}

function findAccountByUsername(username) {
	var deferred = Q.defer();
	Account.findOne({
		username: username
	}, function(err, foundUsername) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(foundUsername);
		}
	});
	return deferred.promise;
}

function updateAccount(account) {
	var deferred = Q.defer();
	var query = {
		username: account.username
	};
	var options = {
		'new': true
	};
	Account.findOneAndUpdate(query,
		{
			firstName: account.firstName,
			lastName: account.lastName
		},
		options,
		function(err, account) {
			if (err) {
				deferred.reject(new Error(err));
			}
			else {
				deferred.resolve(account);
			}
		}
	);
	return deferred.promise;
}

function disableAccount(username) {
	var deferred = Q.defer();
	var query = {
		username: username
	};
	var options = {
		'new': true
	};
	Account.findOneAndUpdate(query,
		{
			isActive: false,
			canLogin: false
		},
		options,
		function(err, account) {
			if (err) {
				deferred.reject(new Error(err));
			}
			else {
				deferred.resolve(account);
			}
		}
	);
	return deferred.promise;
}

module.exports = AccountRepository;
