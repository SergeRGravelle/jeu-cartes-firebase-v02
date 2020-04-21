// Import stylesheets
import "./style.css";

// Firebase App (the core Firebase SDK) is always required
// and must be listed first
import * as firebase from "firebase/app";
import * as firebaseui from "firebaseui";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";  // Cloud Firestore
import "firebase/database";   // real-time database
import "firebase/storage";



// Global variables

const card = $(".card");
const table = $("#table");
var selected = null;
var selectedlast = null;
var topz = 1;
const VAL = new Array("A","2","3","4","5","6", "7", "8", "9", "10", "J", "Q", "K", "J");
var cardsID = [];
var cardsOrder = [];
var rejects = [];

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyCOWNTKuXBnsexSrXsgrDqFas7fh4M26C8",
  authDomain: "jeu-cartes-firebase.firebaseapp.com",
  databaseURL: "https://jeu-cartes-firebase.firebaseio.com",
  projectId: "jeu-cartes-firebase",
  storageBucket: "jeu-cartes-firebase.appspot.com",
  messagingSenderId: "1061076344801",
  appId: "1:1061076344801:web:3161788f02338ea36a7ca0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Get a reference to the database service
var database = firebase.database();
// Create a reference with an initial file path and name
var storage = firebase.storage();

/*  --- TESTS WAYS OF ADDINT DATA TO A REALTIME DATABASE IN FIREBASE  ----
  // test writing data to realtime database
  database.ref("game123/deck/").set( {
                    card1 : {id:"6C",posx:10,posy:15},
                    card2 : {id:"7H",posx:12,posy:15}
                    });

  // test update one property
  database.ref("game123/deck/card1").update({posy:100});

  // test add a record using push
  database.ref("game123/deck/").push( {
                    card3 : {id:"9H",posx:50,posy:60}
  });

  // test list of objects
  var dataToImport = {};
  for (var i=0; i<5; i++) {
    dataToImport["card"+i] = {id:i, posx:i*2};
  }
  database.ref("game123/listofobjects/").set(dataToImport);

  // debugger;
// --- TESTS WAYS OF ADDINT DATA TO A REALTIME DATABASE IN FIREBASE  ----  */

/**
 *  MAIN 
 * 
 * 
 */
$(document).ready(function() {

  // setup table and generate card deck  
  prepTableMemoryGame();
  genDeck();

  // Card image test (testing firebase storage functionality)
  // setCardImage("Playing_card_club_A.svg","cardimage");

  var touchstartx = 0;
  var touchstarty = 0;
  // add touh events to each card to allow move or flip
  var elem = document.getElementsByClassName("card");
  for (var i = 0; i < elem.length; i++) {
    elem[i].addEventListener("touchmove", function(e) {
      selectCard(e, this);
    });
    //    elem[i].addEventListener("mouseup", function(e) {unselectCard(e, this)});
    elem[i].addEventListener("click", function(e) {
      flipCard(e, this);
    });
    elem[i].addEventListener("touchstart", function(e) {
      touchstartx = parseInt(e.changedTouches[0].clientX); // get x coord of touch point
      touchstarty = parseInt(e.changedTouches[0].clientY); // get y coord of touch point
      e.preventDefault() // prevent default click behavior
    });
    //    elem[i].addEventListener("mousedown mousemove", function(e) {selectCard(e, this)});
    elem[i].addEventListener("touchend", function(e) {
      e.preventDefault() // prevent default click behavior
      var touchendx =  parseInt(e.changedTouches[0].clientX);
      var touchendy =  parseInt(e.changedTouches[0].clientY);
      if ( Math.abs(touchendx-touchstartx) < 10 && Math.abs(touchendy-touchstarty) < 10) {
        flipCard(e, this);
      } else {
        unselectCard(e, this);
      }
    });

  }

  // add functions to each button 
  document.getElementById("shuffle").addEventListener("click", testShuffle);
  document.getElementById("showcards").addEventListener("click", showCards);
  document.getElementById("showcardscircle").addEventListener("click", showCardsCircle);
  document.getElementById("flipup").addEventListener("click", flipAllUp);
  document.getElementById("flipdown").addEventListener("click", flipAllDown);
  document.getElementById("order").addEventListener("click", function(e) {
    cardsOrder.sort(function(a, b) {
      return a - b;
    });
  });

  // listner (".on") realtime database changes and update card positions
  // this allows for another user to change card positions and updates will be reflected in another client session
  database.ref("game123/cardpos/").on("value", function(snapshot) {
    snapshot.forEach(function(data) {
      var elem = $("#" + data.key);
      var o = data.val();
      elem.animate({ "left": o.posx + "px", 
                    "top":  o.posy + "px" });
      elem.css({ "z-index":  o.posz });

      if (o.facedown) {
        elem.addClass("highlight");
      } else {
        elem.removeClass("highlight");
      }
    });
    updateTable();
  });
});


