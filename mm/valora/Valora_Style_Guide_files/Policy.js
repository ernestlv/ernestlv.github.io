module.exports.Policy = function (objectTemplate, getTemplate) {

    if (typeof(require) != "undefined") {
        fs = require('fs');
    }

    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
    var Insurers = getTemplate('./static/Insurers.js').Insurers;
    var ProductWaiverPremiums = getTemplate('./static/ProductWaiverPremiums.js').ProductWaiverPremiums;
    var Person = getTemplate('./customer/Person.js').Person;
    var PersonQuery = getTemplate('./customer/Person.js').PersonQuery;
    var Phone = getTemplate('./customer/Person.js').Phone;
    var Digit = getTemplate('./customer/Person.js').Digit;
    var Entity = getTemplate('./customer/Person.js').Entity;
    var Address = getTemplate('./customer/Person.js').Address;
    var Beneficiary = getTemplate('./customer/Person.js').Beneficiary;
    var UniversalBeneficiary = getTemplate('./customer/Person.js').UniversalBeneficiary;
    var Applicant = getTemplate('./customer/Applicant.js').Applicant;
    var ApplicantQuery = getTemplate('./customer/Applicant.js').ApplicantQuery;
    var Workflow = getTemplate('./workflow/Workflow.js', {client: false}).PolicyWorkflow;
    var Utils = getTemplate('./Utils.js').Utils;
    var Counter = getTemplate('./counter.js').Counter;
    var Quotes = getTemplate('./needs/Quotes.js').Quotes;
    var Rating = getTemplate('./workflow/Rating.js', {client: false});
    var RejectedReasons = getTemplate('./static/RejectedReasons.js').RejectedReasons;
    var Admin = getTemplate('./Admin.js').Admin;
    var PackageQuery = getTemplate('docusign/Form.js').PackageQuery;
    var Points = getTemplate('./customer/Points.js').Points;
    var ApsOrder = getTemplate('./customer/ApsOrder.js').ApsOrder;
    var MibCodes = getTemplate('./customer/MibCodes.js').MibCodes;
    var MibCode = getTemplate('./customer/MibCodes.js').MibCode;

    var Policy = objectTemplate.create("Policy", {});

    var IdCheck = objectTemplate.create("IdCheck", {
        _data: {type: Object},

        init: function(data) {
            this._data = data;
        },
        passed: function() {
            return false;
        },
        OFACHit: function() {
            return false;
        }
    });
    var LexisNexisIdCheck = IdCheck.extend('LexisNexisIdCheck', {
        init: function(data) {
            IdCheck.call(this, data);
        }
    });
    var DrivingRecords = objectTemplate.create("DrivingRecords", {});
    var DrivingReport = objectTemplate.create('DrivingReport', {});
    var DrivingViolation = objectTemplate.create('DrivingViolation', {});
    DrivingViolation.violationDateComparator = function(v1, v2) {
        var now = Utils.now(),
            v1Dt = v1.violationDate || now,
            v2Dt = v2.violationDate || now;
        return v1Dt.getTime() - v2Dt.getTime();
    };
    var StandardDrivingViolation = objectTemplate.create('StandardDrivingViolation',
    {
        code: {type: String},
        class: {type: String},
        classValues: {type: Object, isLocal: true, value: Assumptions.standardViolationClass},
        description: {type: String},
        points: {type: String},
        drivingViolation: {type: DrivingViolation},

        init: function(drivingViolation) {
            this.drivingViolation = drivingViolation;
        }
    });
    DrivingViolation.mixin({
        type: {type: String},
        typeValues: {type: Object, isLocal: true, value: Assumptions.drivingViolationTypes},
        violationDate: {type: Date},
        convictionDate: {type: Date},
        description: {type: Array, of: String},
        stateViolationCode: {type: String},
        statePoints: {type: String},
        standardViolations: {type: Array, of: StandardDrivingViolation},
        isDUI: {type: Boolean},
        isAtFaultAccident: {type: Boolean},
        isSpeedingUnder15Mph: {type: Boolean},
        isSpeedingOver15Mph: {type: Boolean},
        isRecklessDriving: {type: Boolean},
        isDrivingWithSuspendedLicense: {type: Boolean},
        isOtherMovingViolation: {type: Boolean},
        isMajorViolation: {type: Boolean},
        isNoMatch: {type: Boolean},
        drivingReport: {type: DrivingReport},

        init: function(drivingReport) {
            this.drivingReport = drivingReport;
        },

        _filterViolationsByStdCode: function(code, filterOut) {
            return (this.standardViolations || []).filter(function(viol) {
                return filterOut ? viol.code != code : viol.code == code;
            });
        },

        _readFromDBHook: function (pojo) {
            if (pojo.description.length > 0 && pojo.description[0].text)
                pojo.description = _.map(pojo.description, function(val) {return val.text})
        }
    });
    var DrivingMessage = objectTemplate.create('DrivingMessage',
    {
        type: {type: String},
        code: {type: String},
        appStatus: {type: String},
        text: {type: String},
        drivingRecords: {type: DrivingRecords},
        drivingReport: {type: DrivingReport},

        init: function(drivingRecords, drivingReport) {
            this.drivingRecords = drivingRecords;
            this.drivingReport = drivingReport;
        }
    });
    DrivingReport.mixin({
        name: {type: String},
        dob: {type: Date},
        gender: {type: String},
        heightInches: {type: Number},
        address: {type: Array, of: String},
        licenseNumber: {type: String},
        licenseState: {type: String},
        licenseStateValues: {type: Object, isLocal: true, value: Assumptions.stateValues},
        licenseClass: {type: String},
        licenseIssuedDate: {type: Date},
        licenseExpirationDate: {type: Date},
        licenseValid: {type: Boolean},
        recordStatus: {type: String},
        violations: {type: Array, of: DrivingViolation},
        messages: {type: Array, of: DrivingMessage},
        drivingRecords: {type: DrivingRecords},

        init: function(drivingRecords) {
            this.drivingRecords = drivingRecords;
        },

        _filterViolationsByProperty: function(propName, filterOut) {
            return (this.violations || []).filter(function(viol) {
                return filterOut ? !viol[propName] : viol[propName];
            });
        },
        _filterViolationsByStdCode: function(code, filterOut) {
            return _.flatten((this.violations || []).map(function(viol) {
                return viol._filterViolationsByStdCode(code, filterOut);
            }), true);
        },
        recordClear: function() {
            return (this.recordStatus && this.recordStatus.match(/clear/i) != null) ||
                this._filterViolationsByStdCode('08110').length > 0 ||
                this._filterViolationsByStdCode('08120').length > 0;
        }
    });

    DrivingRecords.mixin({
        _data: {type: Object},
        reports: {type: Array, of: DrivingReport},
        messages: {type: Array, of: DrivingMessage},
        isNoMatch: {type: Boolean},

        init: function(data) {
            this._data = data;
            this._mapData();
        },
        _mapData: function() {
            // Implemented by subclasses
        },
        recordClear: function() {
            return this.reports.reduce(function(clear, rep) {
                return clear && rep.recordClear();
            }.bind(this), true);
        },
        licenseValid: function() {
            return this.reports.reduce(function(valid, rep) {
                return valid && rep.licenseValid;
            }, true);
        },
        violationCount: function() {
            return this.reports.reduce(function(count, rep) {
                return count + rep.violations.length;
            }, 0);
        },
        movingViolations: function() {
            var movingViols = this._filterViolationsByProperty(['isAtFaultAccident', 'isSpeedingUnder15Mph',
                'isSpeedingOver15Mph', 'isRecklessDriving', 'isDrivingWithSuspendedLicense', 'isOtherMovingViolation',
                'isMajorViolation']).concat(this.illegalCellPhoneViolations());
            movingViols.sort(DrivingViolation.violationDateComparator);
            return movingViols;
        },
        DUIs: function() {
            return this._filterViolationsByProperty('isDUI');
        },
        atFaultAccidents: function() {
            return this._filterViolationsByProperty('isAtFaultAccident');
        },
        speedingViolationsUnder15Mph: function() {
            return this._filterViolationsByProperty('isSpeedingUnder15Mph');
        },
        speedingViolationsOver15Mph: function() {
            return this._filterViolationsByProperty('isSpeedingOver15Mph');
        },
        recklessDrivingViolations: function() {
            return this._filterViolationsByProperty('isRecklessDriving');
        },
        suspendedLicenseViolations: function() {
            return this._filterViolationsByProperty('isDrivingWithSuspendedLicense');
        },
        otherMovingViolations: function() {
            return this._filterViolationsByProperty('isOtherMovingViolation');
        },
        majorViolations: function() {
            return this._filterViolationsByProperty('isMajorViolation');
        },
        illegalCellPhoneViolations: function() {
            return this._filterViolationsByStdCode('68730');
        },
        noMatch: function() {
            return this.isNoMatch || this._filterViolationsByProperty('isNoMatch').length > 0;
        },
        _filterViolationsByProperty: function(propNames, filterOut) {
            return _.flatten(Utils.array(propNames).map(function(propName) {
                return this._sortAndFilterByViolationDate(_.flatten(this.reports.map(function(rep) {
                    return rep._filterViolationsByProperty(propName, filterOut);
                }), true));
            }.bind(this)));
        },
        _filterViolationsByStdCode: function(code, filterOut) {
            return this._sortAndFilterByViolationDate(_.flatten(this.reports.map(function(rep) {
                return rep._filterViolationsByStdCode(code, filterOut);
            }), true));
        },
        _sortAndFilterByViolationDate: function(violations) {
            violations.sort(DrivingViolation.violationDateComparator);
            var prevDt, dt;
            return violations.filter(function(viol) {
                return (prevDt = dt) != (dt = (viol.violationDate ? viol.violationDate.getTime() : Date.now()));
            });
        },
        generateReport: function() {
            return Utils.transformTemplate('mvr.template.html', this, {Utils: Utils}, {bodyOnly: true})
                .then(buildReport);

            function buildReport(repBody) {
                return Utils.transformTemplate('index.template.html', repBody, {Utils: Utils});
            }
        }
    });

    var LexisNexisDrivingRecords = DrivingRecords.extend('LexisNexisDrivingRecords', {
        init: function(data) {
            DrivingRecords.call(this, data);
        }
    });
    var MedicalRecords = objectTemplate.create("MedicalRecords", {
        _data: {type: Object},

        init: function(data) {
            this._data = data;
        }
    });
    var RxRecords = objectTemplate.create("RxRecords", {
        _data:              {type: Object},
        rateCap:            {type: String},     // Deprecated
        smoker:             {type: Boolean},    // Deprecated
        smokerRateCap:      {type: String},
        nonSmokerRateCap:   {type: String},
        resultsURL:         {type: String},

        init: function(data) {
            this._data = data;
            this._mapData();
        },

        _mapData: function() {
            // Implemented by subclasses
        },

        getPhysicians: function() {
            // Implemented by subclasses
        }
    });
    var MillimanRxRecords = RxRecords.extend('MillimanRxRecords', {
        init: function(data) {
            RxRecords.call(this, data);
        }
    });
    var LabRecords = objectTemplate.create("LabRecords", {});
    var LabTestResult = objectTemplate.create('LabTestResult',
    {
        testCode: {type: String},
        testDate: {type: Date},
        testResultCode: {type: String},
        testResultValue: {type: String},
        testResultUnitOfMeasure: {type: String},
        labRecords: {type: LabRecords},

        init: function(labRecords) {
            this.labRecords = labRecords;
        }
    });
    LabTestResult.TEST_CODES = {
        HbA1c: '4', UrineGlucose: '601', UrineMicroalbumin: '1003800763', UrineCreatinine: '607', UrineProtein: '587',
        UrineRBC: '576', SerumCreatinine: '35', BloodAST: '43', BloodALT: '44', BloodGGT: '636', BloodAlbumin: '621',
        BloodAlkPh: '627', BloodBilirubin: '626', BloodPSA: '1003800730', BloodHIVEIA: '1003800722', UrineCocaine: '1003800760',
        BloodAntiHVC: '567', BloodAlcohol: '592', BloodCDT: '546', BloodTriglycerides: '47', UrineCotinine: '561',
        TotalCholesterol: '34', HDL: '543', LDL: '1003800707', CholesterolHDLRatio: '1003800706',
        BloodTotalProtein: '622', BloodGlobulin: '1003800705', BloodGlucose: '1003800704', BloodBUN: '544',
        UrineSpecificGravity: '579'
    };
    LabTestResult.TEST_RESULT_CODES = {
        Positive: 1, Negative: 2
    };
    LabRecords.mixin({
        _data: {type: Object},
        examDate: {type: Date},
        lastAteDate: {type: Date},
        firstDiastolicBPReading: {type: Number},
        firstSystolicBPReading: {type: Number},
        secondDiastolicBPReading: {type: Number},
        secondSystolicBPReading: {type: Number},
        thirdDiastolicBPReading: {type: Number},
        thirdSystolicBPReading: {type: Number},
        firstPulseReading: {type: Number},
        pulseIrregular: {type: Boolean},
        bloodGlucoseLevel: {type: Number},
        heightInches: {type: Number},
        weightLbs: {type: Number},
        urineTemperatureF: {type: Number},
        menstruation: {type: Boolean},
        labTestResults: {type: Array, of: LabTestResult},

        init: function(data) {
            this._data = data;
            this._mapData();
        },
        _mapData: function() {
            // Implemented by subclasses
        },
        insured: function() {
            // return Party object in Acord format
        },
        valid: function() {
            // Implemented by subclasses
        },
        hoursFastedBeforeExam: function() {
            return Utils.timeBetween(this.lastAteDate, this.examDate, 'hrs');
        },
        getTestResult: function(testCode) {
            return _.findWhere(this.labTestResults, {testCode: testCode});
        }
    });
    var ExamOneLabRecords = LabRecords.extend('ExamOneLabRecords', {
        init: function(data) {
            LabRecords.call(this, data);
        }
    });
    var MatResult = objectTemplate.create("MatResult", {
        _data: {type: Object},

        init: function(data) {
            this._data = data;
        },
        score: function() {
            // return float - implemented by subclasses
        }
    });
    var BiosigniaMatResult = MatResult.extend('BiosigniaMatResult', {
        init: function(data) {
            MatResult.call(this, data);
        }
    });
    var MortalityResult = MatResult.extend('MortalityResult', {
        init: function(data) {
            MatResult.call(this, data);
        },
        score: function() {
            // To be implemented
        }
    });

    var PolicyDoc = objectTemplate.create("PolicyDoc", {});
    var PolicyComment = objectTemplate.create("PolicyComment", {});
    var FlatExtra = objectTemplate.create("FlatExtra", {});

    var PremiumBreakdown = objectTemplate.create("PremiumBreakdown",
    {
        base: {type: Number, value: 0},
        waiver: {type: Number, value: 0},
        flatExtras: {type: Array, of: FlatExtra, value: []},
        policy: {type: Policy},

        init: function (base, waiver, flatExtras, policy) {
            this.policy = policy;
            if (typeof(base) != 'undefined')
                this.update(base, waiver, flatExtras);
        },
        update: function(base, waiver, flatExtras) {
            this.base = base;
            this.waiver = this.policy.waiver ? Utils.round(waiver, 2) : 0;
            this.flatExtras = (flatExtras || []).map(function(fe) {
                return new FlatExtra(fe.name, fe.amount, this.policy, this);
            }.bind(this));
        },
        getTotal: function () {
            return Utils.round(this.base + this.waiver + this.getTotalFlatExtras(), 2);
        },
        getTlicTotal: function () {
            var total = this.getTotal();
            return total.toFixed(2);
        },
        getTotalFlatExtras: function() {
            var units = (this.policy.faceAmount / Assumptions.faceUnitSize);
            var total = this.flatExtras.reduce(function (sum, flatExtra) {
                return sum + flatExtra.getMonthlyAmount(units);
            }.bind(this), 0);
            return Utils.round(total, 2).toFixed(2) * 1;
        },
        getTotalUnitFlatExtras: function() {
            var total = this.flatExtras.reduce(function (sum, flatExtra) {
                return sum + flatExtra.amount;
            }.bind(this), 0);
            return Utils.round(total, 2).toFixed(2) * 1;
        }
    });
    FlatExtra.mixin({
        name: {type: String},
        amount: {type: Number, value: 0}, // This is amount per face unit per year
        premiumBreakdown: {type: PremiumBreakdown},
        policy: {type: Policy},

        init: function (name, amount, policy, premiumBreakdown) {
            this.name = name;
            this.amount = amount;
            this.premiumBreakdown = premiumBreakdown;
            this.policy = policy;
        },
        getMonthlyAmount: function() {
            var units = this.policy ? (this.policy.faceAmount / Assumptions.faceUnitSize) : 12;
            return Utils.round(this.amount * units / 12, 2);
        }
    });

    var WorkflowStateHistory = objectTemplate.create("WorkflowStateHistory",
    {
        state:      {type: String},
        subState:   {type: String},
        startTime:  {type: Date},
        endTime:    {type: Date},
        policy:     {type: Policy},

        init: function(state, subState, startTime, endTime) {
            this.state = state;
            this.subState = subState;
            this.startTime = startTime;
            this.endTime = endTime;
        }
    });
    
    var PolicyMixin = {
        wasCanceledDeclinedRejected: function(){
            var workflowState = this.futureWorkflowState || this.workflowState;
            return workflowState && workflowState.match(/Canceled|Rejected|Declined/);
        }
    };

    Policy.mixin(Utils.extend({}, PolicyMixin,
	{
        clientInit: function () {
            this.waiverPremium = null;
        },
        policyNumber: {type: String},

        carrier: {type: String},
        product: {type: String},
        productType: {type: String},
        getProductName: function () {
            return this.getProductInfo().name + ' ' + this.term + ' year policy';
        },
        getChannel: function() {
            var channelCodes = _.values(Assumptions.channelCodes);

            var channelProductMatch = function (channel) {
                return _.values(Assumptions.productCodes[channel]).indexOf(this.product) > -1 ? channel : false;
            }.bind(this);

            return _.find(channelCodes, channelProductMatch);
        },

        product: {type: String, value: Assumptions.products.HavenTerm.code},
        getProductInfo: function () {
            return Assumptions.products[this.product];
        },

        productType: {type: String, value: Assumptions.productTypes.Term.code},
        getProductTypeInfo: function () {
            return Assumptions.productTypes[this.productType];
        },

        getChannelCode: function () {
            return this.getProductInfo().channel.code;
        },
        getChannelInfo: function () {
            return this.getProductInfo().channel;
        },
        getLanguage: function () {
            return this.customer.language;
        },

        // Policy status
        tLICStatus:       {type: String},
        tLICStatusValues: {isLocal: true, type: Array, values: [Assumptions.policyStatus.issued, Assumptions.policyStatus.active,
            Assumptions.policyStatus.lapsePending, Assumptions.policyStatus.notTaken, Assumptions.policyStatus.canceled,
            Assumptions.policyStatus.rescinded]},
        status:       {type: String},
        statusValues: {isLocal: true, type: Array, values: [Assumptions.policyStatus.issued, Assumptions.policyStatus.active,
            Assumptions.policyStatus.lapsePending, Assumptions.policyStatus.lapsed, Assumptions.policyStatus.notTaken,
            Assumptions.policyStatus.canceled, Assumptions.policyStatus.freeLooked, Assumptions.policyStatus.rescinded]},

        onTLICStatus: function(statusMsg) {
            this.tLICStatus = statusMsg.getPolicyStatus();
        },
        onPolicyStatus: function(statusMsg) {
            this.status = statusMsg.getPolicyStatus();

            if (this.status == Assumptions.policyStatus.lapsePending) {
                this.willLapseOn = statusMsg.getGracePeriodEndDate();

            } else if (this.status == Assumptions.policyStatus.active) {
                this.canBeReinstatedUntil = (this.canBeReinstatedUntil ||
                    Utils.offsetDate(statusMsg.getStatusChangeDate(), Assumptions.reinstatmentPeriodYrs, 'years'));
            }
        },

        incomeReplRuleFailed: function(){
            var existingPolicies = this.insured.existingPolicies.existingPolicyList;

            var face = this.faceAmount + _.where(existingPolicies, {status: 'Inforce'}).reduce(function(sum, pol) {
                return sum + pol.face;
            }, 0);
            var earnedIncome = this.insured.financials.annualIncome;

            if (earnedIncome) {
                var ratio = face / earnedIncome;

                var insuredAge = this.insured.person.age;
                if (insuredAge <= 35) {
                    // Must be 30 or lower
                    return ratio > 30;
                } else if (insuredAge <= 40) {
                    return ratio > 25;
                } else if (insuredAge <= 45) {
                    return ratio > 20;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        },

        // Important Policy dates
        submittedAt:            {type: Date},
        submittedFromIP:        {type: String},
        canBeReinstatedUntil:   {type: Date},
        issuedDate:             {type: Date},
        willLapseOn:            {type: Date},
        freeLookEndsOn:         {type: Date},
        paramedRequiredBy:      {type: Date},
        offerRequiredBy:        {type: Date},
        tLICEffectiveDate:      {type: Date},
        effectiveDate:          {type: Date},

        isSaveAge:              {type: Boolean},

        // Date Calculations
        canReinstate: function () {
            return this.workflowState == 'Terminated' && this.workflowSubState == 'Lapsed' &&
                this.canBeReinstatedUntil && (this.canBeReinstatedUntil.getTime() > (new Date()).getTime());
        },
        onPolicyDocsIssued: function (issuedDate) {
            this.freeLookEndsOn =  Utils.offsetDate(issuedDate, Assumptions.freeLookPeriodDays, 'days');
        },
        hasPaymentFailed: function () {
            return this.tLICStatus == 'Issued' && this.workflowState == 'TLIC Issued' ||
                   this.workflowSubState == 'Lapse Pending';
        },
        canGetAnotherPolicy: function () {
            return !(this.workflowState == 'TLIC Application' || this.workflowState == 'TLIC Issued' ||
                     this.workflowState == 'Haven Application');
        },
        onApplicationSignedTLIC: function (signedDate, signedState) {
            this.applicationSignedDate = signedDate;
            this.applicationSignedState = signedState;
            this.tLICEffectiveDate = signedDate;
            this.paramedRequiredBy = Utils.offsetDate(signedDate, Assumptions.TLICParamedDays, 'days');
        },
        tlicAccepted: function() {
            return this.tLICEffectiveDate != null;
        },
        policyAccepted: function() {
            return this.effectiveDate != null;
        },
        policyIsInEffect: function() {
            return this.effectiveDate != null && !this.workflowState.match(/canceled|terminated/i);
        },
        onApplicationSignedMUW: function (signedDate, signedState) {
            this.applicationSignedDate = signedDate;
            this.applicationSignedState = signedState;
            this.paramedRequiredBy = Utils.offsetDate(signedDate, Assumptions.MUWParamedDays, 'days');
        },
        applicationHasBeenSigned: function() {
            return this.applicationSignedDate != null;
        },
        calculateUwDeadlineDate: function() {
            if (this.applicationHasBeenSigned()) {
                var days = Rating.isRated(this.tLICRateClass) ? Assumptions.ranOutOfDaysForUWWithTLIC :
                    Assumptions.ranOutOfDaysForUWWithoutTLIC;
                return Utils.offsetDate(this.applicationSignedDate, days, 'days');
            }
            return null;
        },
        calculateNextPremiumDueDate: function() {
            var today = Utils.now(), dueDate = Utils.offsetDate(this.effectiveDate, 1, 'month');
            if (dueDate < today) {
                dueDate = Utils.now();
                dueDate.setDate(this.effectiveDate.getDate());
                if (dueDate < today) dueDate = Utils.offsetDate(dueDate, 1, 'month');
            }
            return dueDate;
        },
        getOwnerTimezoneOffsetMins: function() {
            return Utils.tzDate(Utils.now(), this.getOwnerTimezone()).timezoneOffset();
        },
        toGmtFromOwnerTimezone: function(date) {
            return new Date(date.getTime() - Utils.milliseconds(this.getOwnerTimezoneOffsetMins(), 'mins'));
        },
        onPolicyAutoIssue: function() {
            var insAgeDate = this.insured.getInsuranceAgeDate(), now = Utils.now();

            this.offerRequiredBy = Utils.offsetDate(now, Assumptions.autoIssueEffAfterDays, 'days');
            this.isSaveAge = insAgeDate >= now && insAgeDate <= this.offerRequiredBy;
            this._setEffectiveDate(this.isSaveAge ? this.toGmtFromOwnerTimezone(Utils.offsetDate(insAgeDate, -1, 'day')) :
                this.offerRequiredBy);
        },
        onPolicyApproved: function() {
            var insAgeDate = this.insured.getInsuranceAgeDate(), now = Utils.now();

            this.offerRequiredBy = Utils.offsetDate(now, Assumptions.policyConfirmDays, 'days');
            this.isSaveAge = insAgeDate >= now && insAgeDate <= this.offerRequiredBy;

            if (this.isSaveAge) {
                this._setEffectiveDate(this.toGmtFromOwnerTimezone(Utils.offsetDate(insAgeDate, -1, 'day')));
            }
        },
        isInsuranceAgeChangingBetween: function(dt1, dt2) {
            var insAgeDate = this.insured.getInsuranceAgeDate();
            return insAgeDate >= dt1 && insAgeDate <= dt2;
        },
        onPolicyIssueConfirmed: function(confirmDate) {
            if (!this.effectiveDate || confirmDate < this.effectiveDate) {
                this._setEffectiveDate(confirmDate);
            }
        },
        _setEffectiveDate: function(dt) {
            this.effectiveDate = dt;
            if (this.effectiveDate.getDate() > 28) this.effectiveDate.setDate(28);
            this.paymentDay = this.effectiveDate.getDate();
            this.setFinalAlgoRateClass(this.finalAlgoRateClass);
            this.setRateClass(this.finalRateClass);
        },

        showInAccountCenter:        {type: Boolean, value: true, toServer: false},
        removeFromAccountCenter:    {on: "server", body: function () { // SecReviewed
            this.showInAccountCenter = false;
        }},

        isValidating: {isLocal:true, type: Boolean},

        rejectedReasons: {type: Array, of: String, value: []},
        rejectedReasonsGet: function(){ // For the UI
            if (!this.rejectedReasons || this.rejectedReasons.length == 0) {
                return null;
            }

            if (this.rejectedReasons.length == 1) {
                return {
                    many: false,
                    description: RejectedReasons.descriptions[this.rejectedReasons[0]],
                    shortDescriptions: []
                };
            } else if (  _.contains(this.rejectedReasons, RejectedReasons.codes.ECONOMIC_INCENTIVE_ARRANGEMENTS) ){
                return {
                    many: false,
                    description: RejectedReasons.descriptions[RejectedReasons.codes.ECONOMIC_INCENTIVE_ARRANGEMENTS],
                    shortDescriptions: []
                };
            }
            return {
                many: true,
                description: RejectedReasons.descriptions[RejectedReasons.codes.MULTIPLE_REASONS],
                shortDescriptions: this.rejectedReasons.map(function(reason) {
                    return RejectedReasons.shortDescriptions[reason];
                })
            };
        },
        addRejectedReasons: function(reasons) {
            this.rejectedReasons = this.rejectedReasons || [];

            Utils.array(reasons).forEach(function(reason) {
                if (!_.contains(this.rejectedReasons, reason)) {
                    this.rejectedReasons.push(reason);
                }
            }.bind(this));
        },
        canGetVantage: {type: Boolean},
        isMoreThanQuoted: function () {
            return this.tLICPremiumBreakdown.getTotal() < this.premiumBreakdown.getTotal();
        },

        insured:    {type: Applicant},
        insuredType: {type: String, rule: "required"},
        insuredTypeValues: {isLocal: true, type: Array, value: ['you', 'spouse', 'partnerfiance']},
        insuredTypeDescriptions: {isLocal: true, type: Object, // Are you the insured
            value: {'you': "Yes", 'spouse':"No, my spouse", 'partnerfiance':"No, my partner or fiance"}},

        capitalizeFirstLetter: function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        lowerCaseFirstLetter: function(string) {
            return string.charAt(0).toLowerCase() + string.slice(1);
        },

        // Set ownerType initial value
        insuredTypeTrigger: function(){
            if(this.insuredType === "spouse"){
                // valid owner options - you, spouse
                if(this.ownerType === 'partnerfiance'){
                    this.ownerType = null;
                }
            } else if(this.insuredType === 'partnerfiance'){
                // valid owner options - you, partnerfiance
                if(this.ownerType === 'spouse'){
                    this.ownerType = null;
                }
            }
        },

        getInsuredPronoun: function () {
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'you',
                spouse:         'your spouse',
                partnerfiance:  'your partner'
            };

            return pronouns[insuredType];
        },

        getInsuredPossessivePronoun: function () {
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'your',
                spouse:         'your spouse\'s',
                partnerfiance:  'your partner\'s'
            };

            return pronouns[insuredType];
        },

        getInsuredPossessivePronounUC: function () {
            return this.capitalizeFirstLetter(this.getInsuredPossessivePronoun());
        },

        getInsuredGenderedPronoun: function() {
            if (this.insured.person.gender === "1") { return "his"; }
            if (this.insured.person.gender === "2") { return "her"; }
            return "";
        },

        getInsuredGenderedPronounUC: function() {
            return this.capitalizeFirstLetter(this.getInsuredGenderedPronoun());
        },

        getInsuredTheirPronoun: function () {
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'your',
                spouse:         'their',
                partnerfiance:  'their'
            };

            return pronouns[insuredType];
        },

        getInsuredPossessiveAltPronoun: function () {
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'yours',
                spouse:         'your spouse\'s',
                partnerfiance:  'your partner\'s'
            };

            return pronouns[insuredType];
        },

        getAreInsuredPronoun: function () {
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'Are you',
                spouse:         'Is your spouse',
                partnerfiance:  'Is your partner'
            };

            return pronouns[insuredType];
        },

        getAreInsuredPronounLC: function () {
            return this.lowerCaseFirstLetter(this.getAreInsuredPronoun());
        },

        getDoInsuredPronoun: function () {
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'Do you',
                spouse:         'Does your spouse',
                partnerfiance:  'Does your partner'
            };

            return pronouns[insuredType];
        },

        getDoInsuredPronounLC: function () {
            return this.lowerCaseFirstLetter(this.getDoInsuredPronoun());
        },

        getWereInsuredPronoun: function () {
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'Were you',
                spouse:         'Was your spouse',
                partnerfiance:  'Was your partner'
            };

            return pronouns[insuredType];
        },

        getWereInsuredPronounLC: function () {
            return this.lowerCaseFirstLetter(this.getWereInsuredPronoun());
        },

        getHaveInsuredPronoun: function () {
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'Have you',
                spouse:         'Has your spouse',
                partnerfiance:  'Has your partner'
            };

            return pronouns[insuredType];
        },

        getHaveInsuredPronounLC: function () {
            return this.lowerCaseFirstLetter(this.getHaveInsuredPronoun());
        },

        getInsuredPronounAre: function(){
            var insuredType = this.insuredType || 'you';
            var pronouns = {
                you:            'you are',
                spouse:         'your spouse is',
                partnerfiance:  'your partner is'
            };

            return pronouns[insuredType];
        },

        getYouInsuredPronoun: function () {
            return this.insuredType === "you" ? "you" : this.insured.person.firstName;
        },

        getYourInsuredPronoun: function () {
            return this.insuredType === "you" ? "your" : this.insured.person.firstName + "'s";
        },

		reasonForInsuranceShort:         {type: String, value: null, rule: "required"},
        reasonForInsuranceShortValues:   {isLocal: true, type: Array, value: ['FP', 'O']},
        reasonForInsuranceShortDescriptions:
            {isLocal: true, type: Object, value: {'FP':'Yes', 'O':"No, it's for other purposes"}},
        reasonForInsuranceShortTrigger: function() {
            if(this.reasonForInsuranceShort === 'FP'){
                this.reasonForInsurance = null;
            }
        },

        reasonForInsurance:         {type: String, value: null, rule: "required"},
        reasonForInsuranceValues:   {isLocal: true, type: Array, value:['FI', 'P', 'R', 'E', 'I', 'EP', 'B', 'O', 'N', 'U']},
        reasonForInsuranceDescriptions:   {isLocal: true, type: Object, value:
        {FI:"Family Income",P:"Personal",R:"Retirement",E:"Education",
            I:"Investment",EP:"Estate Planning",B:"Business","O":"Other",N:"None", U:"Unknown"}},

        getReasonForInsurance: function () {
            return this.reasonForInsuranceShort == 'FP' ? true : this.reasonForInsurance;
        },
        getOtherReason: function () {
            return this.reasonForInsuranceShort != 'FP'
        },
        getReasonForInsuranceDescription: function () {
            if (this.getOtherReason) {
                return this.reasonForInsuranceDescriptions[this.getReasonForInsurance()];
            }
        },

        copySpouseInfoToBene: function(bene){
            bene.person = this.ownerPerson;
            bene.address = this.ownerPersonResidentialAddress;
            bene.phone = this.ownerPersonPhone;
        },

        _newBeneficiary: function(type) {
            var beneficiary = new Beneficiary(this, type);
            beneficiary.entity = new Entity(this.customer);
            beneficiary.entity.legalAddress = new Address(this.customer);
            beneficiary.entity.phone = new Phone(this.customer);
            beneficiary.person = new Person(this.customer);
            beneficiary.address = new Address(this.customer);
            beneficiary.phone = new Phone(this.customer);
            return beneficiary;
        },
		primaryBeneficiary:    {type: Array, of: Beneficiary, value: []},
        primaryBeneficiaryAdd: function () {
            // If type is Trust under will or estate, bene info is
            // not needed
            if(this.beneficiaryType === "2" || this.beneficiaryType === "6"){
                return;
            }

            var beneficiary = this._newBeneficiary("primaryBeneficiary");
            this.primaryBeneficiary.push(beneficiary);
            beneficiary.setRatios(this.primaryBeneficiary);

        },
        primaryBeneficiaryRemove: function (beneficiary) {
            for (var ix = 0; ix < this.primaryBeneficiary.length; ++ix) {
                if (this.primaryBeneficiary[ix] == beneficiary) {
                    this.primaryBeneficiary.splice(ix, 1);
                }
            }

            if (this.primaryBeneficiary.length > 0) {
                this.primaryBeneficiary[0].setRatios(this.primaryBeneficiary);
            }
        },
        primaryBeneficiaryCanRemove: function () {
            return this.primaryBeneficiary.length > 1;
        },
        primaryBeneficiaryCanAdd: function () {
            return this.primaryBeneficiary.length < 5;
        },
        primaryBeneficiaryRemoveAll: function ()  {
            this.primaryBeneficiary = [];
        },
        beneficiaryType:       {type: String, value: "9", rule: "required"},

        /*
         9: spouse;
         13: children
         1: Named individuals
         2: estate";
         6: trust under insured will;
         7: Other trust;
         */

        beneficiaryTypeValues: function(){

            // refer to section 8.4. of Requirements_Application doc
            var spouse = "spouse";
            if(this.insuredType === 'partnerfiance'){
                spouse = "partner or fiance";
            }
            var insert = "";
            var insertLC = "";

            if(this.insuredType === this.ownerType){
                if(this.insuredType === "you"){
                    spouse = "Your spouse or partner/fiance";
                    insert = "Your";
                    insertLC = "your";
                }
                else{
                    spouse = this.insured.person.firstName + "'s "+  spouse;
                    insert = insertLC = this.insured.person.firstName + "'s";
                }
            }else{
                //if(this.ownerType === "you"){
                //    spouse = this.ownerPerson.firstName;
                //    insert = insertLC = this.insured.person.firstName + "'s";
                //}
                //else{
                    //spouse = this.ownerPerson.firstName;
                    insert = insertLC = this.insured.person.firstName + "'s";
                    spouse = this.ownerPerson.getFullName();
                    //insert = "Your";
                    //insertLC = "your";
                //}

            }

            var ret = {};

            ret["9"] =  spouse;
            ret["13"] = insert +" children";
            ret["1"] =  "Other named individuals";
            ret["2"] =  insert + " estate";
            ret["6"] =  "A trust under " + insertLC + " will";

            if(this.insuredType === this.ownerType) {
                ret["7"] = "Other trust";
            }

            return ret;
        },
        beneficiaryTypeTrigger: function(){

            // Avoid running triggers during final validation
            if(this.isValidating){
                return;
            }

            this.primaryBeneficiaryRemoveAll();

            // No primary benes if estate or trust under will
            (this.beneficiaryType === "2" || this.beneficiaryType === "6") ? '' : this.primaryBeneficiaryAdd();

            // No contingents if type is Other trust or Trust under will or Estate
            if(this.beneficiaryType === "2" || this.beneficiaryType === "6" || this.beneficiaryType === "7"){
                this.hasContingentBeneficiary = null;
                this.contingentBeneficiaryRemoveAll();
            }
        },
        getBeneficiaryType: function() {
            return this.beneficiaryType == '13' ? (this.beneficiaryChildrenEvenSplit==="true" ? this.beneficiaryChildrenType : "1") : this.beneficiaryType;
        },
        beneficiaryPerStirpes: {type: Boolean, rule: ["required"]},
        beneficiaryPerStirpesValues: {isLocal: true, type: Array, value: ["true", "false"]},
        beneficiaryPerStirpesDescriptions: {isLocal: true, type: Object, value: {"true": "Yes", "false":"No"}},

        beneficiaryChildrenType:       {type: String, rule: ["required"]},
        beneficiaryChildrenTypeValues: {isLocal: true, type: Array, value: ["15", "12"]},
        beneficiaryChildrenTypeDescriptions: {isLocal: true, type: Object, value:
            {"15":"All lawful children",
            "12": "Only children from a specific marriage"}},
        beneficiaryOtherParentName:     {type: String, rule: ["required"]},

        beneficiaryChildrenEvenSplit: {type: Boolean, rule: ["required"]},
        beneficiaryChildrenEvenSplitValues: {isLocal: true, type: Array, value: ["false", "true"]},
        beneficiaryChildrenEvenSplitDescriptions: {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        beneficiaryChildrenEvenSplitTrigger: function() {
            if (this.beneficiaryChildrenEvenSplit) {
                this.primaryBeneficiary[0].setRatios(this.primaryBeneficiary);
            }
        },

        hasContingentBeneficiary: {type: Boolean, rule: ["required"]},
        hasContingentBeneficiaryValues: {isLocal: true, type: Array, value: ["false", "true"]},
        hasContingentBeneficiaryDescriptions: {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},
        hasContingentBeneficiaryTrigger: function(){
            if(this.hasContingentBeneficiary){
                if(this.contingentBeneficiary.length === 0){
                    this.contingentBeneficiaryAdd();
                }
            }
            else{
                this.contingentBeneficiaryRemoveAll();
            }
        },

        contingentBeneficiaryType:       {type: String, value: "", rule: "required"},
        contingentBeneficiaryTypeTrigger: function(){

            // Avoid running triggers during final validation
            if(this.isValidating){
                return;
            }
            if(this.hasContingentBeneficiary){
                this.contingentBeneficiaryRemoveAll();
                this.contingentBeneficiaryAdd();
            }
        },
        contingentBeneficiaryTypeValues: function(){
            var ret = this.beneficiaryTypeValues();

            delete ret["2"]; // no estate
            delete ret["6"]; // no trust under will
            if(this.insuredType !== this.ownerType) { // no other trust only when insured != owner
                delete ret["7"];
            }

            // If primary bene is spouse, get rid of spouse option from contingent
            if(this.beneficiaryType === "9") {
                delete ret["9"];
            }
            return ret;
        },
        // Todo:  I don't think this is correct and is only used in Acord so should be looked at.  There is no type 1 beneficiary I don't think
        getContingentBeneficiaryType: function() {
            return this.contingentBeneficiaryType == '13' ? (this.contingentBeneficiaryChildrenEvenSplit==="true" ? this.contingentBeneficiaryChildrenType : "1") : this.contingentBeneficiaryType;
        },
        contingentBeneficiaryPerStirpes: {type: Boolean, rule: ["required"]},
        contingentBeneficiaryPerStirpesValues: {isLocal: true, type: Array, value: ["true", "false"]},
        contingentBeneficiaryPerStirpesDescriptions: {isLocal: true, type: Object, value: {"true": "Yes", "false":"No"}},

        contingentBeneficiaryChildrenType:       {type: String, rule: ["required"]},
        contingentBeneficiaryChildrenTypeValues: {isLocal: true, type: Array, value: ["15", "12"]},
        contingentBeneficiaryChildrenTypeDescriptions: {isLocal: true, type: Object, value:
        {"15":"All lawful children",
            "12": "Only children from a specific marriage"}},
        contingentBeneficiaryOtherParentName:     {type: String, rule: ["required"]},

        contingentBeneficiaryChildrenEvenSplit: {type: Boolean, rule: ["required"]},
        contingentBeneficiaryChildrenEvenSplitValues: {isLocal: true, type: Array, value: ["false", "true"]},
        contingentBeneficiaryChildrenEvenSplitDescriptions: {isLocal: true, type: Object, value: {"true": "Yes", "false":"No"}},

        contingentBeneficiaryChildrenEvenSplitTrigger: function() {
            if (this.contingentBeneficiaryChildrenEvenSplit) {
                this.contingentBeneficiary[0].setRatios(this.contingentBeneficiary);
            }
        },

		contingentBeneficiary: {type: Array, of: Beneficiary, value: []},
        contingentBeneficiaryAdd: function () {
            // If type is Trust under will or estate, bene info is
            // not needed
            if(this.contingentBeneficiaryType === "2" || this.contingentBeneficiaryType === "6"){
                return;
            }

            var beneficiary = this._newBeneficiary("contingentBeneficiary");
            this.contingentBeneficiary.push(beneficiary);
            beneficiary.setRatios(this.contingentBeneficiary);
        },
        contingentBeneficiaryRemove: function (beneficiary) {
            for (var ix = 0; ix < this.contingentBeneficiary.length; ++ix)
                if (this.contingentBeneficiary[ix] == beneficiary)
                    this.contingentBeneficiary.splice(ix, 1);
            if (this.contingentBeneficiary.length > 0)
                this.contingentBeneficiary[0].setRatios(this.contingentBeneficiary);
        },
        /*
         9: spouse;
         13: children
         1: Named individuals
         2: estate";
         6: trust under insured will;
         7: Other trust;
         */
        contingentBeneficiaryRemoveAll: function ()  {
            this.contingentBeneficiary = [];
        },
        contingentBeneficiaryCanRemove: function () {
            return this.contingentBeneficiary.length > 1;
        },
        contingentBeneficiaryCanAdd: function () {
            return this.contingentBeneficiary.length < 5;
        },
        isSolePrimaryBeneficiary: function() {  // Use main form for spouse or one primary and one continguent beneficiary only
            return (this.beneficiaryType == '9' || (this.beneficiaryType == '1' && this.primaryBeneficiary.length == 1));
        },
        isSoleContingentBeneficiary: function() {
            return (!this.contingentBeneficiaryType || this.contingentBeneficiaryType == '9' ||
                (this.contingentBeneficiaryType == '1' && this.contingentBeneficiary.length == 1));
        },
        isSoleBeneficiary: function() {
            return this.isSolePrimaryBeneficiary() && this.isSoleContingentBeneficiary();
        },
        isNonNamedBeneficiary: function () {
            return this.beneficiaryType == 2 ||this.beneficiaryType == 6;
        },
        getSolePrimaryBeneficiary: {type: UniversalBeneficiary, body: function() {
            return this.isSoleBeneficiary() ? new UniversalBeneficiary(this.primaryBeneficiary[0], 'primary') :
                new UniversalBeneficiary(this._newBeneficiary("primaryBeneficiary"), 'primary');
        }},
        getSoleContingentBeneficiary: {type: UniversalBeneficiary, body: function() {
            return this.isSoleBeneficiary() || this.contingentBeneficiary.length == 0 ?
                new UniversalBeneficiary(this.contingentBeneficiary[0], 'contingent') :
                new UniversalBeneficiary(this._newBeneficiary("contingentBeneficiary"), 'contingent');
        }},
        getSolePrimaryBeneRelationshipForDs: function(){
            if (this.contingentBeneficiary.length > 0 ) {
                return null;
            }
            return this.getSolePrimaryBeneficiary().getBeneficiaryRelationship()
        },
        countAllBeneficiaries: function() {
            return this.getAllBeneficiaries().length;
        },
        /*
        Returns a list of Universal Beneficaries soley for the purpose of populated the haven
        beneficary designation form
         */
        getAllBeneficiaries: {type: Array, of: UniversalBeneficiary, body: function () {
            var beneficiaries = [];

            if (this.isSoleBeneficiary()) {
                return beneficiaries;  // None form not present
            }
            if (this.isNonNamedBeneficiary()) { // Non-named trust or estate
                beneficiaries.push(new UniversalBeneficiary(new Beneficiary(this, 'primaryBeneficiary'), 'primary'));
            }
            for (var ix = 0; ix < this.primaryBeneficiary.length; ++ix)
                if (ix == 0 || this.beneficiaryType == 13 || this.beneficiaryType == 1) // Keep out extra garbage
                    beneficiaries.push(new UniversalBeneficiary(this.primaryBeneficiary[ix], 'primary'));
            if (!this.isNonNamedBeneficiary())
                for (var ix = 0; ix < this.contingentBeneficiary.length; ++ix)
                    if (ix == 0 || this.contingentBeneficiaryType != 9) // One spouse only please
                        beneficiaries.push(new UniversalBeneficiary(this.contingentBeneficiary[ix], 'contingent'));

            return beneficiaries;
        }},

        countMMBeneficiariesPages: function() {
            return Math.ceil(Math.max(this.countAllBeneficiaries(), 0) / 5);
        },

        countMMBeneficiariesPagesOwnerSameAsInsured: function () {
            return this.isOwnerSameAsInsured() ? Math.ceil(Math.max(this.countAllBeneficiaries(), 0) / 5) : 0;
        },

        countMMBeneficiariesPagesOwnerOtherThanInsured: function() {
            return this.isOwnerSameAsInsured() ? 0 : Math.ceil(Math.max(this.countAllBeneficiaries(), 0) / 5);
        },

        getMMBeneficiariesPageVarying: {type: Array, of: UniversalBeneficiary, body: function(pageOffset) {
            pageOffset = pageOffset || 0;
            var ofs = pageOffset * 5;
            var benes = this.getAllBeneficiaries();
            if (ofs > 0)
                benes.splice(0, ofs);
            return benes;
        }},
        utmaNeeded: function(){

            // If type is children
            if(this.beneficiaryType === "13" || this.contingentBeneficiaryType == "13"){
                return true;
            }
            // Or if spouse or other named and there is a minor
            else if(this.beneficiaryType === "9" || this.beneficiaryType === "1" ||
                    this.contingentBeneficiaryType === "9" || this.contingentBeneficiaryType === "1"){
                // Go thru all the beneficiaries. If atleast one is under 21, return true
                for(var i=0; i<this.primaryBeneficiary.length; i++){
                    if(this.primaryBeneficiary[i].person && this.primaryBeneficiary[i].person.age && this.primaryBeneficiary[i].person.age<21){
                        return true;
                    }
                }
                for(i=0; i<this.contingentBeneficiary.length; i++){
                    if(this.contingentBeneficiary[i].person && this.contingentBeneficiary[i].person.age && this.contingentBeneficiary[i].person.age<21){
                        return true;
                    }
                }
                return false;
            }
            else {
                return false;
            }
        },

        needCustodian: {type: Boolean, rule: ["required"]},
        needCustodianValues: {isLocal: true, type: Array, value: ["false", "true"]},
        needCustodianDescriptions: {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        custodianLastName: {type: String, rule: "required"},
        custodianFirstName: {type: String, rule: "required"},
        custodianState: {type: String, rule: "required"},
        custodianStateValues: {isLocal: true, type: Object, value: Assumptions.stateValues},

        getCustodianFullName: function() {
            return this.needCustodian ? this.custodianFirstName + " " + this.custodianLastName : "" ;
        },
        getCustodianState: function() {
            return this.needCustodian ? this.custodianFirstName + " " + this.custodianLastName : "";
        },

        ownerType:      {type: String, rule: "required"},
        ownerTypeValues: {isLocal: true, type: Array, value: []},
        ownerTypeValuesGet: function() {
            var values = this.ownerTypeValues = [];
            if (!this.insuredType || this.insuredType === 'you') { values.push('you', 'spouse', 'partnerfiance'); }
            if (this.insuredType === 'spouse') { values.push('you', 'spouse') }
            if (this.insuredType === 'partnerfiance') { values.push('you', 'partnerfiance'); }
            this.ownerTypeValues = values;
            return values;
        },
        ownerTypeDescriptions: {
            isLocal: true,
            type: Object, // Are you the owner
            value: {
                you: {
                    text: 'Yes',
                    width: '2'
                },
                spouse: {
                    text: 'No, my spouse',
                    width: '4'
                },
                partnerfiance: {
                    text: 'No, my partner or fiance',
                    width: '6'
                }
            }
        },
        getOwnerRelationshipDocusign: function(){
            if ( this.ownerType == "spouse" || this.insuredType == "spouse"){
                return "spouse"
            } else if ( this.ownerType == "partnerfiance" || this.insuredType == "partnerfiance" ){
                return "partner"
            }
        },
        isOwnerSameAsInsured: function() {
            return this.ownerType == this.insuredType;
        },
        isOwnerOtherThanInsured: function() {
            return this.ownerType != this.insuredType;
        },
        isTLIC: function () {
            return this.tLICRateClass > 0 && this.tLICRateClass < 99;
        },
        isOwnerSameAsInsuredAndTLIC: function() {
            return this.ownerType == this.insuredType && this.isTLIC();
        },
        isOwnerOtherThanInsuredAndTLIC: function() {
            return this.ownerType != this.insuredType && this.isTLIC();
        },

        getHouseholdPhrase: function() {
            var insuredIsEmployed = this.insured.financials.employed;
            if (insuredIsEmployed || insuredIsEmployed === null) { return ''; }
            return 'household';
        },

        getHouseholdPhraseUC: function() {
            return this.capitalizeFirstLetter(this.getHouseholdPhrase());
        },

        getOwnerPossessivePronoun: function () {
            var insuredType = this.ownerType || 'you';
            var pronouns = {
                you:            'your',
                spouse:         'your spouse\'s',
                partnerfiance:  'your partner\'s'
            };

            return pronouns[insuredType];
        },

        getOwnerPossessivePronounUC: function () {
            return this.capitalizeFirstLetter(this.getOwnerPossessivePronoun());
        },

        getOwnerPronoun: function () {
            var insuredType = this.ownerType || 'you';
            var pronouns = {
                you:            'you',
                spouse:         'your spouse',
                partnerfiance:  'your partner'
            };

            return pronouns[insuredType];
        },

        getOwnerDiesPhrase: function() {
            var owner = this.ownerType || 'you';
            var ownerDiesPhrases = {
                'you':              'you die',
                'spouse':           'your spouse dies',
                'partnerfiance':    'your partner dies'
            };
            return ownerDiesPhrases[owner];
        },
        getOwnerApplicant: function () {
            return this.ownerType == 'you' ? this : this.ownerType == 'spouse' ? this.getSpouse() : null;
        },
        ownerPerson:    {type: Person},
        ownerPersonDependsOn: function () {
            return true;
        },
        hasOwnerPerson: function () {
            return this.ownerPersonDependsOn();
        },
        ownerPersonResidentialAddress:  {type: Address},
        ownerPersonResidentialAddressDependsOn: function() {return this.ownerPersonDependsOn()},

        ownerPersonMailingAddress:      {type: Address},
        ownerPersonMailingAddressDependsOn: function() {return this.ownerPersonDependsOn()},

        ownerPersonPhone: {type: Phone},
        ownerPersonPhoneDependsOn: function() {return this.ownerPersonDependsOn()},

        ownerEntity:                    {type: Entity},

        ownerDelegate:  {type: String, rule: ["required"]},
        ownerDelegateValues: {isLocal: true, type: Array, value: ["insured", "ownerEstate"]},
        ownerDelegateDescription: function(value) {
            var str = value === 'insured' ? this.getInsuredPronoun() : this.getOwnerPossessivePronoun() + " Estate";
            return str.replace(/you/i, 'You');
        },
        // Should be removed after app refactor
        getOwnerDelegateDescription: function(value){
            var str = value === 'insured' ? this.getInsuredPronoun() : this.getOwnerPossessivePronoun() + " Estate";
            return str.replace(/you/i, 'You');
        },

        ownerEntityDependsOn:  function () {
            return this.ownerType == 'entity'
        },

        getOwnerResidentialAddress: {type: Address, body: function () {
            return this.ownerPersonDependsOn() ? this.ownerPersonResidentialAddress :
                   this.ownerEntityDependsOn() ? this.ownerEntity.legalAddress :
                   this.getOwnerApplicant().insured.address;
        }},
        hasResidentialAddress: function () {
            return this.ownerType != 'you';
        },

        getOwnerMailingAddress: {type: Address, body: function () {
            return this.ownerPersonDependsOn() ? this.ownerPersonMailingAddress :
                this.ownerEntityDependsOn() ? this.ownerEntity.mailingAddress :
                    this.getOwnerApplicant().insured.address;
        }},
        hasMailingAddress: function () {
            return this.ownerType == 'entity';
        },

        ownerRelationship:          {type: String, rule:['required']},
        ownerRelationshipDependsOn: function() {return this.ownerPersonDependsOn();},

        getOwnerAddressOneLinerDocusign: function(){
            var line1 = this.ownerPersonResidentialAddress.line1 || "";
            return this.ownerPersonResidentialAddress.street + " " + line1;
        },
        getOwnerFullName: function () {
            return this.isOwnerSameAsInsured() ? "" :
                this.ownerEntityDependsOn() ? this.ownerEntity.name : this.ownerPerson.getFullName();
        },
        getOwnerFullNameNA: function () {
            return this.isOwnerSameAsInsured() ? "n/a" :
                this.ownerEntityDependsOn() ? this.ownerEntity.name : this.ownerPerson.getFullName();
        },
        getOwnerPhone: {type: Phone, body: function () {
            return this.ownerEntityDependsOn() ? this.ownerEntity.phone : this.ownerPersonPhone;
        }},
        getOwnerEmail: function () {
            return this.ownerEntityDependsOn() ? this.ownerEntity.email :
                this.ownerPersonDependsOn() ? this.ownerPerson.email : this.person.email;
        },
        declarationIncentive:               {type: Boolean, value: false},
        declarationIncentiveValues:         {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        declarationSellTransfer:            {type: Boolean, value: false},
        declarationSellTransferValues:      {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        declarationOwnedCaptive:            {type: Boolean, value: false},
        declarationOwnedCaptiveValues:      {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        declarationPaidCaptive:             {type: Boolean, value: false},
        declarationPaidCaptiveTrustValues:  {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

		premiumPayer:   {type: String, value: 'owner'},
		premiumPayerValues:  {isLocal: true, type: Array, value: ["insured", "owner"]},
        premiumPayerDescription: function(value){
            var str;
            if (value === 'insured') { str = this.getInsuredPronoun(); }
            if (value === 'owner') { str = this.getOwnerPronoun(); }
            return str.replace(/you/i, 'You');
        },

        getPayerPronoun: function () {
            var payerType = this.premiumPayer || 'insured';
            var pronouns = {
                insured:    this.getInsuredPronoun(),
                owner:      this.getOwnerPronoun()
            };

            return pronouns[payerType];
        },

        getPayerPossessivePronoun: function () {
            var payerType = this.premiumPayer || 'insured';
            var pronouns = {
                insured:    this.getInsuredPossessivePronoun(),
                owner:      this.getOwnerPossessivePronoun()
            };

            return pronouns[payerType];
        },

        getPayerPossessivePronounUC: function () {
            return this.capitalizeFirstLetter(this.getPayerPossessivePronoun());
        },

        premiumPayerPerson:  {
            type: Person
        },

        premiumPayerAddress: {
            type: Address
        },

        premiumPayerPhone: {
            type: Phone
        },

        premiumSource:  {
            type: Boolean,
            rule: 'required'
        },

        premiumSourceValues: {
            isLocal: true,
            type: Array,
            value: ['false', 'true']
        },

        premiumSourceDescriptions: {
            isLocal: true,
            type: Object,
            value: {
                'false': 'No (I am using my income, savings or gifts)',
                'true': 'Yes (I am using other sources)'
            }
        },

        premiumSourceDetails:  {
            type: String,
            rule: 'required'
        },

        isInsuredThePayer: function() {
            return this.premiumPayer == 'insured';
        },

        getPremiumPayerPerson: {type: Person, body: function () {
            return this.premiumPayer == 'insured' ? this.insured.person : this.ownerPerson;
        }},
        getPremiumPayerPhone: {type: Person, body: function () {
            return this.premiumPayer == 'insured' ? this.insured.phone : this.ownerPersonPhone;
        }},
        getPremiumPayerAddress: {type: Person, body: function () {
            return this.premiumPayer == 'insured' ? this.insured.address : this.ownerPersonResidentialAddress;
        }},
        personalNeeds:  {type: String, value: 'income'},
        personalNeedsValues: {isLocal: true, type: Object, value:
            {income:'Income for dependents', 'estatetax': 'Pay estate taxes', 'mortgage':'Pay off mortgage',
             /*
             asset:'Asset protection', 'charity':'Charitable giving', 'education':'Education fund',
             itrust:'Irrevocable trust', 'rtrust':'Revocable trust', 'business':'Business related',
             */
             other:'Other'}},
        personalNeedsOther: {type: String},
        personalNeedsOtherDependsOn: function () {return this.personalNeeds == 'other'},

        businessNeeds:  {type: String, value: 'employee'},
        businessNeedsValues: {isLocal: true, type: Object, value:
            {employee:'Key employee', 'stock':'stock redemption',  cross: "Cross purchase", other:'Other'}},
        businessNeedsOther: {type: String},
        businessNeedsOtherDependsOn: function () {return this.businessNeeds == 'other'},

		paymentMode:        {type: String, value: "ach"},
		paymentModeValues:  {isLocal: true, type: Object, value: {ach: "Direct debit", check: "Check"}},

		firstPaymentMode:        {type: String, value: "ach"},
		firstPaymentModeValues:  {isLocal: true, type: Object, value: {ach: "Direct debit", cc: "Credit card"}},

        paymentBankName:                {type: String, rule: ['required', 'text']},
        paymentABA:                     {type: String, rule: ['required', 'numericstring'], length: 9, validate: "isMinLength(9);isMaxLength(9)"},
        getPaymentABADigits:            {type: Array, of: Digit, body: function () {return this.getDigits(this.paymentABA)}},
        paymentAccount:                 {type: String, rule: ['required', 'numericstring']},
        getPaymentAccountDigits:        {type: Array, of: Digit, body: function () {return this.getDigits(this.paymentAccount)}},
        getDigits: function (number) {
            var digits  = [];
            while (number.length) {
                digits.push(new Digit(number.substr(0, 1)));
                number = number.substr(1);
            }
            return digits;
        },
        paymentAccountType:             {type: String, rule: ['required'] },
        paymentAccountTypeValues:       {isLocal: true, type: Array, value: ['2', '1']},
        paymentAccountTypeDescriptions: {isLocal: true, type: Object,
                                        value: {'2': 'Checking', '1': 'Savings'}},
        paymentAccountOwnerType:        {type: String, value: 'individual'},
        paymentAccountOwnerTypeValues:  {isLocal: true, type: Object,
                                         value: {'individual': 'Individual', 'joint': 'Joint', entity: 'Entity'}},
        paymentAccountOwner:            {type: String},
        paymentAccountOwnerDependsOn:   function () {this.paymentAccountOwnerType == 'entity'},

        paymentFrequency:        {type: String, value: "monthly"},
		paymentFrequencyValues:  {isLocal: true, type: Object, value: {
			monthly: "Monthly", annually: "Annually", semiAnnual: "Twice yearly", quarterly: "Quarterly"}},

        paymentDay: {type: Number, rule: ["required"]},

        hipaaAuthorizationViewed:  {type:Boolean},

		conditionalCoverage:        {type: Boolean, value: false},
		conditionalCoverageValues:  {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

		waiver:             {type: Boolean, rule: ["required"]},
		waiverValues:             {isLocal: true, type: Array, value: ["false", "true"]},
        waiverDescriptions:       {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        //Naming Convention Based on FormField Label from 1700 Form
        hasWaiverOfPremiumRider: function () {
            if (this.getProductTypeInfo().code === 'ROP') { return true; }
            return false;
        },

        collaterallyAssigned:             {type: Boolean, rule: ["required"]},
        collaterallyAssignedValues:             {isLocal: true, type: Array, value: ["false", "true"]},
        collaterallyAssignedDescriptions:       {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        economicIncentive:             {type: Boolean, rule: ["required"]},
        economicIncentiveValues:             {isLocal: true, type: Array, value: ["false", "true"]},
        economicIncentiveDescriptions:       {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        beneficialInterest:             {type: Boolean, rule: ["required"]},
        beneficialInterestValues:             {isLocal: true, type: Array, value: ["false", "true"]},
        beneficialInterestDescriptions:       {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

		turnedDown:             {type: Boolean, value: false},
		turnedDownValues:  {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},
        workflow:   {toServer: false, toClient: false, type: Workflow},  // Never needs to be in the browser

        premiumAmount: {type: Number, value: 0},
        faceAmount: {type: Number, value: 0},
        term: {type: Number, value: 0},
        flatExtras: {type: Number, value: 0},
        applicationSignedDate: {type: Date},
        applicationSignedState: {type: String},
        tLICRateClass: {type: String},
        /*
        var NO_RATING = 0, ULTRA = 1, SELECT = 2, STANDARD = 3, SELECT_TOBACCO = 4, STANDARD_TOBACCO = 5, KNOCKOUT = 99, DECLINE = 999;
        */
        finalAlgoRateClass: {type: String, rule: "required"},
        finalRateClass: {type: String, rule: "required"},
        finalRateClassValues: {isLocal: true, type: Object, value:
            {1:"Ultra", 2:"Select", 3:"Standard", 4:"Select Tobacco", 5:"Standard Tobacco"}},

        tLICPremiumBreakdown: {type: PremiumBreakdown},
        finalAlgoPremiumBreakdown: {type: PremiumBreakdown},
        premiumBreakdown: {type: PremiumBreakdown},
        waiverPremium: {type: Number}, // contains the quote waiver premium on the application. Final waiver is in premiumBreakdown

        points:         {type: Points}, // Credit/Debit points used in manual underwriting
        _mibCodes: {type: Array, of: MibCode, value: []},

        mibCodes: function() {
            return new MibCodes(this._mibCodes);
        },

        fetchBaseAndWaiver: function(rateClass, effDate) {
            var band = this.customer.getBand(this.faceAmount),
                gender = this.insured.person.isMale() ? 'male' : 'female',
                rating = Rating.class.find(rateClass),
                base = 0,
                waiver = 0;

            if (!rating) {
                return {base: base, waiver: waiver};
            }
            var smoker = rating.smoker ? 'yes' : 'no',
                age = this.insured.getInsuranceAge(effDate), //- 18,
                quote = new Quotes().fetchHavenQuote(this.product, gender, rating.qCode, smoker, age, this.term, this.faceAmount);

            if (quote) {
                base = quote.policies[0].monthly;
                waiver = this.fetchWaiverPremium(this.faceAmount, gender, rating.qCode, smoker, age - 18, this.term);
            }
            return {base: base, waiver: waiver};
        },

        setTLICRateClass: function(rateClass, flatExtras) {
            this.tLICRateClass = rateClass;
            var premBd = this.fetchBaseAndWaiver(rateClass, this.tLICEffectiveDate);
            this.tLICPremiumBreakdown.update(premBd.base, 0, flatExtras);
            if (this.finalAlgoPremiumBreakdown) {
                this.finalAlgoPremiumBreakdown.update(premBd.base, premBd.waiver, flatExtras);
            }
            this.premiumBreakdown.update(premBd.base, premBd.waiver, flatExtras);
        },

        setTLICRateClassDirty: function(txn) {
            this.tLICPremiumBreakdown.setDirty(txn);
            this.setFinalAlgoRateClassDirty(txn);
            this.premiumBreakdown.setDirty(txn);
        },

        setFinalAlgoRateClass: function(rateClass, flatExtras) {
            this.finalAlgoRateClass = rateClass;
            if (this.finalAlgoPremiumBreakdown) {
                var premBd = this.fetchBaseAndWaiver(rateClass, this.effectiveDate);
                this.finalAlgoPremiumBreakdown.update(premBd.base, premBd.waiver, flatExtras || this.finalAlgoPremiumBreakdown.flatExtras);
            }
        },

        setFinalAlgoRateClassDirty: function(txn) {
            if (this.finalAlgoPremiumBreakdown) {
                this.finalAlgoPremiumBreakdown.setDirty(txn);
            }
        },

        setRateClass: function(rateClass, flatExtras) {
            this.finalRateClass = rateClass;
            var premBd = this.fetchBaseAndWaiver(rateClass, this.effectiveDate);
            this.premiumBreakdown.update(premBd.base, premBd.waiver, flatExtras || this.premiumBreakdown.flatExtras);
        },

        setRateClassDirty: function(txn) {
            this.premiumBreakdown.setDirty(txn);
        },

        applyTokenUsed: function() {
            this.customer.applyTokenUsed();
        },

        init: function(customer) {
			this.customer = customer;
            this.insured = customer ? customer.primaryCustomer : null;

            // For new style data modelling
            this.person = new Person(customer);
            this.address = new Address(customer);
            this.phone = new Phone(customer, 'cell');
            this.ownerPerson = new Person(this.customer);
            this.premiumPayerPerson = new Person(this.customer);
            this.premiumPayerAddress = new Address(this.customer);
            this.premiumPayerPhone = new Phone(this.customer);
            this.doctorAddress = new Address(this.customer);
            this.ownerPersonPhone = new Phone(this.customer);
            this.ownerPersonResidentialAddress = new Address(this.customer);
            this.ownerPersonMailingAddress = new Address(this.customer);
            this.ownerEntity = new Entity(this.customer);
            this.primaryBeneficiaryAdd();
            this.contingentBeneficiaryAdd();
            this.points = new Points();
        },

        createClonedPolicy: function () {

            // For each property we get to decide how to clone it by either returning
            // the target object or returning null which means a mindless clone is to be done
            // Anything linkned to customer needs to NOT clone customer but use the existing one

            return this.createCopy(function (obj, prop, template) {

                switch(template.__name__) {
                    case 'Assumptions': return Assumptions;
                    case 'Customer': return [this.customer]; // Don't traverse
                    case 'HavenCustomer': return [this.customer]; // Don't traverse
                    case 'Policy': return null;

                }
                switch(obj.__template__.__name__ + '.' + prop) {

                    case 'Applicant.person': return new Person(this.customer);
                    case 'Applicant.address': return new Address(this.customer);
                    case 'Applicant.phone': return new Phone(this.customer);
                    case 'Policy.underwriter': return [this.underwriter];
                    case 'Policy.person': return new Person(this.customer);
                    case 'Policy.address': return new Address(this.customer);
                    case 'Policy.phone': return new Phone(this.customer, 'cell');
                    case 'Policy.ownerPerson':return new Person(this.customer);
                    case 'Policy.premiumPayerPerson': return new Person(this.customer);
                    case 'Policy.premiumPayerAddress': return new Address(this.customer);
                    case 'Policy.premiumPayerPhone': return new Phone(this.customer);
                    case 'Policy.doctorAddress': return new Address(this.customer);
                    case 'Policy.ownerPersonPhone': return new Phone(this.customer);
                    case 'Policy.ownerPersonResidentialAddress': return new Address(this.customer);
                    case 'Policy.ownerPersonMailingAddress': return new Address(this.customer);
                    case 'Beneficiary.entity': return new Entity(this.customer);
                    case 'Entity.legalAddress': return new Address(this.customer);
                    case 'Entity.mailingAddress': return new Address(this.customer);
                    case 'Entity.phone': return new Phone(this.customer);
                    case 'Beneficiary.person': return new Person(this.customer);
                    case 'Beneficiary.address': return new Address(this.customer);
                    case 'Beneficiary.phone': return new Phone(this.customer);
                    case 'Policy.tLICPremiumBreakdown': return new PremiumBreakdown(null, null, null, obj);
                    case 'Policy.premiumBreakdown': return new PremiumBreakdown(null, null, null, obj);
                }
                return null;    // normal create process
            }.bind(this));
        },

        // When a policy is cloned, the cloned policy contains data which was placed
        // by the original policy's workflow activities. Clear all of them
        resetWorkflowProps: function(){
            // Clear dates
            this.canBeReinstatedUntil = this.issuedDate = this.willLapseOn = this.freeLookEndsOn = this.paramedRequiredBy = this.offerRequiredBy = this.tLICEffectiveDate = this.effectiveDate = null;

            // Clear other data
            this.showInAccountCenter = true;
            this.submittedAt = this.workflowState = this.workflowSubState = this.futureWorkflowState = this.futureWorkflowSubState = this.workflowPersistor = null;
            this.isSaveAge =  this.canGetVantage = false;
            this.rejectedReasons = [];

            this.flatExtras = 0;
            this.applicationSignedDate = this.applicationSignedState = null;
            this.tLICRateClass = this.finalRateClass = this.waiverPremium = null;
            this.policyNumber = null;

            this.idCheckAttempts = this.drivingRecordAttempts = 0;
            this.policyDocs = this.comments = [];
            this.insuredIdCheck = this.ownerIdCheck = this.drivingRecords = this.medicalRecords = this.rxRecords = this.backupRxRecords = this.labRecords = this.tlicMatResult = this.finalMatResult = null;

            this.setQuote(this.customer.selectedQuote);
        },

        addComment: function(comment, commenter) {
            this.comments.push(new PolicyComment(commenter, comment, this));
        },

        assignPolicyNumber: function() {
            return Counter.getNextNumber(Counter.name.policyNumber(this.product)).then(setPolNum.bind(this));

            function setPolNum(polNum) {
                return this.policyNumber = '' + polNum;
            }
        },

        isSubmitting: function() {
            return this.workflow != null &&(this.workflowState == 'TLIC Application');
        },
        startWorkflow: function(firstStage) {

            function startWrkflow() {
                var cfg = {
                    workflow: 'WF1',
                    stage: firstStage || 'VI1',
                    hierarchy: [Assumptions.products[this.product].channel.code, this.product],
                    dimensions: []
                };
                return Workflow.start(cfg, this);
            }

            function setWorkflow(workflow) {
                return this.workflow = workflow;
            }

            return Q().then(startWrkflow.bind(this)).then(setWorkflow.bind(this));
        },
        getWaiverPremium: function(){
            if (this.waiverPremium){ return this.waiverPremium; }

            var selectedQuote = this.customer.selectedQuote;
            if (!selectedQuote) { return; }

            var selectedQuotePolicy = selectedQuote.policies[0];
            // Waiver premium applies to HAVEN policies only?
            if (!selectedQuotePolicy || !selectedQuotePolicy.isHaven) { return null; }

            var face = selectedQuotePolicy.face;
            var term = selectedQuotePolicy.term;
            if (face && term) {
                var gender = this.customer.primaryCustomer.person.gender == '1' ? 'male' : 'female';
                var healthClass = this.customer.primaryCustomer.healthClass.split('S')[0];
                if (healthClass === 'Rg') {
                    healthClass = 'R+';
                }

                // First look at what the user said on the application
                var smoker = "no";
                if(this.customer.primaryCustomer.riskFactors.isSmokester  &&
                    this.customer.primaryCustomer.riskFactors.isSmokerYear){
                    // Only a smoker if the user has smoked in the last 12 months
                    smoker = this.customer.primaryCustomer.riskFactors.isSmokerYear === "last12" ? "yes" : "no";
                }

                // If health class is Pf+ and is smoker, drop the class to Pf
                if (healthClass === "P+" && smoker === "yes") {
                    healthClass = "Pf";
                }

                var age = (this.customer.primaryCustomer.person.dob ? this.customer.primaryCustomer.getInsuranceAge() : this.customer.primaryCustomer.person.age) - 18;


                this.waiverPremium = this.fetchWaiverPremium(face, gender, healthClass, smoker, age, term);
                return this.waiverPremium;
            }
        },

        fetchWaiverPremium: function(face, gender, healthClass, smoker, age, term) {
            var premium = null
            if (!this.product) this.product = 'HavenTerm';
            try {
                premium = ProductWaiverPremiums[this.product][gender][healthClass][smoker][age][term];
            } catch (e) {
                console.log("Can't find waiver for " + " Gender " + gender + " Health " + healthClass + " Smoker " + smoker + " Age " + age + " Term " +  term + " = " + premium);
                premium = 0;
            }
            if(premium) {
                premium = (premium * face) / 1000;
                return Math.round(premium/12*100)/100;
            }
            else{
                return 0;
            }
        },

        setQuote: function (selectedQuote) {
            this.selectedQuote = selectedQuote;
            this.faceAmount = this.selectedQuote.policies[0].face;
            this.term = this.selectedQuote.policies[0].term;
            this.tLICPremiumBreakdown = new PremiumBreakdown(this.selectedQuote.policies[0].monthly, null, null, this);
            this.finalAlgoPremiumBreakdown = new PremiumBreakdown(this.selectedQuote.policies[0].monthly, null, null, this);
            this.premiumBreakdown = new PremiumBreakdown(this.selectedQuote.policies[0].monthly, null, null, this);
            this.carrier = selectedQuote.policies[0].carrierCode;
        },

        /*ageTrigger: function() {
            this.customer.capitalNeeds.ageTrigger(this);
        },*/
		selectedQuote:      {type: Object},
		overrideAmount:     {type: Number, rule:["currency"], value: 0},
		overrideAmountValues: {isLocal: true, type: Array, of: String, value:
			["$100,000","$200,000","$300,000","$400,000","$500,000","$600,000","$700,000","$800,000",
			 "$900,000","$1,000,000", "$1,200,000", "$1,400,000", "$1,500,000","$1,700,000","$1,900,000",
			 "$2,000,000", "$2,500,000", "$3,000,000"]},
		overrideTerm:       {type: Number, value: 20, rule:["numeric"]},
		overrideTermValues: {isLocal: true, type: Array, of: Number, value: [5, 10, 15, 20, 20, 25, 30]},
		overrideTermDescriptions: {isLocal: true, type: Object, value:
		{5: "5 years", 10: "10 years", 15:"15 years", 20: "20 years", 25: "25 years", 30: "30 years"}},
		policyHidden:   {type: Boolean, value: false},
		policyAppliedFor: {type: Boolean, value: false},
        getPolicyName: function () {
            try {
                return "Vantage " +
                    (this.customer.primaryCustomer == this ? this.customer.capitalNeeds.getTerm(false) :
                     this.customer.capitalNeeds.getTerm(true)) +
                    "Year Term";
            } catch (e) {
                    return 'Vantage 10 Year';
            }
        },
        getFace: function () {
            try {
                return (this.customer.primaryCustomer == this ? this.customer.capitalNeeds.getFace(false) :
                    this.customer.capitalNeeds.getFace(true));
            } catch (e) {
                return "500000";
            }
        },


        /** Is insured a smoker  */
        isSmoker: function() {
            return this.isSmokerByLabs() || this.isSmokerByApp();
        },
        isSmokerByLabs: function() {
            return this.isSmokerByCotinine().smoker;
        },
        isSmokerByCotinine: function(labRecords) {
            labRecords = labRecords || this.labRecords || [];
            var labResult = _.findWhere(labRecords.labTestResults, {testCode: LabTestResult.TEST_CODES.UrineCotinine});
            var res = labResult ? labResult.testResultCode : null;
            return {result: res, smoker: (res == LabTestResult.TEST_RESULT_CODES.Positive)};
        },
        isSmokerByApp: function() {
            return this.isSmokerByLastSmoked().smoker || this.isSmokerByCigarFrequency().smoker ||
                this.isSmokerByMeds().smoker;
        },
        isSmokerByLastSmoked: function() {
            return {response: this.insured.riskFactors.isSmokerYear, smoker: this.insured.smokedInTheLastYear()};
        },
        isSmokerByCigarFrequency: function() {
            var answer = this.insured.riskFactors.usesCigarsFrequency;
            return {response: answer, smoker: (answer > 2)};
        },
        isSmokerByMeds: function() {
            var answer = this.insured.riskFactors.useTobaccoCessationMeds;
            return {response: answer, smoker: answer == null ? false : answer};
        },

        // Todo: make toSErver: false
        idCheckAttempts: {type: Number, value: 0},
        drivingRecordAttempts: {type: Number, value: 0},
        policyDocs: {type: Array, of: PolicyDoc, value: []},
        comments: {type: Array, of: PolicyComment, value: []},
        insuredIdCheck: {type: IdCheck},
        ownerIdCheck: {type: IdCheck},
        drivingRecords: {type: DrivingRecords},
        medicalRecords: {type: MedicalRecords},
        rxRecords: {type: RxRecords},
        backupRxRecords: {type: RxRecords},
        labRecords: {type: LabRecords},
        tlicMatResult: {type: MatResult},
        finalMatResult: {type: MatResult},
        finalMortalityResult: {type: MortalityResult},
        workflowState: {type: String, value: ""},
        futureWorkflowState: {type: String, value: ""},
        workflowSubState: {type: String, value: ""},
        futureWorkflowSubState: {type: String, value: ""},
        workflowStateUpdate:    {type: Date},
        currentStageRequirements: {type: Array, of: String, value: []},
        workflowStateHistory: {type: Array, of: WorkflowStateHistory, value: []},

        apsOrders: {type: Array, of: ApsOrder, value: []},

        setWorkflowState: function(state, subState, startTime, endTime) {
            if (this.workflowState) {
                this.workflowStateHistory.push(new WorkflowStateHistory(this.workflowState, this.workflowSubState,
                    this.workflowStateUpdate, endTime));
            }
            this.workflowState = state;
            this.futureWorkflowState = "";
            this.workflowSubState = subState;
            this.futureWorkflowSubState = "";
            this.workflowStateUpdate = startTime;
        },

        setCurrentStageRequirements: function(reqs) {
            this.currentStageRequirements = (reqs || []);
        },

        addPolicyDoc: function(name, doc, type, docSource, appType) {
            this.policyDocs.push(new PolicyDoc(name, doc, type, docSource, this, appType));
        },

        addPolicyAppPackage: function(docs) {
            docs.forEach(function(doc) {
                //this.addPolicyDocPDF(doc.doc, PolicyDoc.SOURCES.app, doc.typeName);
                this.policyDocs.push(new PolicyDoc(undefined, doc.doc, PolicyDoc.TYPES.pdf, PolicyDoc.SOURCES.app,
                    this, doc.typeName));
            }.bind(this));
        },

        addPolicyDocPDF: function(doc, docSource, appType) {
            var encDoc = new Buffer(doc).toString('base64');
            this.policyDocs.push(new PolicyDoc(
                    undefined, encDoc, PolicyDoc.TYPES.pdf, docSource, this, appType
            ));
        },

        getAdditionalSupplementDetails: function() { //returns array of paragraph strings
            var details =
                /** Generated Code - FR2150 **/
				[{"qNum":"C5b","entity":["familyHistory","familyConditions"],"props":[{"name":"member","qText":"","showAnswer":true},{"name":"condition","qText":"","showAnswer":true},{"name":"ageAtOnset","qText":"Age at Onset","showAnswer":true},{"name":"type","qText":"","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCAttack","qText":"Heart attack, Stroke, Myocardial Infarction, Transient Ischemic Attack, Cardiomyopathy (Heart Muscle Problem) or other Heart Failure","skipFalse":true}]},{"qNum":"C10a","entity":["personalHistory","hadHCAttackDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCAbnormalBeat","qText":"Abnormal heartbeat / atrial fibrillation","skipFalse":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCABFibrillation","qText":"Do you have a history of atrial fibrillation or atrial flutter?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCABFTreatment","qText":"Has your abnormal heart beat been treated with medication, surgery or electrical shock (cardioversion)?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCABFTFainted","qText":"Did your abnormal heart beat ever cause you to faint or lose consciousness?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory","hadHCAbnormalBeatDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCHypertension","qText":"High blood pressure / hypertension","skipFalse":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCHMedication","qText":"Are you taking medication to control your hypertension or high blood pressure?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory","medsHCH"],"props":[{"name":"rxName","qText":"","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory","hadHCHMedicationDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"bpMeasurements","qText":"Do you know your current blood pressure measurements?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"systolic","qText":"Systolic","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"diastolic","qText":"Diastolic","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCMurmur","qText":"Heart Murmur or Heart Valve Problem (including Mitral Valve Prolapse)","skipFalse":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCMAdviseECG","qText":"Have you been advised to have your heart periodically tested with imaging (echocardiogram)?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCMAdviseSurgery","qText":"Have you been advised to have surgery for your heart murmur or heart valve problem?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCMAdviseMeds","qText":"Have you been advised to take medication or restrict your activity due to your heart murmur or heart valve problem?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory","hadHCMurmurDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCPericarditis","qText":"Pericarditis","skipFalse":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCPMultipleEpisodes","qText":"Have you had more than one episode?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCPFullyRecovered","qText":"Have you fully recovered?","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory","hadHCPericarditisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCBenign","qText":"Varicose Veins\nVenous Insufficiency","skipFalse":true}]},{"qNum":"C10a","entity":["personalHistory"],"props":[{"name":"hadHCOther","qText":"Other/ Not Sure","skipFalse":true}]},{"qNum":"C10a","entity":["personalHistory","hadHCOtherDiagnosis"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10b","entity":["personalHistory"],"props":[{"name":"hadHCElevatedNow","qText":"Do you currently have elevated cholesterol levels?","showAnswer":true}]},{"qNum":"C10b","entity":["personalHistory"],"props":[{"name":"hadHCKnowLevels","qText":"Do you know your cholesterol levels?","showAnswer":true}]},{"qNum":"C10b","entity":["personalHistory"],"props":[{"name":"cholesterolTotal","qText":"What is your total cholesterol","showAnswer":true}]},{"qNum":"C10b","entity":["personalHistory"],"props":[{"name":"cholesterolHDL","qText":"What is your HDL","showAnswer":true}]},{"qNum":"C10c","entity":["personalHistory","hadCancerDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hadBDAnemia","qText":"Anemia","skipFalse":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hadBDAnemiaType","qText":"Which type of anemia?","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hasBDAnemiaResolved","qText":"Is your anemia currently resolved or controlled with oral iron pills/supplements?","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory","hasBDAnemiaResolvedDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hadBDAnemiaBleeding","qText":"Is your iron deficiency due to chronic bleeding other than menstrual bleeding?","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory","hadBDAnemiaBleedingDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hasBDAnemiaControlled","qText":"Is your anemia adequately controlled with vitamin B12 supplements (oral or injected)?","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory","hasBDAnemiaControlledDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hasBDAnemiaSymptoms","qText":"Do you currently have symptoms related to your anemia?","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory","hasBDAnemiaSymptomsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hadBDSpleen","qText":"Overactive spleen (hypersplenism), low platelet count (thrombocytopenia) or ITP (idiopathic thrombocytopenic purpura)","skipFalse":true}]},{"qNum":"C10d","entity":["personalHistory","hadBDSpleenDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hadBDClotting","qText":"Problems with blood clotting, easy or excessive bleeding, or coagulation defects (hemophilia)","skipFalse":true}]},{"qNum":"C10d","entity":["personalHistory","hadBDClottingDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hadBDHemochromatosis","qText":"Hemochromatosis\nIron or Vitamin Deficiency (without Anemia)\nThalassemia Trait or Sickle Cell Trait (without Anemia)","skipFalse":true}]},{"qNum":"C10d","entity":["personalHistory"],"props":[{"name":"hadBDOther","qText":"Other/Not Sure","skipFalse":true}]},{"qNum":"C10d","entity":["personalHistory","otherDiagnosisis"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadBDAneurysm","qText":"Brain aneurysm or bleeding","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","hadBDAneurysmDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBTumor","qText":"Brain tumor","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBTumorDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBEncephalitits","qText":"Encephalitits or meningitis","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hasDBRecovered","qText":"Did you recover and did your doctor say you are neurologically normal now?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hasDBRecovered2Years","qText":"Did you fully recover from this episode more than 2 years ago?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBEncephalititsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBSeizures","qText":"Epilepsy or seizures","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"medsDBSeizures","qText":"How many medications do you currently take for your seizures?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBSiezuresLast5Years","qText":"Was your last seizure more than 5 years ago?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBSeizuresDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBMigranes","qText":"Headaches or migraines","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBMDisabilityPayments","qText":"Have you received disability payments within the past 12 months for your headaches/migraines?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBMDisabilityPaymentsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBMS","qText":"Multiple Sclerosis","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBMSDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBNeuropathy","qText":"Neuropathy (Chronic or Inflammatory)","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBNeuropathyDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBParkinsons","qText":"Parkinson's Disease","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBParkinsonsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBSciatica","qText":"Sciatica","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBStroke","qText":"Stroke","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBStrokeDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBFainting","qText":"Fainting (Syncope)","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBFMultipleEpisodes","qText":"Have you had more than one episode of fainting?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBFMultipleEpisodesDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBFLastYear","qText":"Was your most recent episode of fainting more than one year ago?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBFLastYearDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBTIA","qText":"Transient Ischemic Attack (TIA)","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBTIADiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBHematoma","qText":"Subdural Hematoma / Hematoma in the brain","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","hadDBHematomaDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBTBI","qText":"Traumatic brain injury","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadDBTBILast5Years","qText":"Did the injury occur more than 5 years ago?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hasTBISymptomsOrMeds","qText":"Do you currently have any symptoms or take any medication related to this injury?","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory","hasTBISymptomsOrMedsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadTBTourettes","qText":"Tourette's syndrome","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory"],"props":[{"name":"hadTBNotSure","qText":"Other/Not Sure","skipFalse":true}]},{"qNum":"C10e","entity":["personalHistory","diagnosisTB"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOHospitalizedLast5Years","qText":"In the past 5 years, have you been hospitalized or been enrolled in a partial hospitalization due to an emotional disorder?","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory","hadEOHospitalizedLast5YearsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOAlcoholism","qText":"Alcoholism","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory","hadEOAlcoholismDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOADepression","qText":"Anxiety or Depression","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOTreatment","qText":"Are you currently undergoing treatment?","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEODepressionSituationalOnly","qText":"Is your anxiety or depression situational only?","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory","hadEOADepressionDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOHeartPalpitations","qText":"Do you suffer from panic or stress induced chest pains or heart palpitations?","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOADHD","qText":"Attention Deficit Hyperactivity Disorder (ADHD)","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOADHDChildhood","qText":"Did your ADHD Symptoms begin in childhood (before age 10)?","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEO","qText":"Cognitive Impairment","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory","hadEODiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEODelusion","qText":"Delusion","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory","hadEODelusionDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEODrugCounseling","qText":"Drug Counseling","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory","hadEODrugCounselingDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOEatingDisorder","qText":"Eating Disorder","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory","hadEOEatingDisorderDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOMajorDepression","qText":"Major Depression","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory","hadEOMajorDepressionDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOPanicAttack","qText":"Panic Attack","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOPAMedsLast2Years","qText":"Have you received medical care or been prescribed medication for panic attacks within the past 2 years?","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory","hadEOPAMedsLast2YearsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOSuicideAttempt","qText":"Suicide Attempt","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory","hadEOSuicideAttemptDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEOMinorDisorders","qText":"Brief Stress or Grief Reaction\n Performance Anxiety (public speaking, etc.)\n Seasonal Affective Disorder\n Social Phobia\n Simple Phobia (fear of snakes, etc.)","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory"],"props":[{"name":"hadEONotSure","qText":"Other / Not Sure","skipFalse":true}]},{"qNum":"C10f","entity":["personalHistory","diagnosisEONotSure"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10g","entity":["personalHistory"],"props":[{"name":"hadEENTAcousicNeuroma","qText":"Acoustic Neuroma","skipFalse":true}]},{"qNum":"C10g","entity":["personalHistory","hadEENTAcousicNeuromaDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10g","entity":["personalHistory"],"props":[{"name":"hadEENTLeukoplakia","qText":"Leukoplakia","skipFalse":true}]},{"qNum":"C10g","entity":["personalHistory","hadEENTLeukoplakiaDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10g","entity":["personalHistory"],"props":[{"name":"hadEENTOpticNeuritis","qText":"Optic Neuritis","skipFalse":true}]},{"qNum":"C10g","entity":["personalHistory","hadEENTOpticNeuritisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10g","entity":["personalHistory"],"props":[{"name":"hadEENTNotSure","qText":"Other / Not Sure","skipFalse":true}]},{"qNum":"C10g","entity":["personalHistory","diagnosisEENTNotSure"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDSarcoidosis","qText":"Sarcoidosis","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory","hadRDSarcoidosisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDCOPD","qText":"Chronic Obstructive Pulmonary Disease (COPD)","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory","hadRDCOPDDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDEmphysema","qText":"Emphysema","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory","hadRDEmphysemaDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDAsthma","qText":"Asthma","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDAHospitalizedLast1Year","qText":"Have you been hospitalized (kept overnight in the hospital) in the past year?","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory","hadRDAHospitalizedLast1YearDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDAERLast1Year","qText":"Have you visited the emergency department in the past year for your asthma?","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory","hadRDAERLast1YearDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hasRDAMeds","qText":"Are you currently taking daily steroid pills, such as prednisone, for your asthma?","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory","hasRDAMedsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDPulmonaryNodule","qText":"Pulmonary Nodule","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory","hadRDPulmonaryNoduleDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hasRDApnea","qText":"Sleep Apnea","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory","hasRDApneaDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hasRDCPAP","qText":"Are you currently being treated with CPAP?","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hasRDCPAPLast6Months","qText":"Have you been using CPAP for more than 6 months?","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hasRDBronchitis","qText":"Bronchitis","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hasRDBRecovered","qText":"Have you fully recovered?","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDPneumonia","qText":"Pneumonia or Legionnaire's disease","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hasRDPRecovered","qText":"Did you fully recover without complications?","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory","hasRDPRecoveredDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDTuberculosis","qText":"Tuberculosis","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hasRDTRecovered","qText":"Have you fully recovered without complications and are you no longer taking medications for tuberculosis?","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory","hadRDTuberculosisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDInfluenza","qText":"Influenza\n Intermittent Cough/Cold\n Seasonal or Perennial Allergies","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory"],"props":[{"name":"hadRDOther","qText":"Other/Not sure","skipFalse":true}]},{"qNum":"C10h","entity":["personalHistory","diagnosisRDOther"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDAnorectalFistula","qText":"Anorectal fistula or sinus","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDCeliacDisease","qText":"Celiac Disease","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDCeliacDiseaseDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDColonPolyp","qText":"Colon polyp","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDColonPolypDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDChrons","qText":"Crohn's disease","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDChronsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDColitusNonUlcerative","qText":"Colitis (non ulcerative)","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDColitusNonUlcerativeDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDColitusUlcerative","qText":"Colitis (ulcerative)","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDColitusUlcerativeDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDiverticulitis","qText":"Diverticulitis","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDDLast6Months","qText":"Have you had an episode in the past 6 months?","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDDLast6MonthsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDNAFLD","qText":"Non-alcoholic fatty liver disease (NAFLD) or nonalcoholic steatohepatitis (NASH)","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDNAFLDDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDLiverBiopsy","qText":"Have you ever been advised to have a biopsy of your liver?","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDGastritis","qText":"Gastritis","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDHepititis","qText":"Hepatitis B, C, or D","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDHepititisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDPancreaticInflamation","qText":"Pancreatic abscess or cysts","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDPancreaticInflamationDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDPancreatitis","qText":"Pancreatitis (pancreatic inflammation)","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDPancreatitisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDUlcer","qText":"Ulcer","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDURecovered","qText":"Is/are your ulcer(s) completely healed?","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDURecoveredDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDWeightLossSurgery","qText":"Weight Loss Surgery","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","hadDDWeightLossSurgeryDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadDDBenign","qText":"Anorectal Abscess or Cyst\n Appendicitis\n Diverticulosis\n Food (Lactose, Gluten, Etc.) Intolerance, Food Allergy\n Gallbladder Pain\n Gallstones\n Gastroesophageal Reflux Disease (GERD)\n Hemorrhoids\n Hepatitis A or E, fully recovered\n Hiatal Hernia\n High Levels of Bilirubin (Hyperbilirubinemia)\n Inguinal (Groin) Hernia\n Intermittent or Chronic Constipation\n Intermittent Diarrhea\n Irritable Bowel Syndrome or Irritable Bowel Disease (IBS)\n Rectal Prolapse","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory"],"props":[{"name":"hadBDNotSure","qText":"Other/Not sure","skipFalse":true}]},{"qNum":"C10i","entity":["personalHistory","diagnosisDDOther"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hadBMDAmputationsFromTrauma","qText":"Amputations (due to a trauma only)","skipFalse":true}]},{"qNum":"C10j","entity":["personalHistory","hadBMDAmputationsFromTraumaDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hadBMDArthritis","qText":"Arthritis (including rheumatoid arthritis, osteoarthritis, and polyarthritis)","skipFalse":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hadBMDAType","qText":"What type of arthritis do you have?","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory","hadBMDATypeDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hasBMDMeds","qText":"Do you take any prescription medication for your arthritis?","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory","hasBMDMedsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hasBMDDisabilityBenefits","qText":"Do you currently receive disability benefits for your arthritis?","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory","hasBMDDisabilityBenefitsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hasBMDOsteoporosis","qText":"Osteoporosis or osteopenia","skipFalse":true}]},{"qNum":"C10j","entity":["personalHistory","hasBMDOsteoporosisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hasBMDBackPain","qText":"Back pain","skipFalse":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hasBMDBPMeds","qText":"Are you currently taking prescription medication for your back pain?","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hasBMDPagets","qText":"Paget's disease of the bone","skipFalse":true}]},{"qNum":"C10j","entity":["personalHistory","hasBMDPagetsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hasBMDBenign","qText":"Bone Fractures Due to Trauma\n Bursitis\n Gout\n Joint Laxity/Hypermobility\n Overuse Injury (Stress Fracture, Shin Splints, Etc.)\n Scoliosis\n Tendonitis/Tendonsosis\n Tennis/Golfer's Elbow (Epicondylitis)\n Rotator Cuff Problems\n Patellofemoral Pain/Chrondromalacia Patella","skipFalse":true}]},{"qNum":"C10j","entity":["personalHistory"],"props":[{"name":"hasBMDOther","qText":"Other/ Not Sure","skipFalse":true}]},{"qNum":"C10j","entity":["personalHistory","diagosisBMDAOther"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hadRDChronicFatigue","qText":"Chronic fatigue syndrome or fibromyalgia","skipFalse":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hasRDCFFunctionNormal","qText":"Are you able to function normally?","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hadRDDepression","qText":"Do you suffer from depression?","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory","hadRDChronicFatigueDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hadRDEpsteinBarr","qText":"Epstein-Barr virus","skipFalse":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hadRDEBOtherSymptoms","qText":"Do you currently suffer from fatigue or other symptoms related to your virus?","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory","hadRDEBOtherSymptomsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hadRDLupus","qText":"Systemic Lupus Erythematosus (SLE)","skipFalse":true}]},{"qNum":"C10k","entity":["personalHistory","hadRDLupusDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hadRDLymeDisease","qText":"Lyme disease","skipFalse":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hadRDLDSymptoms","qText":"Do you currently have fatigue or any other symptoms associated with your Lyme disease?","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hasRDLDTreatment","qText":"Are you currently receiving treatment related to Lyme disease?","showAnswer":true}]},{"qNum":"C10k","entity":["personalHistory"],"props":[{"name":"hasRDOther","qText":"Other/ Not Sure","skipFalse":true}]},{"qNum":"C10k","entity":["personalHistory","diagnosisRMDOther"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10l","entity":["personalHistory"],"props":[{"name":"hasDTDiabetes","qText":"Diabetes","skipFalse":true}]},{"qNum":"C10l","entity":["personalHistory"],"props":[{"name":"hasDTDType","qText":"What type of diabetes do/did you have?","showAnswer":true}]},{"qNum":"C10l","entity":["personalHistory","diabetesDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10l","entity":["personalHistory"],"props":[{"name":"hasDTProlactinoma","qText":"Prolactinoma","skipFalse":true}]},{"qNum":"C10l","entity":["personalHistory","hasDTProlactinomaDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10l","entity":["personalHistory"],"props":[{"name":"hasDTThyroidDisease","qText":"Thyroid disease (cysts, nodules, thyroidectomy, Grave's, Hashimotos etc.)","skipFalse":true}]},{"qNum":"C10l","entity":["personalHistory"],"props":[{"name":"hasDTTStable","qText":"Is your condition treated and stable?","showAnswer":true}]},{"qNum":"C10l","entity":["personalHistory","hasDTTStableDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10l","entity":["personalHistory"],"props":[{"name":"hasDTTImageBiopsy","qText":"Have you been advised to have periodic imaging or biopsy of a thyroid cyst, nodule or tumor?","showAnswer":true}]},{"qNum":"C10l","entity":["personalHistory","hasDTTImageBiopsyDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10l","entity":["personalHistory"],"props":[{"name":"hasDTNotSure","qText":"Other / Not sure","skipFalse":true}]},{"qNum":"C10l","entity":["personalHistory","DiagnosisisDTNotSure"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadNephritisLast2Years","qText":"Acute nephritis, within the past 2 years","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory","hadNephritisLast2YearsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadNephritisMoreThanLast2Years","qText":"Acute Nephritis, more than 2 years ago","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory","hadNephritisMoreThanLast2YearsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDBladderStones","qText":"Bladder stones (calculi)","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDGlomerulonephiritis","qText":"Glomerulonephritis or Nephropathy","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory","hadUTDGlomerulonephiritisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDKidneyStones","qText":"Kidney stones","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDKidneyStonesMultiple","qText":"Have you had them more than once?","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hasUTDNormalKidney","qText":"Do you currently have normal kidney function without any obstrution or infection?","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory","hasUTDNormalKidneyDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDRenalFailure","qText":"Kidney failure / renal insufficiency / dialysis","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory","hadUTDRenalFailureDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDPyelonephiritis","qText":"Kidney infection (pyelonephritis)","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTStructural","qText":"Do you have any known issues with your urological anatomy (for example: strictures or an abnormal ureter)?","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory","hadUTStructuralDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDKidneyRecovered3Months","qText":"Was your kidney infection treated and cured more than 3 months ago?","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDProteinuria","qText":"Proteinuria (protein in the urine on more than one occasion)","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory","hadUTDProteinuriaDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDRenalCyst","qText":"Renal cysts","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDRCMultiple","qText":"Do you have a single cyst or multiple cysts?","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory","hadUTDRCMultipleDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDBenign","qText":"Childhood kidney reflux (vesicoureteral reflux)\n Congential solitary kidney, horseshoe kidney\n Enlarged Prostate Gland/Prostatic Hyperplasia\n Incontinence\n Prostatitis\n Urinary Tract Infection or Cystitis","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory"],"props":[{"name":"hadUTDNotSure","qText":"Other / Not sure","skipFalse":true}]},{"qNum":"C10m","entity":["personalHistory","DiagnosisUTDNotSure"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10n","entity":["personalHistory"],"props":[{"name":"hadSDPsoriasis","qText":"Psoriasis","skipFalse":true}]},{"qNum":"C10n","entity":["personalHistory"],"props":[{"name":"hadSDArthritis","qText":"Do you have arthritis or psoratic arthritis?","showAnswer":true}]},{"qNum":"C10n","entity":["personalHistory","hadSDArthritisDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10n","entity":["personalHistory"],"props":[{"name":"hasSDMeds","qText":"Are you undergoing any treatment other than the use of topical medications?","showAnswer":true}]},{"qNum":"C10n","entity":["personalHistory","hasSDMedsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10n","entity":["personalHistory"],"props":[{"name":"hasSDOther","qText":"Other / Not sure","skipFalse":true}]},{"qNum":"C10n","entity":["personalHistory","DiagnosisSDNotSure"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10p","entity":["personalHistory"],"props":[{"name":"hadIDCervicitis","qText":"Cervicitis, endometriosis, or pelvic inflammatory disease","skipFalse":true}]},{"qNum":"C10p","entity":["personalHistory"],"props":[{"name":"hadIDFibrocystic","qText":"Fibrocystic disease of the breast","skipFalse":true}]},{"qNum":"C10p","entity":["personalHistory"],"props":[{"name":"hadIDOvarianCyst","qText":"Ovarian cyst","skipFalse":true}]},{"qNum":"C10p","entity":["personalHistory"],"props":[{"name":"hadIDOBenign","qText":"Is it benign?","showAnswer":true}]},{"qNum":"C10p","entity":["personalHistory","hadIDOBenignDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10p","entity":["personalHistory"],"props":[{"name":"hadIDPolycystic","qText":"Polycystic ovarian syndrome","skipFalse":true}]},{"qNum":"C10p","entity":["personalHistory","hadIDPolycysticDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10p","entity":["personalHistory"],"props":[{"name":"hadIDCongenitalMalform","qText":"Congenital malformation of the genital tract\n Ovarian Torsion\n Ectopic Pregnancy\n Papilloma of the Female Genital Tract\n Sexually Transmitted Disease (other than HIV or Syphillis)\n Uterine Fibroid\n Uterine Prolapse","skipFalse":true}]},{"qNum":"C10p","entity":["personalHistory"],"props":[{"name":"hadIDNotSure","qText":"Other / Not sure","skipFalse":true}]},{"qNum":"C10p","entity":["personalHistory","DiagnosisIDNotSure"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10q","entity":["personalHistory"],"props":[{"name":"hadCPBenign","qText":"Multiple Miscarriages, Placental Problems, Bleeding or Labor/Delivery Issues","skipFalse":true}]},{"qNum":"C10q","entity":["personalHistory"],"props":[{"name":"hadCPHighBloodPressure","qText":"High Blood Pressure","skipFalse":true}]},{"qNum":"C10q","entity":["personalHistory"],"props":[{"name":"hadCPHeartLiverKidneyProblems","qText":"Heart, Liver or Kidney Problems","skipFalse":true}]},{"qNum":"C10q","entity":["personalHistory","hadCPHeartLiverKidneyProblemsDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10q","entity":["personalHistory"],"props":[{"name":"hadCPSeizures","qText":"Seizures","skipFalse":true}]},{"qNum":"C10q","entity":["personalHistory","hadCPSeizuresDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10q","entity":["personalHistory"],"props":[{"name":"hadCPGestationalDiabities","qText":"Gestational Diabetes","skipFalse":true}]},{"qNum":"C10q","entity":["personalHistory","hadCPGestationalDiabitiesDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C10q","entity":["personalHistory"],"props":[{"name":"hadCPNotSure","qText":"Other/Not Sure","skipFalse":true}]},{"qNum":"C10q","entity":["personalHistory","CPDetails"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C11b","entity":["personalHistory","hadAlcoholAbuseDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C11ci","entity":["personalHistory","bloodTransfusionDetails"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C11cii","entity":["personalHistory","heartSurgeryDetails"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C11ciii","entity":["personalHistory","otherSurgeryDetails"],"props":[{"name":"description","qText":"","showAnswer":true},{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C12a","entity":["personalHistory"],"props":[{"name":"hadECGNormal","qText":"Was your ECG result normal?","showAnswer":true}]},{"qNum":"C12a","entity":["personalHistory","hadECGNormalDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C13","entity":["personalHistory"],"props":[{"name":"hadEORoutine","qText":"Were all these exams, check-ups and/or evaluations performed for routine medical care (routine physicals, immunizations, routine gynecological care, etc.), acute limited illness (cough, cold, flu, sore throat, sinus infection, rashes, urinary infection, etc.), or minor musculoskeletal injury/pain (abrasions, contusions, lacerations, back/neck or joint injury, sprains, strains, etc.?","showAnswer":true}]},{"qNum":"C14","entity":["personalHistory","hadTreatmentOtherDiagnosis"],"props":[{"name":"physician","qText":"","showAnswer":true},{"name":"date","qText":"","showAnswer":true}]},{"qNum":"C15","entity":["personalHistory","hadMedsOther"],"props":[{"name":"rxName","qText":"","showAnswer":true}]},{"qNum":"B13 - Auto Racing","entity":["riskFactors"],"props":[{"name":"avARATV","qText":"All Terrain Vehicles (ATV), excluding Three-Wheel","skipFalse":true}]},{"qNum":"B13 - Auto Racing","entity":["riskFactors"],"props":[{"name":"avARATV3Wheel","qText":"Three-Wheel All Terrain Vehicles (ATV)","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Auto Crash","entity":["riskFactors"],"props":[{"name":"avARCDiveBomber","qText":"Dive Bomber, Rollovers, \"T\" Bone","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Auto Crash","entity":["riskFactors"],"props":[{"name":"avARCDemolition","qText":"Demolition, Destruction Derby, Figure \"8\" Demolition","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Auto Crash","entity":["riskFactors"],"props":[{"name":"avARCOther","qText":"Other/Not Sure","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Kart Racers (Go-Cart)","entity":["riskFactors"],"props":[{"name":"avARGCSprint","qText":"Sprint","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Kart Racers (Go-Cart)","entity":["riskFactors"],"props":[{"name":"avARGCEnduro","qText":"Enduro","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Kart Racers (Go-Cart)","entity":["riskFactors"],"props":[{"name":"avARGCFormula","qText":"Formula Kart Experiment (FKE)","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Kart Racers (Go-Cart)","entity":["riskFactors"],"props":[{"name":"avARGCMidget","qText":"Midget (other than Full Size)","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Kart Racers (Go-Cart)","entity":["riskFactors"],"props":[{"name":"avARGCMini","qText":"Mini car","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Off Road","entity":["riskFactors"],"props":[{"name":"avARORDesert","qText":"Desert (incl. Baja, Dune, Trail) - U.S. Only","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Off Road","entity":["riskFactors"],"props":[{"name":"avARORRally","qText":"Long Distance, Rally - U.S. Only","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Off Road","entity":["riskFactors"],"props":[{"name":"avAROROther","qText":"Other or Outside U.S.","skipFalse":true}]},{"qNum":"B13 - Auto Racing - Off Road","entity":["riskFactors"],"props":[{"name":"avARRally","qText":"Rally Racing (Local Events Only)","skipFalse":true}]},{"qNum":"B13 - Auto Racing","entity":["riskFactors"],"props":[{"name":"avAROtherDetails","qText":"","showAnswer":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avBalloning","qText":"Ballooning","skipFalse":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avBigGame","qText":"Big game hunting","skipFalse":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avBobsledding","qText":"Bobsledding (Competitive or Professional)","skipFalse":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avBoxing","qText":"Boxing (Amateur Only)","skipFalse":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avBoxingPro","qText":"Boxing (Professional)","skipFalse":true}]},{"qNum":"B13 - Bungee Jumping","entity":["riskFactors"],"props":[{"name":"avBungeeNow","qText":"Do you plan on bungee jumping within the next two years?","showAnswer":true}]},{"qNum":"B13 - Hang Gliding","entity":["riskFactors"],"props":[{"name":"avHangGlidingLow","qText":"Is your hang gliding limited to amateur, club affiliated jumps in minimal danger areas less than 500 feet altitude with no soaring?","showAnswer":true}]},{"qNum":"B13 - Hang Gliding","entity":["riskFactors"],"props":[{"name":"avHangGlidingOften","qText":"Do you hang glide fewer than 25 times per year?","showAnswer":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avHeliSkiing","qText":"Heli skiing","skipFalse":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avMartialArts","qText":"Martial Arts (Amateur or Instructor)","skipFalse":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avMartialArtsPro","qText":"Martial Arts (Professional Competition)","skipFalse":true}]},{"qNum":"B13","entity":["riskFactors"],"props":[{"name":"avMotorboatRacing","qText":"Motorboat / powerboat racing","skipFalse":true}]},{"qNum":"B13 - Motorcycle Racing","entity":["riskFactors"],"props":[{"name":"avMRType","qText":"What kind of motorcylces do you race?","showAnswer":true}]},{"qNum":"B13 - Motorcycle Racing","entity":["riskFactors"],"props":[{"name":"avMRGrandPrix","qText":"Do you race Grand Prix up to 250cc?","showAnswer":true}]},{"qNum":"B13 - Motorcycle Racing","entity":["riskFactors"],"props":[{"name":"avMRDrag","qText":"Do you participate in drag racing, dragster division racing, road racing, speedway racing, or tourist trophy racing, or do you ever race outside the US?","showAnswer":true}]},{"qNum":"B13 - Mountain Climing","entity":["riskFactors"],"props":[{"name":"avMCRated","qText":"Are all your climbs limited to difficulty levels of Class 1-4 of the Yosemite Decimal System (YDS)?","showAnswer":true}]},{"qNum":"B13 - Scuba Diving","entity":["riskFactors"],"props":[{"name":"avSDShallow","qText":"Are your dives limited to 100 feet in depth?","showAnswer":true}]},{"qNum":"B13 - Scuba Diving","entity":["riskFactors"],"props":[{"name":"avSDBasicCert","qText":"Is your certification limited to a resort or basic certification?","showAnswer":true}]},{"qNum":"B13 - Scuba Diving","entity":["riskFactors"],"props":[{"name":"avSDInfrequent","qText":"Do you dive fewer than 50 times per year?","showAnswer":true}]},{"qNum":"B13 - Skydiving/Ultralight","entity":["riskFactors"],"props":[{"name":"avSDSoon","qText":"Do you plan to skydive within the next two years?","showAnswer":true}]},{"qNum":"B13 - Skydiving/Ultralight","entity":["riskFactors"],"props":[{"name":"avSKDInfrequent","qText":"Do you jump fewer than 25 times per year?","showAnswer":true}]},{"qNum":"B13 - Skydiving/Ultralight","entity":["riskFactors"],"props":[{"name":"avSDAmateur","qText":"Is all your skydiving limited to Amateur, USPA, no baton Passing, no delayed chute openings?","showAnswer":true}]},{"qNum":"B13 - Other","entity":["riskFactors","avOtherDetail"],"props":[{"name":"type","qText":"Type:","showAnswer":true},{"name":"frequency","qText":"Frequency:","showAnswer":true}]},{"qNum":"B2","entity":["riskFactors"],"props":[{"name":"mvLastDUI","qText":"How many years has it been since your last DUI?","showAnswer":true}]},{"qNum":"B2","entity":["riskFactors"],"props":[{"name":"mvDUIConvitions","qText":"In the past 5 years, how many DUI convictions have you received?","showAnswer":true}]},{"qNum":"B3","entity":["riskFactors"],"props":[{"name":"mvViolations","qText":"In the past 5 years, how many moving violations have you received?","showAnswer":true}]},{"qNum":"B3","entity":["riskFactors"],"props":[{"name":"mvAccidentAtFault","qText":"At-Fault Accident","skipFalse":true}]},{"qNum":"B3 - At-Fault Accident","entity":["riskFactors","mvAccidentAtFaults"],"props":[{"name":"mvAccidentWhen","qText":"","showAnswer":true,"suffix":"ago"}]},{"qNum":"B3","entity":["riskFactors"],"props":[{"name":"mvSpeeding","qText":"Speeding Ticket","skipFalse":true}]},{"qNum":"B3","entity":["riskFactors"],"props":[{"name":"mySpeedingTicketCount","qText":"How many speeding tickets have you received?","showAnswer":true}]},{"qNum":"B3 - Speeding Ticket","entity":["riskFactors","mySpeedingTickets"],"props":[{"name":"mvSpeeding15Over","qText":"Was this ticket for speeding more than 15 miles per hour over the speed limit?","showAnswer":true},{"name":"mvSpeedingDate","qText":"","showAnswer":true,"suffix":"ago"}]},{"qNum":"B3","entity":["riskFactors"],"props":[{"name":"mbReckless","qText":"Careless/Reckless Driving","skipFalse":true}]},{"qNum":"B3 - Careless/Reckless Driving","entity":["riskFactors","mbRecklessTickets"],"props":[{"name":"mvRecklessDate","qText":"","showAnswer":true,"suffix":"ago"}]},{"qNum":"B3","entity":["riskFactors"],"props":[{"name":"mvOther","qText":"Other Moving Violation","skipFalse":true}]},{"qNum":"B3 - Other Moving Violation","entity":["riskFactors","mvOthers"],"props":[{"name":"mvOtherWhen","qText":"","showAnswer":true,"suffix":"ago"},{"name":"mvOtherDetails","qText":"","showAnswer":true}]},{"qNum":"B4 - Convicted of driving with a suspended or revoked license","entity":["riskFactors","mvDrivingWhileSuspendedCons"],"props":[{"name":"mvDWSConvictionDate","qText":"","showAnswer":true,"suffix":"ago"}]},{"qNum":"B10 - Travel","entity":["riskFactors","ftCountries"],"props":[{"name":"name","qText":"","showAnswer":true},{"name":"ftMexicoSpecific","qText":"","showAnswer":true},{"name":"departureDateWhen","qText":"","showAnswer":true},{"name":"departureDate","qText":"","showAnswer":true},{"name":"duration","qText":"","showAnswer":true,"suffix":"Days"},{"name":"purpose","qText":"","showAnswer":true}]},{"qNum":"C6","entity":["riskFactors"],"props":[{"name":"usesCigarettes","qText":"Cigarettes","skipFalse":true}]},{"qNum":"C6","entity":["riskFactors"],"props":[{"name":"usesCigars","qText":"Cigars","skipFalse":true}]},{"qNum":"C6","entity":["riskFactors"],"props":[{"name":"usesPipe","qText":"Other (Pipe, Chewing Tobacco, E-Cigarettes, Patch, Gum, Smoking Cessation Aids)","skipFalse":true}]},{"qNum":"C6","entity":["riskFactors"],"props":[{"name":"usesCigarsFrequency","qText":"On average, how many cigars do you smoke per month?","showAnswer":true}]},{"qNum":"C6","entity":["riskFactors"],"props":[{"name":"quitCigarrettesPeriod","qText":"How many years has it been since you quit smoking cigarettes?","showAnswer":true}]},{"qNum":"C6","entity":["riskFactors"],"props":[{"name":"quitCigarsPeriod","qText":"How many years has it been since you quit smoking cigars?","showAnswer":true}]},{"qNum":"C6","entity":["riskFactors"],"props":[{"name":"usedCigarsFrequency","qText":"On average, how many cigars per month did you smoke at the time?","showAnswer":true}]},{"qNum":"C6","entity":["riskFactors"],"props":[{"name":"quitTobaccoPeriod","qText":"How many years has it been since you quit using these other tobacco products?","showAnswer":true}]}]
				/** End Generated Code - FR2150 **/
            ;

            return _.compact(_.flatten(details.map(function(line) {
                var entity = line.entity.reduce(function(obj, ent) {
                    return obj[ent];
                }, this.insured);

                return Utils.array(entity).map(function(ent) {
                    var answer = line.props.reduce(function(a, p) {
                        var ans = ent[p.name];
                        return ans == null || (ans === false && p.skipFalse) ? a :
                            (a + ' - ' + (p.qText ? p.qText + ' ' : '') + (p.showAnswer ? fmtAnswer(ent, p) : ''));
                    }, '');
                    return answer ? (line.qNum + answer) : '';
                }, '');
            }.bind(this))));

            function fmtAnswer(ent, p) {
                var val = ent[p.name],
                    descs = ent[p.name + 'Descriptions'],
                    ans = val;

                if (val === true) {
                    ans = 'Yes';
                } else if (val === false) {
                    ans = 'No';
                } else if (val instanceof Date) {
                    ans = ent.__template__ && ent.__template__.defineProperties[p.name].rule == 'shortdate' ?
                        Utils.dateToMY(val) : Utils.dateToMdy(val);
                } else if (descs) {
                    ans = descs[val];
                }
                if (p.prefix) {
                    ans = p.prefix + ' ' + ans;
                }
                if (p.suffix) {
                    ans += ' ' + p.suffix;
                }
                return ans;
            }
        },

        paginateAdditionalSupplementDetails: function() {
            return pageBreak(this.getAdditionalSupplementDetails(), 85, 25); //assuming 10-pt Courier

            function pageBreak(strArr, lineWidth, pageLines) { //returns array of pages which are strings
                var pages = [], page = '', pageLineCnt = 0;

                strArr.forEach(function(str) {
                    str.split('\n').forEach(function(strLine) {
                        var startPos = 0, endPos = 0;
                        while (strLine.length - startPos > lineWidth) {
                            endPos = strLine.lastIndexOf(' ', startPos + lineWidth);
                            addLine(strLine.substring(startPos, endPos));
                            startPos = endPos + 1;
                        }
                        addLine(strLine.substring(startPos));
                    });
                    addLine('');
                });
                addLine('', true);

                return pages;

                function addLine(str, eop) {
                    if (str == '' && page == '') return;
                    page = page + str + '\n';
                    pageLineCnt++;
                    if (pageLineCnt >= pageLines || eop) {
                        pages.push(page);
                        page = '';
                        pageLineCnt = 0;
                    }
                }
            }
        },

        countAdditionalSupplementPages: function() {
            return this.paginateAdditionalSupplementDetails().length;
        },

        getAdditionalSupplementPageVarying: function(pageOffset) {
            return this.paginateAdditionalSupplementDetails()[pageOffset];
        },

        getRunModes: function() {
            return this.insured.address.line1;
        },

        setRunModes: function(runModes) {
            this.insured.address.line1 = runModes;
        },

        getOwnerTimezone: function() {
            return this.ownerPersonResidentialAddress.timezone;
        },

        ownerPackage: {type: PackageQuery, isLocal: true},

        getOwnerPackage: function() {
            return PackageQuery.getByState(this.ownerPersonResidentialAddress.state).then(function(pkgs) {
                if (pkgs && pkgs.length > 0) {
                    this.ownerPackage = pkgs[0];
                }
                return this.ownerPackage;
            }.bind(this));
        },

        /**
         * PA docusign disclsoure
         */
        getPolicyTitle: function(){
            return 'Term Life ' + this.term + ' Years';
        },

        getPolicyFace: function(){
            return '$' + this.faceAmount;
        },

        getPolicyPremium: function(){
            return '$' + this.selectedQuote.policies[0].monthly;
        },

        getRiderTitle: function(){
            return 'Accelerated Death Benefit\n\n\n\n' + (this.waiver ? 'Waiver of Premium' : '');
        },

        getRiderFaceAmount: function(){
            return 'We will accelerate payment of a portion of the death benefit, upon request, if the Insured is terminally ill.\n' + (this.waiver ? 'If the Insured becomes totally disabled, we will waive all premiums.' : '');
        },

        getRiderMonthly: function(){
            return 'The cost is included in the premium for the policy.\n\n\n' + (this.waiver ? '$' + this.waiverPremium.toFixed(2) : '');
        }
  	}));

    var PolicyDocQuery = objectTemplate.create("PolicyDocQuery", {
        type:       {type: String},     // Physical type of document (e.g. mime type)
        docSource:  {type: String},
        appType:    {type: String},
        subType:    {type: String},
        name:       {type: String},
        date:       {type: Date}
    });
    var PolicyQuery = objectTemplate.create("PolicyQuery", {});
    PolicyQuery.mixin(Utils.extend({}, PolicyMixin, {
        policyNumber:           {type: String},
        effectiveDate:          {type: Date},
        finalRateClass:         {type: String},
        tLICEffectiveDate:      {type: Date},
        tLICRateClass:          {type: String},
        workflowState:          {type: String, value: ""},
        futureWorkflowState:    {type: String, value: ""},
        workflowSubState:       {type: String, value: ""},
        futureWorkflowSubState: {type: String, value: ""},
        workflowStateUpdate:    {type: Date},
        submittedAt:            {type: Date},
        faceAmount:             {type: Number, value: 0},
        term:                   {type: Number, value: 0},
        insured:                {type: ApplicantQuery},
        ownerPerson:            {type: PersonQuery},
        policyDocs:             {type: Array, of: PolicyDocQuery}
    }));

    PolicyDoc.TYPES = {html: 'html', pdf: 'pdf', jpeg: 'jpeg'};
    PolicyDoc.SOURCES = {uploaded: 'uploaded', algo: 'algo', app: 'app'};
    PolicyDoc.DOCTYPE = { aps: 'APS', amendment: 'Amendment', rx: 'Rx', lab: 'Lab results', eir: 'EIR',
        taxForm: 'Tax Form', financialForm: 'Financial Form', other: 'Other' };
    PolicyDoc.DOCTYPES = ['APS', 'Amendment', 'Rx', 'Lab results', 'EIR', 'Tax Form', 'Financial Form', 'Other'];
    PolicyDoc.mixin(
    {
        doc:        {type: String, toClient: false, toServer: false},
        type:       {type: String},     // Physical type of document (e.g. mime type)
        docType:    {type: String},      // Yet another type for documents uploaded by underwriters/ops
        docSource:    {type: String},
        docSourceValues: {isLocal: true, type: Object, value:
            {uploaded:"Uploaded Document", algo:"Generated by Algo Underwriting", app:"Application Package"}},
        appType:     {type: String},
        appTypeValues: {isLocal: true, type: Object, value: {
             "App":             "Application", // (Required)
             "AppSupplement":   "AdditionalDetails",
             "Aviation":        "AviationSupp",
             "Avocation":       "AvocationSupp",
             "ForeignTravel":   "TravelForm",
             "Bene":            "BeneDesgination",
             "Owner":           "OwnerDesignation",
             "ACBRDisclosure":  "ACBRDisclosure",
             "StateDisclosure": "StateDisclosure",
             "MiscSupp":        "MiscSupp",
             "Packet":          "AppPacket",
             "HIPPA":           "HIPPA"
        }},
        subType:    {type: String},
        policy:     {type: Policy},
        name:       {type: String},
        date:       {type: Date},
        uploadedBy: {type: String},

        init: function(name, doc, type, docSource, policy, appType, docType, uploadedBy) {
            this.name = name || this.appTypeValues[appType];
            this.doc = doc;
            this.type = type;
            this.docSource = docSource;
            this.policy = policy;
            this.date = new Date();
            this.docSource = docSource || 'uploaded';
            this.appType = appType || null;
            this.docType = docType || null;
            this.uploadedBy = uploadedBy || null;
        }
    });
    PolicyComment.mixin(
    {
        by: {type: String},
        getBySplit: function () {
            var parts = this.by.split("@");
            return parts[1] ? parts[0] + " @ " + parts[1] : parts[0];
        },
        date: {type: Date},
        note: {type: String, value: "", rule: ["required"]},
        getNoteLines: function () {
            return this.note.split("\n");
        },
        policy: {type: Policy},

        init: function(by, note, policy){
            this.by = by;
            this.note = note;
            this.date = new Date();
            this.policy = policy;
        }
    });

    return {
        Policy: Policy,
        PolicyQuery: PolicyQuery,
        PolicyDoc: PolicyDoc,
        PolicyComment: PolicyComment,
        PremiumBreakdown: PremiumBreakdown,
        FlatExtra: FlatExtra,
        LexisNexisIdCheck: LexisNexisIdCheck,
        DrivingReport: DrivingReport,
        DrivingViolation: DrivingViolation,
        StandardDrivingViolation: StandardDrivingViolation,
        LexisNexisDrivingRecords: LexisNexisDrivingRecords,
        MedicalRecords: MedicalRecords,
        RxRecords: RxRecords,
        MillimanRxRecords: MillimanRxRecords,
        LabTestResult: LabTestResult,
        ExamOneLabRecords: ExamOneLabRecords,
        BiosigniaMatResult: BiosigniaMatResult,
        MortalityResult: MortalityResult,
        IdCheck: IdCheck,
        DrivingRecords: DrivingRecords,
        DrivingMessage: DrivingMessage,
        MatResult: MatResult,
        PolicyDocQuery: PolicyDocQuery,
        WorkflowStateHistory: WorkflowStateHistory,
        LabRecords: LabRecords

    }
};

module.exports.Policy_mixins = function (objectTemplate, requires)
{
    var Customer = requires.Customer.Customer;
    var Applicant = requires.Applicant.Applicant;
    var CustomerQuery  = requires.Customer.CustomerQuery;
    var Admin = requires.Admin.Admin;
    var PolicyQuery = requires.Policy.PolicyQuery;
    var Policy = requires.Policy.Policy;
    var Points = requires.Points.Points;

    Points.mixin({
        policy:      {type: Policy}
    });
    Policy.mixin(
    {
        customer:    {type: Customer},
        underwriter: {type: Admin}
    });
    PolicyQuery.mixin(
        {
            customer:    {type: CustomerQuery},
            underwriter: {type: Admin, fetch: true}
        });
};
