/***
 * Unit tests for models/Account.js
 */
var mongoose = require('mongoose');
var should = require("should");
var ShoppingList = require("../models/ShoppingList");
var assert = require("assert");

describe('Shopping List', function() {
	var shoppingList;
	var wrongShoppingList;
	var itemId = new mongoose.Types.ObjectId();
	before(function(done) {
		shoppingList = new ShoppingList({
			createdBy: new mongoose.Types.ObjectId(),
			title: 'Test list',
			isShared: false
		});		
		shoppingList.invitees.push(new mongoose.Types.ObjectId());		
		shoppingList.shoppingItems.push({
			_id: itemId,
			name: 'bread',
			quantity: '500g'
		});
		done();
	});
	it('should have a valid created by property', function() {
		shoppingList.should.not.have.property('createdBy', null);
		shoppingList.should.not.have.property('createdBy', '');
	});
	it('should have a valid creation date', function() {
		shoppingList.should.not.have.property('creationDate', null);
	});
	it('should have a valid last update property, equal to creation date', function() {
		shoppingList.should.not.have.property('lastUpdate', null);
	});
	it('should be active', function() {
		shoppingList.should.have.property('isActive', true);
	});
	it('should have a title', function() {
		shoppingList.should.have.property('title', 'Test list');
	});
	it('should not be shared', function() {
		shoppingList.should.have.property('isShared', false);
	});
	it('should not be a template', function() {
		shoppingList.should.have.property('isTemplate', false);
	});
	it('should have 1 invitee', function() {
		shoppingList.invitees.should.have.length(1);
	});
	it('should have 1 item in the list', function() {
		shoppingList.shoppingItems.should.have.length(1);
		shoppingList.shoppingItems[0]._id.should.equal(itemId);
		shoppingList.shoppingItems[0].name.should.equal('bread');
		shoppingList.shoppingItems[0].quantity.should.equal('500g');
		shoppingList.hasItem('bread').should.equal(true);
	});
	it('should not be possible to add a second item with the same name of an existing one', function() {
		shoppingList.canAddItem('bread').should.equal(false);
	});
	it('should be possible to add butter to the list', function() {
		shoppingList.canAddItem('butter').should.equal(true);
	});
	it('should print itself in a string format', function() {
		shoppingList.toString().should.not.equal('');
	});
});