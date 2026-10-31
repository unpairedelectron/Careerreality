# Layoff Hub manual verification

- Check mobile and desktop layouts; complete and reopen the first-day checklist share link. Confirm it contains checklist selections only, never cash or email inputs.
- Enter sample runway figures and verify the displayed estimate against available funds divided by monthly essentials.
- Open every company record; compare its status, event date, scale, publication date, and summary with the linked source. Keep rumours labelled unverified and out of alerts.
- Confirm the current Labour Codes FAQ links and dates before relying on the rights section. Do not state that Industrial Disputes Act rules apply to IT staff.
- With a verified Resend sender and a test inbox, request alerts, confirm once, try an expired/used link, unsubscribe from the email link, and confirm no alerts are sent after unsubscribe.
- For a source-checked event update, run `pnpm --filter @workspace/api-server run dispatch:layoff-alert -- <event-slug>` once. The dispatcher refuses rumour records and only targets confirmed subscribers who selected that company.
