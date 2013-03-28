/***
 * Author: Valerio Gheri
 * Date: 28/03/2013
 * Account repository, contains functions to query and modify the accounts 
 * collection
 */
 
var Account = require('../models/Account');

function create(username, password, firstName, lastName, callback) {
	var account = new Account({
		username: username,
		password: password || '',
		firstName: firstName,
		lastName: lastName
	});

	account.save(function(err, account) {
		return callback(err, account);
	});
}

function findByUsername(username, callback) {
	Account.findOne({
		username: username
	}, function(err, account) {
		return callback(err, account);
	});
}

function findById(id, callback) {
	Account.findById(id, callback);
}

function updateOld(account, callback) {
	var query = {
		username: account.username
	};
	var options = {
		new: true
	};
	Account.findOneAndUpdate(query, {
		firstName: account.firstName,
		lastName: account.lastName
	}, options, callback);
}

function update(id, opts, callback) {
	var query = {
		_id: id
	};
	var options = {
		// Return the updated object
		new: true
	};
	Account.findOneAndUpdate(query, opts, options, callback);
}

function disable(id, callback) {
	var query = {
		_id: id
	};
	var options = {
		new: true
	};
	Account.findOneAndUpdate(query, {
		isActive: false,
		canLogin: false
	}, options, callback);
}

exports.create = create;
exports.findByUsername = findByUsername;
exports.findById = findById;
exports.update = update;
exports.disable = disable;

