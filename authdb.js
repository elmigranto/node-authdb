'use strict';

var redis = require("redis");

// The AuthDB client.
//
// Requires a link to a Redis database.
//
var Client = function(options) {
    // Can pass in redisClient directly, or we create our own
    // using options.host/options.port with defaults.
    this.redisClient = options.redisClient || redis.createClient(
        options.port || 6379,
        options.host || "127.0.0.1",
        {no_ready_check: true}
    );

    return this;
};

// Retrieve an user account from authentication token
//
// cb(err, account) will be called.
//
// account will be null if no account is found, i.e.
// user has to login again.
//
Client.prototype.getAccount = function(token, cb) {
    this.redisClient.get(token, function(err, reply) {
        if (err) {
            return cb(err, null);
        }
        if (reply) {
            try {
                reply = JSON.parse(reply);
            }
            catch (e) {
                return cb(e, null);
            }
            cb(null, reply);
        }
        else {
            cb("account not found", null);
        }
    });
};

// Adds an account into the authentication database
//
// cb(err, reply) will be called with result.
Client.prototype.addAccount = function(token, account, cb) {
    this.redisClient.set(token, JSON.stringify(account), cb);
    this.redisClient.expire(token, 3600 * 24 * 365); // token will be valid for 365 days
};

Client.prototype.removeAccount = function(token, cb) {
    this.redisClient.del(token, cb);
};

// Module object
var authdb = function (options) {
    // Don't fail on missing options.
    return new Client(options || {});
};

// Backwrads compatible.
authdb.createClient = authdb;

// Export the module object.
module.exports = authdb;
