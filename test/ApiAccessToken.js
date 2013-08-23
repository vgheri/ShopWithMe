/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 22/08/13
 * Time: 12.38
 * Unit tests for object ApiAccessToken.
 */
var should = require("should");
var ApiAccessToken = require("../infrastructure/apiAccessToken");
var SecurityAccessToken = require("../infrastructure/securityToken");
var assert = require("assert");
var moment = require("moment");
var mongoose = require("mongoose");
var config = require('../Config-debug');

describe('ApiAccessToken', function() {
	var apiToken;
	before(function(done) {
		apiToken = new ApiAccessToken(new mongoose.Types.ObjectId('5149d6d382d09b6722000002'), 'Mocha');
		done();
	});
	it('should have a non empty property accessToken', function() {
		apiToken.should.not.have.property('accessToken', '');
		apiToken.should.not.have.property('accessToken', null);
	});
	it('should expire one day after it was issued', function() {
		var expirationDate = moment(apiToken.expirationDate);
		var issuedAt = moment(apiToken.issueDate);
		expirationDate.diff(issuedAt, 'h').should.equal(23);
	});
	it('should have correctly set user id', function() {
		var observedUserId = apiToken.userId.toString();
		observedUserId.should.equal('5149d6d382d09b6722000002');
	});
	it('should have correctly set the application name property', function() {
		apiToken.should.have.property('application', 'Mocha');
	});
	describe('SecurityToken', function() {
		var securityAccessToken;
		var apiAccessToken;
		before(function(done) {
			securityAccessToken = SecurityAccessToken.createFromApiAndFacebookToken(apiToken, "asdhajshajhsdjhadsjh");
			mongoose.connect(config.db.mongodb);
			done();
		});
		it('should have a non empty property accessToken', function() {
			securityAccessToken.should.not.have.property('apiAccessToken', '');
			securityAccessToken.should.not.have.property('apiAccessToken', null);
		});
		it('should expire one day after it was issued', function() {
			var expirationDate = moment(securityAccessToken.expirationDate);
			var issuedAt = moment(securityAccessToken.issueDate);
			expirationDate.diff(issuedAt, 'h').should.equal(24);
		});
		it('should have correctly set the application name property', function() {
			securityAccessToken.should.have.property('application', 'Mocha');
		});
		it('should have correctly set the facebook access token', function() {
			securityAccessToken.should.have.property('facebookAccessToken', 'asdhajshajhsdjhadsjh');
		});
		it('should have correctly set user id', function() {
			var observedUserId = securityAccessToken.userId.toString();
			observedUserId.should.equal('5149d6d382d09b6722000002');
		});
		it('should not be expired', function() {
			securityAccessToken.isExpired().should.equal(false);
		});
		it('should return error trying to save a security access token with non valid params', function() {
			(function() {
				SecurityAccessToken.createFromApiAndFacebookToken(null, "asdhajshajhsdjhadsjh");
			}).should.throwError('The Api access token and the Facebook user access token are required');
		});
		it('should save a valid security access token', function(done) {
			SecurityAccessToken.saveSecurityToken(securityAccessToken)
				.then(function(savedToken) {
					savedToken.should.have.property('_id');
					savedToken.should.not.have.property('_id', null);
					apiAccessToken = savedToken.apiAccessToken;
					done();
				}, function(err) {
					throw new Error(err);
				});
		});
		it('should retrieve the just saved token', function(done) {
			SecurityAccessToken.findSecurityToken(apiAccessToken)
				.then(function(retrievedToken) {
					retrievedToken.should.have.property('apiAccessToken', apiAccessToken);
					retrievedToken.should.have.property('application', 'Mocha');
					retrievedToken.should.have.property('facebookAccessToken', 'asdhajshajhsdjhadsjh');
					var observedUserId = retrievedToken.userId.toString();
					observedUserId.should.equal('5149d6d382d09b6722000002');
					done();
				})
				.fail(function(err) {
					throw new Error(err);
				});
		});
	});
});

