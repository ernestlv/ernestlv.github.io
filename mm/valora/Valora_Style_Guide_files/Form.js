module.exports.Form = function (objectTemplate, getTemplate) {
    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
    var Insurers    = getTemplate('./static/Insurers.js').Insurers;

    if (typeof(require) != 'undefined') { // These vars must be in global scope on browser or will end up undefined
        Q = require('q');
        _ = require('underscore');
    }

    var Form = objectTemplate.create('Form', {
        carrier: {type: String},
        name: {type: String, value: ''},
        templateId: {type: String},
        created: {type: Date},
        modified: {type: Date},
        saved: {type: Date},
        typeDescriptors:
            [ //we'd rather store pre-compiled patterns here, but for some reason we can't
                {typeName: 'App', templateNamePattern: '_App(?:_|$)'},
                {typeName: 'AppSupplement', templateNamePattern: '_Details(?:_|$)'},
                {typeName: 'Aviation', templateNamePattern: '_Aviation(?:_|$)'},
                {typeName: 'Avocation', templateNamePattern: '_Avocation(?:_|$)'},
                {typeName: 'ForeignTravel', templateNamePattern: '_Travel(?:_|$)'},
                {typeName: 'Bene', templateNamePattern: '_Bene(?:_|$)'},
                {typeName: 'Owner', templateNamePattern: '_Owner(?:_|$)'},
                {typeName: 'ACBRDisclosure', templateNamePattern: '_ADBR(?:_|$)'},
                {typeName: 'StateDisclosure', templateNamePattern: '_Disclosure_Statement(?:_|$)'},
                {typeName: 'HIPPA', templateNamePattern: '_HIPPA(?:_|$)'},
                {typeName: 'Packet', templateNamePattern: ''} //not a template, it's the combined
            ],

        init: function (id, name) {
            this.templateId = id;
            this.name = name;
            this.created = new Date();
            this.modified = new Date();
        },

        getType: function() { //NB that some forms have undefined type
            var t;
            for (var i = 0; i < this.typeDescriptors.length; ++i) {
                var desc = this.typeDescriptors[i];
                if (desc.templateNamePattern.length == 0) { continue; }
                var pattern = new RegExp(desc.templateNamePattern);
                if (pattern.test(this.name)) {
                    t = desc.typeName;
                    break;
                }
            }
            return t;
        }
    });

    var PackageForm = objectTemplate.create('PackageForm', {
        form:               {type: Form},
        formAlias:          {type: Form},
        conditionEntity:    {type: String},
        conditionFunction:  {type: String},
        includeForInsured:  {type: Boolean, value: false},
        order:              {type: Number, value: 1},

        init: function(package) {
            this.package = package;
        },

        getConditionEntity: function () {
            return (this.conditionEntity && this.conditionEntity != 'None' ? this.conditionEntity : null);
        },

        getConditionEntityName: function (suppressFunction) {
            if (suppressFunction) {
                return this.getPrefix() + this.getConditionEntity().replace(/customer/, '').replace(/\(\)/, '');
            } else {
                return this.getPrefix() + this.getConditionEntity().replace(/customer/, '');
            }
        },

        getConditionReference: function () {
            if (!this.getConditionEntity() || !this.conditionFunction || this.conditionFunction == 'None') {
                return 'true'; // Hack for when an entity does not exist
            } else {
                return  this.getPrefix() + (this.conditionEntity + '.' + this.conditionFunction).replace(/customer\./, '');
            }
        },

        getName: function (ix) {
            return this.form ? this.form.name : 'Form ' + ix;
        },

        isNeededFor: function(customer) {
            if (!this.getConditionEntity() || !this.conditionFunction || this.conditionFunction == 'None') {
                return true; // Hack for when an entity does not exist
            } else {
                with(customer) {
                    return eval ((this.conditionEntity + '.' + this.conditionFunction).replace(/customer\./, ''));
                }
            }
        }
    });

    var PackageMixin = {
        carrier:        {type: String, value: 'HAVE'},
        carrierValues:  function () {
            var values = {};
            for (var i in Insurers.companies) {
                if (Insurers.companies[i].active) {
                    values[i] = Insurers.companies[i].shortName;
                }
            }
            return values;
        },
        product:        {type: String},
        productValues:  function () {
            var values = {};
            for (var p in Assumptions.products) {
                values[p] = Assumptions.products[p].name;
            }
            return values;
        },
        state:          {type: String},
        stateValues:    {isLocal: true, type: Object, value: Assumptions.stateValues},
        inProduction:   {type: Boolean, value: false}
    };

    var PackageQuery = objectTemplate.create('PackageQuery', {});

    PackageQuery.getByState = function(state) {
        return PackageQuery.getFromPersistWithQuery({state: state});
    };

    PackageQuery.mixin(PackageMixin);

    var Package = objectTemplate.create('Package', {});
    Package.mixin(PackageMixin);
    Package.mixin({
        forms:          {type: Array, of: PackageForm, value: []},

        addForm: function () {
            var form = new PackageForm(this);
            form.order = this.forms.length;
            this.forms.push(form);
            return form;
        },
        upPackageForm: function (form) {
            this.checkOrder();
            var forms = this.getPackageForms();
            for (var ix = 0; ix < forms.length; ++ix) {
                if (ix > 0 && forms[ix] == form) {
                    var oldOrder = forms[ix - 1].order;
                    forms[ix - 1].order = form.order;
                    form.order = oldOrder;
                }
            }
        },
        downPackageForm: function (form) {
            this.checkOrder();
            var forms = this.getPackageForms();
            for (var ix = 0; ix < forms.length; ++ix) {
                if (ix < (forms.length - 1) && forms[ix] == form) {
                    var oldOrder = forms[ix + 1].order;
                    forms[ix + 1].order = form.order;
                    form.order = oldOrder;
                }
            }
        },
        checkOrder: function () {
            var forms = this.getPackageForms();
            for (var ix = 0; ix < forms.length; ++ix) {
                forms[ix].order = ix;
            }
        },
        getPackageForms: function () {
            var forms = this.forms;
            forms.sort(function (f1, f2) {
                return f1.order - f2.order;
            });

            return forms;
        },
        removePackageForm: function (form) {
            this.forms.splice(_.indexOf(this.forms, form), 1);
        },
        getFormsFor: function (customer, onlyForInsured) {
            var chosen = [];
            var promises = [];
            var forms = this.getPackageForms();
            for (var i = 0, len = forms.length; i < len; ++i) {
                if (onlyForInsured && !forms[i].includeForInsured) { continue; }
                var repCnt = forms[i].isNeededFor(customer);
                if (typeof repCnt == 'boolean') { repCnt = repCnt ? 1 : 0; }
                for (var rep = 0; rep < repCnt; ++rep) {
                    chosen.push(forms[i]);
                    promises.push(forms[i].fetchProperty('form'));
                    if (forms[i].formAliasPersistor.id) {
                        promises.push(forms[i].fetchProperty('formAlias'));
                    }
                }
            }
            if (promises.length == 0) { return Q([]); }
            return Q.all(promises).then( function() {
                for (var i = 0, len = chosen.length; i < len; i++) {
                    chosen[i] = {form: chosen[i].form, mappingForm: chosen[i].formAlias};
                }
                return Q(chosen);
            }.bind(this));
        },
        getName: function (ix) {
            return (this.product && this.state) ? this.product + '-' + this.state : 'New Package ' + ix;
        }
    });

    PackageForm.mixin({
        package:        {type: Package}
    });

    var FormField = objectTemplate.create('FormField', {
        init:       function (form, labelKey) {
            if (labelKey && labelKey.match(/([0-9]+)/)) {
                labelKey = labelKey.replace(/[0-9]+/, '*');
                this.repeats = RegExp.$1;
            }
            this.form = form;
            this.labelKey = labelKey;
        },

        form:       {type: Form},
        tabId:      {type: String},
        labelKey:   {type: String, value: ''},
        entity:     {type: String},
        booleanValue: {type: String},

        getEntity: function () {
            return (this.entity && this.entity != 'None' ? this.entity : null);
        },

        getPropertyName: function () {
            return this.getPrefix() + this.getEntity().replace(/customer/) + '.' + this.property;
        },

        property:   {type: String},

        getProperty: function () {
            return (this.property && this.property != 'None' ? this.property : null);
        },

        page:       {type: Number},
        order:      {type: Number},
        repeats:    {type: Number, value: 1}
    });

    var FormFieldText = FormField.extend('FormFieldText', {
        init: function (form, key) {FormField.call(this, form, key);}
    });

    var FormFieldSelect = FormField.extend('FormFieldSelect', {
        values:     {type: Array, of: String, value: []},
        descriptions: {type: Object, value: {}},
        value:      {type: String},
        init: function (form, key) {
            FormField.call(this, form, key);
        }
    });

    var FormFieldCheckbox = FormField.extend('FormFieldCheckbox', {
        selected:   {type: Boolean, value: false},
        init: function (form, key) {
            FormField.call(this, form, key);
        }
    });

    var FormFieldRadio = FormField.extend('FormFieldRadio', {
        selected:   {type: Boolean, value: false},
        key: {type: String, value: ''},
        value: {type: String, value: ''}
    });

    var FormFieldRadioGroup = FormField.extend('FormFieldRadioGroup', {
        buttons:    {type: Array, of: FormFieldRadio, value: []},
        init: function (form, key) {
            FormField.call(this, form, key);
        }
    });

    FormFieldRadio.mixin({
        formFieldRadioGroup: {type: FormFieldRadioGroup}
    });

    Form.mixin({
        fields:         {type: Array, of: FormField, value: []},
        fieldsByLabel:  {isLocal: true, type: Object, value: null},
        getFields: function () {
            if (this.field) { return this.field; }
            this.field = {};
            for (var ix = 0; ix < this.fields.length; ++ix) {
                var field = this.fields[ix];
                this.field[field.tabId] =  field;
            }
            return this.field;
        },
        addField: function(field) {
            this.fieldsByLabel[field.labelKey] = field;
            this.fields.push(field);
            return field;
        },
        getFieldByLabel: function (labelKey) {
            var repeats = 1;
            if (labelKey.match(/([0-9]+)/)) {
                labelKey = labelKey.replace(/[0-9]+/, '*');
                repeats = RegExp.$1;
            }
            if (!this.fieldsByLabel) {
                this.fieldsByLabel = {};
                for (var ix = 0; ix < this.fields.length; ++ix) {
                    this.fieldsByLabel[this.fields[ix].labelKey] = this.fields[ix];
                }
            }
            var field = this.fieldsByLabel[labelKey];
            if (field) {
                field.repeats = Math.max(field.repeats, repeats);
            }
            return field;
        }
    });

    return {
        Form: Form,
        FormField: FormField,
        FormFieldText: FormFieldText,
        FormFieldSelect: FormFieldSelect,
        FormFieldCheckbox: FormFieldCheckbox,
        FormFieldRadio: FormFieldRadio,
        FormFieldRadioGroup: FormFieldRadioGroup,
        PackageForm: PackageForm,
        Package: Package,
        PackageQuery: PackageQuery
    };
};
