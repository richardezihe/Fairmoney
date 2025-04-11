import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  subTitle?: string;
  subValue?: string | number;
  link?: {
    text: string;
    onClick: () => void;
  };
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  subTitle,
  subValue,
  link
}: StatCardProps) {
  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`${iconBgColor} p-3 rounded-full`}>
            {icon}
          </div>
        </div>
        
        {(subTitle || subValue) && (
          <div className="mt-2 text-xs text-gray-500">
            {subTitle && <span>{subTitle} </span>}
            {subValue && <span className="font-medium">{subValue}</span>}
          </div>
        )}
        
        {link && (
          <div className="mt-2">
            <button 
              onClick={link.onClick}
              className="text-xs text-primary-600 dark:text-primary-400 cursor-pointer hover:underline"
            >
              {link.text}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
