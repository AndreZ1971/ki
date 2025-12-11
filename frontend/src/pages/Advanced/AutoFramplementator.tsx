// src/pages/Advanced/AutoFramplementator.tsx
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useProductManagement } from '../../hooks/useProductManagement';
import { useToast } from '../../hooks/useToast';
import { BackButton, LoadingButton, ErrorMessage } from '../../components/shared';
import { ToastContainer } from '../../components/Toast/ToastContainer';
import './page.css';

type FrameworkKey = 'react' | 'vue' | 'angular' | 'svelte';
type FeatureKey = 'routing' | 'state' | 'api' | 'auth' | 'ui' | 'tests';

const AutoFramplementator: React.FC = () => {
  const { handleBackToDashboard, loading, setLoading, error, setError } = useProductManagement();
  const { toasts, showToast } = useToast();
  
  const [framework, setFramework] = useState<FrameworkKey>('react');
  const [projectName, setProjectName] = useState('');
  const [features, setFeatures] = useState<FeatureKey[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const slug = useMemo(() => projectName.trim().toLowerCase().replace(/\s+/g, '-'), [projectName]);

  const frameworks = [
    { value: 'react', label: 'React', icon: '⚛️', description: 'React 19 + TypeScript' },
    { value: 'vue', label: 'Vue.js', icon: '💚', description: 'Vue 3 Composition API' },
    { value: 'angular', label: 'Angular', icon: '🅰️', description: 'Angular 17+' },
    { value: 'svelte', label: 'Svelte', icon: '🔥', description: 'SvelteKit' }
  ];

  const availableFeatures = [
    { value: 'routing', label: 'Routing', icon: '🛣️' },
    { value: 'state', label: 'State Management', icon: '🗂️' },
    { value: 'api', label: 'API Integration', icon: '🔌' },
    { value: 'auth', label: 'Authentication', icon: '🔐' },
    { value: 'ui', label: 'UI Components', icon: '🎨' },
    { value: 'tests', label: 'Testing Setup', icon: '🧪' }
  ];

  const toggleFeature = (feature: FeatureKey) => {
    setFeatures(prev => 
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const buildTemplate = (fw: FrameworkKey, name: string, selected: FeatureKey[]) => {
    const nameSlug = name.trim() ? name.trim().toLowerCase().replace(/\s+/g, '-') : 'my-app';
    const featureList = selected.length ? selected.join(', ') : 'keine Features gewählt';
    const has = (f: FeatureKey) => selected.includes(f);

    const featureDeps: Partial<Record<FeatureKey, string[]>> = {
      routing: fw === 'react' ? ['react-router-dom@^6.27.0'] : fw === 'vue' ? ['vue-router@^4.3.0'] : fw === 'angular' ? ['@angular/router@^17.0.0'] : [],
      state: fw === 'react' ? ['zustand@^4.5.2'] : fw === 'vue' ? ['pinia@^2.2.6'] : fw === 'angular' ? [] : ['svelte@latest'],
      api: ['axios@^1.6.0'],
      auth: ['jsonwebtoken@^9.0.2'],
      ui: ['@fontsource/inter@^5.0.0'],
      tests: ['vitest@^1.5.0', '@testing-library/react@^15.0.0']
    };

    const deps = new Set<string>();
    const addDeps = (list?: string[]) => list?.forEach(d => deps.add(d));
    selected.forEach(f => addDeps(featureDeps[f]));

    const baseDeps: Record<FrameworkKey, string[]> = {
      react: ['react@latest', 'react-dom@latest'],
      vue: ['vue@latest'],
      angular: ['@angular/core@^17.0.0', 'rxjs@^7.8.0'],
      svelte: ['svelte@latest']
    };

    baseDeps[fw].forEach(d => deps.add(d));

    const packageJson = `{
  "name": "${nameSlug}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    ${Array.from(deps).map(d => `"${d.split('@')[0]}": "${d.includes('@') ? d.split('@').slice(1).join('@') : 'latest'}"`).join(',\n    ')}
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0"
  }
}`;

    const reactApp = `import React from 'react';
${has('routing') ? "import { BrowserRouter, Routes, Route } from 'react-router-dom';" : ''}
${has('state') ? "import { create } from 'zustand';" : ''}
${has('api') ? "import axios from 'axios';" : ''}
${has('ui') ? "import '@fontsource/inter/400.css';" : ''}

${has('state') ? "const useStore = create((set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }));" : ''}

function App() {
  ${has('state') ? 'const { count, inc } = useStore();' : ''}
  return (
    <div className="app-shell">
      <header>
        <h1>${name || 'Neues Projekt'}</h1>
        <p>Features: ${featureList}</p>
      </header>
      <main>
        ${has('routing') ? '<Routes><Route path="/" element={<div>Home</div>} /><Route path="/about" element={<div>About</div>} /></Routes>' : ''}
        ${has('state') ? '<button onClick={inc}>Count: {count}</button>' : ''}
        ${has('api') ? '<pre>// axios.get("/api");</pre>' : ''}
      </main>
    </div>
  );
}

export default App;${has('tests') ? '\n// Tests: Vitest + React Testing Library empfohlen' : ''}`;

    const vueApp = `<script setup lang="ts">
${has('routing') ? "import { RouterView } from 'vue-router';" : ''}
${has('state') ? "import { defineStore } from 'pinia';" : ''}
${has('state') ? "const useCounter = defineStore('counter', { state: () => ({ count: 0 }), actions: { inc() { this.count++; } } }); const store = useCounter();" : ''}
</script>

<template>
  <div class="app-shell">
    <header>
      <h1>${name || 'Neues Projekt'}</h1>
      <p>Features: ${featureList}</p>
    </header>
    <main>
      ${has('routing') ? '<RouterView />' : '<p>Leg deine Views unter src/views ab.</p>'}
      ${has('state') ? '<button @click="store.inc">Count: {{ store.count }}</button>' : ''}
    </main>
  </div>
</template>`;

    const angularApp = `import { Component } from '@angular/core';
${has('routing') ? "import { RouterOutlet } from '@angular/router';" : ''}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [${has('routing') ? 'RouterOutlet' : ''}],
  template: ` + "`" + `<main class="app-shell">
    <header>
      <h1>${name || 'Neues Projekt'}</h1>
      <p>Features: ${featureList}</p>
    </header>
    <section>
      ${has('routing') ? '<router-outlet></router-outlet>' : '<p>Lege Komponenten unter src/app an.</p>'}
    </section>
  </main>` + "`" + `,
  styles: [` + "`" + `.app-shell { padding: 24px; }` + "`" + `]
})
export class AppComponent {}`;

    const svelteApp = `<script lang="ts">
${has('state') ? "import { writable } from 'svelte/store'; const counter = writable(0);" : ''}
${has('api') ? 'let data = null;\n// onMount(async () => { data = await (await fetch("/api")).json(); });' : ''}
</script>

<main class="app-shell">
  <h1>${name || 'Neues Projekt'}</h1>
  <p>Features: ${featureList}</p>
  ${has('state') ? '<button on:click={() => counter.update(n => n + 1)}>Increment</button>' : ''}
</main>`;

    const mainContent = fw === 'react'
      ? `import React from 'react';
    import ReactDOM from 'react-dom/client';
    ${has('routing') ? "import { BrowserRouter } from 'react-router-dom';\n" : ''}import App from './App';
    import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element fehlt');

ReactDOM.createRoot(root).render(${has('routing') ? '<BrowserRouter><App /></BrowserRouter>' : '<App />'});`
      : fw === 'vue'
        ? `import { createApp } from 'vue';
import App from './App.vue';
${has('state') ? 'import { createPinia } from "pinia";' : ''}
${has('routing') ? 'import router from "./router";' : ''}

const app = createApp(App);
${has('state') ? 'app.use(createPinia());' : ''}
${has('routing') ? 'app.use(router);' : ''}
app.mount('#app');`
        : fw === 'angular'
          ? `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
${has('routing') ? 'import { provideRouter, Routes } from "@angular/router";' : ''}

${has('routing') ? 'const routes: Routes = [{ path: "", component: AppComponent }];' : ''}
bootstrapApplication(AppComponent${has('routing') ? ', { providers: [provideRouter(routes)] }' : ''});`
          : `import App from './App.svelte';

const app = new App({ target: document.getElementById('app')! });

export default app;`;

    const appContent = fw === 'react'
      ? reactApp
      : fw === 'vue'
        ? vueApp
        : fw === 'angular'
          ? angularApp
          : svelteApp;

    const testHint = has('tests') ? '\n\n// Tests: richte Vitest + Testing Library ein (npm run test)' : '';
    const mainExt = fw === 'react' ? 'tsx' : 'ts';
    const appExt = fw === 'react' ? 'tsx' : fw === 'svelte' ? 'svelte' : 'ts';
    const stylesContent = `.app-shell { min-height: 100vh; background: radial-gradient(circle at 20% 20%, #0b2545, #0a1029); color: #f5f7fb; padding: 24px; font-family: 'Inter', system-ui, -apple-system, sans-serif; }\nheader { margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px; }\nmain { display: grid; gap: 12px; }\nbutton { background: #5de0e6; color: #001023; border: none; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-weight: 700; }\nbutton:hover { filter: brightness(1.05); }`;

    const extraSections: string[] = [];
    if (fw === 'vue' && has('routing')) {
      extraSections.push(`// src/router.ts\nimport { createRouter, createWebHistory } from 'vue-router';\n\nconst routes = [\n  { path: '/', component: () => import('./views/Home.vue') },\n  { path: '/about', component: () => import('./views/About.vue') }\n];\n\nconst router = createRouter({\n  history: createWebHistory(),\n  routes\n});\n\nexport default router;`);
    }

    extraSections.push(`// src/styles.css\n${stylesContent}`);

    const extras = extraSections.length ? `\n\n${extraSections.join('\n\n')}` : '';

    return `// Projekt: ${name || 'Unbenannt'} (${fw})\n// Features: ${featureList}\n\n// package.json\n${packageJson}\n\n// src/main.${mainExt}\n${mainContent}\n\n// src/App.${appExt}\n${appContent}${testHint}${extras}`;
  };

  const handleGenerate = async () => {
    if (!projectName.trim()) {
      showToast('Bitte gib einen Projektnamen ein', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const code = buildTemplate(framework, projectName, features);
      setGeneratedCode(code);
      showToast('Framework-Code generiert', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) {
      showToast('Bitte zuerst Code generieren', 'error');
      return;
    }
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(generatedCode);
      showToast('In Zwischenablage kopiert', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kopieren fehlgeschlagen';
      showToast(message, 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownload = () => {
    if (!generatedCode) {
      showToast('Bitte zuerst Code generieren', 'error');
      return;
    }
    setIsDownloading(true);
    try {
      const blob = new Blob([generatedCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug || 'autoframplementator'}-scaffold.txt`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Download gestartet', 'info');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download fehlgeschlagen';
      showToast(message, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="page-container">
      <BackButton onClick={handleBackToDashboard} />
      <ToastContainer toasts={toasts} onRemove={(_id) => {}} />

      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="pill">Auto Framplementator</div>
        <h1>🔄 Framework-Boilerplate in Sekunden</h1>
        <p>Wähle Stack, Features und erhalte sofort einen lauffähigen Scaffold inkl. Package.json und Entryfiles.</p>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginTop: '12px' }}>
        <motion.div className="form-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: 'white', margin: 0 }}>⚙️ Projekt-Konfiguration</h3>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Echte Vorlagen, kein Dummy</span>
          </div>

          <div className="form-group">
            <label>Framework wählen</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {frameworks.map(fw => (
                <motion.div key={fw.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setFramework(fw.value as FrameworkKey)}
                  style={{ padding: '14px', background: framework === fw.value ? 'linear-gradient(135deg, #5de0e6 0%, #004aad 100%)' : 'rgba(255,255,255,0.04)',
                    border: framework === fw.value ? '1px solid rgba(93, 224, 230, 0.6)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{fw.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{fw.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.75, color: 'white' }}>{fw.description}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Projektname *</label>
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="z.B. my-awesome-app" className="form-input" />
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginTop: '6px' }}>Slug: {slug || '–'}</div>
          </div>

          <div className="form-group">
            <label>Features auswählen</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
              {availableFeatures.map(feat => (
                <motion.div key={feat.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => toggleFeature(feat.value as FeatureKey)}
                  style={{ padding: '10px', background: features.includes(feat.value as FeatureKey) ? 'linear-gradient(135deg, #5de0e6 0%, #004aad 100%)' : 'rgba(255,255,255,0.04)',
                    border: features.includes(feat.value as FeatureKey) ? '1px solid rgba(93, 224, 230, 0.6)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{feat.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{feat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <LoadingButton onClick={handleGenerate} loading={loading} loadingText="Generiere Scaffold...">🔄 Scaffold generieren</LoadingButton>
            <button className="ghost-button" onClick={() => { setFeatures(['routing', 'state', 'api']); showToast('Preset angewendet', 'info'); }}>Preset: Web App</button>
            <button className="ghost-button" onClick={() => { setFeatures(['ui', 'auth', 'tests']); showToast('Preset angewendet', 'info'); }}>Preset: SaaS</button>
          </div>
        </motion.div>

        <motion.div className="result-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: 'white', margin: 0 }}>🧩 Generierter Code</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="ghost-button" onClick={handleCopy} disabled={isCopying || loading}>{isCopying ? 'Kopiere...' : 'Copy'}</button>
              <button className="ghost-button" onClick={handleDownload} disabled={isDownloading || loading}>{isDownloading ? 'Lädt...' : 'Download'}</button>
            </div>
          </div>
          {generatedCode ? (
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '18px', color: 'white',
              fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '640px', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>{generatedCode}</div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ fontSize: '46px', marginBottom: '12px' }}>✨</div>
              <p>Wähle Framework + Features und klicke auf Generieren.</p>
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
};

export default AutoFramplementator;