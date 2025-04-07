import viteLogo from '../src/assets/bamptee.jpg'
import './App.css'
import { Toolbar } from './components/Toolbar'

function App() {

  return (
    <>
      <div>
        <Toolbar /> 
        <a target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
    </>
  )
}

export default App
