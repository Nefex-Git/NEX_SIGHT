import { useQuery } from "@tanstack/react-query";
import { BigNumber } from "@/components/kpi/big-number";
import { BigNumberTrendline } from "@/components/kpi/big-number-trendline";
import { GaugeChart } from "@/components/kpi/gauge-chart";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface KPI {
  id: string;
  question: string;
  value: string;
  unit?: string;
  changePercent?: string;
  createdAt: string;
}

export default function KPIDashboard() {
  const { data: kpis, isLoading } = useQuery<KPI[]>({
    queryKey: ['/api/kpis'],
  });

  // Generate sample trend data for demonstration
  const generateTrendData = (baseValue: number) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      data.push({
        value: baseValue * (0.8 + Math.random() * 0.4),
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
    }
    return data;
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/kpis'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading KPIs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">KPI Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Apache Superset-style key performance indicators
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              data-testid="button-refresh-kpis"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" data-testid="button-create-kpi">
              <Plus className="h-4 w-4 mr-2" />
              Create KPI
            </Button>
          </div>
        </div>

        {/* KPIs Grid */}
        {!kpis || kpis.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No KPIs created yet. Ask a question in the chat to create your first KPI.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => {
              const numericValue = parseFloat(kpi.value) || 0;
              const changePercent = parseFloat(kpi.changePercent || '0');
              const previousValue = numericValue / (1 + changePercent / 100);
              
              // Rotate through different KPI visualization types for demonstration
              const visualizationType = index % 3;
              
              if (visualizationType === 0) {
                // Big Number
                return (
                  <BigNumber
                    key={kpi.id}
                    title={kpi.question}
                    value={numericValue}
                    suffix={kpi.unit ? ` ${kpi.unit}` : ''}
                    previousValue={previousValue}
                    showComparison={!!kpi.changePercent}
                    comparisonType="percentage"
                    colorThresholds={{
                      good: numericValue * 0.9,
                      warning: numericValue * 0.7,
                      bad: numericValue * 0.5
                    }}
                  />
                );
              } else if (visualizationType === 1) {
                // Big Number with Trendline
                return (
                  <BigNumberTrendline
                    key={kpi.id}
                    title={kpi.question}
                    value={numericValue}
                    trendData={generateTrendData(numericValue)}
                    suffix={kpi.unit ? ` ${kpi.unit}` : ''}
                    showComparison={!!kpi.changePercent}
                    comparisonPeriod="vs. last 7 days"
                  />
                );
              } else {
                // Gauge Chart
                const target = numericValue * 1.2; // Target is 120% of current value
                return (
                  <GaugeChart
                    key={kpi.id}
                    title={kpi.question}
                    value={numericValue}
                    target={target}
                    unit={kpi.unit || ''}
                    showPercentage={true}
                    thresholds={{
                      good: 80,
                      warning: 50
                    }}
                  />
                );
              }
            })}
          </div>
        )}

        {/* Example KPIs Section */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold">Example KPI Visualizations</h2>
          <p className="text-muted-foreground">
            These are examples of the different KPI types available in Apache Superset style
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Big Number Example */}
            <BigNumber
              title="Total Revenue"
              value={1250000}
              format="currency"
              previousValue={1100000}
              showComparison={true}
              comparisonType="percentage"
              subheader="vs. last month"
              colorThresholds={{
                good: 1200000,
                warning: 1000000,
                bad: 900000
              }}
            />
            
            {/* Big Number with Trendline Example */}
            <BigNumberTrendline
              title="Active Users"
              value={45823}
              trendData={[
                { value: 42000, date: '2024-01-01' },
                { value: 43200, date: '2024-01-02' },
                { value: 44100, date: '2024-01-03' },
                { value: 44800, date: '2024-01-04' },
                { value: 45200, date: '2024-01-05' },
                { value: 45500, date: '2024-01-06' },
                { value: 45823, date: '2024-01-07' },
              ]}
              format="number"
              showComparison={true}
              comparisonPeriod="vs. last week"
              trendColor="#10b981"
            />
            
            {/* Gauge Chart Example */}
            <GaugeChart
              title="Sales Target Progress"
              value={850000}
              target={1000000}
              unit=" USD"
              showPercentage={true}
              thresholds={{
                good: 80,
                warning: 50
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
