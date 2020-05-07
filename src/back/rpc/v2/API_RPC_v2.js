const path = require('path');
const express = require('express');

var router = express.Router();
module.exports = router;
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const lenparametros = 9;
const BASE_API_URL = '/api/v2';
const dataStore = require('nedb');
const dbfile = path.join(__dirname, 'rpc.db');

// inicializaciรณn de base de datos

var db = new dataStore({ filename: dbfile, autoload: true });


//route handler
router.use(function procesador(req,res,next){
	console.log('Tratamiento de las rpc');
	next();
});

//load initial data
router.get('/loadInitialData',(req,res)=>{
	db.remove({}, { multi: true }, function(err, numRemoved) {
	});
	var init=[{ 
		'country': "Spain",
		'year': 2019,
		'rpc':26420,
		'piba':1244757,
		'pib1t':306678,
		'pib2t':310381,
		'pib3t':311917,
		'pib4t':315781,
		'vpy': 2.0	
	},
	{ 
		'country': "Slovenia",
		'year': 2019,
		'rpc':22980,
		'piba':48007,
		'pib1t':11900,
		'pib2t':11961,
		'pib3t':12104,
		'pib4t':12200,
		'vpy': 2.4
	},
	{ 
		'country': "Slovakia",
		'year': 2019,
		'rpc':17270,
		'piba':94177,
		'pib1t':23205,
		'pib2t':23402,
		'pib3t':23614,
		'pib4t':23955,
		'vpy': 2.3
	},
	{ 
		'country': "Portugal",
		'year': 2019,
		'rpc':20650,
		'piba':212254,
		'pib1t':52641,
		'pib2t':52666,
		'pib3t':53256,
		'pib4t':53691,
		'vpy': 2.2
	},
	{ 
		'country': "France",
		'year': 2019,
		'rpc':36060,
		'piba':2418997,
		'pib1t':599741,
		'pib2t':603961,
		'pib3t':607191,
		'pib4t':608993,
		'vpy': 1.3
	},
	{ 
		'country': "Denmark",
		'year': 2019,
		'rpc':53370,
		'piba':310576,
		'pib1t':78703,
		'pib2t':78258,
		'pib3t':77397,
		'pib4t':76579,
		'vpy': 2.2
	},
	{ 
		'country': "Brasil",
		'year': 2018,
		'rpc':7562,
		'piba':1584004,
		'pib1t':403131,
		'pib2t':376765,
		'pib3t':398160,
		'pib4t':425216,
		'vpy': 1.3
	},
	{ 
		'country': "Germany",
		'year': 2019,
		'rpc':41350,
		'piba':3435990,
		'pib1t':869130,
		'pib2t':862026,
		'pib3t':856448,
		'pib4t':853979,
		'vpy': 0.5
	},
	{ 
		'country': "Japan",
		'year': 2018,
		'rpc':33160,
		'piba':4195748,
		'pib1t':1142622,
		'pib2t':1169622,
		'pib3t':1125686,
		'pib4t':1104669,
		'vpy': 0.7
	},
	{ 
		'country': "Italia",
		'year': 2019,
		'rpc': 29610,
		'piba':1787664,
		'pib1t':448217,
		'pib2t':447673,
		'pib3t':445847,
		'pib4t':445572,
		'vpy': 0.3
	},
	{ 
		'country': "Italia",
		'year': 2018,
		'rpc': 29220,
		'piba':1765421,
		'pib1t':442365,
		'pib2t':440953,
		'pib3t':442171,
		'pib4t':440378,
		'vpy': 0.8
	},
	{ 
		'country': "Italia",
		'year': 2017,
		'rpc': 28690,
		'piba': 1736602,
		'pib1t':439706,
		'pib2t':435928,
		'pib3t':433200,
		'pib4t':429565,
		'vpy': 1.7
	}];

	db.insert(init);
	res.sendStatus(201,"DATA CREATED");
});

