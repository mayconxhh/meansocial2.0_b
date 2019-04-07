'use strict'

// const path = require('path');
// const fs = require('fs');
const mongoosePaginate = require('mongoose-pagination');
const User = require('../models/user');
const Follow = require('../models/follow');
const Friend = require('../models/friend');
const FriendRequest = require('../models/friendRequest');

function SaveFollow(req, res){
  let params = req.body;
  let follow = new Follow();
  follow.user = req.user.sub;
  follow.followed = params.followed;

  follow
    .save((err, user)=>{

      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al realizar el seguimiento',
                  err
                });

      }

      if (!user) {
        return res
                .status(404)
                .send({
                  success:false,
                  message: 'No se completó la operación'
                });
      }

      return res
              .status(200)
              .send({
                success:true,
                follow,
              });

    })
}

function DeleteFollow(req, res){
  let userId = req.user.sub;
  let followId = req.params.id

  Follow
    .find({ 'user': userId, 'followed': followId })
    .remove(err=>{
      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al realizar el seguimiento',
                  err
                });

      }

      return res
              .status(200)
              .send({
                success: true,
                message: 'El follow se ha elimindo con éxito'
              });
    });
}

function GetUserFollowing(req, res){

  let userId = req.params.id && req.params.page ? req.params.id : req.user.sub;

  let page = req.params.page ? req.params.page : req.params.id || 1 ;

  let itemsForPage = 10;

  Follow
    .find({ user: userId })
    .populate( 'followed', 'email name lastname image nick role _id' )
    .paginate( page , itemsForPage, ( err, follows, total )=>{

      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al realizar el seguimiento',
                  err
                });

      }

      if (!follows) {

        return res
                .status(404)
                .send({
                  success:false,
                  message: 'No se encontraron follows'
                });

      }

      FollowUserId( req.user.sub ).then(fl=>{
        return res
                .status(200)
                .send({
                  success:true,
                  follows,
                  total,
                  friends:fl.myfriendsAll,
                  users_following: fl.following_clean,
                  users_followed: fl.followed_clean,
                  pages: Math.ceil(total/itemsForPage)
                });
      })

    });

}

function GetUserFollowed(req, res){

  let userId = req.params.id && req.params.page ? req.params.id : req.user.sub;

  let page = req.params.page ? req.params.page : req.params.id || 1 ;

  let itemsForPage = 10;

  Follow
    .find({ followed: userId })
    .populate( 'user', 'email name lastname image nick role _id' )
    .paginate( page , itemsForPage, ( err, follows, total )=>{

      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al realizar el seguimiento',
                  err
                });

      }

      if (!follows) {

        return res
                .status(404)
                .send({
                  success:false,
                  message: 'No se encontraron follows'
                });

      }

      FollowUserId( req.user.sub ).then(fl=>{
        return res
                .status(200)
                .send({
                  success:true,
                  follows,
                  total,
                  friends:fl.myfriendsAll,
                  users_following: fl.following_clean,
                  user_solicited: fl.friends_solicited,
                  users_followed: fl.followed_clean,
                  pages: Math.ceil(total/itemsForPage)
                });        
      })


    });

}

function GetFollows(req, res){

  let userId = req.user.sub;

  let find = req.params.followed ? Follow.find({ followed: userId }) : Follow.find({ user: userId })

  find
    .populate(' user followed ', 'email name lastname image nick role _id')
    .exec((err, follows)=>{
      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al realizar el seguimiento',
                  err
                });

      }

      if (!follows) {

        return res
                .status(404)
                .send({
                  success:false,
                  message: 'No se encontraron follows'
                });

      }

      return res
              .status(200)
              .send({
                success:true,
                follows
              });

  });

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

    let myfriends = await Friend
                            .find({ user: userId })
                            .select({ '_id': 0, '__v':0, 'user': 0 })
                            .exec()

    let following_clean = [];
    let friends_solicited = [];
    let followed_clean = [];
    let myfriendsAll = [];

    following.forEach((follow)=>{
      following_clean.push(follow.followed);
    })

    followed.forEach((follow)=>{
      followed_clean.push(follow.user);
    })

    console.log(userId)
    myAddFriends.forEach((request)=>{
      console.log(request)
      friends_solicited.push(request.requested);
    })

    myfriends.forEach((friend)=>{
      myfriendsAll.push(friend.friend);
    })

    return {
      following_clean,
      followed_clean,
      myfriendsAll,
      friends_solicited
    }

  } catch(err){
    throw err;
  }

}

module.exports = {
  SaveFollow,
  DeleteFollow,
  GetUserFollowing,
  GetUserFollowed,
  GetFollows
}