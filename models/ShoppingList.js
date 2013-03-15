/***
 * Author: Valerio Gheri
 * Date: 13/03/2013
 * Shopping list model
 */   
  
 var mongoose = require('mongoose');
   
 var shoppingListSchema = mongoose.Schema({     
     createdBy: {type: mongoose.Schema.ObjectId, required: true, index: true},
     creationDate: {type: Date, default: Date.now},
     lastUpdate: {type: Date, default: null},
     isActive: {type: Boolean, default: true},
     title: {type: String, required: true},
     isShared: {type: Boolean, required: true},
     isTemplate: {type: Boolean, default: false},
     invitees: {type: [mongoose.Schema.ObjectId], default: []},
     shoppingItems: {type: [{name: {type: String, required: true}, quantity: String}], default: []}
 });
 
 var ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);
 
 exports.ShoppingList  = ShoppingList;
 