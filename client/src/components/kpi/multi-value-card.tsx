import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ValueItem {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  highlight?: boolean;
}

interface MultiValueCardProps {
  title: string;
  values: ValueItem[];
}

export function MultiValueCard({ title, values }: MultiValueCardProps) {
  return (
    <Card className="w-full" data-testid="kpi-multi-value-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {values.map((item, index) => (
          <div key={index}>
            {index > 0 && <Separator className="mb-3" />}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {item.label}
              </div>
              <div 
                className={`text-2xl font-bold ${item.highlight ? 'text-primary' : ''}`}
                data-testid={`value-${index}`}
              >
                {item.prefix}{item.value}{item.suffix}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
