# ampersand-form-view

ampersand-form-view is a wrapper view for easily building complex forms on the clientside with awesome clientside validation and UX.

It would work quite well with backbone apps or anything else really, it has no external dependencies.

At a high level, the way it works is you define a view object (by making an object that following the <a href="http://ampersandjs.com/learn/view-conventions">simple view conventions</a> of ampersand).

That form can be given an array of field views.

These fields are also <a href="http://ampersandjs.com/learn/view-conventions">views</a> but just follow a few more conventions in order to be able to work with a our form view.

Those rules are as follows: 

- It maintains a `value` property that is the current value of the field.
- It should also store a `value` property if passed in as part of the config/options object when the view is created.
- It maintains a `valid` property that is a boolean. The parent form checks this to know whether it can submit the form or not.
- It has a `name` property that is a string of the name of the field.
- It reports changes to its parent when it deems appropriate by calling `this.parent.update(this)` **note that is passes itsef to the parent. You would typically do this when the `this.value` has changed or the `this.valid` has changed.
- When rendered by a form-view it the form view creates a `parent` property that is a reference to the containing form view.
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
            el: this.queryByHook('app-edit-form'),
            submitCallback: function (obj) {
                console.log('form submitted! Your data:', obj);
            },
            // this valid callback gets called (if it exists)
            // when the form first loads and any time the form
            // changes from valid to invalid or vice versa.
            // You might use this to disable the "submit" button
            // any time the form is invalid, for exmaple.
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
                    // an intial value if it has one
                    value: 'hello',
                    // this one takes an array of tests
                    tests: [
                        function (val) {
                            if (val.length < 5) return "Must be 5+ characters.";
                        }
                    ]
                })
            ]
        });

        // registering the form view as a subview ensures that
        // it`s `remove` method will get called when the parent
        // view is removed.
        this.registerSubview(this.form);
    }
});

var awesomeFormView = new AwesomeFormView();
awesomeFormView.render();
```

## API Reference

### reset `formView.reset()`

Calls reset on all fields in the form that have the method. Intended to be used to set form back to original state.


## Changelog

- 2.2.3 - Adding `reset`. Starting in on building API reference.

## credits

Created by [@HenrikJoreteg](http://twitter.com/henrikjoreteg)



## license

MIT

