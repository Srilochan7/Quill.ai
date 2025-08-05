import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import PdfHeroSection from './components/Hero'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <PdfHeroSection/>
    </>
  )
}

export default App
