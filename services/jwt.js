'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');
const secret = 'cla2ve4-secweret2-mea23n5-sowc23ial4-pract2ce2-angu32lar723-mon32godb67';

exports.createToken = function(user){
	let payload = {
		sub: user._id,
		name: user.name,
		lastname: user.lastname,
		nick: user.nick,
		email: user.email,
		role: user.role,
		file: user.file,
		iat: moment().unix(),
		exp: moment().add(17, 'days').unix()
	}

	return jwt.encode(payload, secret);
}