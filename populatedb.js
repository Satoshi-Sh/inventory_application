#! /usr/bin/env node

console.log('This script populates some categoreis, items to your database');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require('async')
var Category = require('./models/category')
var Item = require('./models/item')


var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var categories = []
var items = []


function categoryCreate(name, description, cb) {
  var category = new Category({ name: name, description:description });
       
  category.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log('New Category: ' + category);
    categories.push(category)
    cb(null, category);
  }   );
}

function itemCreate(name, description, category, price, numberInStock, cb) {
  itemdetail = { 
    name: name,
    description: description,
    price: price,
    numberInStock:  numberInStock
  }
  if (category != false) itemdetail.category = category
    
  var item = new Item(itemdetail);    
  item.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New Item: ' + item);
    items.push(item)
    cb(null, item)
  }  );
}



function createCategories(cb) {
    async.series([
        function(callback) {
          categoryCreate("Guitar","Good to have one in a house." , callback);
        },
        function(callback) {
          categoryCreate("Piano","Instrument for anyone.", callback);
        },
        function(callback) {
          categoryCreate("Drums","Recommended if you have a spacious basement." , callback);
        },
        ],
        // optional callback
        cb);
}


function createItems(cb) {
    async.parallel([
        function(callback) {
          itemCreate('Yamaha Guitar', 'Guitar brand for begginers to advanced players.', [categories[0]], 250, 15, callback);
        },
        function(callback) {
            itemCreate('Gibson Guitar', 'Acoustic guitar everyone admires for.', [categories[0]], 600, 10, callback);
          },
        function(callback) {
            itemCreate('Yamaha Piano', 'Popular piano brand starndard model.', [categories[1]], 2200, 4, callback);
          },
        function(callback) {
            itemCreate('Electronic Piano', 'Reasonable price to enjoy playing.', [categories[1]], 200, 12, callback);
          },  
          function(callback) {
            itemCreate('Drum sets', "Begginer's starter set.", [categories[2]], 500, 9, callback);
          },   


        ],
        // optional callback
        cb);
}


async.series([
    createCategories,
    createItems,
],
// Optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('Items: '+items);
        
    }
    // All done, disconnect from database
    mongoose.connection.close();
});