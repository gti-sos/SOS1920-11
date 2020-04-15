const path = require('path');
const express = require('express');

var router = express.Router();
module.exports = router;
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const parametros = 15;
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
	}
];

function isEmpty(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) return false;
	}
	return true;
}

router.get('/loadInitialData', (req, res) => {
	//var init = require("./initaldata.json");
	db.insert(init);
	//efis=init;
	res.sendStatus(201, 'DATA CREATED');
});

//post efis
router.post('/', (req, res) => {
	var newefi = req.body;

	if (newefi == '' || newefi.country == null) {
		res.sendStatus(400, 'BAD REQUEST');
	} else {
		efis.push(newefi);
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
	if (!isNaN(limit) && !isNaN(offset)) {
		if (isEmpty(query)) {
			//no hay parametros de búsqueda y se hace una búsqueda normal
			db
				.find({}, { projection: { _id: 0 } })
				.skip(offset)
				.limit(limit)
				.toArray((err, indexes) => {
					//res.send(indexes);
					console.log('get efis');
					if (indexes != null) {
						res.send(indexes);
						console.log('Data sent: ' + JSON.stringify(indexes, null, 2));
					} else {
						res.sendStatus(404, 'NOT FOUND');
					}
				});
		} else {
			//hay parametros para buscar, se pasa por un filtro $and

			db
				.find({ $and: parametros }, { projection: { _id: 0 } })
				.skip(offset)
				.limit(limit)
				.toArray((err, indices) => {
					if (indices.length > 0) {
						res.send(JSON.stringify(indices, null, 2));
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
			db.find({},{_id:0}, (err, indexes) => {
				//res.send(indexes);
				console.log('get efis');
				if (indexes != null) {
					res.send(indexes);
					console.log('Data sent: ' + JSON.stringify(indexes, null, 2));
				} else {
					res.sendStatus(404, 'NOT FOUND');
				}
			});
		} else {
			//hay parametros para buscar, se pasa por un filtro $and

			db.find({ $and: parametros },{_id:0}, (err, indices) => {
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

//delete specific efi

router.delete('/:country/:year', (req, res) => {
	var country = req.params.country;
	var year = req.params.year;

	var efisfiltro = efis.filter(c => {
		return c.country != country || c.year != year;
	});

	if (efisfiltro.length < efis.length) {
		efis = efisfiltro;
		res.sendStatus(200);
	} else {
		res.sendStatus(404, 'COUNTRY NOT FOUND');
	}
});

//PUT specific efi

router.put('/:country/:year', (req, res) => {
	var country = req.params.country;
	var year = req.params.year;
	var efisfiltro = efis.filter(c => {
		return c.country == country && c.year == year;
	});

	if (efisfiltro.length == 0) {
		res.sendStatus(404, 'COUNTRY NOT FOUND');
	} else {
		var body = req.body;
		var len = 0;
		for (x in body) {
			len += 1;
		}
		if (len != parametros) {
			res.sendStatus(400, 'BAD REQUEST');
		} else {
			var nuevoefi = efis.map(c => {
				if (c.country == country) {
					c.country = body['country'];
					c.year = body['year'];
					c.efiindex = body['efiindex'];
					c.efigovint = body['efigovint'];
					c.efipropright = body['efipropright'];
					c.efijudefct = body['efijudefct'];
					c.efitaxburden = body['efitaxburden'];
					c.efigovspend = body['efigovspend'];
					c.efisicalhealth = body['efisicalhealth'];
					c.efibusfreed = body['efibusfreed'];
					c.efilabfreed = body['efilabfreed'];
					c.efimonfreed = body['efimonfreed'];
					c.efitradefreed = body['efitradefreed'];
					c.efiinvfreed = body['efiinvfreed'];
					c.efifinfred = body['efifinfred'];
				}
			});
			res.sendStatus(200, 'OK');
		}
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

router.delete('/', (req, res) => {
	efis = [];
	res.sendStatus(200, 'OK, resource destroyed');
});