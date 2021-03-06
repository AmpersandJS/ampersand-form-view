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

test('preventDefault === false', function(t) {
    t.plan(1);

    var form = new FormView({
        preventDefault: false,
        submitCallback: function() {
            t.fail('submit callback called when it shouldn\'t be');
            t.end();
        }
    });
    form.render();
    var result = form.handleSubmit(document.createEvent('Event'));

    t.strictEqual(result, undefined, 'form submission not intercepted');
});

test('prevent submission on invalid', function(t) {
    t.plan(3);

    var field = new FakeField({
        name: 'field'
    });

    var form = new FormView({
        fields: [field],
        submitCallback: function() {
            t.fail('submit callback called when it shouldn\'t be');
            t.end();
        }
    });
    form.render();
    field.setValid(false);

    t.notOk(field.valid, 'field is not valid');
    t.notOk(form.valid, 'form is not valid');

    var result = form.handleSubmit(document.createEvent('Event'));

    t.strictEqual(result, false, 'form submission halted');
});

test('on submit', function(t) {
    var form = new FormView();

    form.on('submit', function(data) {
        t.notEqual(data, undefined, 'should trigger `submit` event with data');
        t.end();
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
    t.plan(2);
    var field = new FakeField({valid: false});
    var form = new FormView({
        fields: [ field ],
        validCallback: (function(valid) {
            t.equal(valid, field.valid, 'should call validCallback twice');
        })
    });
    form.render();
    field.setValid(true);
});

test('on change:valid', function(t) {
    t.plan(2);
    var field = new FakeField({valid: false});
    var form = new FormView({
        fields: [ field ]
    });
    form.on('change:valid', function(view, validBool) {
        t.equal(validBool, field.valid, 'should trigger `valid` event twice');
    });
    form.render();
    field.setValid(true);
});

test('verbose data', function (t) {
    var fields = [
        new FakeField({name: 'name.first', value: 'Michael'}),
        new FakeField({name: 'name.last', value: 'Mustermann'}),
        new FakeField({name: 'phone[0].type', value: 'home'}),
        new FakeField({name: 'phone[0].number', value: '1234567'}),
        new FakeField({name: 'phone[1].type', value: 'mobile'}),
        new FakeField({name: 'phone[1].number', value: '7654321'})
    ];
    var form = new FormView({ fields: fields });
    t.same(form.data, {
        name: {first: 'Michael', last: 'Mustermann'},
        phone: [
            {type: 'home', number: '1234567'},
            {type: 'mobile', number: '7654321'}
        ]
    }, 'verbose data should be correctly parsed');
    t.end();
});

test('bracketed field names', function(t) {
    var fields = [
        new FakeField({name: 'foobars[]', value: [1,2,3,4]}),
        new FakeField({name: 'name.first', value: 'Michael'}),
        new FakeField({name: 'name.last', value: 'Mustermann'}),
        new FakeField({name: 'phone[0].type', value: 'home'}),
        new FakeField({name: 'phone[0].number', value: '1234567'}),
        new FakeField({name: 'phone[1].type', value: 'mobile'}),
        new FakeField({name: 'phone[1].number', value: '7654321'})
    ];
    var form = new FormView({ fields: fields });
    t.same(form.data, {
        'foobars[]': [1,2,3,4],
        name: {first: 'Michael', last: 'Mustermann'},
        phone: [
            {type: 'home', number: '1234567'},
            {type: 'mobile', number: '7654321'}
        ]
    }, 'verbose data should be correctly parsed while maintaining support for legacy field names ending in empty square brackets');
    t.end();
});

test('clean', function(t) {
    var field = new FakeField({
        name: 'some_field',
        value: '27'
    });
    var FormViewExtendedWithClean = FormView.extend({
        clean: function(data) {
            t.equal(data.some_field, field.value, 'data should have the raw value from the field');
            data.some_field = Number(data.some_field);
            return data;
        }
    });
    var form = new FormViewExtendedWithClean({
        fields: [ field ]
    });
    var data = form.data;
    t.equal(data.some_field, Number(field.value), 'data should return cleaned data');
    t.end();
});

test('deprecated: getData', function(t) {
    var _warn = console.warn;

    console.warn = function(message) {
        t.ok(message);
        console.warn = _warn;
        t.end();
    };

    var form = new FormView();

    form.render();

    form.getData();
});
