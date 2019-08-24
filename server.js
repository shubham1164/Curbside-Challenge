/*

  Author: Shubham Singla
  Created on: 24 August, 2019

*/

const axiosOriginal = require("axios");
const rateLimit = require('axios-rate-limit');
const axios = rateLimit(axiosOriginal.create(), { maxRequests: 100, perMilliseconds: 1000 }); // set the concurrent request rate - 100/s

var sessionId = '7dda67c5276f44f2abf0657f0573713a'; //  set this value to latest before running
const startUrl = 'https://challenge.curbside.com/start';
const nextUrl = 'https://challenge.curbside.com/{0}'
var secretArray = []; // 2d array to store [secret, uid] where secret like 'A', uid like _01_01_02_07....

/*
uid
It contains the information of each level(or depth) as 2 digit number separated by `_`. It is used to sort the Secret key in the last
Example - For 3 level depth uid = _04_06_03 where 04 means 4th child of 'next' array in 1st level, 06 means 6th child of 'next' array in 2nd level and so on
*/

var httpGetRequest = async function(url){
  try{
    const response = await axios({
      method: 'get',
      url: url,
      headers: {
        'Accept': 'application/json',
        'Session': sessionId
      }
    });
    return lowerCaseTheObject(response.data);
  } catch(e){
    // just in case any error occurs, try until success
    console.warn("err: ", e.message + ", ignore it");
    return (await httpGetRequest(url));
  }
}

var doTask = async function(response, uid){

  if (response.secret != undefined){
    if (response.secret.length>0){
      secretArray.push([uid, response.secret]);
      calculateTheSecretKeyFromArray();
      //console.warn("uid_secret:", uid, response.secret);
    }
    return;
  }

  if (response.next != undefined && response.next.length>0){
    if (response.next instanceof Array){
      // if 'next' is array
      var counter = 1
      for(var n of response.next){
        var url = nextUrl.replace('{0}', n);
        const r = await httpGetRequest(url);
        var newUID = uid + "_" + padTheNumber(counter++, 2);
        doTask(r, newUID)
      }
    } else {
      // if 'next' is string
      var url = nextUrl.replace('{0}', response.next);
      const r = await httpGetRequest(url);
      var newUID = uid + "_" + padTheNumber(1, 2);
      await doTask(r, newUID)
    }

  }
}

var main = async function(){
  const resp = await httpGetRequest(startUrl);
  doTask(resp, '');
}

// utility functions
var padTheNumber = function(number, length){
  //add padding before the number with zeros '0'
  var str = '' + number;
  if (str.length < length){
    while (str.length < length) {
        str = '0' + str;
    }
  }
  return str;
}

var lowerCaseTheObject = function(obj){
  var key, keys = Object.keys(obj);
  var n = keys.length;
  var newobj={}
  while (n--) {
    key = keys[n];
    newobj[key.toLowerCase()] = obj[key];
  }
  return newobj
}

var calculateTheSecretKeyFromArray = function(){
  // sort the 2d array first,
  secretArray.sort(function(a, b){
    if(a[0] < b[0]) { return -1; }
    if(a[0] > b[0]) { return 1; }
    return 0;
  })
  // concat the secret key from the sorted array
  var secret = '';
  secretArray.map(arr => {
    secret += arr[1];
  })
  console.warn(secret);
}
////////////////////

// start the program
main()
