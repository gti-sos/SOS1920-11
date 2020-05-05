const path = require('path');
const express = require('express');

var router = express.Router();
module.exports = router;
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const lenparametros = 15;
const BASE_API_URL = '/api/v1';
const dataStore = require('nedb');
const dbfile = path.join(__dirname, 'efis.db');

// inicializaciรณn de base de datos

var db = new dataStore({ filename: dbfile, autoload: true });

//route handler
router.use(function procesador(req, res, next) {
	console.log('Tratamiento de los efi');
	next();
});

//loadInitialData
//import initialdata from 'initialdata.js';
var init = [
	{
		country: 'New Zeland',
		year: 2019,
		efiindex: 84.4,
		efigovint: 95,
		efipropright: 96.7,
		efijudefct: 83.5,
		efitaxburden: 71,
		efigovspend: 50.4,
		efisicalhealth: 98.6,
		efibusfreed: 91,
		efilabfreed: 86.7,
		efimonfreed: 87.5,
		efitradefreed: 92.4,
		efiinvfreed: 80,
		efifinfred: 80
	},
	{
		country: 'Chile',
		year: 2019,
		efiindex: 75.4,
		efigovint: 62.3,
		efipropright: 68.7,
		efijudefct: 56.3,
		efitaxburden: 77.3,
		efigovspend: 81,
		efisicalhealth: 89,
		efibusfreed: 76.6,
		efilabfreed: 65,
		efimonfreed: 84.5,
		efitradefreed: 88.8,
		efiinvfreed: 85,
		efifinfred: 70
	}
]
;

function isEmpty(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) return false;
	}
	return true;
}

function sizeOfObject(obj) {
	return Object.keys(obj).length;
}

router.get('/loadInitialData', (req, res) => {
	//var init = require("./initaldata.json");
	db.insert(init);
	//efis=init;
	res.sendStatus(201, 'DATA CREATED');
});

//post un efi en efis
router.post('/', (req, res) => {
	var newefi = req.body;

	if (newefi == '' || newefi.country == null) {
		//no es ni remotamente indexable.
		res.sendStatus(400, 'BAD REQUEST');
	} else if ('_id' in newefi) {
		//el cuerpo no puede tener el campo _id
		res.sendStatus(400, 'BAD REQUEST');
	} else if (sizeOfObject(newefi) != lenparametros) {
		//falan o sobran parametros
		res.sendStatus(400, 'BAD REQUEST');
	} else {
		//todo en orden
		db.insert(newefi);
		res.sendStatus(201, 'CREATED');
	}
});

