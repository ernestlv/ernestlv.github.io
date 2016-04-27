module.exports.Assumptions = function (objectTemplate, getTemplate)
{
    if (typeof(require) != 'undefined') {
        _ = require('underscore');
    }

    var Product = getTemplate('static/product.js').Product;

    var metadataKeys = {
        categories: {
            AppQuestions: 'App Questions',
            GeneralBusinessRules: 'General Business Rules',
            LabRules: 'Lab Rules',
            LabsNormalPoint: 'Labs Normal Point',
            PreferredCreditPoints: 'Preferred Credit Points',
            UnderwritingRules: 'Underwriting Rules',
            Workflow: 'Workflow'
        }
    };
    var channelCodes = {
        Haven: 'Haven',
        Valora: 'Valora',
        CAS: 'CAS',
        MM: 'MM'
    };
    var productTypeCodes = {
        Term: 'Term', 
        WholeLife: 'WholeLife'
    };
    var productCodes = {};
    productCodes[channelCodes.Haven] = {
        Term: 'Haven Term'
    };
    productCodes[channelCodes.Valora] = {
        Term: 'Valora Term',
        Rop: 'Valora ROP'
    };
    productCodes[channelCodes.CAS] = {
        Term: 'CAS Term'
    };
    productCodes[channelCodes.MM] = {
        Term: 'MM Term'
    };
    var languageCodes = {
        en: 'English',
        es: 'Spanish'
    };

    var ChannelAssumptions = getTemplate('./static/ChannelAssumptions.js').ChannelAssumptions;

	var Assumptions = {
            doLaddering: false, // Calculate ladders
            doSpouse: false,    // Calculate insurance for spouse
            percentIsOfBothIncomes:      false,     // Coverage percent based on insured's income
            commissionTerm: 1.1,
            taxRate:        .35,
            retirementAge:  65,
            SSNAge:         66,
            leaveTheNestAge: 21,
            startsWorkingAt: 25,
            mortalityAge:   90,
            inflation:     .025,
            collegeInflation:  .08,
            discountRate:   .04,
            debtPaydownRatio: 1/20,                 // how long to pay off debt
            retirementRate: .05,
            contributionRate:.10,
            termThreshold:  0,                  // Stop term when 20% of original value needed.
            healthCareMonthlyNoKids: 200,
            healthCareMonthlyWithKids: 400,
            ssnCOLA:        .017,
            ssnMaxIncome: {2014: 15480},
            savingsRate:.05,
            healthCareSalaryThreshold: 40000,
            startCollege: 18,
            medicareYear: 65,
            PIABendPoints:  [816, 4917],        // http://www.ssa.gov/oact/cola/bendpoints.html
            FMBendPoints: [1042, 1505, 1962],
            bendPointYear: 2014,
        // reduction in benefits for early retirement
            earlyRetirementAdjustments: {1:1 - (6 + 2/3)/100, 2:1 - (13 + 1/3)/100, 3:1 - 20/100, 4:1 - 25/100, 5:1 - 30/100},
            maxTermLength: 30,
            healthClassNoThreshold: .10,
            healthClassYesThreshold:.25,
            bloodPressureSystolic: {'1': 130, '2': 140, '3': 150},
            bloodPressureDystolic: {'1': 80, '2':90, '3': 100},
            allowSurplus: true,
            useSSNSurvirorBenefits : false,

            /* These are obsolete
            channels: [
                channelCodes.Haven,
                channelCodes.Valora,
                channelCodes.CAS,
                channelCodes.MM
            ],
            products: [
                'Life DI',
                'DI Only',
                'Term'
            ],
            */

            products:       Product.products,
            channels:       Product.channels,
            productTypes:   Product.productTypes,

            metadataKeys: metadataKeys,
            metadataCategories: [
                metadataKeys.categories.AppQuestions,
                metadataKeys.categories.GeneralBusinessRules,
                metadataKeys.categories.LabRules,
                metadataKeys.categories.LabsNormalPoint,
                metadataKeys.categories.PreferredCreditPoints,
                metadataKeys.categories.UnderwritingRules,
                metadataKeys.categories.Workflow
            ],
            languages: languageCodes,

            ssnTable:  {
                1951:[3600,14.89],
                1952:[3600,14.02],
                1953:[3600,13.27],
                1954:[3600,13.21],
                1955:[4200,12.62],
                1956:[4200,11.80],
                1957:[4200,11.44],
                1958:[4200,11.34],
                1959:[4800,10.81],
                1960:[4800,10.40],
                1961:[4800,10.20],
                1962:[4800,9.71],
                1963:[4800,9.48],
                1964:[4800,9.11],
                1965:[4800,8.95],
                1966:[6600,8.44],
                1967:[6600,7.99],
                1968:[7800,7.48],
                1969:[7800,7.07],
                1970:[7800,6.74],
                1971:[7800,6.41],
                1972:[9000,5.84],
                1973:[10800,5.50],
                1974:[13200,5.19],
                1975:[14100,4.83],
                1976:[15300,4.52],
                1977:[16500,4.26],
                1978:[17700,3.95],
                1979:[22900,3.63],
                1980:[25900,3.33],
                1981:[29700,3.03],
                1982:[32400,2.87],
                1983:[35700,2.73],
                1984:[37800,2.58],
                1985:[39600,2.48],
                1986:[42000,2.41],
                1987:[43800,2.26],
                1988:[45000,2.16],
                1989:[48000,2.07],
                1990:[51300,1.98],
                1991:[53400,1.91],
                1992:[55500,1.82],
                1993:[57600,1.80],
                1994:[60600,1.75],
                1995:[61200,1.69],
                1996:[62700,1.61],
                1997:[65400,1.52],
                1998:[68400,1.44],
                1999:[72600,1.37],
                2000:[76200,1.30],
                2001:[80400,1.27],
                2002:[84900,1.25],
                2003:[87000,1.22],
                2004:[87900,1.17],
                2005:[90000,1.13],
                2006:[94200,1.08],
                2007:[97500,1.03],
                2008:[102000,1.01],
                2009:[106800,1.02],
                2010:[106800,1.00],
                2011:[106800,1.00],
                2012:[106800,1.00],
                2013:[106800,1.00],
                2014:[106800,1.00],
                2015:[106800,1.00]
            },
            requiredWithdrawls: {
                0:82.4, 1:81.6, 2:80.6, 3:79.7, 4:78.7, 5:77.7, 6:76.7, 7:75.8, 8:74.8, 9:73.8,
                10:72.8, 11:71.8, 12:70.8, 13:69.9, 14:68.9, 15:67.9, 16:66.9, 17:66, 18:65, 19:64,
                20:63, 21:62.1, 22:61.1, 23:60.1, 24:59.1, 25:58.2, 26:57.2, 27:56.2, 28:55.3, 29:54.3,
                30:53.3, 31:52.4, 32:51.4, 33:50.4, 34:49.4, 35:48.5, 36:47.5, 37:46.5, 38:45.6, 39:44.6,
                40:43.6, 41:42.7, 42:41.7, 43:40.7, 44:39.8, 45:38.8, 46:37.9, 47:37, 48:36, 49:35.1,
                50:34.2, 51:33.3, 52:32.3, 53:31.4, 54:30.5, 55:29.6, 56:28.7, 57:27.9, 58:27, 59:26.1,
                60:25.2, 61:24.4, 62:23.5, 63:22.7, 64:21.8, 65:21, 66:20.2, 67:19.4, 68:18.6, 69:17.8,
                70:17, 71:16.3, 72:15.5, 73:14.8, 74:14.1, 75:13.4, 76:12.7, 77:12.1, 78:11.4, 79:10.8,
                80:10.2, 81:9.7, 82:9.1, 83:8.6, 84:8.1, 85:7.6, 86:7.1, 87:6.7, 88:6.3, 89:5.9,
                90:5.5, 91:5.2, 92:4.9, 93:4.6, 94:4.3, 95:4.1, 96:3.8, 97:3.6, 98:3.4, 99:3.1,
                100:2.9, 101:2.7, 102:2.5, 103:2.3, 104:2.1, 105:1.9, 106:1.7, 107:1.5, 108:1.4, 109:1.2, 110:1.1
            },
            collegeCosts: {
                community2yr: {tuition: 2963,  period: 2, books: 1182, board: 7408, living:3733, incomeThreshold: 0,
                               name: "community college"},
                inState4yr:   {tuition: 8244,  period: 4, books: 1168, board: 8887, living:3148, incomeThreshold: 50000,
                               name: "in-state college"},
                outState4yr:  {tuition: 20770, period: 4, books: 1168, board: 8887, living:3148, incomeThreshold: 100000,
                               name: "out-of-state college"},
                private4yr:   {tuition: 28500, period: 4, books: 1213, board:10089, living:2422, incomeThreshold: 150000,
                               name: "private college"}
            },
            stateCode :	{AL: 1, AK: 2, AZ: 3, AR: 4, CA: 5, CO: 6, CT: 7, DE: 8, DC: 9, FL: 10, GA: 11, HI: 12,
                ID: 13, IL: 14, IN: 15, IA: 16, KS: 17, KY: 18, LA: 19,	ME: 20, MD: 21, MA: 22, MI: 23, MN: 24,
                MO: 26, MS: 25, MT: 27, NE: 28, NV: 29, NH: 30, NJ: 31, NM: 32, NY: 52,	NC: 34, ND: 35, OH: 36,
                OK: 37, OR: 38, PA: 39,	PR: 54, RI: 40, SC: 41, SD: 42, TN: 43, TX: 44, UT: 45,
                VT: 46, VA: 47, WA: 48, WV: 49, WI: 50, WY: 51},
            stateValues : 	{AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
                CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii',
                ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
                MS:'Mississippi', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
                MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
                NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
                OR: 'Oregon', PA: 'Pennsylvania', PR: 'Puerto Rico', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
                TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
                WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'},
            countryValues: {AF:"Afghanistan",	AX:"Åland Islands",		AL:"Albania",DZ:"Algeria",AS:"American Samoa",AD:"Andorra",AO:"Angola",AI:"Anguilla",AQ:"Antarctica",AG:"Antigua and Barbuda",AR:"Argentina",AM:"Armenia",AW:"Aruba",AU:"Australia",AT:"Austria",AZ:"Azerbaijan",BS:"Bahamas",BH:"Bahrain",BD:"Bangladesh",BB:"Barbados",BY:"Belarus",BE:"Belgium",BZ:"Belize",BJ:"Benin",BM:"Bermuda",BT:"Bhutan",BO:"Bolivia",BA:"Bosnia and Herzegovina",BW:"Botswana",BV:"Bouvet Island",BR:"Brazil",IO:"British Indian Ocean Territory",BN:"Brunei Darussalam",BG:"Bulgaria",BF:"Burkina Faso",BI:"Burundi",KH:"Cambodia",CM:"Cameroon",CA:"Canada",CV:"Cape Verde",KY:"Cayman Islands",CF:"Central African Republic",TD:"Chad",CL:"Chile",CN:"China",CX:"Christmas Island",CC:"Cocos (Keeling) Islands",CO:"Colombia",KM:"Comoros",CG:"Congo",CD:"Congo, The Democratic Republic of The",CK:"Cook Islands",CR:"Costa Rica",CI:"Cote D'ivoire",HR:"Croatia",CU:"Cuba",CY:"Cyprus",CZ:"Czech Republic",DK:"Denmark",DJ:"Djibouti",DM:"Dominica",DO:"Dominican Republic",EC:"Ecuador",EG:"Egypt",SV:"El Salvador",GQ:"Equatorial Guinea",ER:"Eritrea",EE:"Estonia",ET:"Ethiopia",FK:"Falkland Islands (Malvinas)",FO:"Faroe Islands",FJ:"Fiji",FI:"Finland",FR:"France",GF:"French Guiana",PF:"French Polynesia",TF:"French Southern Territories",GA:"Gabon",GM:"Gambia",GE:"Georgia",DE:"Germany",GH:"Ghana",GI:"Gibraltar",GR:"Greece",GL:"Greenland",GD:"Grenada",GP:"Guadeloupe",GU:"Guam",GT:"Guatemala",GG:"Guernsey",GN:"Guinea",GW:"Guinea-bissau",GY:"Guyana",HT:"Haiti",HM:"Heard Island and Mcdonald Islands",VA:"Holy See (Vatican City State)",HN:"Honduras",HK:"Hong Kong",HU:"Hungary",IS:"Iceland",IN:"India",ID:"Indonesia",IR:"Iran, Islamic Republic of",IQ:"Iraq",IE:"Ireland",IM:"Isle of Man",IL:"Israel",IT:"Italy",JM:"Jamaica",JP:"Japan",JE:"Jersey",JO:"Jordan",KZ:"Kazakhstan",KE:"Kenya",KI:"Kiribati",KP:"Korea, Democratic People's Republic of",KR:"Korea, Republic of",KW:"Kuwait",KG:"Kyrgyzstan",LA:"Lao People's Democratic Republic",LV:"Latvia",LB:"Lebanon",LS:"Lesotho",LR:"Liberia",LY:"Libyan Arab Jamahiriya",LI:"Liechtenstein",LT:"Lithuania",LU:"Luxembourg",MO:"Macao",MK:"Macedonia, The Former Yugoslav Republic of",MG:"Madagascar",MW:"Malawi",MY:"Malaysia",MV:"Maldives",ML:"Mali",MT:"Malta",MH:"Marshall Islands",MQ:"Martinique",MR:"Mauritania",MU:"Mauritius",YT:"Mayotte",MX:"Mexico",FM:"Micronesia, Federated States of",MD:"Moldova, Republic of",MC:"Monaco",MN:"Mongolia",ME:"Montenegro",MS:"Montserrat",MA:"Morocco",MZ:"Mozambique",MM:"Myanmar",NA:"Namibia",NR:"Nauru",NP:"Nepal",NL:"Netherlands",AN:"Netherlands Antilles",NC:"New Caledonia",NZ:"New Zealand",NI:"Nicaragua",NE:"Niger",NG:"Nigeria",NU:"Niue",NF:"Norfolk Island",MP:"Northern Mariana Islands",NO:"Norway",OM:"Oman",PK:"Pakistan",PW:"Palau",PS:"Palestinian Territory, Occupied",PA:"Panama",PG:"Papua New Guinea",PY:"Paraguay",PE:"Peru",PH:"Philippines",PN:"Pitcairn",PL:"Poland",PT:"Portugal",PR:"Puerto Rico",QA:"Qatar",RE:"Reunion",RO:"Romania",RU:"Russian Federation",RW:"Rwanda",SH:"Saint Helena",KN:"Saint Kitts and Nevis",LC:"Saint Lucia",PM:"Saint Pierre and Miquelon",VC:"Saint Vincent and The Grenadines",WS:"Samoa",SM:"San Marino",ST:"Sao Tome and Principe",SA:"Saudi Arabia",SN:"Senegal",RS:"Serbia",SC:"Seychelles",SL:"Sierra Leone",SG:"Singapore",SK:"Slovakia",SI:"Slovenia",SB:"Solomon Islands",SO:"Somalia",ZA:"South Africa",GS:"South Georgia and The South Sandwich Islands",ES:"Spain",LK:"Sri Lanka",SD:"Sudan",SR:"Suriname",SJ:"Svalbard and Jan Mayen",SZ:"Swaziland",SE:"Sweden",CH:"Switzerland",SY:"Syrian Arab Republic",TW:"Taiwan, Province of China",TJ:"Tajikistan",TZ:"Tanzania, United Republic of",TH:"Thailand",TL:"Timor-leste",TG:"Togo",TK:"Tokelau",TO:"Tonga",TT:"Trinidad and Tobago",TN:"Tunisia",TR:"Turkey",TM:"Turkmenistan",TC:"Turks and Caicos Islands",TV:"Tuvalu",UG:"Uganda",UA:"Ukraine",AE:"United Arab Emirates",GB:"United Kingdom",US:"United States",UM:"United States Minor Outlying Islands",UY:"Uruguay",UZ:"Uzbekistan",VU:"Vanuatu",VE:"Venezuela",VN:"Viet Nam",VG:"Virgin Islands, British",VI:"Virgin Islands, U.S.",WF:"Wallis and Futuna",EH:"Western Sahara",YE:"Yemen",ZM:"Zambia",ZW:"Zimbabwe"},
            // Very vaguely inspired by http://www.naccrra.org/sites/default/files/default_site_pages/2012/cost_report_2012_final_081012_0.pdf
            childCareCosts: [
                {minAge: 0, maxAge: 5, range: {low: 7000, medium: 9000, high: 13000}},
                {minAge: 6, maxAge: 14, range: {low: 4000, medium: 6500, high: 10000}}
            ],
            childCareCostStates: {
                    AL: "medium", AK: "medium", AZ: "medium", AR: "medium", CA: "medium", CO: "high", CT: "medium",
                    DE: "medium", DC: "medium", FL: "medium", GA: "medium", HI: "medium", ID: "medium", IL: "medium",
                    IN: "high", IA: "medium", KS: "high", KY: "medium", LA: "medium", ME: "high", MD: "medium",
                    MA: "high", MI: "medium", MN: "high",   MO: "medium", MS: "medium", MT: "medium", NE: "medium",
                    NV: "medium", NH: "medium", NJ: "medium", NM: "medium", NY: "high",   NC: "medium", ND: "medium",
                    OH: "medium", OK: "medium", OR: "high",   PA: "medium",	RI: "high", SC: "medium", SD: "medium",
                    TN: "medium", TX: "medium", UT: "medium", VT: "high", VA: "medium", WA: "medium", WV: "medium",
                    WI: "high",   WY: "medium"
            },
            healthCareCosts: {
                AL: [3000,6000], AK: [3000,6000], AZ: [2961,5292], AR: [3000,6000], CA: [2943,6567],
                CO: [2777,5939], CT: [3503,8477], DE: [3000,6000], DC: [3000,6000], FL: [3191,6527],
                GA: [3228,7408], HI: [3000,6000], ID: [3000,6000], IL: [2843,6317],	IN: [2930,6236],
                IA: [3000,6000], KS: [3000,6000], KY: [2740,5980], LA: [3000,6000], ME: [4061,7260],
                MD: [3000,6000], MA: [5142, 12388], MI: [3000,6000], MN: [2978,7013], MO: [2725,5657],
                MS: [3000,6000], MT: [3305,5968], NE: [2950,5979], NV: [3276,6119], NH: [3427,7672],
                NJ: [3000,6000], NM: [3000,6000], NY: [6630, 13296], NC: [3000,6000], ND: [3000,6000],
                OH: [2772,5701], OK: [3220,6128], OR: [3000,6000], PA: [2873,6381],	RI: [4779,11107],
                SC: [3204,6128], SD: [3000,6000], TN: [3150,5957], TX: [3208,6459], UT: [3000,6000],
                VT: [3000,6000], VA: [3229,6383], WA: [3000,6000], WV: [3000,6000], WI: [3000,6000],
                WY: [3000,6000]
            },
            drivingViolationTypes: {
                ACCI: 'Accident', DISQ: 'Disqualification', REIN: 'License Reinstated', REVO: 'Revocation',
                SUSP: 'Suspension', CANC: 'Cancellation', CONV: 'Conviction', DEPT: 'Departmental Action',
                'F/R': 'Finanacial Responsibility', MISC: 'Miscellaneous', PROB: 'Probation', VIOL: 'Violation',
                WARN: 'Warning', UNCL: 'Unclassified'
            },
            standardViolationClass: {
                00000: 'Uncategorized Citation or Assigned from MVR Status or Conditions',
                10000: 'Registration, Titling and Licensing',
                20000: 'Financial Responsibility and Accidents',
                30000: 'Moving Violations',
                40000: 'Motorcycle Violations',
                50000: 'Serious Offenses (including Serious Moving Violations)',
                60000: 'Equipment Violations',
                70000: 'Parking Violations',
                80000: 'Miscellaneous'
            },
            quantitativeLabTestCodes: {
                '4': 'Blood Profile (Glycohemoblogin) - for testing diabetes',
                '34': 'Blood Analysis - for Cholesterol',
                '35': 'Blood Analysis - for Creatinine',
                '43': 'Blood Analysis - for SGOT',
                '44': 'Blood Analysis - for SGPT',
                '47': 'Blood Analysis - Triglycerides',
                '543': 'Blood HDL',
                '544': 'Blood BUN',
                '548': 'Blood LDL/HDL Ratio',
                '558': 'Blood Fructosamine',
                '562': 'Urine Hyaline Casts',
                '574': 'Urine Granular Casts',
                '576': 'Urine RBC',
                '577': 'Urine WBC',
                '587': 'Urine Total Protein',
                '607': 'Urine Creatinine',
                '621': 'Blood Albumin',
                '622': 'Blood Total Protein',
                '626': 'Blood Total Bilirubin',
                '627': 'Blood Alkaline Phosphatase',
                '636': 'Blood GGT',
                '1003800704': 'Blood Glucose',
                '1003800705': 'Blood Globulin (Total Protein minus Albumin)',
                '1003800706': 'Blood Cholesterol/HDL Cholesterol',
                '1003800707': 'Blood LDL Cholesterol',
                '1003800730': 'Blood PSA- Prostate Specific Antigen (Equal Molar)',
                '1003800763': 'Urine Microalbumin',
                '1003800788': 'Urine Temperature'
            },
            qualitativeLabTestCodes: {
                '546': 'Blood CDT',
                '561': 'Urine Cotinine',
                '563': 'Urine Leukocyte Esterase',
                '567': 'Blood Anti-HVC',
                '592': 'Blood Alcohol',
                '601': 'Urine Glucose',
                '606': 'Urine Blood Content',
                '1003800722': 'Blood Serum HIV Interpretation',
                '1003800758': 'Urine DIU- Diuretic Screen',
                '1003800760': 'Urine Cocaine'
            },
            measurementUnits: {
                '1': '%',
                '6': 'Degrees Fahrenheit',
                '8': 'HPF',
                '9': 'LPF',
                '19': 'U/L',
                '24': 'g%',
                '25': 'g/dL',
                '37': 'mg%',
                '40': 'mg/dL',
                '47': 'mmol/L',
                '63': 'ug/mL',
                '83': 'ng/mL'
            },
            acordBoolean: {'0': 'False', '1': 'True'},
            labResultCodes: {'1': 'Positive', '2': 'Negative'},
            instantIdNASCodes: {
                '0': 'Nothing found for input criteria.',
                '1': 'Input SSN is associated with a different name and address.',
                '2': 'Input First name and Last name matched.',
                '3': 'Input First name and Address matched.',
                '4': 'Input First name and SSN matched.',
                '5': 'Input Last name and Address matched.',
                '6': 'Input Address and SSN matched.',
                '7': 'Input Last name and SSN matched.',
                '8': 'Input First name, Last name and Address matched.',
                '9': 'Input First name, Last name and SSN matched.',
                '10': 'Input First name, Address and SSN matched.',
                '11': 'Input Last name, Address and SSN matched.',
                '12': 'Input First name, Last name, Address and SSN matched.'
            },
            instantIdRiskCodes: {
                '2': 'The input SSN is reported as deceased',
                '3': 'The input SSN was issued prior to the input date-of-birth',
                '6': 'The input SSN is invalid',
                '19': 'Unable to verify name, address, SSN/TIN and phone',
                '26': 'Unable to verify SSN / TIN',
                '28': 'Unable to verify date-of-birth',
                '32': 'The input name matches the Watch List file',
                '50': 'The input address matches a prison address',
                '71': 'The input SSN is not found in the public record',
                '72': 'The input SSN is associated with a different name and address',
                '77': 'The input name was missing',
                '81': 'The input date-of-birth was missing or incomplete',
                '85': 'The input SSN was issued to a non-US citizen',
                'CA': 'The primary input address is a Commercial Mail Receiving Agency',
                'DI': 'The input identity is reported as deceased',
                'IS': 'Input SSN possibly randomly issued by SSA, but invalid when first associated with the input identity',
                'MI': 'Multiple identities associated with input social',
                'MS': 'Multiple SSNs reported with applicant',
                'NB': 'No date-of-birth reported for the input identity',
                'VA': 'The input address is a vacant address',
                '29': 'The input SSN/TIN may have been miskeyed',
                '76': 'The input name may have been miskeyed',
                '83': 'The input date-of-birth may have been miskeyed',
                'CL': 'The input SSN is not the primary SSN for the input identity',
                'IT': 'The input SSN is an TIN',
                'WL': 'The input name matches one or more of the non-OFAC global watchlist(s)'
            },
            instantIdWatchListCodes: {
                'OFAC': 'OFFICE OF FOREIGN ASSET CONTROL',
                'FBI': 'FBI FUGITIVES 10 MOST WANTED'
            },
            mibRuleCodes: {
                '3001': 'Red priority MIB code has appeared',
                '3043': 'ECG Sub-Code 8D',
                '3044': 'ECG Sub-Code 18'
            },
            faceUnitSize: 1000,
            maxIdCheckAttempts: 3,
            maxDrivingRecordAttempts: 3,
            progressById: {
                1: 'Needs',
                2: 'Quotes',
                10: 'ApplyIntro',
                11: 'ApplicationRegisterLogin',
                12: 'ApplicationFill',
                13: 'ApplicationSubmitted'
            },
            progress: {
                Needs: 1,
                Quotes: 2,
                ApplyIntro: 10,
                ApplicationRegisterLogin: 11,
                ApplicationFill: 12,
                ApplicationSubmitted:  13
            },
            policyStatus: {
                issued: "Issued", active: "Active", lapsePending: "LapsePending", lapsed: "Lapsed", notTaken: "NotTaken",
                canceled: "Canceled", freeLooked: "FreeLooked", rescinded: "Rescinded"
            },
            addressType: {
                home: { code: '1', desc: 'Home' },
                business: { code: '2', desc: 'Business' },
                mailing: { code: '17', desc: 'Mailing' }
            },
            allCountries: [ 'Afghanistan','Albania','Algeria','American Samoa','Andorra','Angola','Anguilla','Antigua and Barbuda','Argentina','Armenia','Aruba','Australia','Austria','Azerbaijan','Azores','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bermuda','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei Darussalam','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Canary Islands','Cape Verde','Cayman Islands','Central African Republic','Chad','Chechnya','Chile','China','Colombia','Comoros','Congo','Cook Islands','Costa Rica','Côte D\'Ivoire','Croatia','Cuba','Curacao','Cyprus','Czech Republic','Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Ethiopia','Falkland Islands','Fiji','Finland','France','French Guiana','French Polynesia','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Greenland','Grenada','Guadeloupe','Guatemala','Guinea','Guinea Bissau','Guyana','Haiti','Holland','Honduras','Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel (excluding Gaza and West Bank)','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Macau','Macedonia','Madagascar','Madeira','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Martinique','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Montserrat','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','Netherlands Antilles','New Caledonia','New Zealand','Nicaragua','Niger','Nigeria','Niue','North Korea','Northern Ireland','Northern Mariana Islands','Norway','Oman','Pakistan','Palau','Palestine (Gaza or the West Bank)','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia (excluding Chechnya)','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Martin','Saint Thomas','Saint Vincent and the Grenadines','Saipan','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South ‎Sudan','Spain','Sri Lanka','Sudan','Suriname','Suriname','Swaziland','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Turks and Caicos','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','Uruguay','Uzbekistan','Vanuatu','Venezuela','Vietnam','Virgin Islands','Yemen','Yugoslavia','Zambia','Zimbabwe' ],
            aRatedCountries: [ 'Albania','American Samoa','Andorra','Anguilla','Antigua and Barbuda','Argentina','Aruba','Australia','Austria','Azores','Barbados','Belgium','Bermuda','Bosnia and Herzegovina','Brunei Darussalam','Bulgaria','Canada','Canary Islands','Cayman Islands','Chile','Cook Islands','Croatia','Curacao','Cyprus','Czech Republic','Denmark','Dominica','Estonia','Falkland Islands','Finland','France','French Polynesia','Germany','Greece','Greenland','Grenada','Guadeloupe','Holland','Hong Kong','Hungary','Iceland','Ireland','Israel (excluding Gaza and West Bank)','Italy','Japan','South Korea','Kuwait','Latvia','Liechtenstein','Lithuania','Luxembourg','Macau','Macedonia','Madeira','Malta','Marshall Islands','Martinique','Monaco','Montenegro','Montserrat','Netherlands','Netherlands Antilles','New Caledonia','New Zealand','Northern Ireland','Northern Mariana Islands','Norway','Palau','Poland','Portugal','Qatar','Romania','Saipan','San Marino','Serbia','Singapore','Slovakia','Slovenia','Spain','Saint Kitts and Nevis','Saint Lucia','Saint Martin','Saint Thomas','Saint Vincent and the Grenadines','Sweden','Switzerland','Taiwan','Turks and Caicos','United Arab Emirates','United Kingdom','Uruguay','Virgin Islands'],
            bRatedCountries: [ 'Armenia','Azerbaijan','Bahamas','Belarus','Bhutan','Brazil','Cape Verde','China','Costa Rica','Ecuador','Micronesia','Fiji','French Guiana','Georgia','Jamaica','Jordan','Kazakhstan','Kosovo','Maldives','Mauritius','Mexico','Micronesia','Mexico','Moldova','Mongolia','Niue','Oman','Panama','Paraguay','Peru','Russia (excluding Chechnya)','Samoa','Seychelles','Suriname','Tonga','Trinidad and Tobago','Turkey','Ukraine','Yugoslavia'],
            mexicoRatedPlaces: ["Cabo San Lucas","Manzanillo","Quintana Roo","Acapulco","Puerto Vallarta","Mexico City","Guanajuato (including Leon)","Monterrey","Cancun","San Jose del Cabo","Playa del Carmen","Puerto Escondido","Cozumel","Guadalajara","Other"],
            cRatedCountries: ['Bangladesh', 'Belize', 'Bolivia', 'Botswana', 'Comoros', 'Dominican Republic', 'El Salvador', 'Guatemala', 'Guyana', 'Honduras', 'India', 'Indonesia', 'Kiribati', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Morocco', 'Namibia', 'Nauru', 'Nepal', 'Nicaragua', 'Philippines', 'Saudi Arabia', 'Solomon Islands', 'South Africa', 'Sri Lanka', 'Tajikistan', 'Thailand', 'Turkmenistan', 'Tuvalu', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam'],

            // Date Calculations
            gracePeriodDays: 35,
            freeLookPeriodDays: 10,
            reinstatmentPeriodYrs: 3,
            TLICParamedDays: 90,
            MUWParamedDays: 30,
            refundDays: 10,
            verifyEligibilityDays: 7,
            TLICConfirmDays: 3,
            appConfirmDays: 3,
            appDataFixDays: 7,
            signatureDays: 7,
            policyConfirmDays: 15,
            autoIssueEffAfterDays: 5,
            ranOutOfDaysForUWWithTLIC: 120,
            ranOutOfDaysForUWWithoutTLIC: 75,
            emailToFixAppDataMins: 3,
            emailUWDecisionMins: 3,
            emailToConfirmInitialUwResultDays: 1,
            emailToConfirmPolicyIssueDays: 3,
            emailToSignApplicationDays: 2,
            emailSaveAgeNotificationDays: 1,
            emailToScheduleParamedDays: 5,
            emailCoverageNotInforceDays: 5,
            millimanDataIntervalSecs: 15,
            activityRetryIntervalSecs: 5,
            activityMaxRetryAttempts: 10,
            cutoffTime: {hr: 0, min: 0} // Midnight GMT time
        };

	return {
		Assumptions: _.extend(Assumptions, ChannelAssumptions)
	}
};
