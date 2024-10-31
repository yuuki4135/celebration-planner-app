import * as React from 'react'
import { Top } from './components/pages/top'
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";

export const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Top/>} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
