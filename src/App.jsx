import React from 'react'
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div style={{
            height: '100vh',
            background: 'black',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            HOME OK
          </div>
        }
      />
    </Routes>
  )
}