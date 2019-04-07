'use strict'

const mongoose = require('mongoose');
const titlize   = require('mongoose-title-case');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const UserSchema = Schema({
	name: String,
	lastname: String,
	nick: { type: String, require: true, unique: true },
	email: { type: String, require: true, unique: true },
	password: String,
	role: String,
	image:String
});
UserSchema.pre('save', function(next){
  var user = this

  if (!user.isModified('password')) return next()

  bcrypt.hash(user.password, null, null, function(err, hash){

    if (err) {
      console.log('Ocurrió un error')
      console.log(err)
      return next(err)
    }

    user.password = hash
    next()
  })
});
UserSchema.plugin(titlize, {
  paths: [ 'name' ]
})
UserSchema.methods.comparePassword = function(password){
  return bcrypt.compareSync(password, this.password)
}

module.exports = mongoose.model('User', UserSchema);