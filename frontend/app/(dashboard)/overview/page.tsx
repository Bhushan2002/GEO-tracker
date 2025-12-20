import { BrandTable } from "@/components/BrandTable";
import { ModelResponsesTable } from "@/components/ModelResponsesTable";
import { PromptTable } from "@/components/PromptTable";
import { VisibilityChart } from "@/components/VisibilityChart";
import { Separator } from "@radix-ui/react-separator";
import React from "react";

export default function Overview() {
  return (
    <div>
      <div className="flex flex-col">
        <div className=" flex flex-row space-x-20">
          {/* chart */}
          <div className="h-100 w-150 ">
            <VisibilityChart />
          </div>
          {/* brand table */}
          <div className="h-100 w-100 bg-gray-50 pl-3 pr-3 mt-5 ml-5 rounded-4xl ">
            <span className="font-bold text-gray-800 pb-2">Brand</span>

            <Separator className="my-4 "/>
            <BrandTable />
          </div>
        </div>

        <div className="h-100 w-300 pt-7">

          <ModelResponsesTable/>
        </div>
      </div>
    </div>
  );
}
