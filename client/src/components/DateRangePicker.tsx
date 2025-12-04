import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

type DatePreset = "today" | "7d" | "mtd" | "qtd" | "ytd" | "custom";

interface DateRangePickerProps {
  onRangeChange?: (from: Date, to: Date, preset: DatePreset) => void;
}

export default function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<DatePreset>("7d");
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const presets: { label: string; value: DatePreset }[] = [
    { label: "Today", value: "today" },
    { label: "7 Days", value: "7d" },
    { label: "MTD", value: "mtd" },
    { label: "QTD", value: "qtd" },
    { label: "YTD", value: "ytd" },
    { label: "Custom", value: "custom" },
  ];

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === "custom") {
      setActivePreset(preset);
      setIsOpen(true);
      return;
    }

    setActivePreset(preset);
    const to = new Date();
    let from = new Date();

    switch (preset) {
      case "today":
        from = new Date();
        break;
      case "7d":
        from.setDate(to.getDate() - 7);
        break;
      case "mtd":
        from = new Date(to.getFullYear(), to.getMonth(), 1);
        break;
      case "qtd":
        const quarter = Math.floor(to.getMonth() / 3);
        from = new Date(to.getFullYear(), quarter * 3, 1);
        break;
      case "ytd":
        from = new Date(to.getFullYear(), 0, 1);
        break;
    }

    onRangeChange?.(from, to, preset);
    console.log(`Date range changed: ${preset}`, { from, to });
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    
    if (range?.from && range?.to) {
      setActivePreset("custom");
      onRangeChange?.(range.from, range.to, "custom");
      console.log('Date range changed: custom', { from: range.from, to: range.to });
      setIsOpen(false);
    }
  };

  const getCustomLabel = () => {
    if (activePreset === "custom" && customRange?.from && customRange?.to) {
      return `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}`;
    }
    return "Custom";
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.filter(p => p.value !== "custom").map((preset) => (
        <Button
          key={preset.value}
          variant={activePreset === preset.value ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(preset.value)}
          data-testid={`button-date-${preset.value}`}
        >
          {preset.label}
        </Button>
      ))}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={activePreset === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setIsOpen(true)}
            data-testid="button-date-custom"
          >
            <CalendarIcon className="w-3 h-3 mr-1" />
            {getCustomLabel()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={customRange}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
            defaultMonth={customRange?.from}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
