# Implementation verification · 07 October 2026

## Environment and checks

Local macOS workspace; React 19 / TypeScript / Vite 8. Native Safari was used for rendered UI verification. `npm run build`, `npm run lint`, and `npm test` passed (117 tests across two suites). These tests cover protocol ordering, failure conditions, private-key packet exclusion, API gating, playback lifecycle, and workspace interactions.

## Observed browser interactions

- TLS/mTLS switching, Next, Play, Reset; complete mTLS playback reached API Response Received.
- Advanced switches between separate TLS 1.2 ECDHE and TLS 1.3 sequences.
- Certificate field selection updates explanation; chain playback reaches Certificate Trusted.
- Private-key inspector opens and closes with Escape.
- All five chapter routes render, including reciprocal trust architecture.
- Configuration store lines highlight their corresponding card; Copy displays Copied!; HTTP Client tab shows actual SSL bundle attachment.
- Untrusted CA preset disables the trust condition, stops the handshake, explains PKIX failure, and blocks API traffic.
- Dark theme survives reload. Safari native button rendering and root text/background contrast were corrected and rechecked after reload.
- Browser zoom triggers narrow responsive layout and working navigation drawer. Zoom was restored afterward.

## Design comparison ledger

Compared rendered screenshots with the five accepted image concepts.

| Point | Result / intentional difference |
| --- | --- |
| Shared shell | Retained header, five-chapter sidebar, active blue marker, level controls and TLS/mTLS switch. |
| Palette | Retained blue OneApp, purple ECAS, gold certificates, green trust and red private keys/errors. Dark mode adds readable theme variants. |
| Handshake | Retained diagram + explanation panel and bottom playback controls. Lucide rack icons are simpler than concept artwork. |
| Certificates | Retained hierarchy + field explorer + private-key comparison. Separate client/server issuing CAs make Issuer values consistent. Root anchor is explicitly local. |
| Architecture | Retained two identity/store containers and central green tunnel. Intermediate nodes and distinct chains add technical detail. |
| Java | Retained dark code editor with right-side store cards. Highlight uses a whole store block; four working tabs separate inbound HTTPS from outbound RestClient. |
| Failure lab | Retained conditions, red failure explanation and presets. A shared animated stepper replaces the concept's static numbered future-message diagram to support Previous/Next/Play consistently. |
| Spacing / text | Native Thai text and scalable cards replace generated-image text. Real content increases page height; additional explanations remain scrollable. |

Visual issues fixed during review: certificate arrow color, an unused ECAS trust-store connector in TLS mode, overlapping Trusted labels, API packet endpoints, dark text/background, and Safari dark button appearance.

## Limits

The website is a frontend learning simulation; it does not perform actual cryptographic validation or connect to ECAS. Desktop Safari and a zoom-induced narrow layout were observed. Exact 320/375/768 viewport measurements, physical mobile devices, browser console inspection, and automated axe checks were not verified: the in-app browser was unavailable and sandboxed Playwright Chrome launch was denied. Do not interpret unit tests as cross-browser/mobile certification.

Screenshots include native Safari chrome: [mTLS success](screenshots/mtls-success.jpg), [failure](screenshots/untrusted-ca.jpg), [dark theme](screenshots/dark.jpg).

## Diagram popup verification · 08 October 2026

Local macOS workspace at `http://127.0.0.1:5173/`. UI checks used native Safari and Chrome through Computer Use; no Playwright or additional browser packages were installed. The earlier report above describes the original app verification; this section records the new popup flow.

- Safari: all five chapter popups opened; Java SSL Bundle, HTTP Client, JVM Options, and Inbound HTTPS showed separate diagrams. Client Certificate selection and `OneApp → ECAS` chain direction appeared independently in the certificate popup.
- Safari: light and dark diagrams rendered with readable text and connectors. SVG wrapping was corrected to retain English words and segment Thai text. Failure Lab's Untrusted CA popup predicted `PKIX path building failed` before Start and showed a red blocker with dashed later steps.
- Safari: Tab moved focus into the explanation control; Escape and the close button dismissed the dialog and restored focus to its trigger. The modal accessibility tree excluded background app controls.
- Chrome: the iPhone SE preset verified **375 × 667 CSS pixels**, with vertical SVG flow, readable cards, a visible close button, and content scrolling within the dialog. The iPad Pro 13 preset verified **1032 × 1376 CSS pixels**, including the horizontal HTTP Client flow in dark mode. These are emulated viewports, not physical devices.
- Chrome DevTools showed no app errors or warnings during the observed load/popup/theme interactions (only Vite debug messages were hidden). No framework error overlay or missing SVG assets appeared.
- Temporary screenshot evidence was saved outside the repository: `/private/tmp/tls-mtls-mobile.png` and `/private/tmp/tls-mtls-http-client-dark.png`. Both capture rendered page content without browser chrome.

Automated checks: `npm run build`, `npm run lint`, and `npm test`. The 151 tests across three suites include all chapter/Java popup contexts, both certificate directions, version-specific flows, failure presets and first-blocker precedence, handshake/failure/chain pause and resume, repeated opening, cancel/backdrop/hash closure, focus/scroll restoration, and React StrictMode.

Limits: physical phones/tablets, exact 320/768 CSS-pixel viewports, Firefox, VoiceOver operation, and automated axe checks were not verified. Native screenshots and accessibility observations support the specific interactions above; jsdom tests do not certify native keyboard behavior across browsers.


## 08 October 2026 · Client / Server naming

- Renamed visible system names across all five chapters, diagram popups, concept explanations, failure messages, accessible controls, browser title and README. Chain direction labels now read Client → Server / Server → Client; internal direction values remain unchanged.
- Preserved certificate fixture values, filenames, hostnames, Java identifiers and environment variables. Inbound HTTPS explicitly explains that the app labelled Client serves as an HTTPS Server for incoming requests. AGENTS.md remains unchanged.
- Automated: `npm run build`, `npm run lint` and `npm test` passed; 151 tests across three suites. Existing tests cover TLS/mTLS, TLS 1.2/1.3, failure gating, playback pause/reset and diagram lifecycle.
- Native Safari at http://127.0.0.1:5173/: navigated all five chapters and opened/closed each diagram using Escape; inspected all four Java subtabs and their popups. Verified mTLS chain direction Client → Server selects client certificate and Server Trust Store while Certificate Explorer remains independent. Light certificate and dark inbound diagrams rendered with readable names; modal close control received focus.
- Chrome DevTools iPhone SE emulation, 375×667: header, Connect to Server and diagram button fit; handshake popup renders a vertical flow with Client → Server labels and closes with Escape. Console showed zero visible messages and No Issues during this check. Screenshot evidence was displayed in the session.
- Limits: no real mobile device or full browser matrix; native Safari console was not inspected. Existing screenshot files document the earlier naming and were retained as historical evidence.
