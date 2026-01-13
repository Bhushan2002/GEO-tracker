"use client"
import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { format } from 'date-fns'

interface RangeCalendarProps {
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void
}

export function RangeCalendar({ dateRange, setDateRange }: RangeCalendarProps) {
    const [open, setOpen] = useState(false);
    const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange);

    // Reset temp state when popover opens
    useEffect(() => {
        if (open) {
            setTempDateRange(dateRange);
        }
    }, [open, dateRange]);

    const handleApply = () => {
        setDateRange(tempDateRange);
        setOpen(false);
    };

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="w-50 justify-between font-normal p-5"
                    >
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd,y")}-{" "}
                                    {format(dateRange.to, "LLL dd,y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd,y")
                            )
                        ) : (
                            <span>Pick date range</span>
                        )}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={tempDateRange}
                        onSelect={setTempDateRange}
                        numberOfMonths={2}
                        className="rounded-lg border shadow-sm"
                    />
                    <div className="p-3 border-t bg-slate-50">
                        <Button
                            className="w-full bg-slate-900 text-white hover:bg-slate-800"
                            onClick={handleApply}
                            disabled={!tempDateRange?.from || !tempDateRange?.to}
                        >
                            Update Range
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
