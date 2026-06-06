import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  vendors: 'Vendors',
  rfqs: 'RFQs',
  quotations: 'Quotations',
  approvals: 'Approvals',
  'purchase-orders': 'Purchase Orders',
  invoices: 'Invoices',
  reports: 'Reports & Analytics',
  'activity-logs': 'Activity Logs',
  create: 'Create',
  compare: 'Compare',
};

export function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {paths.map((path, i) => {
        const isLast = i === paths.length - 1;
        const href = '/' + paths.slice(0, i + 1).join('/');
        const name = routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1);
        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="text-foreground font-medium">{name}</span>
            ) : (
              <Link to={href} className="text-muted-foreground hover:text-foreground transition-colors">
                {name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
