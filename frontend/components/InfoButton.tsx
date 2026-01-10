"use client";

import React from 'react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

function InfoButton({content}: {content: string}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-default" />
      </TooltipTrigger>
      <TooltipContent>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export default InfoButton