import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartId: string;
  chartTitle: string;
}

export function DrillDownModal({
  isOpen,
  onClose,
  chartId,
  chartTitle,
}: DrillDownModalProps) {
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useQuery<{ data: any[]; query: string; chartTitle: string }>({
    queryKey: ["/api/charts", chartId, "drill-down"],
    queryFn: async () => {
      const response = await fetch(`/api/charts/${chartId}/drill-down`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch data" }));
        throw new Error(errorData.message || "Failed to fetch data");
      }
      return response.json();
    },
    enabled: isOpen,
  });

  const handleExportCSV = () => {
    if (!data?.data || data.data.length === 0) {
      toast({
        title: "No data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data.data[0]);
    const csvContent = [
      headers.join(","),
      ...data.data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${chartTitle.replace(/\s+/g, "_")}_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Data exported successfully",
    });
  };

  const columns = data?.data && data.data.length > 0 ? Object.keys(data.data[0]) : [];
  const rows = data?.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{chartTitle} - Data View</DialogTitle>
          <DialogDescription>
            {data?.query && `Query: ${data.query}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-destructive">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-2">{error?.message || "Failed to fetch chart data"}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No data available
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                data-testid="button-export-csv"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV ({rows.length} rows)
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col}>{row[col]?.toString() || "-"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
