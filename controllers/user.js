'use strict'

const bcrypt = require('bcrypt-nodejs');
const mongoosePaginate = require('mongoose-pagination');
const fs = require('fs');
const path  = require('path');
const User = require('../models/user');
const Follow = require('../models/follow');
const Publication = require('../models/publication');
const Friend = require('../models/friend');
const FriendRequest = require('../models/friendRequest');
const jwt = require('../services/jwt');
const {
	CloudinaryImage,
	DeleteImage
} = require('../helpers/cloudinary');

function Home( req, res ){
	res
		.status( 200 )
		.send({
			message: 'Hola'
		});
}

function SaveUser( req, res ){
	let params = req.body;
	let user = new User();

	if ( params.name && params.lastname && params.nick &&
				params.email && params.password ) {

		user.name = params.name;
		user.lastname = params.lastname;
		user.nick = params.nick;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.password = params.password;
		user.image = null;

		User.find({ $or: [{ email: user.email.toLowerCase() },
											{ nick: user.nick.toLowerCase() }]})
			.exec((err, users)=>{

				if (err) {
					return res
										.status(500)
										.send({
											success: false,
											message: 'Error al ubicar usuario.',
											err: err
										});
				}

				if (users && users.length >=1 ) {
					return res
										.status(200)
										.send({
											success: false,
											message: 'El nombre de usuario o email ya existe!'
										});
				} else {
					user.save(( err, user )=>{

						if ( err ){
							 return res
							 					.status(500)
							 					.send({
							 						success: false,
							 						message: 'Error al guardar usuario.',
							 						err: err
							 					});
						}

						if ( user ) {
							user.password = undefined;
							res
								.status(200)
								.send({
									success: true,
									user: user,
									message: 'Usuario creado con éxito.'
								});
						} else {
							res
								.status(404)
								.send({
									success: false,
									message: 'No se ha podido crear el usuario'
								});
						}

					});				
				}
			})


	} else {

		res
			.status( 200 )
			.send({
				success: false,
				message: 'Envie todo los campos necesarios!'
			});
	}
}

function LoginUser(req, res){
	let params = req.body;

	let email =params.email;
	let password =params.password;

	User
		.findOne({ email: email })
		.exec((err, user)=>{

			if (err) {
				return res
									.status(500)
									.send({
										success: false,
										message: 'Error al iniciar sesión.',
										err: err
									});
			}

			if (user) {

				var validPassword = user.comparePassword( password );

				if ( validPassword ) {

					// if (params.getToken) {

						let token = jwt.createToken(user);
						user.password = undefined;
						user.__v = undefined;

						res
							.status(200)
							.send({
								success: true,
								message: 'Usuario autenticado!',
								token: token,
								user: user
							});

					// } else {
					// 	res
					// 		.status(200)
					// 		.send({
					// 			success: true,
					// 			message: 'Usuario autenticado!',
					// 			user: user
					// 		});
					// }

				} else {

					return res
										.status(404)
										.send({
											success: false,
											message: 'No se ha podido iniciar sesión.',
											err: err
										});
				}
			} else {

				return res
									.status(404)
									.send({
										success: false,
										message: 'No se ha podido iniciar sesión.',
										err: err
									});
			}

		})
}

function GetUser(req, res){
	let user_id = req.params.id;

	User
		.findById( user_id )
		.select('email name lastname image nick role _id ')
		.exec((err, user)=>{

			if (err) {
				return res
									.status(500)
									.send({
										success: false,
										message: 'Error en la petición.',
										err: err
									});
			}

			if (!user) {
				return res
								.status(404)
								.send({
									success: false,
									message: 'El usuario no existe.',
									err: err
								});
			}

			FollowThisUser( req.user.sub, user_id )
				.then( fl =>{
					return res
									.status(200)
									.send({
										success: true,
										user,
										fl
									});
				
				});


		})
}

