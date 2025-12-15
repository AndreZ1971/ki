# Awesome Support Tickets per WordPress REST API bereitstellen

Wenn die Standard-Installation von Awesome Support keine REST-Endpunkte für Tickets anbietet, kannst du mit einem kleinen Plugin eigene Endpunkte bereitstellen.

## Ziel
- Neuer Endpoint: `/wp-json/ari/v1/tickets`
- Liefert die letzten Tickets (konfigurierbarer CPT-Slug, Standard `ticket`).
- Authentifizierung: WordPress Application Passwords (Basic Auth)

## Schritt 1: Mini-Plugin anlegen
Erstelle im WordPress-Server unter `wp-content/plugins/ari-support-rest/` eine Datei `ari-support-rest.php` mit folgendem Inhalt:

```php
<?php
/**
 * Plugin Name: ARI Support REST
 * Description: Stellt REST-Endpunkte für Support-Tickets bereit.
 * Version: 1.0.0
 * Author: ARI
 */

if (!defined('ABSPATH')) { exit; }

add_action('rest_api_init', function () {
    register_rest_route('ari/v1', '/tickets', [
        'methods'  => 'GET',
        'permission_callback' => function () {
            // Nur authentifizierte Requests zulassen
            return current_user_can('read');
        },
        'callback' => function (WP_REST_Request $request) {
            $per_page = max(1, intval($request->get_param('per_page') ?: 20));

            // CPT-Slug anpassen, falls dein Ticket-Post-Type anders heißt
            $cpt_slug = apply_filters('ari_support_rest_cpt_slug', 'ticket');

            $q = new WP_Query([
                'post_type'      => $cpt_slug,
                'post_status'    => 'any',
                'posts_per_page' => $per_page,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ]);

            $items = [];
            foreach ($q->posts as $p) {
                $items[] = [
                    'id'          => $p->ID,
                    'title'       => get_the_title($p),
                    'content'     => apply_filters('the_content', $p->post_content),
                    'status'      => $p->post_status,
                    'date'        => get_post_time('c', true, $p),
                    'meta'        => [
                        // Beispiele – passe Felder an dein Setup an
                        'priority' => get_post_meta($p->ID, 'priority', true),
                        'date_resolved' => get_post_meta($p->ID, 'date_resolved', true),
                    ],
                    'link'        => get_permalink($p->ID),
                ];
            }

            return new WP_REST_Response($items, 200);
        }
    ]);
});
```

> Hinweis: Wenn dein Ticket-Post-Type einen anderen Slug hat (z. B. `wpas_ticket`), kannst du ihn per Filter setzen:
>
> ```php
> add_filter('ari_support_rest_cpt_slug', function(){ return 'wpas_ticket'; });
> ```

## Schritt 2: Plugin aktivieren
- Im WordPress-Admin unter Plugins das Plugin "ARI Support REST" aktivieren.
- Prüfe im Browser: `https://DEINSHOP/wp-json/ari/v1/tickets?per_page=5`

## Schritt 3: ARI Backend konfigurieren
In `backend/connection.json` kannst du den Endpoint optional fest eintragen:

```json
"support": {
  "ticketsEndpoint": "/wp-json/ari/v1/tickets",
  "perPage": 20
}
```

Das ARI-Backend versucht dann diesen Pfad zuerst und fällt auf weitere Varianten zurück.

## Authentifizierung testen (PowerShell)
```powershell
$pair = "USER:APP_PASSWORD"
$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
iwr "https://DEINSHOP/wp-json/ari/v1/tickets?per_page=5" -Headers @{Authorization="Basic $b64"}
```

Wenn das klappt, erscheinen die Tickets in A.R.I. unter Feedback-Analyse.
