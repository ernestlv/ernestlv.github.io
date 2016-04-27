module.exports.counter = function(objectTemplate, _getTemplate) {

    if (typeof(require) != 'undefined') {
        Q = require('q');
    }

    var Sequence = objectTemplate.create('Sequence', {

        name: {type: String},
        startNumber: {type: Number},
        endNumber: {type: Number},
        lastNumber: {type: Number},

        init: function(name, startNumber, endNumber) {
            this.name = name;
            this.startNumber = startNumber;
            this.endNumber = endNumber;
            this.lastNumber = startNumber - 1;
        }
    });
    var Counter = {
        name: {
            policyNumber: function(prefix, suffix) {
                return (prefix ? (prefix + '_') : '') + 'PolicyNumber' + (suffix ? (suffix + '_') : '');
            }
        },
        createSequence: function(name, startNumber, endNumber) {
            return Sequence.getFromPersistWithQuery({name: name})
                .then(function(res) {
                    if (res.length > 0) { return Q(); }

                    return new Sequence(name, startNumber, endNumber).persistSave();
                });
        },
        getNextNumber: function(name) {
            return Q()
                .then(readSequence.bind(this))
                .then(incrementAndSave.bind(this))
                .fail(handleRetry.bind(this));

            function readSequence() {
                return Sequence.getFromPersistWithQuery({name: name});
            }
            function incrementAndSave (sequences) {
                sequences[0].lastNumber++;
                return sequences[0].persistSave().then(function () {
                    return sequences[0].lastNumber;
                });
            }
            function handleRetry(e) {
                if (e.message == 'Update Conflict') {
                    return this.getNextNumber.bind(this, name);
                } else {
                    throw e;
                }
            }
        },
        getLastNumber: function(name) {
            return Sequence.getFromPersistWithQuery({name: name}).then(function(seqs) {
                return seqs[0].lastNumber;
            });
        }
    };

    return {
        Counter: Counter,
        Sequence: Sequence
    };
};
