'use strict'

// const path = require('path');
// const fs = require('fs');
const mongoosePaginate = require('mongoose-pagination');
const FRequest = require('../models/friendRequest');
const Friend = require('../models/friend');
const Follow = require('../models/follow');

function SaveRequest(req, res){
  let params = req.body
  console.log(params)
  let fRequest = new FRequest();
  fRequest.user = req.user.sub;
  fRequest.requested = params.requested;

  fRequest.save((err, fRequest)=>{
    if (err) {

      return res
              .status(500)
              .send({
                success:false,
                message: 'Ocurrió un error al enviar la solicitud.',
                err
              });

    }

    if (!fRequest) {
      return res
              .status(404)
              .send({
                success:false,
                message: 'No se pudo enviar la solicitud.'
              });
    }

    return res
            .status(200)
            .send({
              success:true,
              fRequest,
            });
  })
}

function DeleteRequest(req, res){
  let userId = req.user.sub;
  let requested = req.params.id;

  FRequest
    .find({ 'user': userId, 'requested': requested })
    .remove(err=>{
      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al cancelar solicitud.',
                  err
                });

      }

      return res
              .status(200)
              .send({
                success: true,
                message: 'La solicitud se ha elimindo con éxito'
              });
    })

}

function GetRequests(req, res){
  let requested = req.user.sub;

  let page = req.params.page || 1 ;

  let itemsForPage = 6;

  FRequest
    .find({ requested: requested })
    .populate( 'user', 'email name lastname image nick role _id' )
    .paginate( page , itemsForPage, ( err, requests, total )=>{

      if (err) {

        return res
                .status(500)
                .send({
                  success:false,
                  message: 'Ocurrió un error al obtener solicitudes.',
                  err
                });

      }

      if (!requests) {

        return res
                .status(404)
                .send({
                  success:false,
                  message: 'No se encontraron solicitudes.'
                });

      }

      FriendUserId(req.user.sub)
                .then(fl=>{
                  return res
                          .status(200)
                          .send({
                            success:true,
                            friends:fl.myfriendsAll,
                            friends_solicited: fl.friends_solicited,
                            users_following: fl.following_clean,
                            users_followed: fl.followed_clean,
                            requests,
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

    let myAddFriends = await FRequest
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

    myAddFriends.forEach((request)=>{
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
  SaveRequest,
  DeleteRequest,
  GetRequests
}
