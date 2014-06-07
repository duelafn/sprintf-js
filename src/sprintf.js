/*
  Copyright (C) 2014  Dean Serenevy
  This work is licensed under a Creative Commons Attribution 4.0 International License.
*/

/* USAGE:

   In your main application, execute:

       var sprintf = Sprintf.sprintf.bind(Sprintf);

   See test file "t/sprintf-test.html" for an example.


   Then, have at it:

       sprintf(':%.*s:', 3, "string");      // ':str:'

   May also pass arguments as a standard array:

       sprintf(':%.*s:', [ 3, "string" ]);  // ':str:'

*/
var Sprintf = (function() {
    return {

        "sprintf": function() {
            if (!arguments || arguments.length < 1 || !RegExp) { return ""; }
            var pieces = arguments[0].split('%');
            var res = pieces[0];
            var stash = { "at_index": 1 };

            var arg_list = arguments;
            if (2 == arguments.length && Object.prototype.toString.call(arguments[1]) === '[object Array]') {
                arg_list = [ arguments[0] ];
                arg_list = arg_list.concat(arguments[1]);
            }

            for (var i = 1; i < pieces.length; i++) {
                if (pieces[i] == "")
                    res += "%" + pieces[++i];
                else
                    res += this._sprintf(pieces[i], arg_list, stash);
            }
            return res;
        },

        "_sprintf_re": /^(\d+\$)?([ #\+\-0]+)?(\*|\d+|\*\d+\$)?(\.\d*|\.\*)?([sdfgGeExXbBouc])/,
        "_sprintf": function(str, args, stash) {
            var a = this._sprintf_re.exec(str);
            if (a) {
                var index = a[1] || '';     //  \d+\$        -  2$, 12$
                var flags = a[2] || '';     //  [ \+\-0]+    -  " +", "0-", " 0+-", ...
                var width = a[3] || '0';    //  \d+          -  6, 12
                var precision = a[4] || ''; //  \.\d+        -  .1, .23
                var type  = a[5];           //  char         - s, d, ...
                var rest  = str.substr(a[0].length);

                var prop = {}

                if (width && width == '*') {
                    if (stash.at_index >= args.length) { throw 'Missing argument in sprintf'; }
                    prop.width = this._sprintf_num(args[stash.at_index++], 'int');
                } else if (width && width.match(/^\*\d+\$$/)) {
                    var idx = parseInt(width.substr(1, width.length-2), 10);
                    if (idx >= args.length) { throw 'Missing argument in sprintf'; }
                    if (idx <= 0)           { throw 'Invalid conversion in sprintf: ' + args[0]; }
                    prop.width = this._sprintf_num(args[idx], 'int');
                } else {
                    prop.width = parseInt(width, 10);
                }

                if (prop.width < 0) {
                    prop.width = Math.abs(prop.width);
                    flags = "-" + flags;
                }

                prop.pad    = flags.indexOf('0') >= 0 ?    '0' : " ";
                prop.space  = flags.indexOf(' ') >= 0 ?  true  : false;
                prop.plus   = flags.indexOf('+') >= 0 ?  true  : false;
                prop.prefix = flags.indexOf('#') >= 0 ?  true  : false;
                prop.align  = flags.indexOf('-') >= 0 ? 'left' : 'right';
                prop.radix  = 10;
                prop.unsigned = false;

                if (precision) {
                    if (precision == '.*') {
                        if (stash.at_index >= args.length) {
                            throw 'Missing argument in sprintf';
                        }


                        prop.precision = this._sprintf_num(args[stash.at_index++], 'int');
                        if (prop.precision < 0) {
                            delete prop['precision'];
                        }
                    } else {
                        prop.precision = parseInt(precision.substr(1), 10);
                    }
                }

                if (index) {
                    index = parseInt(index.substr(0, index.length - 1), 10)
                } else {
                    index = stash.at_index++;
                }
                if (index >= args.length) {
                    throw 'Missing argument in sprintf';
                } else if (index <= 0) {
                    throw 'Invalid conversion in sprintf: ' + args[0];
                }
                prop.replacement = args[index];

                prop.type = type;

                switch (type.toLowerCase()) {
                case "s": repl = this._sprintf_align(prop.replacement, prop); break;
                case "d": repl = this._sprintf_d(prop.replacement, prop); break;
                case "f": repl = this._sprintf_fge(prop.replacement, prop); break;
                case "g": repl = this._sprintf_fge(prop.replacement, prop); break;
                case "e": repl = this._sprintf_fge(prop.replacement, prop); break;
                case "x": prop.unsigned = true; prop.radix = 16; repl = this._sprintf_d(prop.replacement, prop); break;
                case "b": prop.unsigned = true; prop.radix =  2; repl = this._sprintf_d(prop.replacement, prop); break;
                case "o": prop.unsigned = true; prop.radix =  8; repl = this._sprintf_d(prop.replacement, prop); break;
                case "u": prop.unsigned = true; repl = this._sprintf_d(prop.replacement, prop); break;
                case "c": repl = this._sprintf_c(prop.replacement, prop); break;
                }

                return repl + rest;
            }

            else {
                throw 'Invalid conversion in sprintf: ' + args[0];
            }
        },

        "_sprintf_num": function(value, func) {
            if (Object.prototype.toString.call(value) == '[object String]') {
                return (func == 'int') ? parseInt(value, 10) : parseFloat(value);
            } else {
                return value;
            }
        },

        "_sprintf_d": function(value, prop) {
            var num_value;
            // Crazy "~~ "operator", easiest way to get "round toward zero" operation
            try { value = (~~value).toString(); } catch(err) { }

            num_value = parseInt(value, 10);
            if (prop.unsigned) {
                num_value = num_value >>> 0;
            }

            if (10 != prop.radix || prop.unsigned) {
                value = num_value.toString(prop.radix);
                if ('x' == prop.type) { value = value.toLowerCase(); }
                if ('X' == prop.type) { value = value.toUpperCase(); }
            }

            if ("precision" in prop) {
                if  (num_value == 0 && prop.precision == 0) {
                    value = "";
                }
                while (value.length < prop.precision) {
                    value = "0".concat(value);
                }
                delete prop['precision'];
                prop.pad = ' ';
            }

            if (prop.prefix && num_value != 0) {
                switch (prop.type) {
                case 'b': value = "0b".concat(value); break;
                case 'B': value = "0B".concat(value); break;
                case 'x': value = "0x".concat(value); break;
                case 'X': value = "0X".concat(value); break;
                case 'o':
                    if ("0" != value[0]) { value = "0".concat(value); }
                    break;
                }
            }

            if      (prop.plus  && num_value >= 0 && !prop.unsigned) { value = "+".concat(value); }
            else if (prop.space && num_value >= 0 && !prop.unsigned) { value = " ".concat(value); }

            if ('left' == prop.align) { prop.pad = ' '; }

            if (value && prop.width && value[0].match(/[-+]/) && prop.pad == '0') {
                prop.width -= 1;
                prop.prepend_after_pad = value[0];
                value = value.substr(1);
            }

            return this._sprintf_align(value, prop);
        },

        "_sprintf_fge": function(value, prop) {
            var precision = 6;
            if ("precision" in prop) {
                precision = prop['precision'];
                delete prop['precision'];
            }

            value = this._sprintf_num(value, 'float');
            var num_value = value;

            switch (prop.type) {
            case "f": value = value.toFixed(precision); break;
            case "g": value = value.toPrecision(precision).toLowerCase().replace(/\.?0+($|[eE])/, "$1").replace(/([eE][+-])(\d)$/,"$10$2"); break;
            case "G": value = value.toPrecision(precision).toUpperCase().replace(/\.?0+($|[eE])/, "").replace(/([eE][+-])(\d)$/,"$10$2"); break;
            case "e": value = value.toExponential(precision).toLowerCase().replace(/([eE][+-])(\d)$/,"$10$2"); break;
            case "E": value = value.toExponential(precision).toUpperCase().replace(/([eE][+-])(\d)$/,"$10$2"); break;
            }

            if (prop.plus && num_value >= 0) {
                value = "+".concat(value);
            }

            return this._sprintf_align(value, prop);
        },

        "_sprintf_c": function(value, prop) {
            value = String.fromCharCode(value);
            return this._sprintf_align(value, prop);
        },

        "_sprintf_align": function(value, prop) {
            if ("precision" in prop && prop.precision < value.length) {
                value = value.substr(0, prop.precision);
            }

            while (value.length < prop.width) {
                value = (prop.align == 'left') ? value.concat(prop.pad) : prop.pad.concat(value);
            }

            if (prop.prepend_after_pad) {
                return prop.prepend_after_pad + value;
            }

            return value;
        }

    }
}());
