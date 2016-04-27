module.exports.Applicant = function (objectTemplate, getTemplate) {

	var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
	var Person = getTemplate('./customer/Person.js').Person;
	var PersonQuery = getTemplate('./customer/Person.js').PersonQuery;
	var Phone = getTemplate('./customer/Person.js').Phone;
	var Entity = getTemplate('./customer/Person.js').Entity;
	var Address = getTemplate('./customer/Person.js').Address;
	var Beneficiary = getTemplate('./customer/Person.js').Beneficiary;
	var Utils = getTemplate('./Utils.js').Utils;

    /*Generated code*/
    var FamilyHistory = objectTemplate.create('FamilyHistory', {});
    var FamilyCondition = objectTemplate.create('FamilyCondition', {});
    var PersonalHistory = objectTemplate.create('PersonalHistory', {});
    var DiagnosisShort = objectTemplate.create('DiagnosisShort', {});
    var RX = objectTemplate.create('RX', {});
    var Diagnosis = objectTemplate.create('Diagnosis', {});
    var Surgery = objectTemplate.create('Surgery', {});
    var RiskFactors = objectTemplate.create('RiskFactors', {});
    var Avocation = objectTemplate.create('Avocation', {});
    var AccidentAtFault = objectTemplate.create('AccidentAtFault', {});
    var SpeedingTicket = objectTemplate.create('SpeedingTicket', {});
    var RecklessTicket = objectTemplate.create('RecklessTicket', {});
    var OtherMovingViolation = objectTemplate.create('OtherMovingViolation', {});
    var DrivingWhileSuspendedCon = objectTemplate.create('DrivingWhileSuspendedCon', {});
    var TravelCountry = objectTemplate.create('TravelCountry', {});
    var ExistingPolicies = objectTemplate.create('ExistingPolicies', {});
    var ExistingPolicy = objectTemplate.create('ExistingPolicy', {});

    FamilyHistory.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                motherLiving: {type: String, value: null, rule: ["required"]},
                motherLivingValues: {type: Array, isLocal: true, value: ['isalive', 'deceased', 'unknown']},
                motherLivingDescriptions: {type: Object, isLocal: true, value: {'isalive': '__ years old', 'deceased': 'Deceased', 'unknown': 'Unknown'}},
                motherDiedAt: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 100)"},
                motherDiedOf: {type: String, value: null, rule: ["required"]},
                motherDiedOfValues: {type: Array, isLocal: true, value: ['BreastorOvarianCancer', 'SkinCancer', 'OtherCancers', 'HeartDisease', 'KidneyDisease', 'Other']},
                motherDiedOfDescriptions: {type: Object, isLocal: true, value: {'BreastorOvarianCancer': 'Breast or Ovarian Cancer', 'SkinCancer': 'Skin Cancer', 'OtherCancers': 'Other Cancers', 'HeartDisease': 'Heart Disease', 'KidneyDisease': 'Kidney Disease', 'Other': 'Other'}},
                fatherLiving: {type: String, value: null, rule: ["required"]},
                fatherLivingValues: {type: Array, isLocal: true, value: ['isalive', 'deceased', 'unknown']},
                fatherLivingDescriptions: {type: Object, isLocal: true, value: {'isalive': '__ years old', 'deceased': 'Deceased', 'unknown': 'Unknown'}},
                fatherDiedAt: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 100)"},
                fatherDiedOf: {type: String, value: null, rule: ["required"]},
                fatherDiedOfValues: {type: Array, isLocal: true, value: ['ProstateCancer', 'BreastCancer', 'SkinCancer', 'OtherCancers', 'HeartDisease', 'KidneyDisease', 'Other']},
                fatherDiedOfDescriptions: {type: Object, isLocal: true, value: {'ProstateCancer': 'Prostate Cancer', 'BreastCancer': 'Breast Cancer', 'SkinCancer': 'Skin Cancer', 'OtherCancers': 'Other Cancers', 'HeartDisease': 'Heart Disease', 'KidneyDisease': 'Kidney Disease', 'Other': 'Other'}},
                brothersLiving: {type: String, value: null, rule: ["required"]},
                brothersLivingValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'Nobiologicalbrothers', 'Unknown']},
                brothersLivingDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'Nobiologicalbrothers': 'No biological brothers', 'Unknown': 'Unknown'}},
                sistersLiving: {type: String, value: null, rule: ["required"]},
                sistersLivingValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'Nobiologicalsisters', 'Unknown']},
                sistersLivingDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'Nobiologicalsisters': 'No biological sisters', 'Unknown': 'Unknown'}},
                hasConditions: {type: String, value: null, rule: ["required"]},
                hasConditionsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.familyHistory.hasConditions ===  'Yes') {
                        if(controller.customer.applicationPolicy.insured.familyHistory.familyConditions.length === 0) {
                            controller.customer.applicationPolicy.insured.familyHistory.familyConditions.push(new FamilyCondition(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.familyHistory.familyConditions = [];
                    }
                },
                hasConditionsValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'Unknown']},
                hasConditionsDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'Unknown': 'Unknown'}},
                familyConditions: {type: Array, of: FamilyCondition, value: []},
                hadSeriousCondition: {type: String, value: null, rule: ["required"]},
                hadSeriousConditionValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'Unknown']},
                hadSeriousConditionDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'Unknown': 'Unknown'}}
            });

    FamilyCondition.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                familyHistory: {type: FamilyHistory},
                member: {type: String, value: null, rule: ["required"]},
                memberValues: function() {
                    var arr = ['Mother', 'Father'];
                    if (this.customer.applicationPolicy.insured.familyHistory.brothersLiving !== 'Nobiologicalbrothers') {
                        arr.push('Brother');
                    }
                    if (this.customer.applicationPolicy.insured.familyHistory.sistersLiving !== 'Nobiologicalsisters') {
                        arr.push('Sister');
                    }
                    return arr;
                },
                memberDescriptions: {type: Object, isLocal: true, value: {'Mother': 'Mother', 'Father': 'Father', 'Brother': 'Brother', 'Sister': 'Sister'}},
                condition: {type: String, value: null, rule: ["required"]},
                conditionValues: {type: Array, isLocal: true, value: ['Cancer', 'HeartDisease', 'Diabetes', 'KidneyDisease']},
                conditionDescriptions: {type: Object, isLocal: true, value: {'Cancer': 'Cancer', 'HeartDisease': 'Heart Disease', 'Diabetes': 'Diabetes', 'KidneyDisease': 'Kidney Disease'}},
                ageAtOnset: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 100)"},
                type: {type: String, value: null, rule: ["required"]},
                typeValues: {type: Array, isLocal: true, value: ['ProstateCancer', 'BreastCancer', 'OvarianCancer', 'Melanoma', 'SkinCancer(non-Melanoma)', 'OtherCancer', 'NotSure']},
                typeDescriptions: {type: Object, isLocal: true, value: {'ProstateCancer': 'Prostate Cancer', 'BreastCancer': 'Breast Cancer', 'OvarianCancer': 'Ovarian Cancer', 'Melanoma': 'Melanoma', 'SkinCancer(non-Melanoma)': 'Skin Cancer (non-Melanoma)', 'OtherCancer': 'Other Cancer', 'NotSure': 'Not Sure'}}
            });

    PersonalHistory.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                primaryPhysician: {type: Boolean, value: null, rule: ["required"]},
                primaryPhysicianValues: {type: Array, isLocal: true, value: ['true', 'false']},
                primaryPhysicianDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                primaryPhysicianName: {type: String, rule: ["required"], validate: "isNotEmptyAndMinLength(2)"},
                primaryPhysicianCity: {type: String, rule: ["required"], validate: "isNotEmptyAndMinLength(2); isMaxLength(86)"},
                primaryPhysicianState: {type: String, rule: ["required"]},
                primaryPhysicianPhone: {type: String, rule: ["required", "telephone"]},
                primaryPhysicianLastVisitWhen: {type: String, value: null, rule: ["required"]},
                primaryPhysicianLastVisitWhenValues: {type: Array, isLocal: true, value: ['lastvisit', 'unknown']},
                primaryPhysicianLastVisitWhenDescriptions: {type: Object, isLocal: true, value: {'lastvisit': '__ Date', 'unknown': 'Unknown'}},
                hadHeartCondition: {type: Boolean, value: false},
                hadHCAttack: {type: Boolean, value: false},
                hadHCAttackTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadHCAttack === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadHCAttackDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadHCAttackDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadHCAttackDiagnosis =  null;
                    }
                },
                hadHCAttackDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadHCAbnormalBeat: {type: Boolean, value: false},
                hadHCAbnormalBeatTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadHCAbnormalBeat === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadHCAbnormalBeatDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadHCAbnormalBeatDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadHCAbnormalBeatDiagnosis =  null;
                    }
                },
                hadHCABFibrillation: {type: Boolean, value: null, rule: ["required"]},
                hadHCABFibrillationValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCABFibrillationDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadHCABFTreatment: {type: Boolean, value: null, rule: ["required"]},
                hadHCABFTreatmentValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCABFTreatmentDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadHCABFTFainted: {type: Boolean, value: null, rule: ["required"]},
                hadHCABFTFaintedValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCABFTFaintedDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadHCAbnormalBeatDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadHCHypertension: {type: Boolean, value: false},
                hadHCHMedication: {type: Boolean, value: null, rule: ["required"]},
                hadHCHMedicationTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadHCHMedication) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.medsHCH.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.medsHCH.push(new RX(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.medsHCH = [];
                    }
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadHCHMedication === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadHCHMedicationDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadHCHMedicationDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadHCHMedicationDiagnosis =  null;
                    }
                },
                hadHCHMedicationValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCHMedicationDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                medsHCH: {type: Array, of: RX, value: []},
                hadHCHMedicationDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                bpMeasurements: {type: Boolean, value: null, rule: ["required"]},
                bpMeasurementsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                bpMeasurementsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                systolic: {type: Number, rule: ["required", "numeric"], validate: "isWithin(80, 200)"},
                diastolic: {type: Number, rule: ["required", "numeric"], validate: "isWithin(80, 200)"},
                hadHCMurmur: {type: Boolean, value: false},
                hadHCMurmurTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadHCMurmur === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadHCMurmurDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadHCMurmurDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadHCMurmurDiagnosis =  null;
                    }
                },
                hadHCMAdviseECG: {type: Boolean, value: null, rule: ["required"]},
                hadHCMAdviseECGValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCMAdviseECGDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadHCMAdviseSurgery: {type: Boolean, value: null, rule: ["required"]},
                hadHCMAdviseSurgeryValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCMAdviseSurgeryDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadHCMAdviseMeds: {type: Boolean, value: null, rule: ["required"]},
                hadHCMAdviseMedsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCMAdviseMedsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadHCMurmurDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadHCPericarditis: {type: Boolean, value: false},
                hadHCPericarditisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadHCPericarditis === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadHCPericarditisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadHCPericarditisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadHCPericarditisDiagnosis =  null;
                    }
                },
                hadHCPMultipleEpisodes: {type: Boolean, value: null, rule: ["required"]},
                hadHCPMultipleEpisodesValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCPMultipleEpisodesDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadHCPFullyRecovered: {type: String, value: null, rule: ["required"]},
                hadHCPFullyRecoveredValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadHCPFullyRecoveredDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadHCPericarditisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadHCBenign: {type: Boolean, value: false},
                hadHCOther: {type: Boolean, value: false},
                hadHCOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadHCOther) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadHCOtherDiagnosis.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadHCOtherDiagnosis.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadHCOtherDiagnosis = [];
                    }
                },
                hadHCOtherDiagnosis: {type: Array, of: Diagnosis, value: []},
                hadHighCholesterol: {type: Boolean, value: false},
                hadHCElevatedNow: {type: Boolean, value: null, rule: ["required"]},
                hadHCElevatedNowValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCElevatedNowDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadHCKnowLevels: {type: Boolean, value: null, rule: ["required"]},
                hadHCKnowLevelsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHCKnowLevelsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                cholesterolTotal: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 500)"},
                cholesterolHDL: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 200)"},
                hadCancer: {type: Boolean, value: false},
                hadCancerTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadCancer === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadCancerDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadCancerDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadCancerDiagnosis =  null;
                    }
                },
                hadCancerDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadBloodDisorder: {type: Boolean, value: false},
                hadBDAnemia: {type: Boolean, value: false},
                hadBDAnemiaType: {type: String, value: null, rule: ["required"]},
                hadBDAnemiaTypeValues: {type: Array, isLocal: true, value: ['IronDeficient', 'Pernicious', 'Hemolytic', 'Other/NotSure']},
                hadBDAnemiaTypeDescriptions: {type: Object, isLocal: true, value: {'IronDeficient': 'Iron Deficient', 'Pernicious': 'Pernicious', 'Hemolytic': 'Hemolytic', 'Other/NotSure': 'Other / Not Sure'}},
                hasBDAnemiaResolved: {type: Boolean, value: null, rule: ["required"]},
                hasBDAnemiaResolvedTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaResolved === false) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaResolvedDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaResolvedDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaResolvedDiagnosis =  null;
                    }
                },
                hasBDAnemiaResolvedValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasBDAnemiaResolvedDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasBDAnemiaResolvedDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadBDAnemiaBleeding: {type: Boolean, value: null, rule: ["required"]},
                hadBDAnemiaBleedingTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBDAnemiaBleeding === false) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadBDAnemiaBleedingDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadBDAnemiaBleedingDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadBDAnemiaBleedingDiagnosis =  null;
                    }
                },
                hadBDAnemiaBleedingValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadBDAnemiaBleedingDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadBDAnemiaBleedingDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasBDAnemiaControlled: {type: Boolean, value: null, rule: ["required"]},
                hasBDAnemiaControlledTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaControlled === false) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaControlledDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaControlledDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaControlledDiagnosis =  null;
                    }
                },
                hasBDAnemiaControlledValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasBDAnemiaControlledDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasBDAnemiaControlledDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasBDAnemiaSymptoms: {type: Boolean, value: null, rule: ["required"]},
                hasBDAnemiaSymptomsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaSymptoms === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaSymptomsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaSymptomsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasBDAnemiaSymptomsDiagnosis =  null;
                    }
                },
                hasBDAnemiaSymptomsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasBDAnemiaSymptomsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasBDAnemiaSymptomsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadBDSpleen: {type: Boolean, value: false},
                hadBDSpleenTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBDSpleen === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadBDSpleenDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadBDSpleenDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadBDSpleenDiagnosis =  null;
                    }
                },
                hadBDSpleenDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadBDClotting: {type: Boolean, value: false},
                hadBDClottingTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBDClotting === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadBDClottingDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadBDClottingDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadBDClottingDiagnosis =  null;
                    }
                },
                hadBDClottingDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadBDHemochromatosis: {type: Boolean, value: false},
                hadBDOther: {type: Boolean, value: false},
                hadBDOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBDOther) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.otherDiagnosisis.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.otherDiagnosisis.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.otherDiagnosisis = [];
                    }
                },
                otherDiagnosisis: {type: Array, of: Diagnosis, value: []},
                hadBrainDisorder: {type: Boolean, value: false},
                hadBDAneurysm: {type: Boolean, value: false},
                hadBDAneurysmTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBDAneurysm === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadBDAneurysmDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadBDAneurysmDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadBDAneurysmDiagnosis =  null;
                    }
                },
                hadBDAneurysmDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBTumor: {type: Boolean, value: false},
                hadDBTumorTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBTumor === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBTumorDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBTumorDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBTumorDiagnosis =  null;
                    }
                },
                hadDBTumorDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBEncephalitits: {type: Boolean, value: false},
                hadDBEncephalititsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBEncephalitits === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBEncephalititsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBEncephalititsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBEncephalititsDiagnosis =  null;
                    }
                },
                hasDBRecovered: {type: String, value: null, rule: ["required"]},
                hasDBRecoveredValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasDBRecoveredDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hasDBRecovered2Years: {type: Boolean, value: null, rule: ["required"]},
                hasDBRecovered2YearsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasDBRecovered2YearsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadDBEncephalititsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBSeizures: {type: Boolean, value: false},
                hadDBSeizuresTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBSeizures === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBSeizuresDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBSeizuresDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBSeizuresDiagnosis =  null;
                    }
                },
                medsDBSeizures: {type: String, value: null, rule: ["required"]},
                medsDBSeizuresValues: {type: Array, isLocal: true, value: ['None', 'One', 'Morethanone']},
                medsDBSeizuresDescriptions: {type: Object, isLocal: true, value: {'None': 'None', 'One': 'One', 'Morethanone': 'More than one'}},
                hadDBSiezuresLast5Years: {type: Boolean, value: null, rule: ["required"]},
                hadDBSiezuresLast5YearsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadDBSiezuresLast5YearsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadDBSeizuresDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBMigranes: {type: Boolean, value: false},
                hadDBMDisabilityPayments: {type: Boolean, value: null, rule: ["required"]},
                hadDBMDisabilityPaymentsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBMDisabilityPayments === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBMDisabilityPaymentsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBMDisabilityPaymentsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBMDisabilityPaymentsDiagnosis =  null;
                    }
                },
                hadDBMDisabilityPaymentsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadDBMDisabilityPaymentsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadDBMDisabilityPaymentsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBMS: {type: Boolean, value: false},
                hadDBMSTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBMS === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBMSDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBMSDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBMSDiagnosis =  null;
                    }
                },
                hadDBMSDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBNeuropathy: {type: Boolean, value: false},
                hadDBNeuropathyTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBNeuropathy === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBNeuropathyDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBNeuropathyDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBNeuropathyDiagnosis =  null;
                    }
                },
                hadDBNeuropathyDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBParkinsons: {type: Boolean, value: false},
                hadDBParkinsonsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBParkinsons === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBParkinsonsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBParkinsonsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBParkinsonsDiagnosis =  null;
                    }
                },
                hadDBParkinsonsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBSciatica: {type: Boolean, value: false},
                hadDBStroke: {type: Boolean, value: false},
                hadDBStrokeTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBStroke === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBStrokeDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBStrokeDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBStrokeDiagnosis =  null;
                    }
                },
                hadDBStrokeDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBFainting: {type: Boolean, value: false},
                hadDBFMultipleEpisodes: {type: String, value: null, rule: ["required"]},
                hadDBFMultipleEpisodesTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBFMultipleEpisodes === 'Yes') {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBFMultipleEpisodesDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBFMultipleEpisodesDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBFMultipleEpisodesDiagnosis =  null;
                    }
                },
                hadDBFMultipleEpisodesValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadDBFMultipleEpisodesDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadDBFMultipleEpisodesDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBFLastYear: {type: Boolean, value: null, rule: ["required"]},
                hadDBFLastYearTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBFLastYear === false) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBFLastYearDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBFLastYearDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBFLastYearDiagnosis =  null;
                    }
                },
                hadDBFLastYearValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadDBFLastYearDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadDBFLastYearDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBTIA: {type: Boolean, value: false},
                hadDBTIATrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBTIA === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBTIADiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBTIADiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBTIADiagnosis =  null;
                    }
                },
                hadDBTIADiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBHematoma: {type: Boolean, value: false},
                hadDBHematomaTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDBHematoma === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDBHematomaDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDBHematomaDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDBHematomaDiagnosis =  null;
                    }
                },
                hadDBHematomaDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDBTBI: {type: Boolean, value: false},
                hadDBTBILast5Years: {type: Boolean, value: null, rule: ["required"]},
                hadDBTBILast5YearsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadDBTBILast5YearsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasTBISymptomsOrMeds: {type: String, value: null, rule: ["required"]},
                hasTBISymptomsOrMedsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasTBISymptomsOrMeds && controller.customer.applicationPolicy.insured.personalHistory.hasTBISymptomsOrMeds.match(/Yes|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasTBISymptomsOrMedsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasTBISymptomsOrMedsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasTBISymptomsOrMedsDiagnosis =  null;
                    }
                },
                hasTBISymptomsOrMedsValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasTBISymptomsOrMedsDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hasTBISymptomsOrMedsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadTBTourettes: {type: Boolean, value: false},
                hadTBNotSure: {type: Boolean, value: false},
                hadTBNotSureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadTBNotSure) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.diagnosisTB.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.diagnosisTB.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.diagnosisTB = [];
                    }
                },
                diagnosisTB: {type: Array, of: Diagnosis, value: []},
                hadEmotionalDisorder: {type: Boolean, value: false},
                hadEOHospitalizedLast5Years: {type: String, value: null, rule: ["required"]},
                hadEOHospitalizedLast5YearsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEOHospitalizedLast5Years === 'Yes') {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEOHospitalizedLast5YearsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEOHospitalizedLast5YearsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEOHospitalizedLast5YearsDiagnosis =  null;
                    }
                },
                hadEOHospitalizedLast5YearsValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadEOHospitalizedLast5YearsDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadEOHospitalizedLast5YearsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEOAlcoholism: {type: Boolean, value: false},
                hadEOAlcoholismTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEOAlcoholism === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEOAlcoholismDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEOAlcoholismDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEOAlcoholismDiagnosis =  null;
                    }
                },
                hadEOAlcoholismDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEOADepression: {type: Boolean, value: false},
                hadEOTreatment: {type: Boolean, value: null, rule: ["required"]},
                hadEOTreatmentTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEOTreatment === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEOADepressionDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEOADepressionDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEOADepressionDiagnosis =  null;
                    }
                },
                hadEOTreatmentValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadEOTreatmentDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadEODepressionSituationalOnly: {type: Boolean, value: null, rule: ["required"]},
                hadEODepressionSituationalOnlyValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadEODepressionSituationalOnlyDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadEOADepressionDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEOHeartPalpitations: {type: Boolean, value: null, rule: ["required"]},
                hadEOHeartPalpitationsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadEOHeartPalpitationsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadEOADHD: {type: Boolean, value: false},
                hadEOADHDChildhood: {type: Boolean, value: null, rule: ["required"]},
                hadEOADHDChildhoodValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadEOADHDChildhoodDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadEO: {type: Boolean, value: false},
                hadEOTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEO === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEODiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEODiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEODiagnosis =  null;
                    }
                },
                hadEODiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEODelusion: {type: Boolean, value: false},
                hadEODelusionTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEODelusion === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEODelusionDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEODelusionDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEODelusionDiagnosis =  null;
                    }
                },
                hadEODelusionDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEODrugCounseling: {type: Boolean, value: false},
                hadEODrugCounselingTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEODrugCounseling === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEODrugCounselingDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEODrugCounselingDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEODrugCounselingDiagnosis =  null;
                    }
                },
                hadEODrugCounselingDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEOEatingDisorder: {type: Boolean, value: false},
                hadEOEatingDisorderTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEOEatingDisorder === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEOEatingDisorderDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEOEatingDisorderDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEOEatingDisorderDiagnosis =  null;
                    }
                },
                hadEOEatingDisorderDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEOMajorDepression: {type: Boolean, value: false},
                hadEOMajorDepressionTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEOMajorDepression === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEOMajorDepressionDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEOMajorDepressionDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEOMajorDepressionDiagnosis =  null;
                    }
                },
                hadEOMajorDepressionDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEOPanicAttack: {type: Boolean, value: false},
                hadEOPAMedsLast2Years: {type: Boolean, value: null, rule: ["required"]},
                hadEOPAMedsLast2YearsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEOPAMedsLast2Years === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEOPAMedsLast2YearsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEOPAMedsLast2YearsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEOPAMedsLast2YearsDiagnosis =  null;
                    }
                },
                hadEOPAMedsLast2YearsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadEOPAMedsLast2YearsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadEOPAMedsLast2YearsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEOSuicideAttempt: {type: Boolean, value: false},
                hadEOSuicideAttemptTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEOSuicideAttempt === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEOSuicideAttemptDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEOSuicideAttemptDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEOSuicideAttemptDiagnosis =  null;
                    }
                },
                hadEOSuicideAttemptDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEOMinorDisorders: {type: Boolean, value: false},
                hadEONotSure: {type: Boolean, value: false},
                hadEONotSureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEONotSure) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.diagnosisEONotSure.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.diagnosisEONotSure.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.diagnosisEONotSure = [];
                    }
                },
                diagnosisEONotSure: {type: Array, of: Diagnosis, value: []},
                hadEENT: {type: Boolean, value: false},
                hadEENTAcousicNeuroma: {type: Boolean, value: false},
                hadEENTAcousicNeuromaTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEENTAcousicNeuroma === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEENTAcousicNeuromaDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEENTAcousicNeuromaDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEENTAcousicNeuromaDiagnosis =  null;
                    }
                },
                hadEENTAcousicNeuromaDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEENTLeukoplakia: {type: Boolean, value: false},
                hadEENTLeukoplakiaTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEENTLeukoplakia === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEENTLeukoplakiaDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEENTLeukoplakiaDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEENTLeukoplakiaDiagnosis =  null;
                    }
                },
                hadEENTLeukoplakiaDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEENTOpticNeuritis: {type: Boolean, value: false},
                hadEENTOpticNeuritisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEENTOpticNeuritis === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadEENTOpticNeuritisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadEENTOpticNeuritisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadEENTOpticNeuritisDiagnosis =  null;
                    }
                },
                hadEENTOpticNeuritisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadEENTNotSure: {type: Boolean, value: false},
                hadEENTNotSureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadEENTNotSure) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.diagnosisEENTNotSure.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.diagnosisEENTNotSure.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.diagnosisEENTNotSure = [];
                    }
                },
                diagnosisEENTNotSure: {type: Array, of: Diagnosis, value: []},
                hadRespiratoryDisorder: {type: Boolean, value: false},
                hadRDSarcoidosis: {type: Boolean, value: false},
                hadRDSarcoidosisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDSarcoidosis === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDSarcoidosisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDSarcoidosisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDSarcoidosisDiagnosis =  null;
                    }
                },
                hadRDSarcoidosisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDCOPD: {type: Boolean, value: false},
                hadRDCOPDTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDCOPD === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDCOPDDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDCOPDDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDCOPDDiagnosis =  null;
                    }
                },
                hadRDCOPDDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDEmphysema: {type: Boolean, value: false},
                hadRDEmphysemaTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDEmphysema === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDEmphysemaDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDEmphysemaDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDEmphysemaDiagnosis =  null;
                    }
                },
                hadRDEmphysemaDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDAsthma: {type: Boolean, value: false},
                hadRDAHospitalizedLast1Year: {type: Boolean, value: null, rule: ["required"]},
                hadRDAHospitalizedLast1YearTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDAHospitalizedLast1Year === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDAHospitalizedLast1YearDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDAHospitalizedLast1YearDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDAHospitalizedLast1YearDiagnosis =  null;
                    }
                },
                hadRDAHospitalizedLast1YearValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadRDAHospitalizedLast1YearDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadRDAHospitalizedLast1YearDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDAERLast1Year: {type: Boolean, value: null, rule: ["required"]},
                hadRDAERLast1YearTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDAERLast1Year === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDAERLast1YearDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDAERLast1YearDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDAERLast1YearDiagnosis =  null;
                    }
                },
                hadRDAERLast1YearValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadRDAERLast1YearDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadRDAERLast1YearDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasRDAMeds: {type: Boolean, value: null, rule: ["required"]},
                hasRDAMedsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasRDAMeds === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasRDAMedsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasRDAMedsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasRDAMedsDiagnosis =  null;
                    }
                },
                hasRDAMedsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasRDAMedsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasRDAMedsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDPulmonaryNodule: {type: Boolean, value: false},
                hadRDPulmonaryNoduleTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDPulmonaryNodule === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDPulmonaryNoduleDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDPulmonaryNoduleDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDPulmonaryNoduleDiagnosis =  null;
                    }
                },
                hadRDPulmonaryNoduleDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasRDApnea: {type: Boolean, value: false},
                hasRDApneaTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasRDApnea === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasRDApneaDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasRDApneaDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasRDApneaDiagnosis =  null;
                    }
                },
                hasRDApneaDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasRDCPAP: {type: Boolean, value: null, rule: ["required"]},
                hasRDCPAPValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasRDCPAPDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasRDCPAPLast6Months: {type: Boolean, value: null, rule: ["required"]},
                hasRDCPAPLast6MonthsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasRDCPAPLast6MonthsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasRDBronchitis: {type: Boolean, value: false},
                hasRDBRecovered: {type: String, value: null, rule: ["required"]},
                hasRDBRecoveredValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasRDBRecoveredDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadRDPneumonia: {type: Boolean, value: false},
                hasRDPRecovered: {type: String, value: null, rule: ["required"]},
                hasRDPRecoveredTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasRDPRecovered && controller.customer.applicationPolicy.insured.personalHistory.hasRDPRecovered.match(/No| NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasRDPRecoveredDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasRDPRecoveredDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasRDPRecoveredDiagnosis =  null;
                    }
                },
                hasRDPRecoveredValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasRDPRecoveredDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hasRDPRecoveredDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDTuberculosis: {type: Boolean, value: false},
                hadRDTuberculosisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDTuberculosis === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDTuberculosisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDTuberculosisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDTuberculosisDiagnosis =  null;
                    }
                },
                hasRDTRecovered: {type: String, value: null, rule: ["required"]},
                hasRDTRecoveredValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasRDTRecoveredDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadRDTuberculosisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDInfluenza: {type: Boolean, value: false},
                hadRDOther: {type: Boolean, value: false},
                hadRDOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDOther) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.diagnosisRDOther.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.diagnosisRDOther.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.diagnosisRDOther = [];
                    }
                },
                diagnosisRDOther: {type: Array, of: Diagnosis, value: []},
                hadDigestiveDisorder: {type: Boolean, value: false},
                hadDDAnorectalFistula: {type: Boolean, value: false},
                hadDDCeliacDisease: {type: Boolean, value: false},
                hadDDCeliacDiseaseTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDCeliacDisease === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDCeliacDiseaseDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDCeliacDiseaseDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDCeliacDiseaseDiagnosis =  null;
                    }
                },
                hadDDCeliacDiseaseDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDColonPolyp: {type: Boolean, value: false},
                hadDDColonPolypTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDColonPolyp === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDColonPolypDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDColonPolypDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDColonPolypDiagnosis =  null;
                    }
                },
                hadDDColonPolypDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDChrons: {type: Boolean, value: false},
                hadDDChronsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDChrons === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDChronsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDChronsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDChronsDiagnosis =  null;
                    }
                },
                hadDDChronsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDColitusNonUlcerative: {type: Boolean, value: false},
                hadDDColitusNonUlcerativeTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDColitusNonUlcerative === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDColitusNonUlcerativeDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDColitusNonUlcerativeDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDColitusNonUlcerativeDiagnosis =  null;
                    }
                },
                hadDDColitusNonUlcerativeDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDColitusUlcerative: {type: Boolean, value: false},
                hadDDColitusUlcerativeTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDColitusUlcerative === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDColitusUlcerativeDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDColitusUlcerativeDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDColitusUlcerativeDiagnosis =  null;
                    }
                },
                hadDDColitusUlcerativeDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDiverticulitis: {type: Boolean, value: false},
                hadDDDLast6Months: {type: Boolean, value: null, rule: ["required"]},
                hadDDDLast6MonthsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDDLast6Months === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDDLast6MonthsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDDLast6MonthsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDDLast6MonthsDiagnosis =  null;
                    }
                },
                hadDDDLast6MonthsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadDDDLast6MonthsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadDDDLast6MonthsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDNAFLD: {type: Boolean, value: false},
                hadDDNAFLDTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDNAFLD === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDNAFLDDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDNAFLDDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDNAFLDDiagnosis =  null;
                    }
                },
                hadDDNAFLDDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDLiverBiopsy: {type: Boolean, value: null, rule: ["required"]},
                hadDDLiverBiopsyValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadDDLiverBiopsyDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadDDGastritis: {type: Boolean, value: false},
                hadDDHepititis: {type: Boolean, value: false},
                hadDDHepititisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDHepititis === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDHepititisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDHepititisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDHepititisDiagnosis =  null;
                    }
                },
                hadDDHepititisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDPancreaticInflamation: {type: Boolean, value: false},
                hadDDPancreaticInflamationTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDPancreaticInflamation === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDPancreaticInflamationDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDPancreaticInflamationDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDPancreaticInflamationDiagnosis =  null;
                    }
                },
                hadDDPancreaticInflamationDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDPancreatitis: {type: Boolean, value: false},
                hadDDPancreatitisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDPancreatitis === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDPancreatitisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDPancreatitisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDPancreatitisDiagnosis =  null;
                    }
                },
                hadDDPancreatitisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDUlcer: {type: Boolean, value: false},
                hadDDURecovered: {type: String, value: null, rule: ["required"]},
                hadDDURecoveredTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDURecovered && controller.customer.applicationPolicy.insured.personalHistory.hadDDURecovered.match(/No|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDURecoveredDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDURecoveredDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDURecoveredDiagnosis =  null;
                    }
                },
                hadDDURecoveredValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadDDURecoveredDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadDDURecoveredDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDWeightLossSurgery: {type: Boolean, value: false},
                hadDDWeightLossSurgeryTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadDDWeightLossSurgery === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadDDWeightLossSurgeryDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadDDWeightLossSurgeryDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadDDWeightLossSurgeryDiagnosis =  null;
                    }
                },
                hadDDWeightLossSurgeryDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadDDBenign: {type: Boolean, value: false},
                hadBDNotSure: {type: Boolean, value: false},
                hadBDNotSureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBDNotSure) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.diagnosisDDOther.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.diagnosisDDOther.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.diagnosisDDOther = [];
                    }
                },
                diagnosisDDOther: {type: Array, of: Diagnosis, value: []},
                hadBoneMuscularDisorder: {type: Boolean, value: false},
                hadBMDAmputationsFromTrauma: {type: Boolean, value: false},
                hadBMDAmputationsFromTraumaTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBMDAmputationsFromTrauma === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadBMDAmputationsFromTraumaDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadBMDAmputationsFromTraumaDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadBMDAmputationsFromTraumaDiagnosis =  null;
                    }
                },
                hadBMDAmputationsFromTraumaDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadBMDArthritis: {type: Boolean, value: false},
                hadBMDAType: {type: String, value: null, rule: ["required"]},
                hadBMDATypeTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBMDAType && controller.customer.applicationPolicy.insured.personalHistory.hadBMDAType.match(/RheumatoidArthritis|Polyarthritis|PolyinflammatoryArthritis|Other\/NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadBMDATypeDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadBMDATypeDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadBMDATypeDiagnosis =  null;
                    }
                },
                hadBMDATypeValues: {type: Array, isLocal: true, value: ['Osteoarthritis', 'RheumatoidArthritis', 'Polyarthritis', 'PolyinflammatoryArthritis', 'Other/NotSure']},
                hadBMDATypeDescriptions: {type: Object, isLocal: true, value: {'Osteoarthritis': 'Osteoarthritis', 'RheumatoidArthritis': 'Rheumatoid Arthritis', 'Polyarthritis': 'Polyarthritis', 'PolyinflammatoryArthritis': 'Polyinflammatory Arthritis', 'Other/NotSure': 'Other / Not Sure'}},
                hadBMDATypeDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasBMDMeds: {type: Boolean, value: null, rule: ["required"]},
                hasBMDMedsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDMeds === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDMedsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasBMDMedsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasBMDMedsDiagnosis =  null;
                    }
                },
                hasBMDMedsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasBMDMedsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasBMDMedsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasBMDDisabilityBenefits: {type: Boolean, value: null, rule: ["required"]},
                hasBMDDisabilityBenefitsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDDisabilityBenefits === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDDisabilityBenefitsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasBMDDisabilityBenefitsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasBMDDisabilityBenefitsDiagnosis =  null;
                    }
                },
                hasBMDDisabilityBenefitsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasBMDDisabilityBenefitsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasBMDDisabilityBenefitsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasBMDOsteoporosis: {type: Boolean, value: false},
                hasBMDOsteoporosisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDOsteoporosis === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDOsteoporosisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasBMDOsteoporosisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasBMDOsteoporosisDiagnosis =  null;
                    }
                },
                hasBMDOsteoporosisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasBMDBackPain: {type: Boolean, value: false},
                hasBMDBPMeds: {type: Boolean, value: null, rule: ["required"]},
                hasBMDBPMedsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasBMDBPMedsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasBMDPagets: {type: Boolean, value: false},
                hasBMDPagetsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDPagets === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDPagetsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasBMDPagetsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasBMDPagetsDiagnosis =  null;
                    }
                },
                hasBMDPagetsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasBMDBenign: {type: Boolean, value: false},
                hasBMDOther: {type: Boolean, value: false},
                hasBMDOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasBMDOther) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.diagosisBMDAOther.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.diagosisBMDAOther.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.diagosisBMDAOther = [];
                    }
                },
                diagosisBMDAOther: {type: Array, of: Diagnosis, value: []},
                hadRhumatologicDisorder: {type: Boolean, value: false},
                hadRDChronicFatigue: {type: Boolean, value: false},
                hadRDChronicFatigueTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDChronicFatigue === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDChronicFatigueDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDChronicFatigueDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDChronicFatigueDiagnosis =  null;
                    }
                },
                hasRDCFFunctionNormal: {type: String, value: null, rule: ["required"]},
                hasRDCFFunctionNormalValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasRDCFFunctionNormalDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadRDDepression: {type: String, value: null, rule: ["required"]},
                hadRDDepressionValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadRDDepressionDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadRDChronicFatigueDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDEpsteinBarr: {type: Boolean, value: false},
                hadRDEBOtherSymptoms: {type: String, value: null, rule: ["required"]},
                hadRDEBOtherSymptomsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDEBOtherSymptoms && controller.customer.applicationPolicy.insured.personalHistory.hadRDEBOtherSymptoms.match(/Yes|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDEBOtherSymptomsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDEBOtherSymptomsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDEBOtherSymptomsDiagnosis =  null;
                    }
                },
                hadRDEBOtherSymptomsValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadRDEBOtherSymptomsDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadRDEBOtherSymptomsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDLupus: {type: Boolean, value: false},
                hadRDLupusTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRDLupus === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadRDLupusDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadRDLupusDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadRDLupusDiagnosis =  null;
                    }
                },
                hadRDLupusDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRDLymeDisease: {type: Boolean, value: false},
                hadRDLDSymptoms: {type: String, value: null, rule: ["required"]},
                hadRDLDSymptomsValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadRDLDSymptomsDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hasRDLDTreatment: {type: Boolean, value: null, rule: ["required"]},
                hasRDLDTreatmentValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasRDLDTreatmentDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasRDOther: {type: Boolean, value: false},
                hasRDOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasRDOther) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.diagnosisRMDOther.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.diagnosisRMDOther.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.diagnosisRMDOther = [];
                    }
                },
                diagnosisRMDOther: {type: Array, of: Diagnosis, value: []},
                hasDiabetesThyroid: {type: Boolean, value: false},
                hasDTDiabetes: {type: Boolean, value: false},
                hasDTDiabetesTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasDTDiabetes === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.diabetesDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.diabetesDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.diabetesDiagnosis =  null;
                    }
                },
                hasDTDType: {type: String, value: null, rule: ["required"]},
                hasDTDTypeValues: {type: Array, isLocal: true, value: ['Type1', 'Type2', 'Gestational', 'Other/NotSure']},
                hasDTDTypeDescriptions: {type: Object, isLocal: true, value: {'Type1': 'Type 1', 'Type2': 'Type 2', 'Gestational': 'Gestational', 'Other/NotSure': 'Other/Not Sure'}},
                diabetesDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasDTProlactinoma: {type: Boolean, value: false},
                hasDTProlactinomaTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasDTProlactinoma === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasDTProlactinomaDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasDTProlactinomaDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasDTProlactinomaDiagnosis =  null;
                    }
                },
                hasDTProlactinomaDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasDTThyroidDisease: {type: Boolean, value: false},
                hasDTTStable: {type: String, value: null, rule: ["required"]},
                hasDTTStableTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasDTTStable && controller.customer.applicationPolicy.insured.personalHistory.hasDTTStable.match(/No|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasDTTStableDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasDTTStableDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasDTTStableDiagnosis =  null;
                    }
                },
                hasDTTStableValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasDTTStableDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hasDTTStableDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasDTTImageBiopsy: {type: String, value: null, rule: ["required"]},
                hasDTTImageBiopsyTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasDTTImageBiopsy && controller.customer.applicationPolicy.insured.personalHistory.hasDTTImageBiopsy.match(/Yes|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasDTTImageBiopsyDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasDTTImageBiopsyDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasDTTImageBiopsyDiagnosis =  null;
                    }
                },
                hasDTTImageBiopsyValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasDTTImageBiopsyDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hasDTTImageBiopsyDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasDTNotSure: {type: Boolean, value: false},
                hasDTNotSureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasDTNotSure) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.DiagnosisisDTNotSure.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.DiagnosisisDTNotSure.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.DiagnosisisDTNotSure = [];
                    }
                },
                DiagnosisisDTNotSure: {type: Array, of: Diagnosis, value: []},
                hadUrninaryTrackDisorder: {type: Boolean, value: false},
                hadNephritisLast2Years: {type: Boolean, value: false},
                hadNephritisLast2YearsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadNephritisLast2Years === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadNephritisLast2YearsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadNephritisLast2YearsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadNephritisLast2YearsDiagnosis =  null;
                    }
                },
                hadNephritisLast2YearsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadNephritisMoreThanLast2Years: {type: Boolean, value: false},
                hadNephritisMoreThanLast2YearsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadNephritisMoreThanLast2Years === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadNephritisMoreThanLast2YearsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadNephritisMoreThanLast2YearsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadNephritisMoreThanLast2YearsDiagnosis =  null;
                    }
                },
                hadNephritisMoreThanLast2YearsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadUTDBladderStones: {type: Boolean, value: false},
                hadUTDGlomerulonephiritis: {type: Boolean, value: false},
                hadUTDGlomerulonephiritisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDGlomerulonephiritis === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDGlomerulonephiritisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadUTDGlomerulonephiritisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadUTDGlomerulonephiritisDiagnosis =  null;
                    }
                },
                hadUTDGlomerulonephiritisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadUTDKidneyStones: {type: Boolean, value: false},
                hadUTDKidneyStonesMultiple: {type: Boolean, value: null, rule: ["required"]},
                hadUTDKidneyStonesMultipleValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadUTDKidneyStonesMultipleDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasUTDNormalKidney: {type: String, value: null, rule: ["required"]},
                hasUTDNormalKidneyTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasUTDNormalKidney && controller.customer.applicationPolicy.insured.personalHistory.hasUTDNormalKidney.match(/No|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasUTDNormalKidneyDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasUTDNormalKidneyDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasUTDNormalKidneyDiagnosis =  null;
                    }
                },
                hasUTDNormalKidneyValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hasUTDNormalKidneyDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hasUTDNormalKidneyDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadUTDRenalFailure: {type: Boolean, value: false},
                hadUTDRenalFailureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDRenalFailure === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDRenalFailureDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadUTDRenalFailureDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadUTDRenalFailureDiagnosis =  null;
                    }
                },
                hadUTDRenalFailureDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadUTDPyelonephiritis: {type: Boolean, value: false},
                hadUTStructural: {type: String, value: null, rule: ["required"]},
                hadUTStructuralTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadUTStructural && controller.customer.applicationPolicy.insured.personalHistory.hadUTStructural.match(/Yes|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadUTStructuralDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadUTStructuralDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadUTStructuralDiagnosis =  null;
                    }
                },
                hadUTStructuralValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadUTStructuralDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadUTStructuralDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadUTDKidneyRecovered3Months: {type: String, value: null, rule: ["required"]},
                hadUTDKidneyRecovered3MonthsValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadUTDKidneyRecovered3MonthsDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadUTDProteinuria: {type: Boolean, value: false},
                hadUTDProteinuriaTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDProteinuria === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDProteinuriaDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadUTDProteinuriaDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadUTDProteinuriaDiagnosis =  null;
                    }
                },
                hadUTDProteinuriaDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadUTDRenalCyst: {type: Boolean, value: false},
                hadUTDRCMultiple: {type: String, value: null, rule: ["required"]},
                hadUTDRCMultipleTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDRCMultiple && controller.customer.applicationPolicy.insured.personalHistory.hadUTDRCMultiple.match(/Multiple|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDRCMultipleDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadUTDRCMultipleDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadUTDRCMultipleDiagnosis =  null;
                    }
                },
                hadUTDRCMultipleValues: {type: Array, isLocal: true, value: ['Single', 'Multiple', 'NotSure']},
                hadUTDRCMultipleDescriptions: {type: Object, isLocal: true, value: {'Single': 'Single', 'Multiple': 'Multiple', 'NotSure': 'Not Sure'}},
                hadUTDRCMultipleDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadUTDBenign: {type: Boolean, value: false},
                hadUTDNotSure: {type: Boolean, value: false},
                hadUTDNotSureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadUTDNotSure) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.DiagnosisUTDNotSure.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.DiagnosisUTDNotSure.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.DiagnosisUTDNotSure = [];
                    }
                },
                DiagnosisUTDNotSure: {type: Array, of: Diagnosis, value: []},
                hadSkinDisorder: {type: Boolean, value: false},
                hadSDPsoriasis: {type: Boolean, value: false},
                hadSDArthritis: {type: String, value: null, rule: ["required"]},
                hadSDArthritisTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadSDArthritis && controller.customer.applicationPolicy.insured.personalHistory.hadSDArthritis.match(/Yes|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadSDArthritisDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadSDArthritisDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadSDArthritisDiagnosis =  null;
                    }
                },
                hadSDArthritisValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadSDArthritisDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadSDArthritisDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasSDMeds: {type: Boolean, value: null, rule: ["required"]},
                hasSDMedsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasSDMeds === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hasSDMedsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hasSDMedsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hasSDMedsDiagnosis =  null;
                    }
                },
                hasSDMedsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasSDMedsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasSDMedsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hasSDOther: {type: Boolean, value: false},
                hasSDOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasSDOther) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.DiagnosisSDNotSure.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.DiagnosisSDNotSure.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.DiagnosisSDNotSure = [];
                    }
                },
                DiagnosisSDNotSure: {type: Array, of: Diagnosis, value: []},
                hadImmunoDeficiency: {type: Boolean, value: false},
                hadIDReproductive: {type: Boolean, value: false},
                hadIDCervicitis: {type: Boolean, value: false},
                hadIDFibrocystic: {type: Boolean, value: false},
                hadIDOvarianCyst: {type: Boolean, value: false},
                hadIDOBenign: {type: String, value: null, rule: ["required"]},
                hadIDOBenignTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadIDOBenign && controller.customer.applicationPolicy.insured.personalHistory.hadIDOBenign.match(/No|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadIDOBenignDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadIDOBenignDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadIDOBenignDiagnosis =  null;
                    }
                },
                hadIDOBenignValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadIDOBenignDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadIDOBenignDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadIDPolycystic: {type: Boolean, value: false},
                hadIDPolycysticTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadIDPolycystic === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadIDPolycysticDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadIDPolycysticDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadIDPolycysticDiagnosis =  null;
                    }
                },
                hadIDPolycysticDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadIDCongenitalMalform: {type: Boolean, value: false},
                hadIDNotSure: {type: Boolean, value: false},
                hadIDNotSureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadIDNotSure) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.DiagnosisIDNotSure.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.DiagnosisIDNotSure.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.DiagnosisIDNotSure = [];
                    }
                },
                DiagnosisIDNotSure: {type: Array, of: Diagnosis, value: []},
                hadComplicatedPregnancy: {type: Boolean, value: false},
                hadCPBenign: {type: Boolean, value: false},
                hadCPHighBloodPressure: {type: Boolean, value: false},
                hadCPHeartLiverKidneyProblems: {type: Boolean, value: false},
                hadCPHeartLiverKidneyProblemsTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadCPHeartLiverKidneyProblems === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadCPHeartLiverKidneyProblemsDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadCPHeartLiverKidneyProblemsDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadCPHeartLiverKidneyProblemsDiagnosis =  null;
                    }
                },
                hadCPHeartLiverKidneyProblemsDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadCPSeizures: {type: Boolean, value: false},
                hadCPSeizuresTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadCPSeizures === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadCPSeizuresDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadCPSeizuresDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadCPSeizuresDiagnosis =  null;
                    }
                },
                hadCPSeizuresDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadCPGestationalDiabities: {type: Boolean, value: false},
                hadCPGestationalDiabitiesTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadCPGestationalDiabities === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadCPGestationalDiabitiesDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadCPGestationalDiabitiesDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadCPGestationalDiabitiesDiagnosis =  null;
                    }
                },
                hadCPGestationalDiabitiesDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadCPNotSure: {type: Boolean, value: false},
                hadCPNotSureTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadCPNotSure) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.CPDetails.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.CPDetails.push(new Diagnosis(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.CPDetails = [];
                    }
                },
                CPDetails: {type: Array, of: Diagnosis, value: []},
                hadNoCondition: {type: Boolean, value: false},
                hadDrugUse: {type: Boolean, value: null, rule: ["required"]},
                hadDrugUseValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadDrugUseDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadAlcoholAbuse: {type: Boolean, value: null, rule: ["required"]},
                hadAlcoholAbuseTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadAlcoholAbuse === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadAlcoholAbuseDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadAlcoholAbuseDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadAlcoholAbuseDiagnosis =  null;
                    }
                },
                hadAlcoholAbuseValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadAlcoholAbuseDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadAlcoholAbuseDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadBloodTransfusion: {type: Boolean, value: null, rule: ["required"]},
                hadBloodTransfusionTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadBloodTransfusion) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.bloodTransfusionDetails.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.bloodTransfusionDetails.push(new Surgery(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.bloodTransfusionDetails = [];
                    }
                },
                hadBloodTransfusionValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadBloodTransfusionDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                bloodTransfusionDetails: {type: Array, of: Surgery, value: []},
                hadHeartSurgery: {type: Boolean, value: null, rule: ["required"]},
                hadHeartSurgeryTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadHeartSurgery) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.heartSurgeryDetails.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.heartSurgeryDetails.push(new Surgery(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.heartSurgeryDetails = [];
                    }
                },
                hadHeartSurgeryValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadHeartSurgeryDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                heartSurgeryDetails: {type: Array, of: Surgery, value: []},
                hasProstatectomy: {type: Boolean, value: null, rule: ["required"]},
                hasProstatectomyTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hasProstatectomy) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.otherSurgeryDetails.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.otherSurgeryDetails.push(new Surgery(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.otherSurgeryDetails = [];
                    }
                },
                hasProstatectomyValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasProstatectomyDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadMastectomy: {type: Boolean, value: null, rule: ["required"]},
                hadMastectomyTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadMastectomy) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.otherSurgeryDetails.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.otherSurgeryDetails.push(new Surgery(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.otherSurgeryDetails = [];
                    }
                },
                hadMastectomyValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadMastectomyDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                otherSurgeryDetails: {type: Array, of: Surgery, value: []},
                hadECG: {type: Boolean, value: false},
                hadECGNormal: {type: String, value: null, rule: ["required"]},
                hadECGNormalTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadECGNormal && controller.customer.applicationPolicy.insured.personalHistory.hadECGNormal.match(/No|NotSure/)) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadECGNormalDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadECGNormalDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadECGNormalDiagnosis =  null;
                    }
                },
                hadECGNormalValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadECGNormalDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadECGNormalDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadInsuranceRestricted: {type: Boolean, value: false},
                hadDisabilityClaim: {type: Boolean, value: false},
                hadNoECGDL: {type: Boolean, value: false},
                hadExamOther: {type: Boolean, value: null, rule: ["required"]},
                hadExamOtherValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadExamOtherDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadEORoutine: {type: String, value: null, rule: ["required"]},
                hadEORoutineValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                hadEORoutineDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                hadTreatmentOther: {type: Boolean, value: null, rule: ["required"]},
                hadTreatmentOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadTreatmentOther === true) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadTreatmentOtherDiagnosis ===  null) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadTreatmentOtherDiagnosis = new DiagnosisShort(this.customer);
                        }
                    }
                    else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadTreatmentOtherDiagnosis =  null;
                    }
                },
                hadTreatmentOtherValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadTreatmentOtherDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadTreatmentOtherDiagnosis: {type: DiagnosisShort, rule: ["required"]},
                hadRXOther: {type: Boolean, value: null, rule: ["required"]},
                hadRXOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.personalHistory.hadRXOther) {
                        if(controller.customer.applicationPolicy.insured.personalHistory.hadMedsOther.length === 0) {
                            controller.customer.applicationPolicy.insured.personalHistory.hadMedsOther.push(new RX(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.personalHistory.hadMedsOther = [];
                    }
                },
                hadRXOtherValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hadRXOtherDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hadMedsOther: {type: Array, of: RX, value: []},
                hivPositiveWhichAddress: {type: String, value: null, rule: ["required"]},
                hivPositiveWhichAddressDescriptions: {type: Object, isLocal: true, value: {'insured_address': 'Insured\'s Address', 'pp_address': 'Primary Physician\'s Address', 'insured_another_address': 'Insured Address not stated above', 'pp_another_address': 'Physician Address not stated above', 'state_health': 'State Department of Health', 'optout': 'I do not wish to be tested for HIV'}},
                hivPositiveAddressPPName: {type: String, rule: ["required"], validate: "isNotEmptyAndMinLength(2)"},
                hivPositiveAddress: {type: String, rule: ["required"], validate: "isNotEmptyAndMinLength(2); isMaxLength(88)"}
            });

    DiagnosisShort.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                physician: {type: String, rule: ["required", "text"], validate: "isNotEmptyAndMinLength(2)"},
                date: {type: Date, rule: ["required", "shortdate"]},
                city: {type: String, rule: ["required", "geoName"], validate: "isNotEmptyAndMinLength(2); isMaxLength(86)"},
                state: {type: String, rule: ["required"]}
            });

    RX.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                rxName: {type: String, rule: ["required"]},
                personalHistory: {type: PersonalHistory},
                type: {type: String}
            });

    Diagnosis.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                type: {type: String},
                personalHistory: {type: PersonalHistory},
                description: {type: String, rule: ["required", "text"], validate: "isNotEmptyAndMinLength(2)"},
                physician: {type: String, rule: ["required", "text"], validate: "isNotEmptyAndMinLength(2)"},
                date: {type: Date, rule: ["required", "shortdate"]},
                city: {type: String, rule: ["required", "geoName"], validate: "isNotEmptyAndMinLength(2); isMaxLength(86)"},
                state: {type: String, rule: ["required"]}
            });


    Surgery.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                type: {type: String},
                personalHistory: {type: PersonalHistory},
                description: {type: String, rule: ["required", "text"], validate: "isNotEmptyAndMinLength(2)"},
                physician: {type: String, rule: ["required", "text"], validate: "isNotEmptyAndMinLength(2)"},
                date: {type: Date, rule: ["required", "shortdate"]},
                city: {type: String, rule: ["required", "geoName"], validate: "isNotEmptyAndMinLength(2); isMaxLength(86)"},
                state: {type: String, rule: ["required"]}
            });

    RiskFactors.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                armedForces: {type: Boolean, value: null, rule: ["required"]},
                armedForcesValues: {type: Array, isLocal: true, value: ['true', 'false']},
                armedForcesDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                medicalDischarge: {type: Boolean, value: null, rule: ["required"]},
                medicalDischargeValues: {type: Array, isLocal: true, value: ['true', 'false']},
                medicalDischargeDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                isFelonios: {type: Boolean, value: null, rule: ["required"]},
                isFeloniosValues: {type: Array, isLocal: true, value: ['true', 'false']},
                isFeloniosDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                isPilot: {type: Boolean, value: null, rule: ["required"]},
                isPilotValues: {type: Array, isLocal: true, value: ['true', 'false']},
                isPilotDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                lastFlightDate: {type: Date, rule: ["required", "shortdate"]},
                pilot: {type: String, value: null, rule: ["required"]},
                pilotValues: {type: Array, isLocal: true, value: ['pilot', 'crew']},
                pilotDescriptions: {type: Object, isLocal: true, value: {'pilot': 'Pilot or Co-Pilot', 'crew': 'Crew Member'}},
                pilotCategory: {type: String, value: null, rule: ["required"]},
                pilotCategoryValues: {type: Array, isLocal: true, value: ['Private_Student', 'Commercial', 'Military']},
                pilotCategoryDescriptions: {type: Object, isLocal: true, value: {'Private_Student': 'Private or Student (not flying for hire)', 'Commercial': 'Commercial (flying for hire)', 'Military': 'Military (including Reserve and National Guard)'}},
                pilotTotalHrs: {type: Number, rule: ["required", "numericPositive"]},
                pilotLast12MonthsHrs: {type: Number, rule: ["required", "numericPositive"]},
                pilotNext12MonthsHrs: {type: Number, rule: ["required", "numericPositive"]},
                crewMemberTitle: {type: String, rule: ["required"]},
                crewMemberLast12MonthsHrs: {type: Number, rule: ["required", "numericPositive"]},
                crewMemberNext12MonthsHrs: {type: Number, rule: ["required", "numericPositive"]},
                flyWithinUS: {type: Boolean, value: null, rule: ["required"]},
                flyWithinUSValues: {type: Array, isLocal: true, value: ['true', 'false']},
                flyWithinUSDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                flyOutsideUSDetails: {type: String, rule: ["required"]},
                licenseType: {type: String, value: null, rule: ["required"]},
                licenseTypeValues: {type: Array, isLocal: true, value: ['None', 'Student', 'Private', 'Commercial', 'Flight_Instructor', 'Air_Trasport_Pilot']},
                licenseTypeDescriptions: {type: Object, isLocal: true, value: {'None': 'None', 'Student': 'Student', 'Private': 'Private', 'Commercial': 'Commercial', 'Flight_Instructor': 'Flight Instructor', 'Air_Trasport_Pilot': 'Air Transport Pilot'}},
                ratingType: {type: String, value: null, rule: ["required"]},
                ratingTypeValues: {type: Array, isLocal: true, value: ['Visual_flight_rating', 'instrument_flight_rating', 'other']},
                ratingTypeDescriptions: {type: Object, isLocal: true, value: {'Visual_flight_rating': 'Visual Flight Rating', 'instrument_flight_rating': 'Instrument Flight Rating', 'other': 'Other'}},
                ratingOther: {type: String, rule: ["required"]},
                flyMakeModel: {type: String, rule: ["required"]},
                flyType: {type: String, value: null, rule: ["required"]},
                flyTypeValues: {type: Array, isLocal: true, value: ['solo', 'both']},
                flyTypeDescriptions: {type: Object, isLocal: true, value: {'solo': 'Solo', 'both': 'Both pilot and co-pilot aboard'}},
                flyTypePersonal: {type: Boolean, value: false},
                flyTypeAirTaxi: {type: Boolean, value: false},
                flyTypeTest: {type: Boolean, value: false},
                flyTypeScheduled: {type: Boolean, value: false},
                flyTypeCompany: {type: Boolean, value: false},
                flyTypeHire: {type: String, value: null, rule: ["required"]},
                flyTypeHireValues: {type: Array, isLocal: true, value: ['Hire', 'Not_Hire']},
                flyTypeHireDescriptions: {type: Object, isLocal: true, value: {'Hire': 'Hire', 'Not_Hire': 'Not for Hire'}},
                flyTypeCharters: {type: Boolean, value: false},
                flyTypeProd: {type: Boolean, value: false},
                flyTypeCargo: {type: Boolean, value: false},
                flyTypeInstructor: {type: Boolean, value: false},
                flyTypeSupplemental: {type: Boolean, value: false},
                flyTypeDusting: {type: Boolean, value: false},
                flyTypeOtherAirlines: {type: Boolean, value: false},
                flyTypeOther: {type: Boolean, value: false},
                flyTypeOtherStr: {type: String, rule: ["required"]},
                flyAircraftTypeSingle: {type: Boolean, value: false},
                flyAircraftTypePropeller: {type: Boolean, value: false},
                flyAircraftTypeSingleHelicopter: {type: Boolean, value: false},
                flyAircraftTypeSingleSailplane: {type: Boolean, value: false},
                flyAircraftTypeHotAirBallon: {type: Boolean, value: false},
                flyAircraftTypeGas: {type: Boolean, value: false},
                flyAircraftTypeMulti: {type: Boolean, value: false},
                flyAircraftTypeJet: {type: Boolean, value: false},
                flyAircraftTypeGlider: {type: Boolean, value: false},
                flyAircraftTypeHomeBuilt: {type: Boolean, value: false},
                flyAircraftTypeHomeBuiltDetails: {type: String, rule: ["required"]},
                flyAircraftTypeOther: {type: Boolean, value: false},
                flyAircraftTypeOtherDetails: {type: String, rule: ["required"]},
                militaryServiceBranch: {type: String, value: null, rule: ["required"]},
                militaryServiceBranchValues: {type: Array, isLocal: true, value: ['airforce', 'army', 'navy', 'marine', 'coast_guard']},
                militaryServiceBranchDescriptions: {type: Object, isLocal: true, value: {'airforce': 'Air Force', 'army': 'Army', 'navy': 'Navy', 'marine': 'Marine Corps', 'coast_guard': 'Coast Guard'}},
                militaryRank: {type: String, value: null, rule: ["required"]},
                militaryRankValues: {type: Array, isLocal: true, value: ['e1e4', 'e5', 'officer', 'officer5']},
                militaryRankDescriptions: {type: Object, isLocal: true, value: {'e1e4': 'Enlisted (E1-E4)', 'e5': 'Enlisted (E5 & up)', 'officer': 'Officer (01-04)', 'officer5': 'Officer (05 & up)'}},
                militaryDuties: {type: String, value: null, rule: ["required"]},
                militaryDutiesValues: {type: Array, isLocal: true, value: ['student_pilot', 'instructor', 'mac', 'transport', 'surgeon', 'reserve', 'fighter', 'proficiency', 'other']},
                militaryDutiesDescriptions: {type: Object, isLocal: true, value: {'student_pilot': 'Student Pilot', 'instructor': 'Instructor', 'mac': 'M.A.C', 'transport': 'Transport', 'surgeon': 'Flight Surgeon/Nurse', 'reserve': 'Reserve/National Guard', 'fighter': 'Fighter Pilot', 'proficiency': 'Proficiency Flying', 'other': 'Other'}},
                militaryDutiesOther: {type: String, rule: ["required"]},
                militaryFlyCarrier: {type: Boolean, value: null, rule: ["required"]},
                militaryFlyCarrierValues: {type: Array, isLocal: true, value: ['true', 'false']},
                militaryFlyCarrierDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                militaryFlyAircraftTypeSingle: {type: Boolean, value: false},
                militaryFlyAircraftTypePropeller: {type: Boolean, value: false},
                militaryFlyAircraftTypeHelicopter: {type: Boolean, value: false},
                militaryFlyAircraftTypeRecon: {type: Boolean, value: false},
                militaryFlyAircraftTypeTest: {type: Boolean, value: false},
                militaryFlyAircraftTypeTestDetails: {type: String, rule: ["required"]},
                militaryFlyAircraftTypeMulti: {type: Boolean, value: false},
                militaryFlyAircraftTypeJet: {type: Boolean, value: false},
                militaryFlyAircraftTypeBomber: {type: Boolean, value: false},
                militaryFlyAircraftTypeFighter: {type: Boolean, value: false},
                militaryFlyAircraftTypeTransport: {type: Boolean, value: false},
                militaryFlyAircraftTypeOther: {type: Boolean, value: false},
                militaryFlyAircraftTypeOtherDetails: {type: String, rule: ["required"]},
                hasAvocations: {type: Boolean, value: null, rule: ["required"]},
                hasAvocationsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasAvocationsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avAutoRacing: {type: Boolean, value: false},
                avARATV: {type: Boolean, value: false},
                avARATV3Wheel: {type: Boolean, value: false},
                avARCrash: {type: Boolean, value: false},
                avARCDiveBomber: {type: Boolean, value: false},
                avARCDemolition: {type: Boolean, value: false},
                avARCOther: {type: Boolean, value: false},
                avARGoCart: {type: Boolean, value: false},
                avARGCSprint: {type: Boolean, value: false},
                avARGCEnduro: {type: Boolean, value: false},
                avARGCFormula: {type: Boolean, value: false},
                avARGCMidget: {type: Boolean, value: false},
                avARGCMini: {type: Boolean, value: false},
                avAROffRoad: {type: Boolean, value: false},
                avARORDesert: {type: Boolean, value: false},
                avARORRally: {type: Boolean, value: false},
                avAROROther: {type: Boolean, value: false},
                avARRally: {type: Boolean, value: false},
                avAROther: {type: Boolean, value: false},
                avAROtherDetails: {type: String, rule: ["required"], validate: "isNotEmptyAndMinLength(2)"},
                avBalloning: {type: Boolean, value: false},
                avBigGame: {type: Boolean, value: false},
                avBobsledding: {type: Boolean, value: false},
                avBoxing: {type: Boolean, value: false},
                avBoxingPro: {type: Boolean, value: false},
                avBungee: {type: Boolean, value: false},
                avBungeeNow: {type: Boolean, value: null, rule: ["required"]},
                avBungeeNowValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avBungeeNowDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avHangGliding: {type: Boolean, value: false},
                avHangGlidingLow: {type: String, value: null, rule: ["required"]},
                avHangGlidingLowValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                avHangGlidingLowDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                avHangGlidingOften: {type: Boolean, value: null, rule: ["required"]},
                avHangGlidingOftenValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avHangGlidingOftenDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avHeliSkiing: {type: Boolean, value: false},
                avMartialArts: {type: Boolean, value: false},
                avMartialArtsPro: {type: Boolean, value: false},
                avMotorboatRacing: {type: Boolean, value: false},
                avMotorcycleRacing: {type: Boolean, value: false},
                avMRType: {type: String, value: null, rule: ["required"]},
                avMRTypeValues: {type: Array, isLocal: true, value: ['Upto125cconly', 'Upto250cconly', 'Morethan250cc']},
                avMRTypeDescriptions: {type: Object, isLocal: true, value: {'Upto125cconly': 'Up to 125cc only', 'Upto250cconly': 'Up to 250cc only', 'Morethan250cc': 'More than 250cc'}},
                avMRGrandPrix: {type: Boolean, value: null, rule: ["required"]},
                avMRGrandPrixValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avMRGrandPrixDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avMRDrag: {type: Boolean, value: null, rule: ["required"]},
                avMRDragValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avMRDragDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avMountainClimbing: {type: Boolean, value: false},
                avMCRated: {type: Boolean, value: null, rule: ["required"]},
                avMCRatedValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avMCRatedDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avScubaDiving: {type: Boolean, value: false},
                avSDShallow: {type: Boolean, value: null, rule: ["required"]},
                avSDShallowValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avSDShallowDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avSDBasicCert: {type: Boolean, value: null, rule: ["required"]},
                avSDBasicCertValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avSDBasicCertDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avSDInfrequent: {type: Boolean, value: null, rule: ["required"]},
                avSDInfrequentValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avSDInfrequentDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avSkyDiving: {type: Boolean, value: false},
                avSDSoon: {type: Boolean, value: null, rule: ["required"]},
                avSDSoonValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avSDSoonDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avSKDInfrequent: {type: Boolean, value: null, rule: ["required"]},
                avSKDInfrequentValues: {type: Array, isLocal: true, value: ['true', 'false']},
                avSKDInfrequentDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                avSDAmateur: {type: String, value: null, rule: ["required"]},
                avSDAmateurValues: {type: Array, isLocal: true, value: ['Yes', 'No', 'NotSure']},
                avSDAmateurDescriptions: {type: Object, isLocal: true, value: {'Yes': 'Yes', 'No': 'No', 'NotSure': 'Not Sure'}},
                avOther: {type: Boolean, value: false},
                avOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.riskFactors.avOther) {
                        if(controller.customer.applicationPolicy.insured.riskFactors.avOtherDetail.length === 0) {
                            controller.customer.applicationPolicy.insured.riskFactors.avOtherDetail.push(new Avocation(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.riskFactors.avOtherDetail = [];
                    }
                },
                avOtherDetail: {type: Array, of: Avocation, value: []},
                mvDUI: {type: Boolean, value: null, rule: ["required"]},
                mvDUIValues: {type: Array, isLocal: true, value: ['true', 'false']},
                mvDUIDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                mvLastDUI: {type: String, value: null, rule: ["required"]},
                mvLastDUIValues: {type: Array, isLocal: true, value: ['0-1years', '1-2years', '2-3years', '3-5years']},
                mvLastDUIDescriptions: {type: Object, isLocal: true, value: {'0-1years': '0-1 years', '1-2years': '1-2 years', '2-3years': '2-3 years', '3-5years': '3-5 years'}},
                mvDUIConvitions: {type: String, value: null, rule: ["required"]},
                mvDUIConvitionsValues: {type: Array, isLocal: true, value: ['1', '2', '3ormore']},
                mvDUIConvitionsDescriptions: {type: Object, isLocal: true, value: {'1': '1', '2': '2', '3ormore': '3 or more'}},
                mvAccident: {type: Boolean, value: null, rule: ["required"]},
                mvAccidentValues: {type: Array, isLocal: true, value: ['true', 'false']},
                mvAccidentDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                mvViolations: {type: Number, rule: ["required", "numericPositive"], validate: "isWithin(1,50)"},
                mvAccidentAtFault: {type: Boolean, value: false},
                mvAccidentAtFaultTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.riskFactors.mvAccidentAtFault) {
                        if(controller.customer.applicationPolicy.insured.riskFactors.mvAccidentAtFaults.length === 0) {
                            controller.customer.applicationPolicy.insured.riskFactors.mvAccidentAtFaults.push(new AccidentAtFault(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.riskFactors.mvAccidentAtFaults = [];
                    }
                },
                mvAccidentAtFaults: {type: Array, of: AccidentAtFault, value: []},
                mvSpeeding: {type: Boolean, value: false},
                mvSpeedingTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.riskFactors.mvSpeeding) {
                        if(controller.customer.applicationPolicy.insured.riskFactors.mySpeedingTickets.length === 0) {
                            controller.customer.applicationPolicy.insured.riskFactors.mySpeedingTickets.push(new SpeedingTicket(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.riskFactors.mySpeedingTickets = [];
                    }
                },
                mySpeedingTicketCount: {type: Number, rule: ["required", "numericPositive"], validate: "isWithin(1,50)"},
                mySpeedingTickets: {type: Array, of: SpeedingTicket, value: []},
                mbReckless: {type: Boolean, value: false},
                mbRecklessTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.riskFactors.mbReckless) {
                        if(controller.customer.applicationPolicy.insured.riskFactors.mbRecklessTickets.length === 0) {
                            controller.customer.applicationPolicy.insured.riskFactors.mbRecklessTickets.push(new RecklessTicket(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.riskFactors.mbRecklessTickets = [];
                    }
                },
                mbRecklessTickets: {type: Array, of: RecklessTicket, value: []},
                mvOther: {type: Boolean, value: false},
                mvOtherTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.riskFactors.mvOther) {
                        if(controller.customer.applicationPolicy.insured.riskFactors.mvOthers.length === 0) {
                            controller.customer.applicationPolicy.insured.riskFactors.mvOthers.push(new OtherMovingViolation(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.riskFactors.mvOthers = [];
                    }
                },
                mvOthers: {type: Array, of: OtherMovingViolation, value: []},
                mvDrivingWhileSuspended: {type: Boolean, value: null, rule: ["required"]},
                mvDrivingWhileSuspendedTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.riskFactors.mvDrivingWhileSuspended) {
                        if(controller.customer.applicationPolicy.insured.riskFactors.mvDrivingWhileSuspendedCons.length === 0) {
                            controller.customer.applicationPolicy.insured.riskFactors.mvDrivingWhileSuspendedCons.push(new DrivingWhileSuspendedCon(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.riskFactors.mvDrivingWhileSuspendedCons = [];
                    }
                },
                mvDrivingWhileSuspendedValues: {type: Array, isLocal: true, value: ['true', 'false']},
                mvDrivingWhileSuspendedDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                mvDrivingWhileSuspendedCons: {type: Array, of: DrivingWhileSuspendedCon, value: []},
                mvLicenseSuspended: {type: Boolean, value: null, rule: ["required"]},
                mvLicenseSuspendedValues: {type: Array, isLocal: true, value: ['true', 'false']},
                mvLicenseSuspendedDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                disabled: {type: Boolean, value: null, rule: ["required"]},
                disabledValues: {type: Array, isLocal: true, value: ['true', 'false']},
                disabledDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                anticipateForeignTravel: {type: Boolean, value: null, rule: ["required"]},
                anticipateForeignTravelValues: {type: Array, isLocal: true, value: ['true', 'false']},
                anticipateForeignTravelDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No/Not Sure'}},
                ftBenign: {type: Boolean, value: null, rule: ["required"]},
                ftBenignValues: {type: Array, isLocal: true, value: ['true', 'false']},
                ftBenignDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                ftDuration: {type: Number, rule: ["required", "numericPositive"], validate: "isWithin(1,1000)"},
                ftPurpose: {type: String, value: null, rule: ["required"]},
                ftPurposeValues: {type: Array, isLocal: true, value: ['Pleasure', 'Business/Work', 'Education', 'Other']},
                ftPurposeDescriptions: {type: Object, isLocal: true, value: {'Pleasure': 'Pleasure', 'Business/Work': 'Business/Work', 'Education': 'Education', 'Other': 'Other'}},
                ftCountries: {type: Array, of: TravelCountry, value: []},
                ftWithFamily: {type: Boolean, value: null, rule: ["required"]},
                ftWithFamilyValues: {type: Array, isLocal: true, value: ['true', 'false']},
                ftWithFamilyDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                isSmokester: {type: Boolean, value: null, rule: ["required"]},
                isSmokesterValues: {type: Array, isLocal: true, value: ['true', 'false']},
                isSmokesterDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                isSmokerYear: {type: String, value: null, rule: ["required"]},
                isSmokerYearValues: {type: Array, isLocal: true, value: ['last12', 'last24', 'morethan24']},
                isSmokerYearDescriptions: {type: Object, isLocal: true, value: {'last12': 'in the last 12 months', 'last24': 'between 12 and 24 months ago', 'morethan24': 'more than 2 years ago'}},
                usesCigarettes: {type: Boolean, value: false},
                usesCigars: {type: Boolean, value: false},
                usesPipe: {type: Boolean, value: false},
                usesCigarsFrequency: {type: Number, rule: ["required", "numericPositive"]},
                quitCigarrettesPeriod: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 100)"},
                quitCigarsPeriod: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 100)"},
                usedCigarsFrequency: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 200)"},
                quitTobaccoPeriod: {type: Number, rule: ["required", "numeric"], validate: "isWithin(0, 100)"},
                useTobaccoCessationMeds: {type: Boolean, value: null, rule: ["required"]},
                useTobaccoCessationMedsValues: {type: Array, isLocal: true, value: ['true', 'false']},
                useTobaccoCessationMedsDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                useAlcohol: {type: Boolean, value: null, rule: ["required"]},
                useAlcoholValues: {type: Array, isLocal: true, value: ['true', 'false']},
                useAlcoholDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                isPregnant: {type: Boolean, value: null, rule: ["required"]},
                isPregnantValues: {type: Array, isLocal: true, value: ['true', 'false']},
                isPregnantDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                weightLoss: {type: String, value: null, rule: ["required"]},
                weightLossValues: {type: Array, isLocal: true, value: ['Lost', 'Gained', 'NoIhavenot']},
                weightLossDescriptions: {type: Object, isLocal: true, value: {'Lost': 'Lost', 'Gained': 'Gained', 'NoIhavenot': 'Neither'}},
                weightLossFromExcercise: {type: String, value: null, rule: ["required"]},
                weightLossFromExcerciseDescriptions: {type: Object, isLocal: true, value: {'Exercise': 'Exercise', 'Diet': 'Diet', 'ChildBirth': 'Child Birth', 'Unknown': 'Unknown'}},
                weightLossFromDiet: {type: Number, rule: ["required", "numeric"], validate: "isWithin(11, 200)"}
            });

    Avocation.mixin(
            {
                riskFactors: {type: RiskFactors},
                init: function(customer){
                    this.customer = customer;
                },
                type: {type: String, rule: ["required"], validate: "isNotEmptyAndMinLength(2)"},
                frequency: {type: String, rule: ["required"]}
            });

    AccidentAtFault.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                riskFactors: {type: RiskFactors},
                mvAccidentWhen: {type: String, value: null, rule: ["required"]},
                mvAccidentWhenValues: {type: Array, isLocal: true, value: ['0-1years', '1-2years', '2-3years', '3-5years']},
                mvAccidentWhenDescriptions: {type: Object, isLocal: true, value: {'0-1years': '0-1 years', '1-2years': '1-2 years', '2-3years': '2-3 years', '3-5years': '3-5 years'}}
            });

    SpeedingTicket.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                riskFactors: {type: RiskFactors},
                mvSpeeding15Over: {type: Boolean, value: null, rule: ["required"]},
                mvSpeeding15OverValues: {type: Array, isLocal: true, value: ['true', 'false']},
                mvSpeeding15OverDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                mvSpeedingDate: {type: String, value: null, rule: ["required"]},
                mvSpeedingDateValues: {type: Array, isLocal: true, value: ['0-1years', '1-2years', '2-3years', '3-5years']},
                mvSpeedingDateDescriptions: {type: Object, isLocal: true, value: {'0-1years': '0-1 years', '1-2years': '1-2 years', '2-3years': '2-3 years', '3-5years': '3-5 years'}}
            });

    RecklessTicket.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                riskFactors: {type: RiskFactors},
                mvRecklessDate: {type: String, value: null, rule: ["required"]},
                mvRecklessDateValues: {type: Array, isLocal: true, value: ['0-1years', '1-2years', '2-3years', '3-5years']},
                mvRecklessDateDescriptions: {type: Object, isLocal: true, value: {'0-1years': '0-1 years', '1-2years': '1-2 years', '2-3years': '2-3 years', '3-5years': '3-5 years'}}
            });

    OtherMovingViolation.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                riskFactors: {type: RiskFactors},
                mvOtherWhen: {type: String, value: null, rule: ["required"]},
                mvOtherWhenValues: {type: Array, isLocal: true, value: ['0-1years', '1-2years', '2-3years', '3-5years']},
                mvOtherWhenDescriptions: {type: Object, isLocal: true, value: {'0-1years': '0-1 years', '1-2years': '1-2 years', '2-3years': '2-3 years', '3-5years': '3-5 years'}},
                mvOtherDetails: {type: String, rule: ["required"], validate: "isNotEmptyAndMinLength(2)"}
            });

    DrivingWhileSuspendedCon.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                riskFactors: {type: RiskFactors},
                mvDWSConvictionDate: {type: String, value: null, rule: ["required"]},
                mvDWSConvictionDateValues: {type: Array, isLocal: true, value: ['0-1years', '1-2years', '2-3years', '3-5years']},
                mvDWSConvictionDateDescriptions: {type: Object, isLocal: true, value: {'0-1years': '0-1 years', '1-2years': '1-2 years', '2-3years': '2-3 years', '3-5years': '3-5 years'}}
            });

    TravelCountry.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                riskFactors: {type: RiskFactors},
                name: {type: String, rule: ["required"]},
                ftMexicoSpecific: {type: String, rule: ["required"]},
                departureDateWhen: {type: Boolean, value: null, rule: ["required"]},
                departureDateWhenValues: {type: Array, isLocal: true, value: ['true', 'false']},
                departureDateWhenDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                departureDate: {type: Date, rule: ["required", "futuredate"]},
                duration: {type: Number, rule: ["required", "numeric"], validate: "isWithin(1,1000)"},
                purpose: {type: String, value: null, rule: ["required"]},
                purposeValues: {type: Array, isLocal: true, value: ['Pleasure', 'Business/Work', 'Education', 'Other']},
                purposeDescriptions: {type: Object, isLocal: true, value: {'Pleasure': 'Pleasure', 'Business/Work': 'Business/Work', 'Education': 'Education', 'Other': 'Other'}}
            });

    ExistingPolicies.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                replaceInforceApplication: {type: Boolean, value: null, rule: ["required"]},
                replaceInforceApplicationValues: {type: Array, isLocal: true, value: ['true', 'false']},
                replaceInforceApplicationDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                hasExistingPolicies: {type: Boolean, value: null, rule: ["required"]},
                hasExistingPoliciesTrigger: function(){
                    if(controller.customer.applicationPolicy.insured.existingPolicies.hasExistingPolicies) {
                        if(controller.customer.applicationPolicy.insured.existingPolicies.existingPolicyList.length === 0) {
                            controller.customer.applicationPolicy.insured.existingPolicies.existingPolicyList.push(new ExistingPolicy(this.customer));
                        }
                    } else {
                        controller.customer.applicationPolicy.insured.existingPolicies.existingPolicyList = [];
                    }
                },
                hasExistingPoliciesValues: {type: Array, isLocal: true, value: ['true', 'false']},
                hasExistingPoliciesDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
                existingPolicyList: {type: Array, of: ExistingPolicy, value: []}
            });

    ExistingPolicy.mixin(
            {
                init: function(customer){
                    this.customer = customer;
                },
                existingPolicies: {type: ExistingPolicies},
                companyName: {type: String, rule: ["required"]},
                number: {type: String, validate: ""},
                face: {type: Number, rule: ["required", "currency", "numeric"], validate: "isWithin(1, 10000000)"},
                type: {type: String, value: null},
                typeValues: {type: Array, isLocal: true, value: ['term', 'whole', 'deferred', 'income', 'notsure']},
                typeDescriptions: {type: Object, isLocal: true, value: {'term': 'Term', 'whole': 'Universal Life/Whole Life', 'deferred': 'Deferred Annuity', 'income': 'Income Annuity', 'notsure': 'Not Sure'}},
                issueYear: {type: Number, rule: "numeric", validate: ""},
                purpose: {type: String, value: null, rule: ["required"]},
                purposeValues: {type: Array, isLocal: true, value: ['Business', 'Personal']},
                purposeDescriptions: {type: Object, isLocal: true, value: {'Business': 'Business', 'Personal': 'Personal'}},
                status: {type: String, value: null, rule: ["required"]},
                statusValues: {type: Array, isLocal: true, value: ['Applying', 'Inforce']},
                statusDescriptions: {type: Object, isLocal: true, value: {'Applying': 'Applying', 'Inforce': 'Inforce'}}
            });
    /*to here*/


    ExistingPolicies.mixin(
			{
				getAllPolicies: {
					type: Array, of: ExistingPolicy, body: function () {
						var policies = this.existingPolicyList;
						while (policies.length < 6)
							policies.push(new ExistingPolicy());
						return policies;
					}
				},
				getPolicyTotal: function () {
					var policies = this.getAllPolicies();
					var total = 0;
					for (var ix = 0; ix < policies.length; ++ix)
						total += policies[ix].face;
					return total;
				},
				getPolicyApplyingForTotal: function () {
					var policies = this.getAllPolicies();
					var total = 0;
					for (var ix = 0; ix < policies.length; ++ix)
						if (policies[ix].status == 'Applying')
							total += policies[ix].face;

					total += this.customer.applicationPolicy.faceAmount;

					return Utils.formatNumber(total);
				},
				getInForcePolicyTotal: function () {
					var policies = this.getAllPolicies();
					var total = 0;
					for (var ix = 0; ix < policies.length; ++ix)
						if (policies[ix].status == 'Inforce')
							total += policies[ix].face;
					return total > 0 ? Utils.formatNumber(total) : "0";
				}
			}
	);
	/** Additional properties which could not be generated */
	FamilyHistory.mixin({
		motherAge: {type: Number, rule: "numeric", validate: "isWithin(31, 110)"},
		motherLivingTrigger: function () {
			if (this.motherLiving != 'isalive') {
				this.motherAge = null;
			}
		},
		fatherAge: {type: Number, rule: "numeric", validate: "isWithin(31, 110)"},
		fatherLivingTrigger: function () {
			if (this.fatherLiving != 'isalive') {
				this.fatherAge = null;
			}
		}
	});

	PersonalHistory.mixin({

		medicalConditionCount: {type: Number, value: 0},

		init: function (customer) {
			this.customer = customer;
		},

		primaryPhysicianTrigger: function () {
			if (!this.primaryPhysician) {
				this.primaryPhysicianName = this.primaryPhysicianAddress = this.primaryPhysicianPhone = this.primaryPhysicianLastVisitWhen = this.primaryPhysicianLastVisit = null;
			}
		},

		getPrimaryPhysicianPhone: function () {
			var numb = this.primaryPhysicianPhone.split(" ");
			if (numb[1] > 0) {
				return numb[0] + "x " + numb[1];
			}
			return "(" + numb[0].substr(0, 3) + ") " + numb[0].substr(3, 3) + "-" + numb[0].substr(6, 4)
		},

		getPrimaryPhysicianAddress: function () {
			var address = !this.primaryPhysician ? '' : this.customer.applicationPolicy.insured.personalHistory.primaryPhysicianCity + ','
			+ this.customer.applicationPolicy.insured.personalHistory.primaryPhysicianState;

			return address;
		},

		getPrimaryPhysicianLastVisit: function () {
            // If a date was selected format it else return undefined or unknown
            var formatted =   (this.primaryPhysicianLastVisitWhen === 'lastvisit') ?
                Utils.dateToMY(this.primaryPhysicianLastVisit) : this.primaryPhysicianLastVisitWhen;
            return formatted ? formatted : '';
		},

		hivPositiveWhichAddressValues: function () {
			// Set hivPositive address choices based on whether the customer
			// has a primary physician or not
			var valuesNoPP = ['insured_address', 'insured_another_address', 'pp_another_address', 'state_health'];
			var valuesWithPP = ['insured_address', 'insured_another_address', 'pp_address', 'pp_another_address', 'state_health'];

			// Set descriptions to replace Insured
			if (this.customer.applicationPolicy && this.customer.applicationPolicy.insuredType && this.customer.applicationPolicy.ownerType) {

				var descriptions = this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddressDescriptions;
				descriptions['insured_address'] = this.customer.applicationPolicy.getInsuredPossessivePronounUC() + ' Address';
				descriptions['insured_another_address'] = this.customer.applicationPolicy.getInsuredPossessivePronounUC() + ' Address not stated above';
				descriptions['state_health'] = this.customer.applicationPolicy.getInsuredPossessivePronounUC() + ' State Department of Health';
				descriptions['insured_address'] = this.customer.applicationPolicy.getInsuredPossessivePronounUC() + ' Address';
				descriptions['insured_another_address'] = this.customer.applicationPolicy.getInsuredPossessivePronounUC() + ' Address not stated above';
                descriptions['state_health'] = this.customer.applicationPolicy.getInsuredPossessivePronounUC() + ' State Department of Health';

				var values = this.customer.applicationPolicy.insured.personalHistory.primaryPhysician ? valuesWithPP : valuesNoPP;
                var oState = this.customer.applicationPolicy.ownerPersonResidentialAddress.state;
                var iState = this.customer.applicationPolicy.insured.address.state;

				// If contract state is PA, TX, or WA, don't show insured address options
                var noInsuredAddressStates = ['PA', 'TX', 'WA'];

                var isNoInsuredAddressState = _.some(noInsuredAddressStates, function(noInsuredAddressState){
                    return oState === noInsuredAddressState || iState === noInsuredAddressState;
                });

                if (isNoInsuredAddressState) {
                    values.splice(values.indexOf('insured_address'), 1);
                    values.splice(values.indexOf('insured_another_address'), 1);
                }

				// Add an opt out option if insured state is MI
				if (iState === "MI" || oState === "MI") {
					values.push('optout');
				}

				return values;
			}
			else {
				return valuesWithPP;
			}
		},

		hivPositiveWhichAddressTrigger: function () {
			// clear address if address already known
			if (this.customer.applicationPolicy && this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress.match(/insured_address|pp_address|state_health|optout/)) {
				this.customer.applicationPolicy.insured.personalHistory.hivPositiveAddress = null;
			}
		},
		primaryPhysicianLastVisit: {type: Date, rule: "shortdate"},
		primaryPhysicianStateValues: {isLocal: true, type: Object, value: Assumptions.stateValues}
	});

	DiagnosisShort.mixin({
		stateValues: {isLocal: true, type: Object, value: Assumptions.stateValues}
	});

	Diagnosis.mixin({
		stateValues: {isLocal: true, type: Object, value: Assumptions.stateValues}
	});

	Surgery.mixin({
		stateValues: {isLocal: true, type: Object, value: Assumptions.stateValues}
	});

	RiskFactors.mixin({
		init: function (customer) {
			this.customer = customer;
		},

		movingViolationCount: function () {
			return this.mvAccidentAtFaults.length + this.mySpeedingTickets.length + this.mbRecklessTickets.length +
					this.mvOthers.length + this.mvDrivingWhileSuspendedCons.length;
		},

		yearsSinceLastMovingViolation: function () {
			var yrsSinceLastViol = yrsSinceLastViolation(this.mvAccidentAtFaults, 'mvAccidentWhen', 99);
			yrsSinceLastViol = yrsSinceLastViolation(this.mySpeedingTickets, 'mvSpeedingDate', yrsSinceLastViol);
			yrsSinceLastViol = yrsSinceLastViolation(this.mbRecklessTickets, 'mvRecklessDate', yrsSinceLastViol);
			yrsSinceLastViol = yrsSinceLastViolation(this.mvOthers, 'mvOtherWhen', yrsSinceLastViol);
			return yrsSinceLastViolation(this.mvDrivingWhileSuspendedCons, 'mvDWSConvictionDate', yrsSinceLastViol);

			function yrsSinceLastViolation(viols, whenProp, yrsSinceLastViol) {
				return viols.reduce(function (yrsSinceLastV, viol) {
					var yrsSinceViol = yrs(viol[whenProp]);
					return yrsSinceViol < yrsSinceLastV ? yrsSinceViol : yrsSinceLastV;
				}, yrsSinceLastViol);
			}

			function yrs(opt) {
				return opt == '0-1years' ? 1 : (opt == '1-2years' ? 2 : (opt == '2-3years' ? 3 : 5));
			}
		},

		yearsSinceLastDuiViolation: function () {
			return this.mvDUI ? yrs(this.mvLastDUI) : 99;

			function yrs(opt) {
				return opt == '0-1years' ? 1 : (opt == '1-2years' ? 2 : (opt == '2-3years' ? 3 : 5));
			}
		},

		isSmokesterTrigger: function () {
			// reset waiver premium
			this.customer.applicationPolicy.waiverPremium = null;
		},

		isSmokerYearTrigger: function () {
			// reset waiver premium
			this.customer.applicationPolicy.waiverPremium = null;
		},

		isSmokerTimeFrame: function () {
			return this.isSmokester ? this.isSmokerYear : 'never';
		},

		ftBenignTrigger: function () {
			this.initTravelCountries();
		},

		ftDurationTrigger: function () {
			this.initTravelCountries();
		},

		initTravelCountries: function () {
			var riskFactors = controller.customer.applicationPolicy.insured.riskFactors;

			if (riskFactors.ftBenign === false || riskFactors.ftDuration > 90) {
				if (riskFactors.ftCountries.length === 0) {
					riskFactors.ftCountries.push(new TravelCountry(this.customer));
				}
			} else {
				riskFactors.ftCountries = [];
			}
		},

		isForeignTravelAnticipated: function () {
            return this.customer.applicationPolicy.insured.person.residencyStatus === 'residentAlien' ||  this.anticipateForeignTravel;
		},

		isAviator: function () {
			return this.isPilot;
		},

		hasRiskyAvocations: function () {
			return this.hasAvocations;
		},

		weightLossFromExcerciseValues: function () {
			// Add or remove childbirth based on the gender of the insured
			var values = ['Exercise', 'Diet', 'Unknown'];
			if (this.customer.applicationPolicy.insured.person.gender === "2") { // Female
				values.push('ChildBirth');
			}
			return values;
		},

		// get aviation details for docuSign

		getLastFlightDate: function () {
			return Utils.dateToMY(this.lastFlightDate);
		},

		getSpecificFlyingDetailsForDocusign: function () {
			var details = "";
			if (this.flyOutsideUSDetails) {
				details += "Applicant flights outside the U.S.: \n" + this.flyOutsideUSDetails + "\n";
			}
			if (this.ratingOther) {
				details += "Applicant other ratings attained: \n" + this.ratingOther + "\n";
			}
			if (this.flyTypeOtherStr) {
				details += "Applicant nature of flying 'other': \n" + this.flyTypeOtherStr + "\n";
			}
			if (this.flyAircraftTypeOtherDetails) {
				details += "Applicant additional aircraft flown: \n" + this.flyAircraftTypeOtherDetails + "\n";
			}
			if (this.militaryDutiesOther) {
				details += "Applicant other military duties: \n" + this.militaryDutiesOther + "\n";
			}
			if (this.militaryFlyAircraftTypeOther) {
				details += "Applicant pilots other military craft details: \n" + this.militaryFlyAircraftTypeOtherDetails + "\n";
			}
			return details;
		},
		getMilitaryHoursTotal: function () {
			if (this.pilotCategory == 'Military' && this.pilot == 'pilot') {
				return this.pilotTotalHrs;
			} else {
				return null;
			}
		},
		getCivHoursTotal: function () {
			if (this.pilotCategory == 'Private_Student' && this.pilot == "pilot") {
				return this.pilotTotalHrs;
			} else {
				return null;
			}
		},
		getCommHoursTotal: function () {
			if (this.pilotCategory == 'Commercial' && this.pilot == "pilot") {
				return this.pilotTotalHrs;
			} else {
				return null;
			}
		},
		getMilitaryHoursLast12: function () {
			if (this.pilotCategory == 'Military' && this.pilot == 'pilot') {
				return this.pilotLast12MonthsHrs;
			} else {
				return null;
			}
		},
		getCivHoursLast12: function () {
			if (this.pilotCategory == 'Private_Student' && this.pilot == "pilot") {
				return this.pilotLast12MonthsHrs;
			} else {
				return null;
			}
		},
		getCommHoursLast12: function () {
			if (this.pilotCategory == 'Commercial' && this.pilot == "pilot") {
				return this.pilotLast12MonthsHrs;
			} else {
				return null;
			}
		},
		getMilitaryHoursNext12: function () {
			if (this.pilotCategory == 'Military' && this.pilot == 'pilot') {
				return this.pilotNext12MonthsHrs;
			} else {
				return null;
			}
		},
		getCivHoursNext12: function () {
			if (this.pilotCategory == 'Private_Student' && this.pilot == "pilot") {
				return this.pilotNext12MonthsHrs;
			} else {
				return null;
			}
		},
		getCommHoursNext12: function () {
			if (this.pilotCategory == 'Commercial' && this.pilot == "pilot") {
				return this.pilotNext12MonthsHrs;
			} else {
				return null;
			}
		},
		getCivCrewLast12: function () {
			if (this.pilotCategory == "Private_Student" && this.pilot == "crew") {
				return this.crewMemberLast12MonthsHrs;
			} else {
				return null;
			}
		},
		getCommCrewLast12: function () {
			if (this.pilotCategory == "Commercial" && this.pilot == "crew") {
				return this.crewMemberLast12MonthsHrs;
			} else {
				return null;
			}
		},
		getMilCrewLast12: function () {
			if (this.pilotCategory == "Military" && this.pilot == "crew") {
				return this.crewMemberLast12MonthsHrs;
			} else {
				return null;
			}
		},
		getCivCrewNext12: function () {
			if (this.pilotCategory == "Private_Student" && this.pilot == "crew") {
				return this.crewMemberNext12MonthsHrs;
			} else {
				return null;
			}
		},
		getCommCrewNext12: function () {
			if (this.pilotCategory == "Commercial" && this.pilot == "crew") {
				return this.crewMemberNext12MonthsHrs;
			} else {
				return null;
			}
		},
		getMilCrewNext12: function () {
			if (this.pilotCategory == "Military" && this.pilot == "crew") {
				return this.crewMemberNext12MonthsHrs;
			} else {
				return null;
			}
		},


		// get avocation details for docuSign

		getAvoUnderwater: function () {
			return this.avScubaDiving ? true : false;
		},
		getAvoClimbing: function () {
			return this.avMountainClimbing ? true : false;
		},
		getAvoAerials: function () {
			if (this.avBalloning || this.avSkyDiving || this.avHangGliding || this.avBungee) {
				return true;
			}
			return false;
		},
		getAvoRacing: function () {
			if (this.avAutoRacing || this.avMotorcycleRacing || this.avMotorboatRacing) {
				return true;
			}
			return false;
		},
		getRacingDetails: function () {
			if (this.getAvoRacing) {
				return "see additional details sheet";
			}
		},
		getAvoRock: function () {
			if (this.getAvoClimbing) {
				if (this.avMCRated == false) {
					return true
				}
				return false;
			} else {
				return false
			}
		},
		getAvoMountain: function () {
			if (this.getAvoClimbing && this.avMCRated) {
				return true;
			}
			return false;
		},
		getAvoHangGlide: function () {
			return this.avHangGliding ? true : false;
		},
		getAvoHangGlideHeight: function () {
			if (this.avHangGlidingLow == "Yes") {
				return "Under 500 feet altitude";
			} else if (this.avHangGlidingLow == "No") {
				return "Over 500 feet altitude";
			} else {
				return "Unsure";
			}
		},
		getAvoHangGlideSoar: function () {
			if (this.avHangGlidingLow == "No") {
				return true;
			}
			return false;
		},
		getAvoNumTimesHangOrGlide: function () {
			if (this.avHangGliding || this.avSkyDiving) {
				if (this.avHangGlidingOften || this.avSKDInfrequent) {
					return "more than 25";
				} else {
					return "fewer than 25";
				}
			}
			return null
		},
		getAvoSkyDiving: function () {
			return this.avSkyDiving ? true : false;
		},
		getAvoBoatRacing: function () {
			return this.avMotorboatRacing ? true : false;
		},
		getAvoCycleRacing: function () {
			return this.avMotorcycleRacing ? true : false;
		},
		getAvoAutoRacing: function () {
			return this.avAutoRacing ? true : false;
		},
		getAvoRaceSpecific: function () {
			if (this.getAvoBoatRacing || this.avMotorcycleRacing || this.avAutoRacing) {
				return "See Additional Details"
			}
			return null
		},
		getSeeOtherDetails: function () {
			if (this.getAvoDetails.length > 24) {
				return "SEE OTHER DETAILS ON SUPPLEMENT FORM"
			}
			return false;
		},
		getAvoDetails: function () {
			var details = "Form A3320: Avocations \n",
					pip = "Proposed insured participates";

			if (this.avHangGlidingLow == "NotSure") {
				details += pip + " in potential hang glide soaring, answered 'Unsure'" + "\n";
			}

			if (this.avAutoRacing) {
				if (this.avARATV) {
					details += pip + " in auto racing includes ATV\'s" + "\n";
				}
				if (this.avARATV3Wheel) {
					details += "proposed insured\'s auto racing includes 3 wheeled ATV\'s" + "\n";

				}
				if (this.avARCrash) {
					details += "proposed insured's auto racing includes Auto Crash racing" + "\n";

					if (this.avARCDiveBomber) {
						details += "These races include Diver Bomber, Rollovers, and T-Bones" + "\n";

					}
					if (this.avARCDemolition) {
						details += "These races include Demolition, Destruction Derby, Figure '8' Demolition" + "\n";

					}
				}
				if (this.avARGoCart) {
					if (this.avARGCSprint) {
						details += "Proposed insured participates in Go Kart Racing of the Sprint style" + "\n";

					}
					if (this.avARGCEnduro) {
						details += "Proposed insured participates in Go Kart Racing of the Enduro style" + "\n";

					}
					if (this.avARGCFormula) {
						details += "Proposed insured participates in Go Kart Racing of the Formula Kart Experiment style" + "\n";

					}
				}
				if (this.avARGCMidget) {
					details += "Proposed insured participates in Midget Car Racing" + "\n";

				}
				if (this.avARGCMini) {
					details += "Proposed insured participates in Mini car racing" + "\n";

				}
				if (this.avAROffRoad) {
					if (this.avARORDesert) {
						details += "Proposed insured races 'off road Desert' (incl. Baja, Dune, Trail) - U.S. Only";

					}
					if (this.avARORRally) {
						details += "Proposed insured races long distance rally, US only";

					}
				}
			}
			if (this.avAROtherDetails) {
				details += this.avAROtherDetails + "\n";
			}
			if (this.avBalloning) {
				details += "Proposed Insured participates in ballooning" + "\n";

			}
			if (this.avBigGame) {
				details += "Proposed insured hunts big game" + "\n";

			}
			if (this.avBobsledding) {
				details += "Proposed insured bobsleds" + "\n";
			}
			if (this.avBoxing) {
				details += "Proposed insured boxes amateurly" + "\n";

			}
			if (this.avBoxingPro) {
				details += pip + "in professional boxing" + '\n';

			}
			if (this.avBungee) {
				details += pip + "in bungee jumping" + "\n";
			}
			if (this.avHeliSkiing) {
				details += pip + "in Heli-skiing" + "\n";
			}
			if (this.avMartialArts) {
				details += pip + "in martial arts, amateur or instructor" + "\n";
			}
			if (this.avMartialArtsPro) {
				details += pip + "in professional martial arts competition" + "\n";
			}
			if (this.avMotorboatRacing) {
				details += pip + "motorboat / powerboat racing" + "\n";

			}
			if (this.avMotorcycleRacing) {
				details += pip + "races motorcycles " + this.avMRType;
				if (this.avMRDrag) {
					details += " in drag races, dragster division racing, road, speedway, or tourist trophy racing, possibly outside of the U.S. \n";

				} else {
					details += "\n";

				}
			}

			if (this.avSkyDiving) {
				var soon = this.avSDSoon,
						frequent = this.avSKDInfrequent,
						danger = this.avSDAmateur;
				details += pip + "in skydiving, ultralight, etc." + " Plans to do so in the next two years: " + soon + ". Jumps fewer than 25 times a year: " + frequent +
						"Limited to amateur, USPA, no baton passing, no delayed chute openings: " + danger;
			}
			if (this.avScubaDiving) {
				var basic = this.avSDBasicCert,
						frequent = this.avSDInfrequent;

				if (this.avSDShallow) {
					details += pip + "in scuba dives under 100 feet in depth. " + "With limited certifications: " + basic + ". Over 50 times a year: " + frequent + "\n";
				} else {
					details += pip + "in scuba dives over 100 feet in depth. " + "With limited certifications: " + basic + ". Over 50 times a year: " + frequent + "\n";
				}
			}
			if (this.avOther) {
				for (i = 0; i < this.avOther.length; i++) {
					details += pip + i.detail + "done this frequently: " + i.frequency;

				}
			}

			return details;

		},

		// get foreignTravel details for docuSign

		getWhichCountriesFT: function () {
			if (this.anticipateForeignTravel) {
				if (this.ftBenign && this.ftCountries.length == 0 && this.ftDuration <= 90) {
					return "See section D"
				} else {
					return "See Additional Supplement"
				}
			}
			return null;
		},

		getLengthOfTravelDays: function () {
			if (this.anticipateForeignTravel) {
				if (this.ftCountries.length == 0 && this.ftDuration <= 90) {
					return "See section D"
				} else {
					return "See Additional Supplement"
				}
			}
			return null;
		},

		getAccompaniedFamily: function () {
			if (this.anticipateForeignTravel) {
				if (this.ftWithFamily) {
					return true;
				}
				return false;
			}
			return null;
		},

		getFTPurpose: function () {
			if (this.anticipateForeignTravel) {
				if (this.ftCountries.length == 0 && this.ftDuration <= 90) {
					return "See section D"
				} else {
					return "See Additional Supplement";
				}
			}
		},

		getFTdetails: function () {
            var details = '';

			if (this.anticipateForeignTravel && this.ftBenign === true && this.ftCountries.length === 0 && this.ftDuration <= 90) {
				details = "Travelling to Western Europe, Australia, Japan, South Korea, Canada, New Zealand or" + "\n Israel (excluding Gaza and the West Bank)" +
						"\n for " + this.ftDuration + " days. Reason: " + this.ftPurpose;
			} else if (this.anticipateForeignTravel && this.ftCountries.length > 0 || this.ftBenign === false) {
				details = "See Additional Supplement";
			}

            details += '\n' + controller.customer.applicationPolicy.insured.person.getResidencyAsset() + '\n';

			return details ? details: null;
		},

		//   Misc Medical Risk Factors
		getWeightLossDuetoExer: function () {
			if (this.weightLossFromExcercise == "Exercise") {
				return true
			}
			return false
		},
		getWeightLossDuetoChild: function () {
			if (this.weightLossFromExcercise == "ChildBirth") {
				return true
			}
			return false
		},
		getWeightLossDuetoDiet: function () {
			if (this.weightLossFromExcercise == "Diet") {
				return true
			}
			return false
		},
		getWeightLossDuetoUnknown: function () {
			if (this.weightLossFromExcercise == "Unknown") {
				return true
			}
			return false
		},


		//   DUI
		getInsuredAlcoholBool: function () {
			return this.mvDUIConvitions > 0 ? true : false;
		},


		//   Adding functions here because the mixin was unavailable in ci

		getOwnerPersonTestamentEstate: function () {
			if (this.customer.applicationPolicy.ownerDelegate == "ownerEstate") {
				return true;
			}
			return false;
		},

		getOwnerPersonTestamentInsured: function () {
			if (this.customer.applicationPolicy.ownerDelegate != "ownerEstate") {
				return true;
			}
			return false;
		},

		getHivAddyPref: function () {
			if (this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == "insured_address" ||
					this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == "insured_another_address") {
				return true;
			}			return false;
		},

		getHivHomeAddyName: function () {
			if (this.getHivAddyPref()) {
				return this.customer.applicationPolicy.insured.person.getFullName();
			}
			return '';
		},

		getHivAddyHomeStreet: function () {
			if (this.getHivAddyPref()) {

				if (this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == "insured_address") {
					var line1 = this.customer.applicationPolicy.insured.address.line1 + "," || "";
					var address = this.customer.applicationPolicy.insured.address.street + ", " +
							line1 + " " + this.customer.applicationPolicy.insured.address.city + ", " + this.customer.applicationPolicy.insured.address.state +
							" " + this.customer.applicationPolicy.insured.address.zip;
					return this.formatHIVAddress(address)
				} else if (this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == "insured_another_address") {
					var address = this.customer.applicationPolicy.insured.personalHistory.hivPositiveAddress;
					return this.formatHIVAddress(address);
				}

			}
			return ""
		},

		getHIVDRName: function () {
			if (this.getHivAddyPref() != true) {
				return this.customer.applicationPolicy.insured.personalHistory.hivPositiveAddressPPName || this.customer.applicationPolicy.insured.personalHistory.primaryPhysicianName || "";
			}
		},

		getHivDrAddyAndName: function () {
			if (this.getHivAddyPref() != true) {
				if (this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == "pp_address") {
					var altAddress = this.customer.applicationPolicy.insured.personalHistory.primaryPhysicianAddress;
					return altAddress
				} else {
					var altAddress = this.customer.applicationPolicy.insured.personalHistory.hivPositiveAddress;
					return this.formatHIVAddress(altAddress)
				}
			}

		},
		formatHIVAddress: function (address) {

			var address = address,
					newAddress = "",
					newLine = 0;

			var regexp = '/(New)|(new)|(Rhode)|(rhode)|(North)|(north)|(South)|(south)|(West)|(west)/g'

			if (address.length > 70) {
				address = address.split(" ");

				for (i = 0; i < address.length; i++) {
					if (i === address.length - 3 && address[i].search(regexp) !== -1) {
						newLine += 1;
						newAddress += " \n ";
					} else if (i === address.length - 2 && newLine < 1 && address[i - 3].search(regexp) == -1) {
						newAddress += " \n ";
					}
					newAddress += address[i] + " ";
				}
				return newAddress;
			} else {
				return address;
			}
		},

		/**
		 * For HIV Consent form mappings. Address follows the format:
		 * city, state (pp_address) OR
		 * line1, [line2,] city, state, zip (pp_another_address)
		 * Only for Physician address
		 */
		getHIVAddressType: function () {

            var hivPosAddy = this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress;
            var state = this.customer.applicationPolicy.insured.address.state;
            var type;

            if (hivPosAddy === 'pp_address' || hivPosAddy === 'pp_another_address') {
                type = 'pp';
            } else if (hivPosAddy === 'insured_address' || hivPosAddy === 'insured_another_address') {
                type = 'ins';
            } else if (hivPosAddy === 'state_health') {
                type = 'state';
            } else {
                type = 'oth'
            }

            // Specific for IA
            if (state === 'IA') {
                if (hivPosAddy === 'pp_address') {
                    type = 'pp';
                } else if (hivPosAddy === 'pp_another_address') {
                    type = 'oth'
                } else {
                    type = '';
                }
            }

            return type;
		},
        getHIVConsentDrName: function () {

            var state = this.customer.applicationPolicy.insured.address.state;
            var hivPosAddy = this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress;
            // States requiring only primary/alternate physician mapping
            var physicianExemptions = ['AZ', 'IA', 'KY', 'ME', 'MO', 'WI', 'KS', 'LA'];
            // States where HIV form can be sent to insured
            var insuredInclusion = ['VA'];
            var docName;

            if (hivPosAddy === 'pp_address') {
                docName =  this.customer.applicationPolicy.insured.personalHistory.primaryPhysicianName;
            } else if (hivPosAddy === 'pp_another_address') {
                docName =  this.customer.applicationPolicy.insured.personalHistory.hivPositiveAddressPPName;
            } else if (hivPosAddy === 'state_health') {
                docName = 'Your State Department of Health';
            } else  {
                docName = this.customer.applicationPolicy.insured.person.getFullName();
            }

            // Exceptions
            if(_.contains(physicianExemptions, state) && !(hivPosAddy === 'pp_address' || hivPosAddy === 'pp_another_address')) {
                docName = '';
            } else if (!_.contains(insuredInclusion, state) && (hivPosAddy === 'insured_address' || hivPosAddy === 'insured_another_address')) { // Exceptions
                docName = '';
            }


            return docName;
        },

		getHIVAddress: function () {

            var hivPosAddy = this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress;
            var state = this.customer.applicationPolicy.insured.address.state;
            var address = this.customer.applicationPolicy.insured.address;
            // States requiring only primary/alternate physician mapping
            var physicianExemptions = ['AZ', 'IA', 'KY', 'ME', 'MO', 'WI', 'KS', 'LA'];
            // States requiring no mapping for state health address
            var stateHealthExemptions = ['NH', 'RI', 'OR', 'UT', 'VT', 'VA', 'WV', 'WA'];
            // States where HIV form can be sent to insured
            var insuredInclusion = ['VA'];
            var hivAddress;

            if(hivPosAddy === 'pp_address') {
                hivAddress = this.customer.applicationPolicy.insured.personalHistory.getPrimaryPhysicianAddress();
            } else if(hivPosAddy === 'pp_another_address' || hivPosAddy === 'insured_another_address') {
                hivAddress = this.customer.applicationPolicy.insured.personalHistory.hivPositiveAddress;
            } else if(hivPosAddy === 'insured_address') {
                hivAddress = (address.street ? address.street  + ", " : "")
                    + (address.line1 ? address.line1 + ", " : "")
                    + (address.city ? address.city  : "")
                    + (address.state ? ", " + address.state  : "")
                    + ", "
                    + (address.zip ? address.zip  : "");
            } else {
                hivAddress = 'State Department of Health';
            }

            // Exemptions
            if(_.contains(physicianExemptions, state) && !(hivPosAddy === 'pp_address' || hivPosAddy === 'pp_another_address')) {
                hivAddress = '';
            } else if (_.contains(stateHealthExemptions, state) && hivPosAddy === 'state_health') {
                hivAddress = '';
            } else if (!_.contains(insuredInclusion, state) && (hivPosAddy === 'insured_address' || hivPosAddy === 'insured_another_address')) {
                hivAddress = '';
            }

            return hivAddress;

        },

		getHIVConsentDrNameNoStateHealth: function () {
			var drName = this.getHIVConsentDrName();
			return drName === 'Your State Department of Health' ? '' : drName;
		},

        /**
         * Return a concatenated string containing the name and address of the primary physician
         * @returns {string}
         */
        getHIVConsentDrNameAndAddress: function () {

            // Should results be sent to primary or other physician
            function reportToPhysician () {
                return _this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress === 'pp_address' ||
                    _this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress === 'pp_another_address';
            }

            var _this = this;

            var address;
            var drName = this.getHIVConsentDrName();
            var lines =  this.getHIVAddress().split(',');

            if(lines.length === 5) {
                // User correctly entered physician's address with line1 and line2 present
                address = drName + '\n' + lines[0] + ' ' + lines[1] + '\n' + lines[2] + ',' + lines[3] + '' + lines[4];
            } else if(lines.length === 4) {
                // User entered physician's address with only line1 present
                address = drName + '\n' + lines[0]+ '\n'+ lines[1]+ ',' + lines[2] + '' + lines[3];
            } else {
                // Address is primary physician's address
                address = drName + '\n' + lines[0] + ', ' + lines[1];
            }

            return reportToPhysician() ? address : '';
        },

        /**
         * Return a concatenated string containing the name and address of the state's department of health
         * @returns {string}
         */
        getHIVConsentStateDeptAndAddress: function () {
            // Should results be sent to the state health department primary
            function reportToStateHealthDept () {
                return _this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress === 'state_health';
            }

            var _this = this;

            return reportToStateHealthDept() ? 'Your State Department of Health' : '';
        },

		getHIVConsentDrAddress: function () {

			var address = this.getHIVAddress();

			var lines = address.split(',');
			if (lines.length >= 5) {
				return lines[0].concat(lines[1]);
			} else if (lines.length >= 4) {
				return lines[0];
			} else if (lines.length >= 2) {
				return address;
			} else {
				return '';
			}
		},
        getHIVConsentDrStreet: function () {

            var _this = this;

            var street;
            var lines = this.getHIVAddress().split(',');

            if(lines.length === 5) {
                // User corrected entered physician's address with line1 and line2
                street = lines[0] + '' + lines[1];
            } else if(lines.length === 4) {
                // User entered physician's address with line1 only
                street = lines[0];
            } else {
                // Primary physician's address is chosen
                street = '';
            }

            return street;
        },
		getHIVConsentDrCity: function () {

			var address = this.getHIVAddress();

			var lines = address.split(",");
			if (lines.length >= 3) {
				return lines[lines.length - 3].trim();

			} else if (lines.length >= 2) {
				return lines[lines.length - 2].trim();
			}
			else {
				return '';
			}
		},
		getHIVConsentDrState: function () {
			var address = this.getHIVAddress();

			var lines = address.split(",");
			if (lines.length >= 3) {
				return lines[lines.length - 2].trim();

			} else if (lines.length >= 2) {
				return lines[lines.length - 1].trim();
			}
			else {
				return '';
			}
		},
		getHIVConsentDrZip: function () {
			var address = this.getHIVAddress();

			var lines = address.split(",");
			if (lines.length >= 3) {
				return lines[lines.length - 1].trim();
			} else {
				return '';
			}
		},
		getHIVConsentDrAddressOrCityState: function () {

			var address = this.getHIVAddress();

			var lines = address.split(",");
			if (lines.length >= 4) {
				return lines[0] + (lines.length >= 5 ? "," + lines[1] : "");
			}
			return address;
		},
		isHIVResultReleasedToInsured: function () {
			if(this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress === 'insured_address' ||
					this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == 'insured_another_address') {
				return 'Yes';
			}

			return;
		},
		isHIVResultReleasedToPhysician: function () {
			if(this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress === 'pp_address' ||
					this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == 'pp_another_address') {
				return 'Yes';
			}

			return '';
		},
		isHIVResultReleasedToInsuredAndPhysician: function () {
			if(this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress === 'insured_address' ||
					this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == 'insured_another_address') {
				return 'AltSite';
			} else if(this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress === 'pp_address' ||
					this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress == 'pp_another_address') {
				return 'Physician';
			}
			return '';
		},

		getTLIRIssuingCo: function () {
			return 'MM';
		},

		getHavenProducerName: function () {
			return 'Haven Life Insurance Agency, LLC';
		}

	});

    TravelCountry.mixin(
    {

		nameValues: function(){
			return Assumptions.allCountries;
		},
		ftMexicoSpecificValues: function(){
			return this.mexicoValues;
		},

		// If travel country is other than Mexico, clear out any Mexico
		// specific cities
		nameTrigger: function(){
			if(this.name !== "Mexico"){
				this.ftMexicoSpecific = "";
			}
		},

		aRatedCountryValues: {type: Array, isLocal: true, value: Assumptions.aRatedCountries},
		bRatedCountryValues: {type: Array, isLocal: true, value: Assumptions.bRatedCountries},
		cRatedCountryValues: {type: Array, isLocal: true, value: Assumptions.cRatedCountries},
		mexicoValues: {type: Array, isLocal: true, value: Assumptions.mexicoRatedPlaces},

		forBusiness: function() {
			return this.purpose == 'Business/Work';// 'Pleasure', 'Business/Work'
		},

		forPleasure: function() {
			return this.purpose == 'Pleasure';// 'Pleasure', 'Business/Work'
		},

		toString: function() {
            return (this.ftMexicoSpecific ? this.ftMexicoSpecific + ', ' : '') + this.name + ' for ' + this.duration +
				' days' + (this.departureDate ? ' departing on ' + Utils.dateToMdy(this.departureDate) : '');
        }
    });

    var Financials = objectTemplate.create("Financials",
    {
		init: function(customer) {
			this.employerAddress = new Address();
			this.customer = customer;
		},
        employed:           {type: Boolean, rule: ["required"]},
		employedTrigger: function(){
			if(!this.employed){
				this.employerName = this.occupation = this.occupationCode = this.duties = null;
				this.employerAddress.reset();
			}
		},
		employedValues:     {type: Array, isLocal: true, value: ['true', 'false']},
		employedDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
        employerName:       {type: String, rule: ["required", "text"], length: 40, value: null},
        employerAddress:    {type: Address, rule: ["required"]},
        annualIncome:       {type: Number, rule: ["currencyZero", "required"], validate:"isWithin(0, 10000000)", value: null},
        getEmployedAnnualIncome: function () {return this.employed ? this.annualIncome : 0},
        getUnEmployedAnnualIncome: function () {return !this.employed ? this.annualIncome : 0},
        otherIncome:        {type: Number, rule: ["currencyZero", "required"], validate:"isWithin(0, 10000000)", value: null},
        getEmployedOtherIncome: function () {return this.employed ? this.otherIncome : 0},
        getUnEmployedOtherIncome: function () {return !this.employed ? this.otherIncome : 0},
        totalAssets:        {type: Number, rule: ["currency", "required"], validate:"isWithin(0, 10000000)", value: null},
        totalLiabilities:   {type: Number, rule: ["currency", "required"], validate:"isWithin(0, 10000000)", value: null},
        netWorth:           {type: Number, rule: ["currencyZero", "required"], validate:"isWithin(-10000000, 10000000)", value: null},
        getEmployedNetWorth: function () {return this.employed ? this.netWorth : 0},
        getUnEmployedNetWorth: function () {return !this.employed ? this.netWorth : 0},
		occupation:         {type: String, rule: ["text", "required"], length: 40, value: null},
        occupationValues:    function() {return _.map(this.occupationList, function (obj, key) {return {listValue: key, fieldValue: key}})},
		occupationTrigger: 	function(){
			var code = this.occupationList[this.occupation];
			this.occupationCode = code ? code : 2147483647;
		},
		occupationCode:         {type: String, rule: ["text"], length: 40, value: null},
		duties:				{type: String, rule: ["required", "text"] },

		/** occupation Generated code **/
		occupationList: 	{type: Object, isLocal:true, value: {"Accountant":2147483647,"Actor":2147483647,"Actor (performs own stunts)":2147483647,"Actuary":2147483647,"Adjuster":2147483647,"Administrator":2147483647,"Advertiser":2147483647,"Agency":2147483647,"Agent":2147483647,"Air Ambulance":2147483647,"Analyst":2147483647,"Anesthesiologist":2147483647,"Anesthetist":2147483647,"Announcer":2147483647,"Apprentice":2147483647,"Architect":2147483647,"Arranger":2147483647,"Artist":2147483647,"Asbestos Removal":2147483647,"Assembler":2147483647,"Assistant":2147483647,"Astronautics - Space Travel":2147483647,"Athlete - Wrestler":2147483647,"Athlete - Boxer":2147483647,"Athlete - Rodeo/Bronco/Bull Riding":2147483647,"Athlete - Other Professional Athlete":2147483647,"Attendant":2147483647,"Attorney":2147483647,"Auctioneer":2147483647,"Auditor":2147483647,"Baker":2147483647,"Bank Executive":2147483647,"Banker":2147483647,"Banking Professional":2147483647,"Barber":2147483647,"Bartender":2147483647,"Bartender (Gentleman's/Exotic Clubs)":2147483647,"Beautician":2147483647,"Bookkeeper":2147483647,"Border Patrol":2147483647,"Border Patrol (Mexico)":2147483647,"Brakeman":2147483647,"Bricklayer":2147483647,"Broker":2147483647,"Builder":2147483647,"Business Woman":2147483647,"Businessman":2147483647,"Business Owner":2147483647,"Butcher":2147483647,"Cabinet Maker":2147483647,"Captain":2147483647,"Carnival/Circus/Fair Performer":2147483647,"Carpenter":2147483647,"Cashier":2147483647,"Census Taker":2147483647,"Chef":2147483647,"Child":2147483647,"Chiropractor":2147483647,"Claims Examiner":2147483647,"Cleaner":2147483647,"Clergyman":2147483647,"Clerk":2147483647,"College Professor":2147483647,"Computer Programmer":2147483647,"Construction Laborer":"117","Construction Laborer - Iron & Steel Workers":2147483647,"Construction Foreman/Supervisor":2147483647,"Construction - Roofer":"754","Consultant":2147483647,"Contractor":2147483647,"Controller":2147483647,"Cook":2147483647,"Counselor":2147483647,"Custodian":2147483647,"Dancer":2147483647,"Dancer (Gentleman's/Exotic Club)":2147483647,"Data Scientist":2147483647,"Dentist":2147483647,"Designer":2147483647,"Director":2147483647,"Director Of Administration":2147483647,"Diver":2147483647,"Doctor":2147483647,"Draftsman":2147483647,"Driver":"249","Electrical Power Installer":"275","Electrical Power Installer (by Helicopter)":2147483647,"Electrician":"275","Engineer":2147483647,"Examiner":2147483647,"Executive":2147483647,"Farmer or Rancher (Laborer)":"318","Farmer or Rancher (Manager/Supervisor/Owner)":2147483647,"Firefighter (Municipal or Volunteer)":2147483647,"Fire & Smoke Jumper":2147483647,"Firefighter (Explosives/Munitions Plant)":2147483647,"Firefighter (Gas Wells)":2147483647,"Firefighter (Mining)":2147483647,"Firefighter (Nuclear Processing)":2147483647,"Firefighter (Oil)":2147483647,"Fireworks Manufacturing":2147483647,"Fisherman - back to shore at night":"856","Fisherman - stay out at night":"856","Fisherman - Alaska Crab":2147483647,"Flight Crew":2147483647,"Florist":2147483647,"Foreman":2147483647,"Funeral Director":2147483647,"Gardener":2147483647,"General":2147483647,"Geologist":2147483647,"Grocer":2147483647,"Guard":2147483647,"Gynecologist":2147483647,"Hairdresser":2147483647,"Handler":2147483647,"Homemaker":2147483647,"Housekeeper":2147483647,"Housewife":2147483647,"Importer":2147483647,"Inspector":2147483647,"Installer":2147483647,"Instructor":2147483647,"Insurance Agent":2147483647,"Investigator":2147483647,"Janitor":2147483647,"Jeweler":2147483647,"Journalist, Freelance":2147483647,"Journalist, Freelance (with Foreign Travel)":2147483647,"Laborer":2147483647,"Landscaper":2147483647,"Law Enforcement (Patrol/Office/Supervisor)":2147483647,"Law Enforcement (K-9)":2147483647,"Law Enforcement (Other)":2147483647,"Lawyer":2147483647,"Librarian":2147483647,"Lineman":2147483647,"Lumber":"864","Lumberjack":"864","Machinist":2147483647,"Mail Carrier":2147483647,"Maintenance":2147483647,"Manager":2147483647,"Manufacturer, Foreman":2147483647,"Manufacturing, Non-Foreman (Abrasives)":2147483647,"Manufacturing, Non-Foreman (Acids)":2147483647,"Manufacturing, Non-Foreman (Chemicals)":2147483647,"Manufacturing, Non-Foreman (Metals)":2147483647,"Manufacturing, Non-Foreman (Munitions)":2147483647,"Manufacturing, Non-Foreman (Plastics)":2147483647,"Manufacturing, Non-Foreman (Weaponry)":2147483647,"Marine Transportation/Shipping":2147483647,"Marine Transportation/Shipping (w/ Foreign Travel)":2147483647,"Mason":2147483647,"Mathematician":2147483647,"Meat Cutter":2147483647,"Mechanic":2147483647,"Medical Resident":2147483647,"Medical Student":2147483647,"Merchant":2147483647,"Metallurgist":2147483647,"Military":2147483647,"Millwright":2147483647,"Miner":"497","Minister":2147483647,"Mortician":2147483647,"Musician":2147483647,"Navigator":2147483647,"Nurse":2147483647,"Nurse's Aid":2147483647,"Nurse Practitioner":2147483647,"Office Worker":2147483647,"Officer":2147483647,"Optometrist":2147483647,"Other":2147483647,"Owner":2147483647,"Packer":2147483647,"Painter":2147483647,"Payroll Clerk":2147483647,"Performer":2147483647,"Performer (Gentleman's/Exotic Club)":2147483647,"Personnel":2147483647,"Pharmacist":2147483647,"Photographer":2147483647,"Physicial Therapist":2147483647,"Physician":2147483647,"Physician Assistant":2147483647,"Physicist":2147483647,"Pilot":2147483647,"Pipefitter":2147483647,"Planner":2147483647,"Plasterer":2147483647,"Plumber":2147483647,"Police Officer (Patrol/Office/Supervisor)":2147483647,"Police Officer (K-9)":2147483647,"Police Officer (Other)":2147483647,"Polisher":2147483647,"President":2147483647,"Presser":2147483647,"Principal":2147483647,"Printer":2147483647,"Processor":2147483647,"Producer":2147483647,"Professor":2147483647,"Programmer":2147483647,"Project Manager":2147483647,"Proprietor":2147483647,"Psychiatrist":2147483647,"Psychologist":2147483647,"Radiologist":2147483647,"Realtor":2147483647,"Receiver":2147483647,"Receptionist":2147483647,"Refuse Collector":"357","Garbage/Waste Collector":"357","Registrar":2147483647,"Repairman":2147483647,"Reporter":2147483647,"Retired":2147483647,"Roofer":"754","Sales":2147483647,"Sales Person":2147483647,"Scientist":2147483647,"Seamstress":2147483647,"Secretary":2147483647,"Self Employed":2147483647,"Serviceman":2147483647,"Shipper":2147483647,"Shoemaker":2147483647,"Social Worker":2147483647,"Statistician":2147483647,"Student":2147483647,"Stuntman/Stuntwoman":2147483647,"Supervisor":2147483647,"Surgeon":2147483647,"Surveyor":2147483647,"Tailor":2147483647,"Teacher":2147483647,"Technician":2147483647,"Technologist":2147483647,"Therapist":2147483647,"Trucker":"366","Truck Driver":"366","Typist":2147483647,"Underwriter":2147483647,"Unemployed":2147483647,"Upholsterer":2147483647,"Utilityman":2147483647,"Veterinarian":2147483647,"Vice President":2147483647,"Waiter":2147483647,"Server":2147483647,"Server (Gentleman's/Exotic Club)":2147483647,"Waiter (Gentleman's/Exotic Club)":2147483647,"Waitress":2147483647,"Waste Removal":"357","Waste Removal (Foreman/Supervisor)":2147483647,"Welder":2147483647,"Window Cleaner":2147483647,"Worker":2147483647}}
		/** occupation to here **/
    });

    var BrothersAndSisters = objectTemplate.create("BrothersAndSisters",
        {
            title: {type: String},
            status: {type: String},
            diedAt: {type: String, value: ""},
            causeOfDeath: {type: String, value: ""},
            init: function(title, status) {
                this.title = title || '';
                this.status = status || '';
            }
        }
    );


    var ApplicantQuery = objectTemplate.create("ApplicantQuery",
    {
        person:     {type: PersonQuery}
    });

    var Applicant = objectTemplate.create("Applicant",
	{
        clientInit: function () {
        },
        person:     {type: Person},
        address:    {type: Address},

		// Customer data elements  STILL USED IN MAIN LOGIC
		/*dob:            {isObsolete: true, type: Date, rule: ["DOB", "required"], value: null},
		dobTrigger:     function () {
				this.age = this.getAge();
                this.ageTrigger();
		},
		getAge:         function () {
			var thisYear = (new Date()).getFullYear();
			var thisMonth = (new Date()).getMonth();
			var thisDay = (new Date()).getDate();
			var bornYear = this.dob.getFullYear();
			var bornMonth = this.dob.getMonth();
			var bornDay = this.dob.getDate();
			return bornYear == thisYear || bornMonth > thisMonth ||
				((bornMonth == thisMonth) && bornDay > thisDay) ?
				thisYear - bornYear : thisYear - bornYear - 1;
		},*/
 		copyAddress: function(cust) {
			this.addressStreet = cust.addressStreet;
			this.addressLine1 = cust.addressLine1;
			this.addressLine2 = cust.addressLine2;
			this.addressCity = cust.addressCity;
			this.addressZip = cust.addressZip;
			this.addressState = cust.addressState;
		},

        phone:              {type: Phone},
        getCellPhone:       {type: Phone, body: function () {
            return this.phone.type == 'cell' ? this.phone : null;
        }},
        getWorkPhone:       {type: Phone, body: function () {
            return this.phone.type == 'work' ? this.phone : null;
        }},
        getHomePhone:       {type: Phone, body: function () {
            return this.phone.type == 'home' ? this.phone : null;
        }},

        /*age:		        {type: Number, value: 36, rule: ["numeric"], min: 18, max: 70,
            validate: "isWithin(18, 70)", value: null},
        ageTrigger: function () {
            this.dob = new Date();
            this.dob.setFullYear((new Date()).getFullYear() - this.age);
            this.customer.capitalNeeds.ageTrigger(this);
        },*/

        gender:     {type: String, rule: "required", value: null},

        genderValues: {isLocal: true, type: Object, value: {
            "male": "Male",
            "female": "Female"
        }},

        healthClass:     {type: String, value: "P+"},
        healthClassValues:   {isLocal: true, type: Array, of: String, value: ["P+",	"Pf", "R+", "Rg", "P+S", "PfS", "R+S", "RgS"]},
        healthClassDescriptions:   {isLocal: true, type: Object, value: {
            "P+":   "Preferred Plus",  // Ultra preferred
            "Pf":    "Preferred",      // Select preferred
            "R+":   "Regular Plus",    //
            "Rg":    "Regular",
            "P+S":   "Preferred Plus Smoker",
            "PfS":    "Preferred Smoker",  // Select preferred smoker
            "R+S":   "Regular Plus Smoker", // Smoker
            "RgS":    "Regular Smoker"

        }},

        weight:         {type: Number, value: null, rule: ["required", "numeric"], validate: "isWithin(50, 500)"},
        height:         {type: Number},
        heightFeet:     {type: Number, value: null ,rule: ["required", "numeric"], validate: "isWithin(1, 9)"},
        heightInches:   {type: Number, value: null ,rule: ["required", "numeric"], validate: "isWithin(0, 11)"},
        getHeight: function () {return this.heightFeet + "' " + this.heightInches + '"';},
        heightInchesTrigger: function() {
            this.height = this.heightFeet * 12 + this.heightInches;
        },
        heightFeetTrigger: function() {
            this.height = this.heightFeet * 12 + this.heightInches;
        },

        /**
         * ALl of the following fields are reserved until we decide what to do with Vantage policies
         * In the mean time they SHOULD NOT BE USED   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
         * All of the equivalent fields are in familyHistory, personalHistory
         */

	    // HIPPA / HIV
        hivSendTo:          {type: String, value: 'me'},
        hivSendToValues:    {isLocal: true, type: Object, value: {'me':'Me', 'doctor':'My doctor'}}, //'both': 'Both'}},
        doctorName:         {type: String},
        doctorAddress:      {type: Address},
        doctorAddressDependsOn: function () {return this.hivSendTo != 'me'},
        getMyHIVAddress:      {type: Address, body: function () {
            return this.hivSendTo != 'doctor' ? this.address : null;
        }},
        getDoctorHIVAddress:      {type: Address, body: function () {
            return this.hivSendTo != 'me' ? this.doctorAddress : null;
        }},

		turnedDown:         {type: Boolean, value: false},
		turnedDownValues:   {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

        /*step1Analysis: function () {
            console.log("Age " + this.age + "Ann Icomne " + this.annualIncome + "ZIP " + this.address.zip + "Gender "+ this.gender);
            if(this.age != null && this.annualIncome != null && this.address.zip != null && this.gender != null) {
                return true;
            }
        },*/
        healthClassNumber: {type: Number, value: 3},
        healthClassNumberValues:   {isLocal: true, type: Object, value: {
            0:   "Fair",
            1:   "Good",
            2:   "Very Good",
            3:   "Excellent"
        }},
        healthClassNumberDescriptions:   {isLocal: true, type: Object, value: {
            0:   "Your blood pressure or cholesterol levels are high, you should lose some weight or you have a history of medical conditions.  You aren’t in bad health, but you are squarely average.",
            1:   "You are in pretty good health although you may have somewhat high blood pressure or cholesterol and could stand to lose some weight. You may have some history of medical conditions.",
            2:   "You generally eat right, aren’t overweight and have good cholesterol and blood pressure levels, either with or without medication. You’re definitely in the top half of the population in terms of overall health.",
            3:   "Your cholesterol and blood pressure are normal, you aren't overweight, and don't have any medical conditions. A picture of perfect health.  Congrats, you are part of the healthiest 20%."
        }},

        healthClassNumberTrigger: function () {
            this.healthClass = ['Rg', 'R+', 'Pf', 'P+'][Math.round(this.healthClassNumber)] + (this.smoker ? 'S' : '');
        },
		healthRank: {isLocal: true, type: Object, value: {
			"P+":   4,
			"Pf":   3,
			"R+":   2,
			"Rg":   1,
			"P+S":   4,
			"PfS":   3,
			"R+S":   2,
			"RgS":   1
		}},

		bloodPressureKnown:             {type: Boolean, value: false},
		bloodPressureHigh:              {type: Boolean, value: false},
		bloodPressureRange:             {type: String, value: '0'},
		bloodPressureRangeChoices:      [0, 1, 2, 3],
		bloodPressureRangeChoiceValues: {isLocal: true, type: Object,
										 value:	{0:'Normal', 1:'Slightly High', 2:'High', 3:'Very High'}},
		bloodPressureSystolicRanges:    {isLocal: true, type: Object,
										 value: {'0':120, '1':140, '2':160, '3':180}},
		bloodPressureDystolicRanges:    {isLocal: true, type: Object,
										 value: {'0':80, '1':90, '2':100, '3':110}},
		bloodPressureSystolic:          {type: Number, rule: ["numeric"], value: 120},
		bloodPressureDystolic:          {type: Number, rule: ["numeric"], value: 80},
		bloodPressureMedicationUsed:    {type: Boolean, value: false},
		bloodPressureTreatedPeriod:     {type: Number, rule: ["numeric"], value: 0},
		bloodPressureControlledPeriod:  {type: Number, rule: ["numeric"], value: 0},
		bloodPressureRangeTrigger: function () {
			this.bloodPressureSystolic = this.bloodPressureSystolicRanges[this.bloodPressureRange];
			this.bloodPressureDystolic = this.bloodPressureDystolicRanges[this.bloodPressureRange];
		},
		bloodPressureDystolicTrigger: function () {this.bloodPressureSystolicTrigger()},
		bloodPressureSystolicTrigger: function () {
			for (var systolicRange = 0; systolicRange < 4; ++systolicRange)
				if (this.bloodPressureSystolic <= this.bloodPressureSystolicRanges[systolicRange + ""])
					break;
			for (var dystolicRange = 0; dystolicRange < 4; ++dystolicRange)
				if (this.bloodPressureDystolic <= this.bloodPressureDystolicRanges[dystolicRange + ""])
					break;
			this.bloodPressureRange = Math.max(systolicRange, dystolicRange)
		},
		getBloodPressureRating: function () {
			return this.bloodPressureHigh ?
				this.bloodPressureRange > 1 ?
					"Yes (" + this.bloodPressureRangeChoiceValues[this.bloodPressureRange].toLowerCase() + ")" : "Yes" :
						"No";
		},

		cholesterolKnown:               {type: Boolean, value: false},
		cholesterolHigh:                {type: Boolean, value: false},
		cholesterolLevel:               {type: Number, rule: ["numeric"], value: 200},
		cholesterolRange:               {type: Number, rule: ["numeric"], value: 0},
		cholesterolRangeChoices:        {isLocal: true, type: Array, value:[0, 1, 2, 3]},
		cholesterolRangeChoiceValues:   {isLocal: true, type: Object,
										 value: {0:'Normal', 1:'Slightly High', 2:'High', 3:'Very High'}},
		cholesterolLevelRanges:         {isLocal: true, type: Object, value: {'0':200, '1':220, '2':240, 3:300}},
		cholesterolRatioRanges:         {isLocal: true, type: Object, value: {'0':3.5, '1':5.5, '2':7, 3:7.5}},
		cholesterolRatio:               {type: Number, rule: ["numeric"], value: 5},
		cholesterolMedicationUsed:      {type: Boolean, value: false},
		cholesterolTreatedPeriod:       {type: Number, rule: ["numeric"], value: 0},
		cholesterolControlledPeriod:    {type: Number, rule: ["numeric"], value: 0},

		//http://www.heart.org/HEARTORG/Conditions/HighCholestoral/AboutHighCholestoral/Understanding-Blood-Pressure-Readings_UCM_301764_Article.jsp

		cholesterolRangeTrigger: function () {
			this.cholesterolLevel = this.cholesterolLevelRanges[this.cholesterolRange];
			this.cholesterolRatio = this.cholesterolRatioRanges[this.cholesterolRange];
		},
		cholesterolLevelTrigger: function () {this.cholesterolRatioTrigger()},
		cholesterolRatioTrigger: function () {
			for (var cholesterolLevel = 0; cholesterolLevel < 3; ++cholesterolLevel)
				if (this.cholesterolLevel <= this.cholesterolLevelRanges[cholesterolLevel])
					break;
			for (var cholesterolRatio = 0; cholesterolRatio < 3; ++cholesterolRatio)
				if (this.cholesterolRatio <= this.cholesterolRatioRanges[cholesterolRatio])
					break;
			if (!this.cholesterolHigh)
				return "No"
			this.cholesterolRange = Math.max(cholesterolLevel, cholesterolRatio);
		},
		getCholesterolRating: function () {
			return this.cholesterolHigh ?
				this.cholesterolRange > 1 ?
					"Yes (" + this.cholesterolRangeChoiceValues[this.cholesterolRange].toLowerCase() + ")" : "Yes" :
				"No";
		},
        // As long as we are not getting into details of tobacco this is the sole flag for tobacco use
		smoker:     {type: Boolean, value: false},
        smokerValues: {isLocal: true, type: Object, value:{'false': 'I do not use tobacco/nicotine', 'true':'I do use tobacco/nicotine'}}, // Tobacco
		smokerTrigger: function(){
			this.healthClass = ['Rg', 'R+', 'Pf', 'P+'][Math.round(this.healthClassNumber)] + (this.smoker ? 'S' : '');
		},

		cigarettesUsed:                 {type: Boolean, value: true},
		cigarettesQuantity:             {type: Number, rule: ["numeric"], value: 20, validate: "isWithin(1, 99)"},
		cigarettesPeriodLastUsed:       {type: Number, rule: ["numeric"], value: 0},

		cigarsUsed:                     {type: Boolean, value: false},
		cigarsQuantity:                 {type: Number, rule: ["numeric"], value: 1},
		cigarsPeriodLastUsed:           {type: Number, rule: ["numeric"], value: 0},

		pipeUsed:                       {type: Boolean, value: false},
		pipeQuantity:                   {type: Number, rule: ["numeric"], value: 20},
		pipePeriodLastUsed:             {type: Number, rule: ["numeric"], value: 0},

		chewingTobaccoUsed:             {type: Boolean, value: false},
		chewingTobaccoQuantity:         {type: Number, rule: ["numeric"], value: 20},
		chewingTobaccoPeriodLastUsed:   {type: Number, rule: ["numeric"], value: 0},

		nicotineGumUsed:                 {type: Boolean, value: false},
		nicotineGumQuantity:             {type: Number, rule: ["numeric"], value: 20},
		nicotineGumPeriodLastUsed:       {type: Number, rule: ["numeric"], value: 0},
		isSmoker: function () {
			return this.smoker && this.cigarettesUsed;
		},
		getSmokerSummary: function () {
			return this.smoker ? (!this.cigarettesUsed ? "No (cigar only)" : "Yes") : "No";
		},
		periodChoices: {isLocal: true, type: Array, value: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]},
		periodChoiceDescriptions: {isLocal: true, type: Object, value: {
			"0":"less than 6 months",
			"1":"6 months - 1 year",
			"2":"1-2 years",
			"3":"2-3 years",
			"4":"3-4 years",
			"5":"4-5 years",
			"6":"6-7 years",
			"7":"7-10 years",
			"8":"10-15 years",
			"9":"more than 15 years"
		}},
		chronicCondition:               {type: Boolean, value: false},
        familyHistory: {type: FamilyHistory},
        personalHistory: {type: PersonalHistory},
        riskFactors: {type: RiskFactors},
		existingPolicies: {type: ExistingPolicies},
        financials: {type: Financials},

		init: function(first, last, age, customer) {
			this.firstName = first ? first : "";
			this.lastName = last ? last : "";
			//this.age = age ? age : 30;
			this.customer = customer;

            // For new style data modelling
            this.person = new Person(customer);
            this.address = new Address(customer);
            this.phone = new Phone(customer, Phone.TYPES.mobile);
            this.personalHistory = new PersonalHistory(customer);
            this.familyHistory = new FamilyHistory(customer);
            this.riskFactors = new RiskFactors(customer);
			this.existingPolicies = new ExistingPolicies(customer);
            this.financials = new Financials(customer);
            this.ownerPerson = new Person(this.customer);
            this.premiumPayerPerson = new Person(this.customer);
            this.premiumPayerAddress = new Address(this.customer);
            this.premiumPayerPhone = new Phone(this.customer);
            this.doctorAddress = new Address(this.customer);
            this.ownerPersonResidentialAddress = new Address(this.customer);
            this.ownerPersonMailingAddress = new Address(this.customer);
            this.ownerEntity = new Entity(this.customer);
        },
		selectedQuote:      {type: Object},
		overrideAmount:     {type: Number, rule:["currency"], value: 0, validate:"isWithin(50000, 6000000)"},
        overrideAmountTrigger: function(){
            this.overrideAmount = this.customer.capitalNeeds.getCoverage(false);
        },
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
        _filterFamilyConditions: function(member, condition, conditionTypes) {
            return this.familyHistory.familyConditions.filter(function(fc) {
                return fc.member == member && fc.condition == condition &&
                    (!conditionTypes || conditionTypes.indexOf(fc.type) > -1);
            });
        },
        fatherHasHeartDisease: function() {
            return this._filterFamilyConditions('Father', 'HeartDisease');
        },
        fatherHasKidneyDisease: function() {
            return this._filterFamilyConditions('Father', 'KidneyDisease');
        },
        fatherHasSkinCancer: function() {
            return this._filterFamilyConditions('Father', 'Cancer', ['Melanoma', 'SkinCancer(non-Melanoma)']);
        },
		fatherHasBreastCancer: function() {
			return this._filterFamilyConditions('Father', 'Cancer', ['BreastCancer']);
		},
        fatherHasMaleSpecificCancer: function() {
            return this._filterFamilyConditions('Father', 'Cancer', ['ProstateCancer']);
        },
        fatherHasOtherCancer: function() {
            return this._filterFamilyConditions('Father', 'Cancer', ['BreastCancer', 'OvarianCancer', 'OtherCancer', 'NotSure']);
        },
        fatherDiedOfHeartDisease: function() {
            return this.familyHistory.fatherDiedOf == 'HeartDisease';
        },
        fatherDiedOfKidneyDisease: function() {
            return this.familyHistory.fatherDiedOf == 'KidneyDisease';
        },
        fatherDiedOfMaleSpecificCancer: function() {
            return this.familyHistory.fatherDiedOf == 'ProstateCancer';
        },
        fatherDiedOfSkinCancer: function() {
            return this.familyHistory.fatherDiedOf == 'SkinCancer';
        },
        fatherDiedOfOtherCancer: function() {
            return 'BreastCancer OtherCancers'.indexOf(this.familyHistory.fatherDiedOf) > -1;
        },
        motherHasHeartDisease: function() {
            return this._filterFamilyConditions('Mother', 'HeartDisease');
        },
        motherHasKidneyDisease: function() {
            return this._filterFamilyConditions('Mother', 'KidneyDisease');
        },
        motherHasSkinCancer: function() {
            return this._filterFamilyConditions('Mother', 'Cancer', ['Melanoma', 'SkinCancer(non-Melanoma)']);
        },
		motherHasBreastCancer: function() {
			return this._filterFamilyConditions('Mother', 'Cancer', ['BreastCancer']);
		},
		motherHasOvarianCancer: function() {
			return this._filterFamilyConditions('Mother', 'Cancer', ['OvarianCancer']);
		},
        motherHasFemaleSpecificCancer: function() {
            return this._filterFamilyConditions('Mother', 'Cancer', ['BreastCancer', 'OvarianCancer']);
        },
        motherHasOtherCancer: function() {
            return this._filterFamilyConditions('Mother', 'Cancer', ['ProstateCancer', 'OtherCancer', 'NotSure']);
        },
        motherDiedOfHeartDisease: function() {
            return this.familyHistory.motherDiedOf == 'HeartDisease';
        },
        motherDiedOfKidneyDisease: function() {
            return this.familyHistory.motherDiedOf == 'KidneyDisease';
        },
        motherDiedOfFemaleSpecificCancer: function() {
            return this.familyHistory.motherDiedOf == 'BreastorOvarianCancer';
        },
		motherDiedOfBreastCancer: function() {
			return this.familyHistory.motherDiedOf == 'BreastCancer';
		},
		motherDiedOfOvarianCancer: function() {
			return this.familyHistory.motherDiedOf == 'OvarianCancer';
		},
        motherDiedOfSkinCancer: function() {
            return this.familyHistory.motherDiedOf == 'SkinCancer';
        },
        motherDiedOfOtherCancer: function() {
            return 'OtherCancers'.indexOf(this.familyHistory.motherDiedOf) > -1;
        },
		sistersHaveBreastCancer: function() {
			return this._filterFamilyConditions('Sister', 'Cancer', ['BreastCancer']);
		},
		sistersHaveOvarianCancer: function() {
			return this._filterFamilyConditions('Sister', 'Cancer', ['OvarianCancer']);
		},
		smokedInTheLastYear: function() {
			return this.riskFactors.isSmokerYear == 'last12';
		},
        getInsuranceAge: function(asOfDate) {
            return this.person.getInsuranceAge(asOfDate);
        },
        getInsuranceAgeDate: function(asOfDate) {
            return this.person.getInsuranceAgeDate(asOfDate);
        },
        isTrue: function () {return true;},
        isFalse: function () {return false;},
        isBlank: function () {return ""}
  	});

	return {
        Applicant: Applicant,
        ApplicantQuery: ApplicantQuery,
        FamilyHistory: FamilyHistory,
        PersonalHistory: PersonalHistory,
        FamilyCondition: FamilyCondition,
        Financials: Financials,
        RX: RX,
		RiskFactors: RiskFactors,
        Diagnosis: Diagnosis,
		DiagnosisShort: DiagnosisShort,
		Surgery: Surgery,
		Avocation: Avocation,
		SpeedingTicket: SpeedingTicket,
		AccidentAtFault: AccidentAtFault,
		RecklessTicket: RecklessTicket,
		OtherMovingViolation: OtherMovingViolation,
		DrivingWhileSuspendedCon: DrivingWhileSuspendedCon,
		TravelCountry:  TravelCountry,
		ExistingPolicies: ExistingPolicies,
		ExistingPolicy: ExistingPolicy,
        BrothersAndSisters: BrothersAndSisters,

}
};

