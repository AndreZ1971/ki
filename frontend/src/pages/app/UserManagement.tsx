import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './page.css';
import { MLPersonalization } from './MLPersonalization';

const API_URL = import.meta.env.VITE_API_URL || '';


const UserManagement: React.FC = () => {
	const navigate = useNavigate();
	const [customers, setCustomers] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchCustomers = async () => {
			setLoading(true);
			try {
				const res = await fetch(`${API_URL}/api/woocommerce/customers`);
				const data = await res.json();
				setCustomers(data.data || []);
			} catch (_err) {
				setError('Fehler beim Laden der Kundendaten');
			} finally {
				setLoading(false);
			}
		};
		fetchCustomers();
	}, []);

	const handleBack = () => navigate('/');

	// Modal für Details
	const [selected, setSelected] = useState<any | null>(null);
	const closeModal = () => setSelected(null);

	return (
		<div className="app-page">
			<button className="back-button floating-back" onClick={handleBack}>← Zurück</button>
			<h1>🛒 User Management & Analyse</h1>
			{loading && <div>⏳ Lädt...</div>}
			{error && <div style={{ color: 'red' }}>{error}</div>}
			<table className="user-table table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Umsatz</th>
						<th>Registriert</th>
						<th>Status</th>
						<th>Aktion</th>
					</tr>
				</thead>
				<tbody>
					{customers.map((c) => (
						<tr key={c.id}>
							<td>{c.name}</td>
							<td>{c.total_spent} €</td>
							<td>{new Date(c.date_created).toLocaleDateString()}</td>
							<td>{c.status || 'aktiv'}</td>
							<td>
								<button onClick={() => setSelected(c)}>Details</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Analyse & Insights bleibt */}
			<div style={{marginTop:32}}>
				<h2>Analyse & Insights</h2>
				<ul>
					<li>Durchschnittlicher Warenkorbwert: <b>{(customers.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0) / (customers.length || 1)).toFixed(2)} €</b></li>
					<li>Aktive Kunden: <b>{customers.filter(c => c.status === 'aktiv').length}</b></li>
					<li>Letzter Shopbesuch: <b>{customers.length > 0 ? (customers.reduce((latest, c) => c.last_login && c.last_login > latest ? c.last_login : latest, customers[0].last_login || '')) : '–'}</b></li>
					<li>Meistgekauftes Produkt: <b>{/* TODO: Produktanalyse */}–</b></li>
				</ul>
			</div>

			{/* Modal für Details */}
			{selected && (
				<div className="user-modal-overlay" onClick={closeModal}>
					<div className="user-modal" onClick={e => e.stopPropagation()}>
						<h2>Details für {selected.name}</h2>
						<p><b>Email:</b> {selected.email}</p>
						<p><b>Bestellungen:</b> {selected.orders_count}</p>
						<p><b>Letztes Produkt:</b> {selected.last_viewed_product || <span style={{color:'#888'}}>–</span>}</p>
						<p><b>Warenkorb:</b> {Array.isArray(selected.cart) && selected.cart.length > 0 ? selected.cart.map((p:any) => p.name).join(', ') : <span style={{color:'#888'}}>–</span>}</p>
						<p><b>Shopbesuche:</b> {selected.visit_count ?? <span style={{color:'#888'}}>–</span>}</p>
						<p><b>Letzter Login:</b> {selected.last_login ? new Date(selected.last_login).toLocaleString() : <span style={{color:'#888'}}>–</span>}</p>
						<button className="close-btn" onClick={closeModal} style={{marginTop:16}}>Schließen</button>
					</div>
				</div>
			)}

			{/* KI-Personalisierte Angebote */}
			{customers.length > 0 && (
				<div className="personalization-section">
					<h3>KI-Personalisierte Angebote</h3>
					{/* Beispielhaft für den ersten User, kann dynamisch erweitert werden */}
					<MLPersonalization userId={customers[0]?.id || 1} />
				</div>
			)}

		</div>
	);
};

export default UserManagement;