# ampersand-form-view

Lead Maintainer: [Michael Garvin](https://github.com/wraithgar)

# overview

ampersand-form-view is a wrapper view for easily building complex forms on the clientside with awesome clientside validation and UX.

It would work quite well with backbone apps or anything else really, it has no external dependencies.

At a high level, the way it works is you define a view object (by making an object that following the <a href="http://ampersandjs.com/learn/view-conventions">simple view conventions</a> of ampersand).

That form can be given an array of field views.

These fields are also <a href="http://ampersandjs.com/learn/view-conventions">views</a> but just follow a few more conventions in order to be able to work with our form view.

Those rules are as follows:

- It maintains a `value` property that is the current value of the field.
- It should also store a `value` property if passed in as part of the config/options object when the view is created.
- It maintains a `valid` property that is a boolean. The parent form checks this to know whether it can submit the form or not.
- It has a `name` property that is a string of the name of the field.
- It reports changes to its parent when it deems appropriate by calling `this.parent.update(this)` **note that it passes itsef to the parent. You would typically do this when the `this.value` has changed or the `this.valid` has changed.
- When rendered by a form-view, the form view creates a `parent` property that is a reference to the containing form view.
- It can optionally also define a `beforeSubmit` method. This gets called by the parent if it exists. This can be useful for stuff like a required text input that you don't want to show an error for if empty until the user tries to submit the form.


## install

```
npm install ampersand-form-view
```

## Example: Defining a form view

Here's how you might draw a form view as a subview.

```javascript
// we'll just use an ampersand-view here as an
// example parent view
var View = require('ampersand-view');
var FormView = require('ampersand-form-view');
var InputView = require('ampersand-input-view');

var AwesomeFormView = View.extend({
    template: '<div><p>App form</p><form data-hook="app-edit-form"></form></div>',
    render: function () {
        this.renderWithTemplate();
        this.form = new FormView({
            autoRender: true,
            el: this.queryByHook('app-edit-form'),
            submitCallback: function (obj) {
                console.log('form submitted! Your data:', obj);
            },
            // this valid callback gets called (if it exists)
            // when the form first loads and any time the form
            // changes from valid to invalid or vice versa.
            // You might use this to disable the "submit" button
            // any time the form is invalid, for example.
            validCallback: function (valid) {
                if (valid) {
                    console.log('The form is valid!');
                } else {
                    console.log('The form is not valid!');
                }
            },
            // This is just an array of field views that follow
            // the rules described above. I'm using an input-view
            // here, but again, *this could be anything* you would
            // pass it whatever config items needed to instantiate
            // the field view you made.
            fields: [
                new InputView({
                    name: 'client_name',
                    label: 'App Name',
                    placeholder: 'My Awesome App',
                    // an initial value if it has one
                    value: 'hello',
                    // this one takes an array of tests
                    tests: [
                        function (val) {
                            if (val.length < 5) return "Must be 5+ characters.";
                        }
                    ]
                })
            ],
            // optional initial form values specified by
            // {"field-name": "value"} pairs. Overwrites default
            // `value`s provided in your FieldView constructors, only
            // after the form is rendered. You can set form values
            // in bulk after the form is rendered using setValues().
            values: {
                client_name: 'overrides "hello" from above'
            }
        });

        // registering the form view as a subview ensures that
        // its `remove` method will get called when the parent
        // view is removed.
        this.registerSubview(this.form);
    }
});

var awesomeFormView = new AwesomeFormView();
awesomeFormView.render();
```

## FormView Options `FormView.extend(options)`
Standard <a href="http://ampersandjs.com/learn/view-conventions">view conventions</a> apply, with the following options added:
* `autoRender` : boolean (default: true)
    * Render the form immediately on construction.
* `autoAppend` : boolean (default: true)
    * Adds new nodes for all fields defined in the `fields` array.  Use `autoAppend: false` in conjuction with `el: yourElement` in order to use your own form layout.
* `fields` : array
    * Array of `FieldView`s.  If `autoAppend` is true, nodes defined by the view are built and appended to the end of the FormView.
* `submitCallback` : function
    * called on form submit
* `validCallback` : function
    *  this valid callback gets called (if it exists) when the form first loads and any time the form changes from valid to invalid or vice versa. You might use this to disable the "submit" button any time the form is invalid, for example.
* `clean` : function
    * Let's you provide a function which will clean or modify what is returned by `getData` and passed to `submitCallback`.

=======
## API Reference

### setValue `formView.setValue(name, value)`

Sets the provided value on the field matching the provided name.  Throws when invalid field name specified.


### getValue `formView.setValue(name)`

Gets the value from the associated field matching the provided name.  Throws when invalid field name specified.

### setValues `formView.setValues([values])`

For each key corresponding to a field's `name` found in `values`, the corresponding `value` will be set onto the FieldView.  Executes when the the formView is **rendered**.

```js
myForm = new FormView({
    fields: function() {
        return [
            new CheckboxView({
                name: 'startsTrue',
                value: true
            }),
            new CheckboxView({
                name: 'startsFalse',
                value: false
            }),
        ];
    }
});
myForm.render();

// bulk update form values
myForm.setValues({
    startsTrue: true,  //=> no change
    startsFalse: true  //=> becomes true
});
```

### reset `formView.reset()`

Calls reset on all fields in the form that have the method. Intended to be used to set form back to original state.

### clear `formView.clear()`

Calls clear on all fields in the form that have the method. Intended to be used to clear out the contents of the form.

## Properties
The following are FormView observables, thus emit "change" events:

- `valid` - the valid state of the form
- `data` - form field view values in `{ fieldName: value, fieldName2: value2 }` format

## Verbose forms

For verbose forms used to edit nested data, you can write field names as paths. Doing so, the `data` observable is nested according to the paths you specified so you can `set` or `save` this data to a state or collection more easily.

### Example
A form with a persons first and last name and an array of phone numbers, each of which has fields for *type* and *number*:

```javascript
var form = new FormView({
  fields: [
    new InputView({name: 'name.first', value: 'Michael'}),
    new InputView({name: 'name.last', value: 'Mustermann'}),
    new InputView({name: 'phone[0].type', value: 'home'}),
    new InputView({name: 'phone[0].number', value: '1234567'}),
    new InputView({name: 'phone[1].type', value: 'mobile'}),
    new InputView({name: 'phone[1].number', value: '7654321'})
  ]
});

console.log(form.data);
// {
//     name: {first: 'Michael', last: 'Mustermann'},
//     phone: [
//         {type: 'home', number: '1234567'},
//         {type: 'mobile', number: '7654321'}
//     ]
// }
```



## Special Events

- `submit` - triggered when a form is submitted. Returns the `data` of the form as the only argument

## Changelog

## changelog
- 6.0.0 - Upgrade to &-view 9.x
- 5.1.0 - Add `submit` and `valid` events
- 5.0.0 - Extend `ampersand-view` to add state, adds `setValues()`, `setValue()`, & `getValue()`.  Change to not render() during construction by default.
- 4.0.0 - (skipped)
- 3.0.0 - Initialize prior to render, and permit `autoRender: false`
- 2.2.3 - Adding `reset`. Starting in on building API reference.

## credits

Created by [@HenrikJoreteg](http://twitter.com/henrikjoreteg)



## license

MIT

