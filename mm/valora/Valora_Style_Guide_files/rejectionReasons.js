module.exports.rejectionReasons = function (_objectTemplate, _getTemplate) {
    var rejectionCodes = {
        '25.1':     'insuredAge',
        '25.2':     'armedForces',
        '25.3':     'insuredCitizenship',
        '25.4':     'verificationFailure',
        '25.5':     'nonPersonalPurpose',
        '25.6':     'premiumSource',
        '25.7':     'alreadyOwnPolicy',
        '25.8':     'avocation',
        '25.9':     'incomeReplacement',
        '25.10':    'replacement',
        '25.10.1':  'premiumToIncomeRatio',
        '25.11':    'occupation',
        '25.12':    'travel',
        '25.13':    'drivingHistory',
        '25.14':    'criminalHistory',
        '25.15.3':  'economicIncentiveAgreements',
        '25.16':    'hivOptout',
        'MR':       'multipleReasons'
    };

    var rejectionReasons = {
        insuredAge: {
            long:   'we currently offer this policy only to adults between the ages of 18 and 44. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Insured is not between 18-44'
        },
        armedForces: {
            long:   'this policy isn\'t offered to military personnel. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Insured is Military Personnel'
        },
        insuredCitizenship: {
            long:   'currently this policy isn\'t offered to non-US citizens or residents. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Non US citizen'
        },
        verificationFailure: {
            long:   'we can\'t verify the personal information you provided. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Can\'t verify personal information'
        },
        nonPersonalPurpose: {
            long:   'your purpose for buying the insurance isn\'t personal. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.',
            short:  'Purchasing for non-personal reason'
        },
        premiumSource: {
            long:   'you said you would be borrowing money to pay for the policy or because you intend to assign the policy to someone else. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Borrowing Money to pay for this policy'
        },
        alreadyOwnPolicy: {
            long:   'there is already an active policy on the insured. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Insured already has an active policy'
        },
        avocation: {
            long:   'you participate in dangerous activities this policy doesn\'t cover. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Participate in Dangerous Activity'
        },
        incomeReplacement: {
            long:   'you are applying for too much insurance relative to your income. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Too much insurance relative to your income'
        },
        replacement: {
            long:   'you are replacing an existing insurance policy. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Replacing an existing policy'
        },
        premiumToIncomeRatio: {
            long:   'you are applying for too much insurance relative to your income. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Too much insurance relative to your income'
        },
        occupation: {
            long:   'this policy doesn\'t support life insurance for your occupation. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  'Participate in Dangerous Activity'
        },
        travel: {
            long:   'of your travel. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  ''
        },
        drivingHistory: {
            long:   'of your driving history. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short: ''
        },
        criminalHistory: {
            long:   'of your criminal history. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  ''
        },
        economicIncentiveAgreements: {
            long:   'we do not have any policies that permit economic incentives for the purchase of a policy or that allow an investor or lender a portion of the benefit.',
            short:  'Receiving economic incentives for the purchase of this policy or allows an investor or lender a portion of the benefit'
        },
        hivOptout: {
            long:   'you opted out of HIV testing.',
            short:  'Insured does not wanted to tested for HIV'
        },
        'multipleReasons': {
            long:   'of the reasons stated below. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.',
            short:  ''
        }
    };

    return {
        rejectionCodes:     rejectionCodes,
        rejectionReasons:   rejectionReasons
    };
};