module.exports.Applicant_mixins = function (objectTemplate, requires)
{
    var Policy 			= requires.Policy.Policy;
	var CustomerQuery 	= requires.Customer.Customer;
	var PolicyQuery     = requires.Policy.PolicyQuery;
	var Applicant		= requires.Applicant.Applicant;
    var Person          = requires.Person.Person;
	var BrothersAndSisters = requires.Applicant.BrothersAndSisters;
    var LabRecords      = requires.Policy.LabRecords;
    var Utils           = requires.Utils.Utils;

    Applicant.mixin(
    {
		policiesGoneThruInitialUw: {type: Array, of: PolicyQuery, isLocal: true},

		getPoliciesGoneThruInitialUw: function() {
            var policy = Policy.getTableName('pol'),
                polInsuredId = Policy.getParentKey('insured', 'pol'),
                insured = Applicant.getTableName('ins'),
                insuredId = Applicant.getPrimaryKey('ins'),
                insPersonId = Applicant.getParentKey('person', 'ins'),
                person = Person.getTableName('per'),
                personId = Person.getPrimaryKey('per');

            return Policy
                .getKnex()
                .distinct('pol._id', 'pol.submittedAt')
                .select()
                .from(policy)
                .join(insured, insuredId, polInsuredId)
                .leftOuterJoin(person, personId, insPersonId)
                .where('per.SSN', '=', this.person.SSN)
                .whereNotNull('pol.tLICRateClass')
                .orderBy('pol.submittedAt', 'desc')
                .limit(5)
                .then(function(polIds) {
                    return PolicyQuery.getFromPersistWithQuery({'_id': {$in: _.pluck(polIds, '_id')}}).then(function(policies) {
                        return this.policiesGoneThruInitialUw = policies;
                    }.bind(this));
                }.bind(this));
		},
        getLabRecords: function() {
            var dt = Utils.offsetDate(Utils.now(), -6, 'months');

            var policy = Policy.getTableName('pol'),
                polInsuredId = Policy.getParentKey('insured', 'pol'),
                insured = Applicant.getTableName('ins'),
                insuredId = Applicant.getPrimaryKey('ins'),
                insPersonId = Applicant.getParentKey('person', 'ins'),
                person = Person.getTableName('per'),
                personId = Person.getPrimaryKey('per'),
                labRecords = LabRecords.getTableName('lab'),
                labRecordsId = LabRecords.getPrimaryKey('lab'),
                polLabRecordsId = Policy.getParentKey('labRecords', 'pol');

            return Policy
                .getKnex()
                .distinct('lab._id', 'lab.examDate')
                .select()
                .from(policy)
                .join(insured, insuredId, polInsuredId)
                .leftOuterJoin(person, personId, insPersonId)
                .leftOuterJoin(labRecords, labRecordsId, polLabRecordsId)
                .where('per.SSN', '=', this.person.SSN)
                .where('lab.examDate', '>=', dt)
                .orderBy('lab.examDate', 'desc')
                .limit(1)
                .then(function(labIds) {
                    return labIds.length > 0 ? LabRecords.getFromPersistWithId(labIds[0]._id) : null;
                }.bind(this));
        },
        getBrothersAndSisters: {type: Array, of: BrothersAndSisters, body: function () {
            var bs = [];

            if (this.familyHistory.brothersLiving != 'Nobiologicalbrothers')
                bs.push(new BrothersAndSisters("Brother(s)", this.familyHistory.brothersLiving));

            if (this.familyHistory.sistersLiving != 'Nobiologicalsisters')
                bs.push(new BrothersAndSisters("Sister(s)", this.familyHistory.sistersLiving));

			for (var i = bs.length; i < 2; i++) {
				bs.push(new BrothersAndSisters('', ''));
			}
            return bs;
        }},
        getSpouse: {type: Applicant, body: function () {
            return this == this.customer.primaryCustomer ?
                this.customer.alternateCustomer : this.customer.primaryCustomer;
        }},
        isFemaleAndPregnant: function () {return !this.person.isMale() && this.riskFactors.isPregnant},
        isFemaleAndMastectomy: function() {return !this.person.isMale() && this.personalHistory.hadMastectomy},
		hadMasProsOopherectomy: function(){
			return ( (this.person.isMale() && this.personalHistory.hasProstatectomy) || this.isFemaleAndMastectomy() );
		}
});
}
