/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 26/08/13
 * Time: 13.42
 * To change this template use File | Settings | File Templates.
 */

var Account = require('../models/Account');
var AccountRepository = require('../repositories/accountRepository');
var ApiAccessToken = require('../infrastructure/apiAccessToken');
var SecurityToken = require('../infrastructure/securityToken');
var LoginViewModel = require('../viewModels/loginViewModel');
var logger = require('../utils/logger');
var Q = require('q');
var request = require('request');

var AuthenticationHandler = function() {
	this.facebookMobileLogin = handleFacebookMobileLoginRequest;
	this.logout = handleLogoutRequest;
};

// URL: /api/auth/facebook/mobile
// POST parameters:
// fbToken: facebook user access token
// appName: application name
// returns: a loginViewModel object if login successful
function handleFacebookMobileLoginRequest(req, res) {
	var facebookAccessToken = req.body.fbToken;
	var applicationName = req.body.appName;
	if (facebookAccessToken && facebookAccessToken.length > 0 && applicationName && applicationName.length > 0) {
		// Get back user object from Facebook
		verifyFacebookUserAccessToken(facebookAccessToken).
			then(function(user) {
				// Invoke wrapper function performLogin and return on deferred resolved
				performFacebookLogin(applicationName, user, facebookAccessToken).
					then(function(loginViewModel) {
						// Return the login view model to the client
						logger.log('info', 'User ' + loginViewModel.userId + ' successfully logged in using application' +
							' ' + applicationName + ' from: ' + req.connection.remoteAddress + '.');
						res.json(200, loginViewModel);
					});
			}, function(error) {
				logger.log('error', 'Login unsuccessful: ' + error.message +
					' . Request from address ' + req.connection.remoteAddress + ' .');
				res.json(401, {
					error: error.message
				});
			}
		).fail(function(error){
				logger.log('error', 'An error has occurred while attempting to login mobile user using Facebook OAuth' +
					' from address ' + req.connection.remoteAddress + '. Stack trace: ' + error.stack);
				res.json(500, {
					error: error.message
				});
		});
	}
	else {
		// 400 BAD REQUEST
		logger.log('error', 'Bad login request from ' +
			req.connection.remoteAddress + '. Reason: facebook access token and application name are required.');
		res.json(400);
	}
}

// URL: /api/auth/logout
// POST parameter:
// apiAccessToken: the token to access the API
// userId: Id of the user who is trying to log out
// Perform the logout operation, deleting the related security token so that it will be invalidated
// returns: 200 if logout successful
function handleLogoutRequest(req, res) {
	var apiAccessToken = req.body.apiAccessToken;
	var userId = req.body.userId;
	if (apiAccessToken) {
		SecurityToken.findSecurityToken(apiAccessToken)
			.then(function(securityToken) {
					SecurityToken.removeSecurityToken(apiAccessToken)
						.then(function(apiAccessToken) {
							// Log out successful
							logger.log('info', 'User ' + userId + ' successfully logged out. ' +
								' Address: ' + req.connection.remoteAddress + '.');
							res.json(200, "Ok");
						}, function(err) {
							logger.log('error', 'An error has occurred while attempting to log out user ' + userId +
								' from address ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
							res.json(500, {
								error: err.message
							});
						});
			}, function(err) {
				logger.log('error', 'An error has occurred while attempting to log out user ' + userId +
					' from address ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
				res.json(500, {
					error: err.message
				});
			});
	}
	else {
		// 400 BAD REQUEST
		logger.log('error', 'Bad log out request from ' +
			req.connection.remoteAddress + '. Reason: api access token required.');
		res.json(400);
	}
}

// Call facebook API to verify the token is valid
// https://graph.facebook.com/me?access_token=$token
// This function can be unit tested using https://developers.facebook.com/tools/explorer/?method=GET&path=me
// to obtain a user access token for my account
// Get facebook user id as well and save it into the db. Add a field into the Account model.
// Also try and get the expiration time of the token as well
// GET graph.facebook.com/debug_token?input_token={token-to-inspect}&access_token={app-token-or-admin-token}
function verifyFacebookUserAccessToken(token) {
	var deferred = Q.defer();
	var path = 'https://graph.facebook.com/me?access_token=' + token;
	request(path, function (error, response, body) {
		/* blob example
		{
			"id": "xxxxxx",
			"name": "Valerio Gheri",
			"first_name": "Valerio",
			"last_name": "Gheri",
			"link": "https://www.facebook.com/valerio.gheri",
			"username": "valerio.gheri",
			"gender": "male",
			"email": "valerio.gheri@gmail.com",
			"timezone": 2,
			"locale": "en_US",
			"verified": true,
			"updated_time": "2013-08-14T09:16:58+0000"
		}
		*/
		var data = JSON.parse(body);
		if (!error && response && response.statusCode && response.statusCode == 200) {
			var user = {
				facebookUserId: data.id,
				username: data.username,
				firstName: data.first_name,
				lastName: data.last_name,
				email: data.email
			};
			deferred.resolve(user);
		}
		else {
			/*
			{
				"error": {
					"message": "Error validating access token: Session has expired at unix time 1378054800. The current unix time is 1378489482.",
					"type": "OAuthException",
					"code": 190,
					"error_subcode": 463
				}
			}
			*/
			console.log(data.error);
			//console.log(response);
			deferred.reject({code: response.statusCode, message: data.error.message});
		}
	});
	return deferred.promise;
}

// Retrieve or create a user, generate api access token and store api and fb tokens.
// Return api access token + account obj
function performFacebookLogin(appName, userProfile, fbAccessToken) {
	var deferred = Q.defer();
	if (appName && userProfile && fbAccessToken) {
		var accountRepository = new AccountRepository();
		accountRepository.findOrCreateAccount(userProfile.username, userProfile.facebookUserId, userProfile.email,
				userProfile.firstName, userProfile.lastName)
			.then(function(account) {
				if (account.facebookUserId != userProfile.facebookUserId) {
					deferred.reject(new Error("Invalid token"));
				}
				else {
					var accountRepository = new AccountRepository();
					// Update the account name, lastname and email, if they are changed since last login
					if (account.hasChanged(userProfile.firstName, userProfile.lastName, userProfile.email)) {
						accountRepository.updateAccount({
							firstName: userProfile.firstName,
							lastName: userProfile.lastName,
							email: userProfile.email
						});
					}
					var apiAccessToken = new ApiAccessToken(account._id, appName);
					var securityToken = SecurityToken.createFromApiAndFacebookToken(apiAccessToken, fbAccessToken);
					SecurityToken.saveSecurityToken(securityToken)
						.then(function(savedSecurityToken){
							var loginViewModel = new LoginViewModel(account._id, account.username, account.firstName, account.lastName,
								apiAccessToken.accessToken);
							accountRepository.updateLastLoginDate(account, Date.now());
							deferred.resolve(loginViewModel);
						});
				}
			}, function(error) {
				deferred.reject(error);
			}).fail(function(err) {
				deferred.reject(err);
			});
	}
	return deferred.promise;
}

module.exports = AuthenticationHandler;
