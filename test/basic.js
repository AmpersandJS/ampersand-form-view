var test = require('tape').test;
var AmpersandModel = require('ampersand-model');
var AmpersandView = require('ampersand-view');
var AmpersandInputView = require('ampersand-input-view');
var AmpersandCheckboxView = require('ampersand-checkbox-view');
var AmpersandFormView = require('../ampersand-form-view');

var Model = AmpersandModel.extend({
    props: {
        text: 'string',
        textarea: 'string'
    }
});

var isCheckbox = function(el) {
    return el.type === 'checkbox';
};

var getView = function (opts) {
    var formOpts;
    opts = opts || {};
    formOpts = opts.form || {};
    var FormView = AmpersandFormView.extend({
        fields: function () {
            return [
                new AmpersandCheckboxView({
                    name: 'check',
                    value: true
                }),
                new AmpersandInputView({
                    name: 'text',
                    type: 'text',
                    value: 'Original value'
                }),
                new AmpersandInputView({
                    name: 'textarea',
                    type: 'textarea',
                    value: 'Original value'
                })
            ];
        }
    });

    // Create a View with a nested FormView.
    var View = AmpersandView.extend({
        template: '<form data-hook="test-form"></form>',
        render: function () {
            this.renderWithTemplate();
            this.form = new FormView({
                autoRender: formOpts.autoRender,
                el: this.queryByHook('test-form'),
                model: this.model,
                values: {
                    text: 'Overriden value'
                }
            });
            this.registerSubview(this.form);
            return this;
        }
    });

    var view = new View({
        model: new Model()
    });

    return view.render();
};

test('reset', function (t) {
    var view = getView({ form: { autoRender: true } });

    view.form._fieldViewsArray.forEach(function (field) {
        field.input.value = 'New value';
    });
    view.form.reset();
    view.form._fieldViewsArray.forEach(function (field) {
        var input = field.input;
        if (isCheckbox(input)) {
            return;
        }
        t.equal(input.value, 'Original value', input.name + ' field value should be original value');
    });

    t.end();
});

test('clear', function (t) {
    var view = getView({ form: { autoRender: true } });

    view.form._fieldViewsArray.forEach(function (field) {
        if (isCheckbox(field.input)) {
            field.setValue(true);
        } else {
            field.setValue('New value');
        }

    });
    view.form.clear();
    view.form._fieldViewsArray.forEach(function (field) {
        var input = field.input;
        if (isCheckbox(input)) {
            t.equal(field.value, false, input.name + ' field value should be unchecked');
        } else {
            t.equal(field.value, '', input.name + ' field value should be empty');
        }
    });

    t.end();
});

test('autoRender', function (t) {
    var view = getView({ form: { autoRender: false } });
    var form = view.form;
    t.ok(!form.rendered, 'form did not autoRender');
    t.ok(!form._fieldViewsArray[0].rendered, 'form field did not autoRender');
    t.end();
});

test('setValues', function(t) {
    var view = getView({ form: { autoRender: true }});
    var form = view.form;
    var checkField = form.getField('check');
    var newCheckValue = !checkField.value;
    var textField = form.getField('text');
    var newTextValue = 'newTextValue';

    t.equal(textField.value, 'Overriden value', 'setValues() updates fields on construction');

    form.setValues({
        check: newCheckValue,
        text: newTextValue
    });

    t.equal(checkField.value, newCheckValue, 'setValues() updates field [input type="checkbox"]');
    t.equal(textField.value, newTextValue, 'setValues() updates field [input type="text"]');
    t.end();
});

test('field value setter/getter', function(t) {
    var view = getView({ form: { autoRender: true }});

    t.throws(
        function() { view.form.getValue('invalidField'); },
        'getValue() errors when no field present'
    );
    t.throws(
        function() { view.form.setValue('invalidField', 1); },
        'setValue() errors when no field present'
    );

    t.equal(view.form.getValue('textarea'), 'Original value', 'getValue() extracts value from provided field');
    view.form.setValue('textarea', 'newValue');
    t.equal(view.form.getValue('textarea'), 'newValue', 'setValue() sets value on provided field');
    t.end();
});
