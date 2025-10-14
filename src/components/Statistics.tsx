// مكون الإحصائيات
import { CheckCircle2, Clock, AlertCircle, Snowflake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import type { Task } from '@/types';

interface StatisticsProps {
  tasks: Task[];
}

export function Statistics({ tasks }: StatisticsProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const workingTasks = tasks.filter(t => t.status === 'working').length;
  const waitingTasks = tasks.filter(t => t.status === 'waiting').length;
  const frozenTasks = tasks.filter(t => t.status === 'frozen').length;
  
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const stats = [
    {
      title: 'مكتملة',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-[hsl(var(--status-completed))]',
      bgColor: 'bg-[hsl(var(--status-completed))]/10',
    },
    {
      title: 'قيد العمل',
      value: workingTasks,
      icon: Clock,
      color: 'text-[hsl(var(--status-working))]',
      bgColor: 'bg-[hsl(var(--status-working))]/10',
    },
    {
      title: 'بانتظار',
      value: waitingTasks,
      icon: AlertCircle,
      color: 'text-[hsl(var(--status-waiting))]',
      bgColor: 'bg-[hsl(var(--status-waiting))]/10',
    },
    {
      title: 'مجمّد',
      value: frozenTasks,
      icon: Snowflake,
      color: 'text-[hsl(var(--status-frozen))]',
      bgColor: 'bg-[hsl(var(--status-frozen))]/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={stat.bgColor}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {totalTasks > 0 ? `${Math.round((stat.value / totalTasks) * 100)}%` : '0%'} من المجموع
              </p>
            </CardContent>
          </Card>
        );
      })}
      
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">نسبة الإنجاز</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{completionPercentage}%</div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedTasks} من {totalTasks} مهمة
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
