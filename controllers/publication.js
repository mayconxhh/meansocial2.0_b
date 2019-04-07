'use estrict'

const path = require('path');
const fs = require('fs');
const moment = require('moment');
const mongoosePagination = require('mongoose-pagination');

const Publication = require('../models/publication');
const User = require('../models/user');
const Follow = require('../models/follow');

function prueba(req, res){
  return res
      .status(200)
      .send({
        message: 'hola prro!!!'
      });
}

function NewPublication(req, res){

  let params = req.body;

  if (!params.text) {
    return res
              .status(200)
              .send({
                success:false,
                message: 'Debes enviar un texto!'
              });
  }

  let publication = new Publication();
  publication.file = null;
  publication.text = params.text
  publication.createAd = moment().unix();
  publication.user = req.user.sub;

  publication.save((err, publication)=>{

    if (err) {

      return res
                .status(500)
                .send({
                  success: false,
                  message: 'Error al guardar publicación.',
                  err
                })

    }

    if (!publication) {
      return res
                .status(404)
                .send({
                  success: false,
                  message: 'No se guardo la publicación.',
                  err
                })
    }

    return res
              .status(200)
              .send({
                success: true,
                publication
              })

  })

}

function GetPublications(req, res){

  let userId = req.params.id || req.user.sub;
  let page = req.params.page || 1;
  let itemsForPage= 5;

  Follow
        .find({ user: userId })
        .populate('followed', { password: 0})
        .exec((err, follows)=>{
          if (err) {

            return res
                      .status(500)
                      .send({
                        success: false,
                        message: 'Error al devolver seguimiento.',
                        err
                      })

          }

          if (follows.lenght === 0) {
            return res
                      .status(404)
                      .send({
                        success: false,
                        message: 'No ubicaron follows.',
                        err
                      })
          }

          let follows_clean = [];
          follows.forEach(follow=>{
            follows_clean.push(follow.followed)
          });

          follows_clean.push(req.user.sub);

          Publication
                    .find({ user: { $in: follows_clean }})
                    .sort('-createAd')
                    .populate('user', { password: 0 })
                    .paginate( page, itemsForPage, ( err, publications, total )=>{

                      if (err) {

                        return res
                                  .status(500)
                                  .send({
                                    success: false,
                                    message: 'Error al devolver publicaciones.',
                                    err
                                  })

                      }

                      if (!publications) {
                        return res
                                  .status(404)
                                  .send({
                                    success: false,
                                    message: 'No se ubicaron publicaciones.',
                                    err
                                  })
                      }

                      return res
                                .status(200)
                                .send({
                                  success: true,
                                  publications,
                                  total_items: total,
                                  itemsForPage,
                                  pages: Math.ceil(total/itemsForPage),
                                  page
                                })

                    })
        })

}

function GetPublicationsUser(req, res){

  let userId = req.params.id;
  let page = req.params.page || 1;
  let itemsForPage= 5;
  
  Publication
            .find({ user: userId })
            .sort('-createAd')
            .populate('user', { password: 0 })
            .paginate( page, itemsForPage, ( err, publications, total )=>{

              if (err) {

                return res
                          .status(500)
                          .send({
                            success: false,
                            message: 'Error al devolver publicaciones.',
                            err
                          })

              }

              if (!publications) {
                return res
                          .status(404)
                          .send({
                            success: false,
                            message: 'No se ubicaron publicaciones.',
                            err
                          })
              }

              return res
                        .status(200)
                        .send({
                          success: true,
                          publications,
                          total_items: total,
                          itemsForPage,
                          pages: Math.ceil(total/itemsForPage),
                          page
                        })

            })

}

function GetPublication(req, res){

  let publicationId = req.params.id;


  Publication
            .findById(publicationId)
            .populate('user', { password:0 })
            .exec((err, publication)=>{
              if (err) {

                return res
                          .status(500)
                          .send({
                            success: false,
                            message: 'Error al devolver publicación.',
                            err
                          })

              }

              if (!publication) {
                return res
                          .status(404)
                          .send({
                            success: false,
                            message: 'No se ubicó publicación.',
                            err
                          })
              }

              return res
                        .status(200)
                        .send({
                          success: true,
                          publication
                        })
            })

}

function DeletePublication(req, res){

  let publicationId = req.params.id;
  let userId = req.user.sub;

  Publication
            .findById( publicationId )
            .exec((err, publication)=>{

              if (err) {

                return res
                        .status(500)
                        .send({
                          success: false,
                          message: 'Error al obtener publicación.',
                          err
                        })

              }

              if (!publication) {
                return res
                        .status(404)
                        .send({
                          success: false,
                          message: 'No se encontró publicación.'
                        })
              }

              if (userId != publication.user) {
                return res
                        .status(500)
                        .send({
                          success: false,
                          message: 'No tienes los permisos necesarios.'
                        });
              }

              Publication
                        .findByIdAndDelete( publicationId )
                        .exec((err)=>{
                          if (err) {

                            return res
                                    .status(500)
                                    .send({
                                      success: false,
                                      message: 'Error al obtener publicación.',
                                      err
                                    })

                          }

                          return res
                                  .status(200)
                                  .send({
                                    success: true,
                                    message: 'Publicación eliminada.'
                                  })
                          
                        });


            });

}

function UploadImage(req, res){

  let publicationId = req.params.id;
  let userId = req.user.sub;

  if ( req.files.file ) {

    let filePath = req.files.file.path;
    let fileSplit = filePath.split('\\');
    let fileName = fileSplit[2];
    let extSplit = fileName.split('\.');
    let fileExt = extSplit[1];

    if ( fileExt === 'png' || fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'gif' ) {
      
      Publication
        .findById( publicationId )
        .exec((err, publication)=>{

          if (err) {
            return res
                      .status(500)
                      .send({
                        success: false,
                        message: 'Error en la petición.',
                        err: err
                      });
          }

          if (!publication) {
            return res
                    .status(404)
                    .send({
                      success: false,
                      message: 'No se encontró la publicación.',
                      err: err
                    });
          }
          
          if ( userId != publication.user ) {
            let message = 'No tienes los permisos necesarios.';
            return RemoveFileUpload( res, filePath, message );
          }

          Publication
              .findByIdAndUpdate( publicationId, { file: fileName }, { new: true })
              .exec((err, publication)=>{

                if (err) {
                  return res
                            .status(500)
                            .send({
                              success: false,
                              message: 'Error en la petición de actualizacion.',
                              err: err
                            });
                }

                if (!publication) {
                  return res
                          .status(404)
                          .send({
                            success: false,
                            message: 'La publicación no se pudo actualizar.',
                            err: err
                          });
                }
                console.log(publication)
                return res
                        .status(200)
                        .send({
                          success: true,
                          message: 'El usuario se ha actualizado.',
                          publication
                        });
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

}

function RemoveFileUpload(res, filePath, message){
  fs.unlink( filePath, err=>{

    return res
            .status(500)
            .send({
              success: false,
              message: message
            });

  })
}

function GetImageFile(req, res){

  let imageFile = req.params.imageFile;
  let filePath = './upload/publications/'+imageFile;

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
  prueba,
  NewPublication,
  GetPublications,
  GetPublicationsUser,
  GetPublication,
  DeletePublication,
  UploadImage,
  GetImageFile
}