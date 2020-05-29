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
	},
	{
		country: 'Afganistan',
		year: 2020,
		efiindex: 54.7,
		efigovint: 24.8,
		efipropright: 48.3,
		efijudefct: 30.0,
		efitaxburden: 91.4,
		efigovspend: 79.2,
		efisicalhealth: 99.9,
		efibusfreed: 54.7,
		efilabfreed: 61.6,
		efimonfreed:  81.0 ,
		efitradefreed:  66.0 ,
		efiinvfreed:  10.0 ,
		efifinfred:  10.0 
	},
	{
		country: 'Belarus',
		year: 2020,
		efiindex: 61.7,
		efigovint: 37.4,
		efipropright: 63.2,
		efijudefct: 48.4,
		efitaxburden: 88.8,
		efigovspend: 54.1,
		efisicalhealth: 95.4,
		efibusfreed: 76.4,
		efilabfreed: 74.8,
		efimonfreed:  69.8 ,
		efitradefreed:  82.0,
		efiinvfreed:  20.0,
		efifinfred:  30.0 
	},
	{
		country: 'Moldova',
		year: 2020,
		efiindex: 62.0,
		efigovint: 37.2,
		efipropright: 60.5,
		efijudefct: 31.7,
		efitaxburden: 86.1,
		efigovspend: 71.6,
		efisicalhealth: 96.2,
		efibusfreed: 68.1,
		efilabfreed: 37.0,
		efimonfreed:  72.0,
		efitradefreed:  78.0,
		efiinvfreed:  55.0,
		efifinfred:  50.0 
	},
	{
		country: 'Samoa',
		year: 2020,
		efiindex: 62.1,
		efigovint: 31.5,
		efipropright: 60.5,
		efijudefct: 31.7,
		efitaxburden: 79.6,
		efigovspend: 62.5,
		efisicalhealth: 94.6,
		efibusfreed: 76.6,
		efilabfreed: 78.8,
		efimonfreed:  79.5,
		efitradefreed: 64.6,
		efiinvfreed: 55.0,
		efifinfred:  30.0 
	},
	{
		country: 'Ireland',
		year: 2020,
		efiindex: 80.9,
		efigovint: 82.8,
		efipropright: 86.6,
		efijudefct: 64.4,
		efitaxburden: 76.4,
		efigovspend: 78.8,
		efisicalhealth: 91.4,
		efibusfreed: 82.7,
		efilabfreed: 75.9,
		efimonfreed:  85.3,
		efitradefreed:  86.4,
		efiinvfreed:  90.0,
		efifinfred:  70.0 
	},
	{
		country: 'Switzerland',
		year: 2020,
		efiindex: 82.0,
		efigovint: 90.1,
		efipropright: 87.4,
		efijudefct: 81.5,
		efitaxburden: 70.1,
		efigovspend: 65.3,
		efisicalhealth: 96.7,
		efibusfreed: 74.2,
		efilabfreed: 72.4,
		efimonfreed: 84.4,
		efitradefreed: 86.6,
		efiinvfreed: 85.0,
		efifinfred: 90.0 
	},
	{
		country: 'Australia',
		year: 2020,
		efiindex: 82.6,
		efigovint: 89.3,
		efipropright: 82.8,
		efijudefct: 86.1,
		efitaxburden: 63.0,
		efigovspend: 61.6,
		efisicalhealth: 91.8,
		efibusfreed: 87.8,
		efilabfreed: 84.0,
		efimonfreed: 86.2,
		efitradefreed: 88.2,
		efiinvfreed: 80.0,
		efifinfred: 90.0 
	},
	{
		country: 'Portugal',
		year: 2020,
		efiindex: 67.0,
		efigovint: 68.9,
		efipropright: 75.4,
		efijudefct: 65.6,
		efitaxburden: 59.6,
		efigovspend: 39.8,
		efisicalhealth: 74.4,
		efibusfreed: 76.5,
		efilabfreed: 44.1,
		efimonfreed: 83.0,
		efitradefreed: 86.4,
		efiinvfreed: 70.0,
		efifinfred: 60.0 
	},
	{
		country: 'Panama',
		year: 2019,
		efiindex: 68.2,
		efigovint: 38.2,
		efipropright: 58.8,
		efijudefct: 30.0,
		efitaxburden: 85.3,
		efigovspend: 85.7,
		efisicalhealth: 91.2,
		efibusfreed: 70.8,
		efilabfreed: 43.3,
		efimonfreed: 79.4,
		efitradefreed: 79.2,
		efiinvfreed: 75.0,
		efifinfred: 70.0 
	},{
		country: 'Panama',
		year: 2020,
		efiindex: 67.2,
		efigovint: 37.2,
		efipropright: 58.8,
		efijudefct: 30.0,
		efitaxburden: 85.3,
		efigovspend: 85.7,
		efisicalhealth: 91.2,
		efibusfreed: 70.8,
		efilabfreed: 43.3,
		efimonfreed: 79.4,
		efitradefreed: 79.2,
		efiinvfreed: 75.0,
		efifinfred: 70.0 
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
	console.log("cargando datos ")
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
	} else if (newefi.country == "" || newefi.year== "") {
		//falan nombre o año de pais
		res.sendStatus(400, 'BAD REQUEST');
	} else {
		//buscamos si el objeto ya existe
		var p1 = {};
		var p2 = {};
		p1['country'] = req.body.country;
		p2['year'] = parseInt(req.body.year);
		var parametros = [];
		parametros.push(p1, p2);
		//todo en orden
		db.find({ $and: parametros }, { _id: 0 }, (err, indices) => {
			console.log("nº de matches: "+ indices);
			if (indices.length > 0) {
				res.sendStatus(400, 'BAD REQUEST');
			} else {
				db.insert(newefi);
			res.sendStatus(201, 'CREATED');
			}
		});
		
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
	console.log("borrando efi....")
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