var test = require('tape').test;
var AmpersandModel = require('ampersand-model');
var AmpersandView = require('ampersand-view');
var AmpersandInputView = require('ampersand-input-view');
var AmpersandFormView = require('../ampersand-form-view');

var Model = AmpersandModel.extend({
    props: {
        text: 'string',
        textarea: 'string'
    }
});

var getView = function (opts) {
    var formOpts;
    opts = opts || {};
    formOpts = opts.form || {};
    var FormView = AmpersandFormView.extend({
        fields: function () {
            return [
                // TODO: add an AmpersandCheckboxView.
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
                model: this.model
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
    var view = getView();

    view.form._fieldViewsArray.forEach(function (field) {
        field.input.value = 'New value';
    });
    view.form.reset();
    view.form._fieldViewsArray.forEach(function (field) {
        var input = field.input;
        t.equal(input.value, 'Original value', input.name + ' field value should be original value');
    });

    t.end();
});

test('clear', function (t) {
    var view = getView();

    view.form._fieldViewsArray.forEach(function (field) {
        field.input.value = 'New value';
    });
    view.form.clear();
    view.form._fieldViewsArray.forEach(function (field) {
        var input = field.input;
        t.equal(input.value, '', input.name + ' field value should be empty');
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
