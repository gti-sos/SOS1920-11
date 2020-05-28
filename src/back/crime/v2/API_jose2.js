const express = require('express');
const bodyParser = require('body-parser');
var router = express.Router();
module.exports = router;
var app = express();
const lenparametros = 8;
const dataStore = require('nedb');
const path = require('path');

const dbFileName = path.join(__dirname, 'crimes.db');

const db = new dataStore({
    filename: dbFileName,
    autoload: true
});

app.use(bodyParser.json());

var crimeratestats = [
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
    },
    {
        country: 'Canadá',
        year: 2019,
        cr_rate: 40.00,
        cr_saferate: 60.00,
        cr_homicrate: 30.5,
        cr_homicount: 23895,
        cr_theftrate: 126.7,
        cr_theftcount: 16418
    }
];

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
	db.remove({}, { multi: true }, function (err, numRemoved) {
	});
	console.log("Enviando datos");
	db.insert(crimeratestats);
    res.sendStatus(201,"DATA CREATED");
    console.log('Datos enviados:' + JSON.stringify(crimeratestats, null, 2));
});
//const BASE_API_URL = "/api/v1";

// GET CONTACTS

router.get("/", (req,res) =>{
	
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
				.exec((err, crimes) => {
					//res.send(indexes);
					console.log('Get crimes');
					if (!isEmpty(crimes)) {
						res.send(crimes);
						console.log('Data sent: ' + JSON.stringify(crimes, null, 2));
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
				.exec((err, crimes) => {
					if (crimes.length != 0) {
						var crime_res = crimes;
						res.send(JSON.stringify(crime_res, null, 2));
						console.log('Data sent: ' + JSON.stringify(crimes, null, 2));
					} else {
						res.sendStatus(404, 'NOT FOUND');
					}
				});
			console.log('Get specific crime');
		}
	} else {
		if (isEmpty(query)) {
			//no hay parametros de búsqueda y se hace una búsqueda normal
			console.log('Buscando todos los crimenes');
			db.find({}, { _id: 0 }, (err, crimes) => {
				//res.send(indexes);
				console.log('Get crimes');
				if (crimes.length != 0) {
					res.send(crimes);
					console.log('Data sent: ' + JSON.stringify(crimes, null, 2));
				} else {
					res.sendStatus(404, 'NOT FOUND');
				}
			});
		} else {
			//hay parametros para buscar, se pasa por un filtro $and

			db.find({ $and: parametros }, { _id: 0 }, (err, crimes) => {
				if (crimes.length > 0) {
					res.send(JSON.stringify(crimes, null, 2));
					console.log('Data sent: ' + JSON.stringify(crimes, null, 2));
				} else {
					res.sendStatus(404, 'NOT FOUND');
				}
			});
			console.log('Get specific crime');
		}

    }
});

// POST CONTACTS

router.post('/', (req, res) => {
    var newCrime = req.body;

    if (newCrime == '' || newCrime.country == null) {
		//no es ni remotamente indexable.
		res.sendStatus(400, 'BAD REQUEST');
	} else if ('_id' in newCrime) {
		//el cuerpo no puede tener el campo _id
		res.sendStatus(400, 'BAD REQUEST');
	} else if (sizeOfObject(newCrime) != lenparametros) {
		//falan o sobran parametros
		res.sendStatus(400, 'BAD REQUEST');
	} else if (newCrime.country == "" || newCrime.year== "") {
		//falan nombre o año de pais
		res.sendStatus(400, 'BAD REQUEST');
	} else {
		//todo en orden
		db.insert(newCrime);
		res.sendStatus(201, 'CREATED');
	}
});

// DELETE CONTACTS

// GET CONTACT/XXX

router.get('/:country/:year', (req, res) => {
    var name = new Object();
    var year = new Object();
    name.name = req.params.country;
    year.year = parseInt(req.params.year);

    var limit = req.params.limit;
    var offset = req.params.offset;
    /*	var filteredCrimes = crimeratestats.filter((c) => {
		return (c.name == name);
	});
	
	
	if(filteredCrimes.length >= 1){
		res.send(filteredContacts[0]);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	} */

    db.find({ country: name, year: year }, function(err, crimes) {
        if (err) {
            res.sendStatus(404, 'COUNTRY NOT FOUND');
        }
        res.send(JSON.stringify(crimes, null, 2));
        console.log('Data sent:' + JSON.stringify(crimes, null, 2));
    });
});

// PUT CONTACT/XXX

router.put('/:country', (req, res) => {
    var country = req.params.country;
    var body = req.body;
    db.update(
        { country: country },
        {
            $set: {
                country: body['country'],
                year: parseInt(body['year']),
                cr_rate: parseFloat(body['cr_rate'])
            }
        },
        {},
        function(err, crimes) {
            if (err) {
                res.sendStatus(404, 'COUNTRY NOT FOUND');
            }
            res.sendStatus(200, 'OK');
        }
    );
});
router.delete('/:country/:year', (req, res) => {
    console.log("Borrando crimen...")
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

router.delete('/', (req, res) => {
    db.remove({}, { multi: true }, function(err, numRemoved) {
		res.sendStatus(200, 'OK, resource destroyed');
	});
});