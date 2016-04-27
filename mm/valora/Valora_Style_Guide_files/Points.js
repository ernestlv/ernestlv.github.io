module.exports.Points = function (objectTemplate, getTemplate) {

    var Utils = getTemplate('./Utils.js').Utils;
    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
    var Rating = getTemplate('./workflow/Rating.js', {client: false});
    var MetadataAdmin = getTemplate('./metadata/MetadataAdmin.js', {client: false});
    var MetadataApi = MetadataAdmin.MetadataApi;

    // Non-Semotus modules
    if (typeof(require) != 'undefined') {
        _ = require('underscore');
    }

    /**
     * Credits/Debits used in Manual Underwriting
     */
    var Point = objectTemplate.create('Point', {
        ruleId: {type: String},
        appValue: {type: String},
        appRuleFailed: {type: Boolean},
        labValue: {type: String},
        labRuleFailed: {type: Boolean},
        rxValue: {type: String},
        rxRuleFailed: {type: Boolean},
        description: {type: String},
        pointsAvailable: {type: Number, rule: ['numeric']},
        pointsAwarded: {type: Number, rule: ['numeric']},

        init: function (ruleId, description, pointsAvailable, pointsAwarded) {
            this.ruleId = ruleId;
            this.description = description;
            this.pointsAvailable = pointsAvailable;
            this.pointsAwarded = pointsAwarded;
        },

        formatDesc: function (vars) {
            var ctr = 1;
            Utils.array(vars).forEach(function (v) {
                this.description = this.description.replace(new RegExp('_' + (ctr++), 'g'), v);
            }.bind(this));
        }
    });

    var Credit = Point.extend('Credit', {
        pointType: {type: String, value: 'rac', isLocal: true},

        init: function (ruleId, description, pointsAvailable, pointsAwarded) {
            Point.call(this, ruleId, description, pointsAvailable, pointsAwarded);
        }
    });

    var Debit = Point.extend('Debit', {
        pointType: {type: String, value: 'rad', isLocal: true},

        init: function (description, pointsAwarded) {
            Point.call(this, null, description, pointsAwarded, pointsAwarded);
        }
    });

    var Preferred = Point.extend('Preferred', {
        pointType: {type: String, value: 'preferred', isLocal: true},

        init: function (ruleId, description, pointsAvailable, pointsAwarded) {
            Point.call(this, ruleId, description, pointsAvailable, pointsAwarded);
        }
    });

    var Points = objectTemplate.create('Points', {
        credits: {type: Array, of: Credit, value: []},
        debits: {type: Array, of: Debit, value: []},
        preferred: {type: Array, of: Preferred, value: []},

        pointsSystem: {type: String, value: 'preferred'},
        pointsSystemValues: {isLocal: true, type: Array, value: ['preferred', 'rac']},
        pointsSystemDescriptions: {
            isLocal: true, type: Object, value: {
                'preferred': 'Preferred points',
                'rac': 'Debits/Credits'
            }
        },

        built: function () {
            return this.preferred.length > 0 && this.credits.length > 0;
        },

        build: function (policy) {
            var self = this,
                mdataKey = Assumptions.metadataKeys.categories.PreferredCreditPoints;

            return new MetadataApi().buildMetadata(mdataKey, [], []).then(buildPts);

            function buildPts(metadataObj) {
                return metadataObj[mdataKey].forEach(function (metadata) {
                    var ruleId = metadata['key'],
                        ptsAvailable = Number(metadata['points_awarded']),
                        desc = (metadata['description'] || 'N/A').trim(),
                        rule = Rating.pointRules[ruleId],
                        preferredPt = new Preferred(ruleId, desc, ptsAvailable),
                        creditPt = new Credit(ruleId, desc, ptsAvailable);

                    if (rule) {
                        runRule(rule, ruleId, metadata, preferredPt);
                        runRule(rule, ruleId, metadata, creditPt);
                    }
                    self.preferred.push(preferredPt);
                    self.credits.push(creditPt);
                });
            }

            function runRule(rule, ruleId, metadata, point) {
                try {
                    point.pointsAwarded = point.pointsAvailable;
                    rule(metadata, policy, point);
                } catch (e) {
                    point.pointsAwarded = null;
                    Utils.logInfo('Point rule', ruleId, 'failed for policy', policy.policyNumber, e.toString());
                }
            }
        },

        totalPreferred: function () {
            return this.preferred.reduce(function (sum, a) {
                return sum + Number(a.pointsAwarded);
            }, 0);
        },

        totalDebitsMinusCredits: function () {
            var debits = this.debits.reduce(function (sum, a) {
                return sum + Number(a.pointsAwarded);
            }, 0);

            var credits = this.credits.reduce(function (sum, a) {
                return sum + Number(a.pointsAwarded);
            }, 0);

            // Map credits to the following points
            // 1-3 points = 0     4 pts = 10     5 pts = 20     6 pts = 30     7 pts = 40     8 pts = 50
            var creditPoints = 0;
            if (credits >= 8) {
                creditPoints = 50;
            } else if (credits >= 7) {
                creditPoints = 40;
            } else if (credits >= 6) {
                creditPoints = 30;
            } else if (credits >= 5) {
                creditPoints = 20;
            } else if (credits >= 4) {
                creditPoints = 10;
            } else if (credits >= 1) {
                creditPoints = 0;
            }

            return debits - creditPoints;
        },

        getRating: function (isSmoker) {
            var finalRateClass = '';

            if (this.pointsSystem === 'preferred') {

                var totalPreferred = this.totalPreferred();

                // {1:'Ultra', 2:'Select', 3:'Standard', 4:'Select Tobacco', 5:'Standard Tobacco'}
                if (totalPreferred >= 10) {
                    finalRateClass = 1; // Ultra
                } else if (totalPreferred >= 8) {
                    finalRateClass = 2; // Select
                } else if (totalPreferred >= 7) {
                    finalRateClass = 4; // Select tobacco
                }
                else {
                    // Standard or Standard tobacco
                    finalRateClass = isSmoker ? 5 : 3;
                }

            } else if (this.pointsSystem === 'rac') {
                var totalDebitsMinusCredits = this.totalDebitsMinusCredits();

                if (totalDebitsMinusCredits > 44) {
                    finalRateClass = ''; // Decline
                } else {
                    // Standard or Standard tobacco
                    finalRateClass = isSmoker ? 5 : 3;
                }
            }

            return finalRateClass;
        }

    });
    Credit.mixin({points: {type: Points}});
    Debit.mixin({points: {type: Points}});
    Preferred.mixin({points: {type: Points}});
    return {
        Points: Points,
        Credit: Credit,
        Debit: Debit,
        Preferred: Preferred
    };
};
