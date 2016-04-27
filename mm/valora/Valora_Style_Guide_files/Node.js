/**
 * Encapsulates a row of meta data . This object can have child(ren) based upon
 * if the child appears when the object's property has a specific value.
 * This module returns either a generic Node or a specialization NoneNode/OtherNotSureNode
 * which adds more behavior.
 *
 * @returns {{Node: Node, NoneNode: *}}
 * @constructor
 */
module.exports.Node = function (objectTemplate, _getTemplate) {

    // This is to use SuperType template as the parent instead of the default
    // RemoteObjectTemplate
    if (typeof(require) === 'undefined') {
        objectTemplate = ObjectTemplate;
    }

    var Node = objectTemplate.create('Node', {

        id: {type: String},
        prop: {type: String},
        customProps: {type: Array, of:String}, // This a list of all the data model properties associated with a custom control
        requiredProps: {type: Array, of:String}, // This a list of properties associated with a custom control which are required (marked with 'yes')
        styleClass: {type: String},
        otherProp: {type: String},
        entity: {type: String},
        inNestedEntity: {type: Boolean},
        qText: {type: String},
        subProperty: {type: String},
        pronounLocked: {type: Boolean},
        validation: {type: String},
        level: {type: Number, value: 1}, // level from meta data, used to establish parent child
        uiLevel: {type: Number}, // level for UI (may not be the same as level in certain cases)
        showifExp: {type: String}, // Show this node when the parent value is this
        isShowing: {type: Boolean, value: false}, // Is the node currently showing?
        controlType: {type: String}, // radiogroup, text, autofill, label, checkbox, date, shortdate or custom
        type: {type: String}, // type of Property - multivalue, boolean, string, array
        arrayType: {type: String}, // If the type is Array, which type of Array?
        section: {type: String}, // Name of the section if this is a top level node
        topLevel: {type: Boolean},  // Containing sections are top level
        optional: {type: Boolean, value: false},  // If the control is optional or mandatory
        widths: {type: String}, // Mostly applies to radiogroup
        placeholder: {type: String},
        helpText: {type: String},
        fid:      {type: String}, // A unique string (with no periods) needed for autofill controls
        layout:   {type: String}, // Should this control be in its column?
        width:    {type: String}, // width of the column in terms of bootstrap's 12 column grid
        parentLevel1NodeId: {type: String}, // The top level node this node is contained within

        init: function (prop, options) {
            this.prop = prop;

            var opts = options || {};
            this.entity = opts.entity;
            this.inNestedEntity = opts.inNestedEntity ? true : false;
            this.styleClass = opts.styleClass;
            this.placeholder = opts.placeholder;
            this.customProps = opts.customProps ? opts.customProps.split(',') : null;
            this.pronounLocked = opts.pronounLocked ? true : false;
            this.section = opts.section;
            this.id = opts.id;
            this.qText = this.id != '0001' ? this.replaceNewLines(this.substitutePronouns(opts.qText)) : opts.qText;
            this.showifExp = opts.showifExp;
            this.otherProp = opts.otherProp;
            this.controlType = opts.controlType;
            this.type = opts.type;
            if(this.type) {
                this.arrayType = this.type.match(/array *of *([A-Za-z]*)/) ? RegExp.$1 : ''
            }
            this.section = opts.section;
            this.topLevel = this.section ? true : false;
            if (!this.topLevel) {
                this.level = Number(opts.level);
                this.uiLevel = opts.uiLevel >= 0 ? Number(opts.uiLevel) : this.level - 1;
            }
            this.optional = opts.required === 'no' ? true : false;
            this.requiredProps = opts.required ? opts.required.split(',') : null;
            this.widths = opts.widths ? opts.widths : '[2,4,6]';
            this.placeHolder = opts.placeHolder;
            this.helpText = opts.helpText;
            this.fid = opts.fid ? opts.fid : this.buildFid(this.prop);
            this.layout = opts.layout;
            this.width = opts.width;
            this.subProperty = opts.subProperty;
            this.validation = this.convertToValidationExpression(opts.validation);
            this.parentLevel1NodeId = this.id;
        },

        substitutePronouns: function (text) {
            if (this.pronounLocked) { return text; }
            if (text) {
                //uses markdown-style syntax for links (link text)[href]
                text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/, '<a href="$2" target="_blank">$1</a>');

                text = text.replace(/\bDo you\b/, '<b:doyou></b:doyou>');
                text = text.replace(/\bHave you\b/, '<b:haveyou></b:haveyou>');
                text = text.replace(/\bWere you\b/, '<b:wereyou></b:wereyou>');
                text = text.replace(/\bAre you\b/, '<b:areyou></b:areyou>');

                text = text.replace(/\bdo you\b/, '<b:doyoulc></b:doyoulc>');
                text = text.replace(/\bhave you\b/, '<b:haveyoulc></b:haveyoulc>');
                text = text.replace(/\bwere you\b/, '<b:wereyoulc></b:wereyoulc>');
                text = text.replace(/\bare you\b/, '<b:areyoulc></b:areyoulc>');

                text = text.replace(/\byou are\b/, '<b:youare></b:youare>');
                text = text.replace(/\byou\b/, '<b:you></b:you>');
                text = text.replace(/\byour\b/, '<b:your></b:your>');
                text = text.replace(/\bYour\b/, '<b:youruc></b:youruc>');

                text = text.replace(/\bthe owner dies\b/, '<b:ownerdies></b:ownerdies>');
                text = text.replace(/\bthe owner's\b/, '<b:owneryour></b:owneryour>');
                text = text.replace(/\bthe owner\b/, '<b:owneryou></b:owneryou>');
                text = text.replace(/\b__household__\b/, '<b:household></b:household>');
                text = text.replace(/\b__Household__\b/, '<b:householduc></b:householduc>');


                // Special treatment for your. If there is a pronoun before the "your", replace your with
                // their
                var yourIndex = text.indexOf('<b:your></b:your>');
                if (yourIndex > 0) {
                    // Is there a preceding pronoun?
                    var labelSub = text.substr(0, yourIndex + 1);

                    if (labelSub.match(/b:/)) {
                        text = text.replace(/<b:your><\/b:your>/g, '<b:their></b:their>');
                    }
                }
            }
            return text;
        },

        replaceNewLines: function(text){
            return text ? text.replace(/[\r\n]/mg, '<br/><div class="app-indent"></div>') : '';
        },

        buildFid: function(){
            return this.prop.replace(/[\.\[\]]/g, "_");
        },

        convertToValidationExpression: function(validationData) {
            if (!validationData) { return '__V__'; } // cannot return empty string
            // as this turns off all validation (including validators on the model property)
            return validationData;
        },


        addChild: function (node, parentId) {
            this.children.push(node);
            node.parent = this;
            node.parentLevel1NodeId = parentId;
            return node;
        },

        shallowCopy: function () {
            var newNode = new Node(this.prop);

            newNode.entity = this.entity;
            newNode.inNestedEntity = this.inNestedEntity;
            newNode.customProps = this.customProps;
            newNode.requiredProps = this.requiredProps;
            newNode.qText = this.qText;
            newNode.showifExp= this.showifExp;
            newNode.controlType = this.controlType;
            newNode.type = this.type;
            newNode.arrayType = this.arrayType;
            newNode.section = this.section;
            newNode.topLevel = this.topLevel;
            newNode.optional = this.optional;
            newNode.widths = this.widths;
            newNode.placeHolder = this.placeHolder;
            newNode.helpText = this.helpText;
            newNode.fid = this.fid;
            newNode.parent = this.parent;
            newNode.children = this.children;
            newNode.layout = this.layout;
            newNode.width = this.width;
            newNode.resetLevel();

            return newNode;
        },

        setProp: function(prop){
            this.prop = prop;
            this.fid = this.buildFid();
        },

        isShown: function () {

            // Hate special handling
            if ((this.parent.controlType && this.parent.controlType.match(/iterate-collection/)) ||
                    (this.parent.type && !this.parent.type.match(/boolean|string|number|multivalue|date/i))) {
                return this.parent.isShown();
            }

            if (this.showifExp) {
                // eval in a nested scope
                try {
                    return (function(){
                        return eval(this.showifExp);
                    }.bind(this))();
                }
                catch (e) {
                    console.log("ERROR in isShown " + e);
                    return false;
                }
            } else {
                return true;
            }
        },

        isValid: function () {
            // There are two scenarios of how to validate -
            // 1. If all the immediate children of the current node are checkboxes, check
            // if at least one of them is selected and validate the selected checkbox and its children.
            // 2. Otherwise, validate the current node and its children.

            if(!this.isShown()){
                return true;
            }
            if (this.validateValue()) {

                // Validate children
                if (this.children.length > 0) {
                    // See if all children are checkboxes and validate if at least
                    // one is selected

                    // Check if there is None node or Other/Not sure node in the children list.
                    var lastNode = this.children[this.children.length-1];

                    if (lastNode instanceof NoneNode || lastNode instanceof OtherNotSureNode) {

                        // If the checkboxes are not displaying, no need to validate
                        if(!lastNode.isShown()){
                            return true;
                        }

                        // Find all the check boxes which have been checked
                        var cbsChecked = this.children.filter(function (item) {
                            return item.controlType === 'checkbox-basic' && item.validateValue();
                        });

                        // If there is at least one checkbox which is valid...
                        if (cbsChecked.length > 0) {
                            return cbsChecked.every(function (item) {
                                return item.isValid();
                            });
                        }
                        return false;
                    }
                    else {
                        // If we are dealing with an "iterate" control, special handling
                        // is required
                        if(this.controlType === 'iterate-collection'){
                            return this.validateIterate();
                        }
                        return this.children.every(function (item) {
                            return item.isValid();
                        });
                    }

                } else {
                    return true;
                }
            } else {
                return false;
            }
        },

        validateValue: function () {
            var propName = this.prop,
                customProps = this.customProps;

            if (propName && !this.optional) {
                if (customProps) {
                    return customProps.every(function (prop, i) {
                        if (!this.requiredProps || this.requiredProps[i] === 'yes') {
                            var customPropName = propName + '.' + prop;
                            return this.hasValue(customPropName);
                        } else {
                            return true;
                        }
                    }.bind(this));
                } else {
                    return this.hasValue(propName);
                }
            }
            return true;
        },

        hasValue: function(propName){
            // false is a valid value for radiogroups,
            // 0 is valid value for Numbers
            var isValid =
                    this.controlType.indexOf('radio-group') === 0 ?
                            eval('controller.' + propName + ' != null && typeof controller.' + propName + ' != "undefined" ? true : false') :
                            eval('controller.' + propName + ' === 0 || controller.' + propName  + '? true : false');

            if(!isValid){
                //console.log(propName + "is invalid");
            }



            return isValid;
        },

        validateIterate: function(){

            // For each element in the array, get the corresponding node from the view model,
            // if the node is shown, make sure each element has a value
            var arrayProp = this.prop,
                match = this.type.match(/array *of *([A-Za-z]*)/),
                arrayType = RegExp.$1;

            var arrayValues = eval('controller.' + arrayProp);
            if(arrayValues.length === 0){
                return true;
            }
            return arrayValues.every(function(arrayVal){
                var props = arrayVal.__template__.getProperties();
                var tempCondition = eval('controller.current' + arrayType + ' = new ' + arrayType + '()');

                for (var prop in props) {
                    // Check if the prop is being shown and if so validate it
                    var defineProp = props[prop];
                    if (!prop.match(/__/) && !defineProp.isLocal) {
                        tempCondition[prop] = arrayVal[prop];
                    }
                }

                return this.children.every(function (item) {
                    return item.isValid();
                });
            }.bind(this));
        },

        // Go through all children recursively and reset their underlying model properties
        resetChildren: function () {
            this.children.forEach(function (node) {
                node.resetVal();
                node.controlType !== 'iterate-collection' ? node.resetChildren() : '';
            });
        },

        resetVal: function () {
            var propName = this.prop;

            if(!propName){
                return;
            }
            // If the prop is part of a nested entity, the parent trigger would have
            // already cleared out this prop's value.
            if(this.inNestedEntity){
                return;
            }

            var customProps = this.customProps;
            var valueToSet = null;
            try {

                if(customProps) {
                    customProps.forEach(function (prop) {
                        var customPropName = propName + '.' + prop;
                        eval('controller.' + customPropName + ' = ' + valueToSet + '; if(typeof (controller.' + customPropName + 'Trigger) === "function"){ controller.' + customPropName + 'Trigger()}');
                    });
                } else {

                    if (this.controlType === 'iterate-collection') {
                        // Allow the trigger to do the reset
                        return;

                    } else if (this.controlType === 'checkbox-basic') {
                        valueToSet = false;
                    }
                    eval('controller.' + propName + ' = ' + valueToSet + '; if(typeof (controller.' + propName + 'Trigger) === "function"){ controller.' + propName + 'Trigger()}');
                }
                //console.log('controller.' + propName + ' = ' + valueToSet);
            }
            catch (e) {
                console.log("ERROR IN resetVal" + e);
            }
        },

        resetLevel: function(){
            // For nodes in an iterate control, the level needs to be reset as
            // special handling in UI is done for the iterate tag
            this.level = 2;
            this.uiLevel = 0;
        },

        find: function (prop) {

            if (this.prop === prop) {
                return this;
            }

            var retChild = _.find(this.children, function (child) {
                return child.find(prop) != null;
            });
            return retChild ? retChild.find(prop) : null;
        },

        findById: function (id) {
            if (this.id === id) {
                return this;
            }

            var retChild = _.find(this.children, function (child) {
                return child.findById(id) != null;
            });

            return retChild ? retChild.findById(id) : null;
        },

        findLevel1Node: function(){
            // Find the parent level1 node
            if(this.level === 1){
                return this;
            }
            var pNode = this.parent;
            while(pNode && pNode.level != 1){
                pNode = pNode.parent;
            }
            return pNode;
        },

        /**
         * Get the previous level 1 sibling by going to the parent node and getting the children.
         * If the current node happens to be the first child in a section, go to the previous section
         */
        findPrevLevel1Node: function () {

            var level1Node = this.findLevel1Node();
            var i = _.indexOf(level1Node.parent.children, level1Node);

            if(i>=0){
                if(i==0){
                    // Must be the first node in a section. Goto previous section and get
                    // last child
                    var topLevelNode = level1Node.parent;
                    var j = _.indexOf(topLevelNode.parent.children, topLevelNode);
                    if(j>0) {
                        return getLastNode(topLevelNode.parent.children[--j]);
                    }
                } else{
                    return level1Node.parent.children[--i];
                }
            }
            return null;

            function getLastNode(node) {
                if (!node.topLevel) {
                    return node;
                } else {
                    return node.children[node.children.length - 1];
                }
            }
        }

    });

    var NoneNode = Node.extend('NoneNode', {
        init: function (prop, options) {
            Node.call(this, prop, options);
        }
    });

    var OtherNotSureNode = Node.extend('OtherNotSureNode', {
        init: function (prop, options) {
            Node.call(this, prop, options);
        }
    });


    Node.mixin({
        parent: {type: Node},
        children: {type: Array, of: Node, value: []}
    });

    return {
        Node: Node,
        NoneNode: NoneNode,
        OtherNotSureNode: OtherNotSureNode
    };
};
