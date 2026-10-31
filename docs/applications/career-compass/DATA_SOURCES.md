# Career Compass — data sources

- Salary evidence is requested from the first-party salary-benchmark API.
- Employer and layoff evidence use the first-party public company-signal and layoff-signal APIs.
- Role, city, CTC, and notice inputs are supplied by the user; CTC arithmetic runs locally.
- The cards preserve each upstream source's unavailable state rather than inventing a combined judgment. No independent external source is fetched by the Compass itself.
