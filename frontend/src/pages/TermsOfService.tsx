import React from "react";
import { useNavigate } from "react-router-dom";

export const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        color: "#f8fafc",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "#3b82f6",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "30px",
            padding: "0",
          }}
        >
          ← Zurück
        </button>

        <h1 style={{ marginBottom: "30px", fontSize: "32px", fontWeight: "bold" }}>
          📋 Nutzungsbedingungen
        </h1>

        {/* Container Laufzeit */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: "#10b981" }}>
            🔄 Container-Laufzeit und Abschaltung
          </h2>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "20px", borderRadius: "12px", lineHeight: "1.8" }}>
            <p style={{ marginBottom: "15px" }}>
              Jeder Customer erhält mit seiner Subscription einen A.R.I.-Container mit einer bestimmten Laufzeit.
              Die Laufzeit beginnt mit dem Kauf und endet zu dem in der Subscription angegebenen Datum.
            </p>
            <p style={{ marginBottom: "15px" }}>
              <strong>Nach Ablauf der Laufzeit wird der Container automatisch beendet.</strong> Das bedeutet:
            </p>
            <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
              <li>Der Container ist nicht mehr erreichbar</li>
              <li>Die API reagiert nicht mehr</li>
              <li>Alle Daten bleiben erhalten (können nicht gelöscht werden)</li>
              <li>Die Spezialisierungen können nicht mehr genutzt werden</li>
            </ul>
            <p>
              ℹ️ Du kannst die Restlaufzeit jederzeit in den Einstellungen unter „Deine Laufzeit" sehen.
              Gib dazu deine Subscription-ID ein.
            </p>
          </div>
        </section>

        {/* Subscription Management */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: "#f59e0b" }}>
            💳 Subscription und Erneuerung
          </h2>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "20px", borderRadius: "12px", lineHeight: "1.8" }}>
            <p style={{ marginBottom: "15px" }}>
              Subscriptions werden über ari-cloud.de verwaltet und können dort erneuert werden.
            </p>
            <p style={{ marginBottom: "15px" }}>
              Bei Fragen zur Subscription kontaktiere bitte den Support bei ari-cloud.de.
            </p>
            <p>
              Die Verwaltung der Subscription-Daten erfolgt über deine Subscription-ID und den API-Schlüssel.
              Diese werden sicher bei uns gespeichert und nur zum Abrufen der Laufzeitinformationen verwendet.
            </p>
          </div>
        </section>

        {/* Daten und Datenschutz */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: "#3b82f6" }}>
            🔒 Daten und Datenschutz
          </h2>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "20px", borderRadius: "12px", lineHeight: "1.8" }}>
            <p style={{ marginBottom: "15px" }}>
              Deine Subscription-Daten (ID und API-Schlüssel) werden verschlüsselt gespeichert.
            </p>
            <p style={{ marginBottom: "15px" }}>
              Wir verwenden diese Daten ausschließlich zum:
            </p>
            <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
              <li>Abrufen deiner verbleibenden Laufzeit</li>
              <li>Anzeigen des Ablaufdatums im Dashboard</li>
              <li>Verwalten der Container-Abschaltung</li>
            </ul>
            <p>
              Eine Weitergabe an Dritte erfolgt nicht. Bitte beachte auch unsere Datenschutzerklärung.
            </p>
          </div>
        </section>

        {/* Haftung */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: "#ef4444" }}>
            ⚖️ Haftung
          </h2>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "20px", borderRadius: "12px", lineHeight: "1.8" }}>
            <p style={{ marginBottom: "15px" }}>
              Wir geben keine Garantie für die ständige Verfügbarkeit des Containers.
            </p>
            <p style={{ marginBottom: "15px" }}>
              Bei technischen Problemen:
            </p>
            <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
              <li>Kontaktiere bitte unseren technischen Support</li>
              <li>Stelle deine Subscription-ID bereit</li>
              <li>Beschreibe das Problem genau</li>
            </ul>
            <p>
              Wir haften nicht für Datenverlust durch verspätete Erneuerung der Subscription oder
              fehlende Nutzung der Laufzeit-Anzeige.
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: "#06b6d4" }}>
            📞 Support und Kontakt
          </h2>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "20px", borderRadius: "12px", lineHeight: "1.8" }}>
            <p style={{ marginBottom: "15px" }}>
              Bei Fragen zu:
            </p>
            <ul style={{ marginLeft: "20px", marginBottom: "15px" }}>
              <li><strong>Subscriptions und Abrechnung:</strong> support@kaufe-es.eu</li>
              <li><strong>Technische Probleme:</strong> support@ari.local</li>
              <li><strong>Container und Laufzeit:</strong> support@ari.local</li>
            </ul>
            <p>
              Wir antworten normalerweise innerhalb von 24 Stunden.
            </p>
          </div>
        </section>

        {/* Letzte Änderung */}
        <footer style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", paddingTop: "40px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <p>Zuletzt aktualisiert: Februar 2026</p>
          <p>Version 1.0</p>
        </footer>
      </div>
    </div>
  );
};
