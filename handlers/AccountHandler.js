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
            '. Timestamp: ' + new Date() + '. Stack trace: ' + err.stack);            
            res.jsonp(400, {error: err.message});
         }
         else {        
            winston.log('info', 'Account ' + username + ' has been created.' + 
                'Request from address ' + req.connection.remoteAddress + '.' +
                'Timestamp: ' + new Date()); 
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
         winston.log('error', 'An error has occurred while processing a request to retrieve ' +
            'account ' + username + ' from ' + req.connection.remoteAddress + 
            '. Timestamp: ' + new Date() + '. Stack trace: ' + err.stack);
         res.jsonp(400, {error: err.message});
     }
     else {
       if (account) {
         winston.log('info', 'Account ' + username + ' has been retrieved.' + 
                'Request from address ' + req.connection.remoteAddress + '.' +
                'Timestamp: ' + new Date());  
         res.jsonp(200, account);
       }
       else {
         winston.log('info', 'Could not retrieve account ' + username + ', no ' + 
                'such username. Request from address ' + req.connection.remoteAddress + '.' +
                'Timestamp: ' + new Date());  
         res.jsonp(404, {error: "No account found matching " + username});
       }
     }
   });
 }
 
 function handleUpdateAccountRequest(req, res) {
     // Retrieve the username from the request
     var username = req.params.username;
     var updatedAccount = req.body; 
     updatedAccount.username = username;
     
     updateAccount(updatedAccount, function(err, account) {
         if (err) {
             winston.log('error', 'An error has occurred while processing a request to update ' +
             'account ' + username + ' from ' + req.connection.remoteAddress + 
             '. Timestamp: ' + new Date() + '. Stack trace: ' + err.stack);
             res.jsonp(400, {error: err.message});
         } 
         else {
             if (account) {
                 winston.log('info', 'Account ' + username + ' has been updated.' + 
                 'Request from address ' + req.connection.remoteAddress + '.' +
                 'Timestamp: ' + new Date()); 
                 res.jsonp(200, account);              
             }
             else {
                 winston.log('info', 'Could not update account ' + username + ', no ' + 
                 'such username. Request from address ' + req.connection.remoteAddress + '.' +
                 'Timestamp: ' + new Date());  
                 res.jsonp(404, {error: "No account found matching " + username});             
             }
         }
     });
     
     /* Old approach
     // Retrieve the account associated with this username
     findAccountByUsername(username, function(err, account) {
        if (err) {
            winston.log('error', 'An error has occurred while processing a request to update ' +
            'account ' + username + ' from ' + req.connection.remoteAddress + 
            '. Stack trace: ' + err.stack);
            res.jsonp(400, {error: err.message});
        }
        else {
           if (account) {
             // Update the account with the info modified by the user
             if (account.firstName !== updatedAccount.firstName) {
                 account.firstName = updatedAccount.firstName;                 
             }
             if (account.lastName !== updatedAccount.lastName) {
                 account.lastName = updatedAccount.lastName;
             }
             
           }
           else {
             res.jsonp(404, {error: "No account found matching " + username});
           }
        }
     });
     */
 }
 
 function handleDeleteAccountRequest(req, res) {          
     var username = req.params.username;
     disableAccount(username, function(err, account) {
         if (err) {
             winston.log('error', 'An error has occurred while processing a request to disable ' +
             'account ' + username + ' from ' + req.connection.remoteAddress + 
             '. Timestamp: ' + new Date() + '. Stack trace: ' + err.stack);
             res.jsonp(400, {error: err.message});
         } 
         else {
             if (account) {
                 winston.log('info', 'Account ' + username + ' has been disabled.' + 
                 'Request from address ' + req.connection.remoteAddress + '.' +
                 'Timestamp: ' + new Date());
                 // No need to return anything. We just disabled the account 
                 res.jsonp(204);                 
             }
             else {
                 winston.log('info', 'Could not disable account ' + username + ', no ' + 
                 'such username. Request from address ' + req.connection.remoteAddress + '.' +
                 'Timestamp: ' + new Date()); 
                 res.jsonp(404, {error: "No account found matching " + username});             
             }
         }
     });
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
     var query = { username: account.username };
     var options = {new: true};
     accountModule.Account.findOneAndUpdate(query, {firstName: account.firstName, lastName: account.lastName}, options, callback);
 }
 
 function disableAccount(username, callback) {
     var query = { username: username };
     var options = {new: true};
     accountModule.Account.findOneAndUpdate(query, {isActive: false, canLogin: false}, options, callback);
 }

 exports.AccountHandler = new AccountHandler();
 
 