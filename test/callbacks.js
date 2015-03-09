var test = require('tape');
var FormView = require('../ampersand-form-view');

function FakeField(opts) {
  opts = opts || {};

  this.valid = opts.valid === false ? false : true;
  this.name = opts.name || 'fake-field';
  this.value = opts.value || 'fake-value';
  this.parent = opts.parent || null;
  this.beforeSubmit = opts.beforeSubmit || function() {};
}
FakeField.prototype = {
  setValue: function(value) {
    this.value = value;
    this.updateParent();
  },

  setValid: function(valid) {
    this.valid = valid;
    this.updateParent();
  },

  updateParent: function() {
    if (this.parent) {
      this.parent.update(this);
    }
  },

  render: function() {
    if (!this.el) {
      this.el = document.createElement('div');
    }
    return this;
  },

  remove: function() {
  }
};

test('submitCallback', function(t) {
  var form = new FormView({
    submitCallback: function(data) {
      t.notEqual(data, undefined, 'should call submitCallback with data');
      t.end();
    }
  });
  form.render();

  form.handleSubmit(document.createEvent('Event'));
});

test('beforeSubmit', function(t) {
  var field = new FakeField({
    name: 'field',
    beforeSubmit: function() {
      t.equal(this, field, 'should call beforeSubmit on the field');
      this.value = 42;
    }
  });
  var form = new FormView({
    fields: [ field ],
    submitCallback: function(data) {
      t.equal(data.field, 42, 'should call submitCallback after beforeSubmit on the fields');
      t.end();
    }
  });
  form.render();
  form.handleSubmit(document.createEvent('Event'));
});

test('validCallback', function(t) {
  var field = new FakeField({valid: false});
  var count = 2;
  var form = new FormView({
    fields: [ field ],
    validCallback: (function(valid) {
      if (--count <= 0) {
        t.equal(valid, field.valid, 'should call validCallback twice');
        t.end();
      }
    })
  });
  form.render();
  field.setValid(true);
});

test('autoappend', function(t) {
  t.end();
});

test('clean', function(t) {
  var field = new FakeField({ name: 'some_field', value: '27' });
  var form = new FormView({
    fields: [ field ],
    clean: function(data) {
      t.equal(data.some_field, field.value, 'data should have the raw value from the field');
      data.some_field = Number(data.some_field);
      return data;
    },
  });
  var data = form.getData();
  t.equal(data.some_field, Number(field.value), 'getData should return cleaned data');
  t.plan(2);
  t.end();
});
