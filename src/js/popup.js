"use strict";

$(document).ready(function() {
    var toggleStats = function() {
        if ($('#stats-container').hasClass('collapsed'))
        {
            $('#stats-container').removeClass('collapsed');
        }
        else {
            $('#stats-container').addClass('collapsed')
        }
    };
    $('#stats-container .menu-item').click(toggleStats);
    var currentTabId = 0, whitelisted = false;

    var setToggleButton = function (state) {
        var val = $('.enabled').is(":checked");
        console.log('current state', val, 'must be', state);
        // if (state && !val) {
        //     $('#enabled-yes').show();
        //     $('#enabled-no').hide();
        // }
        // if (!state && val)
        // {
        //     $('#enabled-yes').hide();
        //     $('#enabled-no').show();
        // }
    };

    var setWhitelistOptions = function (state) {
        whitelisted = state;
        console.log('current whitelist must be', state);
        if (!state) {
            $('#enabled-yes').show();
            $('#enabled-no').hide();
            $('body').removeClass('disabled');
            $('#logo').attr('src', '/img/logo_base.png');
            $('#logo').attr('srcset', '/img/logo_base.png 2x');
        }
        if (state) {
            $('#enabled-yes').hide();
            $('#enabled-no').show();
            $('body').addClass('disabled');
            $('#logo').attr('src', '/img/logo_disabled.png');
            $('#logo').attr('srcset', '/img/logo_disabled.png 2x');
        }
    };

    // document.querySelector(".enabled").addEventListener("change", function () {
    //     chrome.runtime.sendMessage({type: "TOGGLE"}, function (currentState) {
    //         setToggleButton(currentState);
    //         chrome.tabs.reload(currentTabId)
    //     })
    // });
    console.log($('#enabled'));
    $('#enabled').click(function () {
        console.log("clicked");
        chrome.runtime.sendMessage({
            type: "WHITELIST",
            time: 0,
            tabId: currentTabId,
            whitelisted: whitelisted
        }, function (currentState) {
            console.log('whitelist result', currentState);
            setWhitelistOptions(currentState);
            chrome.tabs.reload(currentTabId)
        });
    });
    chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
        tab && tab[0] && (currentTabId = tab[0].id, chrome.runtime.sendMessage({
            type: "GET_STATE",
            tabId: currentTabId
        }, function (e) {
            setToggleButton(e.toggle);
            setWhitelistOptions(e.whitelisted);
            if (e.siteBlocked < 1)
            {
                toggleStats();
            }
            $('#stats-page strong').text(e.siteBlocked);
            $('#stats-total strong').text(e.totalBlocked);
        }))
    });
});