async function FollowThisUser( identity_userId, userId ) {

	try{
		let following = await Follow
											.findOne({ user: identity_userId, followed: userId })
											.exec();
		let followed = await Follow
											.findOne({ user: userId, followed: identity_userId })
											.exec();
    let requested = await FriendRequest
                            .findOne({ user: userId, requested: identity_userId })
                            .exec()

    let request = await FriendRequest
                            .findOne({ requested: userId, user: identity_userId })
                            .exec()
		let friend = await Friend
                            .findOne({ $or: [{ user: userId, friend: identity_userId }, { friend: userId, user: identity_userId }]})
                            .exec()

		return {
			following: following,
			followed: followed,
			friend: friend,
			requested: requested,
			request: request
		}
	} catch(err){
		throw err;
	}

}

function GetUsers(req, res){

	let identity_userId = req.user.sub;

	let page = 1;

	if ( req.params.page ) {
		page = req.params.page;
	}

	let itemForPage = 10;

	User
		.find()
		.sort('_id')
		.select('email name lastname image nick role _id')
		.paginate( page, itemForPage, (err, users, total)=>{

			if (err) {
				return res
									.status(500)
									.send({
										success: false,
										message: 'Error en la petición.',
										err: err
									});
			}

			if (!users) {
				return res
								.status(404)
								.send({
									success: false,
									message: 'No se encontraron usuarios disponibles.',
									err: err
								});
			}
			FollowUserId( identity_userId ).then(fl=>{
				return res
								.status(200)
								.send({
									success: true,
									total,
									users,
									friends:fl.myfriendsAll,
                  friends_request: fl.friends_request,
                  users_following: fl.following_clean,
                  user_requested: fl.friends_solicited,
                  users_followed: fl.followed_clean,
									pages: Math.ceil(total/itemForPage)
								});				
			})

		})

}

async function FollowUserId(userId){


  try{

    let following = await Follow
                            .find({ user: userId })
                            .select({ '_id': 0, '__v':0, 'user': 0 })
                            .exec();

    let followed = await Follow
                            .find({ followed: userId })
                            .select({ '_id': 0, '__v':0, 'followed': 0 })
                            .exec();

    let myAddFriends = await FriendRequest
                            .find({ user: userId })
                            .select({ '_id': 0, '__v':0, 'user': 0 })
                            .exec()

    let friendsRequest = await FriendRequest
                            .find({ requested: userId })
                            .select({ '_id': 0, '__v':0, 'requested': 0})
                            .exec()

    let myfriends = await Friend
                            .find({ $or: [{ user: userId }, { friend: userId }]})
                            .select({ '_id': 0, '__v':0 })
                            .exec()

    let following_clean = [];
    let friends_solicited = [];
    let friends_request = [];
    let followed_clean = [];
    let myfriendsAll = [];

    following.forEach((follow)=>{
      following_clean.push(follow.followed);
    })

    followed.forEach((follow)=>{
      followed_clean.push(follow.user);
    })

    friendsRequest.forEach((requests)=>{
      friends_request.push(requests.user);
    })

    myAddFriends.forEach((request)=>{
      friends_solicited.push(request.requested);
    })

    myfriends.forEach((friend)=>{
      console.log(friend)
      if (userId == friend.user) {
        myfriendsAll.push(friend.friend);
      }  else {
        myfriendsAll.push(friend.user);
      }
    })

    return {
      following_clean,
      followed_clean,
      myfriendsAll,
      friends_solicited,
      friends_request
    }

  } catch(err){
    throw err;
  }

}

function GetCounters(req, res){
	let userId = req.user.sub;

	if (req.params.id) {
		userId = req.params.id;
		return GetCountFollow(userId)
			.then(val=>{
				return res
								.status(200)
								.send({
									success: true,
									val
								});
			})
	}

	GetCountFollow(userId)
		.then(val=>{
			return res
							.status(200)
							.send({
								success: true,
								gc: val
							});
		})

}

async function GetCountFollow(userId){

	try{
		let following = await Follow
														.countDocuments({ user: userId})
														.exec();

		let followed = await Follow
														.countDocuments({ followed: userId})
														.exec();

		let publications = await Publication
																	.countDocuments({ user: userId})
																	.exec();

		let friends = await Friend
																	.countDocuments({ $or: [{ user: userId }, { friend: userId }]})
																	.exec();

		return {
			following: following,
			followed: followed,
			publications: publications,
			friends: friends
		}

	} catch(err){
		throw err;
	}

} 

