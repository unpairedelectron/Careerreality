# CTC / in-hand calculator — privacy

Salary and payroll values are entered and calculated in browser state. The calculator has no save button and should not place these values in a URL, analytics event, or application log. The route's query must not be preserved through sign-in redirects.

The project has not recorded a qualified privacy or tax review of every dependency and build-time analytics path. Do not describe the result as private beyond the verified client-side behavior, and do not send the inputs to an external tax service without a new consent and data-flow review.
