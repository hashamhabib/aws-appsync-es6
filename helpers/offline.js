"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

//  var uuid_1 = require("uuid");
//import * as uuid_1 from 'uuid';
//import { v4 as uuidv4 } from 'uuid/dist/esm-node/index';
// TODO FIX crypto module issue in uuid
// var apollo_utilities_1 = require("apollo-utilities");
import * as apollo_utilities_1 from 'apollo-utilities/lib/bundle.esm';
// var client_1 = require("../client");
import * as client_1 from '../client';
// var link_1 = require("../link");
import * as link_1 from '../link';
// var utils_1 = require("../utils");
import * as utils_1 from '../utils';
// var logger = utils_1.rootLogger.extend('offline-helper');
var CacheOperationTypes;
(function (CacheOperationTypes) {
    CacheOperationTypes["AUTO"] = "auto";
    CacheOperationTypes["ADD"] = "add";
    CacheOperationTypes["REMOVE"] = "remove";
    CacheOperationTypes["UPDATE"] = "update";
})(CacheOperationTypes = CacheOperationTypes || (CacheOperationTypes = {}));
;
var prefixesForRemove = [
    'delete',
    'deleted',
    'discard',
    'discarded',
    'erase',
    'erased',
    'remove',
    'removed'
];
var prefixesForUpdate = [
    'update',
    'updated',
    'upsert',
    'upserted',
    'edit',
    'edited',
    'modify',
    'modified',
];
var prefixesForAdd = [
    'create',
    'created',
    'put',
    'set',
    'add',
    'added',
    'new',
    'insert',
    'inserted',
];
export function getOpTypeFromOperationName(opName) {
    if (opName === void 0) { opName = ''; }
    // Note: we do a toLowerCase() and startsWith() to avoid ambiguity with operations like "RemoveAddendum"
    var comparator = function (prefix) { return opName.toLowerCase().startsWith(prefix) || opName.toLowerCase().startsWith("on" + prefix); };
    var result = CacheOperationTypes.AUTO;
    [
        [prefixesForAdd, CacheOperationTypes.ADD],
        [prefixesForRemove, CacheOperationTypes.REMOVE],
        [prefixesForUpdate, CacheOperationTypes.UPDATE],
    ].forEach(function (_a) {
        var prefix = _a[0], type = _a[1];
        if (prefix.some(comparator)) {
            result = type;
            return;
        }
    });
    return result;
};
/**
 * Builds a SubscribeToMoreOptions object ready to be used by Apollo's subscribeToMore() to automatically update the query result in the
 * cache according to the cacheUpdateQuery parameter
 *
 * @param subscriptionQuery The GraphQL subscription DocumentNode or CacheUpdateQuery
 * @param cacheUpdateQuery The query for which the result needs to be updated
 * @param idField
 * @param operationType
 */
