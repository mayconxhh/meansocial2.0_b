'use strict'

const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination');

const User = require('../models/user');
const Follow = require('../models/follow');
const Message = require('../models/message');

function test( req, res ){
	return res
						.status(200)
						.send({
							message: 'Holi'
						});
}

function SendMessage( req, res ){

	let params = req.body;

	if (!params.text || !params.receiver) {
		return res
						.status(200)
						.send({
							success:false,
							message: 'El campo de texto esta vacio.'
						});
	}

	let message = new Message(params);
	message.emmiter = req.user.sub;
	message.createdAd = moment().unix();
	message.viewed = 'false';

	message.save((err, message)=>{
		if (err) {
			return res
							.status(500)
							.send({
								sucess:false,
								message: 'Ocurrió un error al guardar mensaje.',
								err
							});
		}

		if (!message) {
			return res
							.status(404)
							.send({
								success: false,
								message: 'Error al enviar mensaje.'
							});
		}

		return res
						.status(200)
						.send({
							success: true,
							message: message
						});
	})

}

function GetReceivedMessage( req, res ){

	let userId = req.user.sub;
	let page = req.params.page || 1;
	let itemsForPage = 5;

	Message
				.find({ receiver: userId })
				.populate('emmiter', { password:0, role:0, __v:0 })
				.paginate(page, itemsForPage, (err, messages, total)=>{

					if (err) {
						return res
										.status(500)
										.send({
											sucess:false,
											message: 'Ocurrió un error al obtener mensaje.',
											err
										});
					}

					if (!messages) {
						return res
										.status(404)
										.send({
											success: false,
											message: 'No se encontro mensajes.'
										});
					}

					return res
									.status(200)
									.send({
										success: true,
										messages,
										current_page: page,
										total,
										pages: Math.ceil(total/itemsForPage)
									});
				})
}

function GetEmmitedMessage( req, res ){

	let userId = req.user.sub;
	let page = req.params.page || 1;
	let itemsForPage = 5;

	Message
				.find({ emmiter: userId })
				.populate('emmiter receiver', { password:0, role:0, __v:0 })
				.paginate(page, itemsForPage, (err, messages, total)=>{

					if (err) {
						return res
										.status(500)
										.send({
											sucess:false,
											message: 'Ocurrió un error al obtener mensajes.',
											err
										});
					}

					if (!messages) {
						return res
										.status(404)
										.send({
											success: false,
											message: 'No hay mensajes.'
										});
					}

					return res
									.status(200)
									.send({
										success: true,
										messages,
										current_page: page,
										total,
										pages: Math.ceil(total/itemsForPage)
									});
				})
}

function GetUnviewedMessage( req, res ){

	let userId = req.user.sub;

	Message
				.countDocuments({ receiver: userId, viewed: 'false' })
				.exec((err, count)=>{

					if (err) {
						return res
										.status(500)
										.send({
											sucess:false,
											message: 'Ocurrió un error al obtener mensajes no vistos.',
											err
										});
					}

					return res
									.status(200)
									.send({
										success: false,
										unviewed: count
									});

				})

}

function SetViewedMessages( req, res ){
	let userId = req.user.sub;
	let messageId = req.params.id

	Message
				.update({ receiver: userId, viewed: false }, { viewed: 'true' }, { multi: true })
				.exec((err, messages)=>{

					if (err) {
						return res
										.status(500)
										.send({
											sucess:false,
											message: 'Ocurrió un error al obtener mensajes.',
											err
										});
					}

					if (!messages) {
						return res
										.status(404)
										.send({
											success: false,
											message: 'No se ha podido actualizar mensajes.'
										});
					}

					return res
									.status(200)
									.send({
										success: true,
										messages
									});

				})
}

module.exports = {
	test,
	SendMessage,
	GetReceivedMessage,
	GetEmmitedMessage,
	GetUnviewedMessage,
	SetViewedMessages
}

