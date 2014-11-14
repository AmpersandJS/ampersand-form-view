/*$AMPERSAND_VERSION*/
var BBEvents = require('backbone-events-standalone');
var extend = require('extend-object');

var result = function (obj, prop) {
    if (typeof obj[prop] === 'function') return obj[prop]();
    return obj[prop];
};


function FormView(opts) {
    this.el = opts.el;
    this.validCallback = opts.validCallback || this.validCallback || function () {};
    this.submitCallback = opts.submitCallback || this.submitCallback || function () {};

    if (opts.data) this.data = opts.data;
    if (opts.model) this.model = opts.model;

    this.clean = opts.clean || function (res) { return res; };
    this.valid = false;
    this.preventDefault = opts.preventDefault === false ? false : true;
    this.autoAppend = opts.autoAppend === false ? false : true;

    // storage for our fields
    this._fieldViews = {};
    this._fieldViewsArray = [];

    // add all our fields
    this.render();

    (opts.fields || result(this, 'fields') || []).forEach(this.addField.bind(this));

    if (this.initialize) this.initialize();

    //defer till after returning from initialize
    setTimeout(function () {
        this.checkValid(true);
    }.bind(this), 0);
}


extend(FormView.prototype, BBEvents, {
    data: null,
    model: null,
    fields: null,

    addField: function (fieldView) {
        this._fieldViews[fieldView.name] = fieldView;
        this._fieldViewsArray.push(fieldView);
        if (this.fieldContainerEl) {
            fieldView.parent = this;
            fieldView.render();
            this.fieldContainerEl.appendChild(fieldView.el);
        }
    },

    removeField: function (name) {
        delete this._fieldViews[fieldView.name];
        this._fieldViewsArray.splice(this._fieldViewsArray.indexOf(field), 1);
        this.getField(name).remove();
    },

    getField: function (name) {
        return this._fieldViews[name];
    },

    setValid: function (now, forceFire) {
        var prev = this.valid;
        this.valid = now;
        if (prev !== now || forceFire) {
            this.validCallback(now);
        }
    },

    checkValid: function (forceFire) {
        var valid = this._fieldViewsArray.every(function (field) {
            return field.valid;
        });
        this.setValid(valid, forceFire);
        return valid;
    },

    beforeSubmit: function () {
        this._fieldViewsArray.forEach(function (field) {
            if (field.beforeSubmit) field.beforeSubmit();
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
        this._fieldViewsArray.forEach(function (field) {
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
        for (var key in this._fieldViews) {
            res[key] = this._fieldViews[key].value;
        }
        return this.clean(res);
    },

    render: function () {
        if (this.rendered) return;
        if (!this.el) {
            this.el = document.createElement('form');
        }
        if (this.autoAppend) {
            this.fieldContainerEl = this.el.querySelector('[data-hook~=field-container]') || this.el;
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.el.addEventListener('submit', this.handleSubmit, false);
        this.rendered = true;
    }
});

FormView.extend = function (obj) {
    var child = function () {
       FormView.apply(this, arguments);
    };

    extend(child.prototype, FormView.prototype);
    extend(child.prototype, obj);

    return child;
};

module.exports = FormView;
