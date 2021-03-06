"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};

// var apollo_link_1 = require("apollo-link");
import * as apollo_link_1 from 'apollo-link';
// var apollo_link_retry_1 = require("apollo-link-retry");
import * as apollo_link_retry_1 from 'apollo-link-retry';
// var apollo_utilities_1 = require("apollo-utilities");
import * as apollo_utilities_1 from 'apollo-utilities/lib/bundle.esm';
var BASE_TIME_MS = 100;
var JITTER_FACTOR = 100;
var MAX_DELAY_MS = 5 * 60 * 1000;
var getDelay = function (count) { return ((Math.pow(2, count)) * BASE_TIME_MS) + (JITTER_FACTOR * Math.random()); };
export const SKIP_RETRY_KEY = '@@skipRetry';
export const PERMANENT_ERROR_KEY = typeof Symbol !== 'undefined' ? Symbol('permanentError') : '@@permanentError';
export const getEffectDelay = function (_action, retries) {
    var delay = getDelay(retries);
    return delay <= MAX_DELAY_MS ? delay : null;
};
export const createRetryLink = function (origLink) {
    var delay;
    var retryLink = new apollo_link_retry_1.RetryLink({
        attempts: function (count, operation, error) {
            var _a = PERMANENT_ERROR_KEY, _b = error[_a], permanent = _b === void 0 ? false : _b;
            var _c = SKIP_RETRY_KEY, _d = operation.variables[_c], skipRetry = _d === void 0 ? false : _d;
            if (permanent) {
                return false;
            }
            if (error.statusCode >= 400 && error.statusCode < 500) {
                return false;
            }
            if (apollo_utilities_1.graphQLResultHasError({ errors: error ? error.graphQLErrors : [] })) {
                return false;
            }
            if (skipRetry) {
                return false;
            }
            delay = getDelay(count);
            return delay <= MAX_DELAY_MS;
        },
        delay: function (_count, _operation, _error) { return delay; },
    });
    var link = apollo_link_1.ApolloLink.from([
        retryLink,
        origLink,
    ]);
    return new apollo_link_1.ApolloLink(function (operation, forward) {
        var _a = operation.variables, _b = SKIP_RETRY_KEY, _c = _a[_b], skipRetry = _c === void 0 ? false : _c, otherVars = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
        if (skipRetry) {
            operation.variables = otherVars;
        }
        return link.request(operation, forward);
    });
};
