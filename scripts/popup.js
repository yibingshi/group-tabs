'use strict';

const DOMAIN_REGEX = /(?:[-a-zA-Z0-9@:%_\+~.#=]{2,256}\.)?([-a-zA-Z0-9@:%_\+~#=]*)\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/i
const DOMAIN_LENGTH = 20
const TITLE_LENGTH = 47

function promiseQuery(options){
  return new Promise(function(resolve,reject){
    chrome.tabs.query(options, resolve);
  });
}

window.onload = function() {
  let domains = {}
  let ids = []
  let tab_count = 0;
  promiseQuery({currentWindow: true})
  .then(function(tabs){
    tabs.forEach((tab) => {
      if (tab.url.includes('.') === false) { return; }
      tab_count += 1;
      var domain = tab.url.match(DOMAIN_REGEX)[1]
      if (domains.hasOwnProperty(domain)){
        domains[domain].push(tab);
      } else {
        domains[domain] = [tab]
      }
    })

    document.getElementById('footer').innerHTML = `Total Tabs: ${tab_count}`
  })
  .then(function() {
    Object.keys(domains).sort().forEach((key) => {
      var all_tabs = '';

      domains[key].forEach((tab) => {
        ids.push(tab.id);
        all_tabs +=
          `<tr id=${tab.id}>` +
            '<td>' +
              `<input class="hiddenUrl" value=${tab.url}>` +
              `<img class="icon" src=${tab.favIconUrl || '../images/tab.png'} />` +
              `<span class="tab">${tab.title.substring(0, TITLE_LENGTH)}</span>` +
            '</td>' +
            '<td>' +
              '<img class="copy" src="../images/copy.png" />' +
            '</td>' +
            '<td>' +
              '<img class="close" src="../images/close.png" />' +
            '</td>' +
          '</tr>'
      });

      document.getElementById('tabList').innerHTML +=
        `<table class="domain_table">` +
          '<thead>' +
            `<th class="domain" id=${key}>` +
              `${Camelcase(key.substring(0, DOMAIN_LENGTH))}` +
            '</th>' +
          '</thead>' +
          '<tbody>' +
            `${all_tabs}` +
          '</tbody>' +
        '</table>'
    });
  })
  .then(function() {
    for (var id of ids) {
      let element = document.getElementById(id)
      element.addEventListener('click', function(event){
        if (event.target.className == 'tab'){
          chrome.tabs.update(Number(element.id), {'active': true});
        } else if (event.target.className == 'copy'){
          let url_div = element.firstElementChild.firstElementChild;
          url_div.select();
          document.execCommand("copy");
        } else if (event.target.className == 'close'){
          chrome.tabs.remove(Number(element.id), function(){
            var removed = document.getElementById(element.id);
            var parent = removed.parentNode;
            parent.removeChild(removed);
            tab_count -= 1;
            document.getElementById('footer').innerHTML = `Total Tabs: ${tab_count}`;
            if (!parent.hasChildNodes()){
              document.getElementById('tabList').removeChild(parent.parentNode);
            }
          });
        }

      });
    }

    for (var domain of Object.keys(domains)) {
      let element = document.getElementById(domain)
      let moves = []
      element.addEventListener('click', function(){
        for (var child of element.parentNode.parentNode.nextSibling.childNodes){
          if (child.nodeName == 'TR') {
            moves.push(Number(child.id));
          }
        }

        chrome.windows.create({}, function(window) {
          chrome.tabs.move(moves, {'windowId': window.id, 'index': -1}, function(){
            chrome.tabs.update(moves[0], {'active': true}, function(){
              window.location.reload();
            });
          });
        })
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
