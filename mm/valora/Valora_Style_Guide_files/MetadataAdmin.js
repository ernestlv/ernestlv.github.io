module.exports.MetadataAdmin = function(objectTemplate, getTemplate) {
    if (typeof(require) !== 'undefined') {
        _ = require('underscore');
		var fs = require('fs');
        var Path = require('path');
		var Metadata = require('./Metadata.js');
		var MetadataScm = require('./MetadataScm.js');
		var MetadataConfig = require('./MetadataConfig.js');
        var MetadataXlsx = require('./MetadataXlsx.js');
	}
	
	var Utils = getTemplate('Utils.js').Utils;

	function getBranchName(user, category, hierarchy, dimensions, project) {
		return _.compact([user, category, hierarchy, dimensions, project]).join('_').replace(/[^\w]/g, '_').toLowerCase();
	}
	function arrToStr(arr) {
		return arr ? arr.join('_') : '';
	}
	function strToArr(str) {
		return str ? str.split('_') : [];
	}
	function echo(val) {
		return val;
	}

	var MetadataLog = objectTemplate.create('MetadataLog', {
		userId: 	{type: String},
		category: 	{type: String},
		hierarchy:	{type: String},
		dimensions: {type: String},
        project:    {type: String},
		sheetId:	{type: String},
        status:     {type: String},

		init: function(userId, category, hierarchy, dimensions, project, sheetId, status) {
			this.userId = userId;
			this.category = category;
			this.hierarchy = hierarchy;
			this.dimensions = dimensions;
            this.project = project;
			this.sheetId = sheetId;
            this.status = status;
		},

		getSheetUrl: function() {
			return 'https://docs.google.com/spreadsheets/d/' + this.sheetId;
		},

		checkout: function() {
			var branchName = getBranchName(this.userId, this.category, this.hierarchy, this.dimensions, this.project),
                masterBranchName = MetadataConfig.projectBranches[this.project],
				repoPath = MetadataConfig.getRepoPath(branchName),
				dataPath = MetadataConfig.getDataPath(repoPath),
				hierArr = strToArr(this.hierarchy),
				dimArr = strToArr(this.dimensions);

            Utils.logInfo('Checking out metadata for', repoPath);

			return MetadataScm.checkout(MetadataConfig.repoUrl, repoPath, branchName, masterBranchName)
                .then(loadMetadata.bind(this))
				.then(getHeaders.bind(this))
                .spread(uploadSpreadsheet.bind(this))
                .then(updateLogStatus.bind(this))
				.then(this.cleanup.bind(this, repoPath))
                .catch(updateErrStatus.bind(this))
                .then(done.bind(this));

            function loadMetadata(_repoPath) {
                Utils.logInfo('Loading metadata for', repoPath);
				return Metadata.load(dataPath, this.category, hierArr, dimArr);
            }
			function getHeaders(metadata) {
                Utils.logInfo('Building metadata headers for', repoPath);
                return [Metadata.getHeaders(metadata), metadata];
			}
            function uploadSpreadsheet(headers, metadata) {
                Utils.logInfo('Writing metadata as spreadsheet', repoPath);
                return MetadataXlsx.uploadSpreadSheet(this.userId, this.category, headers, metadata);
            }
            function updateLogStatus(newSheetId) {
                Utils.logInfo('Done checking out metadata', repoPath);
                this.sheetId = newSheetId;
                this.status = MetadataLog.Status.CheckedOut;
                return this.persistSave();
            }
            function updateErrStatus(error) {
                Utils.logInfo('Unable to checkout metadata', repoPath, error);
                this.status = MetadataLog.Status.CheckoutFailed;
                return this.persistSave();
            }
            function done() {
                return this;
            }
		},

		preview: function() {
			return MetadataXlsx.retrieveMetadata(this.sheetId, this.category).then(function(metadata) {
				return {
					headers: Metadata.getHeaders(metadata),
					metadata: Metadata.merge(this.category, strToArr(this.hierarchy), strToArr(this.dimensions), null, metadata)
				};
			}.bind(this));
		},

		checkin: function() {
			var branchName = getBranchName(this.userId, this.category, this.hierarchy, this.dimensions, this.project),
                masterBranchName = MetadataConfig.projectBranches[this.project],
				repoPath = MetadataConfig.getRepoPath(branchName),
				dataPath = MetadataConfig.getDataPath(repoPath);

            Utils.logInfo('Checking out metadata for', repoPath);

			return MetadataScm.checkout(MetadataConfig.repoUrl, repoPath, branchName, masterBranchName)
				.then(retrieveMetadata.bind(this))
				.then(saveMetadata.bind(this))
				.then(checkinMetadata.bind(this))
                .then(deleteSpreadsheet.bind(this))
				.then(deleteMetadataLog.bind(this))
				.then(this.cleanup.bind(this, repoPath))
                .then(done.bind(this))
                .catch(logError);

            function deleteMetadataLog(){
                var txn = objectTemplate.begin();
                txn.preSave = function(txn){
                    return this.persistDelete(txn);
                }.bind(this);
                return objectTemplate.end(txn);
            }

            function retrieveMetadata() {
                Utils.logInfo('Retrieving metadata for', repoPath);
                return MetadataXlsx.retrieveMetadata(this.sheetId, this.category);
            }
            function saveMetadata(metadata) {
                Utils.logInfo('Saving metadata for', repoPath);
                return Metadata.save([dataPath], metadata);
            }
            function checkinMetadata() {
                Utils.logInfo('Checking in metadata for', repoPath);
                return MetadataScm.checkin(repoPath, branchName, '"Checkin by ' + this.userId + '"');
            }
            function deleteSpreadsheet() {
                Utils.logInfo('Deleting spreadsheet for ', repoPath);
                return MetadataXlsx.deleteFile(this.sheetId);
            }
            function done() {
                Utils.logInfo('Done checking in metadata', repoPath);
            }
            function logError(error) {
                Utils.logInfo('Unable to checkin metadata', repoPath, error);
            }
		},

		cleanup: function(repoPath) {
            Utils.logInfo('Cleaning up metadata workspace', repoPath);
            return Utils.deleteDir(repoPath);
		},

        matches: function(userId, category, hierArr, dimArr, project) {
            return userId == this.userId && category == this.category && 
                arrToStr(hierArr) == this.hierarchy && arrToStr(dimArr) == this.dimensions &&
                project == this.project;
        },

		toString: function() {
			return 'User: ' + this.userId + ', Category: ' + this.category + ', Hierarchy: ' + 
				this.hierarchy + ', Dimensions: ' + this.dimensions, ', Project: ' + this.project;
		}
	});
    
    MetadataLog.Status = {
        CheckingIn: 'CheckingIn',
        CheckedIn: 'CheckedIn',
        CheckInFailed: 'CheckInFailed',
        CheckingOut: 'CheckingOut',
        CheckedOut: 'CheckedOut',
        CheckoutFailed: 'CheckoutFailed'
    };
    
	var MetadataApi = objectTemplate.create('MetadataApi', {
        checkoutMetadata: {on: 'server', body: function(userId, category, hierarchy, dimensions, project) {
            var hierStr = arrToStr(hierarchy),
                dimStr = arrToStr(dimensions);
    
            return logCheckout().then(checkout).catch(logError);
    
            function logCheckout() {
                Utils.logInfo('Creating checkout log for', userId, category, hierarchy, dimensions, project);

                return MetadataLog.getFromPersistWithQuery({category: category}).then(findUserCheckoutLog);

                function findUserCheckoutLog(catCheckoutLogs) {
                    var query = {userId: userId, category: category, hierarchy: hierStr, dimensions: dimStr, project: project},
                        userCheckoutLog = _.findWhere(catCheckoutLogs, query);
    
                    return userCheckoutLog ? updateStatus(userCheckoutLog) : newUserCheckoutLog();
                }
                function updateStatus(checkoutLog) {
                    checkoutLog.sheetId = null;
                    checkoutLog.status = MetadataLog.Status.CheckingOut;
                    return saveLog(checkoutLog);
                }
                function newUserCheckoutLog() {
                    var userCheckoutLog = new MetadataLog(userId, category, hierStr, dimStr, project, null, MetadataLog.Status.CheckingOut);
                    return saveLog(userCheckoutLog);
                }
            }
            function saveLog(userCheckoutLog) {
                return userCheckoutLog.persistSave().then(function() {
                    return userCheckoutLog;
                });
            }
            function checkout(userCheckoutLog) {
                return userCheckoutLog.checkout();
            }
            function logError(error) {
                Utils.logError('Unable to checkout metadata for', userId, category, hierarchy, dimensions, project, error);
            }
        }},

        /**
         * Get checkout logs for the given parameters.
         * @param {String} userId - The user id.
         * @param {String} category - The metadata category.
         * @param {String[]} hierarchy - The hierarchies.
         * @param {String[]} dimensions - The dimensions.
         * @param {String} project - The project name.
         * @param {String} status - The status of the checkout. Should be a value of MetadataLog.Status
         * @return {Promise} A promise that resolves to logs, or an empty array if none were found.
         */
        getCheckoutsByStatus: { on: 'server', body: function(userId, category, hierarchy, dimensions, project, status) {
            var hierStr = arrToStr(hierarchy),
                dimStr = arrToStr(dimensions),
                query = {
                    userId: userId, category: category, hierarchy: hierStr, dimensions: dimStr,
                    project: project, status: status
                };

            return MetadataLog.getFromPersistWithQuery(query);
        }},

        /**
         * Get failed checkouts for the given params.
         * @param {String} userId - The user id.
         * @param {String} category - The metadata category.
         * @param {String[]} hierarchy - The hierarchies.
         * @param {String[]} dimensions - The dimensions.
         * @param {String} project - The project name.
         * @return {Promise} A promise that resolves to logs, or an empty array if none were found.
         */
        getFailedCheckouts: {on: 'server', body: function(userId, category, hierarchy, dimensions, project) {
            return this.getCheckoutsByStatus(userId, category, hierarchy, dimensions, project, MetadataLog.Status.CheckoutFailed)
        }},

        /**
         * Get pending checkouts for the given params.
         * @param {String} userId - The user id.
         * @param {String} category - The metadata category.
         * @param {String[]} hierarchy - The hierarchies.
         * @param {String[]} dimensions - The dimensions.
         * @param {String} project - The project name.
         * @return {Promise} A promise that resolves to logs, or an empty array if none were found.
         */
        getPendingCheckouts: {on: 'server', body: function(userId, category, hierarchy, dimensions, project) {
            return this.getCheckoutsByStatus(userId, category, hierarchy, dimensions, project, MetadataLog.Status.CheckingOut)
        }},


        /**
         * Helper to check if the given checkout is finished.
         * @param {String} userId - The user id.
         * @param {String} category - The metadata category.
         * @param {String[]} hierarchy - The hierarchies.
         * @param {String[]} dimensions - The dimensions.
         * @param {String} project - The project name.
         * @return {Promise} A promise that resolves to true if the checkout is done, false otherwise.
         */
        checkoutIsDone: {on: 'server', body: function(userId, category, hierarchy, dimensions, project) {
            return this.getPendingCheckouts(userId, category, hierarchy, dimensions, project)
                .then(function(logs) {
                    return _.isEmpty(logs);
                });
        }},

        /**
         * Helper to check if the given checkout has failed.
         * @param {String} userId - The user id.
         * @param {String} category - The metadata category.
         * @param {String[]} hierarchy - The hierarchies.
         * @param {String[]} dimensions - The dimensions.
         * @param {String} project - The project name.
         * @return {Promise} A promise that resolves to true if the checkout failed, false otherwise.
         */
        checkoutIsFailed: {on: 'server', body: function(userId, category, hierarchy, dimensions, project) {
            return this.getFailedCheckouts(userId, category, hierarchy, dimensions, project)
                .then(function(logs) {
                    return !_.isEmpty(logs);
                });
        }},

        buildMetadata: {on: 'server', body: function(category, hierarchy, dimensions, criteria) {
            var dataLoc = MetadataConfig.getDataPath(MetadataConfig.getAppRootPath());
            return Metadata.build(dataLoc, category, hierarchy, dimensions, criteria);
        }}
    });

	return {
        MetadataApi: MetadataApi,
		MetadataLog: MetadataLog
	};
};
