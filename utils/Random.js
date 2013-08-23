/**
 * Created with JetBrains WebStorm.
 * User: valerio
 * Date: 20/08/13
 * Time: 19.35
 * To change this template use File | Settings | File Templates.
 */

var Random = {
	generateApiAccessToken : generateToken
};

function generateToken()
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 32; i++ ) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

module.exports = Random;