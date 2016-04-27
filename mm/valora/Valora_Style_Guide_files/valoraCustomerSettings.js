module.exports.valoraCustomerSettings = function (_objectTemplate, getTemplate) {

    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
    var Settings    = getTemplate('./customer/Customer.js').Settings;

    var ValoraCustomerSettings = Settings.extend('ValoraCustomerSettings', {
        retirementAge: {
            type: Number,
            value: Assumptions.retirementAge,
            rule: ['numeric'],
            min: 30,
            max: 100,
            validate: 'isWithin(30, 100)'
        },
        retirementAgeValues: {
            isLocal: true,
            type: Object,
            value: {
                50: '50',
                51: '51',
                52: '52',
                53: '53',
                54: '54',
                55: '55',
                56: '56',
                57: '57',
                58: '58',
                59: '59',
                60: '60',
                61: '61',
                62: '62',
                63: '63',
                64: '64',
                65: '65',
                66: '66',
                67: '67',
                68: '68',
                69: '69',
                70: '70',
                71: '71',
                72: '72',
                73: '73',
                74: '74',
                75: '75'
            }
        },
        mortalityAge: {
            type: Number,
            value: Assumptions.mortalityAge,
            rule: ['numeric'],
            min: 30,
            max: 120,
            validate: 'isWithin(30, 120)'
        },
        leaveTheNestAge: {
            type: Number,
            value: Assumptions.leaveTheNestAge
        },
        inflation: {
            type: Number,
            value: Assumptions.inflation
        },
        collegeInflation: {
            type: Number,
            value: Assumptions.collegeInflation
        },
        discountRate: {
            type: Number,
            value: Assumptions.discountRate
        },
        retirementRate: {
            type: Number,
            value: Assumptions.retirementRate
        },
        leaveTheNestAgeValues: {
            isLocal: true,
            type: Object,
            value: {
                16: '16',
                17: '17',
                18: '18',
                19: '19',
                20: '20',
                21: '21',
                22: '22',
                23: '23',
                24: '24',
                25: '25'
            }
        }
    });

    return {
        ValoraCustomerSettings: ValoraCustomerSettings
    };
};
