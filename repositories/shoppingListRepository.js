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
	this.createShoppingList = createShoppingList;
}

function findShoppingListById(id) {
	var deferred = Q.defer();
	ShoppingList.findOne({ _id: id }, function(err, template) {
		if (err) {
			deferred.reject(new Error(err));
		}
		else {
			deferred.resolve(template);
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

module.exports = ShoppingListRepository;
