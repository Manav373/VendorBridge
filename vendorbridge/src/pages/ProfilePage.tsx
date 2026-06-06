import { useAuth } from '../context/AuthContext';
import { User, Mail, Briefcase, Building, BadgeCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center border-4 border-background shadow-lg">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={40} className="text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
            <div className="flex items-center space-x-2 mt-1 text-muted-foreground">
              <Mail size={16} />
              <span>{user.email}</span>
              {user.isVerified && (
                <BadgeCheck size={16} className="text-green-500 ml-2" />
              )}
            </div>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium capitalize">
            {user.role}
          </div>
        </div>

        <div className="border-t border-border px-8 py-6 bg-muted/30">
          <h3 className="text-lg font-semibold mb-4">Professional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="bg-card p-2 rounded-lg border border-border">
                <Briefcase size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Department</p>
                <p className="font-semibold mt-0.5">{user.department || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-card p-2 rounded-lg border border-border">
                <Building size={20} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Company</p>
                <p className="font-semibold mt-0.5">{user.company || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
