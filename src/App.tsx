import * as React from 'react'
import { Top } from './components/pages/top'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Helmet } from 'react-helmet-async'
import { settingAnalytics } from './lib/firebase'

export const App = () => {
  React.useEffect(() => {
    if(process.env.NODE_ENV === 'production') settingAnalytics()
  }, [])

  return (
    <>
      <Helmet>
        <title>お祝い事プランナー</title>
      </Helmet>
      <div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Top/>} />
            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  )
}

export default App