function UpdateUser(req, res){

	let userId = req.params.id;
	let update = req.body;

	if ( userId !== req.user.sub ) {

		return res
						.status(500)
						.send({
							success: false,
							message: 'No tienes los permisos necesarios.'
						});

	}

	User.find({ $or: [{ email: update.email.toLowerCase() },
										{ nick: update.nick.toLowerCase() }]})
		.exec((err, users)=>{

			if (err) {
				return res
									.status(500)
									.send({
										success: false,
										message: 'Error al ubicar usuario.',
										err: err
									});
			}

			let exist_user = false;

			users.forEach(user=>{
				if (user && user._id != userId) exist_user = true;
			})

			if (exist_user) {
				return res
									.status(200)
									.send({
										success: false,
										message: 'El nombre de usuario o email ya existe!'
									});
			} else {

				User
					.findByIdAndUpdate( userId, update, { new:true } )
					.select('email name lastname image nick role _id ')
					.exec((err, user)=>{

						if (err) {
							return res
												.status(500)
												.send({
													success: false,
													message: 'Error en la petición.',
													err: err
												});
						}

						if (!user) {
							return res
											.status(404)
											.send({
												success: false,
												message: 'El usuario no se ha podido actualizar.',
												err: err
											});
						}

						return res
										.status(200)
										.send({
											success: true,
											message: 'El usuario se ha actualizado.',
											user
										});

					});
				
			}
		})


}

function UploadImage(req, res){
	CloudinaryImage(req, res, 'image')
		.then(function(data){
			const req  = data.req;
      const res = data.res;

			let userId = req.params.id;

			// if ( req.files.image ) {
			if ( req.file ) {

				let filePath = req.file.public_id;
				// let fileSplit = filePath.split('\\');
				let fileName = req.file.secure_url;
				// let extSplit = fileName.split('\.');
				let fileExt = req.file.format;

				console.log( userId )
				console.log( req.user.sub )

				if ( userId !== req.user.sub ) {

					let message = 'No tienes los permisos necesarios.';
					return RemoveFileUpload( res, filePath, message );

				}


				if ( fileExt === 'png' || fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'gif' ) {
					
					User
						.findByIdAndUpdate( userId, { image: fileName }, { new: true } )
						.select('email name lastname image nick role _id ')
						.exec((err, user)=>{

							if (err) {
								return res
													.status(500)
													.send({
														success: false,
														message: 'Error en la petición.',
														err: err
													});
							}

							if (!user) {
								return res
												.status(404)
												.send({
													success: false,
													message: 'El usuario no se ha podido actualizar.',
													err: err
												});
							}

							return res
											.status(200)
											.send({
												success: true,
												message: 'El usuario se ha actualizado.',
												user
											});

						})

				} else {

					let message = 'Extensión no válida.';
					RemoveFileUpload( res, filePath, message );

				}

			} else {

				return res
								.status(200)
								.send({
									success: false,
									message: 'No se ha subido archivos.'
								});

			}
		})

}

// function RemoveFileUpload(res, filePath, message){
// 	fs.unlink( filePath, err=>{


// 		return res
// 				.status(500)
// 				.send({
// 					success: false,
// 					message: message
// 				});
// 	})
// }

function RemoveFileUpload(res, filePath, message){
	DeleteImage(filePath).then(function(result){
		console.log(result);
		return res
				.status(500)
				.send({
					success: false,
					message: message
				});
	}, function(err){
		console.log(err);
	});
}

function GetImageFile(req, res){

	let imageFile = req.params.imageFile;
	let filePath = './upload/users/'+imageFile;

	fs.exists( filePath, exist =>{
		if (exist) {
			return res
							.sendFile(path.resolve(filePath));
		} else {
			return res
							.status(200)
							.send({
								success: false,
								message: 'No existe la imagen...'
							});
		}
	})

}

module.exports = {
	Home,
	SaveUser,
	LoginUser,
	GetUser,
	GetUsers,
	UpdateUser,
	UploadImage,
	GetImageFile,
	GetCounters
};