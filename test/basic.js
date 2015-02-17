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

var getView = function () {

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

var getViewWithFormClean = function () {

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
		},
		clean: function(data) {
			data.text = data.text.toUpperCase();
			return data;
		}
	});

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
		model: new Model()
	});

	return view.render();
};

var getViewWithFormCleanOnInstance = function () {

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

	var View = AmpersandView.extend({
		template: '<form data-hook="test-form"></form>',
		render: function () {
			this.renderWithTemplate();
			this.form = new FormView({
				el: this.queryByHook('test-form'),
				model: this.model,
				clean: function(data) {
					data.text = data.text.toLowerCase();
					return data;
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

test('clean', function (t) {
	var view = getViewWithFormClean();

	var data = view.form.getData();
	t.equal(data.text, 'ORIGINAL VALUE', 'the returned data should be transformed by the clean function');
	t.end();
});

test('clean', function (t) {
	var view = getViewWithFormCleanOnInstance();

	var data = view.form.getData();
	t.equal(data.text, 'original value', 'the returned data should be transformed by the clean function');
	t.end();
});
