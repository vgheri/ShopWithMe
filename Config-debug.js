/**
 * Created with JetBrains WebStorm.
 * User: Valerio Gheri
 * Date: 17/03/13
 * Time: 17.31
 * To change this template use File | Settings | File Templates.
 */
module.exports = {
	"db": {
		//"mongodb": "mongodb://testUser:testpassword@ds045077.mongolab.com:45077/shopwithmetest"
		// Localhost
		"mongodb": "mongodb://localhost/ShopWithMe"
	},
	"logger": {
		"api": "logs/api.log",
		"exception": "logs/exceptions.log"
	}
};