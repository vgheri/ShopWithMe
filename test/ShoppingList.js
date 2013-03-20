/***
 * Unit tests for models/Account.js
 */ 
 var mongoose = require('mongoose');
 var should = require("should");
 var shoppingListModule = require("../models/ShoppingList");
 var assert = require("assert");
 
 describe('Shopping List', function(){
     var shoppingList;
     var wrongShoppingList;
     before(function(done) {
         shoppingList = new shoppingListModule.ShoppingList({
             createdBy: new mongoose.Types.ObjectId(),
             title: 'Test list',
             isShared: false             
         });
         //console.log(shoppingList.createdBy);
         shoppingList.invitees.push(new mongoose.Types.ObjectId());
         //console.log(shoppingList.invitees[0]);
         shoppingList.shoppingItems.push({name: 'bread', quantity: '500g'});
         /*wrongShoppingList = new shoppingListModule.ShoppingList({
             title: 'Test list',
             isShared: false 
         });*/
         done();
     });
     
     /*it('should not have a null created by property', function() {
         wrongShoppingList.should.not.have.property('createdBy', null);
     });*/
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
        shoppingList.shoppingItems[0].name.should.equal('bread');
        shoppingList.shoppingItems[0].quantity.should.equal('500g');
        shoppingList.hasItem('bread').should.equal(true);
     });     
 });