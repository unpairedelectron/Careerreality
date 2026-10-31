# Career Compass — technical spec

`/compass` uses a pure readout builder for offer, move, and stay cards. The current/offer CTC parser rejects blank, non-finite, negative, and unsupported values. A failed comparison reports that the difference is unavailable rather than coercing either value to zero.

Salary, company, and layoff evidence are passed into the readout as distinct labels. Inputs remain in page state; a user may explicitly save a decision note to the signed-in workspace. The route remains noindex while upstream-data and browser release checks are open.
