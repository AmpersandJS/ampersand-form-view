// Patch PhantomJS.
if (!Function.prototype.bind) Function.prototype.bind = require('function-bind');

require('./basic');
require('./callbacks');