// GET RPC
router.get('/', (req, res) => {
	var query = req.query;
	var parametros = [];
	// parseo manual de cada parametro posible dentro de una búsqueda
	for (x in query) {
		var objeto = {};
		if (x == 'country') {
			objeto[x] = query[x];
		} else if (x == 'vpy') {
			objeto[x] = parseFloat(query[x]);
		} else if (x != 'limit' && x != 'offset') {
			objeto[x] = parseInt(query[x]);
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
					console.log('get rpcs');
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
					if (indices.length!=0) {
						res.send(JSON.stringify(indices, null, 2));
						console.log('Data sent: ' + JSON.stringify(indices, null, 2));
					} else {
						res.sendStatus(404, 'NOT FOUND');
					}
				});
			console.log('get specific rpc');
		}
	} else {
		if (isEmpty(query)) {
			//no hay parametros de búsqueda y se hace una búsqueda normal
			console.log('Buscando todos los rpcs');
			db.find({}, { _id: 0 }, (err, indexes) => {
				//res.send(indexes);
				console.log('get rpcs');
				if (indexes.length != 0 ) {
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
			console.log('get specific rpc');
		}
	}
});

// POST RPC
router.post('/', (req, res) => {
	var newRpc = req.body;

	if (newRpc == '' || newRpc.country == null) {
		//no es ni remotamente indexable.
		res.sendStatus(400, 'BAD REQUEST');
	} else if ('_id' in newRpc) {
		//el cuerpo no puede tener el campo _id
		res.sendStatus(400, 'BAD REQUEST');
	} else if (sizeOfObject(newRpc) != lenparametros) {
		//falan o sobran parametros
		res.sendStatus(400, 'BAD REQUEST');
	} else {
		//todo en orden
		db.insert(newRpc);
		res.sendStatus(201, 'CREATED');
	}
});

// DELETE RPC
router.delete('/', (req, res) => {
	db.remove({}, { multi: true }, function(err, numRemoved) {
		res.sendStatus(200, 'OK, resource destroyed');
	});
});



// PUT RPC/COUNTRY/YEAR

router.put('/:country/:year', (req, res) => {
	var p1 = {};
	var p2 = {};
	p1["country"]=req.params.country;
	p2["year"]=parseInt(req.params.year);
	var parametros=[];
	parametros.push(p1,p2)
	var body = req.body;
	var len = sizeOfObject(body);
	if (len != lenparametros) {
		res.sendStatus(400, 'BAD REQUEST');
	} else {
		db.update(
			{ $and: parametros },
			{ $set: body },
			{},
			(error, numUpdate) => {
				if (numUpdate > 0) {
					res.sendStatus(200, 'OK');
				} else {
					res.sendStatus(404, 'NOT FOUND');
				}
			}
		);
	}
});


//DELETE RPC/COUNTRY/YEAR

router.delete('/:country/:year', (req, res) => {
	var p1 = {};
	var p2 = {};
	p1["country"]=req.params.country;
	p2["year"]=parseInt(req.params.year);
	var parametros=[];
	parametros.push(p1,p2)
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

//GET RPC/COUNTRY/YEAR

router.get('/:country/:year', (req, res) => {
	var p1 = {};
	var p2 = {};
	p1["country"]=req.params.country;
	p2["year"]=parseInt(req.params.year);
	var parametros=[];
	parametros.push(p1,p2)
			db
				.find({ $and : parametros}, { _id: 0 })
				.exec((err, indexes) => {
					//res.send(indexes);
					console.log('get rpc');
					if (!isEmpty(indexes)) {
						res.send(indexes[0]);
						console.log('Data sent: ' + JSON.stringify(indexes, null, 2));
					} else {
						res.sendStatus(404, 'NOT FOUND');
					}
				});
	
});

//post specific rpc --> wrong method

router.post('/:country', (req,res)=>{
	res.sendStatus(405,"METHOD NOT ALLOWED");
});


//put to base route --> wrong method

router.put('/', (req,res)=>{
	res.sendStatus(405,"METHOD NOT ALLOWED");
});

//funciones auxiliares

function isEmpty(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) return false;
	}
	return true;
}

function sizeOfObject(obj) {
	return Object.keys(obj).length;
}


