/*$AMPERSAND_VERSION*/
var Events = require('ampersand-events');
var isFunction = require('amp-is-function');
var extend = require('amp-extend');
var result = require('amp-result');


function FormView(opts) {
    opts = opts || {};
    this.el = opts.el;
    this.validCallback = opts.validCallback || this.validCallback || function () {};
    this.submitCallback = opts.submitCallback || this.submitCallback || function () {};
    this.clean = opts.clean || this.clean || function (res) { return res; };

    if (opts.data) this.data = opts.data;
    if (opts.model) this.model = opts.model;

    this.valid = false;
    this.preventDefault = opts.preventDefault === false ? false : true;
    this.autoAppend = opts.autoAppend === false ? false : true;
    opts.autoRender = opts.autoRender === false ? false : true;

    // storage for our fields
    this._fieldViews = {};
    this._fieldViewsArray = [];

    if (this.initialize) this.initialize.apply(this, arguments);

    // add all our fields
    (opts.fields || result(this, 'fields') || []).forEach(this.addField.bind(this));

    if (opts.autoRender) this.render();
}


extend(FormView.prototype, Events, {
    data: null,
    model: null,
    fields: null,
    clean: null,

    addField: function (fieldView) {
        this._fieldViews[fieldView.name] = fieldView;
        this._fieldViewsArray.push(fieldView);
        if (this.rendered) { this.renderField(fieldView); }
        return this;
    },

    removeField: function (name) {
        var field = this.getField(name);
        if (field) {
            field.remove();
            delete this._fieldViews[name];
            this._fieldViewsArray.splice(this._fieldViewsArray.indexOf(field), 1);
        }
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

    reset: function () {
        this._fieldViewsArray.forEach(function (field) {
            if (isFunction(field.reset)) {
                field.reset();
            }
        });
    },

    clear: function () {
        this._fieldViewsArray.forEach(function (field) {
            if (isFunction(field.clear)) {
                field.clear();
            }
        });
    },

    render: function () {
        if (this.rendered) return;
        if (!this.el) {
            this.el = document.createElement('form');
        }
        if (this.autoAppend) {
            this.fieldContainerEl = this.el.querySelector('[data-hook~=field-container]') || this.el;
        }
        this._fieldViewsArray.forEach(function (fV) { this.renderField(fV, true); }, this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.el.addEventListener('submit', this.handleSubmit, false);
        this.checkValid(true);
        this.rendered = true;
    },

    renderField: function (fieldView, renderInProgress) {
        if (fieldView.rendered || !this.fieldContainerEl) { return this; }
        if (!this.rendered && !renderInProgress) { return this; }
        fieldView.parent = this;
        fieldView.render();
        this.fieldContainerEl.appendChild(fieldView.el);
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
