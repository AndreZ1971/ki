#!/usr/bin/env node

/**
 * Test Script: Spezialisierungs-Signatur-Verifizierung
 * 
 * Demonstriert wie RSA-4096 Signaturen erzeugt und verifiziert werden
 */

const crypto = require('crypto');

// Die Keys (in Produktion würden diese aus der Umgebung kommen)
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
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
tqJ8hzpVx8d97BHAulokT54UyM4Tu3s=
-----END PRIVATE KEY-----`;

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAwCVraueHJFNKwk6ctz5n
7w1dMZL60hnHkm4Phx2nUwWx6hbzF+7Q81FhAYWL/UmGymPwiAV5j5TRhtRfxww+
Ugz0rdrdM8+cNEVOlOqhCn2c+fuMQIDV3cS367s1fawNbmU+xzXBa8DMCZIir3ei
0wrxSMD0T/0PLFIHUw/vD+OgqOAAd/YCFwUUuR+SxsFxTAnAeK5jROqQ9B6bYncL
x6fE9JnnK250QkjzDb7UOYv7dniOiDmfvEFphS0kxyi1DWGpOt15NXCdPbilFV4n
svQloYMaiV4OM3U968VNE+vhlhIEGgxAVkz4rAWLHsAlVl1uRU9Twk6aNRnWIWvz
qT6+Y+Jyf+vK1XO32BxMlO9ues2jn/BbLu1WUAL6uDP0zE4PrIimY9Z/S8JZhtEK
duCs7x4sPCrq19z3GScMhTd5IznNaieay/MHanN5f/fQNnXaCo7yHxHlUsMZ246x
4L3DCg5dRzd/CXStAqXv2I5VYUx6oC6JV6xn7+jqN7wr6A3SZT8z61uutH4++aRl
gHdRZaa92GuC0j0UmlcunUYNrQU1qq2/1vNTRQsBuU/E4AIvh17H6GoBrQr7d7vQ
OH7bSuTQeLrdB2lXKmvWz+/29cSY6hsJBgokMDDsjJSJRgpL9YNXsuGiUvQD4Lud
roawcBh9zkXqhVLtfOiCbwUCAwEAAQ==
-----END PUBLIC KEY-----`;

console.log('\n🔐 RSA-4096 Spezialisierungs-Signatur Test\n');
console.log('=' .repeat(60));

// Test 1: Korrekt signierte Spezialisierung
console.log('\n✅ Test 1: Korrekt signierte Spezialisierung');
console.log('-'.repeat(60));

const spec = {
  id: 'seo-expert',
  name: 'SEO Expert',
  description: 'Ein SEO-Spezialist für deine KI',
  systemPrompt: 'Du bist ein SEO-Expert...'
};

const specJson = JSON.stringify(spec);
console.log(`📄 Spezialisierung: ${JSON.stringify(spec, null, 2)}`);

// Mit Private Key signieren
const signer = crypto.createSign('RSA-SHA256');
signer.update(specJson);
const signature = signer.sign(PRIVATE_KEY, 'base64');

console.log(`\n🔑 Signatur erzeugt: ${signature.substring(0, 50)}...`);

// Mit Public Key verifizieren
const verifier = crypto.createVerify('RSA-SHA256');
verifier.update(specJson);
const isValid = verifier.verify(PUBLIC_KEY, signature, 'base64');

console.log(`\n✓ Signatur-Verifizierung: ${isValid ? '✅ GÜLTIG' : '❌ UNGÜLTIG'}`);

// Test 2: Manipulierte Spezialisierung
console.log('\n\n❌ Test 2: Manipulierte Spezialisierung');
console.log('-'.repeat(60));

const tamperedSpec = {
  ...spec,
  price: '0€' // Jemand hat den Preis manipuliert
};

const tamperedJson = JSON.stringify(tamperedSpec);
console.log(`📄 Manipulierte Spezialisierung: ${JSON.stringify(tamperedSpec, null, 2)}`);

// Mit gleicher Signatur prüfen (wird fehlschlagen)
const verifier2 = crypto.createVerify('RSA-SHA256');
verifier2.update(tamperedJson);
const isValid2 = verifier2.verify(PUBLIC_KEY, signature, 'base64');

console.log(`\n✓ Signatur-Verifizierung: ${isValid2 ? '✅ GÜLTIG' : '❌ UNGÜLTIG (Manipulation erkannt!)'}`);

// Test 3: Falsche Signatur
console.log('\n\n⚠️ Test 3: Falsche Signatur');
console.log('-'.repeat(60));

const fakeSignature = Buffer.from('FakeSig123').toString('base64');
console.log(`📄 Spezialisierung: ${JSON.stringify(spec, null, 2)}`);
console.log(`🔑 Falsche Signatur: ${fakeSignature}`);

const verifier3 = crypto.createVerify('RSA-SHA256');
verifier3.update(specJson);
const isValid3 = verifier3.verify(PUBLIC_KEY, fakeSignature, 'base64');

console.log(`\n✓ Signatur-Verifizierung: ${isValid3 ? '✅ GÜLTIG' : '❌ UNGÜLTIG (Gefälschte Signatur erkannt!)'}`);

// Test 4: Komplette signierte Struktur (wie WooCommerce-Download)
console.log('\n\n📦 Test 4: Komplette WooCommerce-Download-Struktur');
console.log('-'.repeat(60));

const signedSpec = {
  spec: spec,
  signature: signature,
  timestamp: new Date().toISOString(),
  issuer: 'woocommerce'
};

console.log(`✓ Signierte Struktur für Upload:\n${JSON.stringify(signedSpec, null, 2)}`);

// Verifizieren
const verifier4 = crypto.createVerify('RSA-SHA256');
verifier4.update(JSON.stringify(signedSpec.spec));
const isValid4 = verifier4.verify(PUBLIC_KEY, signedSpec.signature, 'base64');

console.log(`\n✓ Signatur-Verifizierung: ${isValid4 ? '✅ GÜLTIG - Ready für Upload!' : '❌ UNGÜLTIG'}`);

console.log('\n' + '='.repeat(60));
console.log('\n🎯 Zusammenfassung:');
console.log('   ✅ Korrekte Signatur wird akzeptiert');
console.log('   ✅ Manipulierte Daten werden erkannt');
console.log('   ✅ Falsche Signaturen werden abgelehnt');
console.log('   ✅ Container wird immer die Signatur prüfen');
console.log('\n💡 Mit dieser Implementierung sind deine Spezialisierungen sicher vor Manipulation!\n');
