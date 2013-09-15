/***
 * Unit tests for models/Account.js
 */

var should = require("should");
var Account = require("../models/Account");
var assert = require("assert");

describe('Account', function() {
	var account;
	before(function(done) {
		account = new Account({
			username: "vgheri",
			password: "testpwd",
			firstName: "Valerio",
			lastName: "Gheri",
			email: "test@test.com"
		});
		done();
	});
	it('should have a username', function() {
		account.should.have.property('username', 'vgheri');
	});
	it('should have a password', function() {
		account.should.have.property('password', 'testpwd');
	});
	it('should have a first name', function() {
		account.should.have.property('firstName', 'Valerio');
	});
	it('should have a last name', function() {
		account.should.have.property('lastName', 'Gheri');
	});
	it('should have an email', function() {
		account.should.have.property('email', 'test@test.com');
	});
	it('should have a not null creation date', function() {
		account.should.not.have.property('creationDate', null);
	});
	it('should have never logged in', function() {
		account.should.have.property('lastLogin', null);
	});
	it('should be active', function() {
		account.should.have.property('isActive', true);
	});
	it('should have an empty list', function() {
		account.should.have.property('shoppingLists');
		account.shoppingLists.should.have.length(0);
	});
	it('should have a full name', function() {
		account.getFullName().should.equal('Valerio Gheri');
	});
});
     