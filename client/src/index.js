import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { ChakraProvider } from '@chakra-ui/react';

// Suppress ResizeObserver loop error globally
if (typeof window !== "undefined") {
  window.addEventListener('error', e => {
    if (e.message && e.message.includes('ResizeObserver loop')) {
      e.stopImmediatePropagation();
    }
  });
  window.addEventListener('unhandledrejection', e => {
    if (e.reason && e.reason.message && e.reason.message.includes('ResizeObserver loop')) {
      e.preventDefault();
    }
  });
  // Suppress ResizeObserver loop limit exceeded warning
  const origConsoleError = window.console.error;
  window.console.error = function(...args) {
    if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop limit exceeded')) {
      return;
    }
    origConsoleError.apply(window.console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider>
    <App />
    </ChakraProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
