module.exports.Eclipse = function (objectTemplate, _getTemplate) {
    var Eclipse = objectTemplate.create('Eclipse', {
        builder: {
            type: Object,
            toClient: false
        },
        parser: {
            type: Object,
            toClient: false
        },
        init: function(controller){
            this.controller = controller;
        },
        serverInit: function(controller){
            this.controller = controller;
        },
        getDocs: {
            on: 'server',
            body: function (type) {
                var policyDocsConfig    = objectTemplate.config.nconf.get('services')['RetrieveCSCPolicyDocs'];
                var endPoint            = policyDocsConfig.endpointUrl;
                var path                = policyDocsConfig.path;
                var userDomain          = policyDocsConfig.userDomain;
                var userId              = policyDocsConfig.userId;
                var password            = policyDocsConfig.password;

                var xml2js  = require('xml2js');

                this.builder = new xml2js.Builder({
                    headless: true
                });

                this.parser = new xml2js.Parser({
                    explicitArray: false
                });

                var deferred = Q.defer();

                //Check for valid Document Type
                var documentTypes = ['POLICY', 'CORRESPONDENCE'];
                if (documentTypes.indexOf(type) < 0) { deferred.reject('Invalid Doc Type'); }

                //Check for valid Policy Number (1100000175 for testing messages, 1100001422 for policy)
                // var policyNumber = '1100000175';
                // var policyNumber = '1100001422';
                var policyNumber = this.controller.customer.applicationPolicy.policyNumber;
                if (!policyNumber) { deferred.reject('Invalid Policy Number'); }

                if (documentTypes.indexOf(type) < 0 || !policyNumber) {
                    return deferred.promise;
                }

                // First search for all documents with the given
                // policy number
                var date = new Date();
                date.setFullYear(date.getFullYear() + 10);
                var dateEnd = this.formatDate(date);

                var payload = {
                    credentials: {
                        userDomain: userDomain,
                        userId:     userId,
                        password:   password
                    },
                    policyNumber: policyNumber,
                    dateBegin: '2015-03-01',
                    dateEnd: dateEnd,
                    documentType: type
                };

                var payloadXml = this.builder.buildObject(payload);
                var soapXML = '';
                var soapXMLStart = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi= "http://www.w3.org/2001/XMLSchema-instance" xmlns:tns="http://laas.bpo.fsg.csc.com/docservices/"> <soap:Header></soap:Header> <soap:Body>';

                soapXML += soapXMLStart;
                soapXML += '<tns:PolicyDocumentSearchRequest xmlns:tns="http://laas.bpo.fsg.csc.com/docservices/">';
                soapXML += payloadXml.replace('<root>', '').replace('</root>', '');
                soapXML += '</tns:PolicyDocumentSearchRequest> </soap:Body> </soap:Envelope>';

                var postRequest = {
                    uri: 'https://' + endPoint + path,
                    port: 443,
                    method: 'POST',
                    rejectUnauthorized: false,
                    headers: {
                        'Content-Type': 'text/xml',
                        'Content-Length': Buffer.byteLength(soapXML)
                    },
                    body: soapXML
                };


                /* XML Parser Callback */
                var handleParse = function (_err, result) {
                    if (_err) { deferred.reject(_err); }
                    var documents = result['soap:Envelope']['soap:Body']['ns2:PolicyDocumentSearchResponse']['document'];
                    if (!documents) { deferred.reject('No Documents'); return; }
                    // Can be a single document or a list
                    var returnDocs = documents;
                    if (!(documents instanceof Array)) {
                        returnDocs = [];
                        returnDocs.push(documents);
                    }

                    deferred.resolve(returnDocs);
                };
                /* XML Parser Callback */

                var handleResponse = function (res) {
                    var responseData = res.slice(res.indexOf('<soap:Envelope'), res.indexOf('</soap:Envelope>')) + '</soap:Envelope>';
                    this.parser.parseString(responseData, handleParse);
                    return deferred.promise;
                }.bind(this);

                var rp = require('request-promise');

                return rp(postRequest)
                    .then(handleResponse);
            }
        },
        downloadDoc: {
            on: 'server',
            body: function(fileName, documentId) {
                var policyDocsConfig    = objectTemplate.config.nconf.get('services')['RetrieveCSCPolicyDocs'];
                var endPoint            = policyDocsConfig.endpointUrl;
                var path                = policyDocsConfig.path;
                var userDomain          = policyDocsConfig.userDomain;
                var userId              = policyDocsConfig.userId;
                var password            = policyDocsConfig.password;
                // Now the PDFs. Get each of them and download them to the server
                var payload = {
                    credentials: {
                        userDomain: userDomain,
                        userId: userId,
                        password: password
                    },
                    documentId: documentId
                };

                var Q = require('q');
                var deferred = Q.defer();

                var xml2js  = require('xml2js');

                this.builder = new xml2js.Builder({
                    headless: true
                });

                this.parser = new xml2js.Parser({
                    explicitArray: false
                });

                var payloadXml  = this.builder.buildObject(payload);
                var soapXML     = '';
                var soapXMLStart = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi= "http://www.w3.org/2001/XMLSchema-instance" xmlns:tns="http://laas.bpo.fsg.csc.com/docservices/"> <soap:Header></soap:Header> <soap:Body>';

                soapXML += soapXMLStart;
                soapXML += '<tns:DocumentImageRequest xmlns:tns="http://laas.bpo.fsg.csc.com/docservices/">';
                soapXML += payloadXml.replace('<root>', '').replace('</root>', '');
                soapXML += '</tns:DocumentImageRequest> </soap:Body> </soap:Envelope>';

                var postRequest = {
                    host: endPoint,
                    path: path,
                    port: 443,
                    method: 'POST',
                    rejectUnauthorized: false,
                    headers: {
                        'Content-Type': 'text/xml',
                        'Content-Length': Buffer.byteLength(soapXML)
                    }
                };

                var buffer = [];
                var https   = require('https');
                var fs      = require('fs');
                var req = https.request(postRequest, function (res) {

                    console.log(res.statusCode);
                    if (res.statusCode != 200) {
                        deferred.reject(res.statusCode + '');
                    }

                    res.on('data', function (data) {
                        buffer.push(data);
                    });

                    res.on('end', function (_data) {
                        var result = Buffer.concat(buffer);

                        fs.writeFile(fileName, result, function (err) {
                            if (err) {
                                deferred.reject(err + '');
                            }
                            else {
                                deferred.resolve();
                            }
                        });
                    });
                });

                req.write(soapXML);
                req.end();

                return deferred.promise;
            }
        },

        formatDate: function(date) {
            date = new Date(date);

            var day = ('0' + date.getDate()).slice(-2);
            var month = ('0' + (date.getMonth() + 1)).slice(-2);
            var year = date.getFullYear();

            return year + '-' + month + '-' + day;
        }

    });

    return {
        Eclipse: Eclipse
    };
};
