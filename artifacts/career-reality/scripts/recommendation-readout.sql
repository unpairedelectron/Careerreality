-- CareerReality recommendation decision-path readout.
--
-- Run this as the SQL passed to queryAppAnalytics. It intentionally reads only
-- the approved recommendation dimensions plus aggregate counts:
--   visitor_month, source_route, destination_catalog_slug, events, visitors
--
-- A destination is reportable only after it has at least 10 events from at
-- least 5 approximate visitors. Lower-volume rows stay directional so a
-- single click cannot be presented as a winning recommendation. Visitors are
-- grouped by month because analytics visitor identifiers rotate monthly.

WITH event_properties AS (
  SELECT
    event_id,
    anyIf(string_value, data_key = 'catalog_slug' AND data_type = 1) AS catalog_slug
  FROM event_data
  WHERE event_name = 'next_action_selected'
    AND created_at >= now() - INTERVAL 30 DAY
  GROUP BY event_id
),
grouped AS (
  SELECT
    toStartOfMonth(we.created_at) AS visitor_month,
    we.url_path AS source_route,
    coalesce(nullIf(ep.catalog_slug, ''), '(missing_catalog_slug)') AS destination_catalog_slug,
    count() AS events,
    uniq(we.session_id) AS visitors
  FROM website_event AS we
  LEFT JOIN event_properties AS ep ON ep.event_id = we.event_id
  WHERE we.event_type = 2
    AND we.event_name = 'next_action_selected'
    AND we.created_at >= now() - INTERVAL 30 DAY
    AND NOT arrayExists(
      path -> we.url_path = path OR startsWith(we.url_path, concat(path, '/')),
      ['/career-reality-launch-video', '/__mockup', '/api']
    )
  GROUP BY visitor_month, source_route, destination_catalog_slug
)
SELECT
  visitor_month,
  source_route,
  destination_catalog_slug,
  events,
  visitors,
  if(events >= 10 AND visitors >= 5, 'reportable', 'directional') AS evidence_status
FROM grouped
ORDER BY events DESC, source_route ASC, destination_catalog_slug ASC
LIMIT 100;