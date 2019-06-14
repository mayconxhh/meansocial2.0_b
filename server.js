'use strict'

const mongoose = require('mongoose');

const app = require('./app');
var PORT = 5000;

// CONECTION DATABASE
mongoose.Promise = global.Promise;
mongoose.connect('',
	{
		useCreateIndex: true,
		useNewUrlParser: true,
		useFindAndModify: false
	})
	.then(()=>{
		console.log('Conexión con base de datos se a realizado con éxito');

		// CONECTION SERVER
		app.listen(PORT, () =>{
			console.log(`Servidor corriendo en el puerto:${PORT}`);
		});

	}, err =>{
		console.log(err);
	});
