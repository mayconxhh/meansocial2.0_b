'use strict'

let express = require('express');
let api = express.Router();
let { ensureAuth } = require('../middlewares/authenticated');
let { 
		prueba,
		NewPublication,
		GetPublications,
		GetPublicationsUser,
		GetPublication,
		DeletePublication,
		UploadImage,
		GetImageFile
	} = require('../controllers/publication');

const multipart = require('connect-multiparty');
const upload = multipart({ uploadDir: './upload/publications' });

api
	.get('/pub/prueba', ensureAuth, prueba )
	.post('/publication', ensureAuth, NewPublication )
	.get('/publications/:page?', ensureAuth, GetPublications )
	.get('/publications-user/:id/:page?', ensureAuth, GetPublicationsUser )
	.get('/publication/:id', ensureAuth, GetPublication )
	.delete('/publication/:id', ensureAuth, DeletePublication )
	.post('/publication/upload_image/:id', [ ensureAuth, upload ], UploadImage )
	.get('/publication/image/:imageFile', GetImageFile );

module.exports = api;