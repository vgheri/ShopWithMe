/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 20/08/13
 * Time: 19.13
 * To change this template use File | Settings | File Templates.
 */

var Random = require('../utils/random');
var moment = require('moment');
var mongoose = require('mongoose');

var ApiAccessToken = function(userId, application) {
	this.accessToken = Random.generateApiAccessToken();
	this.issueDate = moment();
	this.expirationDate = moment().add('h', 24).toString();
	this.application = application;
	this.userId = userId;
};

module.exports = ApiAccessToken;

/*
 Continua creando un handler per lo use case del login/logout
 Crea un endpoint per il login via app mobili che accetta in ingresso
 il nome dell'app (android/web) e il facebook access token.
 Dopo di che l'api fa una chiamata a facebook per verificare che il token sia
 valido e farsi restituire un oggetto che modella il profilo utente associato.
 Poi questa funziona deve creare un oggetto user profile così come definito da Passport.js.
 Poi invoca una funziona wrapper che accetta come parametri il nome dell'app, lo user profile e il fb access token e che
 poi chiama findOrCreateUser, genera api access token e salva api, fb tokens e che ritorna all'utilizzatore l'api
 access token.
*/