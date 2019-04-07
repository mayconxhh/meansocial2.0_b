'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();

// LOAD ROUTES
const UserRoutes = require('./routes/user');
const FollowRoutes = require('./routes/follow');
const PublicationRoutes = require('./routes/publication');
const MessageRoutes = require('./routes/message');
const FriendRequestRoutes = require('./routes/friendRequest');
const FriendRoutes = require('./routes/friend');

// MIDDLEWARES
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS
app.use((req, res, next) => {
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
   res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

   next();
});


// ROUTES
app.use('/api', UserRoutes);
app.use('/api', FollowRoutes);
app.use('/api', PublicationRoutes);
app.use('/api', MessageRoutes);
app.use('/api', FriendRequestRoutes);
app.use('/api', FriendRoutes);

// EXPORT
module.exports = app;