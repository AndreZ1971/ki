#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re

# Remaining German terms to translate
final_translations = {
    'kritische Fixes': 'critical fixes',
    'für Rate-Limiting': 'for rate-limiting',
    'und IP-Block-Prevention': 'and IP-block prevention',
    'ML/KI': 'ML/AI',
    'für Score-Anzeige': 'for score display',
    'mit Severity-Levels': 'with severity levels',
    'AI Insights': 'AI insights',
    'Stärken': 'strengths',
    'Schwächen': 'weaknesses',
    'Chancen': 'opportunities',
    'Empfehlungen': 'recommendations',
    'Circular progress indicator für': 'Circular progress indicator for',
    'Expandable issue cards mit': 'Expandable issue cards with',
    'Es kombiniert Filesystem-based': 'It combines filesystem-based',
    'mit In-Memory-Caching': 'with in-memory caching',
    'Verschlüsselung': 'Encryption',
    'und umfassenden': 'and comprehensive',
    'Fault tolerance': 'Fault tolerance',
    'Mechanismen': 'Mechanisms',
    'Kernfunktionen': 'Core Features',
    'Komponenten-Overview': 'Component Overview',
    'für sensible Daten': 'for sensitive data',
    'für schnellen Zugriff': 'for fast access',
    'beim Server-Start': 'on server startup',
    'mit Fallback-Mechanismen': 'with fallback mechanisms',
    'für vollständige Verwaltung': 'for complete management',
    'mit graceful degradation': 'with graceful degradation',
    'Fileystem Storage': 'Filesystem Storage',
    'Verzeichnis-Layout': 'Directory Layout',
    'User-spezifisches': 'User-specific',
    'Metadata &': 'Metadata & checksums',
    'Checksums': '',
    'Sicherheit & Verschlüsselung': 'Security & Encryption',
    'AES-256-GCM': 'AES-256-GCM',
    'Verschlüsselung': 'Encryption',
    'Test-Spezialisierungen': 'Test specializations',
    'Backups': 'Backups',
    'Features': 'Features',
    '256-bit': '256-bit',
    'Schlüssel': 'Key',
    'für maximale Sicherheit': 'for maximum security',
    'Unique IV': 'Unique IV',
    'pro Verschlüsselung': 'per encryption',
    'Pattern-Erkennung': 'Pattern recognition',
    'Authentication Tag': 'Authentication tag',
    'für Tamper-Detection': 'for tamper detection',
    'Original-Hash-Preservation': 'Original hash preservation',
    'für Integrity-Checks': 'for integrity checks',
    'SHA-256': 'SHA-256',
    'Integritätschecks': 'Integrity Checks',
    'Jede': 'Each',
    'gespeicherte': 'stored',
    'Spezialisierung': 'Specialization',
    'erhält': 'receives',
    'einen': 'a',
    'Hash': 'hash',
    'Corruption-Detection': 'Corruption detection',
    'beim Laden': 'on load',
    'Vergleich': 'Comparison',
    'vor': 'before',
    'nach': 'after',
    'Updates': 'updates',
    'Audit-Trail': 'Audit trail',
    'für Änderungen': 'for changes',
}

def translate_file(file_path):
    """Translate remaining German in file"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Apply all final translations
    for german, english in final_translations.items():
        content = content.replace(german, english)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Report changes
    if content != original:
        print(f"✓ Updated: {os.path.basename(file_path)}")
    else:
        print(f"No changes needed: {os.path.basename(file_path)}")

# Process both files
root = r'c:\Entwicklung\neuer-git-ordner\ki'
translate_file(os.path.join(root, 'docs\\english\\TOOLS_DOCUMENTATION.md'))
translate_file(os.path.join(root, 'docs\\english\\SPECIALIZATION_PERSISTENCE_SYSTEM.md'))

print("\n✓ Final translation pass complete!")
