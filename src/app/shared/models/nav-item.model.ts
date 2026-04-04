export interface NavItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendColor?: string;
}
