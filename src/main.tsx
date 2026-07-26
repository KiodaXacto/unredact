// src/main.tsx
// Application entry point.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { Router } from './app/Router';
import { checkAndMigrateStorage } from './services/storageService';

// Run storage migration before anything else
checkAndMigrateStorage();

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found in index.html');

createRoot(root).render(
  <StrictMode>
    <Router />
  </StrictMode>
);
