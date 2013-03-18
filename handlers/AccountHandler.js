/***
 * Author: Valerio Gheri
 * Date: 15/03/2013
 * This class contains all the methods to handle Account related requests
 */ 
 
 var accountModule = require('../models/Account');
 var winston = require('winston');
 
 var AccountHandler = function() {     
     this.createAccount = handleCreateAccountRequest;
     this.getAccount = handleGetAccountRequest;
     this.updateAccount = handleUpdateAccountRequest;
     this.deleteAccount = handleDeleteAccountRequest;     
 };
 
 // On success should return status code 201 to notify the client the account
 // creation has been successful
 // On error should return status code 400 and the error message
 function handleCreateAccountRequest(req, res) {
     var username = req.body.username;
     var password = req.body.password;
     var firstName = req.body.firstName;
     var lastName = req.body.lastName;
     createAccount(username, password, firstName, lastName, function(err, account) {
         if (err) {             
            winston.log('error', 'An error has occurred while processing a request to create an ' +
            'account from ' + req.connection.remoteAddress + 
            '. Stack trace: ' + err.stack);            
            res.jsonp(400, {error: err.message});
         }
         else {                         
            res.jsonp(201, account);
         }         
     });
 }
 
 /* TODO: I should update this function to check the identity of the origin.
  We don't want anyone being able to peek into the username collection */
 function handleGetAccountRequest(req, res) {
   var username = req.params.username;
   findAccountByUsername(username, function(err, account) {
     if (err) {
       winston.log('error', 'An error has occurred while processing a request to retrieve an ' +
            'account from ' + req.connection.remoteAddress + 
            '. Stack trace: ' + err.stack);
       res.jsonp(400, {error: err.message});
     }
     else {
       if (account) {
         res.jsonp(200, account);
       }
       else {
         res.jsonp(404, {error: "No account found matching " + username});
       }
     }
   });
 }
 
 function handleUpdateAccountRequest(firstName, lastName, request, response) {
     
 }
 
 function handleDeleteAccountRequest(username, request, response) {
     
 } 
 
   
 function createAccount(username, password, firstName, lastName, callback) {
     var account = new accountModule.Account({
         username: username, 
         password: password, 
         firstName: firstName, 
         lastName: lastName
     });
     
     account.save(function(err, account) {         
         return callback(err, account);
     });
 }
 
 function findAccountByUsername(username, callback) {
   accountModule.Account.findOne({username: username}, function(err, foundUsername) {
    return callback(err, foundUsername);
   });
 }
 
 function updateAccount(account, callback) {
      throw new Error("Not implemented");
 }
 
 function disableAccount(username, callback) {
     throw new Error("Not implemented");
 }

 exports.AccountHandler = new AccountHandler();
 
 