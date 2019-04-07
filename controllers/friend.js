'use strict'

// const path = require('path');
const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination');
const Friend = require('../models/friend');
const FRequest = require('../models/friendRequest');
const Follow = require('../models/follow');

function SaveFriend(req, res){

  let userId = req.params.id;
  let requested = req.user.sub;

  let friend = new Friend();
  friend.user = req.user.sub;
  friend.createAd = moment().unix();
  friend.friend = userId;

  FRequest
    .find({ 'user': userId, 'requested': requested })
    .remove(err=>{
      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al procesar solicitud.',
                  err
                });

      }

      friend
        .save((err, friend)=>{
          if (err) {

            return res
                    .status(500)
                    .send({
                      success:false,
                      message: 'Ocurrió un error al aceptar la solicitud.',
                      err
                    });

          }

          if (!friend) {
            return res
                    .status(404)
                    .send({
                      success:false,
                      message: 'No se pudo aceptar la solicitud.'
                    });
          }

          return res
                  .status(200)
                  .send({
                    success:true,
                    friend,
                  });
        })
    })

}

function DeleteFriend(req, res){

  let friend = req.params.id;

  Friend
      .find({ $or: [{ user: friend, friend: req.user.sub }, { friend: friend, user: req.user.sub }]})
      .remove(err=>{
        if (err) {

          return res
                  .status(500)
                  .send({
                    success:false,
                    message: 'Ocurrió un error al eliminar amigo.',
                    err
                  });

        }

        return res
                .status(200)
                .send({
                  success: true,
                  message: 'Amigo eliminado con éxito.'
                });
      })

}

function GetFriends(req, res){

  let userId = req.params.id && req.params.page ? req.params.id : req.user.sub;

  let page = req.params.page ? req.params.page : req.params.id || 1 ;

  let itemsForPage = 10;

  Friend
    .find({ $or: [{ user: userId }, { friend: userId }]})
    .populate( 'friend user', 'email name lastname image nick role _id' )
    .paginate( page , itemsForPage, ( err, friends, total )=>{

      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al realizar el seguimiento',
                  err
                });

      }

      if (!friends) {

        return res
                .status(404)
                .send({
                  success:false,
                  message: 'No se encontraron follows'
                });

      }
      
      friends.forEach(friend=>{
        if (friend.user._id != userId) {
          friend.friend = friend.user;
        }

        friend.user = userId;
      })

      FriendUserId(req.user.sub)
        .then(myFriends=>{
          return res
                  .status(200)
                  .send({
                    success:true,
                    friends,
                    myFriends: myFriends.myfriendsAll,
                    users_following: myFriends.following_clean,
                    users_followed: myFriends.followed_clean,
                    total,
                    pages: Math.ceil(total/itemsForPage)
                  });          
        })

    });
}

async function FriendUserId(userId){

  try{
    let following = await Follow
                            .find({ user: userId })
                            .select({ '_id': 0, '__v':0, 'user': 0 })
                            .exec();

    let followed = await Follow
                            .find({ followed: userId })
                            .select({ '_id': 0, '__v':0, 'followed': 0 })
                            .exec();

    let myfriends = await Friend
                            .find({ $or: [{ user: userId }, { friend: userId }]})
                            .select({ '_id': 0, '__v':0 })
                            .exec()

    let following_clean = [];
    let followed_clean = [];
    let myfriendsAll = [];

    following.forEach((follow)=>{
      following_clean.push(follow.followed);
    })

    followed.forEach((follow)=>{
      followed_clean.push(follow.user);
    })

    myfriends.forEach((friend)=>{
      if (userId == friend.user) {
        myfriendsAll.push(friend.friend);
      }  else {
        myfriendsAll.push(friend.user);
      }
    })

    return {
      myfriendsAll,
      following_clean,
      followed_clean
    }

  } catch(err){
    throw err;
  }

}

module.exports = {
  SaveFriend,
  DeleteFriend,
  GetFriends
}