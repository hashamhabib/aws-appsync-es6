// var apollo_utilities_1 = require("apollo-utilities");
import * as apollo_utilities_1 from 'apollo-utilities/lib/bundle.esm';
// var apollo_link_1 = require("apollo-link");
import * as  apollo_link_1 from 'apollo-link';
// var crypto = require('aws-sdk/global').util.crypto;
import * as util from 'aws-sdk/lib/util';
let crypto = util.crypto;

export const passthroughLink = function (op, forward) { return (forward ? forward(op) : apollo_link_1.Observable.of()); };
export const isUuid = function (val) { return typeof val === 'string' && val.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i); };
export const getOperationFieldName = function (operation) { return apollo_utilities_1.resultKeyNameFromField(operation.definitions[0].selectionSet.selections[0]); };
export const hash = function (src) { return crypto.createHash('sha256').update(src || {}, 'utf8').digest('hex'); };
// var logger_1 = require("./logger");
import * as logger_1 from './logger';
export const rootLogger = logger_1.default;
