/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 22/08/13
 * Time: 12.38
 * Unit tests for object ApiAccessToken.
 */
var should = require("should");
var ApiAccessToken = require("../infrastructure/apiAccessToken");
var assert = require("assert");
var moment = require("moment");

describe('ApiAccessToken', function() {
	var apiToken;
	before(function(done) {
		apiToken = new ApiAccessToken('vgheri@test.com', 'Mocha');
		done();
	});
	it('should have a non empty property accessToken', function() {
		apiToken.should.not.have.property('accessToken', '');
		apiToken.should.not.have.property('accessToken', null);
	});
	it('should have property expiration date set to 24 hours later than issued at date', function() {
		var expirationDate = moment(apiToken.expirationDate);
		var issuedAt = moment(apiToken.issuedAt);
		expirationDate.diff(issuedAt, 'h').should.equal(24);
	});
	it('should have correctly set the user property', function() {
		apiToken.should.have.property('user', 'vgheri@test.com');
	});
	it('should have correctly set the application name property', function() {
		apiToken.should.have.property('application', 'Mocha');
	});
});
