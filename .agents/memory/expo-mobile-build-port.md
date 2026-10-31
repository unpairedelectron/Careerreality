---
name: Expo mobile build port
description: The mobile static bundle builder uses Metro port 8081 and can collide with another artifact workflow.
---

The mobile static bundle builder starts Metro on port 8081; another artifact occupying that port makes its non-interactive Expo process wait for a port choice and eventually time out.

**Why:** The workspace can run the mobile and mockup artifacts together, while the mobile build helper does not accept a configurable Metro port.

**How to apply:** Stop the workflow using port 8081 before running the mobile static build, then restart it after verification.