/**
 * Set the image stored in the Firebase storage to an image getElementById
 * Process errors correctly
 * 
 */
function setCardImage(imagename, elemID) {

  // Create a reference to the file we want to download
  var storageRef = storage.ref();
  var cardsRef = storageRef.child('cards');
  var imageRef = cardsRef.child(imagename);
  
 // Get the download URL
  imageRef.getDownloadURL().then(function(url) {
    var img = document.getElementById(elemID);
    img.src = url;
  }).catch(function(error) {
    // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
    switch (error.code) {
      case 'storage/object-not-found':
        console.log("File doesn't exist");
        break;
      case 'storage/unauthorized':
        console.log("User doesn't have permission to access the object");
        break;
      case 'storage/canceled':
        console.log("User canceled the upload");
        break;
      case 'storage/unknown':
        console.log("Unknown error occurred, inspect the server response");
        break;
    }
  });
}

/**
 * Select card 
 */
function selectCard(e, t) {

  var posx = parseInt( e.touches[0].clientX - table.position().left - parseInt($(".card").css("width")) * 3/4 ) + "px";
  var posy = parseInt( e.touches[0].clientY - table.position().top - parseInt($(".card").css("height")) * 3/4 ) + "px";
  var posz = $(t).css("z-index");
   $(t).css({ left: posx, top: posy });

  if (selected != selectedlast) {
    $(t).css({ "z-index": topz++ });
  }
  selected = $(t);
  selectedlast = selected;
  
  // $("#info").text( "INFO: selected " + $(t).text() + " @ (" + posx + ", " + posy + ", " + posz + ")" );

}

function unselectCard(e, t) {
  e.preventDefault();
  // $("#info").text("INFO:");
  selected = null;

  console.log( "%i %i %s", $(t).position().left, $(t).position().top, $(t).css("z-index"));
  database.ref("game123/cardpos/" + t.id).set( {
     "posx" : parseInt($(t).position().left), 
     "posy" : parseInt($(t).position().top), 
     "posz" : parseInt($(t).css("z-index"))+1, 
     "facedown":$(t).hasClass("highlight") 
     });
}

function prepTableMemoryGame() {
  for (var j = 0; j < 4; j++) {
    var newreject = $("<div></div>").text("0 for player " + parseInt(j + 1));
    rejects.push("#reject" + j);
    newreject.attr("id", "reject" + j);
    newreject.addClass("reject");
    switch (j) {
      case 0:
        newreject.css({ left: "40%", bottom: "5px" });
      break;
      case 1:
        newreject.css({ left: "5px", top: "45%" });
      break;
      case 2:
        newreject.css({ left: "40%", top: "5px" });
      break;
      case 3:
        newreject.css({ right: "5px", top: "45%" });
      break;
    }
    table.append(newreject);
  }
}

function updateTable() {
  for (var i = 0; i < rejects.length; i++) {
    var count = 0;
    for (var j = 0; j < cardsID.length; j++) {
      if (checkInside("#" + cardsID[cardsOrder[j]], rejects[i])) {
        count++;
      }
    }
    $(rejects[i]).text(count + " for player " + parseInt(i + 1));
  }
}

function checkInside(item, region) {
  // console.log("%s %s", item, region);
  // console.log("%s", $(item).text() );

  var r_top = $(region).position().top;
  var r_left = $(region).position().left;
  var r_right = r_left + $(region).outerWidth();
  var r_bottom = r_top + $(region).outerHeight();

  var item_x = $(item).position().left + $(item).outerWidth() / 2;
  var item_y = $(item).position().top + $(item).outerHeight() / 2;

  var inside = false;
  if (
    item_x >= r_left &&
    item_x <= r_right &&
    item_y > r_top &&
    item_y < r_bottom
  ) {
    inside = true;
  }

  //  console.log("%s %i %i %i %i  %s %i %i  %s", region, r_left, r_right, r_top,  r_bottom, item, item_x, item_y, inside.toString());

  return inside;
}


