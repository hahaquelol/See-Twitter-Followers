// ==UserScript==
// @name        See Twitter Followers
// @description See twitter followers and hide moments
// @match        *://twitter.com/*
// @author      @queuedandready
// @version     1
// @grant       GM_xmlhttpRequest
// @run-at document-end
// ==/UserScript==

var users = {};
function pageLoad(){
    window.addEventListener("DOMNodeInserted", newMessage);
    window.addEventListener("DOMNodeInserted", function(){
        removeElement('.Trends');
        removeElement('.Footer');
        removeElement('.import-prompt');
        removeElement('.js-nav[data-nav="moments"]');
        removeElement('.js-recommended-followers .promoted-account');
    });
}
function removeElement(selector){
    var elem = document.querySelector(selector);
    if (elem){
        elem.style.display = 'none';
    }
}
function fetchPage(url, callback){
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function(response){ callback(response, response.status != 200) }
    });
}
function getFollowers(tweet, callback){
    var username = tweet.querySelector('span.username b').innerText;
    if (users.hasOwnProperty(username)){
        return callback(tweet, users[username].followers);
    }
    fetchPage('https://twitter.com/' + username, function(response, error){
        if (error) return;
        var page = makeHtmlFromResponse(response);
        var followersElem = page.querySelector('.ProfileNav-item--followers span.ProfileNav-value');
        if (followersElem == null) return;
        var followers = followersElem.innerText;
        users[username] = {followers: followers};
        callback(tweet, followers);
    });
}

function addFollowersToTweets(){
    var tweets = document.querySelectorAll('.tweet:not(.processed)');
    if (tweets.length === 0){
        return;
    }
    var userInfoGroup = Array.from(tweets).map(function(tweet){
        tweet.classList.add('processed');
        if (tweet.classList.contains('promoted-tweet')){
            tweet.style.display = 'none';
        }
        return tweet.querySelector('a.account-group');
    });
    for (var i = 0, length = userInfoGroup.length; i < length; i++){
        var tweet = userInfoGroup[i];
        if (tweet == null) continue;
        getFollowers(tweet, function(tweet, followers){
            var followersElem = document.createElement('strong');
            followersElem.style.backgroundColor = 'grey';
            followersElem.style.marginRight = '5px';
            followersElem.style.padding = '2px';
            followersElem.style.color = 'white';
            followersElem.style.borderRadius = '3px';
            followersElem.innerText = followers;
            tweet.insertBefore(followersElem, tweet.children[1]);
        });
    }
}
function makeHtmlFromResponse(response){
    var fakeElement = document.createElement('div');
    fakeElement.innerHTML = response.responseText;
    return fakeElement;
}
function checkScrolledToTop() {
    var timeline = document.getElementById('timeline');
    var clientTop = timeline.getBoundingClientRect().top;
    var elementTop = timeline.offsetTop;
    return clientTop == elementTop;
}

function newMessage(){
    addFollowersToTweets();
}
pageLoad();
addFollowersToTweets();
