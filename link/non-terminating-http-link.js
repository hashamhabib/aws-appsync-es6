"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

// var apollo_link_http_1 = require("apollo-link-http");
import * as apollo_link_http_1 from 'apollo-link-http';
// var non_terminating_link_1 = require("./non-terminating-link");
import * as non_terminating_link_1 from './non-terminating-link';

var NonTerminatingHttpLink = /** @class */ (function (_super) {
    __extends(NonTerminatingHttpLink, _super);
    function NonTerminatingHttpLink(contextKey, options) {
        var _this = this;
        var link = apollo_link_http_1.createHttpLink(options);
        _this = _super.call(this, contextKey, { link: link }) || this;
        return _this;
    }
    return NonTerminatingHttpLink;
}(non_terminating_link_1.NonTerminatingLink));
export { NonTerminatingHttpLink };
