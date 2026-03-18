import React from 'react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  features,
  color,
  onClick
}) => {
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      text: 'text-blue-700',
      featureBg: 'bg-blue-100',
      featureText: 'text-blue-700',
      hover: 'hover:shadow-md hover:translate-x-1'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      text: 'text-green-700',
      featureBg: 'bg-green-100',
      featureText: 'text-green-700',
      hover: 'hover:shadow-md hover:translate-x-1'
    },
    orange: {
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      text: 'text-orange-700',
      featureBg: 'bg-orange-100',
      featureText: 'text-orange-700',
      hover: 'hover:shadow-md hover:translate-x-1'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      text: 'text-red-700',
      featureBg: 'bg-red-100',
      featureText: 'text-red-700',
      hover: 'hover:shadow-md hover:translate-x-1'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      text: 'text-purple-700',
      featureBg: 'bg-purple-100',
      featureText: 'text-purple-700',
      hover: 'hover:shadow-md hover:translate-x-1'
    },
    gray: {
      bg: 'bg-gray-50',
      iconBg: 'bg-gray-100',
      text: 'text-gray-700',
      featureBg: 'bg-gray-100',
      featureText: 'text-gray-700',
      hover: 'hover:shadow-md hover:translate-x-1'
    }
  };

  const config = colorConfig[color];

  return (
    <div
      onClick={onClick}
      className={`p-6 bg-white rounded-xl border border-gray-200 cursor-pointer transition-all duration-300 ${config.hover}`}
    >
      <div className="flex items-center mb-4">
        <div className={`w-12 h-12 rounded-lg ${config.iconBg} flex items-center justify-center mr-3`}>
          {icon}
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${config.text} mb-1`}>
            {title}
          </h3>
          <p className="text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>
      
      <p className="text-gray-700 leading-relaxed mb-4">
        {description}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {features.map((feature, index) => (
          <span
            key={index}
            className={`text-xs font-medium px-3 py-1 rounded-md ${config.featureBg} ${config.featureText}`}
          >
            ✓ {feature}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DashboardCard;