//get efi or efis
router.get('/', (req, res) => {
	var query = req.query;
	var parametros = [];
	// parseo manual de cada parametro posible dentro de una búsqueda
	for (x in query) {
		var objeto = {};
		if (x == 'country') {
			objeto[x] = query[x];
		} else if (x == 'year') {
			objeto[x] = parseInt(query[x]);
		} else if (x != 'limit' && x != 'offset') {
			objeto[x] = parseFloat(query[x]);
			
			
		}
		parametros.push(objeto);
	}

	//limit y offset van a parte
	var limit = parseInt(query.limit);
	var offset = parseInt(query.offset);

	//si los parametros de paginación y offset están activos, se harán las consultas
	//integrando la paginación. en caso contrario se hará una query general
	if (!isNaN(limit) || !isNaN(offset)) {
		if (isEmpty(query)) {
			//no hay parametros de búsqueda y se hace una búsqueda normal
			db
				.find({}, { _id: 0 })
				.skip(offset)
				.limit(limit)
				.exec((err, indexes) => {
					//res.send(indexes);
					console.log('get efis');
					if (!isEmpty(indexes)) {
						res.send(indexes);
						console.log('Data sent: ' + JSON.stringify(indexes, null, 2));
					} else {
						res.sendStatus(404, 'NOT FOUND');
					}
				});
		} else {
			//hay parametros para buscar, se pasa por un filtro $and

			db
				.find({ $and: parametros }, { _id: 0 })
				.skip(offset)
				.limit(limit)
				.exec((err, indices) => {
					if (indices.length != 0) {
						var index_res = indices;
						res.send(JSON.stringify(index_res, null, 2));
						console.log('Data sent: ' + JSON.stringify(indices, null, 2));
					} else {
						res.sendStatus(404, 'NOT FOUND');
					}
				});
			console.log('get specific efi');
		}
	} else {
		if (isEmpty(query)) {
			//no hay parametros de búsqueda y se hace una búsqueda normal
			console.log('Buscando todos los efi');
			db.find({}, { _id: 0 }, (err, indexes) => {
				//res.send(indexes);
				console.log('get efis');
				if (indexes.length != 0) {
					res.send(indexes);
					console.log('Data sent: ' + JSON.stringify(indexes, null, 2));
				} else {
					res.sendStatus(404, 'NOT FOUND');
				}
			});
		} else {
			//hay parametros para buscar, se pasa por un filtro $and

			db.find({ $and: parametros }, { _id: 0 }, (err, indices) => {
				if (indices.length > 0) {
					res.send(JSON.stringify(indices, null, 2));
					console.log('Data sent: ' + JSON.stringify(indices, null, 2));
				} else {
					res.sendStatus(404, 'NOT FOUND');
				}
			});
			console.log('get specific efi');
		}
	}
});
//acceso a recurso especifico
router.get('/:country/:year', (req, res) => {
	var p1 = {};
	var p2 = {};
	p1['country'] = req.params.country;
	p2['year'] = parseInt(req.params.year);
	var parametros = [];
	parametros.push(p1, p2);
	db.find({ $and: parametros }, { _id: 0 }, (err, indices) => {
		if (indices.length > 0) {
			res.send(JSON.stringify(indices[0], null, 2));
			console.log('Data sent: ' + JSON.stringify(indices[0], null, 2));
		} else {
			res.sendStatus(404, 'NOT FOUND');
		}
	});
});
//delete specific efi

router.delete('/:country/:year', (req, res) => {
	var p1 = {};
	var p2 = {};
	p1['country'] = req.params.country;
	p2['year'] = parseInt(req.params.year);
	var parametros = [];
	parametros.push(p1, p2);
	db.remove({ $and: parametros }, {}, (error, numDel) => {
		if (numDel > 0) {
			//se ha borrado un elemento
			res.sendStatus(200, 'OK');
		} else {
			// no se ha borrado nada. se ha accedido mal al elemento
			res.sendStatus(404, 'NOT FOUND');
		}
	});
});

//PUT specific efi

router.put('/:country/:year', (req, res) => {
	var p1 = {};
	var p2 = {};
	p1['country'] = req.params.country;
	p2['year'] = parseInt(req.params.year);
	var parametros = [];
	parametros.push(p1, p2);
	var body = req.body;
	var len = sizeOfObject(body);
	if (len != lenparametros) {
		res.sendStatus(400, 'BAD REQUEST');
	} else {
		db.update({ $and: parametros }, { $set: body }, {}, (error, numUpdate) => {
			if (numUpdate > 0) {
				res.sendStatus(200, 'OK');
			} else {
				res.sendStatus(404, 'NOT FOUND');
			}
		});
	}
});

//post specific efi --> wrong method

router.post('/:country/:year', (req, res) => {
	res.sendStatus(405, 'METHOD NOT ALLOWED');
});

//put to base route --> wrong method

router.put('/', (req, res) => {
	res.sendStatus(405, 'METHOD NOT ALLOWED');
});

// DELETE base route deletes efis resource

router.delete('/', function(req, res) {
	db.remove({}, { multi: true }, function(err, numRemoved) {
		res.sendStatus(200, 'OK, resource destroyed');
	});
});