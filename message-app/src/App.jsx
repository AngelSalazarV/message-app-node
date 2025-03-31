import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import {Login} from "./pages/Login.jsx"
import {Home} from "./pages/Home.jsx"
import PrivateRoute from "./components/PrivateRoute/PrivateRoute.jsx"
import injectContext from "./context/AppContext.jsx"
import { GlobalProvider } from "./context/GlobalContext.jsx"

function App() {
  return (
    <GlobalProvider> {/* Envuelve toda la aplicación con el GlobalProvider */}
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        </Routes>
      </Router>
    </GlobalProvider>
  );
}

export default injectContext(App)