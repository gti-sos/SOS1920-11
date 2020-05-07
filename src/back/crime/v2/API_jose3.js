const path = require('path');
const express = require('express');

var router = express.Router();
module.exports = router;
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const lenparametros = 15;
const BASE_API_URL = '/api/v1';
const dataStore = require('nedb');
const dbfile = path.join(__dirname, 'crimes.db');

// inicializaciรณn de base de datos

var db = new dataStore({ filename: dbfile, autoload: true });

//route handler
router.use(function procesador(req, res, next) {
	console.log('Tratamiento de los crimenes');
	next();
});

//loadInitialData

var init = [
	{
        country: 'Venezuela',
        year: 2016,
        cr_rate: 84.49,
        cr_saferate: 15.51,
        cr_homicrate: 56.3,
        cr_homicount: 17778,
        cr_theftrate: 1139.39,
        cr_theftcount: 213769
    },
    {
        country: 'España',
        year: 2016,
        cr_rate: 31.77,
        cr_saferate: 68.23,
        cr_homicrate: 0.6,
        cr_homicount: 276,
        cr_theftrate: 422.21,
        cr_theftcount: 195910
    },
    {
        country: 'Brasil',
        year: 2017,
        cr_rate: 70.62,
        cr_saferate: 29.38,
        cr_homicrate: 30.5,
        cr_homicount: 63895,
        cr_theftrate: 126.7,
        cr_theftcount: 256418
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
	db.remove({}, { multi: true }, function(err, numRemoved) {});
	console.log("cargando datos ")
	db.insert(init);
	//efis=init;
	res.sendStatus(201, 'DATA CREATED');
});

//post un efi en efis
router.post('/', (req, res) => {
	var newcrime = req.body;

	if (newcrime == '' || newcrime.country == null) {
		//no es ni remotamente indexable.
		res.sendStatus(400, 'BAD REQUEST');
	} else if ('_id' in newcrime) {
		//el cuerpo no puede tener el campo _id
		res.sendStatus(400, 'BAD REQUEST');
	} else if (sizeOfObject(newcrime) != lenparametros) {
		//falan o sobran parametros
		res.sendStatus(400, 'BAD REQUEST');
	} else if (newcrime.country == "" || newcrime.year== "") {
		//falan nombre o año de pais
		res.sendStatus(400, 'BAD REQUEST');
	} else {
		//todo en orden
		db.insert(newcrime);
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
					console.log('get crimes');
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
			console.log('get specific crime');
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
	console.log("borrando crimen....")
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