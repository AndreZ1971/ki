import React, { useState, useEffect, useMemo } from "react";
import { formatDate, formatDateTime } from "../../lib/i18n-utils";
import { useNavigate } from "react-router-dom";
import "./page.css";
import "./UserManagement.css";
import { MLPersonalization } from "./MLPersonalization";

// ✅ Typen für WooCommerce Kunden
interface Customer {
  id: number;
  name: string;
  email: string;
  total_spent: string;
  date_created: string;
  status: string;
  orders_count: number;
  last_viewed_product?: string;
  cart?: Array<{ name: string; price: number }>;
  visit_count?: number;
  last_login?: string;
  role?: string;
}

interface CustomerStats {
  totalRevenue: number;
  avgOrderValue: number;
  activeCount: number;
  topCustomer: Customer | null;
}

// ✅ API Response Type (wird im Fehlerfall genutzt für Type-Checking)
interface _ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const apiBase = useMemo(() => {
    const raw = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
    return raw || "";
  }, []);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "revenue" | "date">("name");
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);

  // ✅ Kundendaten laden
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        // 🔗 Vereinfachte URL-Konstruktion (robuster)
        let url: string;
        if (apiBase) {
          // Wenn apiBase gesetzt ist, nutze es als Basis
          const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
          url = `${base}/api/woocommerce/customers`;
        } else {
          // Fallback: nutze relative URL (funktioniert wenn Frontend und Backend auf gleichem Host)
          url = "/api/woocommerce/customers";
        }

        console.log("🔗 API URL:", url);
        console.log("🔗 VITE_API_URL env:", import.meta.env.VITE_API_URL);
        console.log("🔗 apiBase resolved:", apiBase);

        const res = await fetch(url);
        console.log("📊 Response Status:", res.status, res.statusText);

        const data: any = await res.json();
        console.log("📥 API Response:", data);
        console.log("📥 API Response data.data:", data.data);
        console.log("📥 API Response is Array?:", Array.isArray(data));
        console.log(
          "📥 API Response data.data is Array?:",
          Array.isArray(data.data)
        );
        console.log("📥 API Response data.success:", data.success);
        console.log("📥 API Response data.total:", data.total);
        console.log("📥 API Response data.message:", data.message);

        // ✅ Verbesserte Fehlerbehandlung für verschiedene API-Antworten
        if (!res.ok) {
          // Wenn 503 oder andere Error-Status, zeige die API-Meldung
          const errorMsg =
            data?.message ||
            data?.error ||
            `Fehler ${res.status}: ${res.statusText}`;
          throw new Error(errorMsg);
        }

        // ✅ Prüfe auf verschiedene Response-Formate
        let customers: Customer[] = [];

        if (data.success && Array.isArray(data.data)) {
          // Standard-Format: { success: true, data: [...] }
          customers = data.data;
        } else if (Array.isArray(data)) {
          // Direktes Array-Format: [...]
          customers = data;
        } else if (data.success === false) {
          // API gibt einen Error-Status zurück
          throw new Error(
            data.message ||
              data.error ||
              "WooCommerce API gibt einen Fehler zurück"
          );
        } else {
          // Unbekanntes Format
          console.warn("⚠️ Unerwartetes Response-Format:", data);
          throw new Error(
            "Ungültige API-Antwort: " + JSON.stringify(data).substring(0, 100)
          );
        }

        console.log(`✅ ${customers.length} Kunden geladen`);
        console.log("📋 Customers array:", customers);
        setCustomers(customers);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unbekannter Fehler";
        console.error("❌ Fehler beim Laden der Kunden:", message, err);
        setError(`Kundendaten konnten nicht geladen werden: ${message}`);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [apiBase]);

  // 📊 Berechnete Statistiken
  const stats = useMemo((): CustomerStats => {
    if (customers.length === 0) {
      return {
        totalRevenue: 0,
        avgOrderValue: 0,
        activeCount: 0,
        topCustomer: null,
      };
    }

    const totalRevenue = customers.reduce(
      (sum, c) => sum + parseFloat(c.total_spent || "0"),
      0
    );
    const avgOrderValue = totalRevenue / customers.length;
    const activeCount = customers.filter((c) => c.status === "aktiv").length;
    const topCustomer = customers.reduce((max, c) =>
      parseFloat(c.total_spent || "0") > parseFloat(max.total_spent || "0")
        ? c
        : max
    );

    return { totalRevenue, avgOrderValue, activeCount, topCustomer };
  }, [customers]);

  // 🔍 Gefilterte und sortierte Kundenliste
  const filteredCustomers = useMemo(() => {
    const result = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "revenue")
        return (
          parseFloat(b.total_spent || "0") - parseFloat(a.total_spent || "0")
        );
      if (sortBy === "date")
        return (
          new Date(b.date_created).getTime() -
          new Date(a.date_created).getTime()
        );
      return 0;
    });

    console.log(
      `📊 filteredCustomers: ${result.length} (von ${customers.length} Kunden)`
    );
    console.log(`📊 searchTerm: "${searchTerm}", sortBy: "${sortBy}"`);

    return result;
  }, [customers, searchTerm, sortBy]);

  const handleBack = () => navigate("/");

  const closeModal = () => {
    setSelectedUser(null);
  };

  return (
    <div className="app-page" style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <button className="back-button floating-back" onClick={handleBack}>
            ← Zurück
          </button>
          <h1 style={{ marginTop: "16px" }}>🛒 User Management & Analyse</h1>
        </div>
      </div>

      {/* Error Handling */}
      {error && (
        <div
          style={{
            background: "rgba(255, 59, 48, 0.1)",
            border: "1px solid rgba(255, 59, 48, 0.5)",
            borderRadius: "12px",
            padding: "16px",
            color: "#ff3b30",
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "12px",
                padding: "20px",
                height: "120px",
                animation: "pulse 2s infinite",
              }}
            />
          ))}
        </div>
      )}

      {/* Statistik-Karten */}
      {!loading && customers.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(52, 199, 89, 0.05))",
              border: "1px solid rgba(52, 199, 89, 0.3)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "8px",
              }}
            >
              📊 Gesamtumsatz
            </div>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#34c759" }}
            >
              {stats.totalRevenue.toFixed(2)} €
            </div>
          </div>
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05))",
              border: "1px solid rgba(0, 122, 255, 0.3)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "8px",
              }}
            >
              💰 Ø Warenkorbwert
            </div>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#007aff" }}
            >
              {stats.avgOrderValue.toFixed(2)} €
            </div>
          </div>
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 149, 0, 0.1), rgba(255, 149, 0, 0.05))",
              border: "1px solid rgba(255, 149, 0, 0.3)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "8px",
              }}
            >
              👥 Aktive Kunden
            </div>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#ff9500" }}
            >
              {stats.activeCount}
            </div>
          </div>
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(175, 82, 222, 0.1), rgba(175, 82, 222, 0.05))",
              border: "1px solid rgba(175, 82, 222, 0.3)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "8px",
              }}
            >
              ⭐ Top Kunde
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#af52de",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {stats.topCustomer?.name || "–"}
            </div>
          </div>
        </div>
      )}

      {/* Suchzeile & Sortierung */}
      {!loading && customers.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="🔍 Nach Name oder Email suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "10px 16px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: "10px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="name">📝 Name</option>
            <option value="revenue">💰 Umsatz</option>
            <option value="date">📅 Registriert</option>
          </select>
        </div>
      )}

      {/* Kundentabelle */}
      {!loading &&
        (filteredCustomers.length > 0 ? (
          <div
            style={{
              overflowX: "auto",
              borderRadius: "12px",
              marginBottom: "32px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    👤 Name
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    📧 Email
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    💰 Umsatz
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    📊 Bestellungen
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    📅 Registriert
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "background 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "12px 16px" }}>{customer.name}</td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {customer.email}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontWeight: "600",
                        color: "#34c759",
                      }}
                    >
                      {parseFloat(customer.total_spent || "0").toFixed(2)} €
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {customer.orders_count}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {formatDate(new Date(customer.date_created))}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button
                        onClick={() => setSelectedUser(customer)}
                        style={{
                          padding: "6px 12px",
                          background: "rgba(0, 122, 255, 0.2)",
                          border: "1px solid rgba(0, 122, 255, 0.5)",
                          borderRadius: "6px",
                          color: "#007aff",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "500",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(0, 122, 255, 0.3)";
                          e.currentTarget.style.boxShadow =
                            "0 0 12px rgba(0, 122, 255, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(0, 122, 255, 0.2)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        ℹ️ Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "32px",
            }}
          >
            🔍 Keine Kunden gefunden
          </div>
        ))}

      {/* Details Modal */}
      {selectedUser && (
        <div
          className="user-management-modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="user-management-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-management-header">
              <h2 className="user-management-title">
                👤 {selectedUser.name}
              </h2>
              <button
                onClick={closeModal}
                className="user-management-close"
              >
                ✕
              </button>
            </div>
            {/* Kunden-Details */}
            <div className="user-info-grid">
              <div className="user-info-field">
                <div className="user-info-label">
                  📧 Email
                </div>
                <div className="user-info-value">{selectedUser.email}</div>
              </div>
              <div className="user-info-field">
                <div className="user-info-label">
                  📊 Bestellungen
                </div>
                <div className="user-info-value">
                  {selectedUser.orders_count}
                </div>
              </div>
              <div className="user-info-field">
                <div className="user-info-label">
                  💰 Gesamtumsatz
                </div>
                <div className="user-info-value" style={{ color: "#34c759" }}>
                  {parseFloat(selectedUser.total_spent || "0").toFixed(2)} €
                </div>
              </div>
              <div className="user-info-field">
                <div className="user-info-label">
                  👁️ Shopbesuche
                </div>
                <div className="user-info-value">
                  {selectedUser.visit_count ?? "–"}
                </div>
              </div>
              <div className="user-info-field">
                <div className="user-info-label">
                  📅 Registriert
                </div>
                <div className="user-info-value">
                  {formatDate(new Date(selectedUser.date_created))}
                </div>
              </div>
              <div className="user-info-field">
                <div className="user-info-label">
                  🔐 Status
                </div>
                <div
                  className={`status-badge ${selectedUser.status === "aktiv" ? "success" : "warning"}`}
                >
                  {selectedUser.status || "aktiv"}
                </div>
              </div>
            </div>
            {selectedUser.last_login && (
              <div className="last-login-info">
                <span className="last-login-text">
                  ⏱️ Letzter Login:{" "}
                  {formatDateTime(new Date(selectedUser.last_login))}
                </span>
              </div>
            )}
            {selectedUser.cart &&
              Array.isArray(selectedUser.cart) &&
              selectedUser.cart.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.95)",
                    }}
                  >
                    🛒 Warenkorb
                  </h3>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "13px",
                    }}
                  >
                    {selectedUser.cart?.map((product: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          paddingBottom: "8px",
                          borderBottom:
                            i < (selectedUser.cart?.length || 0) - 1
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "none",
                        }}
                      >
                        <span style={{ color: "rgba(255,255,255,0.95)" }}>{product.name}</span>
                        <span style={{ color: "#34c759", fontWeight: "600" }}>
                          {product.price.toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}{" "}
            {/* KI-Personalisierte Angebote */}
            <div
              style={{
                marginBottom: "24px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "16px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                🤖 KI-Personalisierte Angebote
              </h3>
              <MLPersonalization userId={selectedUser.id} />
            </div>
            <button
              onClick={closeModal}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(0, 122, 255, 0.15)",
                border: "1px solid rgba(0, 122, 255, 0.3)",
                borderRadius: "8px",
                color: "#007aff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 122, 255, 0.25)";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(0, 122, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 122, 255, 0.15)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      <style>{`
				@keyframes pulse {
					0%, 100% { opacity: 0.8; }
					50% { opacity: 0.4; }
				}
			`}</style>
    </div>
  );
};

export default UserManagement;
