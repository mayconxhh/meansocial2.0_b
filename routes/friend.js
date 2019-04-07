'use strict'

const express = require('express');
const {
        SaveFriend,
        DeleteFriend,
        GetFriends
      } = require('../controllers/friend');

const api = express.Router();
const { ensureAuth } = require('../middlewares/authenticated');

api
  .post('/friend/:id', ensureAuth, SaveFriend)
  .delete('/friend/:id', ensureAuth, DeleteFriend )
  .get('/friends/:id?/:page?', ensureAuth, GetFriends );

module.exports = api;