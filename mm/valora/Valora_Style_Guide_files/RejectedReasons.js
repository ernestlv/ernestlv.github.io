module.exports.RejectedReasons = function (objectTemplate, getTemplate){

    var codes = {
        INSURED_AGE: '25.1', ARMED_FORCES: '25.2', INSURED_CITIZENSHIP: '25.3', OWNER_CITIZENSHIP: '25.3',
        VERIFICATION_FAILURE: '25.4', NON_PERSONAL_PURPOSE: '25.5',
        PREMIUM_SOURCE: '25.6', COLLATERAL_ASSIGNMENT: '25.6', BENEFICIAL_INTEREST_AGREEMENTS: '25.6',
        ALREADY_OWN_HAVEN_POLICY: '25.7', AVOCATION: '25.8', INCOME_REPLACEMENT: '25.9',
        REPLACEMENT: '25.10', PREMIUM_TO_INCOME_RATIO: '25.10.1', OCCUPATION: '25.11', TRAVEL: '25.12',
        DRIVING_HISTORY: '25.13', CRIMINAL_HISTORY: '25.14', ECONOMIC_INCENTIVE_ARRANGEMENTS: '25.15.3',
        HIV_OPTOUT: '25.16',
        MULTIPLE_REASONS: 'MR'
    };

    var shortDescriptions = {};
    shortDescriptions[codes.INSURED_AGE] = "Insured is not between 18-44";
    shortDescriptions[codes.ARMED_FORCES] = "Insured is Military Personnel";
    shortDescriptions[codes.INSURED_CITIZENSHIP] = "Non US citizen";
    shortDescriptions[codes.VERIFICATION_FAILURE] = "Can't verify personal information";
    shortDescriptions[codes.NON_PERSONAL_PURPOSE] = "Purchasing for non-personal reason";
    shortDescriptions[codes.PREMIUM_SOURCE] = "Borrowing Money to pay for this policy";
    shortDescriptions[codes.ALREADY_OWN_HAVEN_POLICY] = "Insured already has an active policy";
    shortDescriptions[codes.AVOCATION] = "Participate in Dangerous Activity";
    shortDescriptions[codes.OCCUPATION] = "Participate in Dangerous Activity";
    shortDescriptions[codes.INCOME_REPLACEMENT] = "Too much insurance relative to your income";
    shortDescriptions[codes.PREMIUM_TO_INCOME_RATIO] = "Too much insurance relative to your income";
    shortDescriptions[codes.REPLACEMENT] = "Replacing an existing policy";
    shortDescriptions[codes.TRAVEL] = "";
    shortDescriptions[codes.DRIVING_HISTORY] = "";
    shortDescriptions[codes.CRIMINAL_HISTORY] = "";
    shortDescriptions[codes.ECONOMIC_INCENTIVE_ARRANGEMENTS] = "Receiving economic incentives for the purchase of this policy or allows an investor or lender a portion of the benefit";
    shortDescriptions[codes.HIV_OPTOUT] = "Insured does not wanted to tested for HIV";

    var descriptions = {};
    //descriptions[codes.INSURED_AGE] = "We currently offer this policy only to adults between the ages of 18 and 45. Not to worry. You can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.ARMED_FORCES] = "Currently this policy isn’t offered to military personnel. Not to worry. You can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.INSURED_CITIZENSHIP] = "Currently this policy isn’t offered to non-US citizens or residents. Not to worry. You can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.VERIFICATION_FAILURE] = "We can’t verify the personal information you provided so we can't take your application for the Haven Term Life policy at this time.  Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.NON_PERSONAL_PURPOSE] = "At this time, we can’t offer you this policy since your purpose for buying the insurance isn’t personal. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.PREMIUM_SOURCE] = "At this time, we can’t offer you this policy since you said you would be borrowing money to pay for the policy or because you intend to assign the policy to someone else. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.PREVIOUSLY_DECLINED] = "At this time, we can’t offer you this policy because you have to wait at least two years from when you last got or were declined for a Haven Term policy. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.AVOCATION] = "At this time, we can’t offer you this policy because participate in dangerous activities this policy doesn’t cover. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.OCCUPATION] = "Unfortunately, at this time this policy doesn’t support life insurance for your occupation. Not to worry, you can still apply for a MassMutual Vantage term policy below, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.INCOME_REPLACEMENT] = "Unfortunately, we can’t offer you this policy because you are applying for too much insurance relative to your income. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision. Otherwise, you can go back and pick a different amount of coverage.";
    //descriptions[codes.PREMIUM_TO_INCOME_RATIO] = "Unfortunately, we can’t offer you this policy because you are applying for too much insurance relative to your income. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision. Otherwise, you can go back and pick a different amount of coverage.";
    //descriptions[codes.REPLACEMENT] = "Unfortunately, we can’t offer you this policy because you are replacing an existing insurance policy. Not to worry, you can still apply for a MassMutual Vantage term policy below, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.TRAVEL] = "Unfortunately, at this time we can’t offer you this particular policy because of your travel. Not to worry, you can still apply for a MassMutual Vantage term policy below, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.DRIVING_HISTORY] = "Unfortunately, at this time we can’t offer you this particular policy because of your driving history. Not to worry, you can still apply for a MassMutual Vantage term policy below, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.CRIMINAL_HISTORY] = "Unfortunately, at this policy is only offered to those without a criminal history. Not to worry, you can still apply for a MassMutual Vantage term policy below, but it may take four to six weeks after you apply to get your decision.";
    //descriptions[codes.ECONOMIC_INCENTIVE_ARRANGEMENTS] = "We’re sorry, but currently we do not have any policies that permit economic incentives for the purchase of a policy or that allow an investor or lender a portion of the benefit.";
    //descriptions[codes.MULTIPLE_REASONS] = "Unfortunately, we can't offer you this policy based on the reasons stated below. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";

    // TEMPORARY DESCRIPTIONS PRE_VANTAGE

    descriptions[codes.INSURED_AGE] = "At this time, we can’t offer you the Haven Term policy because we currently offer this policy only to adults between the ages of 18 and 44. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.ARMED_FORCES] = "At this time, we can’t offer you the Haven Term policy because this policy isn’t offered to military personnel. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.INSURED_CITIZENSHIP] = "At this time, we can’t offer you the Haven Term policy because currently this policy isn’t offered to non-US citizens or residents. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.VERIFICATION_FAILURE] = "At this time, we can’t offer you the Haven Term policy because we can’t verify the personal information you provided. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.NON_PERSONAL_PURPOSE] = "At this time, we can’t offer you the Haven Term policy because your purpose for buying the insurance isn’t personal. Not to worry, you can still apply for a MassMutual Vantage term policy, but it may take four to six weeks after you apply to get your decision.";
    descriptions[codes.PREMIUM_SOURCE] = "At this time, we can’t offer you this policy since you said you would be borrowing money to pay for the policy or because you intend to assign the policy to someone else. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.ALREADY_OWN_HAVEN_POLICY] = "At this time, we can’t offer you this policy because there is already an active policy on the insured. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.AVOCATION] = "At this time, we can’t offer you the Haven Term policy because you participate in dangerous activities this policy doesn’t cover. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.OCCUPATION] = "At this time, we can’t offer you the Haven Term policy because this policy doesn’t support life insurance for your occupation. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.INCOME_REPLACEMENT] = "At this time, we can’t offer you the Haven Term policy because you are applying for too much insurance relative to your income. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.PREMIUM_TO_INCOME_RATIO] = "At this time, we can’t offer you the Haven Term policy because you are applying for too much insurance relative to your income. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.REPLACEMENT] = "At this time, we can’t offer you the Haven Term policy because you are replacing an existing insurance policy. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.TRAVEL] = "At this time, we can’t offer you the Haven Term policy because because of your travel. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.DRIVING_HISTORY] = "At this time, we can’t offer you the Haven Term policy because of your driving history. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.CRIMINAL_HISTORY] = "At this time, we can’t offer you the Haven Term policy because of your criminal history. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.MULTIPLE_REASONS] = "At this time, we can’t offer you the Haven Term policy because of the reasons stated below. Coming soon, you will have the ability to apply for a MassMutual Vantage term policy and the information you already gave us can be pre-filled for you. We will inform you when this option is available.";
    descriptions[codes.ECONOMIC_INCENTIVE_ARRANGEMENTS] = "We’re sorry, but currently we do not have any policies that permit economic incentives for the purchase of a policy or that allow an investor or lender a portion of the benefit.";
    descriptions[codes.HIV_OPTOUT] = "At this time, we can’t offer you the Haven Term policy because you opted out of HIV testing.";


    var RejectedReasons = {
        codes: codes,
        shortDescriptions: shortDescriptions,
        descriptions: descriptions
    };

    return {
        RejectedReasons: RejectedReasons
    }
};
