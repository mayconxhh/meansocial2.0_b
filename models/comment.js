'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = Schema({
	user: { type: Schema.ObjectId, ref: 'User' },
	createAd: { type: Date },
	comment: { type: string },
	publication: { type: Schema.ObjectId, ref: 'Publication' },
});

module.exports = mongoose.model('Comment', CommentSchema);