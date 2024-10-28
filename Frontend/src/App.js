import './App.css';
import { BrowserRouter } from 'react-router-dom';
import AllRoutes from './AllRoutes';

function App() {
  return (
    <div className="App">
      {/* <h1 className='text-blue-500 text-5xl text-center items-center'>SWACHHSTATIONS</h1> */}
      <div style={{ height: '100%' }}>
        <BrowserRouter data-TestId="child">
          <AllRoutes data-TestId="semi-child" />
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
