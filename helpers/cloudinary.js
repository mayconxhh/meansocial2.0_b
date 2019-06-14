const multer            = require('multer');
const cloudinary        = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const ext               = require('file-extension');

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'Mean-Social-App',
  filename: function (req, file, cb){
    cb(null, +Date.now() + '.' + ext(file.originalname))
  },
});

// const upload = multer({ storage: storage })

// var CloudinaryImage = new Promise(function(resolve, reject){
//   upload(req, res, function(err){
//     if (err) {
//       reject(new Error(err));
//     }
//     resolve(req.body);
//   })
// })

function CloudinaryImage(req, res, type){
	const upload = multer({ storage: storage }).single(type);
  return new Promise(function(resolve, reject){
  	// console.log(req);
    upload(req, res, function(err){
      if (err) {
        reject(new Error(err));
      }
      var data = {req: req, res: res};
      resolve(data);
    })
  })
}

function DeleteImage(file){
	return new Promise(function(resolve, reject){
		cloudinary.v2.api.delete_resources([file],
	  	function(error, result){
	  		if (error) {
	  		  reject(new Error(error));
	  		}
	  		console.log(result);
	  		resolve(result);
	  	}
	  );
	});
}

module.exports = {
	CloudinaryImage,
	DeleteImage
}