/**
 * Created with JetBrains WebStorm.
 * User: Valerio Gheri
 * Date: 17/03/13
 * Time: 18.11
 * To change this template use File | Settings | File Templates.
 */
 function setup(app, handlers) {
    app.post('/profiles', handlers.account.createAccount);
    app.get('/profiles/:username', handlers.account.getAccount);
    app.put('/profiles', handlers.account.updateAccount);
    app.delete('/profiles/:username', handlers.account.deleteAccount);
}

 exports.setup = setup;