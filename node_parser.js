const cheerio = require('cheerio');
const request = require('request');
const slug = require('slug');
const fs = require('fs');
const _ = require('lodash');

const URL = "http://www.vegan.si/ziveti-vegansko/prehrana/restavracije/";


var restaurants = [];

request(URL, function(error, response, body) {
    console.log(response.statusCode) // 200

    parseDOM(body);
  })

function parseDOM(dom) {
  var $ = cheerio.load(dom);

  $('table.table1 tr').each(function(i, row) {
    // skip table header
    if (i === 0) return;


    var type = undefined;
    var html_type = $('td:nth-child(1)', this).attr('title');
    if (html_type === 'veganska') type = 0;
    if (html_type === 'vegatarijanska') type = 1;
    if (html_type === 'veganom-naklonjena') type = 2;

    var name = undefined;
    var html_name = $('td:nth-child(2)', this).text();
    name = html_name

    name_slug = slug(name, '_');

    var address = undefined;
    var html_address = $('td:nth-child(3)', this).text().trim().replace(/\s\s+/g, ' ');
    if (html_address.length) address = html_address;

    var phone = undefined;
    var html_phone = $('td:nth-child(4)', this).text().trim().replace(/\s+/g, '');
    if (html_phone.length) phone = html_phone;

    var email = undefined;
    var html_email = $('td:nth-child(7) > a > i.icon-envelope', this).parent().attr('href');
    if (html_email && html_email.length) email = html_email.substr(7);

    var web = undefined;
    var html_web = $('td:nth-child(7) > a > i.icon-globe', this).parent().attr('href');
    if (html_web && html_web.length) web = html_web;

    var facebook = undefined;
    var html_facebook = $('td:nth-child(7) > a > i.icon-user', this).parent().attr('href');
    if (html_facebook && html_facebook.length) {
      facebook = html_facebook.trim();
      facebook = facebook.substring(0, facebook.indexOf('\\?') === -1 ? facebook.length : facebook.indexOf('?'))
    }


    var note = undefined;
    var html_note = $('td:nth-child(8)', this).text().trim();
    if (html_note.length) note = html_note;

    //console.log(i, type, name, phone, address, email, web, facebook, note);

    restaurants.push({
      id: i,
      type: type,
      name: name,
      slug: name_slug,
      address: address,
      email: email,
      web: web,
      facebook: facebook,
      phone: phone,
      note: note
    })
  });

  processRestaurants(restaurants);
}


function processRestaurants(restaurants) {
  var geocoder = require('node-geocoder')('google', 'https');

  var addresses = _.map(_.map(restaurants, 'address'), function(address) {
    return address || "";
  });

  console.log(addresses);

for (var i = 0; i < addresses.length; i++) {
  setTimeout((function(i) {
    return function() {
      geocoder.geocode(addresses[i], function (error, status) {
        console.log('error', error, status);

        if (status.error || !status.length) {
          console.log(i, status.error, status, addresses[i]);
          return;
        }

        var val = status[0];

        console.log(i, val);

        if (val.formattedAddress) restaurants[i].address = val.formattedAddress;
        restaurants[i].location = {
          latitude: val.latitude,
          longitude: val.longitude
        }
      });
    }
  })(i), i * 1000);

}

setTimeout(function() {

  console.log('writing results');
  writeRestaurants(restaurants);
}, (addresses.length + 2)  * 1000);


}

function writeRestaurants(restaurants) {
  var filteredRestaurants = _.filter(restaurants, function(restaurant) {
    return restaurant.location;
  });


  fs.writeFile('restaurant.json', JSON.stringify({ restaurants: restaurants }, undefined, 2), 'utf8');
  fs.writeFile('restaurant_filteres.json', JSON.stringify({ restaurants: filteredRestaurants }, undefined, 2), 'utf8');
}
