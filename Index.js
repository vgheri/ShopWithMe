/***
 * Author: Valerio Gheri
 * Date: 15/03/2013
 * Entry point
 */ 
 
 var winston = require('winston');
 // We will log normal api operations into api.log
 winston.add(winston.transports.File, {filename: 'logs/api.log'});
 // We will log all uncaught exceptions into exceptions.log
 winston.handleExceptions(new winston.transports.File({filename: 'logs/exceptions.log'}));