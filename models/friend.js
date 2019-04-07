'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FriendSchema = Schema({
	user: { type: Schema.ObjectId, ref: 'User' },
	createAd: { type: Date },
	friend: { type: Schema.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Friend', FriendSchema);