import { ComplaintStatus } from '../../contexts/ComplaintContext';
import { Badge } from '../ui/badge';

interface StatusBadgeProps {
  status: ComplaintStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getVariant = () => {
    switch (status) {
      case 'Resolved':
        return 'default'; // Success green usually
      case 'Approved':
        return 'secondary'; // Info blue
      case 'Pending':
        return 'secondary'; // Warning yellow
      case 'Rejected by Coordinator':
      case 'Rejected by Staff':
        return 'destructive';
      case 'Unresolved':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getColorClass = () => {
      switch (status) {
        case 'Resolved':
          return 'bg-green-500 hover:bg-green-600 text-white';
        case 'Approved':
          return 'bg-blue-500 hover:bg-blue-600 text-white';
        case 'Pending':
          return 'bg-yellow-500 hover:bg-yellow-600 text-white';
        default:
          return '';
      }
  };

  return (
    <Badge variant={getVariant() as any} className={getColorClass()}>
      {status}
    </Badge>
  );
};
