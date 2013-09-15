/***
 * Author: Valerio Gheri
 * Date: 13/03/2013
 * Account model
 */ 
var mongoose = require('mongoose');

var accountSchema = mongoose.Schema({     
	username: {type: String, required: true, index: {unique: true}},
	password: {type: String, required: true},
	email: {type: String, required: true},
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	creationDate: {type: Date, 'default': Date.now},
	lastLogin: {type: Date, 'default': null},
	isActive: {type: Boolean, 'default': true},
	// If confirmation email system is implemented,  
	// this can be set to false
	canLogin: {type: Boolean, 'default': true},
	// Treated as a set
	shoppingLists: {type: [mongoose.Schema.ObjectId], 'default': []},
	facebookUserId: {type: String, 'default': null}
});

accountSchema.methods.hasChanged = function(firstName, lastName, email) {
	return (this.firstName !== firstName || this.lastName !== lastName || this.email !== email);
};

accountSchema.methods.getFullName = function() {
	return (this.firstName + ' ' + this.lastName);    
};

var Account = mongoose.model('Account', accountSchema);

module.exports = Account;
