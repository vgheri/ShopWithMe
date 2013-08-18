/***
 * Author: Valerio Gheri
 * Date: 15/03/2013
 * This class contains all the methods to handle Account related requests
 */

var Account = require('../models/Account');
var AccountRepository = require('../repositories/accountRepository');
var logger = require('../utils/logger');
var winston = require('winston');

var AccountHandler = function() {
	this.createAccount = handleCreateAccountRequest;
	this.getAccount = handleGetAccountRequest;
	this.updateAccount = handleUpdateAccountRequest;
	this.deleteAccount = handleDeleteAccountRequest;
};

// On success should return status code 201 to notify the client the account
// creation has been successful
// On error should return status code 400 and the error message
function handleCreateAccountRequest(req, res) {
	var username = req.body.username || null;
	var password = req.body.password || null;
	var firstName = req.body.firstName || null;
	var lastName = req.body.lastName || null;
	var accountRepository = new AccountRepository();
	accountRepository.createAccount(username, password, firstName, lastName)
	.then(
		function (account) {
			logger.log('info', 'Account ' + username + ' has been created.' +
				'Request from address ' + req.connection.remoteAddress + '.');
			res.json(201, account);
		},
		function (err) {
			logger.log('error', 'An error has occurred while processing a request to create an ' +
				'account from ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
			res.json(400, {
				error: err.message
			});
		}
	);
}

/* TODO: I should update this function to check the identity of the origin.
  We don't want anyone being able to peek into the username collection */
function handleGetAccountRequest(req, res) {
	var username = req.params.username || null;
	var accountRepository = new AccountRepository();
	accountRepository.findAccountByUsername(username)
	.then(
		function(account) {
			if (account && account.isActive === true) {
				logger.log('info', 'Account ' + username + ' has been retrieved.' +
					'Request from address ' + req.connection.remoteAddress + '.');
				res.json(200, account);
			}
			else {
				logger.log('info', 'Could not retrieve account ' + username + ', no ' +
					'such username. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, {
					error: "No account found matching " + username
				});
			}
		},
		function(err) {
			logger.log('error', 'An error has occurred while processing a request to retrieve ' +
				'account ' + username + ' from ' + req.connection.remoteAddress +
				'. Stack trace: ' + err.stack);
			res.json(500, {
				error: err.message
			});
		}
	);
}

function handleUpdateAccountRequest(req, res) {
	// Retrieve the username from the request
	var username = req.params.username || null;
	var updatedAccount = req.body || null;
	updatedAccount.username = username;
	var accountRepository = new AccountRepository();
	accountRepository.updateAccount(updatedAccount)
	.then(
		function (account) {
			if (account) {
				logger.log('info', 'Account ' + username + ' has been updated.' +
					'Request from address ' + req.connection.remoteAddress + '.');
				res.json(200, account);
			}
			else {
				logger.log('info', 'Could not update account ' + username + ', no ' +
					'such username found. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, {
					error: "No account found matching " + username
				});
			}
		},
		function (err) {
			logger.log('error', 'An error has occurred while processing a request to update ' +
				'account ' + username + ' from ' + req.connection.remoteAddress +
				'. Stack trace: ' + err.stack);
			res.json(400, {
				error: err.message
			});
		}
	);
}

function handleDeleteAccountRequest(req, res) {
	var username = req.params.username || null;
	var accountRepository = new AccountRepository();
	accountRepository.disableAccount(username)
	.then(
		function (account) {
			if (account) {
				logger.log('info', 'Account ' + username + ' has been disabled.' +
					'Request from address ' + req.connection.remoteAddress + '.');
				// No need to return anything. We just disabled the account
				res.json(204, null);
			}
			else {
				logger.log('info', 'Could not disable account ' + username + ', no ' +
					'such username. Request from address ' + req.connection.remoteAddress + '.');
				res.json(404, {
					error: "No account found matching " + username
				});
			}
		},
		function (err) {
			logger.log('error', 'An error has occurred while processing a request to disable ' +
				'account ' + username + ' from ' + req.connection.remoteAddress +
				'. Stack trace: ' + err.stack);
			res.json(500, {
				error: err.message
			});
		}
	);
}

module.exports = AccountHandler;

