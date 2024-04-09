import '../styles/App.css';
import Button from 'react-bootstrap/Button'
import Signin from './Signin.jsx'
import Signup from './Signup.jsx'
import MainPage from './MainPage.jsx';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'

function App() {
    return (
        <>
        <Router>
            <Routes>
                <Route path="/signin" Component={Signin} />
                <Route path="/signup" Component={Signup} />
                <Route path="/main" Component={MainPage} />
            </Routes>
        </Router>
        </>
    );
}

export default App;