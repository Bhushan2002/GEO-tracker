import { BrandTable } from "@/components/BrandTable";
import DomainTable from "@/components/domain-table";
import { ModelResponsesTable } from "@/components/ModelResponsesTable";
import PieChartComponent from "@/components/pieChart";
import { PromptTable } from "@/components/PromptTable";
import { VisibilityChart } from "@/components/VisibilityChart";
import { Separator } from "@radix-ui/react-separator";
import React from "react";


const data = [
  { name: "ChatGPT", value: 40 },
  { name: "Claude", value: 25 },
  { name: "Gemini", value: 20 },
  { name: "Others", value: 15 },
];

export default function Overview() {
  return (
    <div>
      <div className="flex flex-col">
        <div className=" flex flex-row ">
          {/* chart */}
          <div className="h-100 w-150 ">
            <VisibilityChart />
          </div>
          {/* brand table */}
          <div className="ml-3 pt-3  rounded-xl border bg-white shadow">
            <span className="font-medium text-gray-800  ml-5 mt-2">Brand</span>
            <Separator className="my-5"/>
            <hr />
            <BrandTable />
          </div>
        </div>

        <div className=" flex flex-row mt-4 space-x-4">
          {/* pie chart */}
          <div className="bg-white border rounded-2xl pt-4 w-150 h-100">
            
            <PieChartComponent data={data} />

          </div>
          {/* domain tables */}
          <div className=" ">
            <DomainTable/>
          </div>
        </div>

        <div className="h-100 w-310 pt-7">
          <ModelResponsesTable/>
        </div>
      </div>
    </div>
  );
}
