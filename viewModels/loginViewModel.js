/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 26/08/13
 * Time: 14.16
 * To change this template use File | Settings | File Templates.
 */

var LoginViewModel = function(id, username, firstName, lastName, apiAccessToken) {
	this.userId = id;
	this.username = username;
	this.firstName = firstName;
	this.lastName = lastName;
	this.apiAccessToken = apiAccessToken;
}

module.exports = LoginViewModel;
