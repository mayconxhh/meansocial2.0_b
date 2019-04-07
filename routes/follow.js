'use strict'

const express = require('express');
const {
				SaveFollow,
				DeleteFollow,
				GetUserFollowing,
				GetUserFollowed,
				GetFollows
			} = require('../controllers/follow');

const api = express.Router();
const { ensureAuth } = require('../middlewares/authenticated');

api
	.post('/follow', ensureAuth, SaveFollow)
	.delete('/follow/:id', ensureAuth, DeleteFollow )
	.get('/following/:id?/:page?', ensureAuth, GetUserFollowing )
	.get('/followed/:id?/:page?', ensureAuth, GetUserFollowed )
	.get('/follows/:followed?', ensureAuth, GetFollows );

module.exports = api;