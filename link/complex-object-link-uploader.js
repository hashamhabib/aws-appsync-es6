//TODO In case of error in lib/link/index.js
// var S3 = require("aws-sdk/clients/s3");
export default (function (fileField, _a) {
    var credentials = _a.credentials;
    var Bucket = fileField.bucket, Key = fileField.key, region = fileField.region, ContentType = fileField.mimeType, Body = fileField.localUri;
    // var s3 = new S3({
    //     credentials: credentials,
    //     region: region,
    // });
    // return s3.upload({
    //     Bucket: Bucket,
    //     Key: Key,
    //     Body: Body,
    //     ContentType: ContentType,
    // }).promise();
});
