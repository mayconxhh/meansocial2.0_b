'use strict'

const express = require('express');
const {
        SaveRequest,
        DeleteRequest,
        GetRequests
      } = require('../controllers/friendRequest');

const api = express.Router();
const { ensureAuth } = require('../middlewares/authenticated');

api
  .post('/friend_request', ensureAuth, SaveRequest)
  .delete('/friend_request/:id', ensureAuth, DeleteRequest )
  .get('/friend_request/:page?', ensureAuth, GetRequests );

module.exports = api;