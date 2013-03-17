/***
 * Author: Valerio Gheri
 * Date: 15/03/2013
 * This class contains all the methods to handle Account related requests
 */ 
 
 var mongoose = require('mongoose');
 var Account = require('../models/Account');
 var winston = require('winston');
 
 var AccountHandler = function() {     
     this.createAccount = handleCreateAccountRequest;
     this.getAccount = handleGetAccountRequest;
     this.updateAccount = handleUpdateAccountRequest;
     this.deleteAccount = handleDeleteAccountRequest;     
 };
 
 // On success should return status code 201 to notify the client the account creation has been successful
 // On error should return status code 400 and the error message
 function handleCreateAccountRequest(username, password, firstName, lastName, request, response) {
     createAccount(username, password, firstName, lastName, function(err, account) {
         if (err) {             
            winston.log('error', 'An error has occurred while processing a request to create an ' +
            'account from ' + request.connection.remoteAddress + 
            '. Stack trace: ' + err.stack);            
            response.jsonp(400, {error: err.message})
         }
         else {                         
            response.jsonp(201, account);
         }         
     });
 }
 
 function handleGetAccountRequest(req, res) {
   var username = req.params.username;
   findAccountByUsername(username, function(err, account) {
     if (err) {
       res.jsonp(400, {error: err.message})
     }
     else {
       if (account) {
         res.jsonp(200, account);
       }
       else {
         res.send("No account matching " + username);
       }
     }
   });
 }
 
 function handleUpdateAccountRequest(firstName, lastName, request, response) {
     
 }
 
 function handleDeleteAccountRequest(username, request, response) {
     
 } 
 
   
 function createAccount(username, password, firstName, lastName, callback) {
     var account = new Account({
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
   Account.Account.findOne({username: username}, function(err, foundUsername) {
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
 
 