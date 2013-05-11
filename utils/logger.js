/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 10/05/13
 * Time: 12.13
 * To change this template use File | Settings | File Templates.
 */

var winston = require('winston');

function log(level, message) {
	winston.log(level, message);
}

exports.log = log;
