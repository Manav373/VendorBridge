import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Bell, Shield, Key } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences.</p>
      </div>
      
      <div className="grid gap-6">
        {/* Appearance Settings */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {theme === 'dark' ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-orange-500" />}
              Appearance
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Toggle between light and dark mode.</p>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell size={20} className="text-blue-500" />
              Notifications
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive emails for important updates and alerts.</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-primary/20">
                <input type="checkbox" className="peer sr-only" id="email-notif" defaultChecked />
                <label
                  htmlFor="email-notif"
                  className="absolute cursor-pointer w-6 h-6 bg-primary rounded-full transition-all peer-checked:translate-x-6"
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive push notifications in your browser.</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-primary/20">
                <input type="checkbox" className="peer sr-only" id="push-notif" />
                <label
                  htmlFor="push-notif"
                  className="absolute cursor-pointer w-6 h-6 bg-muted-foreground rounded-full transition-all peer-checked:translate-x-6 peer-checked:bg-primary"
                ></label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield size={20} className="text-red-500" />
              Security
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-lg">
                  <Key size={20} />
                </div>
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Change your current password.</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
