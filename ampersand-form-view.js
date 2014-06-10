var BBEvents = require('backbone-events-standalone');
var extend = require('extend-object');


function FormView(opts) {
    this.el = opts.el;
    this.validCallback = opts.validCallback || function () {};
    this.submitCallback = opts.submitCallback || function () {};
    this.clean = opts.clean || function (res) { return res };
    this.valid = false;
    this.preventDefault = opts.preventDefault === false ? false : true;
    this.autoAppend = opts.autoAppend === false ? false : true;

    // storage for our fields
    this.fields = {};
    this.fieldArray = [];

    // add all our fields
    this.render();

    (opts.fields || []).forEach(this.addField.bind(this));

    this.checkValid(true);
}


extend(FormView.prototype, BBEvents, {
    addField: function (fieldView) {
        this.fields[fieldView.name] = fieldView;
        this.fieldArray.push(fieldView);
        if (this.fieldContainerEl) {
            fieldView.parent = this;
            fieldView.render();
            this.fieldContainerEl.appendChild(fieldView.el);
        }
    },

    removeField: function (name) {
        delete this.fields[fieldView.name];
        this.fieldArray.splice(this.fieldArray.indexOf(field), 1);
        this.getField(name).remove();
    },

    getField: function (name) {
        return this.fields[name];
    },

    setValid: function (now, forceFire) {
        var prev = this.valid;
        this.valid = now;
        if (prev !== now || forceFire) {
            this.validCallback(now);
        }
    },

    checkValid: function (forceFire) {
        var valid = this.fieldArray.every(function (field) {
            return field.valid;
        });
        this.setValid(valid, forceFire);
        return valid;
    },

    beforeSubmit: function () {
        this.fieldArray.forEach(function (field) {
            return field.beforeSubmit();
        });
    },

    update: function (field) {
        this.trigger('change:' + field.name, field);
        // if this one's good check 'em all
        if (field.valid) {
            this.checkValid();
        } else {
            this.setValid(false);
        }
    },

    remove: function () {
        this.el.removeEventListener('submit', this.handleSubmit, false);
        var parent = this.el.parentNode;
        if (parent) parent.removeChild(this.el);
        this.fieldArray.forEach(function (field) {
            field.remove();
        });
    },

    handleSubmit: function (e) {
        this.beforeSubmit();
        this.checkValid();
        if (!this.valid) {
            e.preventDefault();
            return false;
        }

        if (this.preventDefault) {
            e.preventDefault();
            this.submitCallback(this.getData());
            return false;
        }
    },

    getData: function () {
        var res = {};
        for (var key in this.fields) {
            res[key] = this.fields[key].value;
        }
        return this.clean(res);
    },

    render: function () {
        if (this.rendered) return;
        if (!this.el) {
            this.el = document.createElement('form');
        }
        if (this.autoAppend) {
            this.fieldContainerEl = this.el.querySelector('[role=field-container]') || this.el;
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.el.addEventListener('submit', this.handleSubmit, false);
    }
});

module.exports = FormView;