function flipCard(e, t) {
  // console.log("in flipCard");
  // e.preventDefault();

  var cc = database.ref("game123/cardpos/" + t.id );
  cc.once("value")
    .then(function(snapshot) {
      console.log("key: " + snapshot.key + "  facedown: " + snapshot.child("facedown").val() );
     if (snapshot.child("facedown").val()) {
      database.ref("game123/cardpos/" + t.id + "/facedown/").set(false);
    } else {
      database.ref("game123/cardpos/" + t.id + "/facedown/").set(true);
    }
  });

 
  // database.ref("game123/cardpos/" + t.id + "/facedown/").once("value", function(data) {
  //   if (data.val()) {
  //     database.ref("game123/cardpos/" + t.id + "/facedown/").set(false);
  //   } else {
  //     database.ref("game123/cardpos/" + t.id + "/facedown/").set(true);
  //   }

  // });


/* https://en.wikipedia.org/wiki/Playing_cards_in_Unicode */
function genDeck() {
  var c = 0;
  topz = 1;
  for (var j = 1; j <= 13; j++) {
    var sp = 25;
    var leftpos = 200;
    var toppos = 150;

    // diamond
    var newcard = $("<div></div>").text(VAL[j - 1] + " \u2666");
    cardsID.push(j + "D");
    cardsOrder.push(c++);
    newcard.attr("id", j + "D");
    newcard.addClass("card redcard");
    newcard.css({
      left: parseInt(leftpos + (j * sp) / 2) + "px",
      top: parseInt(toppos + j * sp) + "px"
    });
    newcard.css({ "z-index": topz++ });
    // newcard.css({transform: "rotate(2deg)"});
    $("#deck").append(newcard);

    // hearts
    var newcard = $("<div></div>").text(VAL[j - 1] + " \u2665");
    cardsID.push(j + "H");
    cardsOrder.push(c++);
    newcard.attr("id", j + "H");
    newcard.addClass("card redcard");
    newcard.css({
      left: parseInt(leftpos + sp * 1 + (j * sp) / 2) + "px",
      top: parseInt(toppos + j * sp + sp / 8) + "px"
    });
    newcard.css({ "z-index": topz++ });
    // newcard.css({transform: "rotate(-3deg)"});
    // newcard.css({ transform: "scale(1.1)"});
    $("#deck").append(newcard);

    // spades
    var newcard = $("<div></div>").text(VAL[j - 1] + " \u2660");
    cardsID.push(j + "S");
    cardsOrder.push(c++);
    newcard.attr("id", j + "S");
    newcard.addClass("card blackcard");
    newcard.css({
      left: parseInt(leftpos + sp * 2 + (j * sp) / 2) + "px",
      top: parseInt(toppos + j * sp + (sp * 2) / 8) + "px"
    });
    newcard.css({ "z-index": topz++ });
    // newcard.css({transform: "rotate(4deg)"});
    $("#deck").append(newcard);

    // clubs
    cardsID.push(j + "C");
    cardsOrder.push(c++);
    var newcard = $("<div></div>").text(VAL[j - 1] + " \u2663");
    newcard.attr("id", j + "C");
    newcard.addClass("card blackcard");
    newcard.css({
      left: parseInt(leftpos + sp * 3 + (j * sp) / 2) + "px",
      top: parseInt(toppos + j * sp + (sp * 3) / 8) + "px"
    });
    newcard.css({ "z-index": topz++ }); 
    $("#deck").append(newcard);
  }
  // $("#info").text(cardsOrder.toString());

  // cardsPosData
  var cardsPosDataObjects = {};
  for (var o of cardsID){
    cardsPosDataObjects[o] = {
                          "posx":parseInt($("#" + o).position().left), 
                          "posy":parseInt($("#" + o).position().top),
                          "posz":parseInt($("#" + o).css("z-index")),
                          "facedown":false  };

  }
  // console.log(JSON.stringify(cardsPosDataObjects));
  database.ref("game123/cardpos/").set(cardsPosDataObjects) ;
  // debugger;
}

/**
 * Generates a random number between A and B
 *
 * @param {integer} A start number
 * @param {integer} B end number
 * @return {integer} a number between A & B inclusively
 * @customfunction
 */
function randomNb(a, b) {
  var min = Math.ceil(a);
  var max = Math.floor(b);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function testShuffle() {
  var list = cardsOrder;
  var ln = list.length;

  // $("#info").text(list.toString());

  for (var j = 0; j < 100; j++) {
    var n = randomNb(0, ln - 1);
    var section = list.pop();
    list.splice(n, 0, section);
    // console.log("n: %i, (%s)  list: %s ", n, section, list.toString());
    // $("#info").text(list.toString());
  }

  cardsOrder = list;
}


/**
 * Layout position of cards on the table
 */
function showCards() {
  var topPos = 180;
  var leftPos = 220;
  var maxRow = 12;
  var numRow = 1;
  var topz = 1;
  
  var cardsPosDataObjects = {};
 
  // cardsPosData.length = 0;  // clear array

  for (var j = 0; j < cardsOrder.length; j++) {
   var elem = $("#" + cardsID[cardsOrder[j]]);
   cardsPosDataObjects[cardsID[cardsOrder[j]]] = {
                        "posx":parseInt(leftPos), 
                        "posy":parseInt(topPos),
                        "posz":topz++,
                        "facedown":elem.hasClass("highlight") } ;
                          // do not change "face-down"

    leftPos += elem.outerWidth();
    
    if (numRow++ >= maxRow) {
      numRow = 1;
      topPos += elem.outerHeight();
      leftPos = 220;
    }

  }
  //  console.log( JSON.stringify(cardsPosDataObjects) ); debugger;
  database.ref("game123/cardpos/").set(cardsPosDataObjects);

  // should not be needed:  updateCardsDisplayOnTable();
}


/**
 * Layout position of cards on the table
 */
function showCardsCircle() {
  var posCx = $("#table").outerWidth()/2 - parseInt($(".card").css("width"))/2 ;
  var posCy = $("#table").outerHeight()/2 - parseInt($(".card").css("height"))/2 ;
 
  var posR = 200;
  var posDeg = 10;

  var topPos = 120;
  var leftPos = 30;
  var maxRow = 13;
  var numRow = 1;
  var topz = 1;
  
  var cardsPosDataObjects = {};
 
  // cardsPosData.length = 0;  // clear array

  for (var j = 0; j < cardsOrder.length; j++) {
    leftPos = parseInt(posCx) + parseInt(posR*Math.sin(j/52*Math.PI*2));
    topPos = parseInt(posCy) + parseInt(posR*Math.cos(j/52*Math.PI*2));

    var elem = $("#" + cardsID[cardsOrder[j]]);
    cardsPosDataObjects[cardsID[cardsOrder[j]]] = {
                        "posx": leftPos, 
                        "posy": topPos,
                        "posz": topz++,
                        "facedown":elem.hasClass("highlight") } ;
                          // do not change "face-down"

  }
  console.log( JSON.stringify(cardsPosDataObjects) ); debugger;
  database.ref("game123/cardpos/").set(cardsPosDataObjects);

  // should not be needed:  updateCardsDisplayOnTable();
}

// @TODO
// [ ] get all data "once", change "flip" and then write with 1 transaction
// Use Update rather than set : https://stackoverflow.com/questions/38923644/firebase-update-vs-set
// Use a list to update all cards at once. { 3C/facedown/: true, 3H/facedow: true, etc.}
}
function flipAllUp() {
  for (var j = 0; j < cardsID.length; j++) {
      database.ref("game123/cardpos/" + cardsID[cardsOrder[j]] + "/facedown/").set(false);
  }

  
}

function flipAllDown() {
x#  for (var j = 0; j < cardsID.length; j++) {
      database.ref("game123/cardpos/" + cardsID[cardsOrder[j]] + "/facedown/").set(true);
  }
}

/**
 * Update the graphical display of the cards on the prepTable
 * In this function, the data is read ONCE from the realtime database
 * 
 */
function updateCardsDisplayOnTable() {

  database.ref("game123/cardpos/").once("value", function(snapshot) {
      snapshot.forEach(function(data) {
        var elem = $("#" + data.key);
        var o = data.val();
        elem.animate({ "left": o.posx + "px", 
                       "top":  o.posy + "px" });
        elem.css({ "z-index":  o.posz });

        if (o.facedown) {
          elem.addClass("highlight");
        } else {
          elem.removeClass("highlight");
        }
      });
  });

}