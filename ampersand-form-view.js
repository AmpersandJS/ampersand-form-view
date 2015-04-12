/*$AMPERSAND_VERSION*/
var View = require('ampersand-view');
var isFunction = require('lodash.isfunction');
var result = require('lodash.result');
var noop = function(){};

module.exports = View.extend({
    props: {
        'model': 'state',
        'rendered': {
            type: 'boolean',
            required: true,
            default: false
        }
    },
    derived: {
        data: {
            fn: function () {
                var res = {};
                for (var key in this._fieldViews) {
                    if (this._fieldViews.hasOwnProperty(key)) {
                        res[key] = this._fieldViews[key].value;
                    }
                }
                return this.clean(res);
            }
        },
        cache: false
    },
    initialize: function(opts) {
        opts = opts || {};
        this.el = opts.el;
        this.validCallback = opts.validCallback || this.validCallback || noop;
        this.submitCallback = opts.submitCallback || this.submitCallback || noop;
        this.clean = opts.clean || this.clean || function (res) { return res; };

        if (opts.model) this.model = opts.model;

        this.valid = false;
        this.preventDefault = opts.preventDefault === false ? false : true;
        this.autoAppend = opts.autoAppend === false ? false : true;

        // storage for our fields
        this._fieldViews = {};
        this._fieldViewsArray = [];

        // add all our fields
        (result(opts, 'fields') || result(this, 'fields') || []).forEach(this.addField.bind(this));

        if (opts.autoRender) {
            this.autoRender = opts.autoRender;
            // &-view requires this.template && this.autoRender to be truthy in
            // order to autoRender. template doesn't apply to &-form-view, but
            // we manually flip the bit to honor autoRender
            this.template = opts.template || this.template || true;
        }

        if (opts.values) this._startingValues = opts.values;
    },

    addField: function (fieldView) {
        this._fieldViews[fieldView.name] = fieldView;
        this._fieldViewsArray.push(fieldView);
        if (this.rendered) { this.renderField(fieldView); }
        return this;
    },

    removeField: function (name, strict) {
        var field = this.getField(name);
        if (strict && !field) {
            throw new ReferenceError('field name  "' + name + '" not found');
        }
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

    setValues: function (data) {
        var value, field;
        for (var name in data) {
            if (data.hasOwnProperty(name)) {
                field = this.getField(name);
                if (field && field.setValue) {
                    value = data[name];
                    field.setValue(value);
                }
            }
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
        this._fieldViewsArray.forEach(function (field) {
            field.remove();
        });
        return View.prototype.remove.call(this);
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
            this.submitCallback(this.data);
            return false;
        }
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
        if (this._startingValues) {
            // setValues is ideally executed at initialize, with no persistent
            // memory consumption inside ampersand-form-view, however, some
            // fieldViews don't permit `setValue(...)` unless the field view
            // itself is rendered
            this.setValues(this._startingValues);
            delete this._startingValues;
        }
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
    },

    getValue: function(name) {
        var field = this.getField(name, true);
        return field.value;
    },

    setValue: function(name, value) {
        var field = this.getField(name, true);
        field.setValue(value);
        return this;
    },

    // deprecated
    getData: function() {
        return this.data;
    }

});
