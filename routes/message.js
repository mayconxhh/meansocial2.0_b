const express = require('express');
const api = express.Router();
const {
				test,
				SendMessage,
				GetReceivedMessage,
				GetEmmitedMessage,
				GetUnviewedMessage,
				SetViewedMessages
			} = require('../controllers/message');

const {
				ensureAuth
			} = require('../middlewares/authenticated');

api
	.get('/test', ensureAuth, test )
	.post('/message', ensureAuth, SendMessage )
	.get('/received_messages/:page?', ensureAuth, GetReceivedMessage )
	.get('/emmited_messages/:page?', ensureAuth, GetEmmitedMessage )
	.get('/unviewed_messages', ensureAuth, GetUnviewedMessage )
	.get('/set_viewed_messages', ensureAuth, SetViewedMessages );

module.exports = api;