/***
 * Author: Valerio Gheri
 * Date: 13/03/2013
 * Account model
 */ 
 var mongoose = require('mongoose');
 var shoppingListSchema = require('ShopWithMe/models/ShoppingList');
 
 var accountSchema = mongoose.Schema({     
     username: {type: String, required: true, index: {unique: true}},
     password: {type: String, required: true},
     firstName: {type: String, required: true},
     lastName: {type: String, required: true},
     creationDate: {type: Date, default: function() { return new Date(); }},
     lastLogin: {type: Date, default: null},
     isActive: {type: Boolean, default: true},
     // If confirmation email system is implemented,  
     // this can be set to false
     canLogin: {type: Boolean, default: true},
     shoppingLists: {type: [shoppingListSchema], default: []}     
 });
 
accountSchema.methods.getFullName = function() {
     return (this.firstName + ' ' + this.lastName);    
};

var Account = mongoose.model('Account', accountSchema);

//var acc = new Account({ username: 'test', password: 'blabla', firstName: 'valerio', lastName: 'gheri' });

exports.Account = Account;
