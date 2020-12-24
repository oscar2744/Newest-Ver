const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const mongourl = 'mongodb+srv://gg3be0:63360163@cluster0.0ijrh.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 'test';
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');

const restSch = mongoose.Schema({
	"name": String,
	"cuisine": String,
	"street": String,
	"building": String,
	"zipcode": Number,
	"GPS(lon)": Number,
	"GPS(lat)": Number,
	img: {
		data: Buffer,
		contentType: String},
	grades:{
		user:String,
		score: Number},
	"owner":String
	});





const client = new MongoClient(mongourl, { useUnifiedTopology: true });

const insertDocument = (db, doc, callback) => {
    db.collection('rest').
    insertOne(doc, (err, result) => {
        assert.equal(err,null);
        console.log("inserted one document " + JSON.stringify(doc));
        callback(result,res);
    });
}




app.set('view engine','ejs');

const SECRETKEY = 'I want to pass COMPS381F';

var users = new Array(
	{name: 'developer', password: 'developer'},
	{name: 'demo', password: ''}
);

app.set('view engine','ejs');

app.use(session({
  name: 'loginSession',
  keys: [SECRETKEY]
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const findrestaurant = (db, criteria, callback) => {
    let cursor = db.collection('rests').find(criteria);
    //console.log(`findRestaurant: ${JSON.stringify(criteria)}`);
    cursor.toArray((err,docs) => {
        assert.equal(err,null);
        console.log(`findRestaurant: ${docs.length}`);
        callback(docs);
    });
}

const handle_select_all_restaurant = (res,req) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
	
	let num = db.collection('rests').find()
	    num.toArray((err,docs)=>{
			assert.equal(err,null);
			console.log(`rests count: ${docs.length}`)
			client.close()
			res.render('list', {c: docs,username: req.session.username,criteria:JSON.stringify({})});

	});
    });
}

app.get('/read', function(req,res) {
	handle_select_all_restaurant(res,req);
});



app.get('/', (req,res) => {
	console.log(req.session);
	if (!req.session.authenticated) {    // user not logged in!
		res.redirect('/login');
	} else {
		res.status(200).render('secrets',{name:req.session.username});
	}
});

app.get('/login', (req,res) => {
	res.status(200).render('login',{});
});


app.post('/login', (req,res) => {
	users.forEach((user) => {
		if (user.name == req.body.name && user.password == req.body.password) {
			// correct user name + password
			// store the following name/value pairs in cookie session
			req.session.authenticated = true;        // 'authenticated': true
			req.session.username = req.body.name;	 // 'username': req.body.name		
		}
	});
	res.redirect('/read');
});

app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});

app.get('/register',(req,res)=>{
	res.status(200).render('register',{})

});

app.post('/register',(req,res)=>{
	users.push({name:req.body.name,password:req.body.password});
	console.log(users);
	req.session.username= req.body.name;
	console.log(req.session.username);

});



app.use(multer({ dest: './uploads/', rename: function (fieldname, filename) {
	return filename;
	},
}));



app.get('/create',(req,res) => {
	res.status(200).render('create',{})
});

app.post('/create', function(req,res) {
	mongoose.connect(mongourl, {useNewUrlParser: true, useUnifiedTopology: true});
	let db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', (callback) => {
		const Rest = mongoose.model('rest', restSch);
		fs.readFile(req.files.img.path, (err,data) => {
		assert.equal(err,null);
		//var photo = new Buffer.from(data).toString('base64');		
		
		const obj = new Rest(
		{
		"name": req.body.name,
		"cuisine": req.body.cuisine,
		"street": req.body.street,
		"building": req.body.building,
		"zipcode": req.body.zipcode,
		"GPS(lon)": req.body.lon,
		"GPS(lat)": req.body.lat,
		"img": {
			"data": Buffer.from(data).toString('base64'),
			"contentType": 'image/png'
			},
		"owner": req.body.owner
                
		});
		obj.save((err) => {
			if (err) throw err 
			console.log('create successful!')
			db.close();
			});
		});
	});
});
app.listen(process.env.PORT || 8099);

