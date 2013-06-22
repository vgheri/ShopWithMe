/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 22/06/13
 * Time: 15.14
 * To change this template use File | Settings | File Templates.
 */

var logger = require('utils/logger');
var Q = require('q');

// A user can fetch a shopping list only if the list id is contained in the array "Account.shoppingLists"
// and the list is active (both condition should always be true or false together)
function userCanFetchShoppingList(account, shoppingList) {
	var userHasRight = false;
	if (account.shoppingLists.indexOf(shoppingList._id) > -1 && shoppingList.isActive) {
		userHasRight = true;
	}
	else {
		userHasRight = false;
	}
	return userHasRight;
}

// A user can fetch a shopping list only if the list id is contained in the array "Account.shoppingLists"
// and the list is active
function userCanUpdateOrDeleteShoppingList(account, shoppingList) {
	var userHasRight = false;
	if (account._id.equals(shoppingList.createdBy) && account.shoppingLists.indexOf(shoppingList._id) > -1 &&
		shoppingList.isActive) {
		userHasRight = true;
	}
	else {
		userHasRight = false;
	}
	return userHasRight;
}

exports.userCanFetchShoppingList = userCanFetchShoppingList;
exports.userCanUpdateOrDeleteShoppingList = userCanUpdateOrDeleteShoppingList;