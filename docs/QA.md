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
| Palette | Retained blue dog, purple cat, gold certificates, green trust and red private keys/errors. Dark mode adds readable theme variants. |
| Handshake | Retained diagram + explanation panel and bottom playback controls. Lucide rack icons are simpler than concept artwork. |
| Certificates | Retained hierarchy + field explorer + private-key comparison. Separate client/server issuing CAs make Issuer values consistent. Root anchor is explicitly local. |
| Architecture | Retained two identity/store containers and central green tunnel. Intermediate nodes and distinct chains add technical detail. |
| Java | Retained dark code editor with right-side store cards. Highlight uses a whole store block; four working tabs separate inbound HTTPS from outbound RestClient. |
| Failure lab | Retained conditions, red failure explanation and presets. A shared animated stepper replaces the concept's static numbered future-message diagram to support Previous/Next/Play consistently. |
| Spacing / text | Native Thai text and scalable cards replace generated-image text. Real content increases page height; additional explanations remain scrollable. |

Visual issues fixed during review: certificate arrow color, an unused cat trust-store connector in TLS mode, overlapping Trusted labels, API packet endpoints, dark text/background, and Safari dark button appearance.

## Limits

The website is a frontend learning simulation; it does not perform actual cryptographic validation or connect to cat. Desktop Safari and a zoom-induced narrow layout were observed. Exact 320/375/768 viewport measurements, physical mobile devices, browser console inspection, and automated axe checks were not verified: the in-app browser was unavailable and sandboxed Playwright Chrome launch was denied. Do not interpret unit tests as cross-browser/mobile certification.

Screenshot paths now contain refreshed Chrome page captures from the dog / cat verification below; the Safari observations above are historical: [mTLS success](screenshots/mtls-success.jpg), [failure](screenshots/untrusted-ca.jpg), [dark theme](screenshots/dark.jpg).

## Diagram popup verification · 08 October 2026

Local macOS workspace at `http://127.0.0.1:5173/`. UI checks used native Safari and Chrome through Computer Use; no Playwright or additional browser packages were installed. The earlier report above describes the original app verification; this section records the new popup flow.

- Safari: all five chapter popups opened; Java SSL Bundle, HTTP Client, JVM Options, and Inbound HTTPS showed separate diagrams. Client Certificate selection and `dog → cat` chain direction appeared independently in the certificate popup.
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
- Limits: no real mobile device or full browser matrix; native Safari console was not inspected. At that verification, existing screenshot files were retained as historical evidence. They have since been refreshed by the dog / cat verification below.


## 08 October 2026 · dog / cat naming

### Changes

- System names are now dog (outbound HTTPS Client, blue) and cat (HTTPS Server, purple) across all five chapters, popup diagrams, explanations, accessible controls, browser title and description, certificate fixtures, hostname, API paths, Java configuration, internal identifiers and CSS classes.
- Example material uses `cat.example.internal`, `cat-server.crt`, `dog-client.crt`, `dog-keystore.p12`, `dog-truststore.p12`, `/cat/api/...`, SSL bundle `cat`, `CatClientConfiguration`, `catClient` and `DOG_*` environment placeholders. The package and lockfile root name is `dog-cat-tls-learning`.
- ChainSide values are `cat → dog` / `dog → cat`; server concept IDs are `catTrustStore` / `catKeyStore`. References and existing test expectations were updated together.
- Protocol vocabulary remains intact: ClientHello, ServerHello, Client/Server Certificate, authentication EKUs and RestClient. Inbound HTTPS explicitly uses dog’s separate server identity (`dog-server-keystore.p12`); it does not describe cat as the owner of that identity.
- README and AGENTS.md now describe dog / cat. Previous verification notes use the current system names for consistency; their observed results and limitations remain historical.

### Environment and target flow

Local macOS workspace, Node.js v24.12.0, Vite at `http://127.0.0.1:5173/`. Native Chrome was controlled through the Computer Use browser extension. BrowserAct CLI was not installed; no browser dependencies were installed. The desktop viewport was 1680 × 843 CSS pixels; mobile was an explicit 375 × 667 CSS-pixel viewport override, reset after verification.

Target flow: load the workspace → navigate chapters and open diagrams → verify dog / cat ownership, certificate chain direction and copied Java examples → complete mTLS or stop at an untrusted CA before API traffic.

| Check | Observed result |
| --- | --- |
| Page identity | Correct local URL and `dog ↔ cat · TLS / mTLS Learning` title. |
| Meaningful rendering | All five chapters loaded with content and controls. |
| Framework overlay | No framework error overlay appeared in inspected pages or screenshots. |
| Console health | Chrome captured zero error/warning entries during the observed flows. |
| Screenshot evidence | Refreshed mTLS success, untrusted CA and dark inbound diagram images; added mobile page and popup captures. |
| Interactions | Chapter navigation, all chapter popups, all four Java tabs and popups, Copy feedback and copied content, both chain directions, mTLS playback, failure gating, themes and mobile navigation worked. |

### Interaction evidence

- All five chapter popups opened and closed with Escape. Tab moved focus from the modal close button to the explanation control; Escape restored focus to the diagram trigger.
- All four Java tabs showed the new example names. Copy displayed `Copied!`; clipboard readback confirmed renamed contents, including `CatClientConfiguration` in HTTP Client. The originally empty clipboard was restored afterward.
- Certificate Explorer displayed `CN = dog` and `URI: urn:company:dog`; server Subject/SAN used `cat.example.internal`. The `dog → cat` chain selected cat Trust Store, and `cat → dog` selected dog Trust Store. Explorer selection remained independent of chain direction.
- Connect to cat completed the full Beginner mTLS playback and displayed `API Response Received`, both trust indicators and secure API traffic.
- Failure Lab → Untrusted CA → Start Handshake stopped at `PKIX path building failed`, identified dog’s trust store in the fix and blocked API traffic.
- Light workspace and dark inbound HTTPS popup had readable names. Mobile header and Connect to cat fit without document horizontal overflow (`scrollWidth = innerWidth = 375`); popup flow was vertical with a visible close button. The navigation drawer opened, selected Certificates & CA and closed.
- React review: text, concept references and direction values changed; existing component boundaries, hook ordering, effect cleanup, focus behavior and semantic controls were retained. No dependencies were added.

### Automated checks

`npm run build`, `npm run lint` and `npm test` passed after the final source changes: 151 tests across three suites. Existing suites cover TLS/mTLS, TLS 1.2/1.3, chain direction, failure gating, pause/reset, dialogs and StrictMode. Case-insensitive search found no former system-name tokens in project source, tests, documents, static text assets or metadata, excluding dependencies and generated output.

### Current screenshots and limits

These captures replace the previous screenshot contents at the same paths:

- [mTLS success](screenshots/mtls-success.jpg)
- [Untrusted CA](screenshots/untrusted-ca.jpg)
- [Dark inbound HTTPS diagram](screenshots/dark.jpg)
- [Mobile workspace](screenshots/dog-cat-mobile.png)
- [Mobile handshake popup](screenshots/dog-cat-mobile-popup.png)

This round verifies Chrome desktop and the specified mobile emulation. Safari, Firefox, physical devices, other viewport sizes, VoiceOver and automated axe checks were not rerun. Java configuration and TLS remain fictional teaching examples; no real certificates, backend or network TLS connection were exercised.
