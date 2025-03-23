'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExportDialogProps {
  onExport: (format: string, month: number | undefined, year: number) => void;
  disabled?: boolean;
}

export default function ExportDialog({ onExport, disabled }: ExportDialogProps) {
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [format, setFormat] = useState('xlsx');

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          Export Timesheet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Timesheet</DialogTitle>
          <DialogDescription>
            Select format, month, and year to export your timesheet
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">XLSX (Full Year or Month)</SelectItem>
                <SelectItem value="csv">CSV (Single Month)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {format === 'csv' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="month" className="text-right">
                Month
              </Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onExport(format, format === 'csv' ? parseInt(month) : undefined, parseInt(year))}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}