(function() {
'use strict';

/**
 * @name DateParser
 * @desc Method for detecting browser specific quirks in parsing a Date.
 *       Parsing methods and regex sourced from Stack Overflow by users kennebec and QTax
 */
angular.module('DateParser', [])
.factory('DateParser', DateParserFactory);


/**
 * @name DateParserFactory
 * @desc Factory to build a DateParser based on the parsing method most compatible with the current browser.
 */
function DateParserFactory() {
    var bestMethod = fromISO();

    var service = {
        full: full,
    };
    return service;
    
    
    /**
     * @name full
     * @desc Returns a new JS Date object by parsing the provided datetime string with the best method to provide a date numeric to Date.
     * @param {String} datetime - Date string to parse.
     * @return {Date} - JS Date Object initialized to the provided datetime.
     */
    function full(datetime) {
        return new Date(bestMethod(datetime)) || false;
    }
    
    
    /**
     * @name noOffset
     * @desc Parses Date string and time-zone offset, then adjusted the time by the offset.
     * @param {String} s - Date string to parse.
     * @return {Number} - Numeric value of date.
     */
    function noOffset(s) {
        var day= s.slice(0,-5).split(/\D/).map(function(itm){  // Parse date and time portion of string
            return parseInt(itm, 10) || 0;
        });
        day[1]-= 1;
        day= new Date(Date.UTC.apply(Date, day));  

        var offsetString = s.slice(-5);  // Grab time-zone offset
        var offset = parseInt(offsetString,10)/100;  // Convert to hours
        if (offsetString.slice(0,1)=="+") {
            offset*=-1;
        }
        day.setHours(day.getHours()+offset);  // Adjust time based on time-zone offset.
        return day.getTime();  // Return adjusted time.
    }


    /**
     * @name byRegex
     * @desc Parses the date with a regular expression.
     * @param {String} s - Date string to parse.
     * @return {Number|NaN} - Numeric value of date.
     *
     * @example
     * s = 2011-11-24T09:00:27+0200
     * p[1] = 2011-11-24T09:00:27
     * p[2] = T09:00:27
     * p[3] = +020
     * p[4] = +
     * p[5] = 02
     * p[6] = 00
     */
    function byRegex(s) {
        var day, tz, 
        rx = /^(\d{4}\-\d\d\-\d\d([tT][\d\d:\.]*)?)([zZ]|([+\-])(\d\d):?(\d\d))?$/, 
        p= rx.exec(s) || [];
        
        if(p[1]){
            day= p[1].split(/\D/).map(function(itm){  // Parse date and time portion of string
                return parseInt(itm, 10) || 0;
            });
            day[1]-= 1;
            day= new Date(Date.UTC.apply(Date, day));
            if(!day.getDate()) {  // Not a valid date
                return NaN;
            }
            
            if(p[5]){  // Time-zone offset
                tz= parseInt(p[5], 10)/100*60;  // Convert hours to minutes
                if(p[6]) tz += parseInt(p[6], 10);  // Add minutes
                if(p[4]== "+") tz*= -1;
                if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);  // Adjust time based on time-zone offset.
            }
            return day;
        }
        return NaN;
    }


    /**
     * @name fromISO
     * @desc Returns the method which converts a known ISO date to a known numeric date 
     *       by comparing the results of different parsing methods.
     *       Used to normalize date parsing across different browsers.
     */
    function fromISO() {
        var testIso = '2011-11-24 09:00:27+0200';  // Note the lack of the T between date and time. Firefox cannot handle a missing T.
        
        var diso= Date.parse(testIso);  
        if(diso===1322118027000) {  // Chrome
            return function(s) {
                return new Date(Date.parse(s));
            }
        }
        
        if (noOffset(testIso)===1322118027000) {  // JS 1.8 / Gecko
           return noOffset;
        }
        
        return byRegex;  
    };
};

})();
