# @healthtwin/embed

Framework-agnostic partner embed for the HealthTwin capture experience.

## Web component (React not required by the host)

```html
<script type="module">
  import { defineHealthTwinCapture } from "@healthtwin/embed";
  defineHealthTwinCapture();
</script>

<health-twin-capture view="anterior" subject-id="partner-user-123"></health-twin-capture>

<script>
  document.querySelector("health-twin-capture")
    .addEventListener("healthtwin:observation", (e) => {
      // Every capture is emitted here — persist it in YOUR backend if you want
      // to remain the data controller. detail is a HealthTwin Observation.
      console.log(e.detail);
    });
</script>
```

- **Attributes:** `view` (`anterior` | `posterior`), `subject-id`.
- **Event:** `healthtwin:observation` (also `postMessage`'d to the parent frame for iframe embeds).
- **Advanced:** set `element.store` to a custom `LocalStore` (e.g. a partner backend adapter) before it mounts.

## Iframe

Embed `embed.html` (after bundling `defineHealthTwinCapture()` to `embed.bundle.js`)
and listen for `message` events of `type: "healthtwin:observation"`.

## Partner auth (token handoff)

```ts
import { exchangePartnerToken } from "@healthtwin/embed";
// partner server mints a short-lived signed token → exchange for a HealthTwin session
const session = await exchangePartnerToken("https://api.healthtwin.dev/exchange", partnerToken);
```

## Integration modes

- **Hosted:** default `LocalStore` (IndexedDB) + HealthTwin cloud sync.
- **Bring-your-own-backend:** capture events (or a custom `store`) keep the partner as the data controller — no PHI needs to leave their system.
