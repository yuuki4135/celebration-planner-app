import * as React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ChakraProvider } from '@chakra-ui/react'
import { HelmetProvider } from 'react-helmet-async'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ChakraProvider>
  </StrictMode>
)
