import * as React from 'react'
import { Top } from './components/pages/top'
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { Profile } from './components/pages/profile';
import { Login } from './components/pages/login';
import Navbar  from './components/templates/navbar';

export const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/login">Login</Link>
        <Routes>
          <Route path="/" element={<Top/>} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
