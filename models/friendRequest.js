'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FriendRequestSchema = Schema({
	user: { type: Schema.ObjectId, ref: 'User' },
	requested: { type: Schema.ObjectId, ref: 'Publication' },
});

module.exports = mongoose.model('FriendRequest', FriendRequestSchema);