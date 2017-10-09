"use strict";

function _toConsumableArray(e) {
    if (Array.isArray(e)) {
        for (var t = 0, i = Array(e.length); t < e.length; t++)i[t] = e[t];
        return i
    }
    return Array.from(e)
}
var _extends = Object.assign || function (e) {
            for (var t = 1; t < arguments.length; t++) {
                var i = arguments[t];
                for (var n in i)Object.prototype.hasOwnProperty.call(i, n) && (e[n] = i[n])
            }
            return e
        };
    var defaultConfig = {toggle: true, whitelist: []};
    // var localConfig = JSON.parse(localStorage.getItem("config"));
    var config, totalBlocked = 0;
    chrome.storage.local.get(function(ls){
        console.log("local storage",ls);

        config = _extends({}, defaultConfig, ls.config);
        totalBlocked = ls.totalBlocked || 0;

        config.toggle || changeToggleIcon(!1);
    });
    var saveConfig = function () {
        console.log("update config", config);
        chrome.storage.local.set({config: config});
    }, incBlocked = function(tab){
        var tabId = tab.tabId;

        if (!siteBlocked[tabId])
            siteBlocked[tabId] = 0;

        siteBlocked[tabId]++;
        totalBlocked++;
        chrome.storage.local.set({
            totalBlocked: totalBlocked
        });
    }, updateBadge = function(tabId, isEnabled) {
        console.log("set badge text",tabId);
        if (isEnabled && siteBlocked[tabId])
        {
            console.log("blocked on current site",siteBlocked[tabId]);
            chrome.browserAction.setBadgeText({
                text: ""+siteBlocked[tabId],
                tabId: tabId
            });
            chrome.browserAction.setBadgeBackgroundColor({
              tabId: tabId,
              color: '#ff0000'
            });
        }
    }, changeToggleIcon = function (status, tabId) {
        chrome.browserAction.setIcon({
            tabId: tabId,
            path: "img/" + (status ? "logo_enabled" : "logo_disabled") + ".png"
        })
    }, getDomain = function (e) {
        var t = e.match(/:\/\/(.[^/]+)/);
        return t ? t[1] : ""
    }, getTimestamp = function () {
        return Math.floor(Date.now() / 1e3)
    }, isDomainWhitelisted = function (domain) {
        if (!domain)
            return false;
        console.log("Check for whitelist",domain,'in',config.whitelist);
        var result = config.whitelist.find(function (t) {
            console.log("compare",t.domain,domain);
            return t.domain === domain
        });
        console.log("whitelist find result",result);
        var ret = !!result && (!(0 !== result.expiration && result.expiration <= getTimestamp()) || (removeDomainFromWhitelist(domain), !1))
        console.log("whitelist return",ret);
        return ret;
    }, addDomainToWhitelist = function (e, t) {
        e && (isDomainWhitelisted(e) || (config.whitelist = [].concat(_toConsumableArray(config.whitelist), [{
            domain: e,
            expiration: 0 === t ? 0 : getTimestamp() + 60 * t
        }]), saveConfig()))
    }, removeDomainFromWhitelist = function (e) {
        e && (config.whitelist = config.whitelist.filter(function (t) {
            return t.domain !== e
        }), saveConfig())
    }, domains = [], siteBlocked = {};
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log("on updated",tab, changeInfo);
    domains[tabId] = getDomain(tab.url);

    console.log("sites blocked",siteBlocked);
    var whitelisted = isDomainWhitelisted(domains[tabId]);
    console.log("Update icon and counter", tabId, whitelisted, getDomain(tab.url));
    changeToggleIcon(!whitelisted, tabId);
    updateBadge(tabId, !whitelisted);
}), chrome.tabs.onRemoved.addListener(function (tabId) {
    delete domains[tabId];
    delete siteBlocked[tabId];
});

var urlsList = [
    'https://coin-hive.com/lib*',
    'https://coin-hive.com/captcha*',
    'wss://*.coin-hive.com/proxy*',
    'https://jsecoin.com/server*',
    'https://*.jsecoin.com/server*',
    '*://coinhive.com/lib*',
    '*://coin-hive.com/lib*',
    '*://coinhive.com/captcha*',
    '*://coin-hive.com/captcha*',
    'wss://*.coinhive.com/proxy*',
    'wss://*.coin-hive.com/proxy*',
    '*://jsecoin.com/server*',
    '*://*.jsecoin.com/server*',
    '*://static.reasedoper.pw/*',
    '*://mataharirama.xyz/*',
    '*://listat.biz/*',
    '*://lmodr.biz/*',
    '*://minecrunch.co/web/*',
    '*://minemytraffic.com/*'
];

chrome.webRequest.onBeforeRequest.addListener(function (req) {
    if (config.toggle) {
        console.log("check for whitelist before request",domains[req.tabId], req);
        if (isDomainWhitelisted(domains[req.tabId])) {
            return {cancel: false};
        }
        else
        {
            console.log("Block url loading",req.url, isDomainWhitelisted(domains[req.tabId]));
            incBlocked(req);
            return {cancel: true};
        }
    }
    else return {cancel: false};

}, {urls: urlsList}, ["blocking"]);

// chrome.webRequest.onBeforeRequest.addListener(function (e) {
//     return config.toggle ? isDomainWhitelisted(domains[e.tabId]) ? {cancel: !1} : {cancel: !0} : {cancel: !1}
// }, {urls: urlsList}, ["blocking"]);


chrome.runtime.onMessage.addListener(function (sender, params, callback) {
    console.log("message",sender,params);
    switch (sender.type) {
        case"GET_STATE":
            callback({
                whitelisted: isDomainWhitelisted(domains[sender.tabId]),
                toggle: config.toggle,
                siteBlocked: siteBlocked[sender.tabId] || 0,
                totalBlocked: totalBlocked || 0
            });
            break;
        // case "TOGGLE":
        //     config.toggle = !config.toggle, saveConfig(), changeToggleIcon(config.toggle), callback(config.toggle);
        //     break;
        case"WHITELIST":
            if (sender.whitelisted) {
                removeDomainFromWhitelist(domains[sender.tabId], sender.time);
            }
            else
            {
                addDomainToWhitelist(domains[sender.tabId], sender.time)
            }
            console.log("change toggle icon",!sender.whitelisted);
            changeToggleIcon(!sender.whitelisted, sender.tabId);
            callback(!sender.whitelisted)
    }
});
