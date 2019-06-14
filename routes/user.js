'use strict'

const express = require('express');
const {
		Home,
		SaveUser,
		LoginUser,
		GetUser,
		GetUsers,
		UpdateUser,
		UploadImage,
		GetImageFile,
		GetCounters
	} = require('../controllers/user');
const { ensureAuth } = require('../middlewares/authenticated');

const api = express.Router()
// const multipart = require('connect-multiparty');
// const upload = multipart({ uploadDir: './upload/users' });

api
	.get('/home', ensureAuth, Home )
	.post('/user', SaveUser )
	.post('/login', LoginUser )
	.get('/user/:id', ensureAuth, GetUser )
	.put('/user/:id', ensureAuth, UpdateUser )
	.get('/users/:page?', ensureAuth, GetUsers )
	.post('/upload_user_image/:id', ensureAuth, UploadImage )
	.get('/user/image/:imageFile', GetImageFile)
	.get('/counters/:id?', ensureAuth, GetCounters );

module.exports = api;