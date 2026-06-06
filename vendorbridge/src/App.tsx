import { AppRouter } from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
