# Initialization and handling of connection.json in the container

## Goal

When shipping the AI Agent as a container (e.g., for Kubernetes/IaaS), the configuration file `connection.json` should sit in the backend directory and be fillable by the user via the settings UI.

## Concept

- **Initial delivery:**
  - On first container start, create an empty or placeholder-filled `connection.json` in the backend directory.
  - The file is writable by the container process.
  - The entrypoint automatically creates the file with safe placeholders (idempotent).
- **Customer setup:**
  - The customer opens the settings UI, enters credentials (OpenAI, WooCommerce, email, etc.), and saves.
  - The data is written into `connection.json`.
  - The system is immediately ready and connected to the shop.
  - The API masks secret fields on `GET` (e.g., `****`) and unmasks on `POST`, meaning unchanged secrets remain intact.
  - The settings UI sends a nested payload (e.g., `wordpress`, `woocommerce`, `openAI` …); the backend maps this to the flat structure in `connection.json`.
- **Permissions:**
  - The file must be writable by the container process (e.g., Node.js).
  - Ideally it is created by the backend process on first save so permissions are correct.
- **First steps for the customer:**
  - After start: open the settings UI, fill fields, save.
  - A short guide documents which data is needed and how to proceed.

## Implementation options

- **Dockerfile/entrypoint:**
  - Create an empty or placeholder `connection.json` during build or start.
  - Example (Dockerfile):
    ```dockerfile
    RUN echo '{ "openai": { "apiKey": "" }, "woocommerce": { "url": "", "consumerKey": "", "consumerSecret": "" }, "email": { "host": "", "port": 465, "secure": true, "user": "", "pass": "" } }' > /app/connection.json
    ```
  - Example (entrypoint.sh):
    ```sh
    [ -f /app/connection.json ] || cat > /app/connection.json <<EOF
    { ... }
    EOF
    ```

- **Kubernetes/IaaS:**
  - Init containers or volume mounts can be used to provide the file.

## Benefits
- No secrets baked into the image/source
- User can perform setup independently
- Secure, cloud-ready onboarding

---

**ToDo:**
- Implement container init for `connection.json` during delivery
- Add quick-start instructions
- Document permissions and path in backend code

---

## Validation rules (server)

- Groups (WordPress, WooCommerce, OpenAI) are optional. Once any field in a group is filled, the required fields of that group must be valid.
- `jobMode`: "once" or "interval".
  - "once": `jobIntervalMs` is ignored.
  - "interval": `jobIntervalMs` must be within 10,000–86,400,000 ms (10 s–24 h).
- Error responses include field and rule hints for quick correction.
