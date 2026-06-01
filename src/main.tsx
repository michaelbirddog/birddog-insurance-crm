import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';
import './index.css';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

function MissingEnv() {
  return (
    <div className="app">
      <div className="header">
        <div className="header-left">
          <h1>Insurance <span className="accent">Partner</span> Pipeline</h1>
          <div className="subtitle">Missing VITE_CONVEX_URL. See DEPLOY.md.</div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {convexUrl ? (
      <ConvexProvider client={new ConvexReactClient(convexUrl)}>
        <App />
      </ConvexProvider>
    ) : (
      <MissingEnv />
    )}
  </React.StrictMode>,
);