var buildSubscription = function (subscriptionQuery, cacheUpdateQuery, idField, operationType) {
    var document = (subscriptionQuery && subscriptionQuery.query) || subscriptionQuery;
    var variables = (subscriptionQuery && subscriptionQuery.variables) || {};
    var query = (cacheUpdateQuery && cacheUpdateQuery.query) || cacheUpdateQuery;
    var queryField = utils_1.getOperationFieldName(query);
    return {
        document: document,
        variables: variables,
        updateQuery: function (prev, _a) {
            var data = _a.subscriptionData.data;
            var _b;
            var subField = Object.keys(data)[0];
            var _c = subField, mutadedItem = data[_c];
            var optype = operationType || getOpTypeFromOperationName(subField);
            var updater = getUpdater(optype, idField);
            var path = findArrayInObject(prev);
            var arr = getValueByPath(prev, path).slice();
            var updatedOpResult = updater(arr, mutadedItem);
            var result;
            if (path.length === 0) {
                result = updatedOpResult;
            }
            else {
                var cloned = apollo_utilities_1.cloneDeep(prev);
                setValueByPath(cloned, path, updatedOpResult);
                result = cloned[queryField];
            }
            return _b = {},
                _b[queryField] = result,
                _b;
        }
    };
};
export { buildSubscription };
export function getUpdater(opType, idField) {
    if (idField === void 0) { idField = 'id'; }
    var updater;
    switch (opType) {
        case CacheOperationTypes.ADD:
            updater = function (arr, newItem) { return !newItem ? arr.slice() : arr.filter(function (item) { return item[idField] !== newItem[idField]; }).concat([newItem]); };
            break;
        case CacheOperationTypes.UPDATE:
            updater = function (arr, newItem) { return !newItem ? arr.slice() : arr.map(function (item) { return item[idField] === newItem[idField] ? newItem : item; }); };
            break;
        case CacheOperationTypes.REMOVE:
            updater = function (arr, newItem) { return !newItem ? [] : arr.filter(function (item) { return item[idField] !== newItem[idField]; }); };
            break;
        default:
            updater = function (arr) { return arr; };
    }
    return updater;
};
var getOpTypeQueriesMap = function (cacheUpdateQuery, variables) {
    var _a;
    var cacheUpdateQueryVal = typeof cacheUpdateQuery === 'function' ?
        cacheUpdateQuery(variables) :
        cacheUpdateQuery || {};
    var opTypeQueriesMap = cacheUpdateQueryVal;
    if (isDocument(cacheUpdateQueryVal) ||
        isDocument(cacheUpdateQueryVal.query) ||
        Array.isArray(cacheUpdateQuery)) {
        opTypeQueriesMap = (_a = {}, _a[CacheOperationTypes.AUTO] = [].concat(cacheUpdateQueryVal), _a);
    }
    return opTypeQueriesMap;
};
var getEvaluatedOp = function (opType, mutationField, operationType) {
    var evaluatedOP = opType === CacheOperationTypes.AUTO ?
        (operationType || getOpTypeFromOperationName(mutationField)) :
        opType;
    return evaluatedOP;
};
var findArrayInObject = function (obj, path) {
    if (path === void 0) { path = []; }
    if (Array.isArray(obj)) {
        return path;
    }
    if (!isObject(obj)) {
        return undefined;
    }
    var result;
    Object.keys(obj).some(function (key) {
        var newPath = findArrayInObject(obj[key], path.concat(key));
        if (newPath) {
            result = newPath;
            return true;
        }
        return false;
    });
    return result;
};
var getValueByPath = function (obj, path) {
    if (!isObject(obj)) {
        return obj;
    }
    return path.reduce(function (acc, elem) {
        var val = acc && acc[elem];
        if (val) {
            return val;
        }
        return null;
    }, obj);
};
var setValueByPath = function (obj, path, value) {
    if (path === void 0) { path = []; }
    return path.reduce(function (acc, elem, i, arr) {
        if (arr.length - 1 === i) {
            acc[elem] = value;
            return obj;
        }
        return acc[elem];
    }, obj);
};
var isDocument = function (doc) { return !!doc && doc.kind === 'Document'; };
// make sure that the object is of type object and is not null.
var isObject = function (object) { return object != null && (typeof object === 'object'); };
/**
 * Builds a MutationOptions object ready to be used by the ApolloClient to automatically update the cache according to the cacheUpdateQuery
 * parameter
 *
 * @param client An ApolloClient instance
 * @param mutation DocumentNode for the muation
 * @param variables An object with the mutation variables
 * @param cacheUpdateQuery The queries to update in the cache
 * @param typename __typename from your schema
 * @param idField The name of the field with the ID
 * @param operationType Override for the operation type
 *
 * @returns Mutation options to be used by the ApolloClient
 */
var buildMutation = function (client, mutation, variablesInfo, cacheUpdateQuery, typename, idField, operationType) {
    if (idField === void 0) { idField = 'id'; }
    var _a, _b, _c;
    var isVariablesInfo = typeof variablesInfo.variables === 'object';
    var variables = isVariablesInfo ? variablesInfo.variables : variablesInfo;
    var hasInputType = Object.keys(variables).length === 1 && typeof variables.input === 'object';
    var inputTypeVersionField = isVariablesInfo && variablesInfo.inputType.definitions[0].fields.find(function (f) {
        return ['version', 'expectedVersion'].find(function (n) { return n === f.name.value; }) && f.type.name.value === 'Int';
    });
    var useVersioning = hasInputType ? !!inputTypeVersionField : true;
    var opTypeQueriesMap = getOpTypeQueriesMap(cacheUpdateQuery, variables);
    var _d = idField || 'id', idCustomField = (hasInputType ? variables.input : variables)[_d];
    var comparator = function (elem) { return elem[idField] === idCustomField; };
    var version = 0;
    for (var opType in opTypeQueriesMap) {
        var queries = [].concat(opTypeQueriesMap[opType]);
        queries.forEach(function (queryEntry) {
            var query = (queryEntry && queryEntry.query) || queryEntry;
            var queryVars = (queryEntry && queryEntry.variables) || {};
            var queryField = utils_1.getOperationFieldName(query);
            var result;
            try {
                var _a = queryField, queryRead = client.readQuery({ query: query, variables: queryVars })[_a];
                result = queryRead;
            }
            catch (err) {
                logger('Skipping query', query, err.message);
                return;
            }
            var path = findArrayInObject(result);
            var arr = getValueByPath(result, path).slice();
            var cachedItem = arr.find(comparator);
            if (cachedItem) {
                version = Math.max(version, cachedItem.version);
            }
        });
    }
    ;
    var mutationField = utils_1.getOperationFieldName(mutation);
    var cache = client &&
        client instanceof client_1.default &&
        client.isOfflineEnabled() &&
        client.cache;
    var versionFieldName = inputTypeVersionField ? inputTypeVersionField.name.value : '';
    return {
        mutation: mutation,
        variables: hasInputType
            ? { input: __assign({}, (useVersioning && (_a = {}, _a[versionFieldName] = version, _a)), variables.input) }
            : __assign({ version: version, expectedVersion: version }, variables),
        optimisticResponse: typename ? (_b = {
            __typename: "Mutation"
        },
            _b[mutationField] = __assign((_c = { __typename: typename }, _c[idField] = (hasInputType ? variables.input : variables)[idField] || uuidv4(), _c), (hasInputType ? variables.input : variables), { version: version + 1 }),
            _b) : null,
        update: function (proxy, _a) {
            var _b = mutationField, mutatedItem = _a.data[_b];
            var _loop_1 = function (opType) {
                var queries = [].concat(opTypeQueriesMap[opType]);
                var updaterFn = getUpdater(getEvaluatedOp(opType, mutationField, operationType), idField);
                queries.forEach(function (queryEntry) {
                    var query = (queryEntry && queryEntry.query) || queryEntry;
                    var queryField = utils_1.getOperationFieldName(query);
                    var queryVars = (queryEntry && queryEntry.variables) || {};
                    if (cache) {
                        queryVars = link_1.replaceUsingMap(__assign({}, queryVars), cache.getIdsMap());
                    }
                    var data;
                    try {
                        data = proxy.readQuery({ query: query, variables: queryVars });
                    }
                    catch (err) {
                        logger('Skipping query', query, err.message);
                        return;
                    }
                    var opResultCachedValue = data[queryField];
                    var path = findArrayInObject(opResultCachedValue);
                    var arr = getValueByPath(opResultCachedValue, path).slice();
                    var updatedOpResult = updaterFn(arr, mutatedItem);
                    if (path.length === 0) {
                        data[queryField] = updatedOpResult;
                    }
                    else {
                        setValueByPath(data[queryField], path, updatedOpResult);
                    }
                    proxy.writeQuery({ query: query, variables: queryVars, data: data });
                });
            };
            for (var opType in opTypeQueriesMap) {
                _loop_1(opType);
            }
        },
    };
};
export { buildMutation };
