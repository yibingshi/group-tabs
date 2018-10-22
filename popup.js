// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


const DOMAIN_REGEX = /(?:[-a-zA-Z0-9@:%_\+~.#=]{2,256}\.)?([-a-zA-Z0-9@:%_\+~#=]*)\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/i
const DOMAIN_LENGTH = 20
const TITLE_LENGTH = 57
let changeColor = document.getElementById('changeColor');

function promiseQuery(options){
  return new Promise(function(resolve,reject){
    chrome.tabs.query(options, resolve);
  });
}

window.onload = function() {
  let domains = {}
  let ids = []
  promiseQuery({currentWindow: true})
  .then(function(tabs){
    tabs.forEach((tab) => {
      if (tab.url.includes('.') === false) { return; }
      var domain = tab.url.match(DOMAIN_REGEX)[1]
      if (domains.hasOwnProperty(domain)){
        domains[domain].push(tab);
      } else {
        domains[domain] = [tab]
      }
    })
  })
  .then(function() {
    Object.keys(domains).sort().forEach((key) => {
      var domain_div = document.createElement('div');

      domain_div.setAttribute('class','domain');
      domain_div.setAttribute('id', key);
      domain_div.innerHTML = Camelcase(key.substring(0, DOMAIN_LENGTH));

      var share_icon = document.createElement('img');
      share_icon.src = './images/share.png';
      domain_div.appendChild(share_icon);

      domains[key].forEach((tab) => {
        var tab_div = document.createElement('div');
        tab_div.setAttribute('class','tab');
        tab_div.setAttribute('id', tab.id);
        ids.push(tab.id)
        var tab_link = document.createElement('a');
        tab_link.setAttribute('href', tab.url);
        // tab_link.setAttribute('target', '_blank');
        tab_link.innerHTML = `<img src=${tab.favIconUrl}>`

        if (tab.title.length > TITLE_LENGTH) {
          tab_link.innerHTML += tab.title.substring(0, TITLE_LENGTH) + '...';
        } else {
          tab_link.innerHTML += tab.title
        }
        tab_div.appendChild(tab_link);
        domain_div.appendChild(tab_div);
      });

      document.getElementById('tabList').appendChild(domain_div);
    });
  })
  .then(function() {
    for (var id of ids) {
      let element = document.getElementById(id)
      element.addEventListener('click', function(){
        chrome.tabs.update(Number(element.id), {'active': true}, function(){ });
      });
    }

    for (var domain of Object.keys(domains)) {
      let element = document.getElementById(domain)
      let moves = []
      element.addEventListener('click', function(event){
        if (event.currentTarget !== event.target) {
          return;
        }
        for (var child of element.childNodes){
          if (child.className == 'tab') {
            moves.push(Number(child.id));
          }
        }

        console.log(moves)
        chrome.windows.create({}, function(window) {
          chrome.tabs.move(moves, {'windowId': window.id, 'index': -1}, function(){
            chrome.tabs.update(moves[0], {'active': true}, function(){ });
          });
        })
        // chrome.tabs.update(Number(element.id), {'active': true}, function(){ });
      }, false);


    }
  });
}

function Camelcase(str) {
  if (str.length == 0) {
    return null;
  }
  return str[0].toUpperCase() + str.slice(1);
}
