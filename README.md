
sprintf() function for JavaScript
=================================

Mimics sprintf() from perl. Implements most features and includes relevant
tests adapted from perl's sprintf.t.

The test script requires jQuery (by default, links to the Google CDN), but
the `sprintf()` function itself should work in plain JavaScript in most
browsers.

Bug reports of incompatibilities and patches fixing any problems or
implementing missing features are greatly appreceated.


DONE
----

See Perl's [sprintf documentation](http://perldoc.perl.org/functions/sprintf.html)
for details (or `perldoc -f sprintf`).

* %%, %c, %s, %d, %u, %o, %x, %e, %f, %g

* format parameter indexes (as in `printf '%2$d %1$d', 12, 34` -> "34 12")

* padding and alignment flags: SPACE, +, -, 0, #

* minimum width, maximum width, precision values including support for dynamic values via `*`



TODO
----

* Fix remaining test failures (`.0` cases)



NOT IMPLEMENTED
---------------

I don't really see much point in implementing these.

* bit size flags (h, j, l, ll, ...)

* The vector flag (v)

* backward compatibility conversions (%i, %D, %U, %O, %F)



LICENSE
-------

Copyright (C) 2014 Dean Serenevy. This work is licensed under a Creative
Commons Attribution 4.0 International License. See LICENSE file for
details.
