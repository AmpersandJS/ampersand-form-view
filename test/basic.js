var test = require('tape').test;
var AmpersandModel = require('ampersand-model');
var AmpersandView = require('ampersand-view');
var AmpersandInputView = require('ampersand-input-view');
var AmpersandFormView = require('../ampersand-form-view');


// Patch PhantomJS.
if (!Function.prototype.bind) Function.prototype.bind = require('function-bind');

var Model = AmpersandModel.extend({
    props: {
        text: 'string',
        textarea: 'string'
    }
});

var getView = function () {
    var FormView = AmpersandFormView.extend({
        fields: function () {
            return [
                // TODO: add an AmpersandCheckboxView.
                new AmpersandInputView({
                    name: 'text',
                    type: 'text'
                }),
                new AmpersandInputView({
                    name: 'textarea',
                    type: 'textarea'
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
            el: this.queryByHook('test-form'),
            model: this.model
          });
          this.registerSubview(this.form);

          return this;
        }
    });

    var view = new View({
        model: new Model(),
        el: document.body
    });

    return view.render();
};

test('reset', function (t) {
    var view = getView();

    view.form._fieldViewsArray.forEach(function (field) {
        field.input.value = 'Some text';
    });
    view.form.reset();
    view.form._fieldViewsArray.forEach(function (field) {
        var input = field.input;
        t.equal(input.value, '', input.name + ' field value should be empty');
    });

    t.end();
});
