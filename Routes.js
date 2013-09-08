/**
 * Created with JetBrains WebStorm.
 * User: Valerio Gheri
 * Date: 17/03/13
 * Time: 18.11
 * To change this template use File | Settings | File Templates.
 */
function setup(app, handlers) {
	app.post('/api/profiles', handlers.account.createAccount);
	app.get('/api/profiles/:username', handlers.account.getAccount);
	app.put('/api/profiles/:username', handlers.account.updateAccount);
	app.del('/api/profiles/:username', handlers.account.deleteAccount);
	app.post('/api/profiles/:userId/lists', handlers.list.createShoppingList);
	app.post('/api/profiles/:userId/lists/:templateId', handlers.list.createShoppingList);
	app.put('/api/profiles/:userId/lists/:shoppingListId', handlers.list.updateShoppingList);
	app.get('/api/profiles/:userId/lists/:shoppingListId', handlers.list.getShoppingList);
	app.get('/api/profiles/:userId/lists', handlers.list.getShoppingLists);
	app.del('/api/profiles/:userId/lists/:shoppingListId', handlers.list.deleteShoppingList);
	app.post('/api/profiles/:userId/lists/:shoppingListId/item/', handlers.list.addShoppingItem);
	app.put('/api/profiles/:userId/lists/:shoppingListId/item/:itemId', handlers.list.updateShoppingItem);
	app.del('/api/profiles/:userId/lists/:shoppingListId/item/:itemId', handlers.list.deleteShoppingItem);
	app.put('/api/profiles/:userId/lists/:shoppingListId/item/:itemId/crossout', handlers.list.crossoutShoppingItem);
	app.post('/api/auth/facebook/mobile', handlers.auth.facebookMobileLogin);
	app.post('/api/auth/logout', handlers.auth.logout);
}

exports.setup = setup;