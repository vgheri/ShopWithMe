/***
 * Author: Valerio Gheri
 * Date: 25/03/2013
 * This class contains all the methods to handle /api/lists related requests
 */ 
 
 var ShoppingList = require('../models/ShoppingList');
 var winston = require('winston');
 
 var ShoppingListHandler = function() {     
     this.createShoppingList = handleCreateShoppingListRequest;
     //this.createShoppingListFromTemplate = handleCreateShoppingListFromTemplateRequest;
     //this.getAccount = handleGetAccountRequest;
     //this.updateAccount = handleUpdateAccountRequest;
     //this.deleteAccount = handleDeleteAccountRequest;     
 };
 
 // On success should return status code 201 to notify the client the account
 // creation has been successful
 // On error should return status code 400 and the error message
 function handleCreateShoppingListRequest(req, res) {
			var createdBy = req.body.userId || null;
      var title = req.body.title || null;      
      // createShoppingList handles creation of all lists, both empty ones
      // and pre-populated ones
      var opts = {
				isShared: false,
				invitees: [],
				shoppingItems: []
      };
      createShoppingList(createdBy, title, opts, function(err, shoppingList) {
				console.log("callback called");
				if (err) {             
					winston.log('error', 'An error has occurred while processing a request to create a ' +
					'shopping list from ' + req.connection.remoteAddress + 
					'. Timestamp: ' + new Date() + '. Stack trace: ' + err.stack);            
					res.json(400, {error: err.message});
				}
				else {        
					winston.log('info', 'User Id ' + createdBy + ' has just created a ' + 
						'new empty shopping list. Request from address ' + req.connection.remoteAddress + '.'); 
					res.json(201, shoppingList);
				}         
     });
 }
 
 function createShoppingList(creatorId, title, opts, callback) {
     var shoppingList = new ShoppingList({
         createdBy: creatorId,
         title: title,
         isShared: opts.isShared,
         invitees: opts.invitees,
         shoppingItems: opts.shoppingItems
     });     
     shoppingList.save(callback);     
 }
  
 module.exports = ShoppingListHandler;
 
 