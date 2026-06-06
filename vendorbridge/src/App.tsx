import { AppRouter } from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
