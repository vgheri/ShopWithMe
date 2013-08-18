/***
 * Author: Valerio Gheri
 * Date: 13/03/2013
 * Shopping list model
 */   
  
var mongoose = require('mongoose');
 
var shoppingListSchema = mongoose.Schema({     
	createdBy: {type: mongoose.Schema.ObjectId, required: true, index: true},
	creationDate: {type: Date, 'default': Date.now},
	lastUpdate: {type: Date, 'default': Date.now},
	isActive: {type: Boolean, 'default': true},
	title: {type: String, required: true},
	isShared: {type: Boolean, 'default': false},
	isTemplate: {type: Boolean, 'default': false},
	invitees: {type: [mongoose.Schema.ObjectId], 'default': []},
	shoppingItems: {
		type: [{
			name: {type: String, required: true},
			quantity: String,
			comment: String,
			isInTheCart: {type: Boolean, 'default': false}
		}],
		'default': []}
});

// Checks if the list of invitees contains this invitee Id already
shoppingListSchema.methods.hasInvitee = function(id) {     
	return this.invitees.some(function(current){
		return id === current._id;
	});     
};

// Checks if the shopping list contains this item name already 
shoppingListSchema.methods.hasItem = function(name) {     
	return this.shoppingItems.some(function(current){
		return name === current.name;
	});     
};

shoppingListSchema.methods.canAddItem = function(name) {
	if (name === null || name === '') {
		return false;
	}
	var can = true;
	if (this.hasItem(name)) {
		can = false;
	}
	return can;
};

shoppingListSchema.methods.toString = function() {
	var listExport = this.title + ' (' + this.lastUpdate + ')';
	listExport += '\n';
	this.shoppingItems.forEach(function(item) {
		listExport += item.name + ' - Quantity: ' + item.quantity;
		listExport += '\n';
	});
	return listExport;     
};

var ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);

module.exports = ShoppingList; 
 
 
 