---
name: Offline architecture
description: Product and native-build constraints for the local-only edition.
---

Home Staff 360 is intentionally local-first and offline-only: the bundled
Capacitor web app is the source of truth, while profiles and operational data
remain on-device. There is no hosted server, database, authentication,
realtime collaboration, SMS/OTP, subscription, advertising, or remote sync
path.

**Why:** The product direction explicitly prioritizes privacy, local storage,
and operation without internet access.

**How to apply:** New features should use local storage or device capabilities.
Do not add API calls, hosted `server.url` settings, or account gates without a
new product decision